-- RILOYD update (18 Nov 2026): sales hierarchy, team targets and Support hand-off.
--   SSM (Senior Sales Manager) → SM (Sales Manager) → ASM (Assistant Sales Manager) → BDM → BDE → JBDE
--   Volunteers stay linked to the employee who added them (ASM, BDM or BDE).
--   Everyone sees their whole down-line in the CRM; Admin sees everything.
--   Targets: Admin sets/changes any target; a senior in the person's reporting line may set it or RAISE it, never lower it.
--   A Won lead with a verified (Accounts-checked) payment is forwarded by the BDE or a senior to the Support desk.
-- Safe to run more than once. Existing BDE/BDM data and access are kept.

-- ─── 1. Roles ────────────────────────────────────────────────────────────────
ALTER TABLE public.crm_memberships DROP CONSTRAINT IF EXISTS crm_memberships_role_check;
ALTER TABLE public.crm_memberships ADD CONSTRAINT crm_memberships_role_check
  CHECK (role IN ('sales','support','SSM','SM','ASM','BDM','BDE','JBDE'));

-- 1 = most senior. NULL for roles outside the sales ladder.
CREATE OR REPLACE FUNCTION public.crm_rank(_role text) RETURNS integer LANGUAGE sql IMMUTABLE SET search_path=public AS $$
  SELECT CASE _role WHEN 'SSM' THEN 1 WHEN 'SM' THEN 2 WHEN 'ASM' THEN 3 WHEN 'BDM' THEN 4 WHEN 'BDE' THEN 5 WHEN 'JBDE' THEN 6 END
$$;
-- The role a person must report to.
CREATE OR REPLACE FUNCTION public.crm_senior_role(_role text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public AS $$
  SELECT CASE _role WHEN 'SM' THEN 'SSM' WHEN 'ASM' THEN 'SM' WHEN 'BDM' THEN 'ASM' WHEN 'BDE' THEN 'BDM' WHEN 'JBDE' THEN 'BDE' END
$$;

-- Everyone above a person (manager, manager's manager, …). Walks up by primary key, so it is cheap inside access rules.
CREATE OR REPLACE FUNCTION public.crm_upline(_user uuid) RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH RECURSIVE u(uid, depth) AS (
    SELECT m.manager_id, 1 FROM public.crm_memberships m WHERE m.user_id = _user AND m.manager_id IS NOT NULL
    UNION ALL
    SELECT m.manager_id, u.depth + 1 FROM public.crm_memberships m JOIN u ON m.user_id = u.uid
    WHERE m.manager_id IS NOT NULL AND u.depth < 10
  ) SELECT coalesce(array_agg(uid), '{}'::uuid[]) FROM u WHERE uid IS DISTINCT FROM _user
$$;

-- Everyone below a person (active members only; the chain is followed through inactive managers too).
CREATE OR REPLACE FUNCTION public.crm_downline(_user uuid) RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH RECURSIVE d(uid, active, depth) AS (
    SELECT m.user_id, m.active, 1 FROM public.crm_memberships m WHERE m.manager_id = _user AND m.user_id <> _user
    UNION ALL
    SELECT m.user_id, m.active, d.depth + 1 FROM public.crm_memberships m JOIN d ON m.manager_id = d.uid WHERE d.depth < 10
  ) SELECT coalesce(array_agg(DISTINCT uid), '{}'::uuid[]) FROM d WHERE active AND uid <> _user
$$;

REVOKE ALL ON FUNCTION public.crm_upline(uuid), public.crm_downline(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_upline(uuid), public.crm_downline(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.crm_rank(text), public.crm_senior_role(text) TO authenticated, service_role;

-- ─── 2. Who can see whose records: self + whole down-line (admin: all) ───────
CREATE OR REPLACE FUNCTION public.crm_can_access(_owner uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN public.has_role(auth.uid(), 'admin') THEN true
    WHEN _owner IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.crm_memberships me
      WHERE me.user_id = auth.uid() AND me.active
        AND (_owner = auth.uid() OR (me.role <> 'support' AND auth.uid() = ANY(public.crm_upline(_owner)))))
  END
$$;

-- Sales roles (attendance/collection rules apply to all of them) and team = self + down-line.
CREATE OR REPLACE FUNCTION public.crm_sales_role(_user uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT role FROM public.crm_memberships WHERE user_id = _user AND active AND role IN ('SSM','SM','ASM','BDM','BDE','JBDE') LIMIT 1
$$;
CREATE OR REPLACE FUNCTION public.crm_team_ids(_user uuid) RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT CASE WHEN public.crm_sales_role(_user) IS NOT NULL THEN array_prepend(_user, public.crm_downline(_user)) ELSE ARRAY[_user] END
$$;

-- A verified collection marks the collector and every senior above them present (team basis).
CREATE OR REPLACE FUNCTION public.crm_collection_attendance_sync() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid;
BEGIN
  IF NEW.status <> 'verified' OR (TG_OP = 'UPDATE' AND OLD.status = 'verified') THEN RETURN NEW; END IF;
  FOR u IN SELECT NEW.owner_id UNION SELECT unnest(public.crm_upline(NEW.owner_id)) LOOP
    IF u IS NULL OR public.crm_sales_role(u) IS NULL OR NOT public.crm_collection_present(u, NEW.collected_on) THEN CONTINUE; END IF;
    INSERT INTO public.attendance_records (user_id, day, status, note)
    VALUES (u, NEW.collected_on, 'present', 'Present — verified collection recorded')
    ON CONFLICT (user_id, day) DO UPDATE
      SET status = CASE WHEN public.attendance_records.status IN ('leave', 'holiday', 'wfh') THEN public.attendance_records.status ELSE 'present' END,
          note = CASE WHEN public.attendance_records.status IN ('leave', 'holiday', 'wfh') THEN public.attendance_records.note ELSE 'Present — verified collection recorded' END,
          updated_at = now();
  END LOOP;
  RETURN NEW;
END $$;

-- ─── 3. Onboarding: each role reports to the role directly above it ─────────
CREATE OR REPLACE FUNCTION public.crm_onboard_member(_user_id uuid, _input jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _role text := _input->>'role'; _manager uuid := nullif(coalesce(_input->>'managerId', ''), '')::uuid;
  _code text := upper(btrim(coalesce(_input->>'employeeCode', ''))); _need text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF _user_id IS NULL OR _role IS NULL OR _role NOT IN ('sales','support','SSM','SM','ASM','BDM','BDE','JBDE') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF _code = '' OR btrim(coalesce(_input->>'fullName', '')) = '' THEN RAISE EXCEPTION 'Employee code and name are required'; END IF;
  _need := CASE WHEN public.crm_rank(_role) IS NULL THEN 'BDM' ELSE public.crm_senior_role(_role) END;
  IF _manager IS NOT NULL THEN
    IF _need IS NULL THEN RAISE EXCEPTION 'An SSM reports to the admin, not to a manager'; END IF;
    IF _manager = _user_id OR NOT EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = _manager AND active AND role = _need) THEN
      RAISE EXCEPTION 'Manager must be an active %', _need;
    END IF;
    IF _user_id = ANY(public.crm_upline(_manager)) THEN RAISE EXCEPTION 'This would make a loop in the reporting line'; END IF;
  END IF;
  INSERT INTO public.crm_memberships (user_id, role, manager_id, active)
  VALUES (_user_id, _role, _manager, coalesce((_input->>'active')::boolean, true))
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, manager_id = EXCLUDED.manager_id, active = EXCLUDED.active;
  INSERT INTO public.crm_employee_profiles (user_id, employee_code, full_name, phone, designation, photo_url, joining_date)
  VALUES (_user_id, _code, btrim(_input->>'fullName'), btrim(coalesce(_input->>'phone', '')), btrim(coalesce(_input->>'designation', '')),
    nullif(btrim(coalesce(_input->>'photoUrl', '')), ''), coalesce(nullif(coalesce(_input->>'joiningDate', ''), '')::date, current_date))
  ON CONFLICT (user_id) DO UPDATE SET employee_code = EXCLUDED.employee_code, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone,
    designation = EXCLUDED.designation, photo_url = EXCLUDED.photo_url, joining_date = EXCLUDED.joining_date;
END $$;

-- ─── 4. Leads, customers, collections: down-line scope for every manager ────
CREATE OR REPLACE FUNCTION public.crm_is_manager_role(_role text) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$
  SELECT _role IN ('admin','SSM','SM','ASM','BDM','BDE')
$$;
GRANT EXECUTE ON FUNCTION public.crm_is_manager_role(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.crm_create_lead(_input jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r text; owner uuid; c uuid; l uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 r:=public.crm_role(); owner:=(_input->>'ownerId')::uuid;
 IF r IS NULL OR r='support' THEN RAISE EXCEPTION 'Sales access required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.crm_memberships WHERE user_id=owner AND active AND role<>'support') THEN RAISE EXCEPTION 'Invalid owner'; END IF;
 IF r<>'admin' AND NOT public.crm_can_access(owner) THEN RAISE EXCEPTION 'Owner outside scope'; END IF;
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
 AND (r IN ('admin','support') OR public.crm_can_access(c.owner_id));
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.crm_assign_lead(_lead uuid, _owner uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _role text := public.crm_role(); _current uuid; _customer uuid;
BEGIN
  IF _role IS NULL OR NOT public.crm_is_manager_role(_role) THEN RAISE EXCEPTION 'Only an admin or a manager can reassign leads' USING ERRCODE = '42501'; END IF;
  SELECT owner_id, customer_id INTO _current, _customer FROM public.crm_leads WHERE id = _lead FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  IF _role <> 'admin' AND (NOT public.crm_can_access(_current) OR _owner IS NULL OR NOT public.crm_can_access(_owner)) THEN
    RAISE EXCEPTION 'Lead and employee must be in your team' USING ERRCODE = '42501';
  END IF;
  IF _owner IS NOT NULL AND NOT public.has_role(_owner, 'admin') AND NOT EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = _owner AND active) THEN
    RAISE EXCEPTION 'Employee is not active';
  END IF;
  UPDATE public.crm_leads SET owner_id = _owner, updated_at = now() WHERE id = _lead;
  UPDATE public.crm_customers SET owner_id = _owner WHERE id = _customer AND (owner_id IS NULL OR owner_id IS NOT DISTINCT FROM _current);
END $$;

CREATE OR REPLACE FUNCTION public.crm_reassign_leads(_leads uuid[], _owner uuid, _reason text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l crm_leads; n integer:=0;
BEGIN
 IF auth.uid() IS NULL OR NOT public.crm_is_manager_role(coalesce(crm_role(),'')) OR NOT crm_can_access(_owner) OR length(trim(_reason))<3 THEN RAISE EXCEPTION 'Manager access and reason required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM crm_memberships WHERE user_id=_owner AND active) THEN RAISE EXCEPTION 'Inactive owner'; END IF;
 FOR l IN SELECT * FROM crm_leads WHERE id=ANY(_leads) FOR UPDATE LOOP
  IF NOT crm_can_access(l.owner_id) AND NOT (crm_role()='admin') THEN RAISE EXCEPTION 'Lead outside your team'; END IF;
  IF l.owner_id IS DISTINCT FROM _owner THEN
   INSERT INTO crm_lead_assignments(lead_id,from_owner,to_owner,changed_by,reason) VALUES(l.id,l.owner_id,_owner,auth.uid(),_reason);
   UPDATE crm_leads SET owner_id=_owner,updated_at=now() WHERE id=l.id; n:=n+1;
  END IF;
 END LOOP; RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.crm_record_collection(_lead uuid, _owner uuid, _amount numeric, _date date, _mode text, _reference text, _payer text, _note text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_owner uuid:=_owner; v_lead_owner uuid; v_code text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF NOT public.has_role(auth.uid(),'admin') AND public.crm_sales_role(auth.uid()) IS NULL THEN RAISE EXCEPTION 'Sales access required'; END IF;
 IF _lead IS NOT NULL THEN
  SELECT owner_id INTO v_lead_owner FROM public.crm_leads WHERE id=_lead;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  v_owner:=coalesce(v_owner,v_lead_owner);
  IF v_lead_owner IS NOT NULL AND v_owner IS DISTINCT FROM v_lead_owner THEN RAISE EXCEPTION 'Collection owner must match lead owner'; END IF;
 END IF;
 v_owner:=coalesce(v_owner,auth.uid());
 IF public.crm_sales_role(v_owner) IS NULL THEN RAISE EXCEPTION 'Active sales owner required'; END IF;
 IF NOT public.has_role(auth.uid(),'admin') AND NOT public.crm_can_access(v_owner) THEN RAISE EXCEPTION 'Owner outside your team'; END IF;
 IF _date IS NULL OR _date>(now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Valid collection date required'; END IF;
 IF _mode<>'cash' AND nullif(trim(_reference),'') IS NULL THEN RAISE EXCEPTION 'Payment reference required'; END IF;
 IF length(_reference)>80 OR length(_payer)>120 OR length(_note)>500 THEN RAISE EXCEPTION 'Collection text too long'; END IF;
 INSERT INTO public.crm_collections(lead_id,owner_id,amount,collected_on,mode,reference,payer_name,note,recorded_by)
 VALUES(_lead,v_owner,_amount,_date,_mode,coalesce(_reference,''),coalesce(_payer,''),coalesce(_note,''),auth.uid()) RETURNING code INTO v_code;
 RETURN v_code;
END $$;

DROP POLICY IF EXISTS "CRM sales create customers" ON public.crm_customers;
CREATE POLICY "CRM sales create customers" ON public.crm_customers FOR INSERT TO authenticated
  WITH CHECK (crm_role() = ANY (ARRAY['admin','sales','SSM','SM','ASM','BDM','BDE','JBDE']) AND crm_can_access(owner_id));
DROP POLICY IF EXISTS "CRM sales create leads" ON public.crm_leads;
CREATE POLICY "CRM sales create leads" ON public.crm_leads FOR INSERT TO authenticated
  WITH CHECK (crm_role() = ANY (ARRAY['admin','sales','SSM','SM','ASM','BDM','BDE','JBDE']) AND crm_can_access(owner_id));
DROP POLICY IF EXISTS finance_read ON public.crm_collections;
CREATE POLICY finance_read ON public.crm_collections FOR SELECT TO authenticated
  USING (public.fin_access() OR owner_id = auth.uid() OR public.crm_can_access(owner_id));
DROP POLICY IF EXISTS g4_write ON public.crm_coaching_notes;
CREATE POLICY g4_write ON public.crm_coaching_notes FOR ALL TO authenticated
  USING (coach_id = auth.uid() AND public.crm_is_manager_role(coalesce(public.crm_role(),'')) AND public.crm_can_access(employee_id))
  WITH CHECK (coach_id = auth.uid() AND public.crm_is_manager_role(coalesce(public.crm_role(),'')) AND public.crm_can_access(employee_id));

-- ─── 5. Targets: admin any change; a senior may set or raise, never lower ────
-- Direct table writes are admin-only; everyone else goes through target_set (rules + history).
DROP POLICY IF EXISTS "Managers set targets" ON public.crm_targets;
DROP POLICY IF EXISTS "Managers update targets" ON public.crm_targets;
CREATE POLICY "Managers set targets" ON public.crm_targets FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Managers update targets" ON public.crm_targets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.target_set(_calls integer,_month date,_owner uuid,_revenue numeric,_wins integer,_reason text DEFAULT '') RETURNS public.target_revisions
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE old crm_targets; r target_revisions; m date:=date_trunc('month',_month)::date; who text:=crm_role();
BEGIN
 IF auth.uid() IS NULL OR who IS NULL THEN RAISE EXCEPTION 'CRM access required'; END IF;
 IF who <> 'admin' THEN
  IF _owner = auth.uid() THEN RAISE EXCEPTION 'You cannot set your own target. Your senior or the admin sets it.'; END IF;
  IF NOT (auth.uid() = ANY(crm_upline(_owner))) THEN RAISE EXCEPTION 'Only a senior in this person''s reporting line (or the admin) can set their target.'; END IF;
 END IF;
 IF _calls<0 OR _revenue<0 OR _wins<0 THEN RAISE EXCEPTION 'Targets must be nonnegative'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_owner::text||m::text,0));
 SELECT * INTO old FROM crm_targets WHERE owner_id=_owner AND month=m FOR UPDATE;
 IF old.id IS NOT NULL AND who <> 'admin' AND (_revenue<old.revenue_target OR _wins<old.wins_target OR _calls<old.calls_target) THEN
  RAISE EXCEPTION 'A senior can only increase a target, never reduce it. Ask the admin to lower it.';
 END IF;
 IF old.id IS NOT NULL AND length(trim(_reason))<3 THEN RAISE EXCEPTION 'Revision reason required'; END IF;
 INSERT INTO crm_targets(owner_id,month,calls_target,revenue_target,wins_target) VALUES(_owner,m,_calls,_revenue,_wins)
 ON CONFLICT(owner_id,month) DO UPDATE SET calls_target=excluded.calls_target,revenue_target=excluded.revenue_target,wins_target=excluded.wins_target;
 INSERT INTO target_revisions(action,changed_by,changed_by_name,changed_by_role,month,new_calls,new_revenue,new_wins,old_calls,old_revenue,old_wins,owner_id,reason)
 VALUES(CASE WHEN old.id IS NULL THEN 'created' ELSE 'revised' END,auth.uid(),person_name(auth.uid()),who,m,_calls,_revenue,_wins,old.calls_target,old.revenue_target,old.wins_target,_owner,_reason) RETURNING * INTO r; RETURN r;
END $$;

-- ─── 6. Team volunteers (safe columns only, no KYC/payout details) ──────────
CREATE OR REPLACE FUNCTION public.crm_team_volunteers()
RETURNS TABLE(id uuid, volunteer_code text, full_name text, mobile text, district text, state text, status text, kyc_status text, employee_id uuid, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE who text := public.crm_role();
BEGIN
 IF auth.uid() IS NULL OR who IS NULL THEN RAISE EXCEPTION 'CRM access required' USING ERRCODE = '42501'; END IF;
 RETURN QUERY SELECT v.id, v.volunteer_code, v.full_name, v.mobile, v.district, v.state, v.status, v.kyc_status, v.employee_id, v.created_at
   FROM public.volunteers v
  WHERE who = 'admin' OR v.employee_id = auth.uid() OR (who <> 'support' AND auth.uid() = ANY(public.crm_upline(v.employee_id)))
  ORDER BY v.created_at DESC LIMIT 5000;
END $$;
REVOKE ALL ON FUNCTION public.crm_team_volunteers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_team_volunteers() TO authenticated, service_role;

-- ─── 7. Won + paid lead → Support desk ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_support_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.customer_tickets(id) ON DELETE SET NULL,
  ticket_code text NOT NULL DEFAULT '',
  forwarded_by uuid NOT NULL REFERENCES auth.users(id),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crm_support_handoffs TO authenticated;
GRANT ALL ON public.crm_support_handoffs TO service_role;
ALTER TABLE public.crm_support_handoffs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS handoff_read ON public.crm_support_handoffs;
CREATE POLICY handoff_read ON public.crm_support_handoffs FOR SELECT TO authenticated
  USING (public.crm_role() IN ('admin','support') OR EXISTS (SELECT 1 FROM public.crm_leads l WHERE l.id = lead_id AND public.crm_can_access(l.owner_id)));
-- No insert/update policies: rows are written only by crm_forward_to_support.

CREATE OR REPLACE FUNCTION public.crm_forward_to_support(_lead uuid, _note text DEFAULT '') RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE who text := public.crm_role(); l crm_leads; c crm_customers; paid numeric; t_id uuid; t_code text;
BEGIN
 IF auth.uid() IS NULL OR who IS NULL OR (who <> 'admin' AND coalesce(public.crm_rank(who), 99) > 5) THEN
   RAISE EXCEPTION 'Only a BDE or a senior can forward a lead to Support' USING ERRCODE = '42501'; END IF;
 IF length(coalesce(_note,'')) > 1000 THEN RAISE EXCEPTION 'Note is too long'; END IF;
 SELECT * INTO l FROM public.crm_leads WHERE id = _lead FOR UPDATE;
 IF NOT FOUND OR (who <> 'admin' AND NOT public.crm_can_access(l.owner_id)) THEN RAISE EXCEPTION 'Lead not found in your team'; END IF;
 IF l.stage <> 'won' THEN RAISE EXCEPTION 'Move the lead to Won first'; END IF;
 SELECT coalesce(sum(amount), 0) INTO paid FROM public.crm_collections WHERE lead_id = _lead AND status = 'verified';
 IF paid <= 0 THEN RAISE EXCEPTION 'Payment is not confirmed yet: Accounts must verify a collection for this lead first'; END IF;
 IF EXISTS (SELECT 1 FROM public.crm_support_handoffs WHERE lead_id = _lead) THEN RAISE EXCEPTION 'This lead was already forwarded to Support'; END IF;
 SELECT * INTO c FROM public.crm_customers WHERE id = l.customer_id;
 INSERT INTO public.customer_tickets (ticket_code, full_name, email, phone, customer_reference, category, priority, subject, description, channel, request_type)
 VALUES ('', coalesce(c.full_name, 'Customer'), coalesce(c.email, ''), coalesce(c.phone, ''), coalesce(c.acknowledgement, c.customer_code), 'service', 'high',
   left('Won deal: ' || l.title, 200),
   left(concat_ws(E'\n', 'Forwarded from the sales CRM after payment confirmation.',
     'Deal: ' || l.title, 'Deal value: Rs. ' || l.amount::text, 'Verified payment: Rs. ' || paid::text,
     'Customer ID: ' || coalesce(c.customer_code, '—'), 'Company: ' || coalesce(nullif(c.company, ''), '—'),
     'Sales owner: ' || coalesce(public.person_name(l.owner_id), '—'), 'Forwarded by: ' || public.person_name(auth.uid()),
     CASE WHEN nullif(trim(_note), '') IS NOT NULL THEN 'Note: ' || trim(_note) END), 3000),
   'crm', 'general')
 RETURNING id, ticket_code INTO t_id, t_code;
 INSERT INTO public.crm_support_handoffs (lead_id, ticket_id, ticket_code, forwarded_by, note) VALUES (_lead, t_id, t_code, auth.uid(), coalesce(trim(_note), ''));
 INSERT INTO public.crm_activities (owner_id, actor_id, lead_id, kind, body)
 VALUES (coalesce(l.owner_id, auth.uid()), auth.uid(), _lead, 'note', 'Forwarded to Support desk — ticket ' || t_code || coalesce('. ' || nullif(trim(_note), ''), ''));
 RETURN t_code;
END $$;
REVOKE ALL ON FUNCTION public.crm_forward_to_support(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_forward_to_support(uuid, text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
