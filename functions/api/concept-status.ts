interface Env {
  DB: D1Database;
}

function corsHeaders(origin: string) {
  const allowOrigin = origin.startsWith("https://bytedigital.co.nz") ? origin : "https://bytedigital.co.nz";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

/**
 * Polled by /c/<token>/ while the build pipeline runs.
 *
 * Returns only what the visitor already knows: whether a concept is ready and
 * where to view it. Never returns the email address, the message, or any other
 * PII back to the browser — the caller is anyone holding the token, and the
 * token is the only auth.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const headers = corsHeaders(request.headers.get("Origin") || "");

  const url = new URL(request.url);
  const token = (url.searchParams.get("token") || "").trim();

  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
    return Response.json({ error: "Not found." }, { status: 404, headers });
  }

  let row;
  try {
    row = await env.DB.prepare(
      `SELECT status, deployed_url, expires_at, datetime('now') AS now
         FROM concept_requests
        WHERE token = ?`
    )
      .bind(token)
      .first<{ status: string; deployed_url: string | null; expires_at: string; now: string }>();
  } catch (e) {
    console.error("concept-status query error:", e);
    return Response.json({ error: "Could not check status." }, { status: 500, headers });
  }

  if (!row) {
    return Response.json({ error: "Not found." }, { status: 404, headers });
  }

  // Server-side expiry check: the cron below is a cleanup convenience, but
  // expiry must be enforced here too or an unrun job leaks live links.
  const expired = new Date(row.expires_at).getTime() < Date.now();

  if (expired && row.status !== 'expired') {
    try {
      await env.DB.prepare(
        `UPDATE concept_requests SET status = 'expired', updated_at = datetime('now')
          WHERE token = ? AND status != 'expired'`
      )
        .bind(token)
        .run();
    } catch (e) {
      console.error("concept-status expire update error:", e);
    }
  }

  const effectiveStatus = expired ? 'expired' : row.status;

  return Response.json(
    {
      status: effectiveStatus,
      previewUrl: effectiveStatus === 'ready' || effectiveStatus === 'sent' ? row.deployed_url : null,
      expired,
    },
    { status: 200, headers }
  );
};

export const onRequestOptions: PagesFunction = async (context) => {
  const origin = context.request.headers.get("Origin") || "";
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
};
