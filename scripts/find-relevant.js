const content = $('Fetch Site Content').first().json;
const userMessage = $('Webhook').first().json.body.chatInput || '';

const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or', 'if', 'while', 'about', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'am']);

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

const keywords = tokenize(userMessage);

function scoreSection(sectionText, sectionTitle) {
  sectionTitle = sectionTitle || '';
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

let context = '## Byte Digital Website Content\n\n';
for (const section of topSections) {
  context += '### ' + section.title + ' (' + section.type + ')\n';
  context += section.content + '\n\n';
}

if (topSections.length === 0) {
  context = '## Byte Digital Business Information\n\n';
  if (content.business) {
    const b = content.business;
    context += b.name + ': ' + b.description + '\n';
    context += 'Location: ' + b.location + '\n';
    context += 'Email: ' + b.email + '\n';
    context += 'Services: ' + (b.services || []).join(', ') + '\n';
  }
}

return [{
  json: {
    relevantContent: context,
    userMessage: userMessage,
    matchedSections: topSections.length,
  }
}];
