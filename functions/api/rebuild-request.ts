interface Env {
  DB: D1Database;
  REBUILD_ASSETS: R2Bucket;
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

const SOURCES = ["live", "showcase", "site"] as const;
type Source = (typeof SOURCES)[number];

const SOURCE_LABELS: Record<Source, string> = {
  live: "Came from a website Byte Digital built",
  showcase: "Came from the Byte Digital showcase",
  site: "Came from the Byte Digital website",
};

const PUBLIC_BASE = "https://pub-932dca65c7cb44ecaa58f87c3db67040.r2.dev";

const MAX_NAME_LENGTH = 160;
const MAX_FIRST_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 200;
const MAX_TEXT_LENGTH = 1000;
const MAX_URL_LENGTH = 500;
const MAX_ASSET_KEY = 220;
const MAX_ASSETS = 6;

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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const headers = corsHeaders(request.headers.get("Origin") || "");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400, headers });
  }

  // Honeypot. A real person never fills a field they cannot see. Respond 200 so
  // the bot gets no signal that it was detected.
  if (typeof body.companyWebsite === "string" && body.companyWebsite.trim() !== "") {
  return Response.json({ success: true, startedAt }, { status: 200, headers });
  }

  const sourceRaw = cleanString(body.source, 20).toLowerCase();
  const source: Source = (SOURCES as readonly string[]).includes(sourceRaw)
    ? (sourceRaw as Source)
    : "site";

  const slugRaw = cleanString(body.slug, 120).toLowerCase();
  const slug = /^[a-z0-9-]{1,120}$/.test(slugRaw) ? slugRaw : "";

  const firstName = cleanString(body.firstName, MAX_FIRST_NAME_LENGTH);
  const email = cleanString(body.email, MAX_EMAIL_LENGTH).toLowerCase();
  const businessName = cleanString(body.businessName, MAX_NAME_LENGTH);
  const currentWebsite = cleanString(body.currentWebsite, MAX_URL_LENGTH);
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

  if (!firstName) {
    return Response.json({ error: "Please enter your first name." }, { status: 400, headers });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400, headers });
  }
  if (!businessName) {
    return Response.json({ error: "Please enter your business name." }, { status: 400, headers });
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

  // Anchors the visitor's build timeline. The wizard stores it and runs the
  // stage animation from it, so a skewed device clock cannot make the progress
  // read nonsense.
  const startedAt = Date.now();

  try {
    await env.DB.prepare(
      `INSERT INTO rebuild_requests
         (source, slug, business_name, current_website, services, services_other,
          usp, design_wishes, assets, asset_link, first_name, email, consent,
          page_url, referrer, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        source,
        slug || null,
        businessName,
        currentWebsite || null,
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
        userAgent || null
      )
      .run();
  } catch (e) {
    console.error("rebuild_requests insert error:", e);
    return Response.json(
      { error: "Something went wrong on my side. Please try again." },
      { status: 500, headers }
    );
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

    const textBody = [
      "New website brief",
      "",
      `Received: ${when}`,
      `Source: ${SOURCE_LABELS[source]}`,
      originLabel ? `Origin: ${originLabel}` : null,
      slug ? `Showcase slug: ${slug}` : null,
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

    const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;line-height:1.6;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#8B78E6,#4ECDC4);padding:20px 24px">
      <h1 style="color:#fff;margin:0;font-size:18px">New website brief</h1>
      <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:13px">${sanitize(when)}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px"><strong>${sanitize(SOURCE_LABELS[source])}</strong>${slug ? ` — <a href="https://bytedigital.co.nz/websites/${sanitize(slug)}/">${sanitize(slug)}</a>` : ""}</p>
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
        subject: `New website brief — ${businessName} (${source})`,
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

  return Response.json({ success: true }, { status: 200, headers });
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
