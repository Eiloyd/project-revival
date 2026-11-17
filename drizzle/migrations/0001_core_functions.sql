SET check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.ack_state_code(_state text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT coalesce(lpad(array_position(ARRAY['andhra pradesh','arunachal pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana','himachal pradesh','jharkhand',
    'karnataka','kerala','madhya pradesh','maharashtra','manipur','meghalaya','mizoram','nagaland','odisha','punjab',
    'rajasthan','sikkim','tamil nadu','telangana','tripura','uttar pradesh','uttarakhand','west bengal',
    'andaman and nicobar islands','chandigarh','dadra and nagar haveli and daman and diu','delhi','jammu and kashmir','ladakh','lakshadweep','puducherry'],
    lower(btrim(coalesce(_state, ''))))::text, 2, '0'), '00')
$function$
;

CREATE OR REPLACE FUNCTION public.admin_import_records(_table text, _rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  _allowed constant text[] := ARRAY['contact_submissions','registration_applications','employees','people_profiles',
    'customer_reports','country_logos','country_programme_fees','prototype_submissions','young_innovators_registrations'];
  _row jsonb; _cols text; _bad text; _n integer; _inserted integer := 0; _skipped integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF _table IS NULL OR NOT (_table = ANY (_allowed)) THEN RAISE EXCEPTION 'This table cannot be imported'; END IF;
  IF jsonb_typeof(_rows) <> 'array' OR jsonb_array_length(_rows) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Provide 1 to 1000 rows'; END IF;
  FOR _row IN SELECT value FROM jsonb_array_elements(_rows) LOOP
    IF jsonb_typeof(_row) <> 'object' OR _row = '{}'::jsonb THEN RAISE EXCEPTION 'Each row must be a non-empty object'; END IF;
    SELECT k INTO _bad FROM jsonb_object_keys(_row) AS k
      WHERE NOT EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = format('public.%I', _table)::regclass
                        AND a.attname = k AND a.attnum > 0 AND NOT a.attisdropped) LIMIT 1;
    IF _bad IS NOT NULL THEN RAISE EXCEPTION 'Unknown column %', _bad; END IF;
    SELECT string_agg(format('%I', k), ', ') INTO _cols FROM jsonb_object_keys(_row) AS k;
    EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1) ON CONFLICT DO NOTHING',
      _table, _cols, _cols, _table) USING _row;
    GET DIAGNOSTICS _n = ROW_COUNT;
    IF _n > 0 THEN _inserted := _inserted + 1; ELSE _skipped := _skipped + 1; END IF;
  END LOOP;
  RETURN jsonb_build_object('inserted', _inserted, 'skipped', _skipped);
END $function$
;

CREATE OR REPLACE FUNCTION public.admin_save_employee(_employee_id text, _code text, _full_name text, _photo_url text, _designation text, _department text, _status text, _valid_until text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE _id text := trim(coalesce(_employee_id, ''));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF _id = '' OR trim(coalesce(_full_name, '')) = '' THEN RAISE EXCEPTION 'Employee ID and name are required'; END IF;
  IF coalesce(_status, 'active') NOT IN ('active', 'inactive') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  IF EXISTS (SELECT 1 FROM public.employees e WHERE upper(e.employee_id) = upper(_id)) THEN
    UPDATE public.employees e SET
      full_name = trim(_full_name),
      photo_url = nullif(trim(coalesce(_photo_url, '')), ''),
      designation = coalesce(_designation, ''),
      department = coalesce(_department, ''),
      status = coalesce(_status, 'active'),
      valid_until = nullif(coalesce(_valid_until, ''), '')::date,
      code_hash = CASE WHEN coalesce(_code, '') <> '' THEN extensions.crypt(_code, extensions.gen_salt('bf', 10)) ELSE e.code_hash END,
      updated_at = now()
    WHERE upper(e.employee_id) = upper(_id);
  ELSE
    IF length(coalesce(_code, '')) < 6 THEN RAISE EXCEPTION 'A verification code of at least 6 characters is required'; END IF;
    INSERT INTO public.employees (employee_id, code_hash, full_name, photo_url, designation, department, status, valid_until)
    VALUES (_id, extensions.crypt(_code, extensions.gen_salt('bf', 10)), trim(_full_name), nullif(trim(coalesce(_photo_url, '')), ''),
      coalesce(_designation, ''), coalesce(_department, ''), coalesce(_status, 'active'), nullif(coalesce(_valid_until, ''), '')::date);
  END IF;
END $function$
;

CREATE OR REPLACE FUNCTION public.admin_setup_metadata()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'tables', coalesce((
      SELECT jsonb_agg(jsonb_build_object('name', c.relname, 'rls', c.relrowsecurity, 'columns', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('name', a.attname, 'type', format_type(a.atttypid, NULL), 'nullable', NOT a.attnotnull) ORDER BY a.attnum), '[]'::jsonb)
        FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped)) ORDER BY c.relname)
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')), '[]'::jsonb),
    'functions', coalesce((SELECT jsonb_agg(DISTINCT p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'), '[]'::jsonb),
    'triggers', coalesce((SELECT jsonb_agg(DISTINCT t.tgname) FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
      JOIN pg_namespace n ON n.oid = p.pronamespace WHERE NOT t.tgisinternal AND n.nspname = 'public'), '[]'::jsonb)
  );
END $function$
;

CREATE OR REPLACE FUNCTION public.assign_education_ack_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _temp text; _paid boolean;
BEGIN
  _paid := NEW.payment_status IN ('reference_submitted', 'paid');
  IF TG_OP = 'INSERT' THEN
    IF coalesce(NEW.ack_number, '') = '' THEN
      IF _paid THEN NEW.ack_number := public.issue_ack_number('01', NEW.state); RETURN NEW; END IF;
      LOOP
        _temp := 'R' || to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYMMDD') || public.ack_state_code(NEW.state)
          || lpad(floor(random() * 10000000)::int::text, 7, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.education_support_registrations WHERE ack_number = _temp OR registration_id = _temp);
      END LOOP;
      NEW.ack_number := _temp;
      RETURN NEW;
    END IF;
  END IF;
  IF _paid AND NEW.ack_number ~ '^[A-Z]' THEN
    NEW.registration_id := NEW.ack_number;
    NEW.ack_number := public.issue_ack_number('01', NEW.state);
    IF TG_OP = 'UPDATE' THEN
      UPDATE public.crm_customers SET acknowledgement = NEW.ack_number WHERE acknowledgement = NEW.registration_id;
    END IF;
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.assign_form_ack_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _form text := TG_ARGV[0]; _state text;
BEGIN
  IF TG_TABLE_NAME IN ('foundation_submissions', 'contact_submissions') THEN
    IF coalesce(NEW.ack_number, '') <> '' THEN RETURN NEW; END IF;
  ELSIF coalesce(NEW.application_code, '') <> '' THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME IN ('registration_applications', 'programme_applications', 'foundation_submissions') THEN
    _state := NEW.details->>'state';
  END IF;
  IF TG_TABLE_NAME IN ('foundation_submissions', 'contact_submissions') THEN
    NEW.ack_number := public.issue_ack_number(_form, _state);
  ELSE
    NEW.application_code := public.issue_ack_number(_form, _state);
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.can_view_people_profiles()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = auth.uid() AND active)
    OR EXISTS (SELECT 1 FROM public.education_staff_access WHERE user_id = auth.uid() AND active)
    OR EXISTS (
      SELECT 1 FROM auth.users u
      JOIN public.registration_applications a ON lower(a.email) = lower(u.email) AND a.status = 'approved'
      WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
    )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('public.claim_first_admin'));
  IF public.first_admin_setup_status() <> 'eligible' THEN
    RAISE EXCEPTION 'First-admin setup is not available for this account' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END $function$
;

CREATE OR REPLACE FUNCTION public.consume_form_submission_limit(_key_hash text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _attempts integer;
BEGIN
  IF _key_hash IS NULL OR length(_key_hash) < 16 THEN RAISE EXCEPTION 'Invalid limiter key'; END IF;
  INSERT INTO public.form_submission_limits AS l (key_hash, window_started_at, attempts) VALUES (_key_hash, now(), 1)
  ON CONFLICT (key_hash) DO UPDATE SET
    attempts = CASE WHEN l.window_started_at < now() - interval '15 minutes' THEN 1 ELSE l.attempts + 1 END,
    window_started_at = CASE WHEN l.window_started_at < now() - interval '15 minutes' THEN now() ELSE l.window_started_at END
  RETURNING attempts INTO _attempts;
  IF random() < 0.01 THEN DELETE FROM public.form_submission_limits WHERE window_started_at < now() - interval '1 day'; END IF;
  RETURN _attempts <= 5;
END $function$
;

CREATE OR REPLACE FUNCTION public.coordinator_name_for_code(_code text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT coalesce(
    (SELECT c.full_name FROM public.coordinators c WHERE c.active AND upper(c.referral_code) = upper(btrim(_code)) LIMIT 1),
    (SELECT p.full_name FROM public.crm_employee_profiles p JOIN public.crm_memberships m ON m.user_id = p.user_id AND m.active
      WHERE upper(p.employee_code) = upper(btrim(_code)) LIMIT 1))
$function$
;

CREATE OR REPLACE FUNCTION public.coordinator_referral_stats()
 RETURNS TABLE(coordinator_id uuid, leads bigint, submitted bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT s.cid, count(*)::bigint, count(*) FILTER (WHERE s.done)::bigint FROM (
    SELECT t.coordinator_id AS cid, true AS done FROM public.contact_submissions t WHERE t.coordinator_id IS NOT NULL
    UNION ALL SELECT t.coordinator_id, true FROM public.registration_applications t WHERE t.coordinator_id IS NOT NULL
    UNION ALL SELECT t.coordinator_id, true FROM public.foundation_submissions t WHERE t.coordinator_id IS NOT NULL
    UNION ALL SELECT t.coordinator_id, t.form_status = 'completed' FROM public.education_support_registrations t WHERE t.coordinator_id IS NOT NULL
    UNION ALL SELECT t.coordinator_id, t.submission_status = 'submitted' FROM public.young_innovators_registrations t WHERE t.coordinator_id IS NOT NULL
    UNION ALL SELECT t.coordinator_id, t.submission_status = 'submitted' FROM public.programme_applications t WHERE t.coordinator_id IS NOT NULL
  ) s GROUP BY s.cid;
END $function$
;

CREATE OR REPLACE FUNCTION public.create_account_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, left(coalesce(nullif(NEW.raw_user_meta_data->>'display_name', ''), nullif(NEW.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(NEW.email, ''), '@', 1)), 100))
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Account profile not created: %', SQLERRM;
  END;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_assign_lead(_lead uuid, _owner uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _role text := public.crm_role(); _current uuid; _customer uuid;
BEGIN
  IF _role IS NULL OR _role NOT IN ('admin', 'BDM') THEN RAISE EXCEPTION 'Only an admin or BDM can reassign leads' USING ERRCODE = '42501'; END IF;
  SELECT owner_id, customer_id INTO _current, _customer FROM public.crm_leads WHERE id = _lead FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  IF _role = 'BDM' AND (NOT public.crm_can_access(_current) OR _owner IS NULL OR NOT public.crm_can_access(_owner)) THEN
    RAISE EXCEPTION 'Lead and employee must be in your team' USING ERRCODE = '42501';
  END IF;
  IF _owner IS NOT NULL AND NOT public.has_role(_owner, 'admin')
     AND NOT EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = _owner AND active) THEN
    RAISE EXCEPTION 'Employee is not active';
  END IF;
  UPDATE public.crm_leads SET owner_id = _owner, updated_at = now() WHERE id = _lead;
  UPDATE public.crm_customers SET owner_id = _owner WHERE id = _customer AND (owner_id IS NULL OR owner_id IS NOT DISTINCT FROM _current);
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_can_access(_owner uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN public.has_role(auth.uid(), 'admin') THEN true
    WHEN _owner IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.crm_memberships me
      WHERE me.user_id = auth.uid() AND me.active
        AND (_owner = auth.uid()
          OR (me.role = 'BDM' AND EXISTS (
                SELECT 1 FROM public.crm_memberships r
                WHERE r.user_id = _owner AND r.manager_id = auth.uid() AND r.active)))
    )
  END
$function$
;

CREATE OR REPLACE FUNCTION public.crm_create_lead(_input jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE _owner uuid := (_input->>'ownerId')::uuid; _customer uuid; _lead uuid; _role text := public.crm_role();
BEGIN
  IF _role IS NULL OR _role = 'support' THEN RAISE EXCEPTION 'Sales access required' USING ERRCODE = '42501'; END IF;
  IF NOT public.has_role(_owner, 'admin') AND NOT EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = _owner AND active) THEN
    RAISE EXCEPTION 'Assigned employee is not active';
  END IF;
  INSERT INTO public.crm_customers (full_name, email, phone, company, acknowledgement, owner_id)
  VALUES (btrim(_input->>'fullName'), btrim(coalesce(_input->>'email', '')), btrim(coalesce(_input->>'phone', '')),
    btrim(coalesce(_input->>'company', '')), nullif(btrim(coalesce(_input->>'acknowledgement', '')), ''), _owner)
  RETURNING id INTO _customer;
  INSERT INTO public.crm_leads (customer_id, title, amount, owner_id, next_follow_up, source)
  VALUES (_customer, btrim(_input->>'title'), coalesce((_input->>'amount')::numeric, 0), _owner,
    nullif(coalesce(_input->>'followUp', ''), '')::date, 'manual')
  RETURNING id INTO _lead;
  RETURN _lead;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_customer_lookup(_reference text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _ref text := upper(btrim(coalesce(_reference, '')));
BEGIN
  IF public.crm_role() IS NULL THEN RAISE EXCEPTION 'CRM access required' USING ERRCODE = '42501'; END IF;
  IF length(_ref) < 6 THEN RETURN '[]'::jsonb; END IF;
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'id', c.id, 'customer_code', c.customer_code, 'full_name', c.full_name, 'company', c.company,
      'acknowledgement', c.acknowledgement,
      'phone_last_4', CASE WHEN length(regexp_replace(c.phone, '\D', '', 'g')) >= 4 THEN right(regexp_replace(c.phone, '\D', '', 'g'), 4) END,
      'latest_stage', (SELECT l.stage FROM public.crm_leads l WHERE l.customer_id = c.id ORDER BY l.created_at DESC LIMIT 1),
      'open_tickets', (SELECT count(*) FROM public.crm_tickets t WHERE t.customer_id = c.id AND t.status <> 'resolved'),
      'created_at', c.created_at))
    FROM public.crm_customers c
    WHERE upper(c.customer_code) = _ref OR upper(coalesce(c.acknowledgement, '')) = _ref
       OR EXISTS (SELECT 1 FROM public.crm_tickets t WHERE t.customer_id = c.id AND upper(t.ticket_code) = _ref)), '[]'::jsonb);
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_import_submission(_id uuid, _kind text, _owner uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _row jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF _owner IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = _owner AND active) THEN
    RAISE EXCEPTION 'Owner must be an active CRM employee';
  END IF;
  _row := CASE _kind
    WHEN 'enquiry' THEN (SELECT to_jsonb(t) FROM public.contact_submissions t WHERE t.id = _id)
    WHEN 'registration' THEN (SELECT to_jsonb(t) FROM public.registration_applications t WHERE t.id = _id)
    WHEN 'education' THEN (SELECT to_jsonb(t) FROM public.education_support_registrations t WHERE t.id = _id)
    WHEN 'foundation' THEN (SELECT to_jsonb(t) FROM public.foundation_submissions t WHERE t.id = _id)
    WHEN 'young_innovators' THEN (SELECT to_jsonb(t) FROM public.young_innovators_registrations t WHERE t.id = _id)
    WHEN 'programme' THEN (SELECT to_jsonb(t) FROM public.programme_applications t WHERE t.id = _id)
  END;
  IF _row IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;
  PERFORM public.crm_submission_lead(_kind, _row, _owner);
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_intake_submission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    PERFORM public.crm_submission_lead(CASE TG_TABLE_NAME
      WHEN 'contact_submissions' THEN 'enquiry'
      WHEN 'registration_applications' THEN 'registration'
      WHEN 'education_support_registrations' THEN 'education'
      WHEN 'foundation_submissions' THEN 'foundation'
      WHEN 'young_innovators_registrations' THEN 'young_innovators'
      WHEN 'programme_applications' THEN 'programme' END, to_jsonb(NEW), NULL);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'CRM intake skipped for %: %', TG_TABLE_NAME, SQLERRM;
  END;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_my_manager()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT m.manager_id FROM public.crm_memberships m WHERE m.user_id = auth.uid() AND m.active
$function$
;

CREATE OR REPLACE FUNCTION public.crm_onboard_member(_user_id uuid, _input jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _role text := _input->>'role'; _manager uuid := nullif(coalesce(_input->>'managerId', ''), '')::uuid;
  _code text := upper(btrim(coalesce(_input->>'employeeCode', '')));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF _user_id IS NULL OR _role IS NULL OR _role NOT IN ('sales', 'support', 'BDE', 'BDM') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF _code = '' OR btrim(coalesce(_input->>'fullName', '')) = '' THEN RAISE EXCEPTION 'Employee code and name are required'; END IF;
  IF _manager IS NOT NULL AND (_manager = _user_id OR NOT EXISTS (
      SELECT 1 FROM public.crm_memberships WHERE user_id = _manager AND active AND role = 'BDM')) THEN
    RAISE EXCEPTION 'Manager must be an active BDM';
  END IF;
  INSERT INTO public.crm_memberships (user_id, role, manager_id, active)
  VALUES (_user_id, _role, _manager, coalesce((_input->>'active')::boolean, true))
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, manager_id = EXCLUDED.manager_id, active = EXCLUDED.active;
  INSERT INTO public.crm_employee_profiles (user_id, employee_code, full_name, phone, designation, photo_url, joining_date)
  VALUES (_user_id, _code, btrim(_input->>'fullName'), btrim(coalesce(_input->>'phone', '')), btrim(coalesce(_input->>'designation', '')),
    nullif(btrim(coalesce(_input->>'photoUrl', '')), ''), coalesce(nullif(coalesce(_input->>'joiningDate', ''), '')::date, current_date))
  ON CONFLICT (user_id) DO UPDATE SET employee_code = EXCLUDED.employee_code, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone,
    designation = EXCLUDED.designation, photo_url = EXCLUDED.photo_url, joining_date = EXCLUDED.joining_date;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_owner_for_code(_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _c text := upper(btrim(coalesce(_code, ''))); _owner uuid;
BEGIN
  IF _c = '' THEN RETURN NULL; END IF;
  SELECT p.user_id INTO _owner FROM public.crm_employee_profiles p
    JOIN public.crm_memberships m ON m.user_id = p.user_id AND m.active
    WHERE upper(p.employee_code) = _c LIMIT 1;
  IF _owner IS NULL THEN
    SELECT s.user_id INTO _owner FROM public.education_staff_access s
      JOIN public.crm_memberships m ON m.user_id = s.user_id AND m.active
      WHERE s.active AND upper(s.referral_code) = _c LIMIT 1;
  END IF;
  RETURN _owner;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN NULL
    WHEN public.has_role(auth.uid(), 'admin') THEN 'admin'
    ELSE (SELECT m.role FROM public.crm_memberships m WHERE m.user_id = auth.uid() AND m.active)
  END
$function$
;

CREATE OR REPLACE FUNCTION public.crm_route_submission(_source text, _source_id uuid, _full_name text, _email text, _phone text, _company text, _title text, _code text, _acknowledgement text, _amount numeric, _owner uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _lead uuid; _customer uuid; _o uuid;
BEGIN
  SELECT id INTO _lead FROM public.crm_leads WHERE source = _source AND source_id = _source_id;
  IF FOUND THEN RETURN _lead; END IF;
  _o := coalesce(_owner, public.crm_owner_for_code(_code));
  IF btrim(coalesce(_email, '')) <> '' THEN
    SELECT id INTO _customer FROM public.crm_customers WHERE lower(email) = lower(btrim(_email)) ORDER BY created_at LIMIT 1;
  END IF;
  IF _customer IS NULL THEN
    INSERT INTO public.crm_customers (full_name, email, phone, company, acknowledgement, owner_id)
    VALUES (left(coalesce(nullif(btrim(_full_name), ''), 'Website visitor'), 200), left(btrim(coalesce(_email, '')), 320),
      left(btrim(coalesce(_phone, '')), 40), left(coalesce(_company, ''), 150), nullif(left(coalesce(_acknowledgement, ''), 60), ''), _o)
    RETURNING id INTO _customer;
  ELSIF _o IS NOT NULL THEN
    UPDATE public.crm_customers SET owner_id = _o WHERE id = _customer AND owner_id IS NULL;
  END IF;
  INSERT INTO public.crm_leads (customer_id, title, amount, source, source_id, owner_id, referral_code)
  VALUES (_customer, left(coalesce(nullif(btrim(_title), ''), 'Website lead'), 200), coalesce(_amount, 0), _source, _source_id, _o,
    nullif(upper(btrim(coalesce(_code, ''))), ''))
  RETURNING id INTO _lead;
  RETURN _lead;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_submission_lead(_kind text, r jsonb, _owner uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE _kind
    WHEN 'enquiry' THEN public.crm_route_submission('enquiry', (r->>'id')::uuid, r->>'name', r->>'email', r->>'phone', '',
      'Enquiry: ' || coalesce(r->>'service', ''), r->>'coordinator_code', NULL, 0, _owner)
    WHEN 'registration' THEN public.crm_route_submission('registration', (r->>'id')::uuid, r->>'full_name', r->>'email', r->>'phone',
      coalesce(r->'details'->>'startupName', r->'details'->>'organization', r->'details'->>'businessName', ''),
      'Registration: ' || coalesce(r->>'category', ''), r->>'coordinator_code', r->>'application_code', 0, _owner)
    WHEN 'education' THEN public.crm_route_submission('education', (r->>'id')::uuid, r->>'student_name', r->>'email', r->>'mobile',
      coalesce(r->>'institution_name', ''), 'Education Support: ' || coalesce(r->>'application_type', ''), r->>'coordinator_code',
      r->>'ack_number', coalesce((r->>'registration_fee')::numeric, 0), _owner)
    WHEN 'foundation' THEN public.crm_route_submission('foundation', (r->>'id')::uuid, r->>'full_name', r->>'email', r->>'phone', '',
      'Foundation: ' || coalesce(r->>'kind', ''), r->>'coordinator_code', NULL, 0, _owner)
    WHEN 'young_innovators' THEN public.crm_route_submission('young_innovators', (r->>'id')::uuid, r->>'guardian_name', r->>'guardian_email',
      r->>'guardian_phone', '', 'Young Innovators: Class ' || coalesce(r->>'school_class', ''), r->>'coordinator_code', r->>'application_code',
      coalesce((r->>'fee_amount')::numeric, 0), _owner)
    WHEN 'programme' THEN public.crm_route_submission('programme', (r->>'id')::uuid, r->>'full_name', r->>'email', r->>'phone', '',
      'Programme: ' || coalesce(r->>'programme', ''), r->>'coordinator_code', r->>'application_code',
      coalesce((r->>'amount_paise')::numeric, 0) / 100, _owner)
    ELSE NULL END;
END $function$
;

CREATE OR REPLACE FUNCTION public.first_admin_setup_status()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _first uuid; _confirmed timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 'closed'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN 'closed'; END IF;
  SELECT u.id INTO _first FROM auth.users u ORDER BY u.created_at, u.id LIMIT 1;
  IF _first IS DISTINCT FROM auth.uid() THEN RETURN 'not_first_account'; END IF;
  SELECT u.email_confirmed_at INTO _confirmed FROM auth.users u WHERE u.id = auth.uid();
  RETURN CASE WHEN _confirmed IS NULL THEN 'unverified' ELSE 'eligible' END;
END $function$
;

CREATE OR REPLACE FUNCTION public.guard_education_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.flags_checked_at IS DISTINCT FROM OLD.flags_checked_at AND NEW.flags_confirmed_at IS NOT DISTINCT FROM OLD.flags_confirmed_at THEN
      NEW.flags_confirmed_at := NULL; NEW.flags_confirmed_by := NULL;
    END IF;
    IF NEW.flags_confirmed_at IS NOT NULL AND NEW.flags_confirmed_at IS DISTINCT FROM OLD.flags_confirmed_at THEN
      IF NEW.flags_checked_at IS NULL THEN RAISE EXCEPTION 'Run the mismatch check first' USING ERRCODE = '23514'; END IF;
      NEW.flags_confirmed_at := now(); NEW.flags_confirmed_by := auth.uid();
    END IF;
    NEW.updated_at := now();
  END IF;
  IF NEW.approval_status = 'approved' AND (TG_OP = 'INSERT' OR OLD.approval_status IS DISTINCT FROM 'approved') THEN
    IF NEW.payment_status <> 'paid' OR NEW.flags_checked_at IS NULL OR NEW.flags_confirmed_at IS NULL THEN
      RAISE EXCEPTION 'Approval needs confirmed payment and a confirmed mismatch check' USING ERRCODE = '23514';
    END IF;
    NEW.approved_at := now(); NEW.approved_by := auth.uid();
  ELSIF NEW.approval_status IS DISTINCT FROM 'approved' THEN
    NEW.approved_at := NULL; NEW.approved_by := NULL;
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$function$
;

CREATE OR REPLACE FUNCTION public.issue_ack_number(_form text, _state text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _serial integer; _initial integer; _table text; _column text; _maximum integer; _name text;
BEGIN
  _name := CASE _form WHEN '01' THEN 'Scholarship' WHEN '02' THEN 'Young Innovators' WHEN '03' THEN 'Funding Programme'
    WHEN '04' THEN 'Foundation' WHEN '05' THEN 'Registration' WHEN '06' THEN 'Enquiry' END;
  IF _name IS NULL THEN RAISE EXCEPTION 'Unknown form code for acknowledgement number'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('acknowledgement:' || _form));
  IF NOT EXISTS (SELECT 1 FROM public.ack_form_counters WHERE form_code = _form) THEN
    _initial := 0;
    FOR _table, _column IN SELECT c.table_name, c.column_name FROM information_schema.columns c WHERE c.table_schema='public' AND c.column_name IN ('ack_number','acknowledgement_number','acknowledgement_no') LOOP
      EXECUTE format('SELECT coalesce(max(right(%1$I,5)::integer),0) FROM public.%2$I WHERE %1$I ~ ''^[0-9]{15}$'' AND substring(%1$I FROM 9 FOR 2) = $1', _column, _table) INTO _maximum USING _form;
      _initial := greatest(_initial, _maximum);
    END LOOP;
    INSERT INTO public.ack_form_counters(form_code, form_name, last_serial) VALUES (_form, _name, _initial) ON CONFLICT (form_code) DO NOTHING;
  END IF;
  UPDATE public.ack_form_counters SET last_serial = last_serial + 1 WHERE form_code = _form AND last_serial < 99999 RETURNING last_serial INTO _serial;
  IF _serial IS NULL THEN RAISE EXCEPTION 'Acknowledgement series exhausted; contact the Foundation team'; END IF;
  RETURN to_char(now() AT TIME ZONE 'Asia/Kolkata','YYMMDD') || public.ack_state_code(_state) || _form || lpad(_serial::text,5,'0');
END $function$
;

CREATE OR REPLACE FUNCTION public.json_text_list(_value jsonb)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE jsonb_typeof(_value)
    WHEN 'array' THEN ARRAY(SELECT public.people_profile_safe_text(x) FROM jsonb_array_elements_text(_value) x WHERE btrim(x) <> '' LIMIT 12)
    WHEN 'string' THEN ARRAY(SELECT public.people_profile_safe_text(x) FROM unnest(string_to_array(_value #>> '{}', ',')) x WHERE btrim(x) <> '' LIMIT 12)
    ELSE '{}'::text[] END
$function$
;

CREATE OR REPLACE FUNCTION public.people_profile_safe_text(_value text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT left(btrim(regexp_replace(regexp_replace(coalesce(_value, ''),
    '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}', '', 'g'),
    '\+?[0-9][0-9 ().-]{7,}[0-9]', '', 'g')), 600)
$function$
;

CREATE OR REPLACE FUNCTION public.queue_drive_document()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.document_path IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.document_path IS DISTINCT FROM OLD.document_path) THEN
    INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind)
    VALUES (TG_TABLE_NAME, NEW.id, 'file')
    ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.queue_sheet_mirror()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind)
  VALUES (TG_TABLE_NAME, NEW.id, 'row')
  ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.requeue_all_google_copies(_include_documents boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _count integer := 0;
  _n integer;
  _t text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  FOREACH _t IN ARRAY ARRAY['contact_submissions','registration_applications','programme_applications','foundation_submissions','young_innovators_registrations','prototype_submissions','crm_leads','programme_payments'] LOOP
    EXECUTE format(
      'INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind) SELECT %L, id, ''row'' FROM public.%I
       ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = ''''', _t, _t);
    GET DIAGNOSTICS _n = ROW_COUNT;
    _count := _count + _n;
  END LOOP;
  IF _include_documents THEN
    INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind)
    SELECT 'registration_applications', id, 'file' FROM public.registration_applications WHERE document_path IS NOT NULL
    ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  END IF;
  RETURN _count;
END $function$
;

CREATE OR REPLACE FUNCTION public.sync_approved_application_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _d jsonb := coalesce(NEW.details, '{}'::jsonb);
  _group text; _name text; _role text; _location text; _focus text[]; _summary text; _slug text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'approved' THEN
    DELETE FROM public.people_profiles WHERE source_application_id = NEW.id;
    RETURN NEW;
  END IF;
  _group := CASE NEW.category WHEN 'investor' THEN 'investors' WHEN 'mentor' THEN 'mentors' WHEN 'startup' THEN 'startups' WHEN 'business' THEN 'businesses' END;
  IF _group IS NULL THEN RETURN NEW; END IF;
  _name := public.people_profile_safe_text(CASE NEW.category
    WHEN 'startup' THEN coalesce(nullif(_d->>'startupName', ''), NEW.full_name)
    WHEN 'business' THEN coalesce(nullif(_d->>'businessName', ''), NEW.full_name)
    ELSE NEW.full_name END);
  _role := public.people_profile_safe_text(CASE NEW.category
    WHEN 'mentor' THEN concat_ws(', ', nullif(_d->>'designation', ''), nullif(_d->>'organization', ''))
    WHEN 'investor' THEN coalesce(_d->>'investmentFocus', '')
    WHEN 'startup' THEN concat_ws(' · ', nullif(_d->>'startupStage', ''), nullif(_d->>'industry', ''))
    ELSE coalesce(_d->>'industry', '') END);
  _location := public.people_profile_safe_text(coalesce(nullif(_d->>'location', ''), nullif(_d->>'headquarter', ''), nullif(_d->>'city', ''), ''));
  _focus := public.json_text_list(coalesce(_d->'supportAreas', _d->'expertise', _d->'interests', _d->'mentorAudience'));
  _summary := public.people_profile_safe_text(coalesce(nullif(_d->>'product', ''), nullif(_d->>'mentorAreas', ''),
    nullif(_d->>'investmentThesis', ''), nullif(_d->>'products', ''), ''));
  _slug := btrim(lower(regexp_replace(coalesce(nullif(_name, ''), 'profile'), '[^a-zA-Z0-9]+', '-', 'g')), '-')
    || '-' || left(replace(NEW.id::text, '-', ''), 6);
  INSERT INTO public.people_profiles (person_group, slug, name, role, location, focus, summary, source_application_id)
  VALUES (_group, _slug, coalesce(nullif(_name, ''), 'Profile'), _role, _location, coalesce(_focus, '{}'), _summary, NEW.id)
  ON CONFLICT (source_application_id) DO UPDATE SET
    person_group = EXCLUDED.person_group, name = EXCLUDED.name, role = EXCLUDED.role,
    location = EXCLUDED.location, focus = EXCLUDED.focus, summary = EXCLUDED.summary;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.verify_employee(_employee_id text, _code text)
 RETURNS TABLE(employee_id text, full_name text, photo_url text, designation text, department text, status text, valid_until date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
#variable_conflict use_column
DECLARE _id text := upper(trim(coalesce(_employee_id, ''))); _e public.employees%ROWTYPE; _ok boolean := false;
BEGIN
  IF (SELECT count(*) FROM public.employee_verification_attempts a
      WHERE a.employee_id = _id AND NOT a.success AND a.created_at > now() - interval '15 minutes') >= 5 THEN
    RAISE EXCEPTION 'too_many_attempts';
  END IF;
  SELECT * INTO _e FROM public.employees e WHERE upper(e.employee_id) = _id;
  IF FOUND AND coalesce(_code, '') <> '' THEN _ok := _e.code_hash = extensions.crypt(_code, _e.code_hash); END IF;
  INSERT INTO public.employee_verification_attempts (employee_id, success) VALUES (_id, _ok);
  IF random() < 0.01 THEN DELETE FROM public.employee_verification_attempts a WHERE a.created_at < now() - interval '7 days'; END IF;
  IF _ok THEN
    RETURN QUERY SELECT _e.employee_id, _e.full_name, _e.photo_url, _e.designation, _e.department, _e.status, _e.valid_until;
  END IF;
END $function$
;
SET check_function_bodies = on;