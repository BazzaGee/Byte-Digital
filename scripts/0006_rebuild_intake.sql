-- Website intake: what the new-build funnel needs beyond a brief.
--
-- `rebuild_requests` already carries `source` (where the visitor came from).
-- These columns answer a different question — what they actually asked for —
-- and it is the pairing that makes the segmentation work:
--
--   source='site'      + variant='new-build'  = arrived from bytedigital.co.nz
--   source='live'      + variant='rebuild'    = arrived from a site we built
--   source='showcase'  + variant='rebuild'    = arrived from a showcase page
--
-- variant is derived from `source` when the client does not say, so a visitor
-- running stale cached JavaScript still lands in the right bucket.
--
-- scope is computed server-side from `feature_requests` against the server's
-- own allow-lists, never trusted from the client:
--   'standard'     — nothing outside what the free build can produce
--   'custom-build' — they ticked something from the "bigger build" tier

ALTER TABLE rebuild_requests ADD COLUMN variant              TEXT NOT NULL DEFAULT 'rebuild';
ALTER TABLE rebuild_requests ADD COLUMN has_existing_site    TEXT NOT NULL DEFAULT 'not-asked';
ALTER TABLE rebuild_requests ADD COLUMN category             TEXT;
ALTER TABLE rebuild_requests ADD COLUMN site_types           TEXT;
ALTER TABLE rebuild_requests ADD COLUMN feature_requests     TEXT;
ALTER TABLE rebuild_requests ADD COLUMN integration_requests TEXT;
ALTER TABLE rebuild_requests ADD COLUMN requirements_note    TEXT;
ALTER TABLE rebuild_requests ADD COLUMN business_contact     TEXT;
ALTER TABLE rebuild_requests ADD COLUMN utm_source           TEXT;
ALTER TABLE rebuild_requests ADD COLUMN utm_medium           TEXT;
ALTER TABLE rebuild_requests ADD COLUMN utm_campaign         TEXT;
ALTER TABLE rebuild_requests ADD COLUMN scope                TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE rebuild_requests ADD COLUMN intake_status        TEXT;
ALTER TABLE rebuild_requests ADD COLUMN intake_slug          TEXT;

CREATE INDEX IF NOT EXISTS idx_rebuild_requests_variant ON rebuild_requests (variant);
CREATE INDEX IF NOT EXISTS idx_rebuild_requests_scope   ON rebuild_requests (scope);
CREATE INDEX IF NOT EXISTS idx_rebuild_requests_category ON rebuild_requests (category);

-- Historical rows that came in through the main site were shown the new-build
-- wording for none of it and the rebuild wording for all of it — but their ORIGIN
-- is what this column records, so they move. `site` was always the main site.
UPDATE rebuild_requests SET variant = 'new-build' WHERE source = 'site';
