import {
  workflow,
  node,
  trigger,
  expr,
  languageModel,
  memory,
} from '@n8n/workflow-sdk';

const chatTrigger = trigger({
  type: '@n8n/n8n-nodes-langchain.chatTrigger',
  version: 1.4,
  config: {
    name: 'Chat Trigger',
    parameters: {
      public: true,
      mode: 'webhook',
      options: {
        allowedOrigins: 'bytedigital.co.nz, www.bytedigital.co.nz, byte-digital.pages.dev, staging.byte-digital.pages.dev, localhost:4321',
        responseMode: 'lastNode',
        loadPreviousSession: 'memory',
      },
    },
    position: [240, 300],
    output: [{ json: { message: 'Hello, I have a question about your services' } }],
  },
});

const fetchSiteContent = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Site Content',
    parameters: {
      method: 'GET',
      url: 'https://bytedigital.co.nz/data/site-content.json',
      options: {
        response: {
          responseFormat: 'json',
        },
      },
    },
    executeOnce: true,
    position: [540, 300],
    output: [{ json: { business: { name: 'Byte Digital' }, services: [], blogPosts: [] } }],
  },
});

const findRelevantContent = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Find Relevant Content',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `const content = $('Fetch Site Content').first().json;
const userMessage = $('Chat Trigger').first().json.message || '';

const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or', 'if', 'while', 'about', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'am']);

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\\s]/g, ' ')
    .split(/\\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

const keywords = tokenize(userMessage);

function scoreSection(sectionText, sectionTitle = '') {
  const combined = (sectionTitle + ' ' + sectionText).toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (combined.includes(kw)) score++;
    const partialMatches = keywords.filter(k => k.startsWith(kw) || kw.startsWith(k));
    score += partialMatches.length * 0.5;
  }
  return score;
}

let sections = [];

if (content.services) {
  for (const s of content.services) {
    const text = s.title + ' ' + (s.description || '');
    const score = scoreSection(text, s.title);
    if (score > 0) {
      sections.push({ type: 'service', title: s.title, content: text, score });
    }
  }
}

if (content.servicePages) {
  for (const sp of content.servicePages) {
    const score = scoreSection(sp.content, sp.title);
    if (score > 0) {
      sections.push({ type: 'service-page', title: sp.title, content: sp.content.substring(0, 1500), score });
    }
  }
}

if (content.guides) {
  for (const g of content.guides) {
    const text = g.title + ' ' + (g.description || '');
    const score = scoreSection(text, g.title);
    if (score > 0) {
      sections.push({ type: 'guide', title: g.title, content: text, score });
    }
  }
}

if (content.guidePages) {
  for (const gp of content.guidePages) {
    const score = scoreSection(gp.content, gp.title);
    if (score > 0) {
      sections.push({ type: 'guide-page', title: gp.title, content: gp.content.substring(0, 1500), score });
    }
  }
}

if (content.blogPosts) {
  for (const bp of content.blogPosts) {
    const text = bp.title + ' ' + (bp.description || '') + ' ' + (bp.content || '');
    const score = scoreSection(text, bp.title);
    if (score > 0) {
      sections.push({ type: 'blog', title: bp.title, content: bp.content.substring(0, 1000), score });
    }
  }
}

if (content.caseStudies) {
  for (const cs of content.caseStudies) {
    const text = cs.title + ' ' + (cs.description || '') + ' ' + (cs.content || '');
    const score = scoreSection(text, cs.title);
    if (score > 0) {
      sections.push({ type: 'case-study', title: cs.title, content: cs.content.substring(0, 1000), score });
    }
  }
}

if (content.locations) {
  for (const loc of content.locations) {
    const score = scoreSection(loc.text, loc.suburb);
    if (score > 0) {
      sections.push({ type: 'location', title: loc.suburb, content: loc.text.substring(0, 500), score });
    }
  }
}

if (content.faq) {
  for (const faq of content.faq) {
    const text = faq.question + ' ' + (faq.answer || '');
    const score = scoreSection(text, faq.question);
    if (score > 0) {
      sections.push({ type: 'faq', title: faq.question, content: faq.answer, score });
    }
  }
}

if (content.about && content.about.text) {
  const score = scoreSection(content.about.text, 'About Byte Digital');
  if (score > 0) {
    sections.push({ type: 'about', title: 'About Byte Digital', content: content.about.text.substring(0, 1000), score });
  }
}

if (content.business) {
  const b = content.business;
  const businessText = b.name + ' ' + b.description + ' ' + b.location + ' ' + (b.founder || '') + ' ' + (b.email || '');
  const score = scoreSection(businessText, b.name);
  if (score > 0 || keywords.length === 0) {
    sections.unshift({ type: 'business-info', title: 'Business Information', content: businessText, score: score || 1 });
  }
}

sections.sort((a, b) => b.score - a.score);

const topSections = sections.slice(0, 5);

let context = '## Byte Digital Website Content\\n\\n';
for (const section of topSections) {
  context += '### ' + section.title + ' (' + section.type + ')\\n';
  context += section.content + '\\n\\n';
}

if (topSections.length === 0) {
  context = '## Byte Digital Business Information\\n\\n';
  if (content.business) {
    const b = content.business;
    context += b.name + ': ' + b.description + '\\n';
    context += 'Location: ' + b.location + '\\n';
    context += 'Email: ' + b.email + '\\n';
    context += 'Services: ' + (b.services || []).join(', ') + '\\n';
  }
}

return [{
  json: {
    relevantContent: context,
    userMessage: userMessage,
    matchedSections: topSections.length,
  }
}];`,
    },
    position: [840, 300],
    output: [{ json: { relevantContent: '## Content\\n\\n### Web Design\\nCustom websites...', userMessage: 'Hello', matchedSections: 3 } }],
  },
});

const openAiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'OpenAI Model',
    parameters: {
      model: { __rl: true, mode: 'list', value: 'gpt-5-mini' },
    },
    credentials: { openAiApi: newCredential('OpenAI') },
    position: [840, 500],
  },
});

const postgresMemory = memory({
  type: '@n8n/n8n-nodes-langchain.memoryPostgresChat',
  version: 1.4,
  config: {
    name: 'Postgres Chat Memory',
    parameters: {
      sessionIdType: 'fromInput',
      tableName: 'n8n_chat_histories',
      contextWindowLength: 10,
    },
    credentials: { postgres: newCredential('Postgres') },
  },
});

const aiAgent = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Byte Digital AI Assistant',
    parameters: {
      promptType: 'define',
      text: expr('You are a helpful AI assistant for Byte Digital, a Christchurch-based web design and digital marketing agency.\\n\\nHere is relevant content from the Byte Digital website to help you answer the user\\\'s question:\\n\\n{{ $("Find Relevant Content").item.json.relevantContent }}\\n\\nUser\\\'s question: {{ $json.userMessage }}'),
      options: {
        systemMessage: `You are Byte Digital's AI assistant. Byte Digital is a premium web design and digital marketing agency based in Christchurch, New Zealand, founded by Barry Grottis.

## About Byte Digital
- **Location:** Christchurch, Canterbury, New Zealand
- **Founder:** Barry Grottis (14+ years experience)
- **Email:** barry@bytedigital.co.nz
- **Website:** https://bytedigital.co.nz

## Services Offered
- Web Design — Custom, conversion-focused websites built from scratch
- Web Development — Fast, scalable web applications with modern frameworks
- SEO — Rank higher on Google and drive organic traffic
- Local SEO — Dominate local search results in Christchurch
- eCommerce — Online stores that sell. Built for conversion
- WordPress Development — Custom WordPress sites that are fast and secure
- Branding — Brand strategy and identity that stands out
- Logo Design — Memorable logos that define your brand
- Custom Applications — Tailor-made web apps for your business processes
- Website Maintenance — Keep your site fast, secure, and up to date

## Your Role
You help website visitors learn about Byte Digital's services, answer their questions about web design and digital marketing, and guide them toward becoming customers. You are friendly, professional, and knowledgeable.

## Guidelines
1. Answer questions using ONLY the website content provided above. If the information isn't available in the content, say "I don't have that information available, but I'd be happy to connect you with Barry directly at barry@bytedigital.co.nz"
2. Be conversational and helpful — like a knowledgeable team member
3. When appropriate, suggest relevant services or guides
4. Always maintain the Byte Digital brand voice: confident, professional, focused on helping local businesses succeed
5. If asked about pricing, direct them to the free consultation or contact form
6. If asked about availability, suggest they reach out via the contact form or email
7. Keep responses concise and focused — don't overwhelm with information
8. If the user seems ready to take the next step, encourage them to contact Byte Digital for a free discovery call`,
        enableStreaming: true,
      },
    },
    subnodes: {
      model: openAiModel,
      memory: postgresMemory,
    },
    position: [1140, 300],
  },
  output: [{ output: "Thanks for your question! Here's what I can tell you about our web design services..." }],
});

export default workflow('byte-digital-chatbot', 'Byte Digital Business Chatbot')
  .add(chatTrigger)
  .to(fetchSiteContent)
  .to(findRelevantContent)
  .to(aiAgent);
