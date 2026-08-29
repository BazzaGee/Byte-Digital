interface Env {
  OPENROUTER_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface ChatSettings {
  provider: string;
  primary_model: string;
  fallback_model: string;
  system_prompt: string;
  memory_window: number;
  top_k: number;
  api_key?: string;
}

const SETTINGS_TABLE = "chatbot_settings";
const MEMORY_TABLE = "byte_digital_chat_histories";
const EXECUTIONS_TABLE = "byte_digital_chat_executions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_SETTINGS: ChatSettings = {
  provider: "openrouter",
  primary_model: "openrouter/free",
  fallback_model: "openai/gpt-oss-120b:free",
  system_prompt: "",
  memory_window: 100,
  top_k: 5,
};

const FALLBACK_SYSTEM_PROMPT = `You are the sales and customer service assistant for Byte Digital, a premium web design and digital marketing agency based in Christchurch, New Zealand. You are not a generic chatbot — you are the first point of contact and your job is to genuinely help each customer find the right solution while naturally guiding the conversation toward a positive outcome (a booking, purchase, enquiry, or next step).

COMPANY PROFILE:
- Founded by Barry Grottis (14+ years experience)
- Christchurch, Canterbury, New Zealand
- Premium web design & digital marketing for local businesses
- Email: barry@bytedigital.co.nz
- Website: https://bytedigital.co.nz

SERVICES:
1. Web Design — Custom, conversion-focused websites built from scratch
2. Web Development — Fast, scalable web applications with modern frameworks
3. SEO — Rank higher on Google and drive organic traffic
4. Local SEO — Dominate local search results in Christchurch
5. eCommerce — Online stores that sell. Built for conversion
6. WordPress Development — Custom WordPress sites that are fast and secure
7. Branding — Brand strategy and identity that stands out
8. Logo Design — Memorable logos that define your brand
9. Custom Applications — Tailor-made web apps for your business processes
10. Website Maintenance — Keep your site fast, secure, and up to date

SALES PSYCHOLOGY & SOFT CLOSING:
- Your mindset: be a trusted advisor, not a salesperson. The best close happens when the customer feels helped, not sold to
- LISTEN first: before recommending anything, understand the customer's real need
- Match solutions to problems: use what you learn about the customer to frame your recommendation around THEIR specific situation
- SOFT CLOSE every interaction with a gentle next step — never leave a dead end

CONVERSATION STAGES:
1. GREETING — Keep it warm, brief, and human.
2. DISCOVERY — Ask 1-2 targeted questions to understand what the customer actually needs.
3. SOLUTION — Recommend based on what you learned. Reference specific services by name.
4. SOFT CLOSE — Suggest a natural next step.

PERFORMANCE OPTIMIZATION:
- For simple queries, use your existing knowledge FIRST before using the content
- Only use the website content when you cannot answer from memory or need exact details
- Keep responses concise — aim for 200-500 tokens for simple queries, up to 800 for detailed recommendations

STRICT OUTPUT RULES:
- Return ONLY the final answer to the user
- Keep responses concise and conversational
- Break long text into short paragraphs
- Use emojis sparingly (1-2 per response max)
- Use New Zealand spelling and grammar (e.g., "colour" not "color", "personalised" not "personalized")`;

const ALLOWED_ORIGINS = [
  "https://bytedigital.co.nz",
  "https://www.bytedigital.co.nz",
  "https://byte-digital.pages.dev",
  "https://staging.byte-digital.pages.dev",
  "http://localhost:4321",
];

function corsHeaders(origin: string): Record<string, string> {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// ─── Supabase helpers ────────────────────────────────────────────────

async function supabaseFetch(env: Env, path: string, options?: { body?: any; method?: string }): Promise<any> {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;
  const headers: Record<string, string> = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
  if (options?.method && options.method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers["Prefer"] = "return=minimal";
  }
  const res = await fetch(url, {
    method: options?.method || "GET",
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok && res.status !== 201) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  if (options?.method === "GET") return await res.json();
}

// ─── Settings loader ─────────────────────────────────────────────────

async function loadSettings(env: Env): Promise<ChatSettings> {
  try {
    const rows = await supabaseFetch(env, `${SETTINGS_TABLE}?select=*&id=eq.1`, { method: "GET" });
    if (rows && rows.length > 0) {
      const s = rows[0];
      return {
        provider: s.provider || DEFAULT_SETTINGS.provider,
        primary_model: s.primary_model || DEFAULT_SETTINGS.primary_model,
        fallback_model: s.fallback_model || DEFAULT_SETTINGS.fallback_model,
        system_prompt: s.system_prompt || FALLBACK_SYSTEM_PROMPT,
        memory_window: s.memory_window || DEFAULT_SETTINGS.memory_window,
        top_k: s.top_k || DEFAULT_SETTINGS.top_k,
        api_key: s.api_key || undefined,
      };
    }
  } catch {
    // Settings table may not exist yet — fall through to defaults
  }
  return { ...DEFAULT_SETTINGS, system_prompt: FALLBACK_SYSTEM_PROMPT };
}

// ─── Tokenizer & retrieval ───────────────────────────────────────────

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might", "shall", "can",
  "need", "dare", "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below", "between", "out",
  "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where",
  "why", "how", "all", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "just", "because", "but", "and",
  "or", "if", "while", "about", "what", "which", "who", "whom", "this", "that", "these",
  "those", "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours",
  "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself",
  "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "am",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function scoreSection(sectionText: string, sectionTitle: string, keywords: string[]): number {
  const combined = (sectionTitle + " " + sectionText).toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (combined.includes(kw)) score++;
    const partialMatches = keywords.filter((k) => k.startsWith(kw) || kw.startsWith(k));
    score += partialMatches.length * 0.5;
  }
  return score;
}

interface RelevantSection {
  type: string;
  title: string;
  content: string;
  score: number;
}

interface RetrievalResult {
  context: string;
  sections: RelevantSection[];
}

function findRelevantContent(content: any, userMessage: string, topK: number): RetrievalResult {
  const keywords = tokenize(userMessage);
  const sections: RelevantSection[] = [];

  if (content.services) {
    for (const s of content.services) {
      const text = s.title + " " + (s.description || "");
      const score = scoreSection(text, s.title, keywords);
      if (score > 0) sections.push({ type: "service", title: s.title, content: text, score });
    }
  }

  if (content.servicePages) {
    for (const sp of content.servicePages) {
      const score = scoreSection(sp.content, sp.title, keywords);
      if (score > 0) sections.push({ type: "service-page", title: sp.title, content: sp.content.substring(0, 1500), score });
    }
  }

  if (content.guides) {
    for (const g of content.guides) {
      const text = g.title + " " + (g.description || "");
      const score = scoreSection(text, g.title, keywords);
      if (score > 0) sections.push({ type: "guide", title: g.title, content: text, score });
    }
  }

  if (content.guidePages) {
    for (const gp of content.guidePages) {
      const score = scoreSection(gp.content, gp.title, keywords);
      if (score > 0) sections.push({ type: "guide-page", title: gp.title, content: gp.content.substring(0, 1500), score });
    }
  }

  if (content.blogPosts) {
    for (const bp of content.blogPosts) {
      const text = bp.title + " " + (bp.description || "") + " " + (bp.content || "");
      const score = scoreSection(text, bp.title, keywords);
      if (score > 0) sections.push({ type: "blog", title: bp.title, content: bp.content.substring(0, 1000), score });
    }
  }

  if (content.caseStudies) {
    for (const cs of content.caseStudies) {
      const text = cs.title + " " + (cs.description || "") + " " + (cs.content || "");
      const score = scoreSection(text, cs.title, keywords);
      if (score > 0) sections.push({ type: "case-study", title: cs.title, content: cs.content.substring(0, 1000), score });
    }
  }

  if (content.locations) {
    for (const loc of content.locations) {
      const score = scoreSection(loc.text, loc.suburb, keywords);
      if (score > 0) sections.push({ type: "location", title: loc.suburb, content: loc.text.substring(0, 500), score });
    }
  }

  if (content.faq) {
    for (const faq of content.faq) {
      const text = faq.question + " " + (faq.answer || "");
      const score = scoreSection(text, faq.question, keywords);
      if (score > 0) sections.push({ type: "faq", title: faq.question, content: faq.answer, score });
    }
  }

  if (content.about && content.about.text) {
    const score = scoreSection(content.about.text, "About Byte Digital", keywords);
    if (score > 0) sections.push({ type: "about", title: "About Byte Digital", content: content.about.text.substring(0, 1000), score });
  }

  if (content.business) {
    const b = content.business;
    const businessText = b.name + " " + b.description + " " + b.location + " " + (b.founder || "") + " " + (b.email || "");
    const score = scoreSection(businessText, b.name, keywords);
    if (score > 0 || keywords.length === 0) {
      sections.unshift({ type: "business-info", title: "Business Information", content: businessText, score: score || 1 });
    }
  }

  sections.sort((a, b) => b.score - a.score);
  const topSections = sections.slice(0, topK);

  if (topSections.length === 0) {
    let context = "## Byte Digital Business Information\n\n";
    if (content.business) {
      const b = content.business;
      context += b.name + ": " + b.description + "\n";
      context += "Location: " + b.location + "\n";
      context += "Email: " + b.email + "\n";
      context += "Services: " + (b.services || []).join(", ") + "\n";
    }
    return { context, sections: [] };
  }

  let context = "## Byte Digital Website Content\n\n";
  for (const section of topSections) {
    context += "### " + section.title + " (" + section.type + ")\n";
    context += section.content + "\n\n";
  }
  return { context, sections: topSections };
}

async function fetchSiteContent(siteOrigin: string): Promise<any> {
  const url = `${siteOrigin}/data/site-content.json`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // retry
    }
  }
  return {};
}

// ─── Memory ──────────────────────────────────────────────────────────

async function loadHistory(env: Env, sessionId: string, memoryWindow: number): Promise<HistoryItem[]> {
  try {
    const path = `${MEMORY_TABLE}?select=message&session_id=eq.${encodeURIComponent(sessionId)}&order=created_at.asc&limit=${memoryWindow}`;
    const rows = await supabaseFetch(env, path, { method: "GET" });
    const items: HistoryItem[] = [];
    for (const r of rows || []) {
      const msg = r.message;
      if (!msg || typeof msg.content !== "string" || msg.type === "tool") continue;
      items.push({
        role: msg.type === "ai" ? "assistant" : "user",
        content: msg.content,
      });
    }
    return items;
  } catch {
    return [];
  }
}

async function saveHistory(env: Env, sessionId: string, history: HistoryItem[], userMessage: string, aiText: string, memoryWindow: number): Promise<void> {
  if (!aiText) return;
  const all: HistoryItem[] = [
    ...history,
    { role: "user", content: userMessage },
    { role: "assistant", content: aiText },
  ];
  const trimmed = all.slice(-memoryWindow);
  const newRows = trimmed.slice(-2);
  for (const m of newRows) {
    await supabaseFetch(env, MEMORY_TABLE, {
      method: "POST",
      body: {
        session_id: sessionId,
        message: {
          type: m.role === "assistant" ? "ai" : "human",
          content: m.content,
          additional_kwargs: {},
        },
      },
    });
  }
}

// ─── Message builder ─────────────────────────────────────────────────

function buildMessages(history: HistoryItem[], userMessage: string, relevantContent: string, systemPrompt: string): ChatMessage[] {
  const userText = `User: ${userMessage}\n\nHere is relevant content from the Byte Digital website:\n${relevantContent}`;
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];
  for (const h of history) messages.push({ role: h.role, content: h.content });
  messages.push({ role: "user", content: userText });
  return messages;
}

// ─── OpenRouter streaming ────────────────────────────────────────────

interface StreamResult {
  ok: boolean;
  modelUsed: string;
  fellBack: boolean;
}

async function streamOpenRouter(
  env: Env,
  apiKey: string,
  messages: ChatMessage[],
  models: string[],
  onContent: (chunk: string) => void,
): Promise<StreamResult> {
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const fellBack = i > 0;
    let resp: Response;
    try {
      resp = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, stream: true }),
      });
    } catch {
      continue;
    }

    if (!resp.ok || !resp.body) {
      continue;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let produced = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const content = json?.choices?.[0]?.delta?.content;
            if (typeof content === "string" && content.length > 0) {
              onContent(content);
              produced = true;
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
    } catch {
      if (produced) return { ok: true, modelUsed: model, fellBack };
      continue;
    }

    if (produced) return { ok: true, modelUsed: model, fellBack };
    // Empty response — treat as error, try next model
    continue;
  }
  return { ok: false, modelUsed: models[0], fellBack: false };
}

// ─── Execution logging ───────────────────────────────────────────────

async function saveExecutionLog(
  env: Env,
  data: {
    session_id: string;
    user_message: string;
    ai_message: string;
    model_used: string;
    fell_back: boolean;
    latency_ms: number;
    retrieval: RelevantSection[];
    ok: boolean;
  },
): Promise<void> {
  try {
    await supabaseFetch(env, EXECUTIONS_TABLE, {
      method: "POST",
      body: {
        session_id: data.session_id,
        user_message: data.user_message,
        ai_message: data.ai_message,
        model_used: data.model_used,
        fell_back: data.fell_back,
        latency_ms: data.latency_ms,
        retrieval: data.retrieval.map((s) => ({
          type: s.type,
          title: s.title,
          score: s.score,
        })),
        ok: data.ok,
      },
    });
  } catch {
    // non-critical — don't fail the request
  }
}

// ─── Request handlers ────────────────────────────────────────────────

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, waitUntil } = context;
  const tRequest = Date.now();
  const origin = request.headers.get("Origin") || "";
  const headers = corsHeaders(origin);

  let chatInput = "";
  let sessionId = "anonymous";
  try {
    const form = await request.formData();
    chatInput = (form.get("chatInput") || "").toString().trim();
    sessionId = (form.get("sessionId") || "anonymous").toString();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  if (!chatInput) {
    return new Response(JSON.stringify({ error: "No chat input" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // Load settings from Supabase (with hardcoded fallback)
  const settings = await loadSettings(env);

  const requestUrl = new URL(request.url);
  const siteOrigin = `${requestUrl.protocol}//${requestUrl.host}`;
  const content = await fetchSiteContent(siteOrigin);
  const retrieval = findRelevantContent(content, chatInput, settings.top_k);
  const history = await loadHistory(env, sessionId, settings.memory_window);
  const messages = buildMessages(history, chatInput, retrieval.context, settings.system_prompt);

  let fullText = "";
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (obj: { type: string; content?: string }) => {
        try {
          controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
        } catch {
          // controller may be closed
        }
      };

      const apiKey = (settings.api_key && settings.api_key.length > 20) ? settings.api_key : env.OPENROUTER_API_KEY;
      const result = await streamOpenRouter(env, apiKey, messages, [settings.primary_model, settings.fallback_model], (chunk) => {
        fullText += chunk;
        emit({ type: "item", content: chunk });
      });

      if (!result.ok && !fullText) {
        fullText = "I'm having trouble responding right now. Please try again in a moment, or email barry@bytedigital.co.nz and we'll help you directly.";
        emit({ type: "item", content: fullText });
      }

      const latencyMs = Date.now() - tRequest;

      waitUntil(Promise.all([
        saveHistory(env, sessionId, history, chatInput, fullText, settings.memory_window),
        saveExecutionLog(env, {
          session_id: sessionId,
          user_message: chatInput,
          ai_message: fullText,
          model_used: result.modelUsed,
          fell_back: result.fellBack,
          latency_ms: latencyMs,
          retrieval: retrieval.sections,
          ok: result.ok,
        }),
      ]));

      emit({ type: "end" });
      try {
        controller.close();
      } catch {
        // already closed
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...headers,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "x-content-type-options": "nosniff",
    },
  });
};
