interface Env {
  ADMIN_PASSWORD: string;
}

const COOKIE_NAME = "bd_admin_session";
const SESSION_DAYS = 7;

async function hmacSign(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { password?: string };
  try {
    body = await request.json() as any;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.password || body.password.trim() !== env.ADMIN_PASSWORD.trim()) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const signature = await hmacSign(env.ADMIN_PASSWORD, String(expiry));
  const token = `${expiry}:${signature}`;

  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
      },
    }
  );
};

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  return Response.redirect(new URL("/admin-login", request.url).toString(), 302);
};
