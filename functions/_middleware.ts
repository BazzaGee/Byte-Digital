interface Env {
  ADMIN_PASSWORD: string;
}

const COOKIE_NAME = "bd_admin_session";
const SESSION_DAYS = 7;

const PROTECTED_PATHS = ["/chatbot-dashboard", "/api/dashboard"];

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

function getCookie(cookies: string, name: string): string | null {
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function verifySession(token: string, password: string): Promise<boolean> {
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [expiry, signature] = parts;
  if (Date.now() > Number(expiry)) return false;
  const expected = await hmacSign(password, expiry);
  return signature === expected;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  const isProtected = PROTECTED_PATHS.some(p => path.startsWith(p));
  if (!isProtected) return next();

  const cookies = request.headers.get("Cookie") || "";
  const token = getCookie(cookies, COOKIE_NAME);

  if (token && await verifySession(token, env.ADMIN_PASSWORD)) {
    return next();
  }

  if (path.startsWith("/api/dashboard")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.redirect(new URL("/admin-login", request.url).toString(), 302);
};
