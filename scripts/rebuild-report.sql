-- Segmentation report for rebuild_requests.
--
-- The table answers two questions: where traffic came from (source), and what
-- they actually asked for (variant, category, scope, feature_requests).
-- `feature_requests` holds {"in":[...],"out":[...]} where the "out" half is
-- demand for real software the free build cannot produce.
--
--   wrangler d1 execute bytedigital-funnel --remote --file=scripts/rebuild-report.sql

-- 1. The headline split: origin x intent x scope.
SELECT variant, source, scope, COUNT(*) AS briefs, MAX(created_at) AS latest
FROM rebuild_requests
GROUP BY variant, source, scope
ORDER BY briefs DESC;

-- 2. Volume by day, split by variant — whether the new funnel is growing.
SELECT
  substr(created_at, 1, 10) AS day,
  SUM(CASE WHEN variant = 'new-build' THEN 1 ELSE 0 END) AS new_build,
  SUM(CASE WHEN variant = 'rebuild'   THEN 1 ELSE 0 END) AS rebuild,
  COUNT(*) AS total
FROM rebuild_requests
WHERE created_at >= datetime('now', '-30 days')
GROUP BY day
ORDER BY day DESC;

-- 3. Briefs by business type, and how many of each need the bigger build.
SELECT
  category,
  COUNT(*) AS briefs,
  SUM(CASE WHEN scope = 'custom-build' THEN 1 ELSE 0 END) AS want_more
FROM rebuild_requests
WHERE variant = 'new-build'
GROUP BY category
ORDER BY briefs DESC;

-- 4. Which Tier B capabilities are most wanted — this is the product roadmap.
SELECT je.value AS requested, COUNT(*) AS briefs
FROM rebuild_requests r, json_each(r.feature_requests, '$.out') je
WHERE r.variant = 'new-build'
GROUP BY je.value
ORDER BY briefs DESC;

-- 5. What kind of website they think they need.
SELECT je.value AS site_type, COUNT(*) AS briefs
FROM rebuild_requests r, json_each(r.site_types) je
WHERE r.variant = 'new-build'
GROUP BY je.value
ORDER BY briefs DESC;

-- 6. What they actually need, inside the free build.
SELECT je.value AS capability, COUNT(*) AS briefs
FROM rebuild_requests r, json_each(r.feature_requests, '$.in') je
WHERE r.variant = 'new-build'
GROUP BY je.value
ORDER BY briefs DESC;

-- 7. The existing-site question — how many of these businesses have nothing yet.
SELECT has_existing_site, COUNT(*) AS briefs
FROM rebuild_requests
WHERE variant = 'new-build'
GROUP BY has_existing_site
ORDER BY briefs DESC;

-- 8. Whether the auto-build fired, and where those sites ended up.
SELECT intake_status, COUNT(*) AS briefs, COUNT(intake_slug) AS with_site
FROM rebuild_requests
WHERE variant = 'new-build'
GROUP BY intake_status
ORDER BY briefs DESC;

-- 9. Where visitors came from before they landed.
SELECT
  CASE
    WHEN referrer IS NULL OR referrer = '' THEN '(direct)'
    WHEN referrer LIKE '%google.%'         THEN 'google'
    WHEN referrer LIKE '%facebook.%'
      OR referrer LIKE '%fb.%'             THEN 'facebook'
    WHEN referrer LIKE '%instagram.%'      THEN 'instagram'
    WHEN referrer LIKE '%linkedin.%'       THEN 'linkedin'
    WHEN referrer LIKE '%bytedigital.co.nz%' THEN 'on-site'
    ELSE 'other'
  END AS referrer_group,
  utm_source,
  utm_medium,
  COUNT(*) AS briefs
FROM rebuild_requests
WHERE variant = 'new-build'
GROUP BY referrer_group, utm_source, utm_medium
ORDER BY briefs DESC;

-- 10. The last 20 briefs, for reading rather than counting.
SELECT id, created_at, variant, source, scope, category, has_existing_site,
       business_name, email, intake_status, intake_slug, page_url
FROM rebuild_requests
ORDER BY id DESC
LIMIT 20;
