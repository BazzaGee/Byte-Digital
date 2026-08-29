interface Env {
  OPENROUTER_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const SETTINGS_TABLE = "chatbot_settings";
const MEMORY_TABLE = "byte_digital_chat_histories";
const EXECUTIONS_TABLE = "byte_digital_chat_executions";

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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function supabaseFetch(env: Env, path: string, options?: { body?: any; method?: string }): Promise<any> {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;
  const method = options?.method || "GET";
  const headers: Record<string, string> = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers["Prefer"] = "return=representation";
  }
  const res = await fetch(url, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok && res.status !== 201) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  if (method === "GET" || method === "POST" || method === "PATCH") return await res.json();
}

// ─── GET handler ─────────────────────────────────────────────────────

async function handleGet(env: Env): Promise<Response> {
  const [settingsRows, executionsRows, historyRows] = await Promise.all([
    supabaseFetch(env, `${SETTINGS_TABLE}?select=*&id=eq.1`),
    supabaseFetch(env, `${EXECUTIONS_TABLE}?select=*&order=created_at.desc&limit=200`),
    supabaseFetch(env, `${MEMORY_TABLE}?select=session_id,message,created_at&order=created_at.desc&limit=500`),
  ]);

  const settings = settingsRows?.[0] || null;
  const executions = executionsRows || [];
  const history = historyRows || [];

  // Unique sessions from history
  const uniqueSessions = new Set(history.map((r: any) => r.session_id)).size;
  const totalMessages = history.length;

  // Compute aggregate stats from executions
  const totalLatency = executions.reduce((sum: number, e: any) => sum + (e.latency_ms || 0), 0);
  const avgLatency = executions.length > 0 ? Math.round(totalLatency / executions.length) : 0;
  const fallbackCount = executions.filter((e: any) => e.fell_back).length;
  const fallbackRate = executions.length > 0 ? Math.round((fallbackCount / executions.length) * 100) : 0;
  const modelUsage: Record<string, number> = {};
  for (const e of executions) {
    const model = e.model_used || "unknown";
    modelUsage[model] = (modelUsage[model] || 0) + 1;
  }

  // Build session map: prefer execution logs, fall back to history pairs
  const sessionMap: Record<string, any[]> = {};

  // Group execution logs by session
  const execBySession: Record<string, any[]> = {};
  for (const e of executions) {
    const sid = e.session_id || "unknown";
    if (!execBySession[sid]) execBySession[sid] = [];
    execBySession[sid].push({ source: "execution", ...e });
  }

  // Build set of execution timestamps per session (2s buckets for fuzzy matching)
  const execTimestamps: Record<string, Set<number>> = {};
  for (const [sid, entries] of Object.entries(execBySession)) {
    execTimestamps[sid] = new Set();
    for (const e of entries) {
      if (e.created_at) {
        execTimestamps[sid].add(Math.floor(new Date(e.created_at).getTime() / 2000));
      }
    }
  }

  // Add all execution entries to session map first (richer data)
  for (const [sid, entries] of Object.entries(execBySession)) {
    sessionMap[sid] = [...entries];
  }

  // Group history by session
  const historyBySession: Record<string, any[]> = {};
  for (const h of history) {
    const sid = h.session_id || "unknown";
    if (!historyBySession[sid]) historyBySession[sid] = [];
    historyBySession[sid].push(h);
  }

  // Merge consecutive human+ai messages into turns, skip duplicates
  for (const [sid, msgs] of Object.entries(historyBySession)) {
    // Messages are newest-first from API; reverse for chronological
    const chronological = [...msgs].reverse();
    const turns: any[] = [];
    let i = 0;
    while (i < chronological.length) {
      const m = chronological[i];
      const msg = m.message || {};
      if (msg.type === "human") {
        const turn: any = {
          source: "history",
          user_message: msg.content,
          ai_message: null,
          model_used: null,
          fell_back: false,
          latency_ms: null,
          retrieval: [],
          created_at: m.created_at,
        };
        if (i + 1 < chronological.length) {
          const next = chronological[i + 1];
          const nextMsg = next.message || {};
          if (nextMsg.type === "ai") {
            turn.ai_message = nextMsg.content;
            turn.created_at = next.created_at;
            i += 2;
          } else {
            i += 1;
          }
        } else {
          i += 1;
        }
        // Skip if this turn duplicates an execution entry
        if (turn.created_at && execTimestamps[sid]) {
          const ts = Math.floor(new Date(turn.created_at).getTime() / 2000);
          if (execTimestamps[sid].has(ts)) continue;
        }
        turns.push(turn);
      } else if (msg.type === "ai") {
        const turn = {
          source: "history",
          user_message: null,
          ai_message: msg.content,
          model_used: null,
          fell_back: false,
          latency_ms: null,
          retrieval: [],
          created_at: m.created_at,
        };
        // Skip if this turn duplicates an execution entry
        if (turn.created_at && execTimestamps[sid]) {
          const ts = Math.floor(new Date(turn.created_at).getTime() / 2000);
          if (execTimestamps[sid].has(ts)) continue;
        }
        turns.push(turn);
        i += 1;
      } else {
        i += 1;
      }
    }
    // Only add history turns for sessions that don't already have execution entries
    if (!sessionMap[sid]) {
      sessionMap[sid] = turns;
    } else {
      // Append non-duplicate history turns to existing execution entries
      for (const turn of turns) {
        sessionMap[sid].push(turn);
      }
    }
  }

  // Sort each session by time
  for (const sid of Object.keys(sessionMap)) {
    sessionMap[sid].sort((a: any, b: any) => {
      const ta = a.created_at || "";
      const tb = b.created_at || "";
      return ta.localeCompare(tb);
    });
  }

  // Recent activity
  const lastActivity = history.length > 0 ? history[0].created_at : null;

  return Response.json({
    settings,
    stats: {
      totalMessages,
      uniqueSessions,
      totalExecutions: executions.length,
      avgLatency,
      fallbackRate,
      modelUsage,
      lastActivity,
    },
    sessions: sessionMap,
    executions,
  });
}

// ─── POST handler (update settings) ─────────────────────────────────

async function handlePost(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowedFields = ["provider", "primary_model", "fallback_model", "system_prompt", "memory_window", "top_k", "api_key"];
  const updates: Record<string, any> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Validate types
  if (updates.memory_window !== undefined) {
    updates.memory_window = Math.max(1, Math.min(200, Number(updates.memory_window) || 100));
  }
  if (updates.top_k !== undefined) {
    updates.top_k = Math.max(1, Math.min(20, Number(updates.top_k) || 5));
  }
  if (updates.primary_model !== undefined) {
    updates.primary_model = String(updates.primary_model).trim().substring(0, 100);
  }
  if (updates.fallback_model !== undefined) {
    updates.fallback_model = String(updates.fallback_model).trim().substring(0, 100);
  }
  if (updates.provider !== undefined) {
    updates.provider = String(updates.provider).trim().substring(0, 50);
  }
  if (updates.system_prompt !== undefined) {
    updates.system_prompt = String(updates.system_prompt).substring(0, 10000);
  }
  if (updates.api_key !== undefined) {
    if (String(updates.api_key).trim().length < 20) {
      delete updates.api_key;
    } else {
      updates.api_key = String(updates.api_key).trim().substring(0, 500);
    }
  }

  updates.updated_at = new Date().toISOString();

  const result = await supabaseFetch(env, `${SETTINGS_TABLE}?id=eq.1`, {
    method: "PATCH",
    body: updates,
  });

  return Response.json({ ok: true, settings: result?.[0] || updates });
}

// ─── Request handlers ────────────────────────────────────────────────

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const headers = corsHeaders(origin);

  try {
    const data = await handleGet(env);
    // Add CORS headers to the response
    const response = new Response(data.body, {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (err: any) {
    return Response.json({ error: err.message || "Internal error" }, {
      status: 500,
      headers,
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const headers = corsHeaders(origin);

  try {
    const data = await handlePost(request, env);
    return new Response(data.body, {
      status: data.status,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    return Response.json({ error: err.message || "Internal error" }, {
      status: 500,
      headers,
    });
  }
};
