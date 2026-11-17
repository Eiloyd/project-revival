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
CREATE POLICY pay_settings_read ON public.crm_pay_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.hr_or_finance()
         OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = auth.uid() AND m.active));
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
CREATE POLICY reward_schemes_read ON public.volunteer_reward_schemes FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
  OR created_by = auth.uid()
  OR created_by = ANY(public.crm_team_ids(auth.uid()))                                   -- a BDM sees their BDEs' schemes
  OR public.reward_scheme_for_employee(audience, created_by, auth.uid())                  -- an employee sees schemes that cover their volunteers
  OR (status = 'active' AND EXISTS (SELECT 1 FROM public.volunteers v WHERE v.user_id = auth.uid() AND v.status = 'active'
        AND public.reward_scheme_for_employee(audience, created_by, v.employee_id)))
);
DROP POLICY IF EXISTS reward_schemes_insert ON public.volunteer_reward_schemes;
CREATE POLICY reward_schemes_insert ON public.volunteer_reward_schemes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (public.has_role(auth.uid(), 'admin') OR public.crm_sales_role(auth.uid()) IS NOT NULL));
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
CREATE TRIGGER volunteer_reward_scheme_announce AFTER INSERT OR UPDATE OF status ON public.volunteer_reward_schemes
  FOR EACH ROW EXECUTE FUNCTION public.volunteer_reward_scheme_announce();
REVOKE ALL ON FUNCTION public.volunteer_reward_scheme_guard(), public.volunteer_reward_scheme_announce() FROM PUBLIC, anon, authenticated;

-- Done. Quick checks:
--   SELECT * FROM public.crm_pay_settings;
--   SELECT min_withdrawal FROM public.volunteer_settings;          -- 3000 or more
--   SELECT jobname, schedule FROM cron.job WHERE jobname = 'crm-zero-collection-nudge';
