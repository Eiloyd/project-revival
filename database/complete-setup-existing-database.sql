-- RILOYD: ONE-FILE SETUP for an EXISTING Supabase database (keeps all current data).
-- Paste the whole file in Supabase -> SQL Editor and press Run. Safe to run again.
-- Before running: Database -> Extensions -> enable pg_cron (optional, for 20-minute reminders).
-- Do NOT run reset.sql or seed.sql on a database with data.

-- ===== 0) Helper used by sales pay rules =====
CREATE OR REPLACE FUNCTION public.hr_or_finance()
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $hf$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF public.has_role(auth.uid(), 'admin') THEN RETURN true; END IF;
  IF to_regclass('public.department_staff') IS NOT NULL THEN
    RETURN EXISTS (SELECT 1 FROM public.department_staff WHERE user_id = auth.uid() AND active AND department IN ('hr','finance','accounts'));
  END IF;
  RETURN false;
END $hf$;
REVOKE ALL ON FUNCTION public.hr_or_finance() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hr_or_finance() TO authenticated, service_role;

-- Re-runs: mark this run as an approved owner setup so the 2-admin settings guard lets it through.
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"service_role"}',true);
DO $pre$ BEGIN
  IF to_regclass('public.c_critical_write_context') IS NOT NULL THEN
    INSERT INTO public.c_critical_write_context(tx,actor) VALUES (txid_current(),'00000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  END IF;
END $pre$;

-- ===== 0003_volunteer_programme =====
INSERT INTO public.ack_form_counters (form_code, form_name, last_serial) VALUES
  ('01', 'Scholarship', 0),
  ('02', 'Young Innovators', 0),
  ('03', 'Funding Programme', 0),
  ('04', 'Foundation', 0),
  ('05', 'Registration', 0),
  ('06', 'Enquiry', 0)
ON CONFLICT (form_code) DO NOTHING;

DELETE FROM public.hero_images WHERE theme = 'festive';
ALTER TABLE public.hero_images DROP CONSTRAINT IF EXISTS hero_images_theme_check;
ALTER TABLE public.hero_images ADD CONSTRAINT hero_images_theme_check CHECK (theme IN ('dark', 'light'));

CREATE OR REPLACE FUNCTION public.is_active_employee(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _uid IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.education_staff_access s WHERE s.user_id = _uid AND s.active)
    OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = _uid AND m.active))
$$;

CREATE SEQUENCE IF NOT EXISTS public.volunteer_number_seq;
CREATE SEQUENCE IF NOT EXISTS public.volunteer_withdrawal_seq;
CREATE SEQUENCE IF NOT EXISTS public.volunteer_ticket_seq;

CREATE TABLE IF NOT EXISTS public.volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_code text NOT NULL UNIQUE DEFAULT ('VOL-' || lpad(nextval('public.volunteer_number_seq')::text, 5, '0')),
  referral_code text NOT NULL UNIQUE DEFAULT ('V' || upper(substr(md5(gen_random_uuid()::text), 1, 7))),
  employee_id uuid NOT NULL,
  user_id uuid UNIQUE,
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 120),
  mobile text NOT NULL CHECK (mobile ~ '^[6-9][0-9]{9}$'),
  email text NOT NULL CHECK (char_length(email) <= 254 AND email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  date_of_birth date,
  gender text NOT NULL DEFAULT '' CHECK (gender IN ('', 'female', 'male', 'other')),
  address text NOT NULL DEFAULT '' CHECK (char_length(address) <= 400),
  state text NOT NULL DEFAULT '' CHECK (char_length(state) <= 80),
  district text NOT NULL DEFAULT '' CHECK (char_length(district) <= 80),
  qualification text NOT NULL DEFAULT '' CHECK (char_length(qualification) <= 120),
  photo_path text CHECK (photo_path IS NULL OR char_length(photo_path) <= 300),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  kyc_status text NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')),
  kyc_note text NOT NULL DEFAULT '' CHECK (char_length(kyc_note) <= 300),
  commission_percent numeric(4,2) CHECK (commission_percent IS NULL OR (commission_percent >= 0 AND commission_percent <= 10)),
  monthly_target integer NOT NULL DEFAULT 0 CHECK (monthly_target BETWEEN 0 AND 100000),
  payout_method text CHECK (payout_method IN ('upi', 'bank')),
  payout_masked text NOT NULL DEFAULT '',
  activated_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS volunteers_email_key ON public.volunteers (lower(email));
CREATE INDEX IF NOT EXISTS volunteers_employee_id ON public.volunteers (employee_id);

CREATE TABLE IF NOT EXISTS public.volunteer_payout_details (
  volunteer_id uuid PRIMARY KEY REFERENCES public.volunteers(id) ON DELETE CASCADE,
  upi_id text NOT NULL DEFAULT '',
  account_holder text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  ifsc text NOT NULL DEFAULT '',
  bank_name text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.volunteer_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  max_percent numeric(4,2) NOT NULL DEFAULT 10 CHECK (max_percent >= 0 AND max_percent <= 10),
  min_withdrawal integer NOT NULL DEFAULT 3000 CHECK (min_withdrawal BETWEEN 1 AND 1000000),
  payout_note text NOT NULL DEFAULT '' CHECK (char_length(payout_note) <= 300),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.volunteer_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.volunteer_form_commissions (
  form_key text PRIMARY KEY CHECK (form_key IN ('education', 'young_innovators')),
  label text NOT NULL,
  percent numeric(4,2) NOT NULL DEFAULT 10 CHECK (percent >= 0 AND percent <= 10),
  flat_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (flat_amount >= 0 AND flat_amount <= 100000),
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.volunteer_form_commissions (form_key, label) VALUES
  ('education', 'Student Scholarship & Sponsorship'), ('young_innovators', 'Young Innovators 2026')
ON CONFLICT (form_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.volunteer_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL REFERENCES public.volunteers(id) ON DELETE RESTRICT,
  form_key text NOT NULL,
  source_id uuid NOT NULL,
  application_code text NOT NULL DEFAULT '',
  fee_amount numeric(12,2) NOT NULL DEFAULT 0,
  percent numeric(4,2) NOT NULL DEFAULT 0,
  flat_amount numeric(10,2) NOT NULL DEFAULT 0,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'reversed')),
  credited_at timestamptz,
  reversed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_key, source_id)
);
CREATE INDEX IF NOT EXISTS volunteer_commissions_volunteer ON public.volunteer_commissions (volunteer_id);

CREATE TABLE IF NOT EXISTS public.volunteer_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text NOT NULL UNIQUE DEFAULT ('WD-' || lpad(nextval('public.volunteer_withdrawal_seq')::text, 6, '0')),
  volunteer_id uuid NOT NULL REFERENCES public.volunteers(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('upi', 'bank')),
  payout_masked text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'rejected')),
  transaction_id text NOT NULL DEFAULT '' CHECK (char_length(transaction_id) <= 80),
  rejection_reason text NOT NULL DEFAULT '' CHECK (char_length(rejection_reason) <= 300),
  escalated_at timestamptz,
  escalation_note text NOT NULL DEFAULT '' CHECK (char_length(escalation_note) <= 300),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  paid_at timestamptz,
  updated_by uuid
);
CREATE INDEX IF NOT EXISTS volunteer_withdrawals_volunteer ON public.volunteer_withdrawals (volunteer_id);

CREATE TABLE IF NOT EXISTS public.volunteer_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE DEFAULT ('VT-' || lpad(nextval('public.volunteer_ticket_seq')::text, 6, '0')),
  volunteer_id uuid NOT NULL REFERENCES public.volunteers(id) ON DELETE RESTRICT,
  category text NOT NULL CHECK (category IN ('application', 'commission', 'withdrawal', 'bank', 'login', 'technical', 'general')),
  subject text NOT NULL CHECK (char_length(btrim(subject)) BETWEEN 3 AND 150),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'resolved', 'reopened')),
  escalated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS volunteer_tickets_volunteer ON public.volunteer_tickets (volunteer_id);

CREATE TABLE IF NOT EXISTS public.volunteer_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.volunteer_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_role text NOT NULL CHECK (author_role IN ('volunteer', 'employee', 'admin')),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 3000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS volunteer_ticket_messages_ticket ON public.volunteer_ticket_messages (ticket_id);

CREATE TABLE IF NOT EXISTS public.volunteer_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
  sender_id uuid,
  kind text NOT NULL CHECK (kind IN ('message', 'announcement', 'status')),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 150),
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 2000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS volunteer_notices_volunteer ON public.volunteer_notices (volunteer_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.volunteer_access(_volunteer uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL OR _volunteer IS NULL THEN NULL
    WHEN public.has_role(auth.uid(), 'admin') THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.volunteers v WHERE v.id = _volunteer AND v.user_id = auth.uid()) THEN 'self'
    WHEN EXISTS (SELECT 1 FROM public.volunteers v WHERE v.id = _volunteer AND v.employee_id = auth.uid())
      AND public.is_active_employee(auth.uid()) THEN 'employee'
    ELSE NULL END
$$;

CREATE OR REPLACE FUNCTION public.volunteer_folder_access(_name text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN split_part(coalesce(_name, ''), '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN public.volunteer_access(split_part(_name, '/', 1)::uuid) END
$$;

CREATE OR REPLACE FUNCTION public.volunteer_notify(_volunteer uuid, _kind text, _title text, _body text, _sender uuid DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.volunteer_notices (volunteer_id, sender_id, kind, title, body)
  VALUES (_volunteer, _sender, _kind, left(_title, 150), left(coalesce(_body, ''), 2000))
$$;

CREATE OR REPLACE FUNCTION public.volunteer_available_balance(_volunteer uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT sum(amount) FROM public.volunteer_commissions WHERE volunteer_id = _volunteer AND status = 'credited'), 0)
       - coalesce((SELECT sum(amount) FROM public.volunteer_withdrawals WHERE volunteer_id = _volunteer AND status IN ('pending', 'processing', 'paid')), 0)
$$;

CREATE OR REPLACE FUNCTION public.volunteers_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE _admin boolean := current_user IN ('postgres', 'service_role', 'supabase_admin') OR coalesce(public.has_role(auth.uid(), 'admin'), false); _max numeric; _system boolean := coalesce(current_setting('riloyd.volunteer_system', true), '') = 'on';
BEGIN
  SELECT max_percent INTO _max FROM public.volunteer_settings WHERE id;
  IF NEW.commission_percent IS NOT NULL AND NEW.commission_percent > coalesce(_max, 10) THEN
    RAISE EXCEPTION 'Commission can be at most % percent', coalesce(_max, 10) USING ERRCODE = '22023';
  END IF;
  NEW.email := lower(btrim(NEW.email)); NEW.full_name := btrim(NEW.full_name);
  IF TG_OP = 'INSERT' THEN
    NEW.user_id := NULL; NEW.activated_at := NULL; NEW.last_login_at := NULL; NEW.payout_method := NULL; NEW.payout_masked := '';
    IF NOT _admin THEN NEW.kyc_status := CASE WHEN NEW.kyc_status = 'submitted' THEN 'submitted' ELSE 'pending' END; NEW.kyc_note := ''; NEW.commission_percent := NULL; END IF;
    NEW.created_at := now(); NEW.updated_at := now();
    RETURN NEW;
  END IF;
  IF NEW.employee_id IS DISTINCT FROM OLD.employee_id OR NEW.volunteer_code IS DISTINCT FROM OLD.volunteer_code
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Volunteer ID, referral code and owning employee cannot be changed' USING ERRCODE = '42501';
  END IF;
  IF NOT _system THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.activated_at IS DISTINCT FROM OLD.activated_at
       OR NEW.last_login_at IS DISTINCT FROM OLD.last_login_at OR NEW.payout_method IS DISTINCT FROM OLD.payout_method
       OR NEW.payout_masked IS DISTINCT FROM OLD.payout_masked THEN
      RAISE EXCEPTION 'These details are updated automatically' USING ERRCODE = '42501';
    END IF;
    IF NOT _admin THEN
      IF NEW.kyc_note IS DISTINCT FROM OLD.kyc_note OR (NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
         AND NOT (NEW.kyc_status = 'submitted' AND OLD.kyc_status IN ('pending', 'rejected'))) THEN
        RAISE EXCEPTION 'Only an admin can verify or reject KYC' USING ERRCODE = '42501';
      END IF;
      IF NEW.commission_percent IS DISTINCT FROM OLD.commission_percent THEN
        RAISE EXCEPTION 'Only an admin can change a commission rate' USING ERRCODE = '42501';
      END IF;
      IF NEW.email IS DISTINCT FROM OLD.email AND OLD.user_id IS NOT NULL THEN
        RAISE EXCEPTION 'Only an admin can change the login email of an activated volunteer' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS volunteers_guard ON public.volunteers;
DROP TRIGGER IF EXISTS volunteers_guard ON public.volunteers;
CREATE TRIGGER volunteers_guard BEFORE INSERT OR UPDATE ON public.volunteers FOR EACH ROW EXECUTE FUNCTION public.volunteers_guard();

CREATE OR REPLACE FUNCTION public.volunteer_sync_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _r jsonb := to_jsonb(NEW); _code text := upper(btrim(coalesce(NEW.coordinator_code, '')));
  _v public.volunteers%ROWTYPE; _rule public.volunteer_form_commissions%ROWTYPE; _old public.volunteer_commissions%ROWTYPE;
  _max numeric; _form text; _fee numeric; _app text; _eligible boolean; _credit boolean; _reverse boolean; _pct numeric; _amount numeric;
BEGIN
  IF _code = '' THEN RETURN NEW; END IF;
  SELECT * INTO _v FROM public.volunteers WHERE referral_code = _code;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'education_support_registrations' THEN
    _form := 'education'; _fee := coalesce((_r->>'registration_fee')::numeric, 0);
    _app := coalesce(nullif(_r->>'registration_id', ''), nullif(_r->>'ack_number', ''), '');
    _eligible := _r->>'form_status' = 'completed' OR _r->>'payment_status' IN ('reference_submitted', 'paid');
    _credit := _r->>'payment_status' = 'paid' AND _r->>'status' IN ('verified', 'eligible', 'not_eligible', 'selected', 'not_selected');
    _reverse := _r->>'payment_status' = 'failed';
  ELSE
    _form := 'young_innovators'; _fee := coalesce((_r->>'fee_amount')::numeric, 0); _app := coalesce(_r->>'application_code', '');
    _eligible := _r->>'submission_status' = 'submitted';
    _credit := _r->>'status' = 'approved';
    _reverse := _r->>'status' = 'rejected';
  END IF;
  SELECT * INTO _old FROM public.volunteer_commissions WHERE form_key = _form AND source_id = (_r->>'id')::uuid FOR UPDATE;
  IF NOT FOUND THEN
    IF NOT (_eligible OR _credit) OR _v.status <> 'active' THEN RETURN NEW; END IF;
    SELECT * INTO _rule FROM public.volunteer_form_commissions WHERE form_key = _form AND active;
    IF NOT FOUND THEN RETURN NEW; END IF;
    SELECT max_percent INTO _max FROM public.volunteer_settings WHERE id;
    _pct := least(coalesce(_v.commission_percent, _rule.percent), coalesce(_max, 10));
    _amount := round(greatest(_fee, 0) * _pct / 100 + _rule.flat_amount, 2);
    INSERT INTO public.volunteer_commissions (volunteer_id, form_key, source_id, application_code, fee_amount, percent, flat_amount, amount, status, credited_at, reversed_at)
    VALUES (_v.id, _form, (_r->>'id')::uuid, _app, greatest(_fee, 0), _pct, _rule.flat_amount, _amount,
      CASE WHEN _reverse THEN 'reversed' WHEN _credit THEN 'credited' ELSE 'pending' END,
      CASE WHEN _credit AND NOT _reverse THEN now() END, CASE WHEN _reverse THEN now() END);
    PERFORM public.volunteer_notify(_v.id, 'status',
      CASE WHEN _credit AND NOT _reverse THEN 'Commission credited: ₹' || _amount ELSE 'New referred form received' END,
      coalesce(nullif(_app, ''), 'A form') || ' was submitted with your referral code.');
    RETURN NEW;
  END IF;
  IF _old.status = 'pending' AND _reverse THEN
    UPDATE public.volunteer_commissions SET status = 'reversed', reversed_at = now(), updated_at = now(), application_code = _app WHERE id = _old.id;
    PERFORM public.volunteer_notify(_v.id, 'status', 'Commission not payable: ' || coalesce(nullif(_app, ''), 'form'), 'The referred form was not completed successfully (for example, the payment failed).');
  ELSIF _old.status IN ('pending', 'reversed') AND _credit AND NOT _reverse THEN
    _amount := round(greatest(_fee, 0) * _old.percent / 100 + _old.flat_amount, 2);
    UPDATE public.volunteer_commissions SET status = 'credited', credited_at = now(), reversed_at = NULL, amount = _amount,
      fee_amount = greatest(_fee, 0), application_code = _app, updated_at = now() WHERE id = _old.id;
    PERFORM public.volunteer_notify(_v.id, 'status', 'Commission credited: ₹' || _amount, coalesce(nullif(_app, ''), 'Your referred form') || ' was verified.');
  ELSIF _old.application_code IS DISTINCT FROM _app THEN
    UPDATE public.volunteer_commissions SET application_code = _app, updated_at = now() WHERE id = _old.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS volunteer_commission_education ON public.education_support_registrations;
CREATE TRIGGER volunteer_commission_education AFTER INSERT OR UPDATE OF coordinator_code, form_status, payment_status, status, registration_fee, ack_number, registration_id
  ON public.education_support_registrations FOR EACH ROW EXECUTE FUNCTION public.volunteer_sync_commission();
DROP TRIGGER IF EXISTS volunteer_commission_young ON public.young_innovators_registrations;
CREATE TRIGGER volunteer_commission_young AFTER INSERT OR UPDATE OF coordinator_code, submission_status, status, fee_amount, application_code
  ON public.young_innovators_registrations FOR EACH ROW EXECUTE FUNCTION public.volunteer_sync_commission();

CREATE OR REPLACE FUNCTION public.volunteer_claim_account()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text; _confirmed timestamptz; _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in first' USING ERRCODE = '42501'; END IF;
  SELECT id INTO _id FROM public.volunteers WHERE user_id = auth.uid();
  IF FOUND THEN RETURN _id; END IF;
  SELECT lower(email), email_confirmed_at INTO _email, _confirmed FROM auth.users WHERE id = auth.uid();
  IF _confirmed IS NULL THEN RAISE EXCEPTION 'Please verify your email first' USING ERRCODE = '42501'; END IF;
  PERFORM set_config('riloyd.volunteer_system', 'on', true);
  UPDATE public.volunteers SET user_id = auth.uid(), activated_at = now(), last_login_at = now()
    WHERE lower(email) = _email AND user_id IS NULL AND status = 'active' AND employee_id <> auth.uid()
    RETURNING id INTO _id;
  PERFORM set_config('riloyd.volunteer_system', 'off', true);
  IF _id IS NULL THEN RAISE EXCEPTION 'No active volunteer registration was found for this email. Ask your employee to check it.' USING ERRCODE = 'P0002'; END IF;
  PERFORM public.volunteer_notify(_id, 'status', 'Welcome to the RILOYD volunteer programme', 'Your volunteer account is active. Share your referral link to get started.');
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_submit_kyc()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in first' USING ERRCODE = '42501'; END IF;
  UPDATE public.volunteers SET kyc_status = 'submitted' WHERE user_id = auth.uid() AND kyc_status IN ('pending', 'rejected');
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_touch_login()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM set_config('riloyd.volunteer_system', 'on', true);
  UPDATE public.volunteers SET last_login_at = now() WHERE user_id = auth.uid() AND auth.uid() IS NOT NULL;
  PERFORM set_config('riloyd.volunteer_system', 'off', true);
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_set_payout(_volunteer uuid, _upi text, _holder text, _account text, _ifsc text, _bank text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _access text := public.volunteer_access(_volunteer); _u text := btrim(coalesce(_upi, '')); _h text := btrim(coalesce(_holder, ''));
  _a text := regexp_replace(coalesce(_account, ''), '\s', '', 'g'); _i text := upper(btrim(coalesce(_ifsc, ''))); _b text := btrim(coalesce(_bank, ''));
  _mask text := '';
BEGIN
  IF _access IS NULL THEN RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501'; END IF;
  IF _access = 'employee' AND EXISTS (SELECT 1 FROM public.volunteer_payout_details WHERE volunteer_id = _volunteer) THEN
    RAISE EXCEPTION 'Payout details can now be changed only by the volunteer or an admin' USING ERRCODE = '42501';
  END IF;
  IF _u = '' AND _a = '' THEN RAISE EXCEPTION 'Enter a UPI ID or bank account' USING ERRCODE = '22023'; END IF;
  IF _u <> '' AND _u !~ '^[A-Za-z0-9._-]{2,64}@[A-Za-z0-9.-]{2,64}$' THEN RAISE EXCEPTION 'Enter a valid UPI ID (for example name@bank)' USING ERRCODE = '22023'; END IF;
  IF _a <> '' AND (_a !~ '^[0-9]{9,18}$' OR _i !~ '^[A-Z]{4}0[A-Z0-9]{6}$' OR char_length(_h) < 2 OR char_length(_h) > 120 OR char_length(_b) > 120) THEN
    RAISE EXCEPTION 'Enter the account holder name, a 9-18 digit account number and a valid IFSC code' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.volunteer_payout_details (volunteer_id, upi_id, account_holder, account_number, ifsc, bank_name, updated_at, updated_by)
  VALUES (_volunteer, _u, CASE WHEN _a = '' THEN '' ELSE _h END, _a, CASE WHEN _a = '' THEN '' ELSE _i END, CASE WHEN _a = '' THEN '' ELSE _b END, now(), auth.uid())
  ON CONFLICT (volunteer_id) DO UPDATE SET upi_id = EXCLUDED.upi_id, account_holder = EXCLUDED.account_holder, account_number = EXCLUDED.account_number,
    ifsc = EXCLUDED.ifsc, bank_name = EXCLUDED.bank_name, updated_at = now(), updated_by = auth.uid();
  IF _u <> '' THEN _mask := 'UPI ' || left(split_part(_u, '@', 1), 2) || '••••@' || split_part(_u, '@', 2); END IF;
  IF _a <> '' THEN _mask := concat_ws(' · ', nullif(_mask, ''), 'Bank ••••' || right(_a, 4) || ' (' || left(_i, 4) || ')'); END IF;
  PERFORM set_config('riloyd.volunteer_system', 'on', true);
  UPDATE public.volunteers SET payout_method = CASE WHEN _u <> '' THEN 'upi' ELSE 'bank' END, payout_masked = _mask WHERE id = _volunteer;
  PERFORM set_config('riloyd.volunteer_system', 'off', true);
  PERFORM public.volunteer_notify(_volunteer, 'status', 'Payout details updated', 'Your payout details are now: ' || _mask || '. If you did not make this change, raise a support ticket.');
  RETURN _mask;
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_request_withdrawal(_amount numeric, _method text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _v public.volunteers%ROWTYPE; _p public.volunteer_payout_details%ROWTYPE; _min integer; _available numeric; _mask text; _no text;
BEGIN
  SELECT * INTO _v FROM public.volunteers WHERE user_id = auth.uid() AND auth.uid() IS NOT NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Volunteer account not found' USING ERRCODE = '42501'; END IF;
  IF _v.status <> 'active' THEN RAISE EXCEPTION 'Your volunteer account is inactive' USING ERRCODE = '42501'; END IF;
  IF _v.kyc_status <> 'verified' THEN RAISE EXCEPTION 'Your KYC must be verified before you can withdraw' USING ERRCODE = '22023'; END IF;
  IF _method IS NULL OR _method NOT IN ('upi', 'bank') THEN RAISE EXCEPTION 'Choose UPI or bank account' USING ERRCODE = '22023'; END IF;
  SELECT * INTO _p FROM public.volunteer_payout_details WHERE volunteer_id = _v.id;
  IF _method = 'upi' AND coalesce(_p.upi_id, '') = '' THEN RAISE EXCEPTION 'Add your UPI ID first' USING ERRCODE = '22023'; END IF;
  IF _method = 'bank' AND coalesce(_p.account_number, '') = '' THEN RAISE EXCEPTION 'Add your bank account first' USING ERRCODE = '22023'; END IF;
  SELECT min_withdrawal INTO _min FROM public.volunteer_settings WHERE id;
  IF _amount IS NULL OR _amount <> round(_amount, 2) OR _amount < coalesce(_min, 1) THEN
    RAISE EXCEPTION 'The minimum withdrawal is ₹%', coalesce(_min, 1) USING ERRCODE = '22023';
  END IF;
  _available := public.volunteer_available_balance(_v.id);
  IF _amount > _available THEN RAISE EXCEPTION 'The amount is more than your available balance (₹%)', _available USING ERRCODE = '22023'; END IF;
  _mask := CASE WHEN _method = 'upi' THEN 'UPI ' || left(split_part(_p.upi_id, '@', 1), 2) || '••••@' || split_part(_p.upi_id, '@', 2)
    ELSE 'Bank ••••' || right(_p.account_number, 4) || ' (' || left(_p.ifsc, 4) || ')' END;
  INSERT INTO public.volunteer_withdrawals (volunteer_id, amount, method, payout_masked) VALUES (_v.id, _amount, _method, _mask) RETURNING request_number INTO _no;
  PERFORM public.volunteer_notify(_v.id, 'status', 'Withdrawal requested: ' || _no, '₹' || _amount || ' to ' || _mask || '. You will be notified when it is processed.');
  RETURN _no;
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_process_withdrawal(_id uuid, _status text, _transaction_id text DEFAULT '', _reason text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _w public.volunteer_withdrawals%ROWTYPE; _t text := btrim(coalesce(_transaction_id, '')); _r text := btrim(coalesce(_reason, ''));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only an admin can process withdrawals' USING ERRCODE = '42501'; END IF;
  SELECT * INTO _w FROM public.volunteer_withdrawals WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found' USING ERRCODE = 'P0002'; END IF;
  IF NOT ((_w.status = 'pending' AND _status IN ('processing', 'paid', 'rejected')) OR (_w.status = 'processing' AND _status IN ('paid', 'rejected'))) THEN
    RAISE EXCEPTION 'A % withdrawal cannot be marked %', _w.status, _status USING ERRCODE = '22023';
  END IF;
  IF _status = 'paid' AND (_t = '' OR char_length(_t) > 80) THEN RAISE EXCEPTION 'Enter the transaction ID' USING ERRCODE = '22023'; END IF;
  IF _status = 'rejected' AND (_r = '' OR char_length(_r) > 300) THEN RAISE EXCEPTION 'Enter the rejection reason' USING ERRCODE = '22023'; END IF;
  UPDATE public.volunteer_withdrawals SET status = _status, transaction_id = CASE WHEN _status = 'paid' THEN _t ELSE transaction_id END,
    rejection_reason = CASE WHEN _status = 'rejected' THEN _r ELSE rejection_reason END, processed_at = coalesce(processed_at, now()),
    paid_at = CASE WHEN _status = 'paid' THEN now() ELSE paid_at END, updated_by = auth.uid() WHERE id = _id;
  PERFORM public.volunteer_notify(_w.volunteer_id, 'status', 'Withdrawal ' || _w.request_number || ': ' || _status,
    CASE _status WHEN 'paid' THEN '₹' || _w.amount || ' was paid. Transaction ID: ' || _t
      WHEN 'rejected' THEN 'Reason: ' || _r || '. The amount is back in your available balance.'
      ELSE 'Your withdrawal is being processed.' END);
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_escalate_withdrawal(_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _w public.volunteer_withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO _w FROM public.volunteer_withdrawals WHERE id = _id FOR UPDATE;
  IF NOT FOUND OR coalesce(public.volunteer_access(_w.volunteer_id), '') NOT IN ('employee', 'admin') THEN RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501'; END IF;
  IF _w.status NOT IN ('pending', 'processing') THEN RAISE EXCEPTION 'Only waiting withdrawals can be escalated' USING ERRCODE = '22023'; END IF;
  UPDATE public.volunteer_withdrawals SET escalated_at = now(), escalation_note = left(btrim(coalesce(_note, '')), 300) WHERE id = _id;
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_open_ticket(_category text, _subject text, _body text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _vid uuid; _tid uuid; _no text;
BEGIN
  SELECT id INTO _vid FROM public.volunteers WHERE user_id = auth.uid() AND auth.uid() IS NOT NULL;
  IF _vid IS NULL THEN RAISE EXCEPTION 'Volunteer account not found' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.volunteer_tickets (volunteer_id, category, subject) VALUES (_vid, _category, btrim(_subject)) RETURNING id, ticket_number INTO _tid, _no;
  INSERT INTO public.volunteer_ticket_messages (ticket_id, author_id, author_role, body) VALUES (_tid, auth.uid(), 'volunteer', btrim(_body));
  RETURN _no;
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_reply_ticket(_ticket uuid, _body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t public.volunteer_tickets%ROWTYPE; _access text;
BEGIN
  SELECT * INTO _t FROM public.volunteer_tickets WHERE id = _ticket FOR UPDATE;
  _access := public.volunteer_access(_t.volunteer_id);
  IF _t.id IS NULL OR _access IS NULL THEN RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.volunteer_ticket_messages (ticket_id, author_id, author_role, body)
  VALUES (_ticket, auth.uid(), CASE _access WHEN 'self' THEN 'volunteer' ELSE _access END, btrim(_body));
  UPDATE public.volunteer_tickets SET updated_at = now(),
    status = CASE WHEN _access = 'self' THEN (CASE WHEN status = 'resolved' THEN 'reopened' WHEN status = 'reopened' THEN 'reopened' ELSE 'open' END) ELSE 'answered' END
    WHERE id = _ticket;
  IF _access <> 'self' THEN PERFORM public.volunteer_notify(_t.volunteer_id, 'status', 'Reply on ticket ' || _t.ticket_number, left(btrim(_body), 300), auth.uid()); END IF;
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_set_ticket_status(_ticket uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t public.volunteer_tickets%ROWTYPE; _access text;
BEGIN
  SELECT * INTO _t FROM public.volunteer_tickets WHERE id = _ticket FOR UPDATE;
  _access := public.volunteer_access(_t.volunteer_id);
  IF _t.id IS NULL OR _access IS NULL THEN RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501'; END IF;
  IF _status = 'reopened' AND _access = 'self' AND _t.status = 'resolved' THEN
    UPDATE public.volunteer_tickets SET status = 'reopened', updated_at = now() WHERE id = _ticket;
  ELSIF _status = 'resolved' AND _access IN ('employee', 'admin') THEN
    UPDATE public.volunteer_tickets SET status = 'resolved', updated_at = now() WHERE id = _ticket;
    PERFORM public.volunteer_notify(_t.volunteer_id, 'status', 'Ticket ' || _t.ticket_number || ' resolved', 'You can reopen it from Help & Support if the problem is not solved.', auth.uid());
  ELSIF _status = 'escalated' AND _access = 'employee' THEN
    UPDATE public.volunteer_tickets SET escalated = true, updated_at = now() WHERE id = _ticket;
  ELSE
    RAISE EXCEPTION 'This change is not allowed' USING ERRCODE = '42501';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_send_message(_volunteers uuid[], _kind text, _title text, _body text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _n integer := 0;
BEGIN
  IF _kind NOT IN ('message', 'announcement') THEN RAISE EXCEPTION 'Choose message or announcement' USING ERRCODE = '22023'; END IF;
  IF coalesce(array_length(_volunteers, 1), 0) = 0 OR array_length(_volunteers, 1) > 1000 THEN RAISE EXCEPTION 'Choose 1 to 1000 volunteers' USING ERRCODE = '22023'; END IF;
  IF char_length(btrim(coalesce(_title, ''))) NOT BETWEEN 1 AND 150 OR char_length(coalesce(_body, '')) > 2000 THEN RAISE EXCEPTION 'Check the title and message length' USING ERRCODE = '22023'; END IF;
  FOREACH _id IN ARRAY _volunteers LOOP
    IF coalesce(public.volunteer_access(_id), '') NOT IN ('employee', 'admin') THEN
      RAISE EXCEPTION 'You can message only your own volunteers' USING ERRCODE = '42501';
    END IF;
    PERFORM public.volunteer_notify(_id, _kind, btrim(_title), _body, auth.uid());
    _n := _n + 1;
  END LOOP;
  RETURN _n;
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_mark_notices_read()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.volunteer_notices n SET read_at = now() FROM public.volunteers v
  WHERE n.volunteer_id = v.id AND v.user_id = auth.uid() AND auth.uid() IS NOT NULL AND n.read_at IS NULL
$$;

CREATE OR REPLACE FUNCTION public.volunteer_referrals(_volunteer uuid DEFAULT NULL)
RETURNS TABLE(volunteer_id uuid, form_key text, source_id uuid, application_code text, student_name text, submitted_at timestamptz,
  completed_at timestamptz, form_status text, payment_status text, review_status text, status_reason text, commission_amount numeric, commission_status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH vis AS (
    SELECT v.id, v.referral_code FROM public.volunteers v
    WHERE (_volunteer IS NULL OR v.id = _volunteer) AND public.volunteer_access(v.id) IS NOT NULL
  )
  SELECT vis.id, 'education'::text, r.id, coalesce(nullif(r.registration_id, ''), nullif(r.ack_number, ''), ''), r.student_name, r.created_at,
    r.completed_at, r.form_status, r.payment_status, r.status, r.status_reason, c.amount, c.status
  FROM vis JOIN public.education_support_registrations r ON upper(btrim(r.coordinator_code)) = vis.referral_code
  LEFT JOIN public.volunteer_commissions c ON c.form_key = 'education' AND c.source_id = r.id
  UNION ALL
  SELECT vis.id, 'young_innovators'::text, y.id, y.application_code,
    split_part(btrim(y.student_name), ' ', 1) || coalesce(' ' || nullif(left(split_part(btrim(y.student_name), ' ', 2), 1), '') || '.', ''),
    y.created_at, y.submitted_at, y.submission_status, 'not_applicable', y.status, '', c.amount, c.status
  FROM vis JOIN public.young_innovators_registrations y ON upper(btrim(y.coordinator_code)) = vis.referral_code
  LEFT JOIN public.volunteer_commissions c ON c.form_key = 'young_innovators' AND c.source_id = y.id
  ORDER BY 6 DESC
  LIMIT 5000
$$;

CREATE OR REPLACE FUNCTION public.crm_owner_for_code(_code text)
 RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
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
  IF _owner IS NULL THEN
    SELECT v.employee_id INTO _owner FROM public.volunteers v
      JOIN public.crm_memberships m ON m.user_id = v.employee_id AND m.active
      WHERE v.referral_code = _c LIMIT 1;
  END IF;
  RETURN _owner;
END $function$;

CREATE OR REPLACE FUNCTION public.coordinator_name_for_code(_code text)
 RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT coalesce(
    (SELECT c.full_name FROM public.coordinators c WHERE c.active AND upper(c.referral_code) = upper(btrim(_code)) LIMIT 1),
    (SELECT p.full_name FROM public.crm_employee_profiles p JOIN public.crm_memberships m ON m.user_id = p.user_id AND m.active
      WHERE upper(p.employee_code) = upper(btrim(_code)) LIMIT 1),
    (SELECT v.full_name FROM public.volunteers v WHERE v.status = 'active' AND v.referral_code = upper(btrim(_code)) LIMIT 1))
$function$;

GRANT USAGE ON SEQUENCE public.volunteer_number_seq TO authenticated, service_role;
GRANT ALL ON SEQUENCE public.volunteer_withdrawal_seq, public.volunteer_ticket_seq TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.volunteers TO authenticated;
GRANT SELECT ON public.volunteer_payout_details, public.volunteer_commissions, public.volunteer_withdrawals,
  public.volunteer_tickets, public.volunteer_ticket_messages, public.volunteer_notices TO authenticated;
GRANT SELECT, UPDATE ON public.volunteer_settings, public.volunteer_form_commissions TO authenticated;
GRANT ALL ON public.volunteers, public.volunteer_payout_details, public.volunteer_settings, public.volunteer_form_commissions,
  public.volunteer_commissions, public.volunteer_withdrawals, public.volunteer_tickets, public.volunteer_ticket_messages, public.volunteer_notices TO service_role;
REVOKE DELETE, TRUNCATE ON public.volunteer_commissions, public.volunteer_withdrawals FROM authenticated, anon;

ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_payout_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_form_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Volunteers visible to owner employee, self and admins" ON public.volunteers;
DROP POLICY IF EXISTS "Volunteers visible to owner employee, self and admins" ON public.volunteers;
CREATE POLICY "Volunteers visible to owner employee, self and admins" ON public.volunteers FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid() OR (employee_id = auth.uid() AND public.is_active_employee(auth.uid())));
DROP POLICY IF EXISTS "Employees create their own volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Employees create their own volunteers" ON public.volunteers;
CREATE POLICY "Employees create their own volunteers" ON public.volunteers FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid() AND (public.is_active_employee(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Owner employee and admins edit volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Owner employee and admins edit volunteers" ON public.volunteers;
CREATE POLICY "Owner employee and admins edit volunteers" ON public.volunteers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR (employee_id = auth.uid() AND public.is_active_employee(auth.uid())))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (employee_id = auth.uid() AND public.is_active_employee(auth.uid())));

DROP POLICY IF EXISTS "Volunteer and admins read payout details" ON public.volunteer_payout_details;
DROP POLICY IF EXISTS "Volunteer and admins read payout details" ON public.volunteer_payout_details;
CREATE POLICY "Volunteer and admins read payout details" ON public.volunteer_payout_details FOR SELECT TO authenticated
  USING (public.volunteer_access(volunteer_id) IN ('admin', 'self'));

DROP POLICY IF EXISTS "Signed-in users read volunteer settings" ON public.volunteer_settings;
DROP POLICY IF EXISTS "Signed-in users read volunteer settings" ON public.volunteer_settings;
CREATE POLICY "Signed-in users read volunteer settings" ON public.volunteer_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins change volunteer settings" ON public.volunteer_settings;
DROP POLICY IF EXISTS "Admins change volunteer settings" ON public.volunteer_settings;
CREATE POLICY "Admins change volunteer settings" ON public.volunteer_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Signed-in users read commission rates" ON public.volunteer_form_commissions;
DROP POLICY IF EXISTS "Signed-in users read commission rates" ON public.volunteer_form_commissions;
CREATE POLICY "Signed-in users read commission rates" ON public.volunteer_form_commissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins change commission rates" ON public.volunteer_form_commissions;
DROP POLICY IF EXISTS "Admins change commission rates" ON public.volunteer_form_commissions;
CREATE POLICY "Admins change commission rates" ON public.volunteer_form_commissions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Read own volunteer commissions" ON public.volunteer_commissions;
DROP POLICY IF EXISTS "Read own volunteer commissions" ON public.volunteer_commissions;
CREATE POLICY "Read own volunteer commissions" ON public.volunteer_commissions FOR SELECT TO authenticated USING (public.volunteer_access(volunteer_id) IS NOT NULL);
DROP POLICY IF EXISTS "Read own volunteer withdrawals" ON public.volunteer_withdrawals;
DROP POLICY IF EXISTS "Read own volunteer withdrawals" ON public.volunteer_withdrawals;
CREATE POLICY "Read own volunteer withdrawals" ON public.volunteer_withdrawals FOR SELECT TO authenticated USING (public.volunteer_access(volunteer_id) IS NOT NULL);
DROP POLICY IF EXISTS "Read own volunteer tickets" ON public.volunteer_tickets;
DROP POLICY IF EXISTS "Read own volunteer tickets" ON public.volunteer_tickets;
CREATE POLICY "Read own volunteer tickets" ON public.volunteer_tickets FOR SELECT TO authenticated USING (public.volunteer_access(volunteer_id) IS NOT NULL);
DROP POLICY IF EXISTS "Read own volunteer ticket messages" ON public.volunteer_ticket_messages;
DROP POLICY IF EXISTS "Read own volunteer ticket messages" ON public.volunteer_ticket_messages;
CREATE POLICY "Read own volunteer ticket messages" ON public.volunteer_ticket_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.volunteer_tickets t WHERE t.id = ticket_id AND public.volunteer_access(t.volunteer_id) IS NOT NULL));
DROP POLICY IF EXISTS "Read own volunteer notices" ON public.volunteer_notices;
DROP POLICY IF EXISTS "Read own volunteer notices" ON public.volunteer_notices;
CREATE POLICY "Read own volunteer notices" ON public.volunteer_notices FOR SELECT TO authenticated USING (public.volunteer_access(volunteer_id) IS NOT NULL);

REVOKE ALL ON FUNCTION public.volunteer_notify(uuid, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.volunteer_available_balance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.volunteer_sync_commission() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.volunteers_guard() FROM PUBLIC, anon, authenticated;
DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['is_active_employee(uuid)', 'volunteer_access(uuid)', 'volunteer_folder_access(text)', 'volunteer_claim_account()', 'volunteer_touch_login()', 'volunteer_submit_kyc()',
    'volunteer_set_payout(uuid, text, text, text, text, text)', 'volunteer_request_withdrawal(numeric, text)', 'volunteer_process_withdrawal(uuid, text, text, text)',
    'volunteer_escalate_withdrawal(uuid, text)', 'volunteer_open_ticket(text, text, text)', 'volunteer_reply_ticket(uuid, text)', 'volunteer_set_ticket_status(uuid, text)',
    'volunteer_send_message(uuid[], text, text, text)', 'volunteer_mark_notices_read()', 'volunteer_referrals(uuid)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', f);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Volunteer photos upload" ON storage.objects;
DROP POLICY IF EXISTS "Volunteer photos upload" ON storage.objects;
CREATE POLICY "Volunteer photos upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'volunteer-photos' AND public.volunteer_folder_access(name) IS NOT NULL);
DROP POLICY IF EXISTS "Volunteer photos read" ON storage.objects;
DROP POLICY IF EXISTS "Volunteer photos read" ON storage.objects;
CREATE POLICY "Volunteer photos read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'volunteer-photos' AND public.volunteer_folder_access(name) IS NOT NULL);
DROP POLICY IF EXISTS "Volunteer KYC upload" ON storage.objects;
DROP POLICY IF EXISTS "Volunteer KYC upload" ON storage.objects;
CREATE POLICY "Volunteer KYC upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'volunteer-kyc' AND public.volunteer_folder_access(name) IS NOT NULL);
DROP POLICY IF EXISTS "Volunteer KYC read" ON storage.objects;
DROP POLICY IF EXISTS "Volunteer KYC read" ON storage.objects;
CREATE POLICY "Volunteer KYC read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'volunteer-kyc' AND public.volunteer_folder_access(name) IN ('admin', 'self'));
DROP POLICY IF EXISTS "Admins delete volunteer files" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete volunteer files" ON storage.objects;
CREATE POLICY "Admins delete volunteer files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('volunteer-photos', 'volunteer-kyc') AND has_role(auth.uid(), 'admin'::app_role));
-- ===== 0004_work_requests_hr =====
CREATE TABLE IF NOT EXISTS public.department_staff (user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, department text NOT NULL CHECK (department IN ('hr','support','accounts','finance','research')), level text NOT NULL DEFAULT 'executive' CHECK (level IN ('executive','manager')), approval_limit numeric CHECK (approval_limit >= 0), active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,department));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_staff TO authenticated, service_role;
ALTER TABLE public.department_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.department_staff;
DROP POLICY IF EXISTS recon_read ON public.department_staff;
CREATE POLICY recon_read ON public.department_staff FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS recon_write ON public.department_staff; CREATE POLICY recon_write ON public.department_staff FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public._work_department(_dept text) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM department_staff WHERE user_id=auth.uid() AND active AND department=_dept))
$fn$;
REVOKE ALL ON FUNCTION public._work_department(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._work_department(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public._work_manager(_uid uuid) RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
SELECT coalesce((SELECT manager_id FROM crm_memberships WHERE user_id=_uid AND active),(SELECT u.id FROM volunteers v JOIN auth.users u ON u.id=v.employee_id WHERE v.user_id=_uid LIMIT 1)) WHERE auth.uid() IS NOT NULL
$fn$;
REVOKE ALL ON FUNCTION public._work_manager(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._work_manager(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public._work_team(_uid uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
SELECT auth.uid() IS NOT NULL AND (_uid=auth.uid() OR public._work_department('hr') OR public._work_manager(_uid)=auth.uid())
$fn$;
REVOKE ALL ON FUNCTION public._work_team(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._work_team(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.person_name(_uid uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF; RETURN coalesce((SELECT nullif(full_name,'') FROM crm_employee_profiles WHERE user_id=_uid),(SELECT nullif(full_name,'') FROM volunteers WHERE user_id=_uid LIMIT 1),(SELECT nullif(display_name,'') FROM profiles WHERE id=_uid),'Employee'); END;
$fn$;
REVOKE ALL ON FUNCTION public.person_name(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.person_name(uuid) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.request_routes (type text PRIMARY KEY, label text NOT NULL, category text NOT NULL DEFAULT 'General', audience text NOT NULL DEFAULT 'all' CHECK(audience IN ('employee','volunteer','all')), kind text NOT NULL DEFAULT 'general' CHECK(kind IN ('leave','attendance','money','ticket','general','exit')), steps text[] NOT NULL DEFAULT ARRAY['admin'], steps_no_manager text[] NOT NULL DEFAULT ARRAY['admin'], sla_hours integer NOT NULL DEFAULT 48 CHECK(sla_hours BETWEEN 1 AND 720), active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid REFERENCES auth.users(id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_routes TO authenticated, service_role;
ALTER TABLE public.request_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.request_routes;
DROP POLICY IF EXISTS recon_read ON public.request_routes;
CREATE POLICY recon_read ON public.request_routes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS recon_write ON public.request_routes; CREATE POLICY recon_write ON public.request_routes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.leave_policies (leave_type text PRIMARY KEY, label text NOT NULL, days_per_year numeric NOT NULL CHECK(days_per_year BETWEEN 0 AND 366), sort_order integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_policies TO authenticated, service_role;
ALTER TABLE public.leave_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.leave_policies;
DROP POLICY IF EXISTS recon_read ON public.leave_policies;
CREATE POLICY recon_read ON public.leave_policies FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS recon_write ON public.leave_policies; CREATE POLICY recon_write ON public.leave_policies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.leave_policies(leave_type,label,days_per_year,sort_order) VALUES ('casual','Casual leave',12,1),('sick','Sick leave',12,2),('earned','Earned leave',15,3),('unpaid','Unpaid leave',0,4) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, type text NOT NULL REFERENCES public.request_routes(type), title text NOT NULL, description text NOT NULL DEFAULT '', applicant_id uuid NOT NULL REFERENCES auth.users(id), applicant_name text NOT NULL, applicant_role text NOT NULL, manager_id uuid REFERENCES auth.users(id), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled','resolved','paid')), steps text[] NOT NULL, step_index integer NOT NULL DEFAULT 0 CHECK(step_index >= 0), current_step text, from_date date, to_date date, days numeric, amount numeric CHECK(amount > 0), details jsonb NOT NULL DEFAULT '{}', priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')), resolution text NOT NULL DEFAULT '', transaction_ref text NOT NULL DEFAULT '', proof_path text NOT NULL DEFAULT '', due_at timestamptz, escalated_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(to_date IS NULL OR to_date >= from_date));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated, service_role;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.requests;
DROP POLICY IF EXISTS recon_read ON public.requests;
CREATE POLICY recon_read ON public.requests FOR SELECT TO authenticated USING (public._work_team(applicant_id));

CREATE OR REPLACE FUNCTION public.request_can_act(_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE r public.requests; k text; BEGIN
IF auth.uid() IS NULL THEN RETURN false; END IF;
SELECT * INTO r FROM requests WHERE id=_id; IF NOT FOUND OR r.applicant_id=auth.uid() THEN RETURN false; END IF;
SELECT kind INTO k FROM request_routes WHERE type=r.type;
IF k='money' AND EXISTS(SELECT 1 FROM request_events WHERE request_id=_id AND actor_id=auth.uid() AND action IN ('approved','forwarded','paid')) THEN RETURN false; END IF;
IF r.status='approved' AND k='money' THEN RETURN public._work_department('accounts'); END IF;
IF r.status<>'pending' THEN RETURN false; END IF;
IF public.has_role(auth.uid(), 'admin') THEN RETURN true; END IF;
IF r.current_step IN ('manager','coordinator') THEN RETURN r.manager_id=auth.uid(); END IF;
RETURN EXISTS(SELECT 1 FROM department_staff d WHERE d.user_id=auth.uid() AND d.active AND d.department=r.current_step AND (r.current_step<>'finance' OR (d.level='manager' AND (d.approval_limit IS NULL OR r.amount<=d.approval_limit)))); END;
$fn$;
REVOKE ALL ON FUNCTION public.request_can_act(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_can_act(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public._request_visible(_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM requests r WHERE r.id=_id AND (public._work_team(r.applicant_id) OR public.request_can_act(r.id) OR EXISTS(SELECT 1 FROM department_staff d WHERE d.user_id=auth.uid() AND d.active AND d.department=ANY(r.steps))))
$fn$;
REVOKE ALL ON FUNCTION public._request_visible(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._request_visible(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS recon_read ON public.requests; CREATE POLICY recon_read ON public.requests FOR SELECT TO authenticated USING(public._request_visible(id));

CREATE TABLE IF NOT EXISTS public.request_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE, actor_id uuid REFERENCES auth.users(id), actor_name text NOT NULL DEFAULT 'System', action text NOT NULL, note text NOT NULL DEFAULT '', step text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_events TO authenticated, service_role;
ALTER TABLE public.request_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.request_events;
DROP POLICY IF EXISTS recon_read ON public.request_events;
CREATE POLICY recon_read ON public.request_events FOR SELECT TO authenticated USING (public._request_visible(request_id));

CREATE TABLE IF NOT EXISTS public.request_attachments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE, uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id), file_path text NOT NULL UNIQUE, file_name text NOT NULL, file_size bigint NOT NULL CHECK(file_size BETWEEN 0 AND 10485760), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_attachments TO authenticated, service_role;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.request_attachments;
DROP POLICY IF EXISTS recon_read ON public.request_attachments;
CREATE POLICY recon_read ON public.request_attachments FOR SELECT TO authenticated USING (public._request_visible(request_id));

DROP POLICY IF EXISTS recon_insert ON public.request_attachments; CREATE POLICY recon_insert ON public.request_attachments FOR INSERT TO authenticated WITH CHECK(uploaded_by=auth.uid() AND public._request_visible(request_id) AND split_part(file_path,'/',1)=request_id::text);

CREATE TABLE IF NOT EXISTS public.audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES auth.users(id), action text NOT NULL, entity text NOT NULL, entity_id text NOT NULL DEFAULT '', details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated, service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.audit_logs;
DROP POLICY IF EXISTS recon_read ON public.audit_logs;
CREATE POLICY recon_read ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, kind text NOT NULL DEFAULT 'info', title text NOT NULL, body text NOT NULL DEFAULT '', link text NOT NULL DEFAULT '', read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated, service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.notifications;
DROP POLICY IF EXISTS recon_read ON public.notifications;
CREATE POLICY recon_read ON public.notifications FOR SELECT TO authenticated USING (user_id=auth.uid());

CREATE TABLE IF NOT EXISTS public.attendance_records (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id), day date NOT NULL, status text NOT NULL DEFAULT 'present' CHECK(status IN ('present','wfh','leave','half_day','absent','holiday')), check_in timestamptz, check_out timestamptz, note text NOT NULL DEFAULT '', request_id uuid REFERENCES public.requests(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,day), CHECK(check_out IS NULL OR (check_in IS NOT NULL AND check_out>=check_in)));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated, service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.attendance_records;
DROP POLICY IF EXISTS recon_read ON public.attendance_records;
CREATE POLICY recon_read ON public.attendance_records FOR SELECT TO authenticated USING (public._work_team(user_id));

CREATE TABLE IF NOT EXISTS public.volunteer_availability (volunteer_id uuid PRIMARY KEY REFERENCES public.volunteers(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'available' CHECK(status IN ('available','busy','unavailable')), days text[] NOT NULL DEFAULT '{}', hours text NOT NULL DEFAULT '', note text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_availability TO authenticated, service_role;
ALTER TABLE public.volunteer_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.volunteer_availability;
DROP POLICY IF EXISTS recon_read ON public.volunteer_availability;
CREATE POLICY recon_read ON public.volunteer_availability FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.volunteers v WHERE v.id=volunteer_id AND public._work_team(v.user_id)));

CREATE TABLE IF NOT EXISTS public.meetings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organizer_id uuid NOT NULL REFERENCES auth.users(id), title text NOT NULL, agenda text NOT NULL DEFAULT '', starts_at timestamptz NOT NULL, duration_min integer NOT NULL DEFAULT 30 CHECK(duration_min BETWEEN 5 AND 480), location text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','done','cancelled')), minutes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated, service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.meetings;
DROP POLICY IF EXISTS recon_read ON public.meetings;
CREATE POLICY recon_read ON public.meetings FOR SELECT TO authenticated USING (organizer_id=auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.meeting_attendees (meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES auth.users(id), response text NOT NULL DEFAULT 'pending' CHECK(response IN ('pending','accepted','declined')), PRIMARY KEY(meeting_id,user_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_attendees TO authenticated, service_role;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.meeting_attendees;
DROP POLICY IF EXISTS recon_read ON public.meeting_attendees;
CREATE POLICY recon_read ON public.meeting_attendees FOR SELECT TO authenticated USING (user_id=auth.uid());

CREATE OR REPLACE FUNCTION public._meeting_visible(_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
SELECT auth.uid() IS NOT NULL AND ( public.has_role(auth.uid(), 'admin') OR EXISTS(SELECT 1 FROM meetings WHERE id=_id AND organizer_id=auth.uid()) OR EXISTS(SELECT 1 FROM meeting_attendees WHERE meeting_id=_id AND user_id=auth.uid()))
$fn$;
REVOKE ALL ON FUNCTION public._meeting_visible(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._meeting_visible(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS recon_read ON public.meetings; CREATE POLICY recon_read ON public.meetings FOR SELECT TO authenticated USING(public._meeting_visible(id));

DROP POLICY IF EXISTS recon_read ON public.meeting_attendees; CREATE POLICY recon_read ON public.meeting_attendees FOR SELECT TO authenticated USING(public._meeting_visible(meeting_id));

ALTER TABLE public.crm_tasks ADD COLUMN IF NOT EXISTS assigned_by uuid NULL, ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS requests_client_key_uid ON public.requests(applicant_id,(details->>'client_key')) WHERE nullif(details->>'client_key','') IS NOT NULL;
CREATE INDEX IF NOT EXISTS requests_pending_due ON public.requests(due_at) WHERE status='pending';
CREATE INDEX IF NOT EXISTS request_events_request_idx ON public.request_events(request_id,created_at);
CREATE INDEX IF NOT EXISTS notifications_owner_idx ON public.notifications(user_id,created_at DESC);

CREATE OR REPLACE FUNCTION public._request_dispatch(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE r requests; BEGIN
SELECT * INTO r FROM requests WHERE id=_id;
INSERT INTO notifications(user_id,kind,title,body,link)
SELECT u.id,'action',r.code||' · '||r.title,'Waiting for '||coalesce(r.current_step,r.status),'request:'||r.id
FROM auth.users u WHERE u.id<>r.applicant_id AND
(public.has_role(u.id,'admin') OR (r.status='pending' AND (u.id=r.manager_id AND r.current_step IN ('manager','coordinator') OR EXISTS(SELECT 1 FROM department_staff d WHERE d.user_id=u.id AND d.active AND d.department=r.current_step))));
END;
$fn$;
REVOKE ALL ON FUNCTION public._request_dispatch(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._request_dispatch(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public._request_event(_id uuid, _action text, _note text, _step text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
INSERT INTO request_events(request_id,actor_id,actor_name,action,note,step) VALUES(_id,auth.uid(),CASE WHEN auth.uid() IS NULL THEN 'System' ELSE public.person_name(auth.uid()) END,_action,coalesce(_note,''),_step);
INSERT INTO audit_logs(actor_id,action,entity,entity_id,details) VALUES(auth.uid(),_action,'requests',_id::text,jsonb_build_object('note',_note,'step',_step));
INSERT INTO notifications(user_id,kind,title,body,link) SELECT applicant_id,'info',code||' · '||_action,coalesce(_note,''),'request:'||id FROM requests WHERE id=_id;
END;
$fn$;
REVOKE ALL ON FUNCTION public._request_event(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._request_event(uuid,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.leave_summary() RETURNS TABLE(leave_type text,label text,allowed numeric,used numeric,pending numeric,available numeric) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
RETURN QUERY SELECT l.leave_type,l.label,l.days_per_year,coalesce(sum(r.days) FILTER(WHERE r.status='approved'),0),coalesce(sum(r.days) FILTER(WHERE r.status='pending'),0),greatest(0,l.days_per_year-coalesce(sum(r.days) FILTER(WHERE r.status IN ('approved','pending')),0)) FROM leave_policies l LEFT JOIN requests r ON r.type='leave' AND r.applicant_id=auth.uid() AND r.details->>'leave_type'=l.leave_type AND extract(year FROM r.from_date)=extract(year FROM current_date) GROUP BY l.leave_type,l.label,l.days_per_year,l.sort_order ORDER BY l.sort_order; END;
$fn$;
REVOKE ALL ON FUNCTION public.leave_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.leave_summary() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_submit(_type text, _title text, _description text DEFAULT '', _details jsonb DEFAULT '{}', _from date DEFAULT NULL, _to date DEFAULT NULL, _amount numeric DEFAULT NULL, _priority text DEFAULT 'normal') RETURNS public.requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE rt request_routes; r requests; st text[]; mgr uuid; n integer; d numeric; isvol boolean; allowance numeric; reserved numeric; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
IF nullif(_details->>'client_key','') IS NOT NULL THEN SELECT * INTO r FROM requests WHERE applicant_id=auth.uid() AND details->>'client_key'=_details->>'client_key'; IF FOUND THEN RETURN r; END IF; END IF;
SELECT * INTO rt FROM request_routes WHERE type=_type AND active; IF NOT FOUND THEN RAISE EXCEPTION 'Inactive request type'; END IF;
SELECT EXISTS(SELECT 1 FROM volunteers WHERE user_id=auth.uid() AND status='active') INTO isvol;
IF rt.audience='volunteer' AND NOT isvol THEN RAISE EXCEPTION 'Active volunteer required'; END IF;
IF rt.audience='employee' AND NOT (EXISTS(SELECT 1 FROM crm_memberships WHERE user_id=auth.uid() AND active) OR EXISTS(SELECT 1 FROM department_staff WHERE user_id=auth.uid() AND active) OR public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Employee access required'; END IF;
IF length(trim(_title)) NOT BETWEEN 1 AND 150 OR jsonb_typeof(_details)<>'object' THEN RAISE EXCEPTION 'Invalid request'; END IF;
IF rt.kind IN ('leave','attendance') THEN
IF _from IS NULL OR _to IS NULL OR _to<_from OR _to-_from>366 OR extract(year FROM _from)<>extract(year FROM _to) THEN RAISE EXCEPTION 'Invalid dates (same year, up to 366 days)'; END IF;
SELECT count(*) INTO d FROM generate_series(_from::timestamp,_to::timestamp,interval '1 day') x WHERE extract(dow FROM x)<>0;
IF coalesce((_details->>'half_day')::boolean,false) THEN IF _from<>_to THEN RAISE EXCEPTION 'Half day requires one date'; END IF; d:=d/2; END IF;
END IF;
IF _type='leave' THEN
SELECT days_per_year INTO allowance FROM leave_policies WHERE leave_type=_details->>'leave_type'; IF NOT FOUND OR d<=0 THEN RAISE EXCEPTION 'Invalid leave'; END IF;
IF EXISTS(SELECT 1 FROM requests WHERE applicant_id=auth.uid() AND type='leave' AND status IN ('pending','approved') AND from_date<=_to AND to_date>=_from) THEN RAISE EXCEPTION 'Overlapping leave'; END IF;
SELECT coalesce(sum(days),0) INTO reserved FROM requests WHERE applicant_id=auth.uid() AND type='leave' AND status IN ('pending','approved') AND details->>'leave_type'=_details->>'leave_type' AND extract(year FROM from_date)=extract(year FROM _from);
IF _details->>'leave_type'<>'unpaid' AND reserved+d>allowance THEN RAISE EXCEPTION 'Insufficient leave balance'; END IF;
END IF;
IF rt.kind='money' AND (_amount IS NULL OR _amount<=0) THEN RAISE EXCEPTION 'Positive amount required'; END IF;
mgr:=public._work_manager(auth.uid()); st:=CASE WHEN mgr IS NOT NULL THEN rt.steps ELSE array_remove(array_remove(rt.steps_no_manager,'manager'),'coordinator') END;
IF coalesce(cardinality(st),0)=0 THEN st:=ARRAY['admin']; END IF;
IF NOT st <@ ARRAY['manager','coordinator','hr','support','accounts','finance','admin']::text[] THEN RAISE EXCEPTION 'Invalid approval route'; END IF;
INSERT INTO ack_form_counters(form_code,form_name,last_serial) VALUES('REQ-'||to_char(now(),'YYMM'),'Work requests',1) ON CONFLICT(form_code) DO UPDATE SET last_serial=ack_form_counters.last_serial+1 RETURNING last_serial INTO n;
INSERT INTO requests(code,type,title,description,applicant_id,applicant_name,applicant_role,manager_id,steps,current_step,from_date,to_date,days,amount,details,priority,due_at)
VALUES('REQ-'||to_char(now(),'YYMM')||'-'||lpad(n::text,greatest(5,length(n::text)),'0'),_type,trim(_title),coalesce(_description,''),auth.uid(),public.person_name(auth.uid()),CASE WHEN isvol THEN 'volunteer' ELSE 'employee' END,mgr,st,st[1],_from,_to,d,_amount,coalesce(_details,'{}'),_priority,now()+make_interval(hours=>rt.sla_hours)) RETURNING * INTO r;
PERFORM public._request_event(r.id,'submitted','',r.current_step); PERFORM public._request_dispatch(r.id); RETURN r; END;
$fn$;
REVOKE ALL ON FUNCTION public.request_submit(text,text,text,jsonb,date,date,numeric,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_submit(text,text,text,jsonb,date,date,numeric,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_act(_id uuid, _action text, _note text DEFAULT '', _ref text DEFAULT '', _proof_path text DEFAULT '', _account_id uuid DEFAULT NULL) RETURNS public.requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE r requests; k text; s text; h integer; a text; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
SELECT * INTO r FROM requests WHERE id=_id FOR UPDATE;
IF NOT FOUND OR NOT public.request_can_act(_id) THEN RAISE EXCEPTION 'Not authorized to act'; END IF;
SELECT kind,sla_hours INTO k,h FROM request_routes WHERE type=r.type; s:=r.current_step;
IF _action='paid' THEN RAISE EXCEPTION 'Payment posting deferred: use the finance-domain ledger integration'; END IF;
IF r.status<>'pending' THEN RAISE EXCEPTION 'Request is no longer pending'; END IF;
IF _action='reject' THEN IF nullif(trim(_note),'') IS NULL THEN RAISE EXCEPTION 'Rejection reason required'; END IF; r.status:='rejected'; a:='rejected';
ELSIF _action IN ('approve','resolve') THEN
IF k='ticket' THEN r.status:='resolved'; r.resolution:=coalesce(_note,''); a:='resolved';
ELSIF r.step_index+1<cardinality(r.steps) THEN r.step_index:=r.step_index+1; r.current_step:=r.steps[r.step_index+1]; r.due_at:=now()+make_interval(hours=>h); r.escalated_at:=NULL; a:='forwarded';
ELSE r.status:='approved'; a:='approved'; END IF;
ELSE RAISE EXCEPTION 'Invalid action'; END IF;
IF r.status<>'pending' THEN r.current_step:=NULL; r.due_at:=NULL; END IF;
UPDATE requests SET status=r.status,step_index=r.step_index,current_step=r.current_step,due_at=r.due_at,escalated_at=r.escalated_at,resolution=r.resolution,updated_at=now() WHERE id=_id;
IF r.status='approved' AND (r.type IN ('leave','wfh') OR k='attendance') THEN
INSERT INTO attendance_records(user_id,day,status,note,request_id)
SELECT r.applicant_id,x::date,CASE WHEN r.type='wfh' THEN 'wfh' WHEN r.type='leave' THEN CASE WHEN coalesce((r.details->>'half_day')::boolean,false) THEN 'half_day' ELSE 'leave' END ELSE coalesce(r.details->>'status','present') END,r.code,r.id
FROM generate_series(r.from_date::timestamp,r.to_date::timestamp,interval '1 day') x WHERE extract(dow FROM x)<>0
ON CONFLICT(user_id,day) DO UPDATE SET status=excluded.status,note=excluded.note,request_id=excluded.request_id,updated_at=now(); END IF;
PERFORM public._request_event(_id,a,_note,s); IF r.status='pending' THEN PERFORM public._request_dispatch(_id); END IF;
SELECT * INTO r FROM requests WHERE id=_id; RETURN r; END;
$fn$;
REVOKE ALL ON FUNCTION public.request_act(uuid,text,text,text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_act(uuid,text,text,text,text,uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_comment(_id uuid, _note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN IF auth.uid() IS NULL OR NOT public._request_visible(_id) THEN RAISE EXCEPTION 'Not authorized'; END IF; IF nullif(trim(_note),'') IS NULL THEN RAISE EXCEPTION 'Comment required'; END IF; PERFORM public._request_event(_id,'comment',_note,NULL); END;
$fn$;
REVOKE ALL ON FUNCTION public.request_comment(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_comment(uuid,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_cancel(_id uuid, _note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE r requests; BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
SELECT * INTO r FROM requests WHERE id=_id FOR UPDATE;
IF r.applicant_id IS DISTINCT FROM auth.uid() OR NOT(r.status='pending' OR (r.status='approved' AND r.type IN ('leave','wfh','volunteer_absence') AND r.from_date>(now() AT TIME ZONE 'Asia/Kolkata')::date)) THEN RAISE EXCEPTION 'Cannot cancel'; END IF;
UPDATE requests SET status='cancelled',current_step=NULL,due_at=NULL,updated_at=now() WHERE id=_id;
DELETE FROM attendance_records WHERE request_id=_id AND day>(now() AT TIME ZONE 'Asia/Kolkata')::date AND check_in IS NULL;
PERFORM public._request_event(_id,'cancelled',_note,r.current_step); END;
$fn$;
REVOKE ALL ON FUNCTION public.request_cancel(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_cancel(uuid,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.my_approval_queue() RETURNS SETOF public.requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;  RETURN QUERY SELECT r.* FROM requests r WHERE public.request_can_act(r.id) ORDER BY r.created_at DESC LIMIT 1000; END;
$fn$;
REVOKE ALL ON FUNCTION public.my_approval_queue() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_approval_queue() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.team_requests() RETURNS SETOF public.requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;  RETURN QUERY SELECT r.* FROM requests r WHERE r.manager_id=auth.uid() ORDER BY r.created_at DESC LIMIT 1000; END;
$fn$;
REVOKE ALL ON FUNCTION public.team_requests() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.team_requests() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.department_requests(_dept text, _status text DEFAULT NULL) RETURNS SETOF public.requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF; IF NOT public._work_department(_dept) OR (_dept='all' AND NOT public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Department access required'; END IF; RETURN QUERY SELECT r.* FROM requests r WHERE (_dept='all' OR _dept=ANY(r.steps)) AND (_status IS NULL OR _status='' OR r.status=_status) ORDER BY r.created_at DESC LIMIT 1000; END;
$fn$;
REVOKE ALL ON FUNCTION public.department_requests(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.department_requests(text,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.notifications_mark_read(_id uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF; UPDATE notifications SET read_at=now() WHERE user_id=auth.uid() AND read_at IS NULL AND (_id IS NULL OR id=_id); END;
$fn$;
REVOKE ALL ON FUNCTION public.notifications_mark_read(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notifications_mark_read(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.attendance_mark(_action text) RETURNS public.attendance_records LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE d date:=(now() AT TIME ZONE 'Asia/Kolkata')::date; r attendance_records; BEGIN
IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.my_dashboards() x WHERE x IS NOT NULL) THEN RAISE EXCEPTION 'Work access required'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
IF _action='in' THEN
INSERT INTO attendance_records(user_id,day) VALUES(auth.uid(),d) ON CONFLICT(user_id,day) DO NOTHING;
SELECT * INTO r FROM attendance_records WHERE user_id=auth.uid() AND day=d FOR UPDATE;
IF r.check_in IS NOT NULL OR r.status='leave' THEN RAISE EXCEPTION 'Already checked in or on leave'; END IF;
UPDATE attendance_records SET check_in=now(),updated_at=now() WHERE user_id=auth.uid() AND day=d RETURNING * INTO r;
ELSIF _action='out' THEN UPDATE attendance_records SET check_out=now(),updated_at=now() WHERE user_id=auth.uid() AND day=d AND check_in IS NOT NULL AND check_out IS NULL RETURNING * INTO r; IF NOT FOUND THEN RAISE EXCEPTION 'No open check-in'; END IF;
ELSE RAISE EXCEPTION 'Invalid attendance action'; END IF; RETURN r; END;
$fn$;
REVOKE ALL ON FUNCTION public.attendance_mark(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attendance_mark(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.team_attendance(_from date, _to date) RETURNS TABLE(user_id uuid,full_name text,day date,status text,check_in timestamptz,check_out timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF; IF _from IS NULL OR _to IS NULL OR _to<_from OR _to-_from>61 THEN RAISE EXCEPTION 'Select at most 62 days'; END IF; RETURN QUERY SELECT a.user_id,public.person_name(a.user_id),a.day,a.status,a.check_in,a.check_out FROM attendance_records a WHERE a.day BETWEEN _from AND _to AND public._work_team(a.user_id) ORDER BY a.day DESC,a.user_id; END;
$fn$;
REVOKE ALL ON FUNCTION public.team_attendance(date,date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.team_attendance(date,date) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.volunteer_set_availability(_status text, _days text[], _hours text, _note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v uuid; BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF; SELECT id INTO v FROM volunteers WHERE user_id=auth.uid() AND status='active'; IF v IS NULL THEN RAISE EXCEPTION 'Active volunteer required'; END IF;
IF NOT _days <@ ARRAY['mon','tue','wed','thu','fri','sat','sun']::text[] OR length(_hours)>80 OR length(_note)>500 THEN RAISE EXCEPTION 'Invalid availability'; END IF;
INSERT INTO volunteer_availability(volunteer_id,status,days,hours,note) VALUES(v,_status,_days,_hours,_note) ON CONFLICT(volunteer_id) DO UPDATE SET status=excluded.status,days=excluded.days,hours=excluded.hours,note=excluded.note,updated_at=now(); END;
$fn$;
REVOKE ALL ON FUNCTION public.volunteer_set_availability(text,text[],text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.volunteer_set_availability(text,text[],text,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.work_people() RETURNS TABLE(user_id uuid,full_name text,role text,department text,manager_name text,email text,phone text,joining_date date) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
RETURN QUERY SELECT u.id,public.person_name(u.id),coalesce(m.role,d.level,'employee'),coalesce(d.department,'CRM'),CASE WHEN m.manager_id IS NULL THEN '' ELSE public.person_name(m.manager_id) END,coalesce(u.email,''),coalesce(p.phone,''),p.joining_date FROM auth.users u LEFT JOIN crm_memberships m ON m.user_id=u.id AND m.active LEFT JOIN crm_employee_profiles p ON p.user_id=u.id LEFT JOIN LATERAL(SELECT s.department,s.level FROM department_staff s WHERE s.user_id=u.id AND s.active ORDER BY s.department LIMIT 1)d ON true WHERE (m.user_id IS NOT NULL OR d.department IS NOT NULL) AND public._work_team(u.id); END;
$fn$;
REVOKE ALL ON FUNCTION public.work_people() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.work_people() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.work_contacts() RETURNS TABLE(user_id uuid,full_name text,kind text) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
IF NOT (EXISTS(SELECT 1 FROM crm_memberships WHERE user_id=auth.uid() AND active) OR EXISTS(SELECT 1 FROM department_staff WHERE user_id=auth.uid() AND active) OR public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Employee access required'; END IF;
RETURN QUERY SELECT u.id,public.person_name(u.id),CASE WHEN EXISTS(SELECT 1 FROM volunteers v WHERE v.user_id=u.id AND v.status='active') THEN 'volunteer' ELSE 'employee' END FROM auth.users u WHERE EXISTS(SELECT 1 FROM crm_memberships m WHERE m.user_id=u.id AND m.active) OR EXISTS(SELECT 1 FROM department_staff d WHERE d.user_id=u.id AND d.active) OR EXISTS(SELECT 1 FROM volunteers v WHERE v.user_id=u.id AND v.status='active'); END;
$fn$;
REVOKE ALL ON FUNCTION public.work_contacts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.work_contacts() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.meeting_create(_title text, _agenda text, _starts timestamptz, _duration integer, _location text, _attendees uuid[]) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE mid uuid; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
IF NOT(EXISTS(SELECT 1 FROM crm_memberships WHERE user_id=auth.uid() AND active) OR EXISTS(SELECT 1 FROM department_staff WHERE user_id=auth.uid() AND active) OR public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Employee access required'; END IF;
IF length(trim(_title))<3 OR _starts IS NULL OR coalesce(cardinality(_attendees),0)=0 OR cardinality(_attendees)>200 THEN RAISE EXCEPTION 'Invalid meeting'; END IF;
IF EXISTS(SELECT 1 FROM unnest(_attendees) a WHERE NOT EXISTS(SELECT 1 FROM public.work_contacts() c WHERE c.user_id=a)) THEN RAISE EXCEPTION 'Invalid attendee'; END IF;
INSERT INTO meetings(organizer_id,title,agenda,starts_at,duration_min,location) VALUES(auth.uid(),trim(_title),coalesce(_agenda,''),_starts,_duration,coalesce(_location,'')) RETURNING id INTO mid;
INSERT INTO meeting_attendees(meeting_id,user_id) SELECT mid,a FROM unnest(_attendees) a GROUP BY a;
INSERT INTO notifications(user_id,title,body,link) SELECT a,'Meeting: '||_title,_starts::text,'/work#meetings' FROM unnest(_attendees) a GROUP BY a;
RETURN mid; END;
$fn$;
REVOKE ALL ON FUNCTION public.meeting_create(text,text,timestamptz,integer,text,uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.meeting_create(text,text,timestamptz,integer,text,uuid[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.meeting_update(_id uuid, _status text DEFAULT NULL, _response text DEFAULT NULL, _minutes text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE m meetings; BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
SELECT * INTO m FROM meetings WHERE id=_id FOR UPDATE; IF NOT FOUND OR m.status<>'scheduled' THEN RAISE EXCEPTION 'Meeting unavailable'; END IF;
IF _status IS NOT NULL OR _minutes IS NOT NULL THEN IF m.organizer_id<>auth.uid() THEN RAISE EXCEPTION 'Organizer required'; END IF;
UPDATE meetings SET status=coalesce(_status,status),minutes=coalesce(_minutes,minutes),updated_at=now() WHERE id=_id; END IF;
IF _response IS NOT NULL THEN UPDATE meeting_attendees SET response=_response WHERE meeting_id=_id AND user_id=auth.uid(); IF NOT FOUND THEN RAISE EXCEPTION 'Not invited'; END IF; END IF; END;
$fn$;
REVOKE ALL ON FUNCTION public.meeting_update(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.meeting_update(uuid,text,text,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_department_staff() RETURNS TABLE(user_id uuid,full_name text,email text,department text,level text,approval_limit numeric,active boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin required'; END IF; RETURN QUERY SELECT d.user_id,public.person_name(d.user_id),coalesce(u.email,''),d.department,d.level,d.approval_limit,d.active FROM department_staff d JOIN auth.users u ON u.id=d.user_id ORDER BY d.department,u.email; END;
$fn$;
REVOKE ALL ON FUNCTION public.admin_department_staff() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_department_staff() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_set_department_staff(_email text, _department text, _active boolean, _level text DEFAULT 'executive', _limit numeric DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE uid uuid; BEGIN IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
SELECT id INTO uid FROM auth.users WHERE lower(email)=lower(trim(_email)) AND email_confirmed_at IS NOT NULL;
IF uid IS NULL THEN RAISE EXCEPTION 'Verified account required'; END IF;
INSERT INTO department_staff(user_id,department,active,level,approval_limit) VALUES(uid,_department,_active,_level,_limit) ON CONFLICT(user_id,department) DO UPDATE SET active=excluded.active,level=excluded.level,approval_limit=excluded.approval_limit,updated_at=now();
INSERT INTO audit_logs(actor_id,action,entity,entity_id,details) VALUES(auth.uid(),'department_access','department_staff',uid::text,jsonb_build_object('department',_department,'active',_active)); END;
$fn$;
REVOKE ALL ON FUNCTION public.admin_set_department_staff(text,text,boolean,text,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_department_staff(text,text,boolean,text,numeric) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.my_dashboards() RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE ds text[]:='{}'; dep text; staff boolean; BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
IF public.has_role(auth.uid(),'admin') THEN ds:=array_append(ds,'admin'); END IF;
IF EXISTS(SELECT 1 FROM crm_memberships WHERE user_id=auth.uid() AND active) THEN ds:=array_append(ds,'crm'); END IF;
IF EXISTS(SELECT 1 FROM education_staff_access WHERE user_id=auth.uid() AND active) THEN ds:=array_append(ds,'staff'); END IF;
IF EXISTS(SELECT 1 FROM volunteers WHERE employee_id=auth.uid()) THEN ds:=array_append(ds,'my-volunteers'); END IF;
FOR dep IN SELECT DISTINCT department FROM department_staff WHERE user_id=auth.uid() AND active LOOP ds:=array_append(ds,CASE WHEN dep='accounts' THEN 'finance' ELSE dep END); END LOOP;
staff:=cardinality(ds)>0; IF staff THEN ds:=array_append(ds,'work'); END IF;
IF EXISTS(SELECT 1 FROM volunteers WHERE user_id=auth.uid() AND status='active') THEN ds:=array_append(ds,'volunteer'); END IF;
RETURN ARRAY(SELECT DISTINCT x FROM unnest(ds) x); END;
$fn$;
REVOKE ALL ON FUNCTION public.my_dashboards() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_dashboards() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.escalation_enabled() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE j jsonb; enabled boolean:=true; BEGIN
IF auth.uid() IS NULL AND coalesce(auth.role(),'')<>'service_role' THEN RAISE EXCEPTION 'Authentication required'; END IF;
IF to_regclass('public.global_settings') IS NOT NULL THEN
EXECUTE 'SELECT to_jsonb(g) FROM public.global_settings g WHERE to_jsonb(g)->>''key'' IN (''work_escalations_enabled'',''escalation_enabled'') LIMIT 1' INTO j;
IF j IS NOT NULL THEN enabled:=coalesce((j->>'value')::boolean,true); END IF; END IF;
RETURN enabled; END;
$fn$;
REVOKE ALL ON FUNCTION public.escalation_enabled() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.escalation_enabled() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.run_request_escalations() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE r requests; n integer:=0; BEGIN
IF coalesce(auth.role(),'')<>'service_role' AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin')) THEN RAISE EXCEPTION 'Service role or admin required'; END IF;
IF NOT public.escalation_enabled() THEN RETURN 0; END IF;
FOR r IN SELECT * FROM requests WHERE status='pending' AND due_at<now() AND escalated_at IS NULL FOR UPDATE SKIP LOCKED LOOP
UPDATE requests SET escalated_at=now(),updated_at=now() WHERE id=r.id;
PERFORM public._request_event(r.id,'escalated','SLA exceeded',r.current_step);
INSERT INTO notifications(user_id,kind,title,body,link) SELECT user_id,'alert',r.code||' overdue',r.title,'request:'||r.id FROM user_roles WHERE role::text='admin'; n:=n+1;
END LOOP; RETURN n; END;
$fn$;
REVOKE ALL ON FUNCTION public.run_request_escalations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_request_escalations() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_setup_metadata() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE t jsonb; f jsonb; tr jsonb; BEGIN IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
SELECT coalesce(jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,'columns',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'nullable',NOT a.attnotnull) ORDER BY a.attnum),'[]'::jsonb) FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped)) ORDER BY c.relname),'[]'::jsonb) INTO t FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p');
SELECT coalesce(jsonb_agg(DISTINCT p.proname),'[]'::jsonb) INTO f FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public';
SELECT coalesce(jsonb_agg(DISTINCT g.tgname),'[]'::jsonb) INTO tr FROM pg_trigger g JOIN pg_class c ON c.oid=g.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT g.tgisinternal;
RETURN jsonb_build_object('tables',t,'functions',f,'triggers',tr); END;
$fn$;
REVOKE ALL ON FUNCTION public.admin_setup_metadata() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_setup_metadata() TO authenticated, service_role;

INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('leave','Leave','employee','leave',ARRAY['manager','hr'],ARRAY['hr'],0) ON CONFLICT(type) DO NOTHING;
INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('wfh','Work from home','employee','leave',ARRAY['manager','hr'],ARRAY['hr'],1) ON CONFLICT(type) DO NOTHING;
INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('permission','Permission','employee','attendance',ARRAY['manager'],ARRAY['hr'],2) ON CONFLICT(type) DO NOTHING;
INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('attendance_correction','Attendance correction','employee','attendance',ARRAY['manager','hr'],ARRAY['hr'],3) ON CONFLICT(type) DO NOTHING;
INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('volunteer_absence','Volunteer absence','volunteer','leave',ARRAY['coordinator'],ARRAY['admin'],4) ON CONFLICT(type) DO NOTHING;
INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('reimbursement','Reimbursement','employee','money',ARRAY['manager','accounts','finance'],ARRAY['accounts','finance'],5) ON CONFLICT(type) DO NOTHING;
INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('salary_advance','Salary advance','employee','money',ARRAY['manager','hr','finance'],ARRAY['hr','finance'],6) ON CONFLICT(type) DO NOTHING;
INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('payment_request','Payment request','employee','money',ARRAY['manager','accounts','finance'],ARRAY['accounts','finance'],7) ON CONFLICT(type) DO NOTHING;
INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('support_ticket','Support ticket','all','ticket',ARRAY['support'],ARRAY['support'],8) ON CONFLICT(type) DO NOTHING;
INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('document_request','Document request','employee','general',ARRAY['hr'],ARRAY['hr'],9) ON CONFLICT(type) DO NOTHING;
INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('resignation','Resignation','employee','exit',ARRAY['manager','hr'],ARRAY['hr'],10) ON CONFLICT(type) DO NOTHING;
INSERT INTO public.request_routes(type,label,audience,kind,steps,steps_no_manager,sort_order) VALUES('general','General request','all','general',ARRAY['admin'],ARRAY['admin'],11) ON CONFLICT(type) DO NOTHING;

DROP POLICY IF EXISTS recon_request_files_read ON storage.objects;
DROP POLICY IF EXISTS recon_request_files_read ON storage.objects;
CREATE POLICY recon_request_files_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='request-files' AND EXISTS(SELECT 1 FROM public.requests r WHERE r.id::text=split_part(name,'/',1) AND public._request_visible(r.id)));
DROP POLICY IF EXISTS recon_request_files_insert ON storage.objects;
DROP POLICY IF EXISTS recon_request_files_insert ON storage.objects;
CREATE POLICY recon_request_files_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='request-files' AND EXISTS(SELECT 1 FROM public.requests r WHERE r.id::text=split_part(name,'/',1) AND public._request_visible(r.id)));
-- ===== 0005_finance_desk =====
CREATE OR REPLACE FUNCTION public.fin_access(_scope text DEFAULT 'read') RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 IF public.has_role(auth.uid(), 'admin') THEN RETURN true; END IF;
 RETURN EXISTS (SELECT 1 FROM public.department_staff d WHERE d.user_id=auth.uid() AND d.active AND
 CASE _scope WHEN 'accounts' THEN d.department='accounts' WHEN 'finance' THEN d.department='finance'
 WHEN 'manager' THEN d.department IN ('accounts','finance') AND d.level='manager'
 ELSE d.department IN ('accounts','finance') END);
END $$;
REVOKE ALL ON FUNCTION public.fin_access(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fin_access(text) TO authenticated, service_role;
CREATE SEQUENCE IF NOT EXISTS public.fin_ref_seq;
CREATE SEQUENCE IF NOT EXISTS public.crm_collection_ref_seq;

CREATE TABLE IF NOT EXISTS public.fin_accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, kind text NOT NULL DEFAULT 'bank' CHECK(kind IN ('bank','cash','upi','wallet')), bank_name text NOT NULL DEFAULT '', account_last4 text NOT NULL DEFAULT '' CHECK(account_last4 ~ '^[0-9]{0,4}$'), opening_balance numeric(18,2) NOT NULL DEFAULT 0, opening_date date NOT NULL DEFAULT current_date, low_balance_alert numeric(18,2) NOT NULL DEFAULT 0 CHECK(low_balance_alert>=0), active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid DEFAULT auth.uid()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_accounts TO authenticated, service_role;
ALTER TABLE public.fin_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_accounts;
DROP POLICY IF EXISTS finance_read ON public.fin_accounts;
CREATE POLICY finance_read ON public.fin_accounts FOR SELECT TO authenticated USING (public.fin_access());
DROP POLICY IF EXISTS finance_insert ON public.fin_accounts;
DROP POLICY IF EXISTS finance_insert ON public.fin_accounts;
CREATE POLICY finance_insert ON public.fin_accounts FOR INSERT TO authenticated WITH CHECK(public.fin_access('manager'));
DROP POLICY IF EXISTS finance_update ON public.fin_accounts;
DROP POLICY IF EXISTS finance_update ON public.fin_accounts;
CREATE POLICY finance_update ON public.fin_accounts FOR UPDATE TO authenticated USING(public.fin_access('manager')) WITH CHECK(public.fin_access('manager'));

CREATE TABLE IF NOT EXISTS public.fin_vendors (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, kind text NOT NULL DEFAULT 'vendor', contact_name text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', gstin text NOT NULL DEFAULT '', bank_last4 text NOT NULL DEFAULT '' CHECK(bank_last4 ~ '^[0-9]{0,4}$'), notes text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid DEFAULT auth.uid()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_vendors TO authenticated, service_role;
ALTER TABLE public.fin_vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_vendors;
DROP POLICY IF EXISTS finance_read ON public.fin_vendors;
CREATE POLICY finance_read ON public.fin_vendors FOR SELECT TO authenticated USING (public.fin_access());
DROP POLICY IF EXISTS finance_insert ON public.fin_vendors;
DROP POLICY IF EXISTS finance_insert ON public.fin_vendors;
CREATE POLICY finance_insert ON public.fin_vendors FOR INSERT TO authenticated WITH CHECK(public.fin_access('read'));
DROP POLICY IF EXISTS finance_update ON public.fin_vendors;
DROP POLICY IF EXISTS finance_update ON public.fin_vendors;
CREATE POLICY finance_update ON public.fin_vendors FOR UPDATE TO authenticated USING(public.fin_access('read')) WITH CHECK(public.fin_access('read'));

CREATE TABLE IF NOT EXISTS public.fin_budgets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), month date NOT NULL CHECK(extract(day from month)=1), department text NOT NULL DEFAULT 'All', category text NOT NULL, amount numeric(18,2) NOT NULL CHECK(amount>0), created_at timestamptz NOT NULL DEFAULT now(), created_by uuid DEFAULT auth.uid(), UNIQUE(month,department,category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_budgets TO authenticated, service_role;
ALTER TABLE public.fin_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_budgets;
DROP POLICY IF EXISTS finance_read ON public.fin_budgets;
CREATE POLICY finance_read ON public.fin_budgets FOR SELECT TO authenticated USING (public.fin_access());
DROP POLICY IF EXISTS finance_insert ON public.fin_budgets;
DROP POLICY IF EXISTS finance_insert ON public.fin_budgets;
CREATE POLICY finance_insert ON public.fin_budgets FOR INSERT TO authenticated WITH CHECK(public.fin_access('finance'));
DROP POLICY IF EXISTS finance_update ON public.fin_budgets;
DROP POLICY IF EXISTS finance_update ON public.fin_budgets;
CREATE POLICY finance_update ON public.fin_budgets FOR UPDATE TO authenticated USING(public.fin_access('finance')) WITH CHECK(public.fin_access('finance'));

CREATE TABLE IF NOT EXISTS public.fin_dues (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), direction text NOT NULL CHECK(direction IN ('receivable','payable')), party_id uuid REFERENCES public.fin_vendors(id), party_name text NOT NULL DEFAULT '', invoice_ref text NOT NULL DEFAULT '', amount numeric(18,2) NOT NULL CHECK(amount>0), due_date date NOT NULL, description text NOT NULL DEFAULT '', next_follow_up date, hold_status text NOT NULL DEFAULT 'none' CHECK(hold_status IN ('none','disputed','on_hold')), created_at timestamptz NOT NULL DEFAULT now(), created_by uuid DEFAULT auth.uid()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_dues TO authenticated, service_role;
ALTER TABLE public.fin_dues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_dues;
DROP POLICY IF EXISTS finance_read ON public.fin_dues;
CREATE POLICY finance_read ON public.fin_dues FOR SELECT TO authenticated USING (public.fin_access());
DROP POLICY IF EXISTS finance_insert ON public.fin_dues;
DROP POLICY IF EXISTS finance_insert ON public.fin_dues;
CREATE POLICY finance_insert ON public.fin_dues FOR INSERT TO authenticated WITH CHECK(public.fin_access('read'));
DROP POLICY IF EXISTS finance_update ON public.fin_dues;
DROP POLICY IF EXISTS finance_update ON public.fin_dues;
CREATE POLICY finance_update ON public.fin_dues FOR UPDATE TO authenticated USING(public.fin_access('read')) WITH CHECK(public.fin_access('read'));

CREATE TABLE IF NOT EXISTS public.fin_transactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ref text NOT NULL UNIQUE DEFAULT ('FIN-' || lpad(nextval('public.fin_ref_seq')::text,6,'0')), txn_date date NOT NULL DEFAULT current_date, direction text NOT NULL CHECK(direction IN ('in','out')), type text NOT NULL CHECK(type IN ('received','paid','reimbursement','salary','commission','refund','advance','transfer','bank_charge','interest','adjustment')), amount numeric(18,2) NOT NULL CHECK(amount>0), account_id uuid REFERENCES public.fin_accounts(id), mode text NOT NULL DEFAULT 'bank', utr text NOT NULL DEFAULT '', category text NOT NULL DEFAULT '', department text NOT NULL DEFAULT 'All', party_id uuid REFERENCES public.fin_vendors(id), party_name text NOT NULL DEFAULT '', due_id uuid REFERENCES public.fin_dues(id), description text NOT NULL DEFAULT '', proof_path text NOT NULL DEFAULT '', source text NOT NULL DEFAULT 'manual', source_id uuid, corrects_id uuid REFERENCES public.fin_transactions(id), status text NOT NULL DEFAULT 'recorded' CHECK(status IN ('recorded','verified','reconciled','void')), created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), verified_by uuid, verified_at timestamptz, reconciled_by uuid, reconciled_at timestamptz, void_reason text NOT NULL DEFAULT '', voided_by uuid, voided_at timestamptz, UNIQUE(source,source_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_transactions TO authenticated, service_role;
ALTER TABLE public.fin_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_transactions;
DROP POLICY IF EXISTS finance_read ON public.fin_transactions;
CREATE POLICY finance_read ON public.fin_transactions FOR SELECT TO authenticated USING (public.fin_access());

CREATE TABLE IF NOT EXISTS public.fin_bank_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES public.fin_accounts(id), line_date date NOT NULL, description text NOT NULL DEFAULT '', ref text NOT NULL DEFAULT '', amount numeric(18,2) NOT NULL CHECK(amount<>0), status text NOT NULL DEFAULT 'unmatched' CHECK(status IN ('unmatched','matched','reconciled','disputed')), transaction_id uuid REFERENCES public.fin_transactions(id), note text NOT NULL DEFAULT '', imported_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), reconciled_at timestamptz, reconciled_by uuid, UNIQUE(account_id,line_date,description,ref,amount), CHECK(status NOT IN ('matched','reconciled') OR transaction_id IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_bank_lines TO authenticated, service_role;
ALTER TABLE public.fin_bank_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.fin_bank_lines;
DROP POLICY IF EXISTS finance_read ON public.fin_bank_lines;
CREATE POLICY finance_read ON public.fin_bank_lines FOR SELECT TO authenticated USING (public.fin_access());

CREATE TABLE IF NOT EXISTS public.crm_collections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE DEFAULT ('COL-' || lpad(nextval('public.crm_collection_ref_seq')::text,6,'0')), lead_id uuid REFERENCES public.crm_leads(id), owner_id uuid NOT NULL, amount numeric(18,2) NOT NULL CHECK(amount>0 AND amount<=100000000), collected_on date NOT NULL, mode text NOT NULL CHECK(mode IN ('upi','bank_transfer','cash','cheque','card','gateway','other')), reference text NOT NULL DEFAULT '', payer_name text NOT NULL DEFAULT '', note text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'unverified' CHECK(status IN ('unverified','verified','rejected')), recorded_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), verified_by uuid, verified_at timestamptz, verify_note text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_collections TO authenticated, service_role;
ALTER TABLE public.crm_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.crm_collections;
DROP POLICY IF EXISTS finance_read ON public.crm_collections;
CREATE POLICY finance_read ON public.crm_collections FOR SELECT TO authenticated USING (public.fin_access() OR owner_id=auth.uid() OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id=crm_collections.owner_id AND m.active AND m.manager_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.crm_incentive_plans (
 role text PRIMARY KEY CHECK(role IN ('BDE','BDM')), slabs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(slabs)='array'), active boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid DEFAULT auth.uid()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_incentive_plans TO authenticated, service_role;
ALTER TABLE public.crm_incentive_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.crm_incentive_plans;
DROP POLICY IF EXISTS finance_read ON public.crm_incentive_plans;
CREATE POLICY finance_read ON public.crm_incentive_plans FOR SELECT TO authenticated USING (public.fin_access() OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id=auth.uid() AND m.active));

CREATE TABLE IF NOT EXISTS public.zoho_invoices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), zoho_id text NOT NULL UNIQUE, invoice_number text NOT NULL DEFAULT '', customer_name text NOT NULL DEFAULT '', invoice_date date, due_date date, total numeric(18,2) NOT NULL DEFAULT 0, balance numeric(18,2) NOT NULL DEFAULT 0, status text NOT NULL DEFAULT '', currency text NOT NULL DEFAULT 'INR', synced_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zoho_invoices TO authenticated, service_role;
ALTER TABLE public.zoho_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finance_read ON public.zoho_invoices;
DROP POLICY IF EXISTS finance_read ON public.zoho_invoices;
CREATE POLICY finance_read ON public.zoho_invoices FOR SELECT TO authenticated USING (public.fin_access());
CREATE UNIQUE INDEX IF NOT EXISTS fin_bank_lines_transaction_unique ON public.fin_bank_lines(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS fin_transactions_date_idx ON public.fin_transactions(txn_date,account_id);
CREATE INDEX IF NOT EXISTS crm_collections_owner_date_idx ON public.crm_collections(owner_id,collected_on,status);
ALTER TABLE public.volunteer_withdrawals ADD COLUMN IF NOT EXISTS proof_path text;
ALTER TABLE public.volunteer_withdrawals ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.volunteer_withdrawals ADD COLUMN IF NOT EXISTS verified_by uuid;

CREATE OR REPLACE FUNCTION public.fin_account_balances()
RETURNS TABLE(id uuid,name text,kind text,bank_name text,account_last4 text,opening_balance numeric,opening_date date,low_balance_alert numeric,active boolean,balance numeric,unreconciled bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 RETURN QUERY SELECT a.id,a.name,a.kind,a.bank_name,a.account_last4,a.opening_balance,a.opening_date,a.low_balance_alert,a.active,
 a.opening_balance+coalesce((SELECT sum(CASE WHEN t.direction='in' THEN t.amount ELSE -t.amount END) FROM public.fin_transactions t WHERE t.account_id=a.id AND t.status<>'void' AND t.txn_date>=a.opening_date),0),
 (SELECT count(*) FROM public.fin_bank_lines l WHERE l.account_id=a.id AND l.status<>'reconciled') FROM public.fin_accounts a ORDER BY a.name;
END $$;
CREATE OR REPLACE FUNCTION public.fin_budget_status(_month date DEFAULT current_date)
RETURNS TABLE(id uuid,month date,department text,category text,amount numeric,spent numeric,percent numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 RETURN QUERY SELECT b.id,b.month,b.department,b.category,b.amount,s.n,round(100*s.n/b.amount,2)
 FROM public.fin_budgets b CROSS JOIN LATERAL (SELECT coalesce(sum(t.amount),0) n FROM public.fin_transactions t WHERE t.status<>'void' AND t.direction='out' AND t.category=b.category AND (b.department='All' OR t.department=b.department) AND date_trunc('month',t.txn_date)::date=b.month) s
 WHERE b.month=date_trunc('month',_month)::date;
END $$;
CREATE OR REPLACE FUNCTION public.fin_dues_list()
RETURNS TABLE(id uuid,direction text,party_name text,invoice_ref text,amount numeric,due_date date,description text,next_follow_up date,hold_status text,settled numeric,outstanding numeric,status text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 RETURN QUERY SELECT d.id,d.direction,d.party_name,d.invoice_ref,d.amount,d.due_date,d.description,d.next_follow_up,d.hold_status,s.n,greatest(0,d.amount-s.n),
 CASE WHEN s.n>=d.amount THEN 'paid' WHEN d.hold_status<>'none' THEN d.hold_status WHEN d.due_date<(now() AT TIME ZONE 'Asia/Kolkata')::date THEN 'overdue' WHEN s.n>0 THEN 'partial' ELSE 'not_due' END
 FROM public.fin_dues d CROSS JOIN LATERAL (SELECT coalesce(sum(t.amount),0) n FROM public.fin_transactions t WHERE t.due_id=d.id AND t.status<>'void' AND t.direction=CASE d.direction WHEN 'receivable' THEN 'in' ELSE 'out' END) s ORDER BY d.due_date;
END $$;
CREATE OR REPLACE FUNCTION public.fin_record_transaction(_input jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_type text:=_input->>'type'; v_dir text; v_correct uuid:=nullif(_input->>'corrects_id','')::uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 IF (v_type='adjustment' OR v_correct IS NOT NULL) AND NOT public.fin_access('manager') THEN RAISE EXCEPTION 'Manager required for corrections'; END IF;
 v_dir:=CASE WHEN v_type IN ('received','interest') THEN 'in' WHEN v_type IN ('transfer','adjustment') THEN _input->>'direction' ELSE 'out' END;
 IF nullif(_input->>'account_id','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.fin_accounts WHERE id=(_input->>'account_id')::uuid AND active) THEN RAISE EXCEPTION 'Active account required'; END IF;
 IF nullif(_input->>'due_id','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.fin_dues WHERE id=(_input->>'due_id')::uuid AND direction=CASE v_dir WHEN 'in' THEN 'receivable' ELSE 'payable' END) THEN RAISE EXCEPTION 'Due direction mismatch'; END IF;
 INSERT INTO public.fin_transactions(type,direction,amount,txn_date,account_id,mode,utr,category,department,party_id,party_name,due_id,description,proof_path,corrects_id,created_by)
 VALUES(v_type,v_dir,(_input->>'amount')::numeric,coalesce(nullif(_input->>'txn_date','')::date,(now() AT TIME ZONE 'Asia/Kolkata')::date),nullif(_input->>'account_id','')::uuid,coalesce(_input->>'mode','bank'),coalesce(_input->>'utr',''),coalesce(_input->>'category',''),coalesce(nullif(_input->>'department',''),'All'),nullif(_input->>'party_id','')::uuid,coalesce(_input->>'party_name',''),nullif(_input->>'due_id','')::uuid,coalesce(_input->>'description',''),coalesce(_input->>'proof_path',''),v_correct,auth.uid()) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
CREATE OR REPLACE FUNCTION public.fin_verify_transaction(_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t public.fin_transactions;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access('accounts') THEN RAISE EXCEPTION 'Accounts access required'; END IF;
 SELECT * INTO t FROM public.fin_transactions WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR t.status<>'recorded' THEN RAISE EXCEPTION 'Entry must be recorded'; END IF;
 IF t.created_by IS NULL OR t.created_by=auth.uid() THEN RAISE EXCEPTION 'A different person must verify'; END IF;
 UPDATE public.fin_transactions SET status='verified',verified_at=now(),verified_by=auth.uid() WHERE id=_id;
END $$;
CREATE OR REPLACE FUNCTION public.fin_void_transaction(_id uuid,_reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access('manager') THEN RAISE EXCEPTION 'Manager access required'; END IF;
 IF nullif(trim(_reason),'') IS NULL THEN RAISE EXCEPTION 'Reason required'; END IF;
 UPDATE public.fin_transactions SET status='void',void_reason=_reason,voided_by=auth.uid(),voided_at=now() WHERE id=_id AND status IN ('recorded','verified') AND source='manual' AND NOT EXISTS(SELECT 1 FROM public.fin_bank_lines WHERE transaction_id=_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Entry locked or matched; unmatch first'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.fin_bank_line_action(_line uuid,_action text,_txn uuid DEFAULT NULL,_note text DEFAULT '') RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.fin_bank_lines; t public.fin_transactions; v_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access('accounts') THEN RAISE EXCEPTION 'Accounts access required'; END IF;
 SELECT * INTO l FROM public.fin_bank_lines WHERE id=_line FOR UPDATE;
 IF NOT FOUND OR l.status='reconciled' THEN RAISE EXCEPTION 'Line not found or locked'; END IF;
 IF _action='match' THEN
  SELECT * INTO t FROM public.fin_transactions WHERE id=_txn FOR UPDATE;
  IF NOT FOUND OR t.status NOT IN ('recorded','verified') OR t.account_id IS DISTINCT FROM l.account_id OR t.amount<>abs(l.amount) OR t.direction<>(CASE WHEN l.amount>0 THEN 'in' ELSE 'out' END) THEN RAISE EXCEPTION 'Entry does not match account, amount or direction'; END IF;
  UPDATE public.fin_bank_lines SET transaction_id=_txn,status='matched',note=coalesce(_note,'') WHERE id=_line;
 ELSIF _action='reconcile' THEN
  IF l.status<>'matched' THEN RAISE EXCEPTION 'Match the line first'; END IF;
  SELECT * INTO t FROM public.fin_transactions WHERE id=l.transaction_id FOR UPDATE;
  IF t.status<>'verified' OR t.account_id IS DISTINCT FROM l.account_id OR t.amount<>abs(l.amount) OR t.direction<>(CASE WHEN l.amount>0 THEN 'in' ELSE 'out' END) THEN RAISE EXCEPTION 'Matched entry must be verified and consistent'; END IF;
  UPDATE public.fin_transactions SET status='reconciled',reconciled_by=auth.uid(),reconciled_at=now() WHERE id=t.id;
  UPDATE public.fin_bank_lines SET status='reconciled',reconciled_by=auth.uid(),reconciled_at=now() WHERE id=_line;
 ELSIF _action='unmatch' THEN
  UPDATE public.fin_bank_lines SET status='unmatched',transaction_id=NULL,note=coalesce(_note,'') WHERE id=_line;
 ELSIF _action='dispute' THEN
  IF nullif(trim(_note),'') IS NULL THEN RAISE EXCEPTION 'Dispute note required'; END IF;
  UPDATE public.fin_bank_lines SET status='disputed',transaction_id=NULL,note=_note WHERE id=_line;
 ELSIF _action IN ('bank_charge','interest','received') THEN
  IF l.transaction_id IS NOT NULL THEN RAISE EXCEPTION 'Unmatch first'; END IF;
  IF (_action='bank_charge' AND l.amount>0) OR (_action IN ('interest','received') AND l.amount<0) THEN RAISE EXCEPTION 'Invalid direction'; END IF;
  v_id:=public.fin_record_transaction(jsonb_build_object('type',_action,'amount',abs(l.amount),'txn_date',l.line_date,'account_id',l.account_id,'utr',l.ref,'description',l.description,'category',CASE WHEN _action='bank_charge' THEN 'Bank charges' WHEN _action='interest' THEN 'Interest' ELSE '' END));
  UPDATE public.fin_bank_lines SET status='matched',transaction_id=v_id,note=coalesce(_note,'') WHERE id=_line;
 ELSE RAISE EXCEPTION 'Unknown bank action'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.fin_import_bank_lines(_account uuid,_lines jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r jsonb; v_date date; v_amount numeric; v_id uuid; v_txn uuid; v_candidates uuid[]; n_insert int:=0; n_duplicate int:=0; n_invalid int:=0; n_matched int:=0;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access('accounts') THEN RAISE EXCEPTION 'Accounts access required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.fin_accounts WHERE id=_account AND active) THEN RAISE EXCEPTION 'Active account required'; END IF;
 IF jsonb_typeof(_lines)<>'array' OR jsonb_array_length(_lines)>10000 THEN RAISE EXCEPTION 'Expected at most 10000 bank lines'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_account::text,0));
 FOR r IN SELECT value FROM jsonb_array_elements(_lines) LOOP
  BEGIN
   v_date:=(r->>'date')::date; v_amount:=(r->>'amount')::numeric(18,2);
   IF v_date IS NULL OR v_amount IS NULL OR v_amount=0 THEN n_invalid:=n_invalid+1; CONTINUE; END IF;
  EXCEPTION WHEN invalid_text_representation OR datetime_field_overflow OR invalid_datetime_format OR numeric_value_out_of_range THEN n_invalid:=n_invalid+1; CONTINUE;
  END;
  v_id:=NULL;
  INSERT INTO public.fin_bank_lines(account_id,line_date,description,ref,amount) VALUES(_account,v_date,coalesce(r->>'description',''),coalesce(r->>'ref',''),v_amount) ON CONFLICT(account_id,line_date,description,ref,amount) DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN n_duplicate:=n_duplicate+1; CONTINUE; END IF;
  n_insert:=n_insert+1;
  SELECT array_agg(t.id) INTO v_candidates FROM public.fin_transactions t WHERE t.account_id=_account AND t.status IN ('recorded','verified') AND t.amount=abs(v_amount) AND t.direction=CASE WHEN v_amount>0 THEN 'in' ELSE 'out' END
   AND ((nullif(r->>'ref','') IS NOT NULL AND t.utr=r->>'ref') OR abs(t.txn_date-v_date)<=3)
   AND NOT EXISTS(SELECT 1 FROM public.fin_bank_lines b WHERE b.transaction_id=t.id);
  IF cardinality(v_candidates)=1 THEN
   v_txn:=v_candidates[1];
   BEGIN
    PERFORM public.fin_bank_line_action(v_id,'match',v_txn,'Auto-matched (unique candidate)'); n_matched:=n_matched+1;
   EXCEPTION WHEN unique_violation THEN NULL;
   END;
  END IF;
 END LOOP;
 RETURN jsonb_build_object('inserted',n_insert,'duplicates',n_duplicate,'invalid',n_invalid,'matched',n_matched);
END $$;

CREATE OR REPLACE FUNCTION public.crm_record_collection(_lead uuid,_owner uuid,_amount numeric,_date date,_mode text,_reference text,_payer text,_note text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_owner uuid:=_owner; v_lead_owner uuid; v_code text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF NOT public.has_role(auth.uid(),'admin') AND NOT EXISTS(SELECT 1 FROM public.crm_memberships WHERE user_id=auth.uid() AND active AND role IN ('BDE','BDM')) THEN RAISE EXCEPTION 'Sales access required'; END IF;
 IF _lead IS NOT NULL THEN
  SELECT owner_id INTO v_lead_owner FROM public.crm_leads WHERE id=_lead;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  v_owner:=coalesce(v_owner,v_lead_owner);
  IF v_lead_owner IS NOT NULL AND v_owner IS DISTINCT FROM v_lead_owner THEN RAISE EXCEPTION 'Collection owner must match lead owner'; END IF;
 END IF;
 v_owner:=coalesce(v_owner,auth.uid());
 IF NOT EXISTS(SELECT 1 FROM public.crm_memberships WHERE user_id=v_owner AND active AND role IN ('BDE','BDM')) THEN RAISE EXCEPTION 'Active sales owner required'; END IF;
 IF NOT public.has_role(auth.uid(),'admin') AND v_owner<>auth.uid() AND NOT EXISTS(SELECT 1 FROM public.crm_memberships me JOIN public.crm_memberships employee ON employee.manager_id=me.user_id WHERE me.user_id=auth.uid() AND me.active AND me.role='BDM' AND employee.user_id=v_owner AND employee.active) THEN RAISE EXCEPTION 'Owner outside your team'; END IF;
 IF _date IS NULL OR _date>(now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Valid collection date required'; END IF;
 IF _mode<>'cash' AND nullif(trim(_reference),'') IS NULL THEN RAISE EXCEPTION 'Payment reference required'; END IF;
 IF length(_reference)>80 OR length(_payer)>120 OR length(_note)>500 THEN RAISE EXCEPTION 'Collection text too long'; END IF;
 INSERT INTO public.crm_collections(lead_id,owner_id,amount,collected_on,mode,reference,payer_name,note,recorded_by)
 VALUES(_lead,v_owner,_amount,_date,_mode,coalesce(_reference,''),coalesce(_payer,''),coalesce(_note,''),auth.uid()) RETURNING code INTO v_code;
 RETURN v_code;
END $$;
CREATE OR REPLACE FUNCTION public.crm_verify_collection(_id uuid,_approve boolean,_note text DEFAULT '') RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.crm_collections; v_status text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Accounts or Finance access required'; END IF;
 SELECT * INTO c FROM public.crm_collections WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR c.status<>'unverified' THEN RAISE EXCEPTION 'Collection must be unverified'; END IF;
 IF auth.uid() IN (c.owner_id,c.recorded_by) THEN RAISE EXCEPTION 'A different person must verify'; END IF;
 IF _approve IS NULL OR (NOT _approve AND nullif(trim(_note),'') IS NULL) THEN RAISE EXCEPTION 'Decision and rejection reason required'; END IF;
 v_status:=CASE WHEN _approve THEN 'verified' ELSE 'rejected' END;
 UPDATE public.crm_collections SET status=v_status,verified_by=auth.uid(),verified_at=now(),verify_note=coalesce(_note,'') WHERE id=_id;
 RETURN v_status;
END $$;

CREATE OR REPLACE FUNCTION public.finance_withdrawals()
RETURNS TABLE(id uuid,request_number text,volunteer_id uuid,volunteer_name text,volunteer_code text,kyc_status text,amount numeric,payout_masked text,method text,status text,requested_at timestamptz,processed_at timestamptz,paid_at timestamptz,transaction_id text,rejection_reason text,proof_path text,verified_at timestamptz,verified_by uuid,verified_by_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 RETURN QUERY SELECT w.id,w.request_number,w.volunteer_id,v.full_name,v.volunteer_code,v.kyc_status,w.amount::numeric,w.payout_masked,w.method,w.status,w.requested_at,w.processed_at,w.paid_at,w.transaction_id,w.rejection_reason,w.proof_path,w.verified_at,w.verified_by,p.display_name
 FROM public.volunteer_withdrawals w JOIN public.volunteers v ON v.id=w.volunteer_id LEFT JOIN public.profiles p ON p.id=w.verified_by ORDER BY w.requested_at DESC;
END $$;
DROP FUNCTION IF EXISTS public.volunteer_process_withdrawal(uuid,text,text,text);
CREATE OR REPLACE FUNCTION public.volunteer_process_withdrawal(_id uuid,_status text,_transaction_id text DEFAULT NULL,_reason text DEFAULT NULL,_proof_path text DEFAULT NULL,_account_id uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE w public.volunteer_withdrawals; v public.volunteers;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 SELECT * INTO w FROM public.volunteer_withdrawals WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR w.status NOT IN ('pending','processing') THEN RAISE EXCEPTION 'Withdrawal not found or final'; END IF;
 SELECT * INTO v FROM public.volunteers WHERE id=w.volunteer_id FOR UPDATE;
 IF v.user_id=auth.uid() THEN RAISE EXCEPTION 'Cannot process your own withdrawal'; END IF;
 IF _status='processing' THEN
  IF NOT public.fin_access('accounts') OR w.status<>'pending' THEN RAISE EXCEPTION 'Accounts must verify a pending withdrawal'; END IF;
  IF v.kyc_status<>'verified' THEN RAISE EXCEPTION 'Verified KYC required'; END IF;
  UPDATE public.volunteer_withdrawals SET status='processing',verified_at=now(),verified_by=auth.uid(),processed_at=now(),updated_by=auth.uid() WHERE id=_id;
 ELSIF _status='paid' THEN
  IF NOT public.fin_access('finance') OR w.status<>'processing' OR w.verified_by IS NULL OR w.verified_by=auth.uid() THEN RAISE EXCEPTION 'A different Finance person must pay after verification'; END IF;
  IF v.kyc_status<>'verified' THEN RAISE EXCEPTION 'Verified KYC required'; END IF;
  IF nullif(trim(_transaction_id),'') IS NULL OR nullif(trim(_proof_path),'') IS NULL THEN RAISE EXCEPTION 'UTR and proof required'; END IF;
  IF _account_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.fin_accounts WHERE id=_account_id AND active) THEN RAISE EXCEPTION 'Active account required'; END IF;
  UPDATE public.volunteer_withdrawals SET status='paid',paid_at=now(),processed_at=now(),transaction_id=_transaction_id,proof_path=_proof_path,updated_by=auth.uid() WHERE id=_id;
  INSERT INTO public.fin_transactions(txn_date,direction,type,amount,account_id,mode,utr,category,department,party_name,description,proof_path,source,source_id,status,created_by,verified_by,verified_at)
  VALUES((now() AT TIME ZONE 'Asia/Kolkata')::date,'out','commission',w.amount,_account_id,w.method,_transaction_id,'Volunteer commission','volunteers',v.full_name,w.request_number,_proof_path,'volunteer_withdrawal',w.id,'verified',auth.uid(),w.verified_by,w.verified_at);
 ELSIF _status='rejected' THEN
  IF NOT (public.fin_access('accounts') OR public.fin_access('finance')) OR nullif(trim(_reason),'') IS NULL THEN RAISE EXCEPTION 'Authorized rejection and reason required'; END IF;
  UPDATE public.volunteer_withdrawals SET status='rejected',rejection_reason=_reason,processed_at=now(),updated_by=auth.uid() WHERE id=_id;
 ELSE RAISE EXCEPTION 'Unsupported withdrawal status'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.fin_overview() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE o jsonb; v_month date:=date_trunc('month',now() AT TIME ZONE 'Asia/Kolkata')::date; request_stats jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.fin_access() THEN RAISE EXCEPTION 'Finance access required'; END IF;
 SELECT jsonb_build_object(
 'bank_balance',coalesce(sum(balance) FILTER(WHERE active AND kind<>'cash'),0),
 'cash_balance',coalesce(sum(balance) FILTER(WHERE active AND kind='cash'),0),
 'accounts',count(*) FILTER(WHERE active),
 'low_balance',count(*) FILTER(WHERE active AND low_balance_alert>0 AND balance<low_balance_alert)) INTO o FROM public.fin_account_balances();
 SELECT o || jsonb_build_object(
 'received_month',coalesce(sum(amount) FILTER(WHERE direction='in' AND txn_date>=v_month),0),
 'paid_month',coalesce(sum(amount) FILTER(WHERE direction='out' AND txn_date>=v_month),0),
 'unverified_entries',count(*) FILTER(WHERE status='recorded'),
 'missing_proof',count(*) FILTER(WHERE direction='out' AND nullif(proof_path,'') IS NULL)) INTO o FROM public.fin_transactions WHERE status<>'void';
 SELECT o || jsonb_build_object(
 'receivables',coalesce(sum(outstanding) FILTER(WHERE direction='receivable'),0),
 'payables',coalesce(sum(outstanding) FILTER(WHERE direction='payable'),0),
 'overdue_receivables',count(*) FILTER(WHERE direction='receivable' AND outstanding>0 AND due_date<(now() AT TIME ZONE 'Asia/Kolkata')::date),
 'overdue_payables',count(*) FILTER(WHERE direction='payable' AND outstanding>0 AND due_date<(now() AT TIME ZONE 'Asia/Kolkata')::date)) INTO o FROM public.fin_dues_list();
 SELECT o || jsonb_build_object('volunteer_pending',count(*),'volunteer_pending_amount',coalesce(sum(amount),0)) INTO o FROM public.volunteer_withdrawals WHERE status IN ('pending','processing');
 o:=o || jsonb_build_object('unreconciled_lines',(SELECT count(*) FROM public.fin_bank_lines WHERE status<>'reconciled'),'budgets_over_75',(SELECT count(*) FROM public.fin_budget_status(v_month) WHERE percent>=75));
 SELECT o || jsonb_build_object('monthly',coalesce(jsonb_agg(jsonb_build_object('month',to_char(m.month,'YYYY-MM'),'income',s.income,'expense',s.expense) ORDER BY m.month),'[]'::jsonb)) INTO o
 FROM generate_series(v_month-interval '11 months',v_month,interval '1 month') m(month)
 CROSS JOIN LATERAL (SELECT coalesce(sum(t.amount) FILTER(WHERE t.direction='in'),0) income,coalesce(sum(t.amount) FILTER(WHERE t.direction='out'),0) expense FROM public.fin_transactions t WHERE t.status<>'void' AND t.txn_date>=m.month::date AND t.txn_date<(m.month+interval '1 month')::date) s;
 SELECT o || jsonb_build_object('categories',coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb)) INTO o FROM (SELECT category,sum(amount) amount FROM public.fin_transactions WHERE status<>'void' AND direction='out' AND txn_date>=v_month AND txn_date<(v_month+interval '1 month')::date GROUP BY category ORDER BY sum(amount) DESC) c;
 IF to_regclass('public.requests') IS NOT NULL THEN
  EXECUTE $q$
   SELECT jsonb_build_object(
    'pending_expenses',count(*) FILTER(WHERE j->>'status'='pending' AND j->>'type' IN ('expense','expense_claim','reimbursement')),
    'pending_expense_amount',coalesce(sum(nullif(j->>'amount','')::numeric) FILTER(WHERE j->>'status'='pending' AND j->>'type' IN ('expense','expense_claim','reimbursement')),0),
    'pending_approvals',count(*) FILTER(WHERE j->>'status'='pending' AND (j->>'kind'='money' OR nullif(j->>'amount','')::numeric>0)),
    'ready_to_pay',count(*) FILTER(WHERE j->>'status'='approved' AND nullif(j->>'amount','')::numeric>0),
    'ready_to_pay_amount',coalesce(sum(nullif(j->>'amount','')::numeric) FILTER(WHERE j->>'status'='approved' AND nullif(j->>'amount','')::numeric>0),0))
   FROM (SELECT to_jsonb(r) j FROM public.requests r) x
  $q$ INTO request_stats;
 ELSE
  request_stats:=jsonb_build_object('pending_expenses',NULL,'pending_expense_amount',NULL,'pending_approvals',NULL,'ready_to_pay',NULL,'ready_to_pay_amount',NULL);
 END IF;
 RETURN o || request_stats;
END $$;

DO $$
DECLARE r record;
BEGIN
 FOR r IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('fin_account_balances','fin_bank_line_action','fin_budget_status','fin_dues_list','fin_import_bank_lines','fin_overview','fin_record_transaction','fin_verify_transaction','fin_void_transaction','finance_withdrawals','crm_record_collection','crm_verify_collection','volunteer_process_withdrawal') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon',r.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role',r.signature);
 END LOOP;
END $$;
GRANT USAGE, SELECT ON SEQUENCE public.fin_ref_seq,public.crm_collection_ref_seq TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.fin_transactions,public.fin_bank_lines,public.crm_collections,public.crm_incentive_plans,public.zoho_invoices FROM authenticated;
-- ===== 0006_research_settings_support =====
CREATE OR REPLACE FUNCTION public.c_department_access(_department text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ok boolean := false;
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 IF public.has_role(auth.uid(),'admin') THEN RETURN true; END IF;
 IF to_regclass('public.department_staff') IS NOT NULL THEN
  EXECUTE 'SELECT EXISTS(SELECT 1 FROM public.department_staff WHERE user_id=$1 AND department=$2 AND active)' INTO ok USING auth.uid(),_department;
 END IF;
 RETURN ok;
END $$;
REVOKE ALL ON FUNCTION public.c_department_access(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.c_department_access(text) TO authenticated,service_role;

CREATE TABLE IF NOT EXISTS public.critical_changes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE DEFAULT ('CHG-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
 kind text NOT NULL CHECK(kind IN ('payment_option','payout_rules','form_commission','volunteer_rate','incentive_plan')),
 target text NOT NULL, payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'), current jsonb NOT NULL DEFAULT '{}', summary text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','applied','rejected')), requested_by uuid NOT NULL REFERENCES auth.users(id), requested_at timestamptz NOT NULL DEFAULT now(),
 decided_by uuid REFERENCES auth.users(id), decided_at timestamptz, note text NOT NULL DEFAULT '', CHECK(decided_by IS NULL OR decided_by<>requested_by)
);
GRANT ALL ON public.critical_changes TO service_role;
REVOKE ALL ON public.critical_changes FROM anon,authenticated;
GRANT SELECT ON public.critical_changes TO authenticated;
ALTER TABLE public.critical_changes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_admin_read ON public.critical_changes;
DROP POLICY IF EXISTS c_admin_read ON public.critical_changes;
CREATE POLICY c_admin_read ON public.critical_changes FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.customer_tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_code text NOT NULL UNIQUE,
 full_name text NOT NULL, email text NOT NULL, phone text NOT NULL DEFAULT '', customer_reference text,
 category text NOT NULL, priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('normal','high','urgent')),
 subject text NOT NULL, description text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','waiting_customer','resolved','closed')),
 assigned_to uuid REFERENCES auth.users(id), resolution text NOT NULL DEFAULT '', private_notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.customer_tickets TO service_role;
REVOKE ALL ON public.customer_tickets FROM anon,authenticated;
GRANT SELECT ON public.customer_tickets TO authenticated;
GRANT UPDATE(status,priority,assigned_to,resolution) ON public.customer_tickets TO authenticated;
ALTER TABLE public.customer_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_support_read ON public.customer_tickets;
DROP POLICY IF EXISTS c_support_read ON public.customer_tickets;
CREATE POLICY c_support_read ON public.customer_tickets FOR SELECT TO authenticated USING(public.c_department_access('support'));
DROP POLICY IF EXISTS c_support_update ON public.customer_tickets;
DROP POLICY IF EXISTS c_support_update ON public.customer_tickets;
CREATE POLICY c_support_update ON public.customer_tickets FOR UPDATE TO authenticated USING(public.c_department_access('support')) WITH CHECK(public.c_department_access('support'));
CREATE OR REPLACE FUNCTION public.c_ticket_stamp() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE prefix text; n integer;
BEGIN
 IF TG_OP='INSERT' THEN
  prefix := 'TKT-'||to_char(now() AT TIME ZONE 'Asia/Kolkata','YYMMDD')||'-';
  PERFORM pg_advisory_xact_lock(hashtextextended(prefix,0));
  SELECT coalesce(max(right(ticket_code,5)::integer),0)+1 INTO n FROM public.customer_tickets WHERE ticket_code LIKE prefix||'%' AND ticket_code ~ '^TKT-[0-9]{6}-[0-9]{5}$';
  IF n>99999 THEN RAISE EXCEPTION 'Daily ticket capacity reached'; END IF;
  NEW.ticket_code:=prefix||lpad(n::text,5,'0');
 END IF;
 NEW.updated_at:=now(); RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS c_ticket_stamp ON public.customer_tickets;
DROP TRIGGER IF EXISTS c_ticket_stamp ON public.customer_tickets;
CREATE TRIGGER c_ticket_stamp BEFORE INSERT OR UPDATE ON public.customer_tickets FOR EACH ROW EXECUTE FUNCTION public.c_ticket_stamp();

CREATE TABLE IF NOT EXISTS public.global_settings (
 key text PRIMARY KEY, value jsonb NOT NULL DEFAULT 'null', category text NOT NULL DEFAULT 'General', label text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', is_public boolean NOT NULL DEFAULT false,
 updated_by uuid REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(NOT is_public OR key !~* '(secret|token|password|credential|api.?key|cipher)')
);
GRANT ALL ON public.global_settings TO service_role;
REVOKE ALL ON public.global_settings FROM anon,authenticated;
GRANT SELECT ON public.global_settings TO anon,authenticated;
GRANT UPDATE(value,updated_by,updated_at) ON public.global_settings TO authenticated;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_settings_read ON public.global_settings;
DROP POLICY IF EXISTS c_settings_read ON public.global_settings;
CREATE POLICY c_settings_read ON public.global_settings FOR SELECT TO anon,authenticated USING(is_public OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS c_settings_update ON public.global_settings;
DROP POLICY IF EXISTS c_settings_update ON public.global_settings;
CREATE POLICY c_settings_update ON public.global_settings FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.integration_connections (
 provider text PRIMARY KEY, config jsonb NOT NULL DEFAULT '{}', secret_cipher text NOT NULL DEFAULT '', enabled boolean NOT NULL DEFAULT true,
 status text NOT NULL DEFAULT 'disconnected' CHECK(status IN ('connected','disconnected','error')), last_error text NOT NULL DEFAULT '',
 last_tested_at timestamptz, last_sync_at timestamptz, connected_at timestamptz, connected_by uuid REFERENCES auth.users(id), updated_by uuid REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.integration_connections FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.integration_connections TO service_role;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_service_only ON public.integration_connections;
DROP POLICY IF EXISTS c_service_only ON public.integration_connections;
CREATE POLICY c_service_only ON public.integration_connections TO service_role USING(true) WITH CHECK(true);

CREATE TABLE IF NOT EXISTS public.integration_sync_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, action text NOT NULL DEFAULT 'sync', ok boolean NOT NULL, message text NOT NULL DEFAULT '', items integer NOT NULL DEFAULT 0 CHECK(items>=0), actor_id uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.integration_sync_logs TO service_role;
REVOKE ALL ON public.integration_sync_logs FROM anon,authenticated;
GRANT SELECT ON public.integration_sync_logs TO authenticated;
ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_logs_read ON public.integration_sync_logs;
DROP POLICY IF EXISTS c_logs_read ON public.integration_sync_logs;
CREATE POLICY c_logs_read ON public.integration_sync_logs FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.research_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE DEFAULT ('RES-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
 title text NOT NULL, requested_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id), requester_name text NOT NULL DEFAULT '', department text NOT NULL DEFAULT '', criteria text NOT NULL DEFAULT '', industry text NOT NULL DEFAULT '', location text NOT NULL DEFAULT '',
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 10000), difficulty text NOT NULL CHECK(difficulty IN ('simple','medium','advanced')), due_date date NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','partial','delivered','cancelled')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.research_requests TO service_role;
REVOKE ALL ON public.research_requests FROM anon,authenticated;
GRANT SELECT ON public.research_requests TO authenticated;
ALTER TABLE public.research_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_requests_read ON public.research_requests;
DROP POLICY IF EXISTS c_requests_read ON public.research_requests;
CREATE POLICY c_requests_read ON public.research_requests FOR SELECT TO authenticated USING(requested_by=auth.uid() OR public.c_department_access('research'));

CREATE TABLE IF NOT EXISTS public.research_leads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company text NOT NULL, contact_name text NOT NULL DEFAULT '', designation text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', website text NOT NULL DEFAULT '', industry text NOT NULL DEFAULT '', location text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
 verified_at timestamptz, verified_by uuid REFERENCES auth.users(id), created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.research_leads TO service_role;
REVOKE ALL ON public.research_leads FROM anon,authenticated;
GRANT SELECT ON public.research_leads TO authenticated;
ALTER TABLE public.research_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_bank_read ON public.research_leads;
DROP POLICY IF EXISTS c_bank_read ON public.research_leads;
CREATE POLICY c_bank_read ON public.research_leads FOR SELECT TO authenticated USING(public.c_department_access('research'));

CREATE TABLE IF NOT EXISTS public.research_request_leads (
 request_id uuid NOT NULL REFERENCES public.research_requests(id) ON DELETE CASCADE, lead_id uuid NOT NULL REFERENCES public.research_leads(id), reused boolean NOT NULL DEFAULT false, delivered_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(request_id,lead_id)
);
GRANT ALL ON public.research_request_leads TO service_role;
REVOKE ALL ON public.research_request_leads FROM anon,authenticated;
GRANT SELECT ON public.research_request_leads TO authenticated;
ALTER TABLE public.research_request_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_links_read ON public.research_request_leads;
DROP POLICY IF EXISTS c_links_read ON public.research_request_leads;
CREATE POLICY c_links_read ON public.research_request_leads FOR SELECT TO authenticated USING(public.c_department_access('research') OR (delivered_at IS NOT NULL AND EXISTS(SELECT 1 FROM public.research_requests r WHERE r.id=request_id AND r.requested_by=auth.uid())));
DROP POLICY IF EXISTS c_delivered_read ON public.research_leads;
DROP POLICY IF EXISTS c_delivered_read ON public.research_leads;
CREATE POLICY c_delivered_read ON public.research_leads FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.research_request_leads l JOIN public.research_requests r ON r.id=l.request_id WHERE l.lead_id=research_leads.id AND l.delivered_at IS NOT NULL AND r.requested_by=auth.uid()));

CREATE TABLE IF NOT EXISTS public.research_feedback (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL UNIQUE REFERENCES public.research_requests(id) ON DELETE CASCADE, relevance integer NOT NULL CHECK(relevance BETWEEN 1 AND 5), usefulness integer NOT NULL CHECK(usefulness BETWEEN 1 AND 5), comment text NOT NULL DEFAULT '', created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.research_feedback TO service_role;
REVOKE ALL ON public.research_feedback FROM anon,authenticated;
GRANT SELECT,INSERT ON public.research_feedback TO authenticated;
ALTER TABLE public.research_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_feedback_read ON public.research_feedback;
DROP POLICY IF EXISTS c_feedback_read ON public.research_feedback;
CREATE POLICY c_feedback_read ON public.research_feedback FOR SELECT TO authenticated USING(public.c_department_access('research') OR EXISTS(SELECT 1 FROM public.research_requests r WHERE r.id=request_id AND r.requested_by=auth.uid()));
DROP POLICY IF EXISTS c_feedback_insert ON public.research_feedback;
DROP POLICY IF EXISTS c_feedback_insert ON public.research_feedback;
CREATE POLICY c_feedback_insert ON public.research_feedback FOR INSERT TO authenticated WITH CHECK(created_by=auth.uid() AND EXISTS(SELECT 1 FROM public.research_requests r WHERE r.id=request_id AND r.requested_by=auth.uid() AND r.status IN ('partial','delivered')));

CREATE TABLE IF NOT EXISTS public.settings_change_log (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), area text NOT NULL, item text NOT NULL, action text NOT NULL, actor_id uuid REFERENCES auth.users(id), actor_name text NOT NULL DEFAULT 'System', changes jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.settings_change_log TO service_role;
REVOKE ALL ON public.settings_change_log FROM anon,authenticated;
GRANT SELECT ON public.settings_change_log TO authenticated;
ALTER TABLE public.settings_change_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_history_read ON public.settings_change_log;
DROP POLICY IF EXISTS c_history_read ON public.settings_change_log;
CREATE POLICY c_history_read ON public.settings_change_log FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.first_admin_setup_status() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE first_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('public.first_admin_setup',0));
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE role::text='admin') THEN RETURN 'closed'; END IF;
 SELECT id INTO first_id FROM auth.users WHERE coalesce(email,'') NOT ILIKE '%@riloyd.demo' ORDER BY created_at,id LIMIT 1;
 IF first_id=auth.uid() THEN RETURN 'eligible'; END IF;
 RETURN 'closed';
END $$;
CREATE OR REPLACE FUNCTION public.claim_first_admin() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('public.first_admin_setup',0));
 IF public.first_admin_setup_status()<>'eligible' OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'Setup unavailable'; END IF;
 INSERT INTO public.user_roles(user_id,role) VALUES(auth.uid(),'admin'); RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.crm_role() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r text;
BEGIN
 IF auth.uid() IS NULL THEN RETURN NULL; END IF;
 IF public.has_role(auth.uid(),'admin') THEN RETURN 'admin'; END IF;
 SELECT role INTO r FROM public.crm_memberships WHERE user_id=auth.uid() AND active; RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.can_view_people_profiles() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 RETURN public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator') OR public.crm_role() IS NOT NULL
 OR EXISTS(SELECT 1 FROM public.registration_applications a JOIN auth.users u ON lower(a.email)=lower(u.email) WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL AND a.status='approved');
END $$;
CREATE OR REPLACE FUNCTION public.crm_create_lead(_input jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r text; owner uuid; c uuid; l uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 r:=public.crm_role(); owner:=(_input->>'ownerId')::uuid;
 IF r IS NULL OR r='support' THEN RAISE EXCEPTION 'Sales access required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.crm_memberships WHERE user_id=owner AND active AND role<>'support') THEN RAISE EXCEPTION 'Invalid owner'; END IF;
 IF r<>'admin' AND owner<>auth.uid() AND NOT(r='BDM' AND EXISTS(SELECT 1 FROM public.crm_memberships WHERE user_id=owner AND manager_id=auth.uid() AND active)) THEN RAISE EXCEPTION 'Owner outside scope'; END IF;
 IF coalesce(length(trim(_input->>'title')),0)=0 OR coalesce(length(trim(_input->>'fullName')),0)=0 OR coalesce((_input->>'amount')::numeric,-1) NOT BETWEEN 0 AND 1e10 THEN RAISE EXCEPTION 'Invalid lead'; END IF;
 INSERT INTO public.crm_customers(customer_code,full_name,email,phone,company,owner_id,acknowledgement) VALUES('CUS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)),_input->>'fullName',coalesce(_input->>'email',''),coalesce(_input->>'phone',''),coalesce(_input->>'company',''),owner,nullif(_input->>'acknowledgement','')) RETURNING id INTO c;
 INSERT INTO public.crm_leads(customer_id,title,amount,owner_id,next_follow_up,source,stage) VALUES(c,_input->>'title',(_input->>'amount')::numeric,owner,nullif(_input->>'followUp','')::date,'manual','new') RETURNING id INTO l; RETURN l;
END $$;
CREATE OR REPLACE FUNCTION public.crm_customer_lookup(_reference text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r text; result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 r:=public.crm_role(); IF r IS NULL THEN RAISE EXCEPTION 'CRM access required'; END IF;
 IF length(trim(_reference))<6 THEN RAISE EXCEPTION 'Exact customer reference required'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',c.id,'customer_code',c.customer_code,'full_name',c.full_name,'email',c.email,'phone',c.phone,'company',c.company,'acknowledgement',c.acknowledgement)),'[]') INTO result FROM public.crm_customers c
 WHERE (lower(c.customer_code)=lower(trim(_reference)) OR lower(c.acknowledgement)=lower(trim(_reference)))
 AND (r IN ('admin','support') OR c.owner_id=auth.uid() OR (r='BDM' AND EXISTS(SELECT 1 FROM public.crm_memberships m WHERE m.user_id=c.owner_id AND m.manager_id=auth.uid() AND m.active)));
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.research_request_create(_title text,_criteria text,_industry text,_location text,_quantity integer,_difficulty text,_department text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d date := (now() AT TIME ZONE 'Asia/Kolkata')::date; days integer; result uuid; nm text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF length(trim(_title))<3 OR _quantity IS NULL OR _quantity NOT BETWEEN 1 AND 10000 OR _difficulty IS NULL OR _difficulty NOT IN ('simple','medium','advanced') THEN RAISE EXCEPTION 'Invalid request'; END IF;
 days:=CASE _difficulty WHEN 'simple' THEN 2 WHEN 'medium' THEN 5 ELSE 10 END;
 WHILE days>0 LOOP d:=d+1; IF extract(dow FROM d)<>0 THEN days:=days-1; END IF; END LOOP;
 SELECT display_name INTO nm FROM public.profiles WHERE id=auth.uid();
 INSERT INTO public.research_requests(title,requested_by,requester_name,criteria,industry,location,quantity,difficulty,department,due_date)
 VALUES(trim(_title),auth.uid(),coalesce(nm,'Member'),coalesce(_criteria,''),coalesce(_industry,''),coalesce(_location,''),_quantity,_difficulty,coalesce(_department,''),d) RETURNING id INTO result; RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.research_cancel(_request uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 UPDATE public.research_requests SET status='cancelled',updated_at=now() WHERE id=_request AND (requested_by=auth.uid() OR public.c_department_access('research')) AND status NOT IN ('delivered','cancelled');
 IF NOT FOUND THEN RAISE EXCEPTION 'Request unavailable'; END IF; RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.research_add_lead(_request uuid,_lead jsonb,_verified boolean) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result uuid; r public.research_requests;
BEGIN
 IF auth.uid() IS NULL OR NOT public.c_department_access('research') THEN RAISE EXCEPTION 'Research access required'; END IF;
 SELECT * INTO r FROM public.research_requests WHERE id=_request FOR UPDATE;
 IF NOT FOUND OR r.status IN ('delivered','cancelled') THEN RAISE EXCEPTION 'Request closed or missing'; END IF;
 IF coalesce(length(trim(_lead->>'company')),0)=0 THEN RAISE EXCEPTION 'Company required'; END IF;
 IF (SELECT count(*) FROM public.research_request_leads WHERE request_id=_request)>=r.quantity THEN RAISE EXCEPTION 'Requested quantity reached'; END IF;
 INSERT INTO public.research_leads(company,contact_name,designation,phone,email,website,industry,location,notes,verified_at,verified_by,created_by)
 VALUES(_lead->>'company',coalesce(_lead->>'contact_name',''),coalesce(_lead->>'designation',''),coalesce(_lead->>'phone',''),coalesce(_lead->>'email',''),coalesce(_lead->>'website',''),coalesce(_lead->>'industry',''),coalesce(_lead->>'location',''),coalesce(_lead->>'notes',''),CASE WHEN _verified THEN now() END,CASE WHEN _verified THEN auth.uid() END,auth.uid()) RETURNING id INTO result;
 INSERT INTO public.research_request_leads(request_id,lead_id) VALUES(_request,result);
 UPDATE public.research_requests SET status=CASE WHEN status='open' THEN 'in_progress' ELSE status END,updated_at=now() WHERE id=_request; RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.research_reverify(_lead uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.c_department_access('research') THEN RAISE EXCEPTION 'Research access required'; END IF;
 UPDATE public.research_leads SET verified_at=now(),verified_by=auth.uid(),updated_at=now() WHERE id=_lead;
 IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF; RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.research_reuse_leads(_request uuid,_limit integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.research_requests; n integer; cap integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.c_department_access('research') THEN RAISE EXCEPTION 'Research access required'; END IF;
 SELECT * INTO r FROM public.research_requests WHERE id=_request FOR UPDATE;
 IF NOT FOUND OR r.status IN ('delivered','cancelled') THEN RAISE EXCEPTION 'Request closed or missing'; END IF;
 SELECT greatest(0,least(coalesce(_limit,0),r.quantity-count(*)::integer)) INTO cap FROM public.research_request_leads WHERE request_id=_request;
 INSERT INTO public.research_request_leads(request_id,lead_id,reused)
 SELECT _request,l.id,true FROM public.research_leads l WHERE l.verified_at>=now()-interval '90 days' AND (r.industry='' OR l.industry ILIKE '%'||r.industry||'%') AND (r.location='' OR l.location ILIKE '%'||r.location||'%') AND NOT EXISTS(SELECT 1 FROM public.research_request_leads x WHERE x.request_id=_request AND x.lead_id=l.id) ORDER BY l.verified_at DESC,l.id LIMIT cap ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n>0 THEN UPDATE public.research_requests SET status=CASE WHEN status='open' THEN 'in_progress' ELSE status END,updated_at=now() WHERE id=_request; END IF; RETURN n;
END $$;
CREATE OR REPLACE FUNCTION public.research_deliver(_request uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.research_requests; n integer; total integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.c_department_access('research') THEN RAISE EXCEPTION 'Research access required'; END IF;
 SELECT * INTO r FROM public.research_requests WHERE id=_request FOR UPDATE;
 IF NOT FOUND OR r.status IN ('delivered','cancelled') THEN RAISE EXCEPTION 'Request closed or missing'; END IF;
 UPDATE public.research_request_leads x SET delivered_at=now() FROM public.research_leads l WHERE x.request_id=_request AND x.lead_id=l.id AND x.delivered_at IS NULL AND l.verified_at>=now()-interval '90 days';
 GET DIAGNOSTICS n=ROW_COUNT;
 SELECT count(*) INTO total FROM public.research_request_leads WHERE request_id=_request AND delivered_at IS NOT NULL;
 UPDATE public.research_requests SET status=CASE WHEN total>=quantity THEN 'delivered' WHEN total>0 THEN 'partial' ELSE 'in_progress' END,updated_at=now() WHERE id=_request; RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.c_settings_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a jsonb := '{}'; b jsonb := '{}'; delta jsonb; who uuid; area_name text;
BEGIN
 IF TG_OP<>'INSERT' THEN a:=to_jsonb(OLD); END IF;
 IF TG_OP<>'DELETE' THEN b:=to_jsonb(NEW); END IF;
 who:=coalesce(auth.uid(),nullif(b->>'updated_by','')::uuid);
 SELECT coalesce(jsonb_object_agg(k,'"changed"'::jsonb),'{}') INTO delta FROM (SELECT key k FROM jsonb_each(a||b) WHERE a->key IS DISTINCT FROM b->key AND key NOT IN ('updated_at','updated_by')) s;
 area_name:=CASE TG_TABLE_NAME WHEN 'integration_connections' THEN 'Integrations' WHEN 'google_copy_settings' THEN 'Google Sheet & Drive' WHEN 'payment_options' THEN 'Payment configuration' ELSE 'Settings' END;
 IF delta<>'{}' THEN INSERT INTO public.settings_change_log(area,item,action,actor_id,actor_name,changes)
 VALUES(area_name,coalesce(b->>'key',a->>'key',b->>'provider',a->>'provider',b->>'form_key',a->>'form_key',TG_TABLE_NAME),TG_OP,who,coalesce((SELECT display_name FROM public.profiles WHERE id=who),'System'),delta); END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.admin_integration_status()
RETURNS TABLE(provider text,config jsonb,enabled boolean,status text,last_error text,last_tested_at timestamptz,last_sync_at timestamptz,has_secret boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 RETURN QUERY SELECT c.provider,(SELECT coalesce(jsonb_object_agg(e.key,e.value),'{}') FROM jsonb_each(c.config) e WHERE e.key IN ('organization_id','region','page_id','ad_account_id','accounts_domain','api_domain')),c.enabled,c.status,c.last_error,c.last_tested_at,c.last_sync_at,c.secret_cipher<>'' FROM public.integration_connections c;
END $$;
CREATE OR REPLACE FUNCTION public.integration_report(_provider text,_ok boolean,_message text DEFAULT '',_items integer DEFAULT 0) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 INSERT INTO public.integration_sync_logs(provider,action,ok,message,items) VALUES(_provider,'sync',_ok,CASE WHEN _ok THEN 'Sync completed' ELSE 'Integration failed; inspect secure server logs' END,greatest(coalesce(_items,0),0));
 UPDATE public.integration_connections SET status=CASE WHEN _ok THEN 'connected' ELSE 'error' END,last_error=CASE WHEN _ok THEN '' ELSE 'Integration failed; inspect secure server logs' END,last_sync_at=CASE WHEN _ok THEN now() ELSE last_sync_at END,updated_at=now() WHERE provider=_provider;
 IF NOT _ok AND to_regclass('public.notifications') IS NOT NULL AND
 (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name IN ('user_id','title','body'))=3 THEN
  EXECUTE 'INSERT INTO public.notifications(user_id,title,body) SELECT DISTINCT user_id,$1,$2 FROM public.user_roles WHERE role::text=''admin''' USING 'Integration failure: '||_provider,'Review the Integration Centre and secure server logs.';
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.c_critical_write_context(tx bigint PRIMARY KEY, actor uuid NOT NULL);
REVOKE ALL ON public.c_critical_write_context FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.c_critical_write_context TO service_role;
ALTER TABLE public.c_critical_write_context ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_context_service ON public.c_critical_write_context;
DROP POLICY IF EXISTS c_context_service ON public.c_critical_write_context;
CREATE POLICY c_context_service ON public.c_critical_write_context TO service_role USING(true) WITH CHECK(true);
CREATE OR REPLACE FUNCTION public.c_critical_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_TABLE_NAME='volunteers' AND TG_OP='UPDATE' AND NEW.commission_percent IS NOT DISTINCT FROM OLD.commission_percent THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='volunteers' AND TG_OP='INSERT' AND NEW.commission_percent IS NULL THEN RETURN NEW; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.c_critical_write_context WHERE tx=txid_current() AND actor=auth.uid()) THEN RAISE EXCEPTION 'Critical setting requires maker-checker approval'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.critical_change_propose(_kind text,_target text,_payload jsonb,_summary text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tbl text; col text; prev jsonb; result text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF _payload IS NULL OR jsonb_typeof(_payload)<>'object' OR coalesce(length(_target),0)=0 THEN RAISE EXCEPTION 'Invalid proposal'; END IF;
 tbl:=CASE _kind WHEN 'payment_option' THEN 'payment_options' WHEN 'payout_rules' THEN 'volunteer_settings' WHEN 'form_commission' THEN 'volunteer_form_commissions' WHEN 'volunteer_rate' THEN 'volunteers' WHEN 'incentive_plan' THEN 'crm_incentive_plans' END;
 col:=CASE _kind WHEN 'payment_option' THEN 'key' WHEN 'form_commission' THEN 'form_key' WHEN 'incentive_plan' THEN 'role' ELSE 'id' END;
 IF tbl IS NULL THEN RAISE EXCEPTION 'Unknown kind'; END IF;
 EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE %I::text=$1',tbl,col) INTO prev USING _target;
 IF prev IS NULL AND _kind<>'incentive_plan' THEN RAISE EXCEPTION 'Target missing'; END IF;
 INSERT INTO public.critical_changes(kind,target,payload,current,summary,requested_by) VALUES(_kind,_target,_payload,coalesce(prev,'{}'),left(coalesce(_summary,''),300),auth.uid()) RETURNING code INTO result; RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.critical_change_decide(_id uuid,_approve boolean,_note text DEFAULT '') RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.critical_changes; tbl text; col text; allowed text[]; assignments text; k text; prev jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 SELECT * INTO c FROM public.critical_changes WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR c.status<>'pending' THEN RAISE EXCEPTION 'Pending change not found'; END IF;
 IF c.requested_by=auth.uid() THEN RAISE EXCEPTION 'A different admin must decide'; END IF;
 IF _approve IS NULL THEN RAISE EXCEPTION 'Decision required'; END IF;
 IF _approve THEN
  tbl:=CASE c.kind WHEN 'payment_option' THEN 'payment_options' WHEN 'payout_rules' THEN 'volunteer_settings' WHEN 'form_commission' THEN 'volunteer_form_commissions' WHEN 'volunteer_rate' THEN 'volunteers' ELSE 'crm_incentive_plans' END;
  col:=CASE c.kind WHEN 'payment_option' THEN 'key' WHEN 'form_commission' THEN 'form_key' WHEN 'incentive_plan' THEN 'role' ELSE 'id' END;
  allowed:=CASE c.kind WHEN 'payment_option' THEN ARRAY['amount','payment_link','embed_code','razorpay_button_id'] WHEN 'payout_rules' THEN ARRAY['max_percent','min_withdrawal','payout_note'] WHEN 'form_commission' THEN ARRAY['percent','flat_amount','active'] WHEN 'volunteer_rate' THEN ARRAY['commission_percent'] ELSE ARRAY['slabs','active'] END;
  PERFORM pg_advisory_xact_lock(hashtextextended(tbl||':'||c.target,0));
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE %I::text=$1 FOR UPDATE',tbl,col) INTO prev USING c.target;
  IF coalesce(prev,'{}') IS DISTINCT FROM c.current THEN RAISE EXCEPTION 'Target changed; propose again'; END IF;
  FOR k IN SELECT jsonb_object_keys(c.payload) LOOP IF NOT k=ANY(allowed) THEN RAISE EXCEPTION 'Unsupported field %',k; END IF; END LOOP;
  IF c.payload='{}' THEN RAISE EXCEPTION 'Empty change'; END IF;
  IF c.payload ? 'amount' AND (c.payload->>'amount')::numeric<0 THEN RAISE EXCEPTION 'Negative amount'; END IF;
  FOREACH k IN ARRAY ARRAY['max_percent','percent','commission_percent'] LOOP
   IF c.payload ? k AND (c.payload->>k)::numeric NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'Invalid percent'; END IF;
  END LOOP;
  IF c.payload ? 'min_withdrawal' AND coalesce((c.payload->>'min_withdrawal')::numeric,0)<1 THEN RAISE EXCEPTION 'Invalid minimum'; END IF;
  IF c.payload ? 'flat_amount' AND coalesce((c.payload->>'flat_amount')::numeric,-1)<0 THEN RAISE EXCEPTION 'Invalid flat amount'; END IF;
  IF c.kind='incentive_plan' AND (c.target NOT IN ('BDE','BDM') OR jsonb_typeof(c.payload->'slabs') IS DISTINCT FROM 'array') THEN RAISE EXCEPTION 'Invalid incentive plan'; END IF;
  INSERT INTO public.c_critical_write_context VALUES(txid_current(),auth.uid());
  IF prev IS NULL AND c.kind='incentive_plan' THEN
   EXECUTE 'INSERT INTO public.crm_incentive_plans(role,slabs,active) VALUES($1,$2,$3)' USING c.target,c.payload->'slabs',coalesce((c.payload->>'active')::boolean,true);
  ELSE
   SELECT string_agg(format('%I = p.%I',key,key),',') INTO assignments FROM jsonb_object_keys(c.payload) key;
   EXECUTE format('UPDATE public.%I t SET %s FROM jsonb_populate_record(NULL::public.%I,$1) p WHERE t.%I::text=$2',tbl,assignments,tbl,col) USING c.payload,c.target;
  END IF;
  DELETE FROM public.c_critical_write_context WHERE tx=txid_current();
 END IF;
 UPDATE public.critical_changes SET status=CASE WHEN _approve THEN 'applied' ELSE 'rejected' END,decided_by=auth.uid(),decided_at=now(),note=left(coalesce(_note,''),2000) WHERE id=_id; RETURN true;
END $$;

DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['global_settings','integration_connections','google_copy_settings','payment_options','volunteer_settings','volunteer_form_commissions','volunteers','crm_incentive_plans'] LOOP
  IF to_regclass('public.'||t) IS NOT NULL THEN
   EXECUTE format('DROP TRIGGER IF EXISTS c_settings_history ON public.%I',t);
   EXECUTE format('CREATE TRIGGER c_settings_history AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.c_settings_history()',t);
  END IF;
 END LOOP;
 FOREACH t IN ARRAY ARRAY['payment_options','volunteer_settings','volunteer_form_commissions','volunteers','crm_incentive_plans'] LOOP
  IF to_regclass('public.'||t) IS NOT NULL THEN
   EXECUTE format('DROP TRIGGER IF EXISTS c_critical_guard ON public.%I',t);
   EXECUTE format('CREATE TRIGGER c_critical_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.c_critical_guard()',t);
  END IF;
 END LOOP;
END $$;
DO $$
DECLARE f record;
BEGIN
 FOR f IN SELECT p.oid::regprocedure signature,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname LIKE 'c\_%' ESCAPE '\' OR p.proname=ANY(ARRAY['admin_integration_status','can_view_people_profiles','claim_first_admin','critical_change_decide','critical_change_propose','crm_create_lead','crm_customer_lookup','crm_role','first_admin_setup_status','integration_report','research_add_lead','research_cancel','research_deliver','research_request_create','research_reuse_leads','research_reverify'])) LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
  IF f.proname NOT LIKE 'c\_%' ESCAPE '\' AND f.proname<>'integration_report' OR f.proname='c_department_access' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature); END IF;
 END LOOP;
END $$;
CREATE INDEX IF NOT EXISTS c_research_requested_by ON public.research_requests(requested_by,created_at DESC);
CREATE INDEX IF NOT EXISTS c_research_lead_links ON public.research_request_leads(lead_id);
CREATE INDEX IF NOT EXISTS c_research_fresh ON public.research_leads(verified_at DESC);
CREATE INDEX IF NOT EXISTS c_ticket_status ON public.customer_tickets(status,created_at DESC);
CREATE INDEX IF NOT EXISTS c_history_created ON public.settings_change_log(created_at DESC);
-- ===== 0007_alerts_and_shared_helpers =====
CREATE OR REPLACE FUNCTION public.notify_urgent_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text;
BEGIN
  IF NEW.priority NOT IN ('urgent','high') OR NEW.status IN ('resolved','closed') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to AND OLD.priority IS NOT DISTINCT FROM NEW.priority THEN RETURN NEW; END IF;
  _title := initcap(NEW.priority) || ' ticket ' || coalesce(NEW.ticket_code,'') || ': ' || left(coalesce(NEW.subject,''), 80);
  IF NEW.assigned_to IS NOT NULL THEN
    IF NEW.assigned_to IS DISTINCT FROM auth.uid() THEN
      INSERT INTO public.notifications(user_id, kind, title, body, link)
      VALUES (NEW.assigned_to, 'alert', _title, 'Customer: ' || coalesce(NEW.full_name,'') || '. Please respond within the SLA.', '/support-desk');
    END IF;
  ELSE
    INSERT INTO public.notifications(user_id, kind, title, body, link)
    SELECT ds.user_id, 'alert', _title, 'No one is assigned yet. Please assign an owner.', '/support-desk'
    FROM public.department_staff ds
    WHERE ds.department = 'support' AND ds.level = 'manager' AND ds.active AND ds.user_id IS DISTINCT FROM auth.uid();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS c_ticket_urgent_alert ON public.customer_tickets;
DROP TRIGGER IF EXISTS c_ticket_urgent_alert ON public.customer_tickets;
CREATE TRIGGER c_ticket_urgent_alert AFTER INSERT OR UPDATE OF assigned_to, priority ON public.customer_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_urgent_ticket();

CREATE OR REPLACE FUNCTION public.notify_lead_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_id IS NULL OR NEW.owner_id IS NOT DISTINCT FROM auth.uid() THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.owner_id IS NOT DISTINCT FROM NEW.owner_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications(user_id, kind, title, body, link)
  VALUES (NEW.owner_id, 'alert', 'New lead assigned: ' || left(coalesce(NEW.title,''), 80),
          'Stage: ' || coalesce(NEW.stage,'new') || '. Call the customer soon.', '/crm');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS crm_lead_assigned_alert ON public.crm_leads;
DROP TRIGGER IF EXISTS crm_lead_assigned_alert ON public.crm_leads;
CREATE TRIGGER crm_lead_assigned_alert AFTER INSERT OR UPDATE OF owner_id ON public.crm_leads
FOR EACH ROW EXECUTE FUNCTION public.notify_lead_assigned();

REVOKE EXECUTE ON FUNCTION public.notify_urgent_ticket() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_lead_assigned() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_staff_member(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT _uid IS NOT NULL AND (
    public.has_role(_uid, 'admin') OR public.has_role(_uid, 'moderator')
    OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = _uid AND m.active)
    OR EXISTS (SELECT 1 FROM public.department_staff d WHERE d.user_id = _uid AND d.active)
    OR EXISTS (SELECT 1 FROM public.education_staff_access e WHERE e.user_id = _uid AND e.active))
$fn$;
REVOKE ALL ON FUNCTION public.is_staff_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff_member(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_linked_volunteer(_uid uuid, _active_only boolean DEFAULT true) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT _uid IS NOT NULL AND EXISTS (SELECT 1 FROM public.volunteers v WHERE v.user_id = _uid AND (NOT _active_only OR v.status = 'active'))
$fn$;
REVOKE ALL ON FUNCTION public.is_linked_volunteer(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_linked_volunteer(uuid, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.hr_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.department_staff WHERE user_id = auth.uid() AND active AND department = 'hr'))
$fn$;
CREATE OR REPLACE FUNCTION public.hr_is_manager() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.department_staff WHERE user_id = auth.uid() AND active AND department = 'hr' AND level = 'manager'))
$fn$;
CREATE OR REPLACE FUNCTION public.hr_or_finance() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.department_staff WHERE user_id = auth.uid() AND active AND department IN ('hr','accounts','finance')))
$fn$;
CREATE OR REPLACE FUNCTION public.support_is_manager() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.department_staff WHERE user_id = auth.uid() AND active AND department = 'support' AND level = 'manager'))
$fn$;
CREATE OR REPLACE FUNCTION public.c_staff_name(_uid uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT CASE WHEN auth.uid() IS NULL OR _uid IS NULL THEN NULL ELSE coalesce(
    (SELECT nullif(full_name,'') FROM public.crm_employee_profiles WHERE user_id = _uid),
    (SELECT nullif(full_name,'') FROM public.volunteers WHERE user_id = _uid LIMIT 1),
    (SELECT nullif(display_name,'') FROM public.profiles WHERE id = _uid),
    'Staff') END
$fn$;
DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['hr_staff()','hr_is_manager()','hr_or_finance()','support_is_manager()','c_staff_name(uuid)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', f);
  END LOOP;
END $$;
-- ===== 0008_hrms_payroll =====
CREATE TABLE IF NOT EXISTS public.hr_employee_master (
 bank_last4 text NOT NULL DEFAULT '',
 department text NOT NULL DEFAULT '',
 designation text NOT NULL DEFAULT '',
 emergency_contact text NOT NULL DEFAULT '',
 employee_code text NOT NULL,
 employee_record_id uuid,
 employment_type text NOT NULL DEFAULT 'full_time',
 full_name text NOT NULL,
 joining_date date,
 pan_last4 text NOT NULL DEFAULT '',
 reporting_manager uuid,
 shift text NOT NULL DEFAULT 'General (10:00-18:30)',
 status text NOT NULL DEFAULT 'active',
 updated_at timestamptz NOT NULL DEFAULT now(),
 user_id uuid NOT NULL,
 work_location text NOT NULL DEFAULT '',
 PRIMARY KEY (user_id)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_employee_master TO authenticated,service_role;
ALTER TABLE public.hr_employee_master ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_employee_master; CREATE POLICY g2_manage ON public.hr_employee_master FOR ALL TO authenticated USING (hr_staff()) WITH CHECK (hr_staff());

DROP POLICY IF EXISTS g2_read ON public.hr_employee_master; CREATE POLICY g2_read ON public.hr_employee_master FOR SELECT TO authenticated USING (hr_staff() OR (user_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.hr_salary_structures (
 allowances numeric NOT NULL DEFAULT 0,
 basic numeric NOT NULL DEFAULT 0,
 deductions numeric NOT NULL DEFAULT 0,
 effective_from date NOT NULL DEFAULT current_date,
 hra numeric NOT NULL DEFAULT 0,
 monthly_gross numeric NOT NULL DEFAULT 0,
 note text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid,
 user_id uuid NOT NULL,
 PRIMARY KEY (user_id)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_salary_structures TO authenticated,service_role;
ALTER TABLE public.hr_salary_structures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_salary_structures; CREATE POLICY g2_manage ON public.hr_salary_structures FOR ALL TO authenticated USING (hr_staff() AND user_id<>auth.uid()) WITH CHECK (hr_staff() AND user_id<>auth.uid());

DROP POLICY IF EXISTS g2_read ON public.hr_salary_structures; CREATE POLICY g2_read ON public.hr_salary_structures FOR SELECT TO authenticated USING (hr_or_finance() OR (user_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.hr_payslips (
 advance_recovery numeric NOT NULL DEFAULT 0,
 allowances numeric NOT NULL DEFAULT 0,
 basic numeric NOT NULL DEFAULT 0,
 created_by uuid,
 deductions numeric NOT NULL DEFAULT 0,
 gross numeric NOT NULL DEFAULT 0,
 hra numeric NOT NULL DEFAULT 0,
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 incentive numeric NOT NULL DEFAULT 0,
 lop_amount numeric NOT NULL DEFAULT 0,
 lop_days numeric NOT NULL DEFAULT 0,
 month date NOT NULL,
 net numeric NOT NULL DEFAULT 0,
 paid_ref text NOT NULL DEFAULT '',
 reimbursement numeric NOT NULL DEFAULT 0,
 status text NOT NULL DEFAULT 'draft',
 updated_at timestamptz NOT NULL DEFAULT now(),
 user_id uuid NOT NULL,
 PRIMARY KEY (id),
 UNIQUE(user_id,month),
 CHECK(status IN ('draft','approved','paid'))
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_payslips TO authenticated,service_role;
ALTER TABLE public.hr_payslips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_payslips; CREATE POLICY g2_manage ON public.hr_payslips FOR ALL TO authenticated USING (hr_or_finance() AND user_id<>auth.uid()) WITH CHECK (hr_or_finance() AND user_id<>auth.uid());

DROP POLICY IF EXISTS g2_read ON public.hr_payslips; CREATE POLICY g2_read ON public.hr_payslips FOR SELECT TO authenticated USING (hr_or_finance() OR (user_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.hr_payslip_items (
 advance_id uuid,
 amount numeric NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 kind text NOT NULL,
 label text NOT NULL DEFAULT '',
 payslip_id uuid NOT NULL,
 request_id uuid,
 user_id uuid NOT NULL,
 PRIMARY KEY (id)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_payslip_items TO authenticated,service_role;
ALTER TABLE public.hr_payslip_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_payslip_items; CREATE POLICY g2_manage ON public.hr_payslip_items FOR ALL TO authenticated USING (hr_or_finance()) WITH CHECK (hr_or_finance());

DROP POLICY IF EXISTS g2_read ON public.hr_payslip_items; CREATE POLICY g2_read ON public.hr_payslip_items FOR SELECT TO authenticated USING (hr_or_finance() OR (user_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.hr_advances (
 amount numeric NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid,
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 monthly_recovery numeric NOT NULL,
 note text NOT NULL DEFAULT '',
 request_id uuid,
 start_month date NOT NULL,
 status text NOT NULL DEFAULT 'active',
 user_id uuid NOT NULL,
 PRIMARY KEY (id),
 UNIQUE(request_id),
 CHECK(amount>0 AND monthly_recovery>0 AND monthly_recovery<=amount),
 CHECK(status IN ('active','cancelled','completed'))
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_advances TO authenticated,service_role;
ALTER TABLE public.hr_advances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_advances; CREATE POLICY g2_manage ON public.hr_advances FOR ALL TO authenticated USING (hr_or_finance() AND user_id<>auth.uid()) WITH CHECK (hr_or_finance() AND user_id<>auth.uid());

DROP POLICY IF EXISTS g2_read ON public.hr_advances; CREATE POLICY g2_read ON public.hr_advances FOR SELECT TO authenticated USING (hr_or_finance() OR (user_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.hr_appraisals (
 created_at timestamptz NOT NULL DEFAULT now(),
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 improvements text NOT NULL DEFAULT '',
 increment_percent numeric NOT NULL DEFAULT 0,
 kpi_score numeric,
 period text NOT NULL,
 rating numeric,
 reviewer_id uuid,
 status text NOT NULL DEFAULT 'draft',
 strengths text NOT NULL DEFAULT '',
 user_id uuid NOT NULL,
 PRIMARY KEY (id),
 UNIQUE(user_id,period),
 CHECK(status IN ('draft','shared')),
 CHECK(rating BETWEEN 1 AND 5)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_appraisals TO authenticated,service_role;
ALTER TABLE public.hr_appraisals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_appraisals; CREATE POLICY g2_manage ON public.hr_appraisals FOR ALL TO authenticated USING (hr_staff() AND user_id<>auth.uid()) WITH CHECK (hr_staff() AND user_id<>auth.uid());

DROP POLICY IF EXISTS g2_read ON public.hr_appraisals; CREATE POLICY g2_read ON public.hr_appraisals FOR SELECT TO authenticated USING (hr_staff() OR (user_id=auth.uid() AND status='shared'));

CREATE TABLE IF NOT EXISTS public.hr_attendance_corrections (
 check_in timestamptz,
 check_out timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 day date NOT NULL,
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 reason text NOT NULL,
 requested_status text NOT NULL,
 review_note text NOT NULL DEFAULT '',
 reviewed_at timestamptz,
 reviewed_by uuid,
 status text NOT NULL DEFAULT 'pending',
 user_id uuid NOT NULL DEFAULT auth.uid(),
 PRIMARY KEY (id),
 CHECK(status IN ('pending','approved','rejected')),
 CHECK(requested_status IN ('present','wfh','leave','half_day','absent'))
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_attendance_corrections TO authenticated,service_role;
ALTER TABLE public.hr_attendance_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_attendance_corrections; CREATE POLICY g2_manage ON public.hr_attendance_corrections FOR ALL TO authenticated USING (hr_staff()) WITH CHECK (hr_staff());

DROP POLICY IF EXISTS g2_read ON public.hr_attendance_corrections; CREATE POLICY g2_read ON public.hr_attendance_corrections FOR SELECT TO authenticated USING (hr_staff() OR (user_id=auth.uid()));

DROP POLICY IF EXISTS g2_submit ON public.hr_attendance_corrections; CREATE POLICY g2_submit ON public.hr_attendance_corrections FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND status='pending' AND reviewed_by IS NULL AND reviewed_at IS NULL AND review_note='');

CREATE TABLE IF NOT EXISTS public.hr_exits (
 assets_returned boolean NOT NULL DEFAULT false,
 fnf_amount numeric,
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 last_working_day date,
 leave_encashment numeric NOT NULL DEFAULT 0,
 other_dues numeric NOT NULL DEFAULT 0,
 pending_salary numeric NOT NULL DEFAULT 0,
 reason text NOT NULL DEFAULT '',
 recoveries numeric NOT NULL DEFAULT 0,
 resignation_date date NOT NULL DEFAULT current_date,
 settled_at timestamptz,
 status text NOT NULL DEFAULT 'notice',
 updated_at timestamptz NOT NULL DEFAULT now(),
 user_id uuid NOT NULL,
 PRIMARY KEY (id)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_exits TO authenticated,service_role;
ALTER TABLE public.hr_exits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_exits; CREATE POLICY g2_manage ON public.hr_exits FOR ALL TO authenticated USING (hr_staff()) WITH CHECK (hr_staff());

DROP POLICY IF EXISTS g2_read ON public.hr_exits; CREATE POLICY g2_read ON public.hr_exits FOR SELECT TO authenticated USING (hr_staff() OR (user_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.hr_grievances (
 anonymous boolean NOT NULL DEFAULT true,
 category text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 details text NOT NULL,
 hr_response text,
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 status text NOT NULL DEFAULT 'open',
 submitted_by uuid,
 tracking_code text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id),
 UNIQUE(tracking_code),
 CHECK(status IN ('open','in_review','resolved','closed'))
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_grievances TO authenticated,service_role;
ALTER TABLE public.hr_grievances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_grievances; CREATE POLICY g2_manage ON public.hr_grievances FOR ALL TO authenticated USING (hr_is_manager()) WITH CHECK (hr_is_manager());

DROP POLICY IF EXISTS g2_read ON public.hr_grievances; CREATE POLICY g2_read ON public.hr_grievances FOR SELECT TO authenticated USING (hr_is_manager());

CREATE TABLE IF NOT EXISTS public.hr_holidays (
 created_at timestamptz NOT NULL DEFAULT now(),
 day date NOT NULL,
 kind text NOT NULL DEFAULT '',
 name text NOT NULL,
 PRIMARY KEY (day)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_holidays TO authenticated,service_role;
ALTER TABLE public.hr_holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_holidays; CREATE POLICY g2_manage ON public.hr_holidays FOR ALL TO authenticated USING (hr_staff()) WITH CHECK (hr_staff());

DROP POLICY IF EXISTS g2_read ON public.hr_holidays; CREATE POLICY g2_read ON public.hr_holidays FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.hr_roster (
 day date NOT NULL,
 note text NOT NULL DEFAULT '',
 shift_code text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid,
 user_id uuid NOT NULL,
 PRIMARY KEY (user_id,day)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_roster TO authenticated,service_role;
ALTER TABLE public.hr_roster ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_roster; CREATE POLICY g2_manage ON public.hr_roster FOR ALL TO authenticated USING (hr_staff()) WITH CHECK (hr_staff());

DROP POLICY IF EXISTS g2_read ON public.hr_roster; CREATE POLICY g2_read ON public.hr_roster FOR SELECT TO authenticated USING (hr_staff() OR (user_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.hr_shifts (
 active boolean NOT NULL DEFAULT true,
 code text NOT NULL,
 end_time time,
 is_off boolean NOT NULL DEFAULT false,
 name text NOT NULL,
 sort_order numeric NOT NULL DEFAULT 0,
 start_time time,
 PRIMARY KEY (code)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_shifts TO authenticated,service_role;
ALTER TABLE public.hr_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_shifts; CREATE POLICY g2_manage ON public.hr_shifts FOR ALL TO authenticated USING (hr_staff()) WITH CHECK (hr_staff());

DROP POLICY IF EXISTS g2_read ON public.hr_shifts; CREATE POLICY g2_read ON public.hr_shifts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.hr_settings (
 card_color text NOT NULL DEFAULT '#B5121B',
 card_footer text NOT NULL DEFAULT 'RILOYD',
 id boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id),
 CHECK(id)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_settings TO authenticated,service_role;
ALTER TABLE public.hr_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.hr_settings; CREATE POLICY g2_manage ON public.hr_settings FOR ALL TO authenticated USING (hr_staff()) WITH CHECK (hr_staff());

DROP POLICY IF EXISTS g2_read ON public.hr_settings; CREATE POLICY g2_read ON public.hr_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.company_policies (
 active boolean NOT NULL DEFAULT true,
 body text NOT NULL,
 created_by uuid,
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 title text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 version numeric NOT NULL DEFAULT 1,
 PRIMARY KEY (id)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.company_policies TO authenticated,service_role;
ALTER TABLE public.company_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.company_policies; CREATE POLICY g2_manage ON public.company_policies FOR ALL TO authenticated USING (hr_staff()) WITH CHECK (hr_staff());

DROP POLICY IF EXISTS g2_read ON public.company_policies; CREATE POLICY g2_read ON public.company_policies FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.policy_acknowledgements (
 acknowledged_at timestamptz NOT NULL DEFAULT now(),
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 policy_id uuid NOT NULL,
 user_id uuid NOT NULL DEFAULT auth.uid(),
 version numeric NOT NULL,
 PRIMARY KEY (id),
 UNIQUE(policy_id,user_id,version)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON public.policy_acknowledgements TO authenticated,service_role;
ALTER TABLE public.policy_acknowledgements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS g2_manage ON public.policy_acknowledgements; CREATE POLICY g2_manage ON public.policy_acknowledgements FOR ALL TO authenticated USING (hr_staff()) WITH CHECK (hr_staff());

DROP POLICY IF EXISTS g2_read ON public.policy_acknowledgements; CREATE POLICY g2_read ON public.policy_acknowledgements FOR SELECT TO authenticated USING (hr_staff() OR (user_id=auth.uid()));

DROP POLICY IF EXISTS g2_sign ON public.policy_acknowledgements; CREATE POLICY g2_sign ON public.policy_acknowledgements FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM company_policies p WHERE p.id=policy_id AND p.version=policy_acknowledgements.version AND p.active));

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.hr_employee_master'::regclass AND conname='hr_employee_master_employee_record_id_fkey') THEN ALTER TABLE public.hr_employee_master ADD CONSTRAINT hr_employee_master_employee_record_id_fkey FOREIGN KEY(employee_record_id) REFERENCES public.employees(id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.hr_payslip_items'::regclass AND conname='hr_payslip_items_advance_id_fkey') THEN ALTER TABLE public.hr_payslip_items ADD CONSTRAINT hr_payslip_items_advance_id_fkey FOREIGN KEY(advance_id) REFERENCES public.hr_advances(id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.hr_payslip_items'::regclass AND conname='hr_payslip_items_payslip_id_fkey') THEN ALTER TABLE public.hr_payslip_items ADD CONSTRAINT hr_payslip_items_payslip_id_fkey FOREIGN KEY(payslip_id) REFERENCES public.hr_payslips(id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.hr_payslip_items'::regclass AND conname='hr_payslip_items_request_id_fkey') THEN ALTER TABLE public.hr_payslip_items ADD CONSTRAINT hr_payslip_items_request_id_fkey FOREIGN KEY(request_id) REFERENCES public.requests(id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.hr_advances'::regclass AND conname='hr_advances_request_id_fkey') THEN ALTER TABLE public.hr_advances ADD CONSTRAINT hr_advances_request_id_fkey FOREIGN KEY(request_id) REFERENCES public.requests(id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.hr_roster'::regclass AND conname='hr_roster_shift_code_fkey') THEN ALTER TABLE public.hr_roster ADD CONSTRAINT hr_roster_shift_code_fkey FOREIGN KEY(shift_code) REFERENCES public.hr_shifts(code); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.policy_acknowledgements'::regclass AND conname='policy_acknowledgements_policy_id_fkey') THEN ALTER TABLE public.policy_acknowledgements ADD CONSTRAINT policy_acknowledgements_policy_id_fkey FOREIGN KEY(policy_id) REFERENCES public.company_policies(id); END IF; END $$;

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS card_issued_at timestamptz, ADD COLUMN IF NOT EXISTS card_reprints integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS card_status text NOT NULL DEFAULT 'active', ADD COLUMN IF NOT EXISTS joining_date date, ADD COLUMN IF NOT EXISTS public_listing boolean NOT NULL DEFAULT false;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS public_listing boolean NOT NULL DEFAULT false;
INSERT INTO public.hr_settings(id) VALUES(true) ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION public.hr_advance_plan(_amount numeric,_monthly numeric,_start date,_user uuid,_note text DEFAULT '',_request uuid DEFAULT NULL) RETURNS public.hr_advances LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.hr_advances;
BEGIN
 IF auth.uid() IS NULL OR NOT hr_or_finance() OR _user=auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF _amount IS NULL OR _monthly IS NULL OR _amount<=0 OR _monthly<=0 OR _monthly>_amount OR _start IS NULL THEN RAISE EXCEPTION 'Invalid recovery plan'; END IF;
 IF _request IS NOT NULL AND NOT EXISTS(SELECT 1 FROM requests WHERE id=_request AND applicant_id=_user AND type='salary_advance' AND status IN ('approved','paid') AND amount=_amount) THEN RAISE EXCEPTION 'Approved matching advance request required'; END IF;
 INSERT INTO hr_advances(user_id,amount,monthly_recovery,start_month,note,request_id,created_by) VALUES(_user,_amount,_monthly,date_trunc('month',_start)::date,coalesce(_note,''),_request,auth.uid()) RETURNING * INTO r;
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.hr_advance_balances() RETURNS TABLE(amount numeric,balance numeric,created_at timestamptz,id uuid,monthly_recovery numeric,note text,recovered numeric,request_id uuid,start_month date,status text,user_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT a.amount,greatest(0,a.amount-coalesce(x.total,0)),a.created_at,a.id,a.monthly_recovery,a.note,coalesce(x.total,0),a.request_id,a.start_month,a.status,a.user_id FROM hr_advances a LEFT JOIN LATERAL(SELECT sum(i.amount) total FROM hr_payslip_items i JOIN hr_payslips p ON p.id=i.payslip_id WHERE i.advance_id=a.id AND p.status IN ('approved','paid')) x ON true WHERE auth.uid() IS NOT NULL AND (hr_or_finance() OR a.user_id=auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.hr_advance_cancel(_id uuid,_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT hr_or_finance() OR length(trim(coalesce(_reason,'')))<3 THEN RAISE EXCEPTION 'Forbidden or reason missing'; END IF;
 UPDATE hr_advances SET status='cancelled',note=note||E'\nCancelled: '||_reason WHERE id=_id AND status='active' AND user_id<>auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Active plan not found or own plan'; END IF;
 INSERT INTO audit_logs(actor_id,action,entity,entity_id,details) VALUES(auth.uid(),'cancel','hr_advances',_id::text,jsonb_build_object('reason',_reason));
END $$;
CREATE OR REPLACE FUNCTION public.hr_correction_review(_approve boolean,_id uuid,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r hr_attendance_corrections;
BEGIN
 IF auth.uid() IS NULL OR NOT hr_staff() THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO r FROM hr_attendance_corrections WHERE id=_id FOR UPDATE;
 IF NOT FOUND OR r.status<>'pending' OR r.user_id=auth.uid() THEN RAISE EXCEPTION 'Pending correction for another employee required'; END IF;
 IF _approve THEN
 INSERT INTO attendance_records(user_id,day,status,check_in,check_out,note) VALUES(r.user_id,r.day,r.requested_status,r.check_in,r.check_out,'Correction: '||r.reason) ON CONFLICT(user_id,day) DO UPDATE SET status=excluded.status,check_in=excluded.check_in,check_out=excluded.check_out,note=excluded.note,updated_at=now();
 END IF;
 UPDATE hr_attendance_corrections SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,reviewed_at=now(),reviewed_by=auth.uid(),review_note=coalesce(_note,'') WHERE id=_id;
END $$;
CREATE OR REPLACE FUNCTION public.grievance_submit(_anonymous boolean,_category text,_details text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c text:='GRV-'||upper(replace(gen_random_uuid()::text,'-',''));
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF length(trim(coalesce(_details,'')))<10 OR length(_details)>10000 OR length(trim(coalesce(_category,'')))=0 THEN RAISE EXCEPTION 'Category and details required'; END IF;
 INSERT INTO hr_grievances(tracking_code,category,details,anonymous,submitted_by) VALUES(c,_category,_details,coalesce(_anonymous,true),CASE WHEN coalesce(_anonymous,true) THEN NULL ELSE auth.uid() END);
 RETURN c;
END $$;
CREATE OR REPLACE FUNCTION public.grievance_status(_code text) RETURNS TABLE(hr_response text,status text,updated_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT g.hr_response,g.status,g.updated_at FROM hr_grievances g WHERE auth.uid() IS NOT NULL AND g.tracking_code=upper(trim(_code))
$$;
CREATE OR REPLACE FUNCTION public.public_team_directory() RETURNS TABLE(department text,designation text,full_name text,kind text,location text,member_id text,photo_url text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT e.department,e.designation,e.full_name,'employee'::text,''::text,e.employee_id,e.photo_url FROM employees e WHERE e.public_listing AND e.status='active'
 UNION ALL SELECT 'Volunteer', 'Volunteer',v.full_name,'volunteer',concat_ws(', ',nullif(v.district,''),nullif(v.state,'')),v.volunteer_code,NULL::text FROM volunteers v WHERE v.public_listing AND v.status='active'
$$;
CREATE OR REPLACE FUNCTION public.my_id_card() RETURNS TABLE(card_color text,card_footer text,department text,designation text,employee_id text,full_name text,joining_date date,photo_url text,valid_until date) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT s.card_color,s.card_footer,e.department,e.designation,e.employee_id,e.full_name,e.joining_date,e.photo_url,e.valid_until FROM employees e JOIN hr_employee_master m ON m.employee_record_id=e.id CROSS JOIN hr_settings s WHERE auth.uid() IS NOT NULL AND m.user_id=auth.uid() AND m.status='active' AND e.status='active' AND e.card_status<>'inactive' AND (e.valid_until IS NULL OR e.valid_until>=current_date)
$$;
CREATE OR REPLACE FUNCTION public.hr_people_overview(_month date DEFAULT current_date) RETURNS TABLE(absent bigint,deductions numeric,departments text,designation text,employee_code text,full_name text,half_days bigint,leave_days bigint,manager_name text,marked_days bigint,monthly_gross numeric,net_pay numeric,plan_active boolean,plan_slabs jsonb,present bigint,revenue_target numeric,team_role text,unverified_revenue numeric,user_id uuid,verified_revenue numeric,wfh bigint) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT hr_or_finance() THEN RAISE EXCEPTION 'Forbidden'; END IF;
 RETURN QUERY
 WITH people AS (SELECT m.user_id FROM hr_employee_master m UNION SELECT c.user_id FROM crm_memberships c WHERE c.active UNION SELECT d.user_id FROM department_staff d WHERE d.active)
 SELECT coalesce(a.ab,0),s.deductions,coalesce(nullif(m.department,''),d.depts,''),coalesce(nullif(m.designation,''),p.designation,''),coalesce(nullif(m.employee_code,''),p.employee_code,''),coalesce(nullif(m.full_name,''),p.full_name,person_name(u.user_id)),coalesce(a.hd,0),coalesce(a.ld,0),person_name(coalesce(m.reporting_manager,c.manager_id)),coalesce(a.total,0),s.monthly_gross,greatest(0,s.monthly_gross-s.deductions),ip.active,ip.slabs,coalesce(a.pr,0),t.revenue_target,c.role,coalesce(v.unverified,0),u.user_id,coalesce(v.verified,0),coalesce(a.wf,0)
 FROM people u LEFT JOIN hr_employee_master m ON m.user_id=u.user_id LEFT JOIN crm_employee_profiles p ON p.user_id=u.user_id LEFT JOIN hr_salary_structures s ON s.user_id=u.user_id LEFT JOIN crm_memberships c ON c.user_id=u.user_id AND c.active LEFT JOIN crm_incentive_plans ip ON ip.role=c.role LEFT JOIN crm_targets t ON t.owner_id=u.user_id AND t.month=date_trunc('month',_month)::date
 LEFT JOIN LATERAL(SELECT string_agg(ds.department,', ' ORDER BY ds.department) depts FROM department_staff ds WHERE ds.user_id=u.user_id AND ds.active) d ON true
 LEFT JOIN LATERAL(SELECT count(*) total,count(*) FILTER(WHERE ar.status='absent') ab,count(*) FILTER(WHERE ar.status='half_day') hd,count(*) FILTER(WHERE ar.status='leave') ld,count(*) FILTER(WHERE ar.status='present') pr,count(*) FILTER(WHERE ar.status='wfh') wf FROM attendance_records ar WHERE ar.user_id=u.user_id AND ar.day>=date_trunc('month',_month)::date AND ar.day<(date_trunc('month',_month)+interval '1 month')::date) a ON true
 LEFT JOIN LATERAL(SELECT sum(cc.amount) FILTER(WHERE cc.status='verified') verified,sum(cc.amount) FILTER(WHERE cc.status='unverified') unverified FROM crm_collections cc WHERE cc.owner_id=u.user_id AND cc.collected_on>=date_trunc('month',_month)::date AND cc.collected_on<(date_trunc('month',_month)+interval '1 month')::date) v ON true;
END $$;
CREATE OR REPLACE FUNCTION public.hr_generate_payroll(_month date) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m date:=date_trunc('month',_month)::date; s record; a record; r record; p hr_payslips; n integer:=0; days numeric; inc numeric; reimb numeric; recovery numeric; take numeric; owed numeric; available numeric; slab jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT hr_or_finance() THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF m IS NULL THEN RAISE EXCEPTION 'Month required'; END IF;
 PERFORM pg_advisory_xact_lock(272002);
 FOR s IN SELECT ss.*,o.verified_revenue,o.revenue_target,o.plan_active,o.plan_slabs FROM hr_salary_structures ss JOIN hr_people_overview(m) o ON o.user_id=ss.user_id WHERE ss.effective_from<m+interval '1 month' AND NOT EXISTS(SELECT 1 FROM hr_employee_master em WHERE em.user_id=ss.user_id AND em.status IN ('inactive','exited')) LOOP
  SELECT * INTO p FROM hr_payslips WHERE user_id=s.user_id AND month=m FOR UPDATE;
  IF FOUND AND p.status<>'draft' THEN CONTINUE; END IF;
  IF p.id IS NULL THEN
   INSERT INTO hr_payslips(user_id,month,created_by) VALUES(s.user_id,m,auth.uid()) RETURNING * INTO p;
  END IF;
  DELETE FROM hr_payslip_items WHERE payslip_id=p.id;
  SELECT coalesce(sum(CASE status WHEN 'absent' THEN 1 WHEN 'half_day' THEN 0.5 ELSE 0 END),0) INTO days FROM attendance_records WHERE user_id=s.user_id AND day>=m AND day<m+interval '1 month';
  inc:=0;
  IF s.plan_active AND s.revenue_target>0 THEN
   SELECT x INTO slab FROM jsonb_array_elements(coalesce(s.plan_slabs,'[]')) x WHERE (x->>'min')::numeric<=floor(s.verified_revenue/s.revenue_target*100) ORDER BY (x->>'min')::numeric DESC LIMIT 1;
   IF slab IS NOT NULL THEN inc:=round(s.verified_revenue*(slab->>'rate')::numeric/100+(slab->>'bonus')::numeric); END IF;
  END IF;
  reimb:=0;
  FOR r IN SELECT q.* FROM requests q WHERE q.applicant_id=s.user_id AND q.type='reimbursement' AND q.status IN ('approved','paid') AND q.updated_at<m+interval '1 month' AND NOT EXISTS(SELECT 1 FROM hr_payslip_items i WHERE i.request_id=q.id AND i.kind='reimbursement') ORDER BY q.created_at FOR UPDATE LOOP
   INSERT INTO hr_payslip_items(payslip_id,user_id,kind,amount,label,request_id) VALUES(p.id,s.user_id,'reimbursement',coalesce(r.amount,0),r.title,r.id);
   reimb:=reimb+coalesce(r.amount,0);
  END LOOP;
  available:=greatest(0,s.monthly_gross-s.deductions-round(s.monthly_gross/30*days,2)+inc+reimb); recovery:=0;
  FOR a IN SELECT * FROM hr_advances WHERE user_id=s.user_id AND status='active' AND start_month<=m ORDER BY start_month,created_at,id FOR UPDATE LOOP
   SELECT greatest(0,a.amount-coalesce(sum(i.amount),0)) INTO owed FROM hr_payslip_items i JOIN hr_payslips ps ON ps.id=i.payslip_id WHERE i.advance_id=a.id AND ps.id<>p.id;
   take:=greatest(0,least(a.monthly_recovery,owed,available-recovery));
   IF take>0 THEN INSERT INTO hr_payslip_items(payslip_id,user_id,kind,amount,label,advance_id) VALUES(p.id,s.user_id,'advance_recovery',take,'Salary advance recovery',a.id); END IF;
   recovery:=recovery+take;
  END LOOP;
  UPDATE hr_payslips SET basic=s.basic,hra=s.hra,allowances=s.allowances,gross=s.monthly_gross,deductions=s.deductions,lop_days=days,lop_amount=round(s.monthly_gross/30*days,2),incentive=inc,reimbursement=reimb,advance_recovery=recovery,net=greatest(0,available-recovery),updated_at=now() WHERE id=p.id;
  n:=n+1; p:=NULL;
 END LOOP;
 RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.g2_hr_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF TG_TABLE_NAME='hr_salary_structures' THEN
  IF NOT hr_staff() OR NEW.user_id=auth.uid() THEN RAISE EXCEPTION 'HR cannot change their own salary'; END IF;
  IF NEW.basic<0 OR NEW.hra<0 OR NEW.allowances<0 OR NEW.deductions<0 THEN RAISE EXCEPTION 'Negative salary component'; END IF;
  NEW.monthly_gross:=NEW.basic+NEW.hra+NEW.allowances; NEW.updated_at:=now(); NEW.updated_by:=auth.uid();
  INSERT INTO audit_logs(actor_id,action,entity,entity_id,details) VALUES(auth.uid(),lower(TG_OP),'hr_salary_structures',NEW.user_id::text,jsonb_build_object('old',CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,'new',to_jsonb(NEW)));
 ELSIF TG_TABLE_NAME='hr_exits' THEN
  IF NOT hr_staff() OR NEW.user_id=auth.uid() THEN RAISE EXCEPTION 'HR must review another employee'; END IF;
  IF TG_OP='UPDATE' AND OLD.status='settled' THEN RAISE EXCEPTION 'Settled exit is immutable'; END IF;
  IF NEW.status NOT IN ('notice','clearance','settled') THEN RAISE EXCEPTION 'Invalid exit status'; END IF;
  IF NEW.status<>'settled' THEN UPDATE hr_employee_master SET status='notice',updated_at=now() WHERE user_id=NEW.user_id; END IF;
  NEW.fnf_amount:=NEW.pending_salary+NEW.leave_encashment+NEW.other_dues-NEW.recoveries; NEW.updated_at:=now();
  IF NEW.status='settled' AND (TG_OP='INSERT' OR OLD.status<>'settled') THEN
   IF NOT NEW.assets_returned THEN RAISE EXCEPTION 'Assets must be returned'; END IF;
   NEW.settled_at:=now();
   UPDATE employees SET status='inactive',card_status='inactive',updated_at=now() WHERE id IN(SELECT employee_record_id FROM hr_employee_master WHERE user_id=NEW.user_id);
   UPDATE hr_employee_master SET status='exited',updated_at=now() WHERE user_id=NEW.user_id;
   UPDATE department_staff SET active=false WHERE user_id=NEW.user_id;
   UPDATE crm_memberships SET active=false WHERE user_id=NEW.user_id;
  END IF;
 ELSIF TG_TABLE_NAME='hr_grievances' THEN NEW.updated_at:=now();
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS g2_salary_change ON public.hr_salary_structures;
DROP TRIGGER IF EXISTS g2_salary_change ON public.hr_salary_structures;
CREATE TRIGGER g2_salary_change BEFORE INSERT OR UPDATE ON public.hr_salary_structures FOR EACH ROW EXECUTE FUNCTION public.g2_hr_change();
DROP TRIGGER IF EXISTS g2_exit_change ON public.hr_exits;
DROP TRIGGER IF EXISTS g2_exit_change ON public.hr_exits;
CREATE TRIGGER g2_exit_change BEFORE INSERT OR UPDATE ON public.hr_exits FOR EACH ROW EXECUTE FUNCTION public.g2_hr_change();
DROP TRIGGER IF EXISTS g2_grievance_change ON public.hr_grievances;
DROP TRIGGER IF EXISTS g2_grievance_change ON public.hr_grievances;
CREATE TRIGGER g2_grievance_change BEFORE UPDATE ON public.hr_grievances FOR EACH ROW EXECUTE FUNCTION public.g2_hr_change();
DO $$ DECLARE f text; BEGIN
 FOREACH f IN ARRAY ARRAY['hr_generate_payroll(date)','hr_advance_plan(numeric,numeric,date,uuid,text,uuid)','hr_advance_balances()','hr_advance_cancel(uuid,text)','hr_correction_review(boolean,uuid,text)','grievance_submit(boolean,text,text)','grievance_status(text)','hr_people_overview(date)','my_id_card()','public_team_directory()','g2_hr_change()'] LOOP
 EXECUTE 'REVOKE ALL ON FUNCTION public.'||f||' FROM PUBLIC,anon';
 EXECUTE 'GRANT EXECUTE ON FUNCTION public.'||f||' TO authenticated,service_role';
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.public_team_directory() TO anon;

CREATE UNIQUE INDEX IF NOT EXISTS hr_exits_user_unique ON public.hr_exits(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS hr_reimbursement_once ON public.hr_payslip_items(request_id) WHERE kind='reimbursement' AND request_id IS NOT NULL;
-- ===== 0009_crm_support_admin =====
CREATE TABLE IF NOT EXISTS public.crm_coaching_notes (
 acknowledged_at timestamptz,
 action_items text NOT NULL DEFAULT '',
 coach_id uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 employee_id uuid NOT NULL,
 follow_up_date date,
 id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
 kind text NOT NULL DEFAULT 'coaching',
 notes text NOT NULL DEFAULT '',
 session_date date NOT NULL DEFAULT current_date,
 topic text NOT NULL,
 CHECK(kind IN ('coaching','training','review','warning'))
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.crm_coaching_notes TO authenticated,service_role;
ALTER TABLE public.crm_coaching_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.crm_coaching_notes;
DROP POLICY IF EXISTS g4_read ON public.crm_coaching_notes;
CREATE POLICY g4_read ON public.crm_coaching_notes FOR SELECT TO authenticated USING (employee_id=auth.uid() OR public.crm_can_access(employee_id));
DROP POLICY IF EXISTS g4_write ON public.crm_coaching_notes;
DROP POLICY IF EXISTS g4_write ON public.crm_coaching_notes;
CREATE POLICY g4_write ON public.crm_coaching_notes FOR ALL TO authenticated USING (coach_id=auth.uid() AND public.crm_role() IN ('admin','BDM') AND public.crm_can_access(employee_id)) WITH CHECK (coach_id=auth.uid() AND public.crm_role() IN ('admin','BDM') AND public.crm_can_access(employee_id));
CREATE TABLE IF NOT EXISTS public.crm_daily_reports (
 blockers text NOT NULL DEFAULT '',
 calls integer NOT NULL DEFAULT 0,
 collected numeric NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(),
 follow_ups_done integer NOT NULL DEFAULT 0,
 id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
 meetings integer NOT NULL DEFAULT 0,
 new_leads integer NOT NULL DEFAULT 0,
 owner_id uuid NOT NULL,
 plan_tomorrow text NOT NULL DEFAULT '',
 report_date date NOT NULL,
 review_note text NOT NULL DEFAULT '',
 reviewed_at timestamptz,
 reviewed_by uuid,
 status text NOT NULL DEFAULT 'submitted',
 summary text NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 won_deals integer NOT NULL DEFAULT 0,
 UNIQUE(owner_id,report_date),
 CHECK(status IN ('submitted','reviewed','needs_changes'))
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.crm_daily_reports TO authenticated,service_role;
ALTER TABLE public.crm_daily_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.crm_daily_reports;
DROP POLICY IF EXISTS g4_read ON public.crm_daily_reports;
CREATE POLICY g4_read ON public.crm_daily_reports FOR SELECT TO authenticated USING (public.crm_can_access(owner_id));
DROP POLICY IF EXISTS g4_write ON public.crm_daily_reports;
DROP POLICY IF EXISTS g4_write ON public.crm_daily_reports;
CREATE POLICY g4_write ON public.crm_daily_reports FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE TABLE IF NOT EXISTS public.crm_documents (
 created_at timestamptz NOT NULL DEFAULT now(),
 customer_id uuid NOT NULL REFERENCES public.crm_customers(id) ON DELETE CASCADE,
 doc_type text NOT NULL DEFAULT 'other',
 file_name text NOT NULL,
 file_path text NOT NULL,
 id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
 lead_id uuid REFERENCES public.crm_leads(id) ON DELETE CASCADE,
 note text NOT NULL DEFAULT '',
 owner_id uuid,
 uploaded_by uuid NOT NULL DEFAULT auth.uid()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.crm_documents TO authenticated,service_role;
ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.crm_documents;
DROP POLICY IF EXISTS g4_read ON public.crm_documents;
CREATE POLICY g4_read ON public.crm_documents FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.crm_customers c WHERE c.id=customer_id AND public.crm_can_access(c.owner_id)));
DROP POLICY IF EXISTS g4_write ON public.crm_documents;
DROP POLICY IF EXISTS g4_write ON public.crm_documents;
CREATE POLICY g4_write ON public.crm_documents FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.crm_customers c WHERE c.id=customer_id AND public.crm_can_access(c.owner_id)) AND uploaded_by=auth.uid()) WITH CHECK (EXISTS(SELECT 1 FROM public.crm_customers c WHERE c.id=customer_id AND public.crm_can_access(c.owner_id)) AND uploaded_by=auth.uid());
CREATE TABLE IF NOT EXISTS public.crm_lead_assignments (
 changed_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 from_owner uuid,
 id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
 lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
 reason text NOT NULL DEFAULT '',
 to_owner uuid
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.crm_lead_assignments TO authenticated,service_role;
ALTER TABLE public.crm_lead_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.crm_lead_assignments;
DROP POLICY IF EXISTS g4_read ON public.crm_lead_assignments;
CREATE POLICY g4_read ON public.crm_lead_assignments FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.crm_leads l WHERE l.id=lead_id AND public.crm_can_access(l.owner_id)));
DROP POLICY IF EXISTS g4_write ON public.crm_lead_assignments;
DROP POLICY IF EXISTS g4_write ON public.crm_lead_assignments;
CREATE POLICY g4_write ON public.crm_lead_assignments FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE TABLE IF NOT EXISTS public.crm_manufacturers (
 capacity text NOT NULL DEFAULT '',
 certifications text NOT NULL DEFAULT '',
 company text NOT NULL,
 contact_name text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 factory_address text NOT NULL DEFAULT '',
 gstin text NOT NULL DEFAULT '',
 id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
 kyc_status text NOT NULL DEFAULT 'pending',
 machinery text NOT NULL DEFAULT '',
 notes text NOT NULL DEFAULT '',
 owner_id uuid NOT NULL DEFAULT auth.uid(),
 phone text NOT NULL DEFAULT '',
 products text NOT NULL DEFAULT '',
 stage text NOT NULL DEFAULT 'new',
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(stage IN ('new','visit_planned','visited','onboarded','dropped')),
 CHECK(kyc_status IN ('pending','submitted','verified','rejected'))
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.crm_manufacturers TO authenticated,service_role;
ALTER TABLE public.crm_manufacturers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.crm_manufacturers;
DROP POLICY IF EXISTS g4_read ON public.crm_manufacturers;
CREATE POLICY g4_read ON public.crm_manufacturers FOR SELECT TO authenticated USING (public.crm_can_access(owner_id));
DROP POLICY IF EXISTS g4_write ON public.crm_manufacturers;
DROP POLICY IF EXISTS g4_write ON public.crm_manufacturers;
CREATE POLICY g4_write ON public.crm_manufacturers FOR ALL TO authenticated USING (public.crm_can_access(owner_id)) WITH CHECK (public.crm_can_access(owner_id));
CREATE TABLE IF NOT EXISTS public.target_revisions (
 action text NOT NULL,
 changed_by uuid NOT NULL,
 changed_by_name text NOT NULL DEFAULT '',
 changed_by_role text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
 month date NOT NULL,
 new_calls integer NOT NULL,
 new_revenue numeric NOT NULL,
 new_wins integer NOT NULL,
 old_calls integer,
 old_revenue numeric,
 old_wins integer,
 owner_id uuid NOT NULL,
 reason text NOT NULL DEFAULT ''
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.target_revisions TO authenticated,service_role;
ALTER TABLE public.target_revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.target_revisions;
DROP POLICY IF EXISTS g4_read ON public.target_revisions;
CREATE POLICY g4_read ON public.target_revisions FOR SELECT TO authenticated USING (public.crm_can_access(owner_id));
DROP POLICY IF EXISTS g4_write ON public.target_revisions;
DROP POLICY IF EXISTS g4_write ON public.target_revisions;
CREATE POLICY g4_write ON public.target_revisions FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE TABLE IF NOT EXISTS public.customer_ticket_events (
 action text NOT NULL,
 actor_id uuid,
 actor_name text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
 note text NOT NULL DEFAULT '',
 ticket_id uuid NOT NULL REFERENCES public.customer_tickets(id) ON DELETE CASCADE
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.customer_ticket_events TO authenticated,service_role;
ALTER TABLE public.customer_ticket_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.customer_ticket_events;
DROP POLICY IF EXISTS g4_read ON public.customer_ticket_events;
CREATE POLICY g4_read ON public.customer_ticket_events FOR SELECT TO authenticated USING (public.c_department_access('support'));
DROP POLICY IF EXISTS g4_write ON public.customer_ticket_events;
DROP POLICY IF EXISTS g4_write ON public.customer_ticket_events;
CREATE POLICY g4_write ON public.customer_ticket_events FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE TABLE IF NOT EXISTS public.support_kb_articles (
 body text NOT NULL DEFAULT '',
 category text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid,
 id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
 status text NOT NULL DEFAULT 'draft',
 tags text NOT NULL DEFAULT '',
 title text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid,
 version integer NOT NULL DEFAULT 1
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.support_kb_articles TO authenticated,service_role;
ALTER TABLE public.support_kb_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.support_kb_articles;
DROP POLICY IF EXISTS g4_read ON public.support_kb_articles;
CREATE POLICY g4_read ON public.support_kb_articles FOR SELECT TO authenticated USING (public.c_department_access('support'));
DROP POLICY IF EXISTS g4_write ON public.support_kb_articles;
DROP POLICY IF EXISTS g4_write ON public.support_kb_articles;
CREATE POLICY g4_write ON public.support_kb_articles FOR ALL TO authenticated USING (public.support_is_manager()) WITH CHECK (public.support_is_manager());
CREATE TABLE IF NOT EXISTS public.admin_view_as_log (
 admin_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes',
 id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
 reason text NOT NULL,
 target_id uuid NOT NULL
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.admin_view_as_log TO authenticated,service_role;
ALTER TABLE public.admin_view_as_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.admin_view_as_log;
DROP POLICY IF EXISTS g4_read ON public.admin_view_as_log;
CREATE POLICY g4_read ON public.admin_view_as_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
 created_at timestamptz NOT NULL DEFAULT now(),
 dashboard text NOT NULL DEFAULT '',
 email text NOT NULL DEFAULT '',
 event text NOT NULL,
 id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
 path text NOT NULL DEFAULT '',
 section text NOT NULL DEFAULT '',
 user_agent text NOT NULL DEFAULT '',
 user_id uuid NOT NULL
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.user_activity_logs TO authenticated,service_role;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.user_activity_logs;
DROP POLICY IF EXISTS g4_read ON public.user_activity_logs;
CREATE POLICY g4_read ON public.user_activity_logs FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS g4_insert ON public.user_activity_logs;
DROP POLICY IF EXISTS g4_insert ON public.user_activity_logs;
CREATE POLICY g4_insert ON public.user_activity_logs FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE TABLE IF NOT EXISTS public.volunteer_verify_codes (
 code_hash text NOT NULL,
 set_by uuid,
 updated_at timestamptz NOT NULL DEFAULT now(),
 volunteer_id uuid NOT NULL PRIMARY KEY REFERENCES public.volunteers(id) ON DELETE CASCADE
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.volunteer_verify_codes TO authenticated,service_role;
ALTER TABLE public.volunteer_verify_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.volunteer_verify_codes;
DROP POLICY IF EXISTS g4_read ON public.volunteer_verify_codes;
CREATE POLICY g4_read ON public.volunteer_verify_codes FOR SELECT TO authenticated USING (false);
DROP POLICY IF EXISTS g4_write ON public.volunteer_verify_codes;
DROP POLICY IF EXISTS g4_write ON public.volunteer_verify_codes;
CREATE POLICY g4_write ON public.volunteer_verify_codes FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE TABLE IF NOT EXISTS public.work_request_counters (
 last_serial integer NOT NULL DEFAULT 0,
 period text NOT NULL PRIMARY KEY
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.work_request_counters TO authenticated,service_role;
ALTER TABLE public.work_request_counters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.work_request_counters;
DROP POLICY IF EXISTS g4_read ON public.work_request_counters;
CREATE POLICY g4_read ON public.work_request_counters FOR SELECT TO authenticated USING (false);
DROP POLICY IF EXISTS g4_write ON public.work_request_counters;
DROP POLICY IF EXISTS g4_write ON public.work_request_counters;
CREATE POLICY g4_write ON public.work_request_counters FOR ALL TO authenticated USING (false) WITH CHECK (false);
ALTER TABLE public.crm_tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.customer_tickets
 ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'website',
 ADD COLUMN IF NOT EXISTS csat_at timestamptz,
 ADD COLUMN IF NOT EXISTS csat_comment text,
 ADD COLUMN IF NOT EXISTS csat_rating integer CHECK(csat_rating BETWEEN 1 AND 5),
 ADD COLUMN IF NOT EXISTS due_at timestamptz,
 ADD COLUMN IF NOT EXISTS escalated_at timestamptz,
 ADD COLUMN IF NOT EXISTS escalation_level integer NOT NULL DEFAULT 0 CHECK(escalation_level BETWEEN 0 AND 3),
 ADD COLUMN IF NOT EXISTS finance_request_id uuid,
 ADD COLUMN IF NOT EXISTS finance_status text NOT NULL DEFAULT 'none',
 ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
 ADD COLUMN IF NOT EXISTS refund_amount numeric CHECK(refund_amount>0),
 ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'general',
 ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
GRANT UPDATE(channel,csat_at,csat_comment,csat_rating,due_at,escalated_at,escalation_level,first_response_at,request_type,resolved_at,private_notes,category) ON public.customer_tickets TO authenticated;
CREATE OR REPLACE FUNCTION public.g4_task_stamp() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.status='done' THEN NEW.completed_at:=coalesce(OLD.completed_at,now()); ELSE NEW.completed_at:=NULL; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS g4_task_stamp ON public.crm_tasks;
DROP TRIGGER IF EXISTS g4_task_stamp ON public.crm_tasks;
CREATE TRIGGER g4_task_stamp BEFORE UPDATE ON public.crm_tasks FOR EACH ROW EXECUTE FUNCTION public.g4_task_stamp();

CREATE OR REPLACE FUNCTION public.crm_ack_coaching(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 UPDATE crm_coaching_notes SET acknowledged_at=coalesce(acknowledged_at,now()) WHERE id=_id AND employee_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Session not found or not yours'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.crm_doc_folder_ok(_name text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM crm_customers c WHERE c.id::text=split_part(_name,'/',1) AND (crm_can_access(c.owner_id) OR EXISTS(SELECT 1 FROM crm_leads l WHERE l.customer_id=c.id AND crm_can_access(l.owner_id))))
$$;
DROP POLICY IF EXISTS g4_crm_docs ON storage.objects;
DROP POLICY IF EXISTS g4_crm_docs ON storage.objects;
CREATE POLICY g4_crm_docs ON storage.objects FOR ALL TO authenticated USING(bucket_id='crm-docs' AND public.crm_doc_folder_ok(name)) WITH CHECK(bucket_id='crm-docs' AND public.crm_doc_folder_ok(name));

CREATE OR REPLACE FUNCTION public.crm_reassign_leads(_leads uuid[],_owner uuid,_reason text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l crm_leads; n integer:=0;
BEGIN
 IF auth.uid() IS NULL OR crm_role() NOT IN ('admin','BDM') OR NOT crm_can_access(_owner) OR length(trim(_reason))<3 THEN RAISE EXCEPTION 'Manager access and reason required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM crm_memberships WHERE user_id=_owner AND active) THEN RAISE EXCEPTION 'Inactive owner'; END IF;
 FOR l IN SELECT * FROM crm_leads WHERE id=ANY(_leads) FOR UPDATE LOOP
  IF NOT crm_can_access(l.owner_id) THEN RAISE EXCEPTION 'Lead outside your team'; END IF;
  IF l.owner_id IS DISTINCT FROM _owner THEN
   INSERT INTO crm_lead_assignments(lead_id,from_owner,to_owner,changed_by,reason) VALUES(l.id,l.owner_id,_owner,auth.uid(),_reason);
   UPDATE crm_leads SET owner_id=_owner,updated_at=now() WHERE id=l.id; n:=n+1;
  END IF;
 END LOOP; RETURN n;
END $$;
CREATE OR REPLACE FUNCTION public.crm_submit_daily_report(_date date,_summary text,_blockers text DEFAULT '',_plan text DEFAULT '') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r uuid;
BEGIN
 IF auth.uid() IS NULL OR crm_role() IS NULL OR _date>(now() AT TIME ZONE 'Asia/Kolkata')::date OR length(trim(_summary))<10 THEN RAISE EXCEPTION 'Invalid report or access'; END IF;
 INSERT INTO crm_daily_reports(owner_id,report_date,summary,blockers,plan_tomorrow,calls,meetings,new_leads,follow_ups_done,won_deals,collected)
 SELECT auth.uid(),_date,_summary,_blockers,_plan,
 (SELECT count(*) FROM crm_activities WHERE actor_id=auth.uid() AND kind='call' AND (created_at AT TIME ZONE 'Asia/Kolkata')::date=_date),
 (SELECT count(*) FROM crm_activities WHERE actor_id=auth.uid() AND kind='meeting' AND (created_at AT TIME ZONE 'Asia/Kolkata')::date=_date),
 (SELECT count(*) FROM crm_leads WHERE owner_id=auth.uid() AND (created_at AT TIME ZONE 'Asia/Kolkata')::date=_date),
 (SELECT count(*) FROM crm_tasks WHERE owner_id=auth.uid() AND status='done' AND (completed_at AT TIME ZONE 'Asia/Kolkata')::date=_date),
 (SELECT count(*) FROM crm_leads WHERE owner_id=auth.uid() AND stage='won' AND (updated_at AT TIME ZONE 'Asia/Kolkata')::date=_date),
 (SELECT coalesce(sum(amount),0) FROM crm_collections WHERE owner_id=auth.uid() AND status<>'rejected' AND collected_on=_date)
 ON CONFLICT(owner_id,report_date) DO UPDATE SET summary=excluded.summary,blockers=excluded.blockers,plan_tomorrow=excluded.plan_tomorrow,calls=excluded.calls,meetings=excluded.meetings,new_leads=excluded.new_leads,follow_ups_done=excluded.follow_ups_done,won_deals=excluded.won_deals,collected=excluded.collected,status='submitted',reviewed_at=NULL,reviewed_by=NULL,updated_at=now()
 WHERE crm_daily_reports.status<>'reviewed' RETURNING id INTO r;
 IF r IS NULL THEN RAISE EXCEPTION 'Reviewed report is locked'; END IF; RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.crm_review_daily_report(_id uuid,_status text,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR crm_role() NOT IN ('admin','BDM') OR _status NOT IN ('reviewed','needs_changes') OR (_status='needs_changes' AND length(trim(_note))=0) THEN RAISE EXCEPTION 'Invalid review or access'; END IF;
 UPDATE crm_daily_reports SET status=_status,review_note=_note,reviewed_at=now(),reviewed_by=auth.uid(),updated_at=now() WHERE id=_id AND owner_id<>auth.uid() AND crm_can_access(owner_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Report not accessible'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.my_target_progress(_month date) RETURNS TABLE(calls bigint,calls_target integer,has_target boolean,revenue_target numeric,verified_collection numeric,wins_target integer,won_deals bigint,won_value numeric) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE m date:=date_trunc('month',_month)::date;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 RETURN QUERY SELECT
 (SELECT count(*) FROM crm_activities a WHERE a.actor_id=auth.uid() AND a.kind='call' AND a.created_at>=m AND a.created_at<m+interval '1 month'),
 coalesce(t.calls_target,0),t.id IS NOT NULL,coalesce(t.revenue_target,0),
 (SELECT coalesce(sum(c.amount),0) FROM crm_collections c WHERE c.owner_id=auth.uid() AND c.status='verified' AND c.collected_on>=m AND c.collected_on<m+interval '1 month'),coalesce(t.wins_target,0),
 (SELECT count(*) FROM crm_leads l WHERE l.owner_id=auth.uid() AND l.stage='won' AND l.updated_at>=m AND l.updated_at<m+interval '1 month'),
 (SELECT coalesce(sum(l.amount),0) FROM crm_leads l WHERE l.owner_id=auth.uid() AND l.stage='won' AND l.updated_at>=m AND l.updated_at<m+interval '1 month')
 FROM (SELECT 1) x LEFT JOIN crm_targets t ON t.owner_id=auth.uid() AND t.month=m;
END $$;
CREATE OR REPLACE FUNCTION public.target_set(_calls integer,_month date,_owner uuid,_revenue numeric,_wins integer,_reason text DEFAULT '') RETURNS public.target_revisions LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE old crm_targets; r target_revisions; m date:=date_trunc('month',_month)::date;
BEGIN
 IF auth.uid() IS NULL OR crm_role() NOT IN ('admin','BDM') OR NOT crm_can_access(_owner) THEN RAISE EXCEPTION 'Manager access required'; END IF;
 IF _calls<0 OR _revenue<0 OR _wins<0 THEN RAISE EXCEPTION 'Targets must be nonnegative'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_owner::text||m::text,0));
 SELECT * INTO old FROM crm_targets WHERE owner_id=_owner AND month=m FOR UPDATE;
 IF old.id IS NOT NULL AND length(trim(_reason))<3 THEN RAISE EXCEPTION 'Revision reason required'; END IF;
 INSERT INTO crm_targets(owner_id,month,calls_target,revenue_target,wins_target) VALUES(_owner,m,_calls,_revenue,_wins) ON CONFLICT(owner_id,month) DO UPDATE SET calls_target=excluded.calls_target,revenue_target=excluded.revenue_target,wins_target=excluded.wins_target;
 INSERT INTO target_revisions(action,changed_by,changed_by_name,changed_by_role,month,new_calls,new_revenue,new_wins,old_calls,old_revenue,old_wins,owner_id,reason)
 VALUES(CASE WHEN old.id IS NULL THEN 'created' ELSE 'revised' END,auth.uid(),person_name(auth.uid()),crm_role(),m,_calls,_revenue,_wins,old.calls_target,old.revenue_target,old.wins_target,_owner,_reason) RETURNING * INTO r; RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.crm_leaderboard(_month date) RETURNS TABLE(full_name text,rank bigint,role text,user_id uuid,verified numeric,won_deals bigint) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR crm_role() IS NULL THEN RAISE EXCEPTION 'CRM access required'; END IF;
 RETURN QUERY SELECT person_name(q.uid),rank() OVER(ORDER BY q.v DESC,q.w DESC),q.r,q.uid,q.v,q.w FROM (
 SELECT m.user_id uid,m.role::text r,
 (SELECT coalesce(sum(c.amount),0) FROM crm_collections c WHERE c.owner_id=m.user_id AND c.status='verified' AND date_trunc('month',c.collected_on)=date_trunc('month',_month)) v,
 (SELECT count(*) FROM crm_leads l WHERE l.owner_id=m.user_id AND l.stage='won' AND date_trunc('month',l.updated_at)=date_trunc('month',_month)) w
 FROM crm_memberships m WHERE m.active AND m.role IN ('BDE','BDM','sales')) q;
END $$;
CREATE OR REPLACE FUNCTION public.support_sla(_priority text) RETURNS interval LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT CASE _priority WHEN 'urgent' THEN interval '4 hours' WHEN 'high' THEN interval '24 hours' ELSE interval '48 hours' END $$;
CREATE OR REPLACE FUNCTION public.support_team() RETURNS TABLE(active boolean,full_name text,level text,user_id uuid) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT c_department_access('support') THEN RAISE EXCEPTION 'Support access required'; END IF;
 RETURN QUERY SELECT d.active,person_name(d.user_id),d.level,d.user_id FROM department_staff d WHERE d.department='support';
END $$;
CREATE OR REPLACE FUNCTION public.support_log_ticket(_channel text,_description text,_email text,_full_name text,_phone text,_request_type text,_subject text,_category text DEFAULT 'general',_priority text DEFAULT 'normal',_reference text DEFAULT '') RETURNS public.customer_tickets LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r customer_tickets;
BEGIN
 IF auth.uid() IS NULL OR NOT c_department_access('support') THEN RAISE EXCEPTION 'Support access required'; END IF;
 IF length(trim(_full_name))=0 OR length(trim(_subject))=0 OR length(trim(_description))=0 THEN RAISE EXCEPTION 'Name, subject and description required'; END IF;
 INSERT INTO customer_tickets(full_name,email,phone,customer_reference,category,priority,subject,description,assigned_to,channel,request_type,due_at)
 VALUES(_full_name,_email,_phone,nullif(_reference,''),_category,_priority,_subject,_description,auth.uid(),_channel,_request_type,now()+support_sla(_priority)) RETURNING * INTO r;
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.support_send_refund(_amount numeric,_ticket uuid,_note text DEFAULT '') RETURNS public.customer_tickets LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t customer_tickets; r requests;
BEGIN
 IF auth.uid() IS NULL OR NOT c_department_access('support') THEN RAISE EXCEPTION 'Support access required'; END IF;
 IF _amount IS NULL OR _amount<=0 THEN RAISE EXCEPTION 'Positive amount required'; END IF;
 SELECT * INTO t FROM customer_tickets WHERE id=_ticket FOR UPDATE;
 IF NOT FOUND OR t.finance_request_id IS NOT NULL OR t.request_type NOT IN ('refund','cancellation') THEN RAISE EXCEPTION 'Ticket unavailable or refund already sent'; END IF;
 SELECT * INTO r FROM request_submit(_type=>'customer_refund',_title=>'Refund · '||t.ticket_code||' · '||t.full_name,_description=>_note,_details=>jsonb_build_object('ticket_id',t.id,'ticket_code',t.ticket_code,'customer',t.full_name,'kind',t.request_type),_amount=>_amount);
 UPDATE customer_tickets SET finance_request_id=r.id,finance_status='sent',refund_amount=_amount WHERE id=_ticket RETURNING * INTO t;
 RETURN t;
END $$;
CREATE OR REPLACE FUNCTION public.g4_ticket_lifecycle() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='INSERT' THEN NEW.due_at:=coalesce(NEW.due_at,now()+support_sla(NEW.priority));
 ELSE
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN NEW.due_at:=NEW.created_at+support_sla(NEW.priority); END IF;
  IF NEW.status IN ('resolved','closed') THEN NEW.resolved_at:=coalesce(OLD.resolved_at,now()); ELSE NEW.resolved_at:=NULL; END IF;
  IF NEW.status<>'open' OR NEW.resolution IS DISTINCT FROM OLD.resolution THEN NEW.first_response_at:=coalesce(OLD.first_response_at,now()); END IF;
  IF NEW.escalation_level>OLD.escalation_level THEN NEW.escalated_at:=now(); END IF;
  IF NEW.csat_rating IS DISTINCT FROM OLD.csat_rating THEN NEW.csat_at:=now(); END IF;
 END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS g4_ticket_lifecycle ON public.customer_tickets;
DROP TRIGGER IF EXISTS g4_ticket_lifecycle ON public.customer_tickets;
CREATE TRIGGER g4_ticket_lifecycle BEFORE INSERT OR UPDATE ON public.customer_tickets FOR EACH ROW EXECUTE FUNCTION public.g4_ticket_lifecycle();
CREATE OR REPLACE FUNCTION public.g4_ticket_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE k text;
BEGIN
 IF TG_OP='INSERT' THEN k:='created';
 ELSIF NEW.status IS DISTINCT FROM OLD.status THEN k:=NEW.status;
 ELSIF NEW.finance_status IS DISTINCT FROM OLD.finance_status THEN k:='finance_'||NEW.finance_status;
 ELSIF NEW.escalation_level IS DISTINCT FROM OLD.escalation_level THEN k:='escalated';
 ELSIF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN k:='assigned';
 ELSE k:='updated'; END IF;
 INSERT INTO customer_ticket_events(ticket_id,action,actor_id,actor_name,note) VALUES(NEW.id,k,auth.uid(),coalesce(c_staff_name(auth.uid()),'System'),CASE WHEN TG_OP='INSERT' THEN '' ELSE NEW.resolution END);
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS g4_ticket_history ON public.customer_tickets;
DROP TRIGGER IF EXISTS g4_ticket_history ON public.customer_tickets;
CREATE TRIGGER g4_ticket_history AFTER INSERT OR UPDATE ON public.customer_tickets FOR EACH ROW EXECUTE FUNCTION public.g4_ticket_history();
CREATE OR REPLACE FUNCTION public.g4_refund_sync() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status IS DISTINCT FROM OLD.status THEN
  UPDATE customer_tickets SET finance_status=CASE WHEN NEW.status='pending' THEN 'sent' ELSE NEW.status END WHERE finance_request_id=NEW.id;
 END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS g4_refund_sync ON public.requests;
DROP TRIGGER IF EXISTS g4_refund_sync ON public.requests;
CREATE TRIGGER g4_refund_sync AFTER UPDATE OF status ON public.requests FOR EACH ROW EXECUTE FUNCTION public.g4_refund_sync();

CREATE OR REPLACE FUNCTION public.volunteer_has_verify_code(_volunteer uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM volunteers WHERE id=_volunteer AND (user_id=auth.uid() OR employee_id=auth.uid() OR has_role(auth.uid(),'admin'))) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 RETURN EXISTS(SELECT 1 FROM volunteer_verify_codes WHERE volunteer_id=_volunteer);
END $$;
CREATE OR REPLACE FUNCTION public.volunteer_set_verify_code(_code text,_volunteer uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM volunteers WHERE id=_volunteer AND (user_id=auth.uid() OR employee_id=auth.uid() OR has_role(auth.uid(),'admin'))) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF length(trim(_code)) NOT BETWEEN 6 AND 64 THEN RAISE EXCEPTION 'Use a code of 6–64 characters'; END IF;
 INSERT INTO volunteer_verify_codes(volunteer_id,code_hash,set_by) VALUES(_volunteer,extensions.crypt(trim(_code),extensions.gen_salt('bf',10)),auth.uid()) ON CONFLICT(volunteer_id) DO UPDATE SET code_hash=excluded.code_hash,set_by=auth.uid(),updated_at=now();
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.verify_volunteer(_code text,_volunteer_id text) RETURNS TABLE(full_name text,location text,member_since timestamptz,status text,volunteer_id text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT v.full_name,concat_ws(', ',nullif(v.district,''),nullif(v.state,'')),coalesce(v.activated_at,v.created_at),v.status,v.volunteer_code
 FROM volunteers v JOIN volunteer_verify_codes c ON c.volunteer_id=v.id
 WHERE lower(v.volunteer_code)=lower(trim(_volunteer_id)) AND length(trim(_code)) BETWEEN 6 AND 64 AND c.code_hash=extensions.crypt(trim(_code),c.code_hash)
$$;

CREATE OR REPLACE FUNCTION public.admin_user_directory() RETURNS TABLE(access text[],confirmed boolean,created_at timestamptz,email text,employee_code text,full_name text,last_sign_in_at timestamptz,user_id uuid) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 RETURN QUERY SELECT ARRAY(SELECT ur.role::text FROM user_roles ur WHERE ur.user_id=u.id UNION SELECT cm.role::text FROM crm_memberships cm WHERE cm.user_id=u.id AND cm.active UNION SELECT ds.department||':'||ds.level FROM department_staff ds WHERE ds.user_id=u.id AND ds.active),u.email_confirmed_at IS NOT NULL,u.created_at,u.email,coalesce(p.employee_code,''),person_name(u.id),u.last_sign_in_at,u.id FROM auth.users u LEFT JOIN crm_employee_profiles p ON p.user_id=u.id;
END $$;
CREATE OR REPLACE FUNCTION public.admin_view_as(_reason text,_target uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF length(trim(_reason))<10 THEN RAISE EXCEPTION 'Reason must contain at least 10 characters'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=_target) THEN RAISE EXCEPTION 'User not found'; END IF;
 INSERT INTO admin_view_as_log(admin_id,target_id,reason) VALUES(auth.uid(),_target,_reason);
 SELECT jsonb_build_object('email',d.email,'last_sign_in',d.last_sign_in_at,'roles',d.access,'activity',coalesce((SELECT jsonb_agg(to_jsonb(a)) FROM (SELECT event,path,created_at FROM user_activity_logs WHERE user_id=_target ORDER BY created_at DESC LIMIT 30) a),'[]'::jsonb),'letters',coalesce((SELECT jsonb_agg(jsonb_build_object('title',h->>'title','issued_at',h->>'issued_at')) FROM g4_report_rows('hr_letters') h WHERE h->>'user_id'=_target::text),'[]'::jsonb)) INTO r FROM admin_user_directory() d WHERE d.user_id=_target;
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.admin_automation_status() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 RETURN jsonb_build_object('queued',(SELECT count(*) FROM sheet_mirror_queue),'failing',(SELECT count(*) FROM sheet_mirror_queue WHERE last_error IS NOT NULL AND last_error<>''),'oldest',(SELECT min(queued_at) FROM sheet_mirror_queue),'errors',coalesce((SELECT jsonb_agg(to_jsonb(q)) FROM (SELECT * FROM sheet_mirror_queue WHERE last_error IS NOT NULL AND last_error<>'' ORDER BY queued_at LIMIT 50) q),'[]'::jsonb));
END $$;
CREATE OR REPLACE FUNCTION public.admin_retry_sheet_copies() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 IF auth.uid() IS NULL OR NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 UPDATE sheet_mirror_queue SET attempts=0,last_error=NULL WHERE last_error IS NOT NULL AND last_error<>''; GET DIAGNOSTICS n=ROW_COUNT; RETURN n;
END $$;
CREATE OR REPLACE FUNCTION public.g4_report_rows(_table text) RETURNS SETOF jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF _table NOT IN ('hr_letters','hr_job_openings','hr_candidates','venture_clients','funding_applications','manpower_invoices') THEN RAISE EXCEPTION 'Invalid report source'; END IF;
 IF to_regclass('public.'||_table) IS NOT NULL THEN RETURN QUERY EXECUTE format('SELECT to_jsonb(t) FROM public.%I t',_table); END IF;
END $$;
CREATE OR REPLACE FUNCTION public.admin_period_report(_from date,_to date) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE a timestamptz:=_from::timestamp AT TIME ZONE 'Asia/Kolkata'; b timestamptz:=(_to+1)::timestamp AT TIME ZONE 'Asia/Kolkata'; sales jsonb; support jsonb; hr jsonb; finance jsonb; ventures jsonb; research jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF _from IS NULL OR _to IS NULL OR _to<_from THEN RAISE EXCEPTION 'Invalid date range'; END IF;
 SELECT jsonb_build_object('leads',count(*),'won',count(*) FILTER(WHERE stage='won'),'won_value',coalesce(sum(amount) FILTER(WHERE stage='won'),0)) INTO sales FROM crm_leads WHERE created_at>=a AND created_at<b;
 sales:=sales||jsonb_build_object('verified',(SELECT coalesce(sum(amount),0) FROM crm_collections WHERE status='verified' AND collected_on BETWEEN _from AND _to),'unverified',(SELECT coalesce(sum(amount),0) FROM crm_collections WHERE status NOT IN ('verified','rejected') AND collected_on BETWEEN _from AND _to),'people',coalesce((SELECT jsonb_agg(jsonb_build_object('user_id',m.user_id,'role',m.role,'manager_id',m.manager_id,'name',person_name(m.user_id),'target',(SELECT coalesce(sum(revenue_target),0) FROM crm_targets WHERE owner_id=m.user_id AND month BETWEEN date_trunc('month',_from)::date AND _to),'collected',(SELECT coalesce(sum(amount),0) FROM crm_collections WHERE owner_id=m.user_id AND status='verified' AND collected_on BETWEEN _from AND _to),'leads',(SELECT count(*) FROM crm_leads WHERE owner_id=m.user_id AND created_at>=a AND created_at<b),'won',(SELECT count(*) FROM crm_leads WHERE owner_id=m.user_id AND stage='won' AND updated_at>=a AND updated_at<b))) FROM crm_memberships m WHERE m.active),'[]'::jsonb));
 SELECT jsonb_build_object('opened',count(*) FILTER(WHERE created_at>=a AND created_at<b),'resolved',count(*) FILTER(WHERE resolved_at>=a AND resolved_at<b),'open_now',count(*) FILTER(WHERE status NOT IN ('resolved','closed')),'overdue',count(*) FILTER(WHERE status NOT IN ('resolved','closed') AND due_at<now()),'avg_first_response_hours',avg(extract(epoch FROM first_response_at-created_at)/3600) FILTER(WHERE created_at>=a AND created_at<b)) INTO support FROM customer_tickets;
 SELECT jsonb_build_object('requests',coalesce((SELECT jsonb_object_agg(status,n) FROM (SELECT status,count(*) n FROM requests WHERE created_at>=a AND created_at<b GROUP BY status) q),'{}'::jsonb),'pending_now',(SELECT count(*) FROM requests WHERE status='pending'),'applications',(SELECT count(*) FROM g4_report_rows('hr_candidates') j WHERE (j->>'created_at')::timestamptz>=a AND (j->>'created_at')::timestamptz<b),'hires',(SELECT count(*) FROM g4_report_rows('hr_candidates') j WHERE j->>'status'='hired' AND (j->>'updated_at')::timestamptz>=a AND (j->>'updated_at')::timestamptz<b),'open_jobs',(SELECT count(*) FROM g4_report_rows('hr_job_openings') j WHERE j->>'status'='open'),'jobs_waiting_approval',(SELECT count(*) FROM g4_report_rows('hr_job_openings') j WHERE j->>'status' IN ('pending','pending_approval'))) INTO hr;
 SELECT jsonb_build_object('verified_collections',sales->'verified','refunds_paid',coalesce((SELECT sum(amount) FROM requests WHERE type='customer_refund' AND status='paid' AND updated_at>=a AND updated_at<b),0),'manpower_paid',coalesce((SELECT sum((j->>'total')::numeric) FROM g4_report_rows('manpower_invoices') j WHERE j->>'status'='paid' AND (j->>'paid_at')::timestamptz>=a AND (j->>'paid_at')::timestamptz<b),0),'manpower_unpaid',coalesce((SELECT sum((j->>'total')::numeric) FROM g4_report_rows('manpower_invoices') j WHERE j->>'status'<>'paid'),0)) INTO finance;
 SELECT jsonb_build_object('new_clients',(SELECT count(*) FROM g4_report_rows('venture_clients') j WHERE (j->>'created_at')::timestamptz>=a AND (j->>'created_at')::timestamptz<b),'files_opened',(SELECT count(*) FROM g4_report_rows('funding_applications') j WHERE (j->>'created_at')::timestamptz>=a AND (j->>'created_at')::timestamptz<b),'funded',(SELECT count(*) FROM g4_report_rows('funding_applications') j WHERE j->>'status'='funded' AND (j->>'updated_at')::timestamptz>=a AND (j->>'updated_at')::timestamptz<b),'active_files',(SELECT count(*) FROM g4_report_rows('funding_applications') j WHERE j->>'status' NOT IN ('funded','rejected','closed','cancelled'))) INTO ventures;
 SELECT jsonb_build_object('requests',count(*) FILTER(WHERE created_at>=a AND created_at<b),'delivered',count(*) FILTER(WHERE status='delivered' AND updated_at>=a AND updated_at<b),'open_now',count(*) FILTER(WHERE status NOT IN ('delivered','cancelled'))) INTO research FROM research_requests;
 RETURN jsonb_build_object('sales',sales,'support',support,'hr',hr,'finance',finance,'ventures',ventures,'research',research);
END $$;
CREATE OR REPLACE FUNCTION public.g4_request_counter() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.code ~ '^REQ-[0-9]{4}-[0-9]+$' THEN
 INSERT INTO work_request_counters(period,last_serial) VALUES(split_part(NEW.code,'-',2),split_part(NEW.code,'-',3)::integer) ON CONFLICT(period) DO UPDATE SET last_serial=greatest(work_request_counters.last_serial,excluded.last_serial);
 END IF; RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS g4_request_counter ON public.requests;
DROP TRIGGER IF EXISTS g4_request_counter ON public.requests;
CREATE TRIGGER g4_request_counter AFTER INSERT ON public.requests FOR EACH ROW EXECUTE FUNCTION public.g4_request_counter();
INSERT INTO work_request_counters(period,last_serial) SELECT substring(code FROM 5 FOR 4),max(split_part(code,'-',3)::integer) FROM requests WHERE code ~ '^REQ-[0-9]{4}-[0-9]+$' GROUP BY 1 ON CONFLICT(period) DO UPDATE SET last_serial=greatest(work_request_counters.last_serial,excluded.last_serial);
DO $$ DECLARE f regprocedure; BEGIN
 FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname IN ('crm_ack_coaching','crm_doc_folder_ok','crm_leaderboard','crm_reassign_leads','crm_review_daily_report','crm_submit_daily_report','target_set','my_target_progress','support_log_ticket','support_send_refund','support_sla','support_team','admin_automation_status','admin_period_report','admin_retry_sheet_copies','admin_user_directory','admin_view_as','verify_volunteer','volunteer_has_verify_code','volunteer_set_verify_code') OR p.proname LIKE 'g4\_%') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',f);
 EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated,service_role',f);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.verify_volunteer(text,text) TO anon;
INSERT INTO public.request_routes(type,label,category,audience,kind,steps,steps_no_manager,sla_hours)
VALUES('customer_refund','Customer refund','Finance','employee','money',ARRAY['accounts','finance'],ARRAY['accounts','finance'],48)
ON CONFLICT(type) DO NOTHING;
DO $$ DECLARE body text; BEGIN
 SELECT pg_get_functiondef('public.request_submit(text,text,text,jsonb,date,date,numeric,text)'::regprocedure) INTO body;
 body:=replace(body,
 'INSERT INTO ack_form_counters(form_code,form_name,last_serial) VALUES(''REQ-''||to_char(now(),''YYMM''),''Work requests'',1) ON CONFLICT(form_code) DO UPDATE SET last_serial=ack_form_counters.last_serial+1 RETURNING last_serial INTO n;',
 'INSERT INTO public.work_request_counters(period,last_serial) VALUES(to_char(now(),''YYMM''),1) ON CONFLICT(period) DO UPDATE SET last_serial=work_request_counters.last_serial+1 RETURNING last_serial INTO n;');
 EXECUTE body;
END $$;
-- ===== 0010_careers_recruitment =====
CREATE TABLE IF NOT EXISTS public.hr_job_openings (
  apply_end date,
  apply_start date,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  department text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  designation text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT 'full_time',
  experience_required text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_code text NOT NULL DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
  location text NOT NULL DEFAULT '',
  openings integer NOT NULL DEFAULT 1,
  qualification text NOT NULL DEFAULT '',
  recruiter_id uuid,
  reporting_manager text NOT NULL DEFAULT '',
  required_docs text NOT NULL DEFAULT '',
  responsibilities text NOT NULL DEFAULT '',
  salary_range text NOT NULL DEFAULT '',
  selection_process text NOT NULL DEFAULT '',
  show_salary boolean NOT NULL DEFAULT false,
  skills text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  title text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  visibility text NOT NULL DEFAULT 'public',
  work_mode text NOT NULL DEFAULT 'office',
  working_days text NOT NULL DEFAULT '',
  working_hours text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_job_openings TO authenticated, service_role;
ALTER TABLE public.hr_job_openings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_job_openings;
DROP POLICY IF EXISTS g1_hr ON public.hr_job_openings;
CREATE POLICY g1_hr ON public.hr_job_openings TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_institutes (
  active boolean NOT NULL DEFAULT true,
  city text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  email text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL DEFAULT 'message',
  name text NOT NULL,
  phone text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_institutes TO authenticated, service_role;
ALTER TABLE public.hr_institutes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_institutes;
DROP POLICY IF EXISTS g1_hr ON public.hr_institutes;
CREATE POLICY g1_hr ON public.hr_institutes TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_referral_links (
  active boolean NOT NULL DEFAULT true,
  clicks integer NOT NULL DEFAULT 0,
  code text NOT NULL,
  commission_amount numeric NOT NULL DEFAULT 0,
  coordinator_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  expires_at timestamptz,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id uuid,
  job_id uuid,
  kind text NOT NULL,
  owner_contact text NOT NULL DEFAULT '',
  owner_name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hr_referral_links_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES public.coordinators(id),
  CONSTRAINT hr_referral_links_institute_id_fkey FOREIGN KEY (institute_id) REFERENCES public.hr_institutes(id),
  CONSTRAINT hr_referral_links_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.hr_job_openings(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_referral_links TO authenticated, service_role;
ALTER TABLE public.hr_referral_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_referral_links;
DROP POLICY IF EXISTS g1_hr ON public.hr_referral_links;
CREATE POLICY g1_hr ON public.hr_referral_links TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_candidates (
  application_ref text DEFAULT ('APP-' || upper(replace(gen_random_uuid()::text,'-',''))),
  assigned_recruiter uuid,
  availability text NOT NULL DEFAULT '',
  candidate_user_id uuid,
  city text NOT NULL DEFAULT '',
  course text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  current_address text NOT NULL DEFAULT '',
  current_ctc numeric,
  current_designation text NOT NULL DEFAULT '',
  current_org text NOT NULL DEFAULT '',
  dob date,
  email text NOT NULL DEFAULT '',
  employee_user_id uuid,
  expected_ctc numeric,
  experience_years numeric,
  full_name text NOT NULL,
  gender text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id uuid,
  interview_at timestamptz,
  interviewer text NOT NULL DEFAULT '',
  is_fresher boolean NOT NULL DEFAULT true,
  job_id uuid,
  joining_date date,
  languages text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  notice_period text NOT NULL DEFAULT '',
  offer_note text NOT NULL DEFAULT '',
  offer_responded_at timestamptz,
  offer_status text NOT NULL DEFAULT 'none',
  offered_ctc numeric,
  passing_year integer,
  permanent_address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  pincode text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'normal',
  probation_months integer,
  qualification text NOT NULL DEFAULT '',
  rating integer,
  referral_code text NOT NULL DEFAULT '',
  referral_conflict boolean NOT NULL DEFAULT false,
  referral_link_id uuid,
  referral_name text NOT NULL DEFAULT '',
  rejection_reason text NOT NULL DEFAULT '',
  resume_path text,
  score text NOT NULL DEFAULT '',
  skills text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'direct',
  source_detail text NOT NULL DEFAULT '',
  specialisation text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT 'applied',
  state text NOT NULL DEFAULT '',
  university text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  why_join text NOT NULL DEFAULT '',
  CONSTRAINT hr_candidates_institute_id_fkey FOREIGN KEY (institute_id) REFERENCES public.hr_institutes(id),
  CONSTRAINT hr_candidates_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.hr_job_openings(id),
  CONSTRAINT hr_candidates_referral_link_id_fkey FOREIGN KEY (referral_link_id) REFERENCES public.hr_referral_links(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_candidates TO authenticated, service_role;
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_candidates;
DROP POLICY IF EXISTS g1_hr ON public.hr_candidates;
CREATE POLICY g1_hr ON public.hr_candidates TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_candidate_events (
  actor_id uuid,
  actor_name text NOT NULL DEFAULT '',
  candidate_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  from_stage text,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  to_stage text NOT NULL,
  CONSTRAINT hr_candidate_events_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.hr_candidates(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_candidate_events TO authenticated, service_role;
ALTER TABLE public.hr_candidate_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_candidate_events;
DROP POLICY IF EXISTS g1_hr ON public.hr_candidate_events;
CREATE POLICY g1_hr ON public.hr_candidate_events TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_candidate_messages (
  body text NOT NULL,
  candidate_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  file_path text,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL DEFAULT 'message',
  sender text NOT NULL,
  sender_id uuid,
  CONSTRAINT hr_candidate_messages_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.hr_candidates(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_candidate_messages TO authenticated, service_role;
ALTER TABLE public.hr_candidate_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_candidate_messages;
DROP POLICY IF EXISTS g1_hr ON public.hr_candidate_messages;
CREATE POLICY g1_hr ON public.hr_candidate_messages TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_interview_rounds (
  candidate_feedback text NOT NULL DEFAULT '',
  candidate_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  internal_feedback text NOT NULL DEFAULT '',
  interviewer_name text NOT NULL DEFAULT '',
  interviewer_user_id uuid,
  location_or_link text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT '',
  recommendation text NOT NULL DEFAULT '',
  round_type text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  score numeric,
  status text NOT NULL DEFAULT 'scheduled',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hr_interview_rounds_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.hr_candidates(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_interview_rounds TO authenticated, service_role;
ALTER TABLE public.hr_interview_rounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_interview_rounds;
DROP POLICY IF EXISTS g1_hr ON public.hr_interview_rounds;
CREATE POLICY g1_hr ON public.hr_interview_rounds TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_assessments (
  candidate_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  due_at timestamptz,
  evaluator_notes text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructions text NOT NULL DEFAULT '',
  kind text NOT NULL,
  link text NOT NULL DEFAULT '',
  marks numeric,
  max_marks integer NOT NULL DEFAULT 100,
  result text NOT NULL DEFAULT '',
  share_score boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'assigned',
  submission_note text NOT NULL DEFAULT '',
  submission_path text,
  submitted_at timestamptz,
  title text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hr_assessments_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.hr_candidates(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_assessments TO authenticated, service_role;
ALTER TABLE public.hr_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_assessments;
DROP POLICY IF EXISTS g1_hr ON public.hr_assessments;
CREATE POLICY g1_hr ON public.hr_assessments TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_referral_payouts (
  amount numeric NOT NULL,
  candidate_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id uuid,
  note text NOT NULL DEFAULT '',
  paid_reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT hr_referral_payouts_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.hr_candidates(id),
  CONSTRAINT hr_referral_payouts_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.hr_referral_links(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_referral_payouts TO authenticated, service_role;
ALTER TABLE public.hr_referral_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_referral_payouts;
DROP POLICY IF EXISTS g1_hr ON public.hr_referral_payouts;
CREATE POLICY g1_hr ON public.hr_referral_payouts TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_institute_members (
  active boolean NOT NULL DEFAULT true,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  institute_id uuid NOT NULL,
  user_id uuid NOT NULL,
  PRIMARY KEY(institute_id,user_id),
  CONSTRAINT hr_institute_members_institute_id_fkey FOREIGN KEY (institute_id) REFERENCES public.hr_institutes(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_institute_members TO authenticated, service_role;
ALTER TABLE public.hr_institute_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_institute_members;
DROP POLICY IF EXISTS g1_hr ON public.hr_institute_members;
CREATE POLICY g1_hr ON public.hr_institute_members TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_letter_templates (
  active boolean NOT NULL DEFAULT true,
  body text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL DEFAULT 'message',
  name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_letter_templates TO authenticated, service_role;
ALTER TABLE public.hr_letter_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_letter_templates;
DROP POLICY IF EXISTS g1_hr ON public.hr_letter_templates;
CREATE POLICY g1_hr ON public.hr_letter_templates TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_letters (
  body text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid,
  kind text NOT NULL,
  ref_no text,
  title text NOT NULL,
  user_id uuid NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_letters TO authenticated, service_role;
ALTER TABLE public.hr_letters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_letters;
DROP POLICY IF EXISTS g1_hr ON public.hr_letters;
CREATE POLICY g1_hr ON public.hr_letters TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE TABLE IF NOT EXISTS public.hr_onboarding_tasks (
  created_at timestamptz NOT NULL DEFAULT now(),
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  done_by uuid,
  employee_id text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sort integer NOT NULL DEFAULT 0,
  task text NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_onboarding_tasks TO authenticated, service_role;
ALTER TABLE public.hr_onboarding_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g1_hr ON public.hr_onboarding_tasks;
DROP POLICY IF EXISTS g1_hr ON public.hr_onboarding_tasks;
CREATE POLICY g1_hr ON public.hr_onboarding_tasks TO authenticated USING (public.hr_staff()) WITH CHECK (public.hr_staff());
CREATE UNIQUE INDEX IF NOT EXISTS hr_jobs_code_uq ON public.hr_job_openings(job_code);
CREATE UNIQUE INDEX IF NOT EXISTS hr_referral_code_uq ON public.hr_referral_links(upper(code));
CREATE UNIQUE INDEX IF NOT EXISTS hr_candidate_ref_uq ON public.hr_candidates(application_ref);
CREATE UNIQUE INDEX IF NOT EXISTS hr_onboard_task_uq ON public.hr_onboarding_tasks(employee_id,task);
CREATE OR REPLACE FUNCTION public.candidate_email() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT lower(email) FROM auth.users WHERE id=auth.uid() $$;
CREATE OR REPLACE FUNCTION public.candidate_owns(_candidate uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM hr_candidates WHERE id=_candidate AND lower(email)=candidate_email() AND email<>'') $$;
CREATE OR REPLACE FUNCTION public.institute_of_caller() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT m.institute_id FROM hr_institute_members m JOIN hr_institutes i ON i.id=m.institute_id WHERE m.user_id=auth.uid() AND m.active AND i.active ORDER BY m.created_at LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.hr_stage_text(_s text) RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT CASE _s WHEN 'applied' THEN 'Application submitted' WHEN 'offered' THEN 'Offer released' WHEN 'hired' THEN 'Joined' ELSE initcap(replace(_s,'_',' ')) END $$;
CREATE OR REPLACE FUNCTION public.hr_notify_staff(_body text, _title text, _link text DEFAULT '/hr') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT hr_staff() THEN RAISE EXCEPTION 'HR access required'; END IF;
INSERT INTO notifications(user_id,title,body,link) SELECT DISTINCT u.id,_title,_body,coalesce(_link,'/hr') FROM auth.users u WHERE has_role(u.id,'admin') OR EXISTS(SELECT 1 FROM department_staff d WHERE d.user_id=u.id AND d.department='hr' AND d.active);
END $$;
CREATE OR REPLACE FUNCTION public.careers_open_jobs() RETURNS TABLE(apply_end date,created_at timestamptz,department text,description text,designation text,employment_type text,experience_required text,id uuid,job_code text,location text,openings integer,qualification text,required_docs text,responsibilities text,salary_range text,selection_process text,skills text,title text,work_mode text,working_days text,working_hours text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT j.apply_end,j.created_at,j.department,j.description,j.designation,j.employment_type,j.experience_required,j.id,j.job_code,j.location,j.openings,j.qualification,j.required_docs,j.responsibilities,CASE WHEN j.show_salary THEN j.salary_range ELSE '' END,j.selection_process,j.skills,j.title,j.work_mode,j.working_days,j.working_hours FROM hr_job_openings j WHERE j.status='open' AND j.visibility='public' AND (j.apply_start IS NULL OR j.apply_start<=current_date) AND (j.apply_end IS NULL OR j.apply_end>=current_date) $$;
CREATE OR REPLACE FUNCTION public.careers_referral_lookup(_code text,_job uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT coalesce((SELECT jsonb_build_object('valid',true,'code',r.code,'kind',r.kind,'name',r.owner_name,'institute',i.name) FROM hr_referral_links r LEFT JOIN hr_institutes i ON i.id=r.institute_id WHERE upper(r.code)=upper(trim(_code)) AND r.active AND (r.expires_at IS NULL OR r.expires_at>now()) AND (_job IS NULL OR r.job_id IS NULL OR r.job_id=_job) AND (r.institute_id IS NULL OR i.active)),jsonb_build_object('valid',false,'reason','Invalid, expired or mismatched referral code')) $$;
CREATE OR REPLACE FUNCTION public.careers_referral_click(_code text) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ UPDATE hr_referral_links SET clicks=clicks+1 WHERE upper(code)=upper(trim(_code)) AND active AND (expires_at IS NULL OR expires_at>now()) $$;
CREATE OR REPLACE FUNCTION public.careers_status(_phone text,_ref text) RETURNS TABLE(applied_at timestamptz,interview_at timestamptz,job_title text,stage text,stage_label text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT c.created_at,c.interview_at,j.title,c.stage,hr_stage_text(c.stage) FROM hr_candidates c LEFT JOIN hr_job_openings j ON j.id=c.job_id WHERE upper(c.application_ref)=upper(trim(_ref)) AND length(regexp_replace(_phone,'\D','','g'))>=10 AND regexp_replace(c.phone,'\D','','g')=regexp_replace(_phone,'\D','','g') $$;
CREATE OR REPLACE FUNCTION public.careers_apply(_d jsonb,_job uuid,_ref text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c hr_candidates; r hr_referral_links; payload jsonb; warning text; BEGIN
IF NOT EXISTS(SELECT 1 FROM careers_open_jobs() WHERE id=_job) THEN RAISE EXCEPTION 'Job is not accepting applications'; END IF;
IF coalesce((_d->>'confirm')::boolean,false)=false OR length(trim(coalesce(_d->>'full_name','')))<2 OR coalesce(_d->>'email','') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(regexp_replace(coalesce(_d->>'phone',''),'\D','','g'))<10 OR trim(coalesce(_d->>'qualification',''))='' THEN RAISE EXCEPTION 'Confirm name, email, phone and qualification'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(lower(_d->>'email')||_job::text,0));
IF EXISTS(SELECT 1 FROM hr_candidates WHERE job_id=_job AND (lower(email)=lower(trim(_d->>'email')) OR regexp_replace(phone,'\D','','g')=regexp_replace(_d->>'phone','\D','','g'))) THEN RAISE EXCEPTION 'An application already exists for this job'; END IF;
IF coalesce(_d->>'resume_path','')<>'' AND (auth.uid() IS NULL OR (_d->>'resume_path') NOT LIKE 'candidate/'||auth.uid()::text||'/%' OR (_d->>'resume_path') LIKE '%..%') THEN RAISE EXCEPTION 'Invalid resume path'; END IF;
IF coalesce(_ref,'')<>'' THEN
 IF (careers_referral_lookup(_ref,_job)->>'valid')::boolean THEN SELECT * INTO r FROM hr_referral_links WHERE upper(code)=upper(trim(_ref)); ELSE warning:='Referral code was invalid or expired; application saved without referral'; END IF;
END IF;
SELECT jsonb_object_agg(key,value) INTO payload FROM jsonb_each(_d) WHERE key=ANY(ARRAY['full_name','email','phone','city','state','pincode','dob','gender','current_address','permanent_address','qualification','course','specialisation','university','passing_year','score','is_fresher','experience_years','current_org','current_designation','current_ctc','expected_ctc','notice_period','skills','languages','why_join','availability','resume_path']);
SELECT * INTO c FROM jsonb_populate_record(NULL::hr_candidates,payload);
INSERT INTO hr_candidates(full_name,email,phone,job_id) VALUES(trim(c.full_name),lower(trim(c.email)),c.phone,_job) RETURNING * INTO c;
payload:=payload - ARRAY['full_name','email','phone'];
SELECT * INTO c FROM jsonb_populate_record(c,payload);
UPDATE hr_candidates SET city=c.city,state=c.state,pincode=c.pincode,dob=c.dob,gender=c.gender,current_address=c.current_address,permanent_address=c.permanent_address,qualification=c.qualification,course=c.course,specialisation=c.specialisation,university=c.university,passing_year=c.passing_year,score=c.score,is_fresher=c.is_fresher,experience_years=c.experience_years,current_org=c.current_org,current_designation=c.current_designation,current_ctc=c.current_ctc,expected_ctc=c.expected_ctc,notice_period=c.notice_period,skills=c.skills,languages=c.languages,why_join=c.why_join,availability=c.availability,resume_path=c.resume_path,source=CASE WHEN r.id IS NULL THEN 'career_page' ELSE 'referral' END,referral_link_id=r.id,referral_code=coalesce(r.code,''),referral_name=coalesce(r.owner_name,''),institute_id=r.institute_id,candidate_user_id=CASE WHEN candidate_email()=lower(c.email) THEN auth.uid() END WHERE id=c.id;
RETURN jsonb_build_object('ref',c.application_ref,'referral',r.owner_name,'warning',warning);
END $$;
CREATE OR REPLACE FUNCTION public.candidate_withdraw(_candidate uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT candidate_owns(_candidate) THEN RAISE EXCEPTION 'Not your application'; END IF;
UPDATE hr_candidates SET stage='withdrawn' WHERE id=_candidate AND stage NOT IN ('hired','rejected','withdrawn','offer_declined'); IF NOT FOUND THEN RAISE EXCEPTION 'Application is closed'; END IF; END $$;
CREATE OR REPLACE FUNCTION public.candidate_respond_offer(_accept boolean,_candidate uuid,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT candidate_owns(_candidate) THEN RAISE EXCEPTION 'Not your application'; END IF;
UPDATE hr_candidates SET offer_status=CASE WHEN _accept THEN 'accepted' ELSE 'declined' END,stage=CASE WHEN _accept THEN stage ELSE 'offer_declined' END,offer_note=coalesce(_note,''),offer_responded_at=now() WHERE id=_candidate AND stage='offered' AND offer_status NOT IN ('accepted','declined'); IF NOT FOUND THEN RAISE EXCEPTION 'No pending offer'; END IF; END $$;
CREATE OR REPLACE FUNCTION public.candidate_send_message(_body text,_candidate uuid,_file_path text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT candidate_owns(_candidate) THEN RAISE EXCEPTION 'Not your application'; END IF;
IF length(trim(coalesce(_body,'')))=0 OR length(_body)>10000 THEN RAISE EXCEPTION 'Message required (maximum 10000 characters)'; END IF;
IF _file_path IS NOT NULL AND (_file_path NOT LIKE 'candidate/'||auth.uid()::text||'/%' OR _file_path LIKE '%..%') THEN RAISE EXCEPTION 'Invalid file'; END IF;
INSERT INTO hr_candidate_messages(candidate_id,sender,sender_id,body,file_path) VALUES(_candidate,'candidate',auth.uid(),_body,_file_path); END $$;
CREATE OR REPLACE FUNCTION public.candidate_set_resume(_candidate uuid,_path text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT candidate_owns(_candidate) THEN RAISE EXCEPTION 'Not your application'; END IF;
IF _path IS NULL OR _path NOT LIKE 'candidate/'||auth.uid()::text||'/%' OR _path LIKE '%..%' THEN RAISE EXCEPTION 'Invalid file'; END IF;
UPDATE hr_candidates SET resume_path=_path WHERE id=_candidate; END $$;
CREATE OR REPLACE FUNCTION public.candidate_submit_assessment(_assessment uuid,_note text,_file_path text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT EXISTS(SELECT 1 FROM hr_assessments WHERE id=_assessment AND candidate_owns(candidate_id)) THEN RAISE EXCEPTION 'Not your assessment'; END IF;
IF _file_path IS NOT NULL AND (_file_path NOT LIKE 'candidate/'||auth.uid()::text||'/%' OR _file_path LIKE '%..%') THEN RAISE EXCEPTION 'Invalid file'; END IF;
IF trim(coalesce(_note,''))='' AND _file_path IS NULL THEN RAISE EXCEPTION 'Submission required'; END IF;
UPDATE hr_assessments SET submission_note=coalesce(_note,''),submission_path=_file_path,submitted_at=now(),status='submitted' WHERE id=_assessment AND status IN ('assigned','pending') AND (due_at IS NULL OR due_at>=now()); IF NOT FOUND THEN RAISE EXCEPTION 'Assessment is closed or overdue'; END IF; END $$;
CREATE OR REPLACE FUNCTION public.candidate_my_applications() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT coalesce(jsonb_agg(jsonb_build_object('id',c.id,'ref',c.application_ref,'job_title',coalesce(j.title,'General application'),'job_code',j.job_code,'department',j.department,'location',j.location,'designation',j.designation,'stage',c.stage,'stage_label',hr_stage_text(c.stage),'applied_at',c.created_at,'has_resume',c.resume_path IS NOT NULL,'offer_status',c.offer_status,'offered_ctc',CASE WHEN c.stage IN ('offered','hired','offer_declined') THEN c.offered_ctc END,'joining_date',c.joining_date,'probation_months',c.probation_months,'referral',nullif(c.referral_name,''),'profile',jsonb_build_object('full_name',c.full_name,'phone',c.phone,'city',c.city,'qualification',c.qualification,'university',c.university,'skills',c.skills,'experience_years',c.experience_years,'dob',c.dob,'current_address',c.current_address),
 'timeline',coalesce((SELECT jsonb_agg(jsonb_build_object('stage',e.to_stage,'label',hr_stage_text(e.to_stage),'at',e.created_at) ORDER BY e.created_at) FROM hr_candidate_events e WHERE e.candidate_id=c.id),'[]'::jsonb),
 'rounds',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'type',r.round_type,'at',r.scheduled_at,'mode',r.mode,'where',r.location_or_link,'status',r.status,'feedback',r.candidate_feedback) ORDER BY r.scheduled_at) FROM hr_interview_rounds r WHERE r.candidate_id=c.id),'[]'::jsonb),
 'assessments',coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'kind',a.kind,'title',a.title,'instructions',a.instructions,'link',a.link,'due_at',a.due_at,'status',a.status,'submitted_at',a.submitted_at,'marks',CASE WHEN a.share_score THEN a.marks END,'max_marks',CASE WHEN a.share_score THEN a.max_marks END,'result',CASE WHEN a.share_score THEN a.result END)) FROM hr_assessments a WHERE a.candidate_id=c.id),'[]'::jsonb),
 'messages',coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.id,'sender',m.sender,'kind',m.kind,'body',m.body,'has_file',m.file_path IS NOT NULL,'at',m.created_at) ORDER BY m.created_at) FROM hr_candidate_messages m WHERE m.candidate_id=c.id),'[]'::jsonb)) ORDER BY c.created_at DESC),'[]'::jsonb) FROM hr_candidates c LEFT JOIN hr_job_openings j ON j.id=c.job_id WHERE auth.uid() IS NOT NULL AND lower(c.email)=candidate_email() AND c.email<>'' $$;
CREATE OR REPLACE FUNCTION public.interviewer_my_rounds() RETURNS TABLE(candidate_id uuid,candidate_name text,experience_years numeric,id uuid,internal_feedback text,job_title text,location_or_link text,mode text,qualification text,recommendation text,round_type text,scheduled_at timestamptz,score numeric,skills text,status text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT c.id,c.full_name,c.experience_years,r.id,r.internal_feedback,j.title,r.location_or_link,r.mode,c.qualification,r.recommendation,r.round_type,r.scheduled_at,r.score,c.skills,r.status FROM hr_interview_rounds r JOIN hr_candidates c ON c.id=r.candidate_id LEFT JOIN hr_job_openings j ON j.id=c.job_id WHERE auth.uid() IS NOT NULL AND (r.interviewer_user_id=auth.uid() OR hr_staff()) $$;
CREATE OR REPLACE FUNCTION public.institute_candidates(_institute uuid DEFAULT NULL) RETURNS TABLE(absent_days bigint,applied_on timestamptz,days_tracked integer,employment_status text,full_name text,id uuid,institute_id uuid,institute_name text,job_title text,joining_date date,leave_days bigint,present_days bigint,stage text,tracking_until date) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT a.absent,c.created_at,CASE WHEN c.stage='hired' AND c.joining_date IS NOT NULL THEN greatest(0,least(current_date,(c.joining_date+interval '3 months')::date)-c.joining_date+1) ELSE 0 END,e.status,c.full_name,c.id,i.id,i.name,j.title,c.joining_date,a.leave,a.present,c.stage,(c.joining_date+interval '3 months')::date
FROM hr_candidates c JOIN hr_institutes i ON i.id=c.institute_id LEFT JOIN hr_job_openings j ON j.id=c.job_id LEFT JOIN volunteers v ON v.user_id=c.employee_user_id LEFT JOIN employees e ON e.id=v.employee_id
LEFT JOIN LATERAL (SELECT count(*) FILTER(WHERE ar.status='absent') absent,count(*) FILTER(WHERE ar.status='leave') leave,count(*) FILTER(WHERE ar.status IN ('present','wfh','half_day')) present FROM attendance_records ar WHERE c.stage='hired' AND ar.user_id=c.employee_user_id AND ar.day>=c.joining_date AND ar.day< c.joining_date+interval '3 months' AND ar.day<=current_date) a ON true
WHERE auth.uid() IS NOT NULL AND ((hr_staff() AND (_institute IS NULL OR c.institute_id=_institute)) OR (c.institute_id=institute_of_caller() AND (_institute IS NULL OR _institute=c.institute_id))) $$;
CREATE OR REPLACE FUNCTION public.hr_add_institute_member(_email text,_institute uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE u uuid; BEGIN
IF NOT hr_staff() THEN RAISE EXCEPTION 'HR access required'; END IF;
IF NOT EXISTS(SELECT 1 FROM hr_institutes WHERE id=_institute AND active) THEN RAISE EXCEPTION 'Institute inactive or missing'; END IF;
SELECT id INTO u FROM auth.users WHERE lower(email)=lower(trim(_email)); IF u IS NULL THEN RAISE EXCEPTION 'User must register first'; END IF;
INSERT INTO hr_institute_members(institute_id,user_id,added_by) VALUES(_institute,u,auth.uid()) ON CONFLICT(institute_id,user_id) DO UPDATE SET active=true,added_by=auth.uid(); RETURN u; END $$;
CREATE OR REPLACE FUNCTION public.hr_onboarding_start(_employee_id text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n integer; BEGIN
IF NOT hr_staff() THEN RAISE EXCEPTION 'HR access required'; END IF;
IF NOT EXISTS(SELECT 1 FROM employees WHERE employee_id=_employee_id) THEN RAISE EXCEPTION 'Employee not found'; END IF;
INSERT INTO hr_onboarding_tasks(employee_id,task,sort) SELECT _employee_id,t,ord::integer FROM unnest(ARRAY['Document verification','KYC verification','Bank details','Employee profile','Appointment letter','ID card','HRMS account','Initial targets']) WITH ORDINALITY AS x(t,ord) ON CONFLICT(employee_id,task) DO NOTHING; GET DIAGNOSTICS n=ROW_COUNT; RETURN n; END $$;
CREATE OR REPLACE FUNCTION public.hr_bulk_candidates(_institute uuid,_job uuid,_rows jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE inst uuid; r jsonb; n integer:=0; idx integer:=0; skipped jsonb:='[]'; reason text; exp numeric; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
inst:=CASE WHEN hr_staff() THEN _institute ELSE institute_of_caller() END;
IF NOT hr_staff() AND (inst IS NULL OR (_institute IS NOT NULL AND _institute<>inst)) THEN RAISE EXCEPTION 'Institute access required'; END IF;
IF inst IS NOT NULL AND NOT EXISTS(SELECT 1 FROM hr_institutes WHERE id=inst AND active) THEN RAISE EXCEPTION 'Inactive institute'; END IF;
IF _job IS NOT NULL AND NOT EXISTS(SELECT 1 FROM careers_open_jobs() WHERE id=_job) THEN RAISE EXCEPTION 'Choose an open job'; END IF;
IF jsonb_typeof(_rows)<>'array' OR jsonb_array_length(_rows) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Provide 1 to 500 rows'; END IF;
FOR r IN SELECT value FROM jsonb_array_elements(_rows) LOOP
idx:=idx+1; reason:=NULL; exp:=NULL;
IF length(trim(coalesce(r->>'full_name','')))<2 THEN reason:='Name required';
ELSIF coalesce(r->>'email','')='' AND length(regexp_replace(coalesce(r->>'phone',''),'\D','','g'))<10 THEN reason:='Email or mobile required';
ELSIF coalesce(r->>'email','')<>'' AND (r->>'email') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN reason:='Invalid email';
ELSIF coalesce(r->>'phone','')<>'' AND length(regexp_replace(r->>'phone','\D','','g'))<10 THEN reason:='Invalid mobile';
ELSIF coalesce(r->>'experience_years','')<>'' AND (r->>'experience_years') !~ '^\d+(\.\d+)?$' THEN reason:='Invalid experience'; END IF;
IF reason IS NULL THEN
PERFORM pg_advisory_xact_lock(hashtextextended(coalesce(_job::text,'general'),0));
IF EXISTS(SELECT 1 FROM hr_candidates c WHERE c.job_id IS NOT DISTINCT FROM _job AND ((coalesce(r->>'email','')<>'' AND lower(c.email)=lower(trim(r->>'email'))) OR (coalesce(r->>'phone','')<>'' AND regexp_replace(c.phone,'\D','','g')=regexp_replace(r->>'phone','\D','','g')))) THEN reason:='Duplicate application'; END IF; END IF;
IF reason IS NOT NULL THEN skipped:=skipped||jsonb_build_array(jsonb_build_object('row',idx,'name',r->>'full_name','reason',reason)); CONTINUE; END IF;
exp:=nullif(r->>'experience_years','')::numeric;
INSERT INTO hr_candidates(full_name,email,phone,city,experience_years,notes,job_id,institute_id,source,created_by) VALUES(trim(r->>'full_name'),lower(trim(coalesce(r->>'email',''))),coalesce(r->>'phone',''),coalesce(r->>'city',''),exp,coalesce(r->>'notes',''),_job,inst,CASE WHEN inst IS NOT NULL THEN 'campus' ELSE 'other' END,auth.uid()); n:=n+1;
END LOOP; RETURN jsonb_build_object('added',n,'skipped',skipped); END $$;
CREATE OR REPLACE FUNCTION public.g1_job_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NEW.status NOT IN ('draft','pending_approval','open','on_hold','closed','cancelled','archived') OR NEW.openings<1 OR NEW.visibility NOT IN ('public','internal','private') OR NEW.work_mode NOT IN ('office','hybrid','remote','field') OR NEW.employment_type NOT IN ('full_time','part_time','intern','contract') THEN RAISE EXCEPTION 'Invalid job configuration'; END IF;
IF NEW.apply_start>NEW.apply_end THEN RAISE EXCEPTION 'Invalid application dates'; END IF;
IF TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
 IF NEW.status='open' AND NOT hr_is_manager() THEN RAISE EXCEPTION 'Only HR managers can publish'; END IF;
 IF NEW.status IN ('cancelled','archived') AND NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF TG_OP='UPDATE' AND OLD.status='archived' AND NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF NEW.status='open' THEN NEW.approved_at:=now(); NEW.approved_by:=auth.uid(); END IF;
END IF;
NEW.updated_at:=now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS g1_job_guard ON public.hr_job_openings;
DROP TRIGGER IF EXISTS g1_job_guard ON public.hr_job_openings;
CREATE TRIGGER g1_job_guard BEFORE INSERT OR UPDATE ON public.hr_job_openings FOR EACH ROW EXECUTE FUNCTION public.g1_job_guard();
CREATE OR REPLACE FUNCTION public.g1_candidate_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NEW.stage NOT IN ('applied','screening','shortlisted','assessment','interview','selected','offered','hired','rejected','withdrawn','offer_declined','on_hold','waitlisted') OR NEW.offer_status NOT IN ('none','released','pending','accepted','declined','not_sent','sent') OR NEW.experience_years<0 OR NEW.rating NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Invalid candidate values'; END IF;
NEW.updated_at:=now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS g1_candidate_guard ON public.hr_candidates;
DROP TRIGGER IF EXISTS g1_candidate_guard ON public.hr_candidates;
CREATE TRIGGER g1_candidate_guard BEFORE INSERT OR UPDATE ON public.hr_candidates FOR EACH ROW EXECUTE FUNCTION public.g1_candidate_guard();
CREATE OR REPLACE FUNCTION public.g1_candidate_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF TG_OP='INSERT' THEN INSERT INTO hr_candidate_events(candidate_id,to_stage,actor_id,actor_name) VALUES(NEW.id,NEW.stage,auth.uid(),coalesce(candidate_email(),'Applicant'));
ELSIF NEW.stage IS DISTINCT FROM OLD.stage THEN INSERT INTO hr_candidate_events(candidate_id,from_stage,to_stage,actor_id,actor_name) VALUES(NEW.id,OLD.stage,NEW.stage,auth.uid(),coalesce(candidate_email(),'Staff')); END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS g1_candidate_history ON public.hr_candidates;
DROP TRIGGER IF EXISTS g1_candidate_history ON public.hr_candidates;
CREATE TRIGGER g1_candidate_history AFTER INSERT OR UPDATE ON public.hr_candidates FOR EACH ROW EXECUTE FUNCTION public.g1_candidate_history();
DROP POLICY IF EXISTS g1_letter_self ON public.hr_letters;
DROP POLICY IF EXISTS g1_letter_self ON public.hr_letters;
CREATE POLICY g1_letter_self ON public.hr_letters FOR SELECT TO authenticated USING(user_id=auth.uid());
DROP POLICY IF EXISTS g1_member_self ON public.hr_institute_members;
DROP POLICY IF EXISTS g1_member_self ON public.hr_institute_members;
CREATE POLICY g1_member_self ON public.hr_institute_members FOR SELECT TO authenticated USING(user_id=auth.uid());
DROP POLICY IF EXISTS g1_interviewer_read ON public.hr_interview_rounds;
DROP POLICY IF EXISTS g1_interviewer_read ON public.hr_interview_rounds;
CREATE POLICY g1_interviewer_read ON public.hr_interview_rounds FOR SELECT TO authenticated USING(interviewer_user_id=auth.uid());
DROP POLICY IF EXISTS g1_interviewer_update ON public.hr_interview_rounds;
DROP POLICY IF EXISTS g1_interviewer_update ON public.hr_interview_rounds;
CREATE POLICY g1_interviewer_update ON public.hr_interview_rounds FOR UPDATE TO authenticated USING(interviewer_user_id=auth.uid()) WITH CHECK(interviewer_user_id=auth.uid());
DROP POLICY IF EXISTS g1_resume_insert ON storage.objects;
DROP POLICY IF EXISTS g1_resume_insert ON storage.objects;
CREATE POLICY g1_resume_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='hr-resumes' AND (public.hr_staff() OR (name LIKE 'candidate/'||auth.uid()::text||'/%' AND name NOT LIKE '%..%')));
DROP POLICY IF EXISTS g1_resume_read ON storage.objects;
DROP POLICY IF EXISTS g1_resume_read ON storage.objects;
CREATE POLICY g1_resume_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='hr-resumes' AND (public.hr_staff() OR name LIKE 'candidate/'||auth.uid()::text||'/%'));
DROP POLICY IF EXISTS g1_resume_delete ON storage.objects;
DROP POLICY IF EXISTS g1_resume_delete ON storage.objects;
CREATE POLICY g1_resume_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='hr-resumes' AND (public.hr_staff() OR name LIKE 'candidate/'||auth.uid()::text||'/%'));
DO $$ DECLARE f record; BEGIN
FOR f IN SELECT p.oid::regprocedure sig,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname=ANY(ARRAY['careers_open_jobs','careers_apply','careers_status','careers_referral_click','careers_referral_lookup','candidate_email','candidate_owns','candidate_my_applications','candidate_respond_offer','candidate_send_message','candidate_set_resume','candidate_submit_assessment','candidate_withdraw','institute_of_caller','institute_candidates','interviewer_my_rounds','hr_bulk_candidates','hr_add_institute_member','hr_onboarding_start','hr_stage_text','hr_notify_staff','g1_candidate_history','g1_candidate_guard','g1_job_guard']) LOOP
EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon',f.sig);
EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated,service_role',f.sig);
IF f.proname LIKE 'careers_%' OR f.proname='hr_stage_text' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon',f.sig); END IF;
END LOOP; END $$;
CREATE OR REPLACE FUNCTION public.g1_round_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NOT hr_staff() AND (OLD.interviewer_user_id IS DISTINCT FROM auth.uid() OR (to_jsonb(NEW)-ARRAY['internal_feedback','candidate_feedback','score','recommendation','status','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['internal_feedback','candidate_feedback','score','recommendation','status','updated_at'])) THEN RAISE EXCEPTION 'Only assigned round feedback may be edited'; END IF;
NEW.updated_at:=now(); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.g1_round_guard() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.g1_round_guard() TO authenticated,service_role;
DROP TRIGGER IF EXISTS g1_round_guard ON public.hr_interview_rounds;
DROP TRIGGER IF EXISTS g1_round_guard ON public.hr_interview_rounds;
CREATE TRIGGER g1_round_guard BEFORE UPDATE ON public.hr_interview_rounds FOR EACH ROW EXECUTE FUNCTION public.g1_round_guard();
-- ===== 0011_ventures_funding_manpower =====
CREATE TABLE IF NOT EXISTS public.venture_clients (
  assigned_bde uuid,
  category text NOT NULL DEFAULT 'idea',
  cin text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL DEFAULT '',
  founder_name text NOT NULL DEFAULT '',
  gst text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  internal_notes text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'startup',
  monthly_revenue numeric,
  name text NOT NULL,
  owner_user_id uuid,
  phone text NOT NULL DEFAULT '',
  pitch text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  team_size integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  website text NOT NULL DEFAULT ''
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.venture_clients TO authenticated,service_role;
ALTER TABLE public.venture_clients ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.venture_services (
  active boolean NOT NULL DEFAULT true,
  description text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  pillar text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  price_note text NOT NULL DEFAULT ''
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.venture_services TO authenticated,service_role;
ALTER TABLE public.venture_services ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.venture_orders (
  amount numeric,
  assigned_to uuid,
  client_id uuid NOT NULL,
  client_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  progress_note text NOT NULL DEFAULT '',
  service_id uuid,
  status text NOT NULL DEFAULT 'requested',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.venture_orders TO authenticated,service_role;
ALTER TABLE public.venture_orders ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.venture_documents (
  application_id uuid,
  client_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  doc_type text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  file_path text,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by uuid,
  review_note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requested',
  updated_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.venture_documents TO authenticated,service_role;
ALTER TABLE public.venture_documents ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.venture_tickets (
  body text NOT NULL DEFAULT '',
  client_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reply text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  subject text NOT NULL,
  topic text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.venture_tickets TO authenticated,service_role;
ALTER TABLE public.venture_tickets ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.venture_jurors (
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL DEFAULT '',
  user_id uuid NOT NULL PRIMARY KEY
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.venture_jurors TO authenticated,service_role;
ALTER TABLE public.venture_jurors ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.jury_evaluations (
  application_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  decision text NOT NULL,
  feasibility numeric NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  innovation numeric NOT NULL,
  juror_id uuid NOT NULL DEFAULT auth.uid(),
  market numeric NOT NULL,
  public_remarks text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  round integer NOT NULL,
  team numeric NOT NULL
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.jury_evaluations TO authenticated,service_role;
ALTER TABLE public.jury_evaluations ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.funding_stages (
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jury_round integer,
  name text NOT NULL,
  position integer NOT NULL,
  required_docs text NOT NULL DEFAULT ''
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.funding_stages TO authenticated,service_role;
ALTER TABLE public.funding_stages ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.funding_applications (
  category text NOT NULL DEFAULT 'idea',
  client_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  funding_ask numeric,
  funding_type text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  internal_notes text NOT NULL DEFAULT '',
  next_action text NOT NULL DEFAULT '',
  stage_id uuid,
  status text NOT NULL DEFAULT 'active',
  updated_at timestamptz NOT NULL DEFAULT now(),
  use_of_funds text NOT NULL DEFAULT ''
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.funding_applications TO authenticated,service_role;
ALTER TABLE public.funding_applications ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.funding_stage_history (
  application_id uuid NOT NULL,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  from_stage uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note text NOT NULL DEFAULT '',
  status text,
  to_stage uuid
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.funding_stage_history TO authenticated,service_role;
ALTER TABLE public.funding_stage_history ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.manpower_requirements (
  budget text NOT NULL DEFAULT '',
  client_id uuid NOT NULL,
  contract_type text NOT NULL DEFAULT 'contract',
  created_at timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL DEFAULT '',
  experience text NOT NULL DEFAULT '',
  filled integer NOT NULL DEFAULT 0,
  headcount integer NOT NULL DEFAULT 0,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location text NOT NULL DEFAULT '',
  needed_by date,
  priority text NOT NULL DEFAULT 'normal',
  role_title text NOT NULL,
  shift text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  update_note text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.manpower_requirements TO authenticated,service_role;
ALTER TABLE public.manpower_requirements ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.manpower_candidates (
  client_feedback text NOT NULL DEFAULT '',
  client_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  email text NOT NULL DEFAULT '',
  expected_salary numeric,
  experience_years numeric,
  full_name text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  internal_note text NOT NULL DEFAULT '',
  interview_at timestamptz,
  location text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  requirement_id uuid NOT NULL,
  resume_path text,
  skills text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT 'sourced',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.manpower_candidates TO authenticated,service_role;
ALTER TABLE public.manpower_candidates ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.manpower_deployments (
  billing_rate numeric NOT NULL DEFAULT 0,
  candidate_id uuid,
  client_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  designation text NOT NULL DEFAULT '',
  end_date date,
  esic_applicable boolean NOT NULL DEFAULT true,
  exit_reason text NOT NULL DEFAULT '',
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monthly_salary numeric NOT NULL DEFAULT 0,
  ot_rate numeric NOT NULL DEFAULT 0,
  pf_applicable boolean NOT NULL DEFAULT true,
  replaced_by uuid,
  replacement_reason text NOT NULL DEFAULT '',
  requirement_id uuid,
  start_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  updated_at timestamptz NOT NULL DEFAULT now(),
  worker_code text NOT NULL DEFAULT '',
  worker_name text NOT NULL,
  worker_phone text NOT NULL DEFAULT ''
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.manpower_deployments TO authenticated,service_role;
ALTER TABLE public.manpower_deployments ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.manpower_events (
  actor_id uuid,
  client_id uuid NOT NULL,
  estimated boolean NOT NULL DEFAULT true,
  event text NOT NULL,
  happened_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL,
  item_table text NOT NULL,
  requirement_id uuid
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.manpower_events TO authenticated,service_role;
ALTER TABLE public.manpower_events ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.manpower_timesheets (
  approved_at timestamptz,
  client_id uuid NOT NULL,
  client_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  deployment_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month date NOT NULL,
  ot_hours numeric NOT NULL DEFAULT 0,
  present_days numeric NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  updated_at timestamptz NOT NULL DEFAULT now(),
  working_days numeric NOT NULL
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.manpower_timesheets TO authenticated,service_role;
ALTER TABLE public.manpower_timesheets ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.manpower_invoices (
  cancel_reason text NOT NULL DEFAULT '',
  client_id uuid NOT NULL,
  client_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  gst numeric NOT NULL,
  gst_percent numeric NOT NULL DEFAULT 18,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_no text NOT NULL,
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  month date NOT NULL,
  paid_at timestamptz,
  paid_by uuid,
  paid_reference text NOT NULL DEFAULT '',
  service_fee numeric NOT NULL,
  service_fee_percent numeric NOT NULL,
  status text NOT NULL DEFAULT 'issued',
  subtotal numeric NOT NULL,
  total numeric NOT NULL
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.manpower_invoices TO authenticated,service_role;
ALTER TABLE public.manpower_invoices ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.research_milestones (
  created_at timestamptz NOT NULL DEFAULT now(),
  done_at timestamptz,
  due_date date,
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  request_id uuid NOT NULL,
  step text NOT NULL,
  updated_by uuid
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.research_milestones TO authenticated,service_role;
ALTER TABLE public.research_milestones ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='venture_orders_client_id_fkey' AND conrelid='public.venture_orders'::regclass) THEN ALTER TABLE public.venture_orders ADD CONSTRAINT venture_orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.venture_clients(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='venture_orders_service_id_fkey' AND conrelid='public.venture_orders'::regclass) THEN ALTER TABLE public.venture_orders ADD CONSTRAINT venture_orders_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.venture_services(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='venture_documents_application_id_fkey' AND conrelid='public.venture_documents'::regclass) THEN ALTER TABLE public.venture_documents ADD CONSTRAINT venture_documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.funding_applications(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='venture_documents_client_id_fkey' AND conrelid='public.venture_documents'::regclass) THEN ALTER TABLE public.venture_documents ADD CONSTRAINT venture_documents_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.venture_clients(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='venture_tickets_client_id_fkey' AND conrelid='public.venture_tickets'::regclass) THEN ALTER TABLE public.venture_tickets ADD CONSTRAINT venture_tickets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.venture_clients(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='jury_evaluations_application_id_fkey' AND conrelid='public.jury_evaluations'::regclass) THEN ALTER TABLE public.jury_evaluations ADD CONSTRAINT jury_evaluations_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.funding_applications(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='funding_applications_client_id_fkey' AND conrelid='public.funding_applications'::regclass) THEN ALTER TABLE public.funding_applications ADD CONSTRAINT funding_applications_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.venture_clients(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='funding_applications_stage_id_fkey' AND conrelid='public.funding_applications'::regclass) THEN ALTER TABLE public.funding_applications ADD CONSTRAINT funding_applications_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.funding_stages(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='funding_stage_history_application_id_fkey' AND conrelid='public.funding_stage_history'::regclass) THEN ALTER TABLE public.funding_stage_history ADD CONSTRAINT funding_stage_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.funding_applications(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='manpower_requirements_client_id_fkey' AND conrelid='public.manpower_requirements'::regclass) THEN ALTER TABLE public.manpower_requirements ADD CONSTRAINT manpower_requirements_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.venture_clients(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='manpower_candidates_client_id_fkey' AND conrelid='public.manpower_candidates'::regclass) THEN ALTER TABLE public.manpower_candidates ADD CONSTRAINT manpower_candidates_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.venture_clients(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='manpower_candidates_requirement_id_fkey' AND conrelid='public.manpower_candidates'::regclass) THEN ALTER TABLE public.manpower_candidates ADD CONSTRAINT manpower_candidates_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.manpower_requirements(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='manpower_deployments_candidate_id_fkey' AND conrelid='public.manpower_deployments'::regclass) THEN ALTER TABLE public.manpower_deployments ADD CONSTRAINT manpower_deployments_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.manpower_candidates(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='manpower_deployments_client_id_fkey' AND conrelid='public.manpower_deployments'::regclass) THEN ALTER TABLE public.manpower_deployments ADD CONSTRAINT manpower_deployments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.venture_clients(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='manpower_deployments_replaced_by_fkey' AND conrelid='public.manpower_deployments'::regclass) THEN ALTER TABLE public.manpower_deployments ADD CONSTRAINT manpower_deployments_replaced_by_fkey FOREIGN KEY (replaced_by) REFERENCES public.manpower_deployments(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='manpower_deployments_requirement_id_fkey' AND conrelid='public.manpower_deployments'::regclass) THEN ALTER TABLE public.manpower_deployments ADD CONSTRAINT manpower_deployments_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.manpower_requirements(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='manpower_timesheets_client_id_fkey' AND conrelid='public.manpower_timesheets'::regclass) THEN ALTER TABLE public.manpower_timesheets ADD CONSTRAINT manpower_timesheets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.venture_clients(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='manpower_timesheets_deployment_id_fkey' AND conrelid='public.manpower_timesheets'::regclass) THEN ALTER TABLE public.manpower_timesheets ADD CONSTRAINT manpower_timesheets_deployment_id_fkey FOREIGN KEY (deployment_id) REFERENCES public.manpower_deployments(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='manpower_invoices_client_id_fkey' AND conrelid='public.manpower_invoices'::regclass) THEN ALTER TABLE public.manpower_invoices ADD CONSTRAINT manpower_invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.venture_clients(id); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='research_milestones_request_id_fkey' AND conrelid='public.research_milestones'::regclass) THEN ALTER TABLE public.research_milestones ADD CONSTRAINT research_milestones_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.research_requests(id); END IF; END $$;
CREATE OR REPLACE FUNCTION public.venture_is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND has_role(auth.uid(),'admin') $$;
CREATE OR REPLACE FUNCTION public.venture_is_desk() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND (venture_is_admin() OR EXISTS(SELECT 1 FROM crm_memberships WHERE user_id=auth.uid() AND active AND role IN ('BDE','BDM','sales'))) $$;
CREATE OR REPLACE FUNCTION public.venture_is_juror() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM venture_jurors WHERE user_id=auth.uid() AND active) $$;
CREATE OR REPLACE FUNCTION public.venture_is_owner(_client uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM venture_clients WHERE id=_client AND owner_user_id=auth.uid()) $$;
CREATE OR REPLACE FUNCTION public.venture_can_work(_client uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND (venture_is_admin() OR (venture_is_desk() AND EXISTS(SELECT 1 FROM venture_clients WHERE id=_client AND crm_can_access(assigned_bde)))) $$;
CREATE OR REPLACE FUNCTION public.venture_can_see_ops(_client uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT venture_is_owner(_client) OR venture_can_work(_client) $$;
CREATE OR REPLACE FUNCTION public.venture_can_see(_client uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT venture_can_see_ops(_client) OR venture_is_juror() $$;
CREATE OR REPLACE FUNCTION public.venture_folder_client(_name text) RETURNS uuid LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$ BEGIN RETURN split_part(_name,'/',1)::uuid; EXCEPTION WHEN invalid_text_representation THEN RETURN NULL; END $$;
CREATE OR REPLACE FUNCTION public.manpower_in_rpc() RETURNS boolean LANGUAGE sql STABLE SET search_path=public AS $$ SELECT current_setting('g3.manpower_rpc',true)='on' $$;
CREATE OR REPLACE FUNCTION public.funding_move(_app uuid,_stage uuid,_status text,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a funding_applications; BEGIN
 IF NOT venture_is_admin() THEN RAISE EXCEPTION 'Admin required'; END IF;
 SELECT * INTO STRICT a FROM funding_applications WHERE id=_app FOR UPDATE;
 UPDATE funding_applications SET stage_id=_stage,status=_status WHERE id=_app;
 UPDATE funding_stage_history SET note=_note WHERE id=(SELECT id FROM funding_stage_history WHERE application_id=_app ORDER BY created_at DESC LIMIT 1);
END $$;
CREATE OR REPLACE FUNCTION public.g3_funding_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE lim integer; BEGIN
 IF TG_OP='UPDATE' AND (NEW.stage_id IS DISTINCT FROM OLD.stage_id OR NEW.status IS DISTINCT FROM OLD.status) AND auth.uid() IS NOT NULL AND NOT venture_is_admin() THEN RAISE EXCEPTION 'Only Admin moves funding files'; END IF;
 IF TG_OP='INSERT' THEN
 IF NOT venture_is_admin() AND auth.uid() IS NOT NULL AND (NEW.status<>'active' OR NEW.stage_id IS NOT NULL OR NEW.internal_notes<>'' OR NEW.next_action<>'') THEN RAISE EXCEPTION 'New files must start at screening'; END IF;
 IF NEW.stage_id IS NULL THEN SELECT id INTO NEW.stage_id FROM funding_stages WHERE active ORDER BY position LIMIT 1; END IF;
 NEW.created_by=auth.uid();
 END IF;
 SELECT position INTO lim FROM funding_stages WHERE id=NEW.stage_id;
 IF EXISTS(SELECT 1 FROM funding_stages s WHERE s.jury_round IS NOT NULL AND (NEW.status='funded' OR s.position<coalesce(lim,0)) AND NOT EXISTS(SELECT 1 FROM jury_evaluations e WHERE e.application_id=NEW.id AND e.round=s.jury_round AND e.decision='cleared')) THEN RAISE EXCEPTION 'Mandatory jury round must be cleared first'; END IF;
 NEW.updated_at=now(); RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS g3_funding_guard ON public.funding_applications;
DROP TRIGGER IF EXISTS g3_funding_guard ON public.funding_applications;
CREATE TRIGGER g3_funding_guard BEFORE INSERT OR UPDATE ON public.funding_applications FOR EACH ROW EXECUTE FUNCTION public.g3_funding_guard();
CREATE OR REPLACE FUNCTION public.g3_funding_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF TG_OP='INSERT' THEN INSERT INTO funding_stage_history(application_id,to_stage,status,changed_by) VALUES(NEW.id,NEW.stage_id,NEW.status,auth.uid());
 ELSIF NEW.stage_id IS DISTINCT FROM OLD.stage_id OR NEW.status IS DISTINCT FROM OLD.status THEN INSERT INTO funding_stage_history(application_id,from_stage,to_stage,status,changed_by) VALUES(NEW.id,OLD.stage_id,NEW.stage_id,NEW.status,auth.uid()); END IF;
 RETURN NEW; END $$;
DROP TRIGGER IF EXISTS g3_funding_history ON public.funding_applications;
DROP TRIGGER IF EXISTS g3_funding_history ON public.funding_applications;
CREATE TRIGGER g3_funding_history AFTER INSERT OR UPDATE ON public.funding_applications FOR EACH ROW EXECUTE FUNCTION public.g3_funding_history();
CREATE OR REPLACE FUNCTION public.g3_stage_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF OLD.jury_round IS NOT NULL THEN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Mandatory jury stages cannot be removed'; END IF;
 IF NEW.jury_round IS DISTINCT FROM OLD.jury_round OR NOT NEW.active OR NEW.position<>OLD.position THEN RAISE EXCEPTION 'Mandatory jury stages cannot be disabled or reordered'; END IF;
 END IF; IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS g3_stage_guard ON public.funding_stages;
DROP TRIGGER IF EXISTS g3_stage_guard ON public.funding_stages;
CREATE TRIGGER g3_stage_guard BEFORE UPDATE OR DELETE ON public.funding_stages FOR EACH ROW EXECUTE FUNCTION public.g3_stage_guard();
INSERT INTO public.funding_stages(name,position,description,required_docs,jury_round)
SELECT v.* FROM (VALUES
('Application & screening',10,'File received and checked for eligibility.','Pitch deck, founder ID proof',NULL::integer),
('Document review',20,'Documents for the category are reviewed.','Category documents',NULL),
('Jury Scanning Round 1',30,'Mandatory first jury round.','',1),
('Jury Scanning Round 2',40,'Mandatory second jury round.','',2),
('Due diligence',50,'Financial and legal checks.','Financials, company documents',NULL),
('Investor connect',60,'Introductions and pitch meetings with investors.','',NULL)) v(name,position,description,required_docs,jury_round)
WHERE NOT EXISTS(SELECT 1 FROM funding_stages s WHERE s.name=v.name OR (v.jury_round IS NOT NULL AND s.jury_round=v.jury_round));
CREATE OR REPLACE FUNCTION public.funding_public_feedback(_app uuid) RETURNS TABLE(created_at timestamptz,decision text,public_remarks text,round integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT e.created_at,e.decision,e.public_remarks,e.round FROM jury_evaluations e JOIN funding_applications a ON a.id=e.application_id WHERE a.id=_app AND venture_can_see(a.client_id) $$;
CREATE OR REPLACE FUNCTION public.manpower_client_candidates() RETURNS TABLE(client_feedback text,experience_years numeric,full_name text,id uuid,interview_at timestamptz,location text,requirement_id uuid,role_title text,skills text,stage text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT c.client_feedback,c.experience_years,c.full_name,c.id,c.interview_at,c.location,c.requirement_id,r.role_title,c.skills,c.stage FROM manpower_candidates c JOIN manpower_requirements r ON r.id=c.requirement_id WHERE venture_is_owner(c.client_id) AND c.stage NOT IN ('sourced','screened') $$;
CREATE OR REPLACE FUNCTION public.manpower_client_deployments() RETURNS TABLE(billing_rate numeric,designation text,end_date date,id uuid,replacement_reason text,role_title text,start_date date,status text,worker_code text,worker_name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT d.billing_rate,d.designation,d.end_date,d.id,d.replacement_reason,r.role_title,d.start_date,d.status,d.worker_code,d.worker_name FROM manpower_deployments d LEFT JOIN manpower_requirements r ON r.id=d.requirement_id WHERE venture_is_owner(d.client_id) $$;
CREATE OR REPLACE FUNCTION public.manpower_client_decide(_decision text,_id uuid,_feedback text DEFAULT '',_interview_at timestamptz DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF _decision NOT IN ('selected','rejected','client_interview') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 UPDATE manpower_candidates SET stage=_decision,client_feedback=_feedback,interview_at=_interview_at WHERE id=_id AND venture_is_owner(client_id) AND stage IN ('shared','client_interview');
 IF NOT FOUND THEN RAISE EXCEPTION 'Candidate not available'; END IF; END $$;
CREATE OR REPLACE FUNCTION public.manpower_client_timesheet(_approve boolean,_id uuid,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 UPDATE manpower_timesheets SET status=CASE WHEN _approve THEN 'client_approved' ELSE 'disputed' END,client_note=_note,approved_at=CASE WHEN _approve THEN now() END WHERE id=_id AND venture_is_owner(client_id) AND status='submitted';
 IF NOT FOUND THEN RAISE EXCEPTION 'Timesheet not available'; END IF; END $$;
CREATE OR REPLACE FUNCTION public.manpower_request_replacement(_id uuid,_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF trim(_reason)='' THEN RAISE EXCEPTION 'Reason required'; END IF;
 UPDATE manpower_deployments SET status='replacement_requested',replacement_reason=_reason WHERE id=_id AND (venture_is_owner(client_id) OR venture_can_work(client_id)) AND status='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'Deployment not available'; END IF; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS g3_timesheet_month ON public.manpower_timesheets(deployment_id,month);
CREATE UNIQUE INDEX IF NOT EXISTS g3_jury_vote ON public.jury_evaluations(application_id,round,juror_id);
CREATE OR REPLACE FUNCTION public.manpower_generate_invoice(_client uuid,_fee_percent numeric,_month date) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sub numeric; fee numeric; tax numeric; ls jsonb; iid uuid; ino text; BEGIN
 IF NOT venture_can_work(_client) THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF _fee_percent<0 OR _fee_percent>100 THEN RAISE EXCEPTION 'Invalid fee'; END IF;
 PERFORM 1 FROM venture_clients WHERE id=_client FOR UPDATE;
 PERFORM 1 FROM manpower_timesheets WHERE client_id=_client AND month=_month AND status='client_approved' FOR UPDATE;
 SELECT sum(round(d.billing_rate*least(t.present_days,t.working_days)/t.working_days+t.ot_hours*d.ot_rate,2)), jsonb_agg(jsonb_build_object('timesheet_id',t.id,'deployment_id',d.id,'worker_name',d.worker_name,'designation',d.designation,'worker_code',d.worker_code,'present_days',t.present_days,'working_days',t.working_days,'ot_hours',t.ot_hours,'billing_rate',d.billing_rate,'amount',round(d.billing_rate*least(t.present_days,t.working_days)/t.working_days+t.ot_hours*d.ot_rate,2))) INTO sub,ls FROM manpower_timesheets t JOIN manpower_deployments d ON d.id=t.deployment_id WHERE t.client_id=_client AND t.month=_month AND t.status='client_approved';
 IF sub IS NULL THEN RAISE EXCEPTION 'No approved attendance to invoice'; END IF;
 fee=round(sub*_fee_percent/100,2); tax=round((sub+fee)*0.18,2); ino='MP-'||to_char(now(),'YYYYMM')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
 INSERT INTO manpower_invoices(client_id,client_name,month,invoice_no,lines,subtotal,service_fee_percent,service_fee,gst_percent,gst,total,created_by) SELECT _client,name,_month,ino,ls,sub,_fee_percent,fee,18,tax,sub+fee+tax,auth.uid() FROM venture_clients WHERE id=_client RETURNING id INTO iid;
 UPDATE manpower_timesheets SET status='invoiced' WHERE client_id=_client AND month=_month AND status='client_approved'; RETURN ino;
END $$;
CREATE OR REPLACE FUNCTION public.manpower_invoice_action(_action text,_id uuid,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE i manpower_invoices; BEGIN
 SELECT * INTO STRICT i FROM manpower_invoices WHERE id=_id FOR UPDATE;
 IF i.status<>'issued' THEN RAISE EXCEPTION 'Invoice already settled'; END IF;
 IF _action='paid' THEN
 IF NOT (public._work_department('accounts') OR public._work_department('finance')) THEN RAISE EXCEPTION 'Finance access required'; END IF;
 UPDATE manpower_invoices SET status='paid',paid_at=now(),paid_by=auth.uid(),paid_reference=_note WHERE id=_id;
 ELSIF _action='cancel' THEN
 IF NOT venture_can_work(i.client_id) THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF trim(_note)='' THEN RAISE EXCEPTION 'Cancellation reason required'; END IF;
 UPDATE manpower_invoices SET status='cancelled',cancel_reason=_note WHERE id=_id;
 UPDATE manpower_timesheets SET status='client_approved' WHERE id IN(SELECT (x->>'timesheet_id')::uuid FROM jsonb_array_elements(i.lines) x) AND status='invoiced';
 ELSE RAISE EXCEPTION 'Invalid action'; END IF; END $$;

DROP POLICY IF EXISTS g3_read ON public.venture_services;
DROP POLICY IF EXISTS g3_read ON public.venture_services;
CREATE POLICY g3_read ON public.venture_services FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL) ;

DROP POLICY IF EXISTS g3_manage ON public.venture_services;
DROP POLICY IF EXISTS g3_manage ON public.venture_services;
CREATE POLICY g3_manage ON public.venture_services FOR ALL TO authenticated USING (venture_is_admin()) WITH CHECK (venture_is_admin());

DROP POLICY IF EXISTS g3_read ON public.funding_stages;
DROP POLICY IF EXISTS g3_read ON public.funding_stages;
CREATE POLICY g3_read ON public.funding_stages FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL) ;

DROP POLICY IF EXISTS g3_manage ON public.funding_stages;
DROP POLICY IF EXISTS g3_manage ON public.funding_stages;
CREATE POLICY g3_manage ON public.funding_stages FOR ALL TO authenticated USING (venture_is_admin()) WITH CHECK (venture_is_admin());

DROP POLICY IF EXISTS g3_read ON public.venture_jurors;
DROP POLICY IF EXISTS g3_read ON public.venture_jurors;
CREATE POLICY g3_read ON public.venture_jurors FOR SELECT TO authenticated USING (user_id=auth.uid() OR venture_is_admin()) ;

DROP POLICY IF EXISTS g3_manage ON public.venture_jurors;
DROP POLICY IF EXISTS g3_manage ON public.venture_jurors;
CREATE POLICY g3_manage ON public.venture_jurors FOR ALL TO authenticated USING (venture_is_admin()) WITH CHECK (venture_is_admin());

DROP POLICY IF EXISTS g3_read ON public.venture_clients;
DROP POLICY IF EXISTS g3_read ON public.venture_clients;
CREATE POLICY g3_read ON public.venture_clients FOR SELECT TO authenticated USING (venture_can_see(id)) ;

DROP POLICY IF EXISTS g3_insert ON public.venture_clients;
DROP POLICY IF EXISTS g3_insert ON public.venture_clients;
CREATE POLICY g3_insert ON public.venture_clients FOR INSERT TO authenticated WITH CHECK (venture_is_admin() OR (venture_is_desk() AND crm_can_access(assigned_bde)));

DROP POLICY IF EXISTS g3_update ON public.venture_clients;
DROP POLICY IF EXISTS g3_update ON public.venture_clients;
CREATE POLICY g3_update ON public.venture_clients FOR UPDATE TO authenticated USING (venture_can_work(id)) WITH CHECK (venture_is_admin() OR (venture_is_desk() AND crm_can_access(assigned_bde)));

DROP POLICY IF EXISTS g3_read ON public.venture_orders;
DROP POLICY IF EXISTS g3_read ON public.venture_orders;
CREATE POLICY g3_read ON public.venture_orders FOR SELECT TO authenticated USING (venture_can_see_ops(client_id)) ;

DROP POLICY IF EXISTS g3_staff ON public.venture_orders;
DROP POLICY IF EXISTS g3_staff ON public.venture_orders;
CREATE POLICY g3_staff ON public.venture_orders FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_client_insert ON public.venture_orders;
DROP POLICY IF EXISTS g3_client_insert ON public.venture_orders;
CREATE POLICY g3_client_insert ON public.venture_orders FOR INSERT TO authenticated WITH CHECK (venture_is_owner(client_id) AND status='requested' AND assigned_to IS NULL AND amount IS NULL AND progress_note='');

DROP POLICY IF EXISTS g3_read ON public.venture_documents;
DROP POLICY IF EXISTS g3_read ON public.venture_documents;
CREATE POLICY g3_read ON public.venture_documents FOR SELECT TO authenticated USING (venture_can_see(client_id)) ;

DROP POLICY IF EXISTS g3_staff ON public.venture_documents;
DROP POLICY IF EXISTS g3_staff ON public.venture_documents;
CREATE POLICY g3_staff ON public.venture_documents FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_client_insert ON public.venture_documents;
DROP POLICY IF EXISTS g3_client_insert ON public.venture_documents;
CREATE POLICY g3_client_insert ON public.venture_documents FOR INSERT TO authenticated WITH CHECK (venture_is_owner(client_id) AND status='pending_review');

DROP POLICY IF EXISTS g3_read ON public.venture_tickets;
DROP POLICY IF EXISTS g3_read ON public.venture_tickets;
CREATE POLICY g3_read ON public.venture_tickets FOR SELECT TO authenticated USING (venture_can_see_ops(client_id)) ;

DROP POLICY IF EXISTS g3_staff ON public.venture_tickets;
DROP POLICY IF EXISTS g3_staff ON public.venture_tickets;
CREATE POLICY g3_staff ON public.venture_tickets FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_client_insert ON public.venture_tickets;
DROP POLICY IF EXISTS g3_client_insert ON public.venture_tickets;
CREATE POLICY g3_client_insert ON public.venture_tickets FOR INSERT TO authenticated WITH CHECK (venture_is_owner(client_id) AND status='open' AND reply='');

DROP POLICY IF EXISTS g3_read ON public.funding_applications;
DROP POLICY IF EXISTS g3_read ON public.funding_applications;
CREATE POLICY g3_read ON public.funding_applications FOR SELECT TO authenticated USING (venture_can_see(client_id)) ;

DROP POLICY IF EXISTS g3_staff ON public.funding_applications;
DROP POLICY IF EXISTS g3_staff ON public.funding_applications;
CREATE POLICY g3_staff ON public.funding_applications FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_read ON public.manpower_requirements;
DROP POLICY IF EXISTS g3_read ON public.manpower_requirements;
CREATE POLICY g3_read ON public.manpower_requirements FOR SELECT TO authenticated USING (venture_can_see_ops(client_id)) ;

DROP POLICY IF EXISTS g3_staff ON public.manpower_requirements;
DROP POLICY IF EXISTS g3_staff ON public.manpower_requirements;
CREATE POLICY g3_staff ON public.manpower_requirements FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_client_insert ON public.manpower_requirements;
DROP POLICY IF EXISTS g3_client_insert ON public.manpower_requirements;
CREATE POLICY g3_client_insert ON public.manpower_requirements FOR INSERT TO authenticated WITH CHECK (venture_is_owner(client_id) AND status='open' AND filled=0);

DROP POLICY IF EXISTS g3_client_upload ON public.venture_documents;
DROP POLICY IF EXISTS g3_client_upload ON public.venture_documents;
CREATE POLICY g3_client_upload ON public.venture_documents FOR UPDATE TO authenticated USING (venture_is_owner(client_id) AND status IN ('requested','changes_requested')) WITH CHECK (venture_is_owner(client_id) AND status='pending_review');

DROP POLICY IF EXISTS g3_staff ON public.manpower_candidates;
DROP POLICY IF EXISTS g3_staff ON public.manpower_candidates;
CREATE POLICY g3_staff ON public.manpower_candidates FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_staff ON public.manpower_deployments;
DROP POLICY IF EXISTS g3_staff ON public.manpower_deployments;
CREATE POLICY g3_staff ON public.manpower_deployments FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_read ON public.manpower_timesheets;
DROP POLICY IF EXISTS g3_read ON public.manpower_timesheets;
CREATE POLICY g3_read ON public.manpower_timesheets FOR SELECT TO authenticated USING (venture_can_see_ops(client_id) OR _work_department('accounts') OR _work_department('finance')) ;

DROP POLICY IF EXISTS g3_read ON public.manpower_invoices;
DROP POLICY IF EXISTS g3_read ON public.manpower_invoices;
CREATE POLICY g3_read ON public.manpower_invoices FOR SELECT TO authenticated USING (venture_can_see_ops(client_id) OR _work_department('accounts') OR _work_department('finance')) ;

DROP POLICY IF EXISTS g3_insert ON public.manpower_timesheets;
DROP POLICY IF EXISTS g3_insert ON public.manpower_timesheets;
CREATE POLICY g3_insert ON public.manpower_timesheets FOR INSERT TO authenticated WITH CHECK (venture_can_work(client_id) AND status='submitted');

DROP POLICY IF EXISTS g3_update ON public.manpower_timesheets;
DROP POLICY IF EXISTS g3_update ON public.manpower_timesheets;
CREATE POLICY g3_update ON public.manpower_timesheets FOR UPDATE TO authenticated USING (venture_can_work(client_id) AND status IN ('submitted','disputed')) WITH CHECK (venture_can_work(client_id) AND status='submitted');

DROP POLICY IF EXISTS g3_read ON public.manpower_events;
DROP POLICY IF EXISTS g3_read ON public.manpower_events;
CREATE POLICY g3_read ON public.manpower_events FOR SELECT TO authenticated USING (venture_can_work(client_id)) ;

DROP POLICY IF EXISTS g3_read ON public.funding_stage_history;
DROP POLICY IF EXISTS g3_read ON public.funding_stage_history;
CREATE POLICY g3_read ON public.funding_stage_history FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM funding_applications a WHERE a.id=application_id AND venture_can_see(a.client_id))) ;

DROP POLICY IF EXISTS g3_read ON public.jury_evaluations;
DROP POLICY IF EXISTS g3_read ON public.jury_evaluations;
CREATE POLICY g3_read ON public.jury_evaluations FOR SELECT TO authenticated USING (venture_is_admin() OR venture_is_juror() OR EXISTS(SELECT 1 FROM funding_applications a WHERE a.id=application_id AND venture_can_work(a.client_id))) ;

DROP POLICY IF EXISTS g3_vote ON public.jury_evaluations;
DROP POLICY IF EXISTS g3_vote ON public.jury_evaluations;
CREATE POLICY g3_vote ON public.jury_evaluations FOR ALL TO authenticated USING (venture_is_admin() OR (venture_is_juror() AND juror_id=auth.uid())) WITH CHECK (venture_is_admin() OR (venture_is_juror() AND juror_id=auth.uid()));

DROP POLICY IF EXISTS g3_read ON public.research_milestones;
DROP POLICY IF EXISTS g3_read ON public.research_milestones;
CREATE POLICY g3_read ON public.research_milestones FOR SELECT TO authenticated USING (c_department_access('research') OR EXISTS(SELECT 1 FROM research_requests r WHERE r.id=request_id AND r.requested_by=auth.uid())) ;

DROP POLICY IF EXISTS g3_staff ON public.research_milestones;
DROP POLICY IF EXISTS g3_staff ON public.research_milestones;
CREATE POLICY g3_staff ON public.research_milestones FOR ALL TO authenticated USING (c_department_access('research')) WITH CHECK (c_department_access('research'));
CREATE OR REPLACE FUNCTION public.g3_manpower_log() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ev text; req uuid; item text; BEGIN
 NEW.updated_at=now();
 IF TG_TABLE_NAME='manpower_requirements' THEN item='requirement'; req=NEW.id; IF TG_OP='INSERT' THEN ev='requirement_posted'; ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status='closed' THEN ev='requirement_closed'; END IF;
 ELSIF TG_TABLE_NAME='manpower_candidates' THEN item='candidate';req=NEW.requirement_id; IF TG_OP='INSERT' THEN ev='candidate_'||NEW.stage; ELSIF NEW.stage IS DISTINCT FROM OLD.stage THEN ev='candidate_'||NEW.stage; END IF;
 IF NOT EXISTS(SELECT 1 FROM manpower_requirements WHERE id=NEW.requirement_id AND client_id=NEW.client_id) THEN RAISE EXCEPTION 'Candidate client mismatch'; END IF;
 ELSIF TG_TABLE_NAME='manpower_deployments' THEN item='deployment';req=NEW.requirement_id;
 IF NEW.requirement_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM manpower_requirements WHERE id=NEW.requirement_id AND client_id=NEW.client_id) THEN RAISE EXCEPTION 'Deployment client mismatch'; END IF;
 IF NEW.candidate_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM manpower_candidates WHERE id=NEW.candidate_id AND client_id=NEW.client_id) THEN RAISE EXCEPTION 'Candidate client mismatch'; END IF;
 ELSIF TG_TABLE_NAME='manpower_timesheets' THEN item='timesheet';
 SELECT requirement_id INTO req FROM manpower_deployments WHERE id=NEW.deployment_id AND client_id=NEW.client_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Timesheet client mismatch'; END IF;
 IF TG_OP='INSERT' THEN ev='timesheet_'||NEW.status; ELSIF NEW.status IS DISTINCT FROM OLD.status THEN ev='timesheet_'||CASE WHEN NEW.status='client_approved' THEN 'approved' ELSE NEW.status END; END IF;
 END IF;
 IF ev IS NOT NULL THEN INSERT INTO manpower_events(client_id,requirement_id,item_table,item_id,event,actor_id) VALUES(NEW.client_id,req,item,NEW.id,ev,auth.uid()); END IF;
 RETURN NEW; END $$;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['manpower_requirements','manpower_candidates','manpower_deployments','manpower_timesheets'] LOOP
 EXECUTE format('DROP TRIGGER IF EXISTS g3_manpower_log ON public.%I',t);
 EXECUTE format('CREATE TRIGGER g3_manpower_log BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.g3_manpower_log()',t);
END LOOP; END $$;
CREATE OR REPLACE FUNCTION public.g3_invoice_log() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF TG_OP='INSERT' THEN INSERT INTO manpower_events(client_id,item_table,item_id,event,actor_id) VALUES(NEW.client_id,'invoice',NEW.id,'invoice_issued',auth.uid());
 ELSIF OLD.status IS DISTINCT FROM NEW.status THEN INSERT INTO manpower_events(client_id,item_table,item_id,event,actor_id) VALUES(NEW.client_id,'invoice',NEW.id,'invoice_'||NEW.status,auth.uid()); END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS g3_invoice_log ON public.manpower_invoices;
DROP TRIGGER IF EXISTS g3_invoice_log ON public.manpower_invoices;
CREATE TRIGGER g3_invoice_log AFTER INSERT OR UPDATE ON public.manpower_invoices FOR EACH ROW EXECUTE FUNCTION public.g3_invoice_log();
DO $checks$ DECLARE r record; BEGIN FOR r IN SELECT * FROM (VALUES
('venture_clients','kind', $$ kind IN ('startup','business','manpower_client') $$),
('funding_applications','status', $$ status IN ('active','on_hold','rejected','funded','withdrawn') $$),
('venture_orders','status', $$ status IN ('requested','quoted','active','delivered','cancelled') $$),
('venture_documents','status', $$ status IN ('requested','pending_review','approved','changes_requested') $$),
('manpower_requirements','status', $$ status IN ('open','sourcing','interviewing','deployed','replacement','closed') $$),
('manpower_candidates','stage', $$ stage IN ('sourced','screened','shared','client_interview','selected','rejected','joined','dropped') $$),
('manpower_deployments','status', $$ status IN ('active','replacement_requested','replaced','exited') $$),
('manpower_timesheets','status', $$ status IN ('submitted','client_approved','disputed','invoiced') AND working_days>0 AND present_days>=0 AND present_days<=working_days AND ot_hours>=0 $$),
('manpower_invoices','status', $$ status IN ('issued','paid','cancelled') $$),
('jury_evaluations','scores', $$ round IN (1,2) AND decision IN ('cleared','revise','rejected') AND innovation BETWEEN 1 AND 10 AND market BETWEEN 1 AND 10 AND team BETWEEN 1 AND 10 AND feasibility BETWEEN 1 AND 10 $$)
) v(t,n,expr) LOOP
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='g3_'||r.t||'_'||r.n) THEN EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s)',r.t,'g3_'||r.t||'_'||r.n,r.expr); END IF;
END LOOP; END $checks$;
DROP POLICY IF EXISTS g3_docs_read ON storage.objects;
DROP POLICY IF EXISTS g3_docs_read ON storage.objects;
CREATE POLICY g3_docs_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='venture-docs' AND venture_can_see(venture_folder_client(name)));
DROP POLICY IF EXISTS g3_docs_insert ON storage.objects;
DROP POLICY IF EXISTS g3_docs_insert ON storage.objects;
CREATE POLICY g3_docs_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='venture-docs' AND venture_can_see_ops(venture_folder_client(name)));
DROP POLICY IF EXISTS g3_docs_update ON storage.objects;
DROP POLICY IF EXISTS g3_docs_update ON storage.objects;
CREATE POLICY g3_docs_update ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='venture-docs' AND venture_can_see_ops(venture_folder_client(name))) WITH CHECK(bucket_id='venture-docs' AND venture_can_see_ops(venture_folder_client(name)));
DROP POLICY IF EXISTS g3_docs_delete ON storage.objects;
DROP POLICY IF EXISTS g3_docs_delete ON storage.objects;
CREATE POLICY g3_docs_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='venture-docs' AND venture_can_work(venture_folder_client(name)));
DO $$ DECLARE r record; BEGIN FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname LIKE 'g3_%' OR p.proname IN ('venture_is_admin','venture_is_desk','venture_is_juror','venture_is_owner','venture_can_see','venture_can_see_ops','venture_can_work','venture_folder_client','funding_move','funding_public_feedback','manpower_in_rpc','manpower_client_candidates','manpower_client_decide','manpower_client_deployments','manpower_client_timesheet','manpower_generate_invoice','manpower_invoice_action','manpower_request_replacement')) LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',r.sig);
 IF r.sig::text NOT LIKE 'g3_%' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated,service_role',r.sig); END IF;
END LOOP; END $$;
DROP POLICY IF EXISTS g3_client_insert ON public.funding_applications;
DROP POLICY IF EXISTS g3_client_insert ON public.funding_applications;
CREATE POLICY g3_client_insert ON public.funding_applications FOR INSERT TO authenticated WITH CHECK(venture_is_owner(client_id) AND status='active' AND internal_notes='' AND next_action='');
CREATE OR REPLACE FUNCTION public.g3_document_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.application_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM funding_applications WHERE id=NEW.application_id AND client_id=NEW.client_id) THEN RAISE EXCEPTION 'Application client mismatch'; END IF;
 IF NEW.file_path IS NOT NULL AND venture_folder_client(NEW.file_path) IS DISTINCT FROM NEW.client_id THEN RAISE EXCEPTION 'Document folder must belong to client'; END IF;
 IF auth.uid() IS NOT NULL AND NOT venture_can_work(NEW.client_id) THEN
 IF NOT venture_is_owner(NEW.client_id) THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF TG_OP='UPDATE' THEN
 IF NEW.client_id<>OLD.client_id OR NEW.application_id IS DISTINCT FROM OLD.application_id OR NEW.doc_type<>OLD.doc_type OR NEW.review_note<>OLD.review_note OR NEW.requested_by IS DISTINCT FROM OLD.requested_by THEN RAISE EXCEPTION 'Only upload fields may be changed'; END IF;
 END IF;
 NEW.status='pending_review'; NEW.uploaded_by=auth.uid();
 END IF;
 NEW.updated_at=now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS g3_document_guard ON public.venture_documents;
DROP TRIGGER IF EXISTS g3_document_guard ON public.venture_documents;
CREATE TRIGGER g3_document_guard BEFORE INSERT OR UPDATE ON public.venture_documents FOR EACH ROW EXECUTE FUNCTION public.g3_document_guard();
REVOKE ALL ON FUNCTION public.g3_document_guard() FROM PUBLIC,anon;
-- ===== 0012_settings_access_drive_copy_analytics =====
DROP POLICY IF EXISTS "Signed-in users read commission rates" ON public.volunteer_form_commissions;
DROP POLICY IF EXISTS "Staff and volunteers read commission rates" ON public.volunteer_form_commissions;
CREATE POLICY "Staff and volunteers read commission rates" ON public.volunteer_form_commissions
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()) OR public.is_linked_volunteer(auth.uid(), false));

DROP POLICY IF EXISTS "Signed-in users read volunteer settings" ON public.volunteer_settings;
DROP POLICY IF EXISTS "Staff and volunteers read volunteer settings" ON public.volunteer_settings;
CREATE POLICY "Staff and volunteers read volunteer settings" ON public.volunteer_settings
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()) OR public.is_linked_volunteer(auth.uid(), false));

DROP POLICY IF EXISTS stages_read ON public.funding_stages;
DROP POLICY IF EXISTS stages_read ON public.funding_stages;
CREATE POLICY stages_read ON public.funding_stages
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()) OR public.venture_is_juror()
    OR EXISTS (SELECT 1 FROM public.venture_clients c WHERE c.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS recon_read ON public.request_routes;
DROP POLICY IF EXISTS recon_read ON public.request_routes;
CREATE POLICY recon_read ON public.request_routes
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()) OR public.is_linked_volunteer(auth.uid(), false));

DROP POLICY IF EXISTS recon_read ON public.leave_policies;
DROP POLICY IF EXISTS recon_read ON public.leave_policies;
CREATE POLICY recon_read ON public.leave_policies
  FOR SELECT TO authenticated
  USING (public.is_staff_member(auth.uid()) OR public.is_linked_volunteer(auth.uid(), false));

CREATE TABLE IF NOT EXISTS public.uploaded_files (
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

DROP POLICY IF EXISTS "Admins read uploaded file copies" ON public.uploaded_files;
CREATE POLICY "Admins read uploaded file copies" ON public.uploaded_files
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS uploaded_files_waiting_idx ON public.uploaded_files (status, uploaded_at);

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

DROP TRIGGER IF EXISTS uploaded_files_sheet_copy ON public.uploaded_files;
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

CREATE TABLE IF NOT EXISTS public.site_page_views (
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
CREATE INDEX IF NOT EXISTS site_page_views_created_idx ON public.site_page_views (created_at DESC);
CREATE TABLE IF NOT EXISTS public.site_errors (
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
CREATE INDEX IF NOT EXISTS site_errors_created_idx ON public.site_errors (created_at DESC);
GRANT SELECT ON public.site_page_views TO authenticated;
GRANT SELECT, UPDATE ON public.site_errors TO authenticated;
GRANT ALL ON public.site_page_views, public.site_errors TO service_role;
ALTER TABLE public.site_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_errors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read page views" ON public.site_page_views;
CREATE POLICY "admins read page views" ON public.site_page_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins read errors" ON public.site_errors;
CREATE POLICY "admins read errors" ON public.site_errors FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins mark errors" ON public.site_errors;
CREATE POLICY "admins mark errors" ON public.site_errors FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS finance_proofs_read ON storage.objects;
DROP POLICY IF EXISTS finance_proofs_read ON storage.objects;
CREATE POLICY finance_proofs_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'finance-proofs' AND public.fin_access());
DROP POLICY IF EXISTS finance_proofs_insert ON storage.objects;
DROP POLICY IF EXISTS finance_proofs_insert ON storage.objects;
CREATE POLICY finance_proofs_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'finance-proofs' AND public.fin_access() AND name NOT LIKE '%..%');
DROP POLICY IF EXISTS manpower_files_read ON storage.objects;
DROP POLICY IF EXISTS manpower_files_read ON storage.objects;
CREATE POLICY manpower_files_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'manpower-files' AND public.venture_can_work(public.venture_folder_client(name)));
DROP POLICY IF EXISTS manpower_files_insert ON storage.objects;
DROP POLICY IF EXISTS manpower_files_insert ON storage.objects;
CREATE POLICY manpower_files_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'manpower-files' AND public.venture_can_work(public.venture_folder_client(name)));
DROP POLICY IF EXISTS manpower_files_delete ON storage.objects;
DROP POLICY IF EXISTS manpower_files_delete ON storage.objects;
CREATE POLICY manpower_files_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'manpower-files' AND public.venture_can_work(public.venture_folder_client(name)));
-- ===== 0014_fix_critical_guard =====
CREATE OR REPLACE FUNCTION public.c_critical_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_TABLE_NAME='volunteers' THEN
  IF TG_OP='UPDATE' AND NEW.commission_percent IS NOT DISTINCT FROM OLD.commission_percent THEN RETURN NEW; END IF;
  IF TG_OP='INSERT' AND NEW.commission_percent IS NULL THEN RETURN NEW; END IF;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.c_critical_write_context WHERE tx=txid_current() AND actor=auth.uid()) THEN RAISE EXCEPTION 'Critical setting requires maker-checker approval'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.c_critical_guard() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.c_critical_guard() TO service_role;
-- ===== sales pay =====
-- RILOYD update — 17 Nov 2026
-- Collection-linked BDE/BDM attendance & daily wages, "Remove your zero" nudges, volunteer revenue
-- attribution to BDE/BDM targets, volunteer fixed incentives, ₹3,000 minimum withdrawal floor and
-- volunteer reward & recognition schemes.
--
-- Run ONCE in Supabase → SQL Editor, after every earlier file in this folder (schema + all updates).
-- Safe to run again: tables use IF NOT EXISTS, functions are replaced, policies are dropped first.
-- Nothing here deletes data.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Sales pay settings (one row, Admin edits it in CRM → Daily wage & attendance)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_pay_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  collection_attendance boolean NOT NULL DEFAULT true,          -- BDE/BDM present only on verified-collection days
  min_daily_collection numeric(12,2) NOT NULL DEFAULT 1 CHECK (min_daily_collection >= 1),
  work_start time NOT NULL DEFAULT '10:00',
  zero_cutoff time NOT NULL DEFAULT '12:00',
  nudge_every_minutes integer NOT NULL DEFAULT 20 CHECK (nudge_every_minutes BETWEEN 5 AND 120),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.crm_pay_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
GRANT SELECT, UPDATE ON public.crm_pay_settings TO authenticated;
GRANT ALL ON public.crm_pay_settings TO service_role;
ALTER TABLE public.crm_pay_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pay_settings_read ON public.crm_pay_settings;
DROP POLICY IF EXISTS pay_settings_read ON public.crm_pay_settings;
CREATE POLICY pay_settings_read ON public.crm_pay_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.hr_or_finance()
         OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = auth.uid() AND m.active));
DROP POLICY IF EXISTS pay_settings_admin_update ON public.crm_pay_settings;
DROP POLICY IF EXISTS pay_settings_admin_update ON public.crm_pay_settings;
CREATE POLICY pay_settings_admin_update ON public.crm_pay_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.crm_pay_settings_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.work_start >= NEW.zero_cutoff THEN RAISE EXCEPTION 'Work start must be before the zero cut-off time' USING ERRCODE = '22023'; END IF;
  NEW.updated_at := now(); NEW.updated_by := auth.uid();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_pay_settings_guard ON public.crm_pay_settings;
DROP TRIGGER IF EXISTS crm_pay_settings_guard ON public.crm_pay_settings;
CREATE TRIGGER crm_pay_settings_guard BEFORE UPDATE ON public.crm_pay_settings FOR EACH ROW EXECUTE FUNCTION public.crm_pay_settings_guard();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Helpers: sales role, team, verified-collection day
--    BDE = own collections. BDM = own + every active BDE reporting to them (team basis,
--    the same basis the CRM already uses for BDM targets and incentives).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crm_sales_role(_user uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.crm_memberships WHERE user_id = _user AND active AND role IN ('BDE', 'BDM') LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.crm_team_ids(_user uuid) RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.crm_sales_role(_user) = 'BDM'
    THEN array_prepend(_user, coalesce((SELECT array_agg(m.user_id) FROM public.crm_memberships m WHERE m.manager_id = _user AND m.active), '{}'::uuid[]))
    ELSE ARRAY[_user] END
$$;

CREATE OR REPLACE FUNCTION public.crm_collection_present(_user uuid, _day date) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT sum(c.amount) FROM public.crm_collections c
                   WHERE c.owner_id = ANY(public.crm_team_ids(_user)) AND c.collected_on = _day AND c.status = 'verified'), 0)
         >= coalesce((SELECT s.min_daily_collection FROM public.crm_pay_settings s WHERE s.id), 1)
$$;

REVOKE ALL ON FUNCTION public.crm_sales_role(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.crm_team_ids(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.crm_collection_present(uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_sales_role(uuid), public.crm_team_ids(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crm_collection_present(uuid, date) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Collection-linked attendance
--    For an active BDE/BDM a day can be "present" only when a verified collection exists for it.
--    Check-in still works (time is recorded) but the day shows absent until Accounts verifies a
--    collection; verifying a collection marks that day present automatically (even if verified later).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crm_attendance_collection_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('present', 'half_day') THEN RETURN NEW; END IF;
  IF public.crm_sales_role(NEW.user_id) IS NULL THEN RETURN NEW; END IF;
  IF NOT coalesce((SELECT collection_attendance FROM public.crm_pay_settings WHERE id), true) THEN RETURN NEW; END IF;
  IF public.crm_collection_present(NEW.user_id, NEW.day) THEN
    NEW.status := 'present';
    IF NEW.note = '' OR NEW.note LIKE 'Waiting for first verified collection%' THEN NEW.note := 'Present — verified collection recorded'; END IF;
  ELSE
    NEW.status := 'absent';
    NEW.note := 'Waiting for first verified collection of the day';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_attendance_collection_guard ON public.attendance_records;
DROP TRIGGER IF EXISTS crm_attendance_collection_guard ON public.attendance_records;
CREATE TRIGGER crm_attendance_collection_guard BEFORE INSERT OR UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.crm_attendance_collection_guard();

CREATE OR REPLACE FUNCTION public.crm_collection_attendance_sync() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid;
BEGIN
  IF NEW.status <> 'verified' OR (TG_OP = 'UPDATE' AND OLD.status = 'verified') THEN RETURN NEW; END IF;
  -- The collector, and their BDM (whose day is on team basis).
  FOR u IN SELECT NEW.owner_id UNION SELECT m.manager_id FROM public.crm_memberships m
           WHERE m.user_id = NEW.owner_id AND m.active AND m.manager_id IS NOT NULL AND public.crm_sales_role(m.manager_id) = 'BDM'
  LOOP
    IF public.crm_sales_role(u) IS NULL OR NOT public.crm_collection_present(u, NEW.collected_on) THEN CONTINUE; END IF;
    INSERT INTO public.attendance_records (user_id, day, status, note)
    VALUES (u, NEW.collected_on, 'present', 'Present — verified collection recorded')
    ON CONFLICT (user_id, day) DO UPDATE
      SET status = CASE WHEN public.attendance_records.status IN ('leave', 'holiday', 'wfh') THEN public.attendance_records.status ELSE 'present' END,
          note = CASE WHEN public.attendance_records.status IN ('leave', 'holiday', 'wfh') THEN public.attendance_records.note ELSE 'Present — verified collection recorded' END,
          updated_at = now();
  END LOOP;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_collection_attendance_sync ON public.crm_collections;
DROP TRIGGER IF EXISTS crm_collection_attendance_sync ON public.crm_collections;
CREATE TRIGGER crm_collection_attendance_sync AFTER INSERT OR UPDATE OF status ON public.crm_collections
  FOR EACH ROW EXECUTE FUNCTION public.crm_collection_attendance_sync();
REVOKE ALL ON FUNCTION public.crm_attendance_collection_guard(), public.crm_collection_attendance_sync() FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Volunteer revenue attributed to BDE/BDM (fee of each credited volunteer referral)
--    Counts toward the owning BDE/BDM team's monthly TARGET, never toward their incentive amount.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crm_volunteer_revenue(_since date)
RETURNS TABLE(employee_id uuid, day date, revenue numeric, forms bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE all_rows boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  all_rows := public.has_role(auth.uid(), 'admin') OR public.fin_access() OR public.hr_or_finance();
  IF NOT all_rows AND public.crm_sales_role(auth.uid()) IS NULL THEN RAISE EXCEPTION 'Sales access required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
    SELECT v.employee_id, (coalesce(c.credited_at, c.created_at) AT TIME ZONE 'Asia/Kolkata')::date, sum(c.fee_amount)::numeric, count(*)
    FROM public.volunteer_commissions c JOIN public.volunteers v ON v.id = c.volunteer_id
    WHERE c.status = 'credited' AND c.form_key <> 'fixed_incentive'
      AND (coalesce(c.credited_at, c.created_at) AT TIME ZONE 'Asia/Kolkata')::date >= coalesce(_since, date '2000-01-01')
      AND (all_rows OR v.employee_id = ANY(public.crm_team_ids(auth.uid())))
    GROUP BY 1, 2;
END $$;
REVOKE ALL ON FUNCTION public.crm_volunteer_revenue(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_volunteer_revenue(date) TO authenticated, service_role;

-- One month of sales figures for one person (team basis for BDM). Used by payroll.
CREATE OR REPLACE FUNCTION public.crm_sales_month(_user uuid, _month date)
RETURNS TABLE(sales_role text, direct_verified numeric, volunteer_revenue numeric, revenue_target numeric, collection_days integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH p AS (SELECT date_trunc('month', _month)::date AS m0, (date_trunc('month', _month) + interval '1 month')::date AS m1, public.crm_team_ids(_user) AS ids)
  SELECT public.crm_sales_role(_user),
    coalesce((SELECT sum(c.amount) FROM public.crm_collections c, p WHERE c.owner_id = ANY(p.ids) AND c.status = 'verified' AND c.collected_on >= p.m0 AND c.collected_on < p.m1), 0)::numeric,
    coalesce((SELECT sum(vc.fee_amount) FROM public.volunteer_commissions vc JOIN public.volunteers v ON v.id = vc.volunteer_id, p
              WHERE v.employee_id = ANY(p.ids) AND vc.status = 'credited' AND vc.form_key <> 'fixed_incentive'
                AND (coalesce(vc.credited_at, vc.created_at) AT TIME ZONE 'Asia/Kolkata')::date >= p.m0
                AND (coalesce(vc.credited_at, vc.created_at) AT TIME ZONE 'Asia/Kolkata')::date < p.m1), 0)::numeric,
    coalesce((SELECT sum(t.revenue_target) FROM public.crm_targets t, p WHERE t.owner_id = ANY(p.ids) AND t.month >= p.m0 AND t.month < p.m1), 0)::numeric,
    (SELECT count(*)::integer FROM generate_series((SELECT m0 FROM p), (SELECT m1 FROM p) - 1, interval '1 day') g(d)
     WHERE public.crm_collection_present(_user, g.d::date))
$$;
REVOKE ALL ON FUNCTION public.crm_sales_month(uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_sales_month(uuid, date) TO service_role;

-- The signed-in BDE/BDM's own daily wage (monthly gross ÷ 30). Nobody else's salary is returned.
CREATE OR REPLACE FUNCTION public.crm_my_daily_wage() RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT round(coalesce((SELECT s.monthly_gross FROM public.hr_salary_structures s WHERE s.user_id = auth.uid()), 0) / 30, 2)
  WHERE auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.crm_my_daily_wage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_my_daily_wage() TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Payroll: BDE/BDM pay derives only from verified collection
--    Daily wage = monthly gross ÷ 30. Paid days = days with verified collection (max 30).
--    Loss of pay days = 30 − paid days. Incentive slab is chosen by target achievement counting
--    direct + volunteer revenue, but the incentive amount is paid on DIRECT verified collection only.
--    Everyone else is unchanged (attendance-based loss of pay, as before).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.hr_generate_payroll(_month date) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m date:=date_trunc('month',_month)::date; s record; a record; r record; p hr_payslips; n integer:=0; days numeric; inc numeric; reimb numeric; recovery numeric; take numeric; owed numeric; available numeric; slab jsonb;
  sm record; linked boolean:=coalesce((SELECT collection_attendance FROM crm_pay_settings WHERE id),true); rev_for_slab numeric; rev_for_pay numeric; tgt numeric;
BEGIN
 IF auth.uid() IS NULL OR NOT hr_or_finance() THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF m IS NULL THEN RAISE EXCEPTION 'Month required'; END IF;
 PERFORM pg_advisory_xact_lock(272002);
 FOR s IN SELECT ss.*,o.verified_revenue,o.revenue_target,o.plan_active,o.plan_slabs FROM hr_salary_structures ss JOIN hr_people_overview(m) o ON o.user_id=ss.user_id WHERE ss.effective_from<m+interval '1 month' AND NOT EXISTS(SELECT 1 FROM hr_employee_master em WHERE em.user_id=ss.user_id AND em.status IN ('inactive','exited')) LOOP
  SELECT * INTO p FROM hr_payslips WHERE user_id=s.user_id AND month=m FOR UPDATE;
  IF FOUND AND p.status<>'draft' THEN CONTINUE; END IF;
  IF p.id IS NULL THEN
   INSERT INTO hr_payslips(user_id,month,created_by) VALUES(s.user_id,m,auth.uid()) RETURNING * INTO p;
  END IF;
  DELETE FROM hr_payslip_items WHERE payslip_id=p.id;
  SELECT * INTO sm FROM crm_sales_month(s.user_id,m);
  IF linked AND sm.sales_role IS NOT NULL THEN
   days:=30-least(30,sm.collection_days);
   rev_for_slab:=sm.direct_verified+sm.volunteer_revenue; rev_for_pay:=sm.direct_verified; tgt:=sm.revenue_target;
  ELSE
   SELECT coalesce(sum(CASE status WHEN 'absent' THEN 1 WHEN 'half_day' THEN 0.5 ELSE 0 END),0) INTO days FROM attendance_records WHERE user_id=s.user_id AND day>=m AND day<m+interval '1 month';
   rev_for_slab:=coalesce(s.verified_revenue,0); rev_for_pay:=coalesce(s.verified_revenue,0); tgt:=coalesce(s.revenue_target,0);
  END IF;
  inc:=0; slab:=NULL;
  IF s.plan_active AND tgt>0 THEN
   SELECT x INTO slab FROM jsonb_array_elements(coalesce(s.plan_slabs,'[]')) x WHERE (x->>'min')::numeric<=floor(rev_for_slab/tgt*100) ORDER BY (x->>'min')::numeric DESC LIMIT 1;
   IF slab IS NOT NULL THEN inc:=round(rev_for_pay*(slab->>'rate')::numeric/100+(slab->>'bonus')::numeric); END IF;
  END IF;
  reimb:=0;
  FOR r IN SELECT q.* FROM requests q WHERE q.applicant_id=s.user_id AND q.type='reimbursement' AND q.status IN ('approved','paid') AND q.updated_at<m+interval '1 month' AND NOT EXISTS(SELECT 1 FROM hr_payslip_items i WHERE i.request_id=q.id AND i.kind='reimbursement') ORDER BY q.created_at FOR UPDATE LOOP
   INSERT INTO hr_payslip_items(payslip_id,user_id,kind,amount,label,request_id) VALUES(p.id,s.user_id,'reimbursement',coalesce(r.amount,0),r.title,r.id);
   reimb:=reimb+coalesce(r.amount,0);
  END LOOP;
  available:=greatest(0,s.monthly_gross-s.deductions-round(s.monthly_gross/30*days,2)+inc+reimb); recovery:=0;
  FOR a IN SELECT * FROM hr_advances WHERE user_id=s.user_id AND status='active' AND start_month<=m ORDER BY start_month,created_at,id FOR UPDATE LOOP
   SELECT greatest(0,a.amount-coalesce(sum(i.amount),0)) INTO owed FROM hr_payslip_items i JOIN hr_payslips ps ON ps.id=i.payslip_id WHERE i.advance_id=a.id AND ps.id<>p.id;
   take:=greatest(0,least(a.monthly_recovery,owed,available-recovery));
   IF take>0 THEN INSERT INTO hr_payslip_items(payslip_id,user_id,kind,amount,label,advance_id) VALUES(p.id,s.user_id,'advance_recovery',take,'Salary advance recovery',a.id); END IF;
   recovery:=recovery+take;
  END LOOP;
  UPDATE hr_payslips SET basic=s.basic,hra=s.hra,allowances=s.allowances,gross=s.monthly_gross,deductions=s.deductions,lop_days=days,lop_amount=round(s.monthly_gross/30*days,2),incentive=inc,reimbursement=reimb,advance_recovery=recovery,net=greatest(0,available-recovery),updated_at=now() WHERE id=p.id;
  n:=n+1; p:=NULL;
 END LOOP;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.hr_generate_payroll(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hr_generate_payroll(date) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. "Remove your zero" nudges — every 20 minutes from work start until 12:00 PM IST, only while
--    a BDE/BDM (BDM: whole team) has recorded no collection today. Stops by itself once the first
--    collection of the day is recorded. Skips people on leave/holiday and Sundays.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crm_zero_collection_nudge() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t timestamp := now() AT TIME ZONE 'Asia/Kolkata'; d date := (now() AT TIME ZONE 'Asia/Kolkata')::date; s public.crm_pay_settings; n integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  SELECT * INTO s FROM public.crm_pay_settings WHERE id;
  IF NOT FOUND OR NOT s.collection_attendance THEN RETURN 0; END IF;
  IF t::time < s.work_start OR t::time >= s.zero_cutoff OR extract(isodow FROM d) = 7 THEN RETURN 0; END IF;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  SELECT m.user_id, 'alert', 'Remove your zero before ' || to_char(s.zero_cutoff, 'FMHH12:MI AM') || '!',
         'Remove your zero before ' || to_char(s.zero_cutoff, 'FMHH12:MI AM') || '! Start today''s collection to mark your daily attendance and protect your daily wage.', '/crm'
  FROM public.crm_memberships m
  WHERE m.active AND m.role IN ('BDE', 'BDM')
    AND NOT EXISTS (SELECT 1 FROM public.crm_collections c WHERE c.owner_id = ANY(public.crm_team_ids(m.user_id)) AND c.collected_on = d AND c.status <> 'rejected')
    AND NOT EXISTS (SELECT 1 FROM public.attendance_records a WHERE a.user_id = m.user_id AND a.day = d AND a.status IN ('leave', 'holiday'))
    AND NOT EXISTS (SELECT 1 FROM public.notifications x WHERE x.user_id = m.user_id AND x.title LIKE 'Remove your zero%'
                    AND x.created_at > now() - make_interval(mins => s.nudge_every_minutes - 1));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.crm_zero_collection_nudge() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_zero_collection_nudge() TO service_role;

-- Schedule (needs the pg_cron extension: Supabase → Database → Extensions → pg_cron).
-- Runs at :10, :30, :50 IST from 08:30 to 12:10 IST (03:00–06:59 UTC); the function itself keeps to the
-- work-start → cut-off window, so changing those times in the CRM needs no new schedule.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'crm-zero-collection-nudge';
    PERFORM cron.schedule('crm-zero-collection-nudge', '*/20 3-6 * * *', 'SELECT public.crm_zero_collection_nudge()');
  ELSE
    RAISE NOTICE 'pg_cron is not enabled: in-app banners still work; enable pg_cron and run this file again for the 20-minute bell alerts.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Volunteer incentive mode: commission (default, no mandatory target) or fixed incentive
--    with a mandatory monthly revenue target. Set only by Admin, or the BDM over the owner.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS incentive_mode text NOT NULL DEFAULT 'commission';
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS fixed_incentive numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS revenue_target numeric(12,2) NOT NULL DEFAULT 0;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'volunteers_incentive_mode_check') THEN
    ALTER TABLE public.volunteers ADD CONSTRAINT volunteers_incentive_mode_check CHECK (incentive_mode IN ('commission', 'fixed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'volunteers_fixed_needs_target') THEN
    ALTER TABLE public.volunteers ADD CONSTRAINT volunteers_fixed_needs_target CHECK (
      fixed_incentive >= 0 AND revenue_target >= 0 AND (incentive_mode = 'commission' OR (fixed_incentive > 0 AND revenue_target > 0)));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_incentive_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF coalesce(current_setting('riloyd.volunteer_incentive', true), '') <> 'on' THEN
      NEW.incentive_mode := 'commission'; NEW.fixed_incentive := 0; NEW.revenue_target := 0;
    END IF;
    RETURN NEW;
  END IF;
  IF (NEW.incentive_mode IS DISTINCT FROM OLD.incentive_mode OR NEW.fixed_incentive IS DISTINCT FROM OLD.fixed_incentive OR NEW.revenue_target IS DISTINCT FROM OLD.revenue_target)
     AND coalesce(current_setting('riloyd.volunteer_incentive', true), '') <> 'on'
     AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'Use "Set incentive" (Admin or BDM) to change a volunteer''s incentive' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS volunteer_incentive_guard ON public.volunteers;
DROP TRIGGER IF EXISTS volunteer_incentive_guard ON public.volunteers;
CREATE TRIGGER volunteer_incentive_guard BEFORE INSERT OR UPDATE ON public.volunteers FOR EACH ROW EXECUTE FUNCTION public.volunteer_incentive_guard();

CREATE OR REPLACE FUNCTION public.volunteer_set_incentive(_volunteer uuid, _mode text, _fixed numeric DEFAULT 0, _target numeric DEFAULT 0)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.volunteers%ROWTYPE; me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Please sign in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v FROM public.volunteers WHERE id = _volunteer FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Volunteer not found' USING ERRCODE = 'P0002'; END IF;
  IF NOT (public.has_role(me, 'admin')
          OR (public.crm_sales_role(me) = 'BDM' AND v.employee_id = ANY(public.crm_team_ids(me)))) THEN
    RAISE EXCEPTION 'Only an admin or the BDM over this volunteer can set a fixed incentive' USING ERRCODE = '42501';
  END IF;
  IF _mode NOT IN ('commission', 'fixed') THEN RAISE EXCEPTION 'Choose commission or fixed incentive' USING ERRCODE = '22023'; END IF;
  IF _mode = 'fixed' AND (coalesce(_fixed, 0) <= 0 OR coalesce(_target, 0) <= 0) THEN
    RAISE EXCEPTION 'A fixed incentive needs an amount and a mandatory monthly revenue target' USING ERRCODE = '22023';
  END IF;
  IF _mode = 'fixed' AND (_fixed > 1000000 OR _target > 100000000 OR _fixed <> round(_fixed, 2) OR _target <> round(_target, 2)) THEN
    RAISE EXCEPTION 'Amounts are too large or have more than two decimals' USING ERRCODE = '22023';
  END IF;
  PERFORM set_config('riloyd.volunteer_incentive', 'on', true);
  UPDATE public.volunteers SET incentive_mode = _mode,
    fixed_incentive = CASE WHEN _mode = 'fixed' THEN _fixed ELSE 0 END,
    revenue_target = CASE WHEN _mode = 'fixed' THEN _target ELSE 0 END WHERE id = v.id;
  PERFORM set_config('riloyd.volunteer_incentive', '', true);
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (me, 'volunteer_incentive', 'volunteers', v.id::text, jsonb_build_object('mode', _mode, 'fixed_incentive', _fixed, 'revenue_target', _target,
          'old', jsonb_build_object('mode', v.incentive_mode, 'fixed_incentive', v.fixed_incentive, 'revenue_target', v.revenue_target)));
  PERFORM public.volunteer_notify(v.id, 'status',
    CASE WHEN _mode = 'fixed' THEN 'Fixed incentive: ₹' || _fixed || ' for ₹' || _target || ' revenue a month' ELSE 'Back to commission per form' END,
    CASE WHEN _mode = 'fixed' THEN 'Reach ₹' || _target || ' verified revenue in a month to earn ₹' || _fixed || '. Per-form commission does not apply while the fixed incentive is on.'
         ELSE 'You earn commission on each verified form again. There is no mandatory revenue target.' END, me);
END $$;
REVOKE ALL ON FUNCTION public.volunteer_set_incentive(uuid, text, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.volunteer_set_incentive(uuid, text, numeric, numeric) TO authenticated, service_role;

-- Per-form commission is 0% while a volunteer is on a fixed incentive (the fee is still recorded as revenue).
CREATE OR REPLACE FUNCTION public.volunteer_sync_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _r jsonb := to_jsonb(NEW); _code text := upper(btrim(coalesce(NEW.coordinator_code, '')));
  _v public.volunteers%ROWTYPE; _rule public.volunteer_form_commissions%ROWTYPE; _old public.volunteer_commissions%ROWTYPE;
  _max numeric; _form text; _fee numeric; _app text; _eligible boolean; _credit boolean; _reverse boolean; _pct numeric; _flat numeric; _amount numeric;
BEGIN
  IF _code = '' THEN RETURN NEW; END IF;
  SELECT * INTO _v FROM public.volunteers WHERE referral_code = _code;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'education_support_registrations' THEN
    _form := 'education'; _fee := coalesce((_r->>'registration_fee')::numeric, 0);
    _app := coalesce(nullif(_r->>'registration_id', ''), nullif(_r->>'ack_number', ''), '');
    _eligible := _r->>'form_status' = 'completed' OR _r->>'payment_status' IN ('reference_submitted', 'paid');
    _credit := _r->>'payment_status' = 'paid' AND _r->>'status' IN ('verified', 'eligible', 'not_eligible', 'selected', 'not_selected');
    _reverse := _r->>'payment_status' = 'failed';
  ELSE
    _form := 'young_innovators'; _fee := coalesce((_r->>'fee_amount')::numeric, 0); _app := coalesce(_r->>'application_code', '');
    _eligible := _r->>'submission_status' = 'submitted';
    _credit := _r->>'status' = 'approved';
    _reverse := _r->>'status' = 'rejected';
  END IF;
  SELECT * INTO _old FROM public.volunteer_commissions WHERE form_key = _form AND source_id = (_r->>'id')::uuid FOR UPDATE;
  IF NOT FOUND THEN
    IF NOT (_eligible OR _credit) OR _v.status <> 'active' THEN RETURN NEW; END IF;
    SELECT * INTO _rule FROM public.volunteer_form_commissions WHERE form_key = _form AND active;
    IF NOT FOUND THEN RETURN NEW; END IF;
    SELECT max_percent INTO _max FROM public.volunteer_settings WHERE id;
    IF _v.incentive_mode = 'fixed' THEN _pct := 0; _flat := 0;
    ELSE _pct := least(coalesce(_v.commission_percent, _rule.percent), coalesce(_max, 10)); _flat := _rule.flat_amount; END IF;
    _amount := round(greatest(_fee, 0) * _pct / 100 + _flat, 2);
    INSERT INTO public.volunteer_commissions (volunteer_id, form_key, source_id, application_code, fee_amount, percent, flat_amount, amount, status, credited_at, reversed_at)
    VALUES (_v.id, _form, (_r->>'id')::uuid, _app, greatest(_fee, 0), _pct, _flat, _amount,
      CASE WHEN _reverse THEN 'reversed' WHEN _credit THEN 'credited' ELSE 'pending' END,
      CASE WHEN _credit AND NOT _reverse THEN now() END, CASE WHEN _reverse THEN now() END);
    PERFORM public.volunteer_notify(_v.id, 'status',
      CASE WHEN _credit AND NOT _reverse THEN CASE WHEN _v.incentive_mode = 'fixed' THEN 'Revenue counted: ₹' || greatest(_fee, 0) ELSE 'Commission credited: ₹' || _amount END ELSE 'New referred form received' END,
      coalesce(nullif(_app, ''), 'A form') || ' was submitted with your referral code.');
    RETURN NEW;
  END IF;
  IF _old.status = 'pending' AND _reverse THEN
    UPDATE public.volunteer_commissions SET status = 'reversed', reversed_at = now(), updated_at = now(), application_code = _app WHERE id = _old.id;
    PERFORM public.volunteer_notify(_v.id, 'status', 'Commission not payable: ' || coalesce(nullif(_app, ''), 'form'), 'The referred form was not completed successfully (for example, the payment failed).');
  ELSIF _old.status IN ('pending', 'reversed') AND _credit AND NOT _reverse THEN
    _amount := round(greatest(_fee, 0) * _old.percent / 100 + _old.flat_amount, 2);
    UPDATE public.volunteer_commissions SET status = 'credited', credited_at = now(), reversed_at = NULL, amount = _amount,
      fee_amount = greatest(_fee, 0), application_code = _app, updated_at = now() WHERE id = _old.id;
    PERFORM public.volunteer_notify(_v.id, 'status', CASE WHEN _amount > 0 THEN 'Commission credited: ₹' || _amount ELSE 'Revenue counted: ₹' || greatest(_fee, 0) END, coalesce(nullif(_app, ''), 'Your referred form') || ' was verified.');
  ELSIF _old.application_code IS DISTINCT FROM _app THEN
    UPDATE public.volunteer_commissions SET application_code = _app, updated_at = now() WHERE id = _old.id;
  END IF;
  RETURN NEW;
END $$;

-- Credit fixed incentives for a finished month (Admin or Accounts/Finance). Each volunteer is paid at
-- most once per month (unique form_key + source_id). Revenue = fees of credited referrals that month.
CREATE OR REPLACE FUNCTION public.volunteer_settle_fixed_incentives(_month date)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m0 date := date_trunc('month', _month)::date; m1 date := (date_trunc('month', _month) + interval '1 month')::date; v record; n integer := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(), 'admin') OR public.fin_access()) THEN RAISE EXCEPTION 'Admin or Finance access required' USING ERRCODE = '42501'; END IF;
  IF m1 > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Settle a month only after it has ended' USING ERRCODE = '22023'; END IF;
  FOR v IN
    SELECT x.id, x.fixed_incentive, x.revenue_target,
      coalesce((SELECT sum(c.fee_amount) FROM public.volunteer_commissions c WHERE c.volunteer_id = x.id AND c.status = 'credited' AND c.form_key <> 'fixed_incentive'
        AND (c.credited_at AT TIME ZONE 'Asia/Kolkata')::date >= m0 AND (c.credited_at AT TIME ZONE 'Asia/Kolkata')::date < m1), 0) AS revenue
    FROM public.volunteers x WHERE x.incentive_mode = 'fixed' AND x.status = 'active' AND x.fixed_incentive > 0 AND x.revenue_target > 0
  LOOP
    IF v.revenue < v.revenue_target THEN CONTINUE; END IF;
    INSERT INTO public.volunteer_commissions (volunteer_id, form_key, source_id, application_code, fee_amount, percent, flat_amount, amount, status, credited_at)
    VALUES (v.id, 'fixed_incentive', md5(v.id::text || m0::text)::uuid, 'FIXED-' || to_char(m0, 'YYYY-MM'), 0, 0, v.fixed_incentive, v.fixed_incentive, 'credited', now())
    ON CONFLICT (form_key, source_id) DO NOTHING;
    IF FOUND THEN
      n := n + 1;
      PERFORM public.volunteer_notify(v.id, 'status', 'Fixed incentive credited: ₹' || v.fixed_incentive, 'You reached ₹' || v.revenue || ' revenue in ' || to_char(m0, 'Mon YYYY') || ' (target ₹' || v.revenue_target || ').');
    END IF;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.volunteer_settle_fixed_incentives(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.volunteer_settle_fixed_incentives(date) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Minimum withdrawal is strictly ₹3,000 (the setting can be raised, never lowered below ₹3,000)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.volunteer_settings WHERE min_withdrawal < 3000) THEN
    ALTER TABLE public.volunteer_settings DISABLE TRIGGER USER;
    UPDATE public.volunteer_settings SET min_withdrawal = 3000 WHERE min_withdrawal < 3000;
    ALTER TABLE public.volunteer_settings ENABLE TRIGGER USER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'volunteer_settings_min_withdrawal_floor') THEN
    ALTER TABLE public.volunteer_settings ADD CONSTRAINT volunteer_settings_min_withdrawal_floor CHECK (min_withdrawal >= 3000);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.volunteer_request_withdrawal(_amount numeric, _method text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _v public.volunteers%ROWTYPE; _p public.volunteer_payout_details%ROWTYPE; _min integer; _available numeric; _mask text; _no text;
BEGIN
  SELECT * INTO _v FROM public.volunteers WHERE user_id = auth.uid() AND auth.uid() IS NOT NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Volunteer account not found' USING ERRCODE = '42501'; END IF;
  IF _v.status <> 'active' THEN RAISE EXCEPTION 'Your volunteer account is inactive' USING ERRCODE = '42501'; END IF;
  IF _v.kyc_status <> 'verified' THEN RAISE EXCEPTION 'Your KYC must be verified before you can withdraw' USING ERRCODE = '22023'; END IF;
  IF _method IS NULL OR _method NOT IN ('upi', 'bank') THEN RAISE EXCEPTION 'Choose UPI or bank account' USING ERRCODE = '22023'; END IF;
  SELECT * INTO _p FROM public.volunteer_payout_details WHERE volunteer_id = _v.id;
  IF _method = 'upi' AND coalesce(_p.upi_id, '') = '' THEN RAISE EXCEPTION 'Add your UPI ID first' USING ERRCODE = '22023'; END IF;
  IF _method = 'bank' AND coalesce(_p.account_number, '') = '' THEN RAISE EXCEPTION 'Add your bank account first' USING ERRCODE = '22023'; END IF;
  SELECT greatest(coalesce(min_withdrawal, 3000), 3000) INTO _min FROM public.volunteer_settings WHERE id;
  _min := coalesce(_min, 3000);
  IF _amount IS NULL OR _amount <> round(_amount, 2) OR _amount < _min THEN
    RAISE EXCEPTION 'The minimum withdrawal is ₹%', _min USING ERRCODE = '22023';
  END IF;
  _available := public.volunteer_available_balance(_v.id);
  IF _amount > _available THEN RAISE EXCEPTION 'The amount is more than your available balance (₹%)', _available USING ERRCODE = '22023'; END IF;
  _mask := CASE WHEN _method = 'upi' THEN 'UPI ' || left(split_part(_p.upi_id, '@', 1), 2) || '••••@' || split_part(_p.upi_id, '@', 2)
    ELSE 'Bank ••••' || right(_p.account_number, 4) || ' (' || left(_p.ifsc, 4) || ')' END;
  INSERT INTO public.volunteer_withdrawals (volunteer_id, amount, method, payout_masked) VALUES (_v.id, _amount, _method, _mask) RETURNING request_number INTO _no;
  PERFORM public.volunteer_notify(_v.id, 'status', 'Withdrawal requested: ' || _no, '₹' || _amount || ' to ' || _mask || '. You will be notified when it is processed.');
  RETURN _no;
END $$;
REVOKE ALL ON FUNCTION public.volunteer_request_withdrawal(numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.volunteer_request_withdrawal(numeric, text) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Volunteer reward & recognition schemes
--    Admin → all volunteers. BDM → volunteers of their team. BDE → their own volunteers.
--    Volunteers see active schemes meant for them; progress is computed from their own referrals.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.volunteer_reward_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  reward_type text NOT NULL DEFAULT 'cash' CHECK (reward_type IN ('cash', 'gift', 'certificate', 'trip', 'other')),
  reward text NOT NULL CHECK (char_length(btrim(reward)) BETWEEN 1 AND 200),
  reward_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (reward_amount >= 0 AND reward_amount <= 10000000),
  criteria text NOT NULL CHECK (criteria IN ('verified_forms', 'referrals', 'revenue')),
  criteria_target numeric(12,2) NOT NULL CHECK (criteria_target > 0),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  badge text NOT NULL DEFAULT '' CHECK (char_length(badge) <= 40),
  banner_tone text NOT NULL DEFAULT 'gold' CHECK (banner_tone IN ('gold', 'green', 'blue', 'red')),
  audience text NOT NULL DEFAULT 'own' CHECK (audience IN ('all', 'team', 'own')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on >= starts_on AND ends_on - starts_on <= 366)
);
CREATE INDEX IF NOT EXISTS volunteer_reward_schemes_creator ON public.volunteer_reward_schemes (created_by);
GRANT SELECT, INSERT, UPDATE ON public.volunteer_reward_schemes TO authenticated;
GRANT ALL ON public.volunteer_reward_schemes TO service_role;
ALTER TABLE public.volunteer_reward_schemes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.volunteer_reward_scheme_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := coalesce(auth.uid(), NEW.created_by);
    r := CASE WHEN public.has_role(NEW.created_by, 'admin') THEN 'admin' ELSE public.crm_sales_role(NEW.created_by) END;
    IF r IS NULL THEN RAISE EXCEPTION 'Only Admin, BDM or BDE can launch a reward scheme' USING ERRCODE = '42501'; END IF;
    NEW.audience := CASE r WHEN 'admin' THEN 'all' WHEN 'BDM' THEN 'team' ELSE 'own' END;
    NEW.created_at := now();
  ELSE
    IF NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.audience IS DISTINCT FROM OLD.audience OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Creator and audience of a scheme cannot be changed' USING ERRCODE = '42501';
    END IF;
  END IF;
  NEW.title := btrim(NEW.title); NEW.reward := btrim(NEW.reward); NEW.badge := btrim(NEW.badge);
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS volunteer_reward_scheme_guard ON public.volunteer_reward_schemes;
DROP TRIGGER IF EXISTS volunteer_reward_scheme_guard ON public.volunteer_reward_schemes;
CREATE TRIGGER volunteer_reward_scheme_guard BEFORE INSERT OR UPDATE ON public.volunteer_reward_schemes
  FOR EACH ROW EXECUTE FUNCTION public.volunteer_reward_scheme_guard();

-- Is this scheme meant for volunteers owned by `_employee`?
CREATE OR REPLACE FUNCTION public.reward_scheme_for_employee(_audience text, _creator uuid, _employee uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE _audience WHEN 'all' THEN true WHEN 'own' THEN _employee = _creator ELSE _employee = ANY(public.crm_team_ids(_creator)) END
$$;
REVOKE ALL ON FUNCTION public.reward_scheme_for_employee(text, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reward_scheme_for_employee(text, uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS reward_schemes_read ON public.volunteer_reward_schemes;
DROP POLICY IF EXISTS reward_schemes_read ON public.volunteer_reward_schemes;
CREATE POLICY reward_schemes_read ON public.volunteer_reward_schemes FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
  OR created_by = auth.uid()
  OR created_by = ANY(public.crm_team_ids(auth.uid()))                                   -- a BDM sees their BDEs' schemes
  OR public.reward_scheme_for_employee(audience, created_by, auth.uid())                  -- an employee sees schemes that cover their volunteers
  OR (status = 'active' AND EXISTS (SELECT 1 FROM public.volunteers v WHERE v.user_id = auth.uid() AND v.status = 'active'
        AND public.reward_scheme_for_employee(audience, created_by, v.employee_id)))
);
DROP POLICY IF EXISTS reward_schemes_insert ON public.volunteer_reward_schemes;
DROP POLICY IF EXISTS reward_schemes_insert ON public.volunteer_reward_schemes;
CREATE POLICY reward_schemes_insert ON public.volunteer_reward_schemes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (public.has_role(auth.uid(), 'admin') OR public.crm_sales_role(auth.uid()) IS NOT NULL));
DROP POLICY IF EXISTS reward_schemes_update ON public.volunteer_reward_schemes;
DROP POLICY IF EXISTS reward_schemes_update ON public.volunteer_reward_schemes;
CREATE POLICY reward_schemes_update ON public.volunteer_reward_schemes FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Tell the targeted volunteers when a scheme is launched.
CREATE OR REPLACE FUNCTION public.volunteer_reward_scheme_announce() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v record;
BEGIN
  IF NEW.status <> 'active' OR (TG_OP = 'UPDATE' AND OLD.status = 'active') THEN RETURN NEW; END IF;
  FOR v IN SELECT id FROM public.volunteers WHERE status = 'active' AND public.reward_scheme_for_employee(NEW.audience, NEW.created_by, employee_id) LOOP
    PERFORM public.volunteer_notify(v.id, 'announcement', 'New reward scheme: ' || NEW.title,
      NEW.reward || ' · ' || to_char(NEW.starts_on, 'DD Mon') || ' – ' || to_char(NEW.ends_on, 'DD Mon YYYY') || '. See Rewards on your dashboard.', NEW.created_by);
  END LOOP;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS volunteer_reward_scheme_announce ON public.volunteer_reward_schemes;
DROP TRIGGER IF EXISTS volunteer_reward_scheme_announce ON public.volunteer_reward_schemes;
CREATE TRIGGER volunteer_reward_scheme_announce AFTER INSERT OR UPDATE OF status ON public.volunteer_reward_schemes
  FOR EACH ROW EXECUTE FUNCTION public.volunteer_reward_scheme_announce();
REVOKE ALL ON FUNCTION public.volunteer_reward_scheme_guard(), public.volunteer_reward_scheme_announce() FROM PUBLIC, anon, authenticated;

-- Done. Quick checks:
--   SELECT * FROM public.crm_pay_settings;
--   SELECT min_withdrawal FROM public.volunteer_settings;          -- 3000 or more
--   SELECT jobname, schedule FROM cron.job WHERE jobname = 'crm-zero-collection-nudge';
-- ===== starter =====
ALTER TABLE public.global_settings DISABLE TRIGGER c_settings_history;
ALTER TABLE public.payment_options DISABLE TRIGGER c_settings_history;
ALTER TABLE public.volunteer_settings DISABLE TRIGGER c_settings_history;
ALTER TABLE public.volunteer_form_commissions DISABLE TRIGGER c_settings_history;
ALTER TABLE public.crm_incentive_plans DISABLE TRIGGER c_settings_history;

SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"service_role"}',true);
INSERT INTO public.c_critical_write_context(tx,actor) VALUES (txid_current(),'00000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
INSERT INTO public.ack_form_counters (form_code, form_name, last_serial) VALUES
  ('01','Scholarship',0),('02','Young Innovators',0),('03','Funding Programme',0),('04','Foundation',0),('05','Registration',0),('06','Enquiry',0)
ON CONFLICT (form_code) DO NOTHING;

INSERT INTO public.leave_policies(leave_type,label,days_per_year,sort_order) VALUES ('casual','Casual leave',12,1),('sick','Sick leave',12,2),('earned','Earned leave',15,3),('unpaid','Unpaid leave',0,4) ON CONFLICT DO NOTHING;

INSERT INTO public.request_routes(type,label,category,audience,kind,steps,steps_no_manager,sla_hours,sort_order) VALUES
  ('leave','Leave','Leave & attendance','employee','leave',ARRAY['manager','hr'],ARRAY['hr'],48,0),
  ('wfh','Work from home','Leave & attendance','employee','leave',ARRAY['manager','hr'],ARRAY['hr'],48,1),
  ('permission','Permission','Leave & attendance','employee','attendance',ARRAY['manager'],ARRAY['hr'],24,2),
  ('attendance_correction','Attendance correction','Leave & attendance','employee','attendance',ARRAY['manager','hr'],ARRAY['hr'],48,3),
  ('volunteer_absence','Volunteer absence','Volunteers','volunteer','leave',ARRAY['coordinator'],ARRAY['admin'],48,4),
  ('reimbursement','Reimbursement','Money','employee','money',ARRAY['manager','accounts','finance'],ARRAY['accounts','finance'],72,5),
  ('salary_advance','Salary advance','Money','employee','money',ARRAY['manager','hr','finance'],ARRAY['hr','finance'],72,6),
  ('expense','Expense claim','Money','employee','money',ARRAY['manager','accounts','finance'],ARRAY['accounts','finance'],72,7),
  ('payment_request','Payment request','Money','employee','money',ARRAY['manager','accounts','finance'],ARRAY['accounts','finance'],72,8),
  ('customer_refund','Customer cancellation / refund','Money','employee','money',ARRAY['accounts','finance'],ARRAY['accounts','finance'],72,9),
  ('technical_ticket','Technical support','Support & HR help','all','ticket',ARRAY['support'],ARRAY['support'],24,10),
  ('support_ticket','Support ticket','Support & HR help','all','ticket',ARRAY['support'],ARRAY['support'],24,11),
  ('hr_ticket','HR help','Support & HR help','employee','ticket',ARRAY['hr'],ARRAY['hr'],48,12),
  ('salary_query','Salary query','Support & HR help','employee','ticket',ARRAY['hr'],ARRAY['hr'],48,13),
  ('document_request','Document request','Support & HR help','employee','general',ARRAY['hr'],ARRAY['hr'],48,14),
  ('profile_update','Profile update','Support & HR help','employee','general',ARRAY['hr'],ARRAY['hr'],48,15),
  ('meeting_request','Meeting request','Support & HR help','employee','general',ARRAY['manager'],ARRAY['admin'],48,16),
  ('complaint','Complaint','Support & HR help','all','ticket',ARRAY['hr'],ARRAY['hr'],48,17),
  ('resignation','Resignation','Exit','employee','exit',ARRAY['manager','hr'],ARRAY['hr'],72,18),
  ('general','General request','General','all','general',ARRAY['admin'],ARRAY['admin'],48,19)
ON CONFLICT (type) DO NOTHING;

INSERT INTO public.global_settings(key,value,category,label,description,is_public) VALUES
  ('contact_info_email','"info@riloyd.in"','Contact','General email','Shown in the website footer and contact page.',true),
  ('contact_business_email','"business@riloyd.in"','Contact','Business email','For business and partnership enquiries.',true),
  ('contact_careers_email','"careers@riloyd.in"','Contact','Careers email','For job seekers.',true),
  ('contact_idea_email','"idea@riloyd.in"','Contact','Idea submission email','For startup ideas.',true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.payment_options(key,programme,label,sort_order,amount) VALUES
  ('education_sponsorship','Education Support','Sponsorship registration',1,149),
  ('education_scholarship_25k','Education Support','Scholarship up to ₹25,000',2,249),
  ('education_scholarship_50k','Education Support','Scholarship up to ₹50,000',3,599),
  ('young_innovators_6_8','Young Innovators','Classes 6–8',4,249),
  ('young_innovators_9_10','Young Innovators','Classes 9–10',5,349),
  ('young_innovators_11_12','Young Innovators','Classes 11–12',6,499),
  ('funding_programme_registration','Funding Programme','Registration',7,999),
  ('funding_programme_summit','Funding Programme','Summit pass',8,3599),
  ('prototype_funding_registration','Prototype Funding','Registration',9,999)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.volunteer_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.volunteer_form_commissions (form_key, label) VALUES ('education','Student Scholarship & Sponsorship'),('young_innovators','Young Innovators 2026') ON CONFLICT (form_key) DO NOTHING;
INSERT INTO public.hr_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.crm_incentive_plans(role,slabs,active) VALUES ('BDE','[]',false),('BDM','[]',false) ON CONFLICT (role) DO NOTHING;

INSERT INTO public.hr_shifts(code,name,start_time,end_time,is_off,sort_order) VALUES
  ('GEN','General (10:00-18:30)','10:00','18:30',false,1),('MOR','Morning (07:00-15:30)','07:00','15:30',false,2),
  ('EVE','Evening (14:00-22:30)','14:00','22:30',false,3),('OFF','Weekly off',NULL,NULL,true,4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.hr_letter_templates(name,kind,body)
SELECT v.name, v.kind, v.body FROM (VALUES
  ('Offer letter','offer','Date: {{date}}

Dear {{name}},

We are pleased to offer you the position of {{designation}} in the {{department}} department at Rishishwar Industry Private Limited (RILOYD).

Your monthly gross salary will be ₹{{gross}}. Your joining date is {{joining_date}}.

Please confirm your acceptance through the candidate portal.

For RILOYD
HR Department'),
  ('Appointment letter','appointment','Date: {{date}}

Dear {{name}},

Further to your acceptance of our offer, you are appointed as {{designation}} in the {{department}} department with effect from {{joining_date}}, at a monthly gross salary of ₹{{gross}}.

Your other terms of employment are as per company policy.

For RILOYD
HR Department'),
  ('Experience letter','experience','Date: {{date}}

TO WHOM IT MAY CONCERN

This is to certify that {{name}} worked with Rishishwar Industry Private Limited (RILOYD) as {{designation}} in the {{department}} department.

We wish them every success.

For RILOYD
HR Department'),
  ('Relieving letter','relieving','Date: {{date}}

Dear {{name}},

This is to confirm that you have been relieved from your duties as {{designation}} at Rishishwar Industry Private Limited (RILOYD).

For RILOYD
HR Department')
) AS v(name,kind,body) WHERE NOT EXISTS (SELECT 1 FROM public.hr_letter_templates t WHERE t.kind = v.kind);

DELETE FROM public.c_critical_write_context WHERE tx = txid_current();
SELECT set_config('request.jwt.claims','{}',true);

INSERT INTO public.funding_stages(name,position,description,required_docs,jury_round)
SELECT v.* FROM (VALUES
  ('Application & screening',10,'File received and checked for eligibility.','Pitch deck, founder ID proof',NULL::int),
  ('Document review',20,'Documents for the category are reviewed.','Category documents',NULL),
  ('Jury Scanning Round 1',30,'Mandatory first jury round.','',1),
  ('Jury Scanning Round 2',40,'Mandatory second jury round.','',2),
  ('Due diligence',50,'Financial and legal checks.','Financials, company documents',NULL),
  ('Investor connect',60,'Introductions and pitch meetings with investors.','',NULL)
) AS v(name,position,description,required_docs,jury_round) WHERE NOT EXISTS (SELECT 1 FROM public.funding_stages);

INSERT INTO public.venture_services(pillar,name,description,position)
SELECT v.* FROM (VALUES
  ('startup','Company registration','Help registering your company or LLP.',10),
  ('startup','Pitch deck & business plan','Preparing an investor-ready pitch deck and plan.',20),
  ('funding','Funding readiness review','Review of your file before it goes to investors.',30),
  ('funding','Investor connect','Introductions to investors after the jury rounds.',40),
  ('manpower','Manpower supply','Trained staff deployed at your site.',50),
  ('manpower','Recruitment services','Hiring permanent staff for your company.',60),
  ('business','Compliance support','GST and other compliance help.',70)
) AS v(pillar,name,description,position) WHERE NOT EXISTS (SELECT 1 FROM public.venture_services);

ALTER TABLE public.global_settings ENABLE TRIGGER c_settings_history;
ALTER TABLE public.payment_options ENABLE TRIGGER c_settings_history;
ALTER TABLE public.volunteer_settings ENABLE TRIGGER c_settings_history;
ALTER TABLE public.volunteer_form_commissions ENABLE TRIGGER c_settings_history;
ALTER TABLE public.crm_incentive_plans ENABLE TRIGGER c_settings_history;
-- ===== fix-2026-11-17-admin-role-check: keep only one has_role so admin checks work =====
DROP FUNCTION IF EXISTS public.has_role(uuid, text);
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';

-- ===== update-2026-11-18-admin-access.sql =====
-- RILOYD update (18 Nov 2026): Admin sees and opens every dashboard; admin sign-up is closed.
-- Safe to run more than once. Does not delete or change any data.

-- 1) Dashboards: Admin gets every staff dashboard (nothing hidden from Admin).
CREATE OR REPLACE FUNCTION public.my_dashboards()
RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE ds text[] := '{}'; dep text; v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN ARRAY[]::text[]; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role::text = 'admin') THEN
    ds := ARRAY['admin','crm','staff','my-volunteers','hr','support','finance','research','ventures','manpower','work'];
  END IF;
  IF to_regclass('public.crm_memberships') IS NOT NULL AND EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = v_uid AND active) THEN ds := array_append(ds, 'crm'); END IF;
  IF to_regclass('public.education_staff_access') IS NOT NULL AND EXISTS (SELECT 1 FROM public.education_staff_access WHERE user_id = v_uid AND active) THEN ds := array_append(ds, 'staff'); END IF;
  IF to_regclass('public.volunteers') IS NOT NULL AND EXISTS (SELECT 1 FROM public.volunteers WHERE employee_id = v_uid) THEN ds := array_append(ds, 'my-volunteers'); END IF;
  IF to_regclass('public.department_staff') IS NOT NULL THEN
    FOR dep IN SELECT DISTINCT department FROM public.department_staff WHERE user_id = v_uid AND active LOOP
      ds := array_append(ds, CASE WHEN dep = 'accounts' THEN 'finance' ELSE dep END);
    END LOOP;
  END IF;
  IF cardinality(ds) > 0 THEN ds := array_append(ds, 'work'); END IF;
  IF to_regclass('public.volunteers') IS NOT NULL AND EXISTS (SELECT 1 FROM public.volunteers WHERE user_id = v_uid AND status = 'active') THEN ds := array_append(ds, 'volunteer'); END IF;
  RETURN ARRAY(SELECT DISTINCT x FROM unnest(ds) x);
END $function$;
REVOKE ALL ON FUNCTION public.my_dashboards() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_dashboards() TO authenticated, service_role;

-- 2) My Volunteers: Admin counts as an active employee too.
CREATE OR REPLACE FUNCTION public.is_active_employee(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT _uid IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = _uid AND r.role::text = 'admin')
    OR EXISTS (SELECT 1 FROM public.education_staff_access s WHERE s.user_id = _uid AND s.active)
    OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = _uid AND m.active))
$function$;

-- 3) Nobody can make themself Admin from the website any more. New admins are added by an existing admin
--    (user_roles) or by the owner in the database.
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  RAISE EXCEPTION 'Admin sign-up is closed. An existing admin or the database owner adds new admins.' USING ERRCODE = '42501';
END $function$;
COMMENT ON FUNCTION public.claim_first_admin() IS 'Closed on purpose: admin accounts are added only by an existing admin or the database owner.';

NOTIFY pgrst, 'reload schema';

-- ===== update-2026-11-18-programme-payments.sql =====
-- RILOYD update (18 Nov 2026): transaction IDs from the Young Innovators, Prototype Funding and Funding Programme forms.
-- Safe to run more than once. Does not delete or change any data.

CREATE TABLE IF NOT EXISTS public.programme_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  programme text DEFAULT '' NOT NULL,
  application_id uuid,
  application_kind text,
  amount_paise integer NOT NULL,
  currency text DEFAULT 'INR' NOT NULL,
  payer_name text NOT NULL,
  payer_email text NOT NULL,
  payer_phone text DEFAULT '' NOT NULL,
  provider text DEFAULT 'zoho' NOT NULL,
  provider_payment_id text,
  provider_reference text,
  razorpay_order_id text,
  razorpay_payment_id text,
  status text DEFAULT 'created' NOT NULL,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
GRANT ALL ON public.programme_payments TO service_role;
GRANT SELECT ON public.programme_payments TO authenticated;
ALTER TABLE public.programme_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read programme payments" ON public.programme_payments;
CREATE POLICY "Admins read programme payments" ON public.programme_payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- One transaction ID can be used only once (rejected ones can be sent again).
DO $$ BEGIN
  IF NOT EXISTS (SELECT provider_reference FROM public.programme_payments WHERE provider_reference IS NOT NULL AND status <> 'failed' GROUP BY provider_reference HAVING count(*) > 1) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS programme_payments_reference_once ON public.programme_payments (provider_reference) WHERE provider_reference IS NOT NULL AND status <> 'failed';
  ELSE
    RAISE NOTICE 'Duplicate transaction IDs exist; unique index skipped. Reject the duplicates in Admin → Programme payments, then run this file again.';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS programme_payments_status_created ON public.programme_payments (status, created_at DESC);

NOTIFY pgrst, 'reload schema';

-- ===== update-2026-11-18-bde-bdm-default-access.sql =====
-- RILOYD update (18 Nov 2026): every active BDE/BDM gets both the Employee CRM and BDE/BDM referrals.
-- New accounts get this automatically from the website; this file fixes accounts made before.
-- Safe to run more than once. Adds missing access only; never changes or removes existing access.

-- 1) Referral access without CRM → add CRM membership + employee profile (referral code used as employee code).
INSERT INTO public.crm_memberships (user_id, role, manager_id, active)
SELECT s.user_id, s.designation,
       CASE WHEN EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = s.manager_id AND m.role = 'BDM' AND m.active) THEN s.manager_id END,
       true
FROM public.education_staff_access s
WHERE s.active AND s.designation IN ('BDE','BDM')
  AND NOT EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = s.user_id)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.crm_employee_profiles (user_id, employee_code, full_name, phone, designation, joining_date)
SELECT s.user_id, s.referral_code,
       coalesce(nullif(btrim(p.display_name), ''), split_part(u.email, '@', 1), s.referral_code), '', s.designation, current_date
FROM public.education_staff_access s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN public.profiles p ON p.id = s.user_id
WHERE s.active AND s.designation IN ('BDE','BDM')
  AND NOT EXISTS (SELECT 1 FROM public.crm_employee_profiles e WHERE e.user_id = s.user_id)
  AND NOT EXISTS (SELECT 1 FROM public.crm_employee_profiles e WHERE upper(e.employee_code) = upper(s.referral_code))
ON CONFLICT DO NOTHING;

-- 2) CRM BDE/BDM without referral access → add referral access (employee code used as referral code).
INSERT INTO public.education_staff_access (user_id, designation, referral_code, manager_id, active)
SELECT m.user_id, m.role, upper(regexp_replace(e.employee_code, '[^A-Za-z0-9-]', '', 'g')),
       CASE WHEN m.role = 'BDE' AND EXISTS (SELECT 1 FROM public.education_staff_access x WHERE x.user_id = m.manager_id AND x.designation = 'BDM' AND x.active) THEN m.manager_id END,
       true
FROM public.crm_memberships m
JOIN public.crm_employee_profiles e ON e.user_id = m.user_id
WHERE m.active AND m.role IN ('BDE','BDM')
  AND length(regexp_replace(e.employee_code, '[^A-Za-z0-9-]', '', 'g')) >= 3
  AND NOT EXISTS (SELECT 1 FROM public.education_staff_access s WHERE s.user_id = m.user_id)
  AND NOT EXISTS (SELECT 1 FROM public.education_staff_access s WHERE upper(s.referral_code) = upper(regexp_replace(e.employee_code, '[^A-Za-z0-9-]', '', 'g')))
ON CONFLICT DO NOTHING;
