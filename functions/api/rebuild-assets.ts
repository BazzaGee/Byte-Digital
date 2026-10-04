interface Env {
  REBUILD_ASSETS: R2Bucket;
}

const ALLOWED_ORIGINS = [
  "https://bytedigital.co.nz",
  "https://www.bytedigital.co.nz",
  "https://byte-digital.pages.dev",
  "https://staging.byte-digital.pages.dev",
  "http://localhost:4321",
];

const PAGES_DEV_ORIGIN = /^https:\/\/[a-z0-9-]+\.pages\.dev$/;

const MAX_FILES = 6;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;
const MAX_NAME_LENGTH = 100;

/**
 * Uploaded assets are served from the bucket's r2.dev domain. Keys carry a
 * random UUID segment, so a public bucket is still unguessable — the URL in
 * Barry's notification email is the only way to reach a given file.
 */
const PUBLIC_BASE = "https://pub-932dca65c7cb44ecaa58f87c3db67040.r2.dev";

/** Extension -> content type. Anything not in this list is rejected. */
const ALLOWED_EXTENSIONS: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  zip: "application/zip",
};

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

function safeFileName(raw: string): string {
  const base = String(raw || "").split(/[\\/]/).pop() || "";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^[._]+/, "");
  return (cleaned || "file").slice(0, MAX_NAME_LENGTH);
}

function extensionOf(name: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name);
  return match ? match[1].toLowerCase() : "";
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const headers = corsHeaders(request.headers.get("Origin") || "");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "Could not read the upload. Please try again." },
      { status: 400, headers }
    );
  }

  const entries = form
    .getAll("files")
    .filter((entry): entry is File => typeof entry !== "string");

  if (entries.length === 0) {
    return Response.json({ error: "No files were included." }, { status: 400, headers });
  }
  if (entries.length > MAX_FILES) {
    return Response.json(
      { error: `Please upload no more than ${MAX_FILES} files.` },
      { status: 400, headers }
    );
  }

  let total = 0;
  const prepared: Array<{ key: string; name: string; size: number; type: string; data: ArrayBuffer }> = [];

  for (const file of entries) {
    const name = safeFileName(file.name);
    const extension = extensionOf(name);
    const contentType = ALLOWED_EXTENSIONS[extension];

    if (!contentType) {
      return Response.json(
        { error: `"${name}" is not a supported file type. Images, PDFs and ZIPs only.` },
        { status: 400, headers }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return Response.json(
        { error: `"${name}" is larger than 8 MB. Please compress it or send a link instead.` },
        { status: 400, headers }
      );
    }

    total += file.size;
    if (total > MAX_TOTAL_BYTES) {
      return Response.json(
        { error: "Those files add up to more than 40 MB. Please split them or send a link." },
        { status: 400, headers }
      );
    }

    prepared.push({
      key: `rebuild/${crypto.randomUUID()}/${name}`,
      name,
      size: file.size,
      type: contentType,
      data: await file.arrayBuffer(),
    });
  }

  const uploaded: Array<{ key: string; name: string; size: number; type: string; url: string }> = [];

  try {
    for (const file of prepared) {
      await env.REBUILD_ASSETS.put(file.key, file.data, {
        httpMetadata: { contentType: file.type },
        customMetadata: { originalName: file.name },
      });
      uploaded.push({
        key: file.key,
        name: file.name,
        size: file.size,
        type: file.type,
        url: `${PUBLIC_BASE}/${file.key}`,
      });
    }
  } catch (e) {
    console.error("R2 upload error:", e);
    return Response.json(
      { error: "The upload failed on my side. Please try again." },
      { status: 500, headers }
    );
  }

  return Response.json({ success: true, files: uploaded }, { status: 200, headers });
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
