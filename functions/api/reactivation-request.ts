interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
}

const ALLOWED_ORIGINS = [
  "https://bytedigital.co.nz",
  "https://www.bytedigital.co.nz",
  "https://byte-digital.pages.dev",
  "https://staging.byte-digital.pages.dev",
  "http://localhost:4321",
];

const PAGES_DEV_ORIGIN = /^https:\/\/[a-z0-9-]+\.pages\.dev$/;

/**
 * Server-side copies of every allow-list rendered by the wizard. The page is
 * the untrusted side: a value the server does not recognise is dropped rather
 * than stored.
 */
const CATEGORIES: Record<string, string> = {
  trades: "Trades & home services",
  property: "Property & construction",
  retail: "Retail & online stores",
  hospitality: "Hospitality, food & events",
  professional: "Professional services",
  health: "Health & wellbeing",
  education: "Education, training & childcare",
  auto: "Auto, transport & logistics",
  creative: "Creative, media & technology",
  other: "Something else",
};

const LIST_SIZES: Record<string, string> = {
  "under-100": "Under 100",
  "100-500": "100–500",
  "500-2000": "500–2,000",
  "over-2000": "Over 2,000",
};

const LIST_AGES: Record<string, string> = {
  recent: "Last 6 months",
  "6m": "6–12 months ago",
  "1y": "1–2 years ago",
  "2y": "2–5 years ago",
  older: "More than 5 years",
  mixed: "A mix of all ages",
};

const LIST_SOURCES: Record<string, string> = {
  enquiry: "They enquired about my business",
  customer: "They bought from me",
  booking: "They booked with me",
  newsletter: "They signed up to my mailing list",
  event: "They signed up at an event",
  other: "Somewhere else",
};

const DORMANT_REASONS: Record<string, string> = {
  price: "Price — too expensive",
  timing: "Timing — came back at the wrong time",
  forgot: "They simply forgot about us",
  competitor: "They went with someone else",
  service: "A bad experience",
  moved: "Moved away or changed circumstances",
  seasonal: "Seasonal — only buy sometimes",
  other: "Something else",
};

const GOALS: Record<string, string> = {
  book: "Book a job or appointment",
  quote: "Get a quote",
  call: "Get a phone call",
  buy: "Buy something",
  reply: "Start a conversation",
};

const OFFER_ARCHETYPES: Record<string, string> = {
  discount: "A discount or special price",
  "free-consult": "A free consult or assessment",
  priority: "Priority booking or early access",
  content: "Something useful (guide, checklist)",
  bundle: "A bundle or package deal",
  none: "No offer — just checking in",
};

const CONSENT_BASES: Record<string, string> = {
  enquiry: "They filled in an enquiry form",
  customer: "They bought from me",
  booking: "They booked with me",
  newsletter: "They signed up to my mailing list",
  event: "They signed up at an event",
  bought: "I bought or rented this list",
  scraped: "I collected these from the web",
  shared: "Someone shared this list with me",
  unknown: "I'm not sure",
};

/**
 * Bases that are legally defensible for reactivation marketing email under
 * NZ / AU / US / UK / CA rules. Anything else cannot carry a campaign — the
 * brief still lands (the person asked for help) but the notification flags
 * it and nothing will import without a consent fix.
 */
const SAFE_BASES = ["enquiry", "customer", "booking", "newsletter", "event"];

const MAX_NAME_LENGTH = 160;
const MAX_FIRST_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 200;
const MAX_TEXT_LENGTH = 1000;
const MAX_URL_LENGTH = 500;
const MAX_CONTACTS = 2000;
const MAX_CONTACT_NAME = 120;
const MAX_CONTACT_PHONE = 40;

const NOTIFY_TO = "buttersnoco@gmail.com";
const NOTIFY_FROM = "Byte Digital <website@bytedigital.co.nz>";

function originAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin) || PAGES_DEV_ORIGIN.test(origin);
}

function corsHeaders(origin: string) {
  const allowOrigin = originAllowed(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function sanitize(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(value: string) {
  if (!value || value.length > MAX_EMAIL_LENGTH) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function cleanString(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function cleanEnumList(
  value: unknown,
  allowed: Record<string, string>,
  maxItems: number
): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    const key = cleanString(item, 60);
    if (allowed[key]) seen.add(key);
    if (seen.size >= maxItems) break;
  }
  return [...seen];
}

function labelLine(items: string[], map: Record<string, string>): string | null {
  const shown = items.map((item) => map[item] || item);
  return shown.length ? shown.join(", ") : null;
}

interface Contact {
  email: string;
  name: string;
  phone: string;
}

function cleanContacts(value: unknown): Contact[] {
  if (!Array.isArray(value)) return [];
  const seen = new Map<string, Contact>();
  for (const item of value) {
    if (seen.size >= MAX_CONTACTS) break;
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const email = cleanString(rec.email, MAX_EMAIL_LENGTH).toLowerCase();
    if (!isValidEmail(email)) continue;
    if (seen.has(email)) continue;
    seen.set(email, {
      email,
      name: cleanString(rec.name, MAX_CONTACT_NAME),
      phone: cleanString(rec.phone, MAX_CONTACT_PHONE),
    });
  }
  return [...seen.values()];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const headers = corsHeaders(request.headers.get("Origin") || "");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400, headers });
  }

  const startedAt = Date.now();

  // Honeypot — a real person never fills a hidden field. 200 so the bot gets
  // no signal that it was caught.
  if (typeof body.faxNumber === "string" && body.faxNumber.trim() !== "") {
    return Response.json({ success: true, startedAt }, { status: 200, headers });
  }

  const businessName = cleanString(body.businessName, MAX_NAME_LENGTH);
  const website = cleanString(body.website, MAX_URL_LENGTH);
  const category = cleanString(body.category, 30);
  const listSize = cleanString(body.listSize, 20);
  const listAge = cleanString(body.listAge, 20);
  const listSource = cleanString(body.listSource, 20);
  const dormantReasons = cleanEnumList(body.dormantReasons, DORMANT_REASONS, 8);
  const dormantNote = cleanString(body.dormantNote, MAX_TEXT_LENGTH);
  const goal = cleanString(body.goal, 20);
  const goalNote = cleanString(body.goalNote, 300);
  const offer = cleanString(body.offer, MAX_TEXT_LENGTH);
  const offerArchetype = cleanString(body.offerArchetype, 20);
  const consentBasis = cleanString(body.consentBasis, 20);
  const contacts = cleanContacts(body.contacts);
  const firstName = cleanString(body.firstName, MAX_FIRST_NAME_LENGTH);
  const email = cleanString(body.email, MAX_EMAIL_LENGTH).toLowerCase();
  const consentAttested = body.consentAttested === true;
  const consent = body.consent === true;
  const pageUrl = cleanString(body.pageUrl, MAX_URL_LENGTH);
  const referrer = cleanString(body.referrer, MAX_URL_LENGTH);
  const userAgent = (request.headers.get("User-Agent") || "").slice(0, 300);
  const utmSource = cleanString(body.utmSource, 200);
  const utmMedium = cleanString(body.utmMedium, 200);
  const utmCampaign = cleanString(body.utmCampaign, 200);

  // --- validation -----------------------------------------------------------
  if (!businessName) return Response.json({ error: "Please enter your business name." }, { status: 400, headers });
  if (!CATEGORIES[category]) return Response.json({ error: "Please pick the type of business." }, { status: 400, headers });
  if (!LIST_SIZES[listSize]) return Response.json({ error: "Please pick a list size." }, { status: 400, headers });
  if (!LIST_AGES[listAge]) return Response.json({ error: "Please pick how old the list is." }, { status: 400, headers });
  if (!LIST_SOURCES[listSource]) return Response.json({ error: "Please pick where the contacts came from." }, { status: 400, headers });
  if (!dormantReasons.length) return Response.json({ error: "Please pick at least one dormant reason." }, { status: 400, headers });
  if (!GOALS[goal]) return Response.json({ error: "Please pick what a win looks like." }, { status: 400, headers });
  if (!offer) return Response.json({ error: "Please describe your offer." }, { status: 400, headers });
  if (!CONSENT_BASES[consentBasis]) return Response.json({ error: "Please pick how you got these contacts." }, { status: 400, headers });
  if (!contacts.length) return Response.json({ error: "Upload a CSV or paste at least one contact." }, { status: 400, headers });
  if (!firstName) return Response.json({ error: "Please enter your first name." }, { status: 400, headers });
  if (!isValidEmail(email)) return Response.json({ error: "Please enter a valid email address." }, { status: 400, headers });
  if (!consentAttested) return Response.json({ error: "Please confirm the consent statement." }, { status: 400, headers });
  if (!consent) return Response.json({ error: "Please confirm you would like us to email you." }, { status: 400, headers });

  const safeBase = SAFE_BASES.includes(consentBasis);

  // --- insert ------------------------------------------------------------------
  try {
    await env.DB.prepare(
      `INSERT INTO reactivation_briefs
         (business_name, website, category, list_size, list_age, list_source,
          dormant_reasons, dormant_note, goal, goal_note, offer, offer_archetype,
          consent_basis, consent_attested, contacts, contacts_count,
          first_name, email, consent, page_url, referrer, user_agent,
          utm_source, utm_medium, utm_campaign, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received')`
    )
      .bind(
        businessName,
        website || null,
        category,
        listSize,
        listAge,
        listSource,
        JSON.stringify(dormantReasons),
        dormantNote || null,
        goal,
        goalNote || null,
        offer,
        offerArchetype || null,
        consentBasis,
        consentAttested ? 1 : 0,
        JSON.stringify(contacts),
        contacts.length,
        firstName,
        email,
        consent ? 1 : 0,
        pageUrl || null,
        referrer || null,
        userAgent || null,
        utmSource || null,
        utmMedium || null,
        utmCampaign || null
      )
      .run();
  } catch (e) {
    console.error("reactivation_briefs insert error:", e);
    return Response.json(
      { error: "Something went wrong on my side. Please try again." },
      { status: 500, headers }
    );
  }

  // --- notify the owner ---------------------------------------------------------
  // Best-effort: the brief is already safe in D1 before this runs.
  try {
    const when = new Date().toLocaleString("en-NZ", {
      timeZone: "Pacific/Auckland",
      dateStyle: "full",
      timeStyle: "short",
    });

    const dormantLine = labelLine(dormantReasons, DORMANT_REASONS);
    const consentFlag = safeBase
      ? `<span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700;background:#ecfdf5;color:#047857">Consent basis: safe</span>`
      : `<span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700;background:#fef3c7;color:#92400e">CONSENT ISSUE — ${sanitize(CONSENT_BASES[consentBasis])} — cannot run without a consent fix</span>`;

    const textBody = [
      "New reactivation brief",
      "",
      `Received: ${when}`,
      `Business: ${businessName}${website ? ` (${website})` : ""}`,
      `Type: ${CATEGORIES[category]}`,
      `List: ${LIST_SIZES[listSize]} contacts, newest ${LIST_AGES[listAge]}`,
      `Source: ${LIST_SOURCES[listSource]}`,
      dormantLine ? `Dormant reasons: ${dormantLine}` : "",
      dormantNote ? `Dormant note: ${dormantNote}` : "",
      `Goal: ${GOALS[goal]}${goalNote ? ` — ${goalNote}` : ""}`,
      `Offer: ${offer}${offerArchetype ? ` (${OFFER_ARCHETYPES[offerArchetype]})` : ""}`,
      `Consent basis: ${CONSENT_BASES[consentBasis]}${safeBase ? " — SAFE" : " — UNSAFE, needs review"}`,
      `Contacts ready: ${contacts.length}`,
      "",
      `From: ${firstName} <${email}>`,
      pageUrl ? `Submitted from: ${pageUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;line-height:1.6;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#8B78E6,#4ECDC4);padding:20px 24px">
      <h1 style="color:#fff;margin:0;font-size:18px">New reactivation brief</h1>
      <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:13px">${sanitize(when)}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 12px">${consentFlag}</p>
      <p style="margin:0 0 6px"><strong>${sanitize(businessName)}</strong>${website ? ` — <a href="${sanitize(website)}">${sanitize(website)}</a>` : ""}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#6b7280">${sanitize(CATEGORIES[category])} · ${sanitize(LIST_SIZES[listSize])} contacts · newest ${sanitize(LIST_AGES[listAge])}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#6b7280">Source: ${sanitize(LIST_SOURCES[listSource])}</p>
      ${dormantLine ? `<p style="margin:8px 0 6px"><strong>Dormant reasons:</strong> ${sanitize(dormantLine)}</p>` : ""}
      ${dormantNote ? `<p style="margin:0 0 6px;font-size:13.5px"><em>${sanitize(dormantNote)}</em></p>` : ""}
      <p style="margin:8px 0 6px"><strong>Goal:</strong> ${sanitize(GOALS[goal])}${goalNote ? ` — ${sanitize(goalNote)}` : ""}</p>
      <p style="margin:0 0 6px"><strong>Offer:</strong> ${sanitize(offer)}</p>
      ${offerArchetype ? `<p style="margin:0 0 6px;font-size:13px;color:#6b7280">Archetype: ${sanitize(OFFER_ARCHETYPES[offerArchetype])}</p>` : ""}
      <p style="margin:8px 0 6px"><strong>Consent basis:</strong> ${sanitize(CONSENT_BASES[consentBasis])}${safeBase ? "" : " ⚠️"}</p>
      <p style="margin:0 0 12px"><strong>Contacts ready:</strong> ${contacts.length}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
      <p style="margin:0 0 6px"><strong>${sanitize(firstName)}</strong> — <a href="mailto:${sanitize(email)}">${sanitize(email)}</a></p>
      ${pageUrl ? `<p style="margin:12px 0 0;font-size:13px;color:#6b7280">Submitted from <a href="${sanitize(pageUrl)}">${sanitize(pageUrl)}</a></p>` : ""}
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [NOTIFY_TO],
        reply_to: email,
        subject: `New reactivation brief — ${businessName} (${contacts.length} contacts${safeBase ? "" : " · CONSENT ISSUE"})`,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!res.ok) {
      console.error("Resend notify failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("reactivation notify error:", e);
  }

  return Response.json(
    { success: true, startedAt, contacts: contacts.length, safe: safeBase },
    { status: 200, headers }
  );
};

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
