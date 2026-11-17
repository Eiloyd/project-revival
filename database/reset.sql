-- RILOYD website: wipe the website's tables so schema.sql can run on a clean slate.
-- WARNING: deletes every table, row, function and policy in the public schema.
-- Use only on a fresh project or one whose old data you no longer need.
-- Login accounts (auth) and uploaded files (storage buckets/objects) are NOT deleted.

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

-- Old file-access rules from an earlier setup (recreated by schema.sql).
DROP POLICY IF EXISTS "Admins delete country logo files" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete customer report files" ON storage.objects;
DROP POLICY IF EXISTS "Admins read country logo files" ON storage.objects;
DROP POLICY IF EXISTS "Admins read customer report files" ON storage.objects;
DROP POLICY IF EXISTS "Admins read registration documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins replace country logo files" ON storage.objects;
DROP POLICY IF EXISTS "Admins replace customer report files" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload country logo files" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload customer report files" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload hero image files" ON storage.objects;
DROP POLICY IF EXISTS "Admins replace hero image files" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete hero image files" ON storage.objects;

-- Leftover migration history from earlier attempts (safe to remove).
DROP SCHEMA IF EXISTS drizzle CASCADE;
