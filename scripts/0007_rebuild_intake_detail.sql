-- Why an auto-build did not go through.
--
-- `intake_status` says failed; this says failed *how*. It was only ever surfaced
-- in the owner notification email, so a failed intake left no trace anywhere
-- queryable — which is exactly what made the first one take a live brief to
-- diagnose (the builder's rescan outran the caller's timeout).

ALTER TABLE rebuild_requests ADD COLUMN intake_detail TEXT;
