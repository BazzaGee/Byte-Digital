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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const headers = corsHeaders(request.headers.get("Origin") || "");

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400, headers }
    );
  }

  if (body.website) {
    return Response.json({ success: true }, { headers });
  }

  const slug = (body.slug || "").trim();
  const choice = (body.choice || "").trim();
  const email = (body.email || "").trim();
  const businessName = (body.businessName || "").trim();
  const category = (body.category || "").trim();
  const liveUrl = (body.liveUrl || "").trim();
  const pageUrl = (body.pageUrl || "").trim();
  const surface = (body.surface || "").trim() === "live" ? "live" : "showcase";
  const userAgent = (request.headers.get("User-Agent") || "").slice(0, 300);

  if (!slug || !/^[a-z0-9-]{1,120}$/.test(slug)) {
    return Response.json({ error: "Invalid request." }, { status: 400, headers });
  }

  if (choice !== "files" && choice !== "redesign") {
    return Response.json({ error: "Invalid request." }, { status: 400, headers });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 200) {
    return Response.json(
      { error: "Please provide a valid email address." },
      { status: 400, headers }
    );
  }

  try {
    await env.DB.prepare(
      `INSERT INTO funnel_leads
        (slug, business_name, category, live_url, choice, email, page_url, user_agent, surface)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        slug,
        businessName || null,
        category || null,
        liveUrl || null,
        choice,
        email,
        pageUrl || null,
        userAgent || null,
        surface
      )
      .run();
  } catch (e) {
    console.error("D1 insert error:", e);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers }
    );
  }

  try {
    const choiceLabel = choice === "files" ? "Wants the website" : "Wants a free redesign";
    const now = new Date().toLocaleString("en-NZ", {
      timeZone: "Pacific/Auckland",
      dateStyle: "full",
      timeStyle: "short",
    });

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 24px auto; }
  .header { background: linear-gradient(135deg, #8B78E6 0%, #4ECDC4 100%); padding: 24px 32px; border-radius: 12px 12px 0 0; }
  .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 700; }
  .header p { color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px; }
  .body { padding: 24px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
  .field { margin-bottom: 16px; }
  .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 2px; }
  .field-value { font-size: 15px; color: #111827; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; background: #ecfdf5; color: #047857; }
  .footer { text-align: center; margin-top: 16px; font-size: 12px; color: #9ca3af; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Website Funnel Lead</h1>
      <p>${sanitize(now)}</p>
    </div>
    <div class="body">
      <div class="field">
        <div class="field-label">Business</div>
        <div class="field-value">${sanitize(businessName || slug)}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value"><a href="mailto:${sanitize(email)}">${sanitize(email)}</a></div>
      </div>
      <div class="field">
        <div class="field-label">They chose</div>
        <div class="field-value"><span class="badge">${sanitize(choiceLabel)}</span></div>
      </div>
      <div class="field">
        <div class="field-label">Captured on</div>
        <div class="field-value">${surface === "live" ? "Their live website" : "Showcase page"}</div>
      </div>
      ${category ? `<div class="field"><div class="field-label">Category</div><div class="field-value">${sanitize(category)}</div></div>` : ""}
      ${liveUrl ? `<div class="field"><div class="field-label">Their website</div><div class="field-value"><a href="${sanitize(liveUrl)}">${sanitize(liveUrl)}</a></div></div>` : ""}
      <div class="field">
        <div class="field-label">Page</div>
        <div class="field-value"><a href="${sanitize(pageUrl)}">${sanitize(pageUrl)}</a></div>
      </div>
    </div>
    <div class="footer">Sent from the Byte Digital website funnel</div>
  </div>
</body>
</html>`;

    const textBody = `New Website Funnel Lead
${now}

Business: ${businessName || slug}
Email: ${email}
They chose: ${choiceLabel}
Captured on: ${surface === "live" ? "their live website" : "showcase page"}${category ? `\nCategory: ${category}` : ""}${liveUrl ? `\nTheir website: ${liveUrl}` : ""}
Page: ${pageUrl}`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Byte Digital <website@bytedigital.co.nz>",
        to: ["buttersnoco@gmail.com"],
        reply_to: email,
        subject: `New funnel lead — ${businessName || slug} (${choice === "files" ? "wants website" : "wants redesign"})`,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!resendResponse.ok) {
      console.error("Resend API error:", await resendResponse.text());
    }
  } catch (e) {
    console.error("Funnel notify error:", e);
  }

  return Response.json({ success: true }, { headers });
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
