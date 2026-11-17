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
CREATE TRIGGER g2_salary_change BEFORE INSERT OR UPDATE ON public.hr_salary_structures FOR EACH ROW EXECUTE FUNCTION public.g2_hr_change();
DROP TRIGGER IF EXISTS g2_exit_change ON public.hr_exits;
CREATE TRIGGER g2_exit_change BEFORE INSERT OR UPDATE ON public.hr_exits FOR EACH ROW EXECUTE FUNCTION public.g2_hr_change();
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