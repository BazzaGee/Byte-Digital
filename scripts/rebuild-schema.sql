-- Website rebuild intake: one row per completed /rebuild/ brief.
--
-- This is a separate funnel from funnel_leads. funnel_leads rows are
-- one-field email captures from the popups; this table holds the full
-- multi-step brief (services, USP, design wishes, uploaded assets).
--
-- source records the traffic bucket:
--   'live'     = arrived from a builder-made website (slug + current_website set)
--   'showcase' = arrived from a Byte Digital showcase detail popup
--   'site'     = organic arrival from a Byte Digital call to action

CREATE TABLE IF NOT EXISTS rebuild_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'site' CHECK (source IN ('live', 'showcase', 'site')),
  slug TEXT,
  business_name TEXT,
  current_website TEXT,
  services TEXT,
  services_other TEXT,
  usp TEXT,
  design_wishes TEXT,
  assets TEXT,
  asset_link TEXT,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  consent INTEGER NOT NULL DEFAULT 0,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rebuild_requests_source ON rebuild_requests (source);
CREATE INDEX IF NOT EXISTS idx_rebuild_requests_email ON rebuild_requests (email);
CREATE INDEX IF NOT EXISTS idx_rebuild_requests_created_at ON rebuild_requests (created_at);
