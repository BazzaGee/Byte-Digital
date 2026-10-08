-- The business-type box added when ten category chips turned out not to cover
-- every business. Stored beside `category` rather than in it: a chip still
-- means a known bucket (and stays queryable), while the visitor who typed their
-- own trade keeps their exact words.
--
-- `category` falls back to 'other' when only the box was filled.

ALTER TABLE rebuild_requests ADD COLUMN category_note TEXT;
