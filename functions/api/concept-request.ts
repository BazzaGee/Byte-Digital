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

const CONCEPT_TTL_DAYS = 30;
const MAX_EMAIL_LENGTH = 200;
const MAX_NAME_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_URL_LENGTH = 500;

/** Where the source bundle and the preview notification come from. */
const FROM_ADDRESS = "Byte Digital <website@bytedigital.co.nz>";

/**
 * Where concept requests get notified inside the account.
 *
 * Deliberately NOT barry@bytedigital.co.nz. That mailbox is served by Titan
 * (mx1.titan.email), and Titan rejects same-domain mail arriving from an
 * external sender — it reads as spoofing. Verified by test: mail from
 * website@bytedigital.co.nz to this address is delivered, while the identical
 * message to barry@bytedigital.co.nz bounces.
 */
const NOTIFY_TO = "buttersnoco@gmail.com";

function originAllowed(origin: string) {
  return ALLOWED_ORIGINS.includes(origin);
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

function escapeHtml(input: string) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 32 bytes of CSPRNG entropy, base64url encoded -> 43 chars. The token is the
 * only protection on the concept wrapper, so it must not be guessable or
 * derived from the business name.
 */
function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Only accept http(s). Blocks javascript:, data:, and protocol-relative URLs. */
function normaliseUrl(raw: string): string | null {
  const value = (raw || "").trim();
  if (!value) return null;
  if (value.length > MAX_URL_LENGTH) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isValidEmail(value: string) {
  if (!value || value.length > MAX_EMAIL_LENGTH) return false;
  // Deliberately loose: the confirmation email is the real test, and an
  // over-strict regex here rejects real addresses.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
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
    return Response.json({ success: true }, { status: 200, headers });
  }

  const businessName = String(body.businessName || "").trim().slice(0, MAX_NAME_LENGTH);
  const contactEmail = String(body.email || "").trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
  const message = String(body.message || "").trim().slice(0, MAX_MESSAGE_LENGTH);
  const businessUrl = normaliseUrl(String(body.website || ""));
  const source = String(body.source || "free-website").trim().slice(0, 60);
  const pageUrl = String(body.pageUrl || "").trim().slice(0, MAX_URL_LENGTH);
  const userAgent = (request.headers.get("User-Agent") || "").slice(0, 300);
  const consentEmail = body.consentEmail === true || body.consentEmail === "true";

  if (!businessName) {
    return Response.json({ error: "Please enter your business name." }, { status: 400, headers });
  }
  if (!isValidEmail(contactEmail)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400, headers });
  }
  if (body.website && !businessUrl) {
    return Response.json({ error: "That does not look like a valid website address." }, { status: 400, headers });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + CONCEPT_TTL_DAYS * 86400_000).toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO concept_requests
         (token, business_name, business_url, contact_email, message,
          consent_email, source, user_agent, page_url, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        token,
        businessName,
        businessUrl,
        contactEmail,
        message || null,
        consentEmail ? 1 : 0,
        source,
        userAgent,
        pageUrl || null,
        expiresAt
      )
      .run();
  } catch (e) {
    console.error("concept_requests insert error:", e);
    return Response.json(
      { error: "Something went wrong on my side. Please try again." },
      { status: 500, headers }
    );
  }

  // Notification is best-effort. A failed email must not lose the request —
  // it is already in D1 and the build pipeline can pick it up.
  try {
    const when = new Date().toLocaleString("en-NZ", {
      timeZone: "Pacific/Auckland",
      dateStyle: "full",
      timeStyle: "short",
    });

    const textBody = [
      "New free concept request",
      "",
      `Received: ${when}`,
      `Business: ${businessName}`,
      `Email: ${contactEmail}`,
      businessUrl ? `Their website: ${businessUrl}` : null,
      `Wrapper: https://bytedigital.co.nz/c/${token}/`,
      `Expires: ${expiresAt.slice(0, 10)}`,
      `Consent to email: ${consentEmail ? "yes" : "no"}`,
      message ? `\nMessage:\n${message}` : null,
      pageUrl ? `\nSubmitted from: ${pageUrl}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;line-height:1.6;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#8B78E6,#4ECDC4);padding:20px 24px">
      <h1 style="color:#fff;margin:0;font-size:18px">New free concept request</h1>
      <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:13px">${escapeHtml(when)}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 12px"><strong>Business:</strong> ${escapeHtml(businessName)}</p>
      <p style="margin:0 0 12px"><strong>Email:</strong> <a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a></p>
      ${businessUrl ? `<p style="margin:0 0 12px"><strong>Their website:</strong> <a href="${escapeHtml(businessUrl)}">${escapeHtml(businessUrl)}</a></p>` : ""}
      <p style="margin:0 0 12px"><strong>Wrapper:</strong> <a href="https://bytedigital.co.nz/c/${escapeHtml(token)}/">/c/${escapeHtml(token)}/</a></p>
      <p style="margin:0 0 12px"><strong>Expires:</strong> ${escapeHtml(expiresAt.slice(0, 10))}</p>
      ${message ? `<p style="margin:16px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;white-space:pre-wrap">${escapeHtml(message)}</p>` : ""}
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
        from: FROM_ADDRESS,
        to: [NOTIFY_TO],
        reply_to: contactEmail,
        subject: `Free concept requested — ${businessName}`,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!res.ok) {
      console.error("Resend notify failed:", res.status, await res.text());
    }
  } catch (e) {
    console.error("concept notify error:", e);
  }

  // The token goes back to the visitor so they can reach their own wrapper.
  return Response.json(
    {
      success: true,
      token,
      previewUrl: `/c/${token}/`,
      expiresAt,
    },
    { status: 200, headers }
  );
};

export const onRequestOptions: PagesFunction = async (context) => {
  const origin = context.request.headers.get("Origin") || "";
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
};
