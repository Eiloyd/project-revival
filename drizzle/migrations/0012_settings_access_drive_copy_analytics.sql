DROP POLICY IF EXISTS "Signed-in users read commission rates" ON public.volunteer_form_commissions;
CREATE POLICY "Staff and volunteers read commission rates" ON public.volunteer_form_commissions
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()) OR public.is_linked_volunteer(auth.uid(), false));

DROP POLICY IF EXISTS "Signed-in users read volunteer settings" ON public.volunteer_settings;
CREATE POLICY "Staff and volunteers read volunteer settings" ON public.volunteer_settings
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()) OR public.is_linked_volunteer(auth.uid(), false));

DROP POLICY IF EXISTS stages_read ON public.funding_stages;
CREATE POLICY stages_read ON public.funding_stages
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()) OR public.venture_is_juror()
    OR EXISTS (SELECT 1 FROM public.venture_clients c WHERE c.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS recon_read ON public.request_routes;
CREATE POLICY recon_read ON public.request_routes
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()) OR public.is_linked_volunteer(auth.uid(), false));

DROP POLICY IF EXISTS recon_read ON public.leave_policies;
CREATE POLICY recon_read ON public.leave_policies
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()) OR public.is_linked_volunteer(auth.uid(), false));

CREATE TABLE public.uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  object_path text NOT NULL,
  section text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  size_bytes bigint NOT NULL DEFAULT 0,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'copied', 'failed', 'too_large')),
  drive_file_id text,
  drive_link text,
  attempts integer NOT NULL DEFAULT 0,
  last_error text NOT NULL DEFAULT '',
  copied_at timestamptz,
  UNIQUE (bucket, object_path)
);

GRANT SELECT ON public.uploaded_files TO authenticated;
GRANT ALL ON public.uploaded_files TO service_role;

ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read uploaded file copies" ON public.uploaded_files
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX uploaded_files_waiting_idx ON public.uploaded_files (status, uploaded_at);

CREATE OR REPLACE FUNCTION public.queue_new_uploaded_files()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _added integer;
BEGIN
  INSERT INTO public.uploaded_files (bucket, object_path, section, file_name, file_type, size_bytes, uploaded_at)
  SELECT o.bucket_id, o.name,
    CASE o.bucket_id
      WHEN 'customer-reports' THEN 'Customer reports'
      WHEN 'request-files' THEN 'Request attachments'
      WHEN 'hr-resumes' THEN 'HR resumes'
      WHEN 'venture-docs' THEN 'Business funding documents'
      WHEN 'finance-proofs' THEN 'Finance proofs'
      WHEN 'crm-docs' THEN 'CRM documents'
      WHEN 'manpower-files' THEN 'Manpower files'
    END,
    regexp_replace(o.name, '^.*/', ''),
    coalesce(o.metadata->>'mimetype', ''),
    coalesce(nullif(o.metadata->>'size', '')::bigint, 0),
    coalesce(o.created_at, now())
  FROM storage.objects o
  WHERE o.bucket_id IN ('customer-reports', 'request-files', 'hr-resumes', 'venture-docs', 'finance-proofs', 'crm-docs', 'manpower-files')
    AND o.name NOT LIKE '%.emptyFolderPlaceholder'
  ON CONFLICT (bucket, object_path) DO NOTHING;
  GET DIAGNOSTICS _added = ROW_COUNT;
  RETURN _added;
END $$;

REVOKE EXECUTE ON FUNCTION public.queue_new_uploaded_files() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_new_uploaded_files() TO service_role;

CREATE TRIGGER uploaded_files_sheet_copy
  AFTER INSERT OR UPDATE OF status, drive_link ON public.uploaded_files
  FOR EACH ROW EXECUTE FUNCTION public.queue_sheet_mirror();

CREATE OR REPLACE FUNCTION public.requeue_all_google_copies(_include_documents boolean DEFAULT false)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer := 0;
  _n integer;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind) SELECT 'contact_submissions', id, 'row' FROM public.contact_submissions
  ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  GET DIAGNOSTICS _n = ROW_COUNT; _count := _count + _n;

  INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind) SELECT 'registration_applications', id, 'row' FROM public.registration_applications
  ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  GET DIAGNOSTICS _n = ROW_COUNT; _count := _count + _n;

  INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind) SELECT 'programme_applications', id, 'row' FROM public.programme_applications
  ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  GET DIAGNOSTICS _n = ROW_COUNT; _count := _count + _n;

  INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind) SELECT 'foundation_submissions', id, 'row' FROM public.foundation_submissions
  ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  GET DIAGNOSTICS _n = ROW_COUNT; _count := _count + _n;

  INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind) SELECT 'young_innovators_registrations', id, 'row' FROM public.young_innovators_registrations
  ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  GET DIAGNOSTICS _n = ROW_COUNT; _count := _count + _n;

  INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind) SELECT 'prototype_submissions', id, 'row' FROM public.prototype_submissions
  ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  GET DIAGNOSTICS _n = ROW_COUNT; _count := _count + _n;

  INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind) SELECT 'crm_leads', id, 'row' FROM public.crm_leads
  ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  GET DIAGNOSTICS _n = ROW_COUNT; _count := _count + _n;

  INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind) SELECT 'programme_payments', id, 'row' FROM public.programme_payments
  ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  GET DIAGNOSTICS _n = ROW_COUNT; _count := _count + _n;

  INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind) SELECT 'uploaded_files', id, 'row' FROM public.uploaded_files
  ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  GET DIAGNOSTICS _n = ROW_COUNT; _count := _count + _n;

  IF _include_documents THEN
    INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind)
    SELECT 'registration_applications', id, 'file' FROM public.registration_applications WHERE document_path IS NOT NULL
    ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
    UPDATE public.uploaded_files SET status = 'waiting', attempts = 0, last_error = '' WHERE status = 'failed';
  END IF;
  RETURN _count;
END $$;

REVOKE EXECUTE ON FUNCTION public.requeue_all_google_copies(boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.requeue_all_google_copies(boolean) TO service_role;

CREATE TABLE public.site_page_views (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id text NOT NULL CHECK (length(session_id) <= 64),
  path text NOT NULL CHECK (length(path) <= 300),
  referrer_host text CHECK (length(referrer_host) <= 200),
  source text NOT NULL DEFAULT 'direct' CHECK (length(source) <= 40),
  device text CHECK (length(device) <= 20),
  browser text CHECK (length(browser) <= 40),
  os text CHECK (length(os) <= 40),
  country text CHECK (length(country) <= 8),
  load_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_page_views_created_idx ON public.site_page_views (created_at DESC);
CREATE TABLE public.site_errors (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id text CHECK (length(session_id) <= 64),
  path text NOT NULL CHECK (length(path) <= 300),
  kind text NOT NULL CHECK (length(kind) <= 40),
  name text CHECK (length(name) <= 120),
  message text NOT NULL CHECK (length(message) <= 600),
  source text CHECK (length(source) <= 300),
  browser text CHECK (length(browser) <= 40),
  device text CHECK (length(device) <= 20),
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_errors_created_idx ON public.site_errors (created_at DESC);
GRANT SELECT ON public.site_page_views TO authenticated;
GRANT SELECT, UPDATE ON public.site_errors TO authenticated;
GRANT ALL ON public.site_page_views, public.site_errors TO service_role;
ALTER TABLE public.site_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read page views" ON public.site_page_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins read errors" ON public.site_errors FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins mark errors" ON public.site_errors FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS finance_proofs_read ON storage.objects;
CREATE POLICY finance_proofs_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'finance-proofs' AND public.fin_access());
DROP POLICY IF EXISTS finance_proofs_insert ON storage.objects;
CREATE POLICY finance_proofs_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'finance-proofs' AND public.fin_access() AND name NOT LIKE '%..%');
DROP POLICY IF EXISTS manpower_files_read ON storage.objects;
CREATE POLICY manpower_files_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'manpower-files' AND public.venture_can_work(public.venture_folder_client(name)));
DROP POLICY IF EXISTS manpower_files_insert ON storage.objects;
CREATE POLICY manpower_files_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'manpower-files' AND public.venture_can_work(public.venture_folder_client(name)));
DROP POLICY IF EXISTS manpower_files_delete ON storage.objects;
CREATE POLICY manpower_files_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'manpower-files' AND public.venture_can_work(public.venture_folder_client(name)));