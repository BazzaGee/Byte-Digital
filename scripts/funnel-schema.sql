CREATE TABLE IF NOT EXISTS funnel_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  business_name TEXT,
  category TEXT,
  live_url TEXT,
  choice TEXT NOT NULL CHECK (choice IN ('files', 'redesign')),
  email TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  surface TEXT NOT NULL DEFAULT 'showcase',
  status TEXT NOT NULL DEFAULT 'captured',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_funnel_leads_slug ON funnel_leads (slug);
CREATE INDEX IF NOT EXISTS idx_funnel_leads_email ON funnel_leads (email);
CREATE INDEX IF NOT EXISTS idx_funnel_leads_choice ON funnel_leads (choice);
CREATE INDEX IF NOT EXISTS idx_funnel_leads_created_at ON funnel_leads (created_at);
CREATE INDEX IF NOT EXISTS idx_funnel_leads_surface ON funnel_leads (surface);
