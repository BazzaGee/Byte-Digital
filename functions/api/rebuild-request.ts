interface Env {
  DB: D1Database;
  REBUILD_ASSETS: R2Bucket;
  RESEND_API_KEY: string;
  /** Set when the builder worker is reachable. Absent disables auto-intake. */
  INTAKE_URL?: string;
  /** Shared with the builder's /api/intake. Never appears in a log. */
  INTAKE_SECRET?: string;
}

const ALLOWED_ORIGINS = [
  "https://bytedigital.co.nz",
  "https://www.bytedigital.co.nz",
  "https://byte-digital.pages.dev",
  "https://staging.byte-digital.pages.dev",
  "http://localhost:4321",
];

const PAGES_DEV_ORIGIN = /^https:\/\/[a-z0-9-]+\.pages\.dev$/;

const SOURCES = ["live", "showcase", "site"] as const;
type Source = (typeof SOURCES)[number];

const SOURCE_LABELS: Record<Source, string> = {
  live: "Came from a website Byte Digital built",
  showcase: "Came from the Byte Digital showcase",
  site: "Came from the Byte Digital website",
};

const VARIANTS = ["rebuild", "new-build"] as const;
type Variant = (typeof VARIANTS)[number];

/**
 * `variant` is what they asked for; `source` is where they came from. The
 * builder's own funnel only ever hands us `rebuild`, and only `new-build`
 * briefs are auto-intaken — so that established flow is untouched by this.
 */
const VARIANT_LABELS: Record<Variant, string> = {
  rebuild: "Rebuild — a site we already built, or a showcase",
  "new-build": "New website — came in through the Byte Digital website",
};

/** Business types, slug -> label. Keys are the allow-list for `category`. */
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

const HAS_EXISTING: Record<string, string> = {
  website: "Has a website already",
  social: "Facebook or Instagram only",
  none: "Nothing yet",
  "not-asked": "Not asked",
};

const SITE_TYPES: Record<string, string> = {
  info: "Simple info site",
  booking: "Bookings",
  store: "Online shop",
  quotes: "Quote requests",
  membership: "Members area",
  portfolio: "Portfolio",
  blog: "News, updates or a blog",
  directory: "Listings — properties, jobs, courses",
};

/** Tier A: within what the free build actually produces (no forms, no backend). */
const IN_SCOPE: Record<string, string> = {
  pages: "All the main pages",
  "service-pages": "A page per service",
  gallery: "Photo gallery",
  map: "Map & directions",
  hours: "Opening hours",
  "call-email": "Tap-to-call and tap-to-email buttons",
  news: "News or updates pages",
  "booking-link": "Booking buttons",
  team: "Team, about and credentials",
  reviews: "Customer reviews",
  // Rendered inside the Tier B group (that is where the escape hatch belongs)
  // but allow-listed as in-scope, so ticking it records the answer without
  // claiming the visitor asked for software we cannot build.
  "nothing-now": "Nothing extra",
};

/** Tier B: requested honestly, never attempted, always quoted separately. */
const OUT_SCOPE: Record<string, string> = {
  cart: "Online shop",
  payments: "Take payments",
  "booking-diary": "Live booking diary",
  logins: "Member logins",
  "quote-system": "Quote system",
  cms: "An editing dashboard you manage yourself",
  multilang: "More than one language",
  app: "A native app",
  api: "Software connections",
  chat: "Live chat or a support widget",
};

const INTEGRATIONS: Record<string, string> = {
  payments: "Payments (Stripe, Windcave)",
  accounting: "Accounting (Xero, MYOB)",
  crm: "A CRM or job management tool",
  booking: "Your booking software",
  social: "Your social feeds",
  mailing: "A mailing list or email platform",
  gbp: "Google Business Profile",
  none: "Nothing yet",
};

const PUBLIC_BASE = "https://pub-932dca65c7cb44ecaa58f87c3db67040.r2.dev";

const MAX_NAME_LENGTH = 160;
const MAX_FIRST_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 200;
const MAX_TEXT_LENGTH = 1000;
const MAX_URL_LENGTH = 500;
const MAX_ASSET_KEY = 220;
const MAX_ASSETS = 6;
/** An intake brief is one payload; the builder re-derives its own slugs. */
const MAX_INTAKE_BYTES = 64 * 1024;
/**
 * Generous on purpose: `rescan` on the builder used to eat 19s and a 12s
 * budget meant the caller abandoned a brief that had already been seeded,
 * leaving it pending forever. The builder now registers in one statement, but
 * `startBuild` can still sit behind an active run — so this stays well clear.
 */
const INTAKE_TIMEOUT_MS = 60_000;

const NOTIFY_TO = "buttersnoco@gmail.com";

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

function cleanList(value: unknown, maxItems: number, maxItem: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxItem))
    .filter(Boolean)
    .slice(0, maxItems);
}

/**
 * Every allow-listed field passes through here, so a value the server does not
 * recognise is dropped rather than stored. The server's own label map — never
 * the client's text — is what reaches the notification.
 */
function cleanEnumList(
  value: unknown,
  allowed: Record<string, string>,
  maxItems: number
): string[] {
  const seen = new Set<string>();
  for (const item of cleanList(value, maxItems, 60)) {
    if (allowed[item]) seen.add(item);
  }
  return [...seen];
}

function resolveVariant(body: Record<string, unknown>, source: Source): Variant {
  const raw = cleanString(body.variant, 20);
  if ((VARIANTS as readonly string[]).includes(raw)) return raw as Variant;
  // A stale client that never sends `variant` still gets bucketed by origin.
  return source === "site" ? "new-build" : "rebuild";
}

function resolveScope(featuresOut: string[]): "standard" | "custom-build" {
  return featuresOut.length ? "custom-build" : "standard";
}

function labels(items: string[], map: Record<string, string>): string[] {
  return items.map((item) => map[item] || item);
}

/** One comma-separated line of labels, or null when there is nothing to say. */
function labelLine(items: string[], map: Record<string, string>): string | null {
  const shown = labels(items, map);
  return shown.length ? shown.join(", ") : null;
}

/**
 * skipped — not configured, or a rebuild brief (the manual flow stays manual)
 * queued  — seeded AND a build is running
 * seeded  — seeded but nothing is running: intake parked, the site already
 *           existed, or startBuild refused. Either way the brief is safe and
 *           is waiting for the owner rather than silently lost.
 * failed  — nothing reached the builder; the brief is still in D1
 */
interface IntakeResult {
  status: "skipped" | "queued" | "seeded" | "failed";
  slug: string | null;
  detail: string;
}

/**
 * Hand the brief to the builder worker so it can turn it into a seed and start
 * the build. Only `new-build` briefs go here: the workflow's own funnel has
 * always been manual and must stay that way.
 *
 * Deliberately strict about failure — a refused or timed-out intake must never
 * cost the visitor their brief, which is already in D1 before this is called.
 */
async function pushIntake(env: Env, brief: Record<string, unknown>): Promise<IntakeResult> {
  const url = env.INTAKE_URL;
  const secret = env.INTAKE_SECRET;
  if (!url || !secret) return { status: "skipped", slug: null, detail: "intake not configured" };

  const raw = JSON.stringify(brief);
  if (raw.length > MAX_INTAKE_BYTES) {
    return { status: "failed", slug: null, detail: "brief exceeds intake limit" };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), INTAKE_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: raw,
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        slug?: string;
        queued?: boolean;
        message?: string;
        error?: string;
      };
      if (res.ok && data.ok && typeof data.slug === "string" && data.slug) {
        return {
          status: data.queued ? "queued" : "seeded",
          slug: data.slug,
          detail: typeof data.message === "string" ? data.message : "",
        };
      }
      // Never echo the upstream body into anything user-visible; the message is
      // for the owner notification only.
      return { status: "failed", slug: null, detail: data.error || `HTTP ${res.status}` };
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    return { status: "failed", slug: null, detail: e instanceof Error ? e.message : String(e) };
  }
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

  // Anchors the visitor's build timeline. The wizard stores it and runs the
  // stage animation from it, so a skewed device clock cannot make the progress
  // read nonsense. Declared up front: the honeypot below returns early.
  const startedAt = Date.now();

  // Honeypot. A real person never fills a field they cannot see. Respond 200 so
  // the bot gets no signal that it was detected.
  if (typeof body.companyWebsite === "string" && body.companyWebsite.trim() !== "") {
    return Response.json({ success: true, startedAt }, { status: 200, headers });
  }

  const sourceRaw = cleanString(body.source, 20).toLowerCase();
  const source: Source = (SOURCES as readonly string[]).includes(sourceRaw)
    ? (sourceRaw as Source)
    : "site";
  const variant = resolveVariant(body, source);

  const slugRaw = cleanString(body.slug, 120).toLowerCase();
  const slug = /^[a-z0-9-]{1,120}$/.test(slugRaw) ? slugRaw : "";

  const firstName = cleanString(body.firstName, MAX_FIRST_NAME_LENGTH);
  const email = cleanString(body.email, MAX_EMAIL_LENGTH).toLowerCase();
  const businessName = cleanString(body.businessName, MAX_NAME_LENGTH);
  const currentWebsite = cleanString(body.currentWebsite, MAX_URL_LENGTH);
  const businessContact = cleanString(body.businessContact, 300);
  const services = cleanList(body.services, 12, 60);
  const servicesOther = cleanString(body.servicesOther, 600);
  const usp = cleanString(body.usp, MAX_TEXT_LENGTH);
  const designPicks = cleanList(body.designPicks, 12, 60);
  const designWishes = cleanString(body.designWishes, MAX_TEXT_LENGTH);
  const assetLink = cleanString(body.assetLink, MAX_URL_LENGTH);
  const pageUrl = cleanString(body.pageUrl, MAX_URL_LENGTH);
  const referrer = cleanString(body.referrer, MAX_URL_LENGTH);
  const consent = body.consent === true || body.consent === "true";
  const userAgent = (request.headers.get("User-Agent") || "").slice(0, 300);

  // --- new-build segmentation -------------------------------------------
  const categoryOther = cleanString(body.categoryNote, 400);
  const hasExistingRaw = cleanString(body.hasExistingSite, 20);
  const siteTypes = cleanEnumList(body.siteTypes, SITE_TYPES, 8);
  const featuresIn = cleanEnumList(body.features, IN_SCOPE, 20);
  // The same array is split by membership, not by which list the visitor put
  // it in — a ticked "cart" is out of scope whatever they believed.
  const featuresOut = cleanEnumList(body.features, OUT_SCOPE, 20);
  const integrations = cleanEnumList(body.integrationRequests, INTEGRATIONS, 8);
  const scope = resolveScope(featuresOut);

  const requirementsParts = [
    cleanString(body.featureNote, 600) ? `Must have: ${cleanString(body.featureNote, 600)}` : "",
    cleanString(body.siteTypeOther, 400) ? `Other kinds of site: ${cleanString(body.siteTypeOther, 400)}` : "",
    cleanString(body.integrationOther, 400)
      ? `Other connections: ${cleanString(body.integrationOther, 400)}`
      : "",
  ].filter(Boolean);
  const requirementsNote = requirementsParts.length ? requirementsParts.join("\n") : "";

  const utmSource = cleanString(body.utmSource, 200);
  const utmMedium = cleanString(body.utmMedium, 200);
  const utmCampaign = cleanString(body.utmCampaign, 200);

  if (!firstName) {
    return Response.json({ error: "Please enter your first name." }, { status: 400, headers });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400, headers });
  }
  if (!businessName) {
    return Response.json({ error: "Please enter your business name." }, { status: 400, headers });
  }
  // A chip, or their own words — ten options cannot cover every business, and
  // refusing the typed answer would turn the input box into a dead end.
  const category =
    CATEGORIES[cleanString(body.category, 30)] || (categoryOther ? "other" : "");
  if (variant === "new-build" && !CATEGORIES[category]) {
    return Response.json({ error: "Please pick the type of business." }, { status: 400, headers });
  }

  // Assets must reference real objects this worker uploaded: the key shape is
  // fixed, and the object has to exist. Never trust a client-supplied URL.
  const assetInput = Array.isArray(body.assets) ? body.assets.slice(0, MAX_ASSETS) : [];
  const assets: Array<{ key: string; name: string; size: number; type: string; url: string }> = [];

  for (const item of assetInput) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const key = cleanString(record.key, MAX_ASSET_KEY);
    if (!/^rebuild\/[0-9a-f-]{36}\/[a-zA-Z0-9._-]{1,100}$/.test(key)) continue;

    const head = await env.REBUILD_ASSETS.head(key);
    if (!head) continue;

    assets.push({
      key,
      name: cleanString(record.name, 120) || key.split("/").pop() || "file",
      size: typeof record.size === "number" && record.size >= 0 ? Math.round(record.size) : head.size,
      type: cleanString(record.type, 80),
      url: `${PUBLIC_BASE}/${key}`,
    });
  }

  const designWishesJson = JSON.stringify({ picks: designPicks, note: designWishes });

  let leadId: number | null = null;
  try {
    const inserted = await env.DB.prepare(
      `INSERT INTO rebuild_requests
         (source, variant, slug, business_name, current_website, business_contact,
          has_existing_site, category, site_types, feature_requests,
          integration_requests, requirements_note, services, services_other,
          usp, design_wishes, assets, asset_link, first_name, email, consent,
          page_url, referrer, user_agent, utm_source, utm_medium, utm_campaign,
          scope, category_note, intake_status, intake_detail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`
    )
      .bind(
        source,
        variant,
        slug || null,
        businessName,
        currentWebsite || null,
        businessContact || null,
        hasExistingRaw && HAS_EXISTING[hasExistingRaw] ? hasExistingRaw : "not-asked",
        variant === "new-build" ? category : null,
        siteTypes.length ? JSON.stringify(siteTypes) : null,
        featuresIn.length || featuresOut.length
          ? JSON.stringify({ in: featuresIn, out: featuresOut })
          : null,
        integrations.length ? JSON.stringify(integrations) : null,
        requirementsNote || null,
        services.length ? JSON.stringify(services) : null,
        servicesOther || null,
        usp || null,
        designWishesJson,
        assets.length ? JSON.stringify(assets) : null,
        assetLink || null,
        firstName,
        email,
        consent ? 1 : 0,
        pageUrl || null,
        referrer || null,
        userAgent || null,
        utmSource || null,
        utmMedium || null,
        utmCampaign || null,
        scope,
        categoryOther || null
      )
      .run();
    leadId = inserted.meta?.last_row_id ?? null;
  } catch (e) {
    console.error("rebuild_requests insert error:", e);
    return Response.json(
      { error: "Something went wrong on my side. Please try again." },
      { status: 500, headers }
    );
  }

  // Auto-intake only for the cold-arrival funnel. The builder's established
  // flow keeps its manual queue, so nothing about it changes.
  const intake: IntakeResult =
    variant === "new-build" && leadId
      ? await pushIntake(env, {
          requestId: leadId,
          source,
          variant,
          scope,
          businessName,
          currentWebsite,
          businessContact,
          category,
          categoryLabel: CATEGORIES[category] || "",
          categoryNote: categoryOther,
          hasExistingSite: hasExistingRaw && HAS_EXISTING[hasExistingRaw] ? hasExistingRaw : "not-asked",
          services,
          servicesOther,
          usp,
          siteTypes,
          siteTypeLabels: labels(siteTypes, SITE_TYPES),
          featuresIn,
          featureInLabels: labels(featuresIn, IN_SCOPE),
          featuresOut,
          featureOutLabels: labels(featuresOut, OUT_SCOPE),
          mustHave: cleanString(body.featureNote, 600),
          integrations,
          integrationLabels: labels(integrations, INTEGRATIONS),
          integrationOther: cleanString(body.integrationOther, 400),
          designPicks,
          designWishes,
          firstName,
          email,
          referrer,
          pageUrl,
        })
      : { status: "skipped", slug: null, detail: "" };

  if (leadId) {
    try {
      await env.DB.prepare(
        "UPDATE rebuild_requests SET intake_status = ?, intake_slug = ?, intake_detail = ? WHERE id = ?"
      )
        .bind(intake.status, intake.slug, intake.detail || null, leadId)
        .run();
    } catch (e) {
      console.error("rebuild_requests intake update error:", e);
    }
  }

  // Notification is best-effort — the brief is already safe in D1.
  try {
    const when = new Date().toLocaleString("en-NZ", {
      timeZone: "Pacific/Auckland",
      dateStyle: "full",
      timeStyle: "short",
    });

    const originLabel = slug
      ? `https://bytedigital.co.nz/websites/${slug}/`
      : currentWebsite || "";

    const servicesLine = [services.join(", "), servicesOther].filter(Boolean).join(" | ");
    const designLine = [designPicks.join(", "), designWishes].filter(Boolean).join(" | ");

    const scopeLabel = scope === "custom-build" ? "CUSTOM BUILD — bigger than the free build" : "Standard free build";

    const asking: Array<[string, string | null]> = [
      [
        "Business type",
        variant === "new-build"
          ? [CATEGORIES[category] || null, categoryOther || null].filter(Boolean).join(" — ")
          : null,
      ],
      ["Already has a website", variant === "new-build" ? HAS_EXISTING[hasExistingRaw] || null : null],
      ["Kind of website", labelLine(siteTypes, SITE_TYPES)],
      ["In the free build", labelLine(featuresIn, IN_SCOPE)],
      ["Bigger build, separate quote", labelLine(featuresOut, OUT_SCOPE)],
      ["Connections", labelLine(integrations, INTEGRATIONS)],
      ["Must have", requirementsNote || null],
      ["Business contact to publish", businessContact || null],
      ["UTM", [utmSource, utmMedium, utmCampaign].filter(Boolean).join(" / ") || null],
    ];

    const suffix = intake.detail ? ` — ${intake.detail}` : "";
    const intakeLine =
      intake.status === "skipped"
        ? null
        : intake.status === "failed"
          ? `FAILED — ${intake.detail || "unavailable"} — build it by hand`
          : intake.status === "queued"
            ? `queued (site: ${intake.slug})${suffix}`
            : `seeded, NOT started (site: ${intake.slug})${suffix} — start it from the dashboard`;

    const askingText = asking
      .filter(([, value]) => value)
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n");

    const textBody = [
      "New website brief",
      "",
      `Received: ${when}`,
      `Funnel: ${VARIANT_LABELS[variant]}`,
      `Source: ${SOURCE_LABELS[source]}`,
      `Scope: ${scopeLabel}`,
      intakeLine ? `Auto-build: ${intakeLine}` : null,
      originLabel ? `Origin: ${originLabel}` : null,
      slug ? `Showcase slug: ${slug}` : null,
      askingText ? `\n${askingText}` : null,
      "",
      `First name: ${firstName}`,
      `Email: ${email}`,
      `Business: ${businessName}`,
      currentWebsite ? `Current website: ${currentWebsite}` : null,
      "",
      servicesLine ? `Services to highlight: ${servicesLine}` : null,
      usp ? `What makes them different: ${usp}` : null,
      designLine ? `Design wishes: ${designLine}` : null,
      assets.length
        ? `\nAssets (${assets.length}):\n${assets.map((a) => `- ${a.name} (${Math.round(a.size / 1024)} KB): ${a.url}`).join("\n")}`
        : null,
      assetLink ? `Asset link: ${assetLink}` : null,
      pageUrl ? `\nSubmitted from: ${pageUrl}` : null,
      referrer ? `Referrer: ${referrer}` : null,
      `Consent to email: ${consent ? "yes" : "no"}`,
    ]
      .filter(Boolean)
      .join("\n");

    const askingHtml = asking
      .filter(([, value]) => value)
      .map(
        ([label, value]) =>
          `<div style="margin:0 0 6px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280">${sanitize(label)}</div><div style="font-size:15px;white-space:pre-wrap">${sanitize(value as string)}</div></div>`
      )
      .join("");

    const scopeBadge =
      scope === "custom-build"
        ? `<span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700;background:#fef3c7;color:#92400e">Custom build requested</span>`
        : `<span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700;background:#ecfdf5;color:#047857">Standard free build</span>`;

    const intakeBadge = intakeLine
      ? `<p style="margin:8px 0 0;font-size:13px;color:${intake.status === "queued" ? "#047857" : intake.status === "seeded" ? "#b45309" : "#b91c1c"}">Auto-build: ${sanitize(intakeLine)}</p>`
      : "";

    const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;line-height:1.6;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#8B78E6,#4ECDC4);padding:20px 24px">
      <h1 style="color:#fff;margin:0;font-size:18px">New website brief</h1>
      <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:13px">${sanitize(when)}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 6px;font-size:15px"><strong>${sanitize(VARIANT_LABELS[variant])}</strong>${slug ? ` — <a href="https://bytedigital.co.nz/websites/${sanitize(slug)}/">${sanitize(slug)}</a>` : ""}</p>
      <p style="margin:0 0 12px">${scopeBadge} <span style="font-size:13px;color:#6b7280">${sanitize(SOURCE_LABELS[source])}</span></p>
      ${intakeBadge}
      <p style="margin:18px 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280">What they are asking for</p>
      ${askingHtml}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
      <p style="margin:0 0 8px"><strong>Name:</strong> ${sanitize(firstName)}</p>
      <p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:${sanitize(email)}">${sanitize(email)}</a></p>
      <p style="margin:0 0 8px"><strong>Business:</strong> ${sanitize(businessName)}</p>
      ${currentWebsite ? `<p style="margin:0 0 8px"><strong>Current website:</strong> ${sanitize(currentWebsite)}</p>` : ""}
      ${servicesLine ? `<p style="margin:16px 0 8px"><strong>Services to highlight:</strong><br>${sanitize(servicesLine)}</p>` : ""}
      ${usp ? `<p style="margin:16px 0 8px"><strong>What makes them different:</strong><br>${sanitize(usp)}</p>` : ""}
      ${designLine ? `<p style="margin:16px 0 8px"><strong>Design wishes:</strong><br>${sanitize(designLine)}</p>` : ""}
      ${
        assets.length
          ? `<p style="margin:16px 0 8px"><strong>Assets (${assets.length}):</strong></p><ul style="margin:0;padding-left:20px">${assets
              .map((a) => `<li><a href="${sanitize(a.url)}">${sanitize(a.name)}</a> (${Math.round(a.size / 1024)} KB)</li>`)
              .join("")}</ul>`
          : ""
      }
      ${assetLink ? `<p style="margin:8px 0"><strong>Asset link:</strong> ${sanitize(assetLink)}</p>` : ""}
      ${pageUrl ? `<p style="margin:16px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280">Submitted from <a href="${sanitize(pageUrl)}">${sanitize(pageUrl)}</a></p>` : ""}
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
        from: "Byte Digital <website@bytedigital.co.nz>",
        to: [NOTIFY_TO],
        reply_to: email,
        subject: `New website brief — ${businessName} (${variant}${scope === "custom-build" ? " · custom build" : ""})`,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!res.ok) {
      console.error("Resend notify failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("rebuild notify error:", e);
  }

  return Response.json(
    { success: true, startedAt, scope, intake: intake.status },
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
