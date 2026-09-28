-- Free concept funnel.
--
-- `concept_requests` is the private wrapper flow: a visitor asks for a concept
-- site, we generate one, and they get a token-protected, noindex wrapper plus
-- an emailed source bundle.
--
-- The legacy `funnel_leads` table is kept: /websites/ pages still post to
-- /api/websites-funnel. Do not drop it until those pages are retired.

CREATE TABLE IF NOT EXISTS concept_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Unguessable, used for the /c/<token>/ wrapper. This is the only thing
  -- standing between a generated concept and the public internet, so it must be
  -- long and generated from a CSPRNG (see the API).
  token TEXT NOT NULL UNIQUE,

  -- What the visitor asked about.
  business_name TEXT NOT NULL,
  business_url TEXT,
  contact_email TEXT NOT NULL,
  message TEXT,

  -- Where the concept is published. Empty until the build pipeline finishes.
  deployed_url TEXT,

  -- Absolute link the visitor reviews, set once deployed_url is known.
  preview_url TEXT,

  -- Source bundle delivered to the visitor (zip produced by the builder).
  files_sent_at TEXT,

  -- 'requested' -> 'generating' -> 'ready' -> 'sent'
  -- also: 'expired' once older than expires_at
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'generating', 'ready', 'sent', 'expired')),

  -- Free concepts are disposable. 30 days is the window a visitor gets to
  -- review and take the files; after that the wrapper 404s.
  expires_at TEXT NOT NULL,

  -- Consent: the visitor agreed to be emailed about this.
  consent_email INTEGER NOT NULL DEFAULT 0,

  -- Attribution for GA4 reporting.
  source TEXT,
  user_agent TEXT,
  page_url TEXT,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_concept_requests_token ON concept_requests (token);
CREATE INDEX IF NOT EXISTS idx_concept_requests_email ON concept_requests (contact_email);
CREATE INDEX IF NOT EXISTS idx_concept_requests_status ON concept_requests (status);
CREATE INDEX IF NOT EXISTS idx_concept_requests_created_at ON concept_requests (created_at);
CREATE INDEX IF NOT EXISTS idx_concept_requests_expires_at ON concept_requests (expires_at);
