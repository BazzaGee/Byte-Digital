interface Env {
  RESEND_API_KEY: string;
}

function sanitize(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://bytedigital.co.nz",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let body: Record<string, string>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400, headers: corsHeaders });
    }

    if (body.website) {
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();
    const business = (body.business || "").trim();
    const phone = (body.phone || "").trim();
    const service = (body.service || "").trim();

    if (!name || !email) {
      return Response.json(
        { error: "Name and email are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: "Please provide a valid email address." },
        { status: 400, headers: corsHeaders }
      );
    }

    const serviceLabels: Record<string, string> = {
      "web-design": "Web Design",
      "web-development": "Web Development",
      seo: "SEO Services",
      "digital-marketing": "Digital Marketing",
      ecommerce: "eCommerce",
      other: "Other",
    };

    const serviceLabel = service ? serviceLabels[service] || service : "Not specified";

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
  .message-box { background: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 8px; font-size: 15px; color: #374151; white-space: pre-wrap; }
  .footer { text-align: center; margin-top: 16px; font-size: 12px; color: #9ca3af; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Inquiry from bytedigital.co.nz</h1>
      <p>${sanitize(now)}</p>
    </div>
    <div class="body">
      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">${sanitize(name)}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value"><a href="mailto:${sanitize(email)}">${sanitize(email)}</a></div>
      </div>
      ${business ? `<div class="field"><div class="field-label">Business</div><div class="field-value">${sanitize(business)}</div></div>` : ""}
      ${phone ? `<div class="field"><div class="field-label">Phone</div><div class="field-value">${sanitize(phone)}</div></div>` : ""}
      <div class="field">
        <div class="field-label">Service</div>
        <div class="field-value">${sanitize(serviceLabel)}</div>
      </div>
      ${message ? `<div class="field"><div class="field-label">Message</div><div class="message-box">${sanitize(message)}</div></div>` : ""}
    </div>
    <div class="footer">Sent from the Byte Digital contact form</div>
  </div>
</body>
</html>`;

    const textBody = `New Inquiry from bytedigital.co.nz
${now}

Name: ${name}
Email: ${email}${business ? `\nBusiness: ${business}` : ""}${phone ? `\nPhone: ${phone}` : ""}
Service: ${serviceLabel}${message ? `\n\nMessage:\n${message}` : ""}`;

    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Byte Digital <onboarding@resend.dev>",
          to: ["buttersnoco@gmail.com"],
          reply_to: email,
          subject: `New inquiry from bytedigital.co.nz — ${name}`,
          html: htmlBody,
          text: textBody,
        }),
      });

      const responseBody = await resendResponse.text();
      if (!resendResponse.ok) {
        console.error("Resend API error:", responseBody);
        return Response.json(
          { error: "Failed to send message. Please email us directly." },
          { status: 500, headers: corsHeaders }
        );
      }

      return Response.json({ success: true }, { headers: corsHeaders });
    } catch (e: unknown) {
      console.error("Email send error:", e);
      return Response.json(
        { error: "Failed to send message. Please email us directly." },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
