-- RILOYD: Volunteer programme.
-- Employees create volunteers (permanent ownership), volunteers share referral links, commission is
-- calculated automatically from referred forms, and volunteers request withdrawals that only admins can pay.
-- Safe to run more than once. Run in Supabase -> SQL editor on a database already set up with schema.sql.

-- ===== 1) Who is an employee =====
CREATE OR REPLACE FUNCTION public.is_active_employee(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _uid IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.education_staff_access s WHERE s.user_id = _uid AND s.active)
    OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = _uid AND m.active))
$$;

CREATE SEQUENCE IF NOT EXISTS public.volunteer_number_seq;
CREATE SEQUENCE IF NOT EXISTS public.volunteer_withdrawal_seq;
CREATE SEQUENCE IF NOT EXISTS public.volunteer_ticket_seq;

-- ===== 2) Tables =====
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

-- Bank / UPI details: readable only by the volunteer and admins.
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

-- One row of programme settings, changed only by admins.
CREATE TABLE IF NOT EXISTS public.volunteer_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  max_percent numeric(4,2) NOT NULL DEFAULT 10 CHECK (max_percent >= 0 AND max_percent <= 10),
  min_withdrawal integer NOT NULL DEFAULT 3000 CHECK (min_withdrawal BETWEEN 1 AND 1000000),
  payout_note text NOT NULL DEFAULT '' CHECK (char_length(payout_note) <= 300),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.volunteer_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- Commission per form: a percentage of the form fee (up to the cap) plus an optional flat amount.
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

-- Commission ledger: written only by the system; nobody can delete it.
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

-- Messages, announcements and automatic status updates shown in the volunteer's notification centre.
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

-- ===== 3) Access helpers =====
-- 'admin', 'self' (the volunteer), 'employee' (the active employee who owns the volunteer) or NULL.
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

-- Credited commission minus every withdrawal that is waiting, being processed or paid.
CREATE OR REPLACE FUNCTION public.volunteer_available_balance(_volunteer uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT sum(amount) FROM public.volunteer_commissions WHERE volunteer_id = _volunteer AND status = 'credited'), 0)
       - coalesce((SELECT sum(amount) FROM public.volunteer_withdrawals WHERE volunteer_id = _volunteer AND status IN ('pending', 'processing', 'paid')), 0)
$$;

-- ===== 4) Volunteer record protection =====
-- Runs as the caller (SECURITY INVOKER) so trusted database roles (SQL editor, server key) count as admin,
-- while website users are checked by their own admin role.
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
CREATE TRIGGER volunteers_guard BEFORE INSERT OR UPDATE ON public.volunteers FOR EACH ROW EXECUTE FUNCTION public.volunteers_guard();

-- ===== 5) Automatic commission from referred forms =====
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

-- ===== 6) Actions (each checks who is calling) =====
-- Volunteer signs in with the email the employee registered, then activates the account.
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

-- The volunteer marks their KYC documents as uploaded; only an admin can then verify or reject.
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

-- Employees may add payout details only once (at registration) so they can never redirect a volunteer's money.
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

-- Only admins (finance) move a withdrawal forward; paid needs a transaction ID, rejected needs a reason.
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

-- Staff resolve or escalate; the volunteer can reopen a resolved ticket.
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

-- Referred applications without contact, KYC or bank details. Young Innovators are minors: first name + initial only.
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

-- Referral codes of volunteers also route website leads to the owning employee in the CRM.
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

-- ===== 7) Table access and rules =====
GRANT USAGE ON SEQUENCE public.volunteer_number_seq TO authenticated, service_role;
GRANT ALL ON SEQUENCE public.volunteer_withdrawal_seq, public.volunteer_ticket_seq TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.volunteers TO authenticated;
GRANT SELECT ON public.volunteer_payout_details, public.volunteer_commissions, public.volunteer_withdrawals,
  public.volunteer_tickets, public.volunteer_ticket_messages, public.volunteer_notices TO authenticated;
GRANT SELECT, UPDATE ON public.volunteer_settings, public.volunteer_form_commissions TO authenticated;
GRANT ALL ON public.volunteers, public.volunteer_payout_details, public.volunteer_settings, public.volunteer_form_commissions,
  public.volunteer_commissions, public.volunteer_withdrawals, public.volunteer_tickets, public.volunteer_ticket_messages, public.volunteer_notices TO service_role;
-- Financial records cannot be deleted by anyone signed in.
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
CREATE POLICY "Volunteers visible to owner employee, self and admins" ON public.volunteers FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid() OR (employee_id = auth.uid() AND public.is_active_employee(auth.uid())));
DROP POLICY IF EXISTS "Employees create their own volunteers" ON public.volunteers;
CREATE POLICY "Employees create their own volunteers" ON public.volunteers FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid() AND (public.is_active_employee(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "Owner employee and admins edit volunteers" ON public.volunteers;
CREATE POLICY "Owner employee and admins edit volunteers" ON public.volunteers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR (employee_id = auth.uid() AND public.is_active_employee(auth.uid())))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (employee_id = auth.uid() AND public.is_active_employee(auth.uid())));

DROP POLICY IF EXISTS "Volunteer and admins read payout details" ON public.volunteer_payout_details;
CREATE POLICY "Volunteer and admins read payout details" ON public.volunteer_payout_details FOR SELECT TO authenticated
  USING (public.volunteer_access(volunteer_id) IN ('admin', 'self'));

DROP POLICY IF EXISTS "Signed-in users read volunteer settings" ON public.volunteer_settings;
CREATE POLICY "Signed-in users read volunteer settings" ON public.volunteer_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins change volunteer settings" ON public.volunteer_settings;
CREATE POLICY "Admins change volunteer settings" ON public.volunteer_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Signed-in users read commission rates" ON public.volunteer_form_commissions;
CREATE POLICY "Signed-in users read commission rates" ON public.volunteer_form_commissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins change commission rates" ON public.volunteer_form_commissions;
CREATE POLICY "Admins change commission rates" ON public.volunteer_form_commissions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Read own volunteer commissions" ON public.volunteer_commissions;
CREATE POLICY "Read own volunteer commissions" ON public.volunteer_commissions FOR SELECT TO authenticated USING (public.volunteer_access(volunteer_id) IS NOT NULL);
DROP POLICY IF EXISTS "Read own volunteer withdrawals" ON public.volunteer_withdrawals;
CREATE POLICY "Read own volunteer withdrawals" ON public.volunteer_withdrawals FOR SELECT TO authenticated USING (public.volunteer_access(volunteer_id) IS NOT NULL);
DROP POLICY IF EXISTS "Read own volunteer tickets" ON public.volunteer_tickets;
CREATE POLICY "Read own volunteer tickets" ON public.volunteer_tickets FOR SELECT TO authenticated USING (public.volunteer_access(volunteer_id) IS NOT NULL);
DROP POLICY IF EXISTS "Read own volunteer ticket messages" ON public.volunteer_ticket_messages;
CREATE POLICY "Read own volunteer ticket messages" ON public.volunteer_ticket_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.volunteer_tickets t WHERE t.id = ticket_id AND public.volunteer_access(t.volunteer_id) IS NOT NULL));
DROP POLICY IF EXISTS "Read own volunteer notices" ON public.volunteer_notices;
CREATE POLICY "Read own volunteer notices" ON public.volunteer_notices FOR SELECT TO authenticated USING (public.volunteer_access(volunteer_id) IS NOT NULL);

-- ===== 8) Function access =====
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

-- ===== 9) Private file folders: profile photos and KYC documents (folder name = volunteer id) =====
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('volunteer-photos', 'volunteer-photos', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
       ('volunteer-kyc', 'volunteer-kyc', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Volunteer photos upload" ON storage.objects;
CREATE POLICY "Volunteer photos upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'volunteer-photos' AND public.volunteer_folder_access(name) IS NOT NULL);
DROP POLICY IF EXISTS "Volunteer photos read" ON storage.objects;
CREATE POLICY "Volunteer photos read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'volunteer-photos' AND public.volunteer_folder_access(name) IS NOT NULL);
DROP POLICY IF EXISTS "Volunteer KYC upload" ON storage.objects;
CREATE POLICY "Volunteer KYC upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'volunteer-kyc' AND public.volunteer_folder_access(name) IS NOT NULL);
-- KYC documents: only the volunteer and admins can open them (not the employee).
DROP POLICY IF EXISTS "Volunteer KYC read" ON storage.objects;
CREATE POLICY "Volunteer KYC read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'volunteer-kyc' AND public.volunteer_folder_access(name) IN ('admin', 'self'));
DROP POLICY IF EXISTS "Admins delete volunteer files" ON storage.objects;
CREATE POLICY "Admins delete volunteer files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('volunteer-photos', 'volunteer-kyc') AND has_role(auth.uid(), 'admin'::app_role));
