CREATE TABLE IF NOT EXISTS public.department_staff (user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, department text NOT NULL CHECK (department IN ('hr','support','accounts','finance','research')), level text NOT NULL DEFAULT 'executive' CHECK (level IN ('executive','manager')), approval_limit numeric CHECK (approval_limit >= 0), active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,department));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_staff TO authenticated, service_role;
ALTER TABLE public.department_staff ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY recon_read ON public.request_routes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS recon_write ON public.request_routes; CREATE POLICY recon_write ON public.request_routes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.leave_policies (leave_type text PRIMARY KEY, label text NOT NULL, days_per_year numeric NOT NULL CHECK(days_per_year BETWEEN 0 AND 366), sort_order integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_policies TO authenticated, service_role;
ALTER TABLE public.leave_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.leave_policies;
CREATE POLICY recon_read ON public.leave_policies FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS recon_write ON public.leave_policies; CREATE POLICY recon_write ON public.leave_policies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.leave_policies(leave_type,label,days_per_year,sort_order) VALUES ('casual','Casual leave',12,1),('sick','Sick leave',12,2),('earned','Earned leave',15,3),('unpaid','Unpaid leave',0,4) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, type text NOT NULL REFERENCES public.request_routes(type), title text NOT NULL, description text NOT NULL DEFAULT '', applicant_id uuid NOT NULL REFERENCES auth.users(id), applicant_name text NOT NULL, applicant_role text NOT NULL, manager_id uuid REFERENCES auth.users(id), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled','resolved','paid')), steps text[] NOT NULL, step_index integer NOT NULL DEFAULT 0 CHECK(step_index >= 0), current_step text, from_date date, to_date date, days numeric, amount numeric CHECK(amount > 0), details jsonb NOT NULL DEFAULT '{}', priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')), resolution text NOT NULL DEFAULT '', transaction_ref text NOT NULL DEFAULT '', proof_path text NOT NULL DEFAULT '', due_at timestamptz, escalated_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(to_date IS NULL OR to_date >= from_date));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated, service_role;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY recon_read ON public.request_events FOR SELECT TO authenticated USING (public._request_visible(request_id));

CREATE TABLE IF NOT EXISTS public.request_attachments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE, uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id), file_path text NOT NULL UNIQUE, file_name text NOT NULL, file_size bigint NOT NULL CHECK(file_size BETWEEN 0 AND 10485760), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_attachments TO authenticated, service_role;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.request_attachments;
CREATE POLICY recon_read ON public.request_attachments FOR SELECT TO authenticated USING (public._request_visible(request_id));

DROP POLICY IF EXISTS recon_insert ON public.request_attachments; CREATE POLICY recon_insert ON public.request_attachments FOR INSERT TO authenticated WITH CHECK(uploaded_by=auth.uid() AND public._request_visible(request_id) AND split_part(file_path,'/',1)=request_id::text);

CREATE TABLE IF NOT EXISTS public.audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES auth.users(id), action text NOT NULL, entity text NOT NULL, entity_id text NOT NULL DEFAULT '', details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated, service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.audit_logs;
CREATE POLICY recon_read ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, kind text NOT NULL DEFAULT 'info', title text NOT NULL, body text NOT NULL DEFAULT '', link text NOT NULL DEFAULT '', read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated, service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.notifications;
CREATE POLICY recon_read ON public.notifications FOR SELECT TO authenticated USING (user_id=auth.uid());

CREATE TABLE IF NOT EXISTS public.attendance_records (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id), day date NOT NULL, status text NOT NULL DEFAULT 'present' CHECK(status IN ('present','wfh','leave','half_day','absent','holiday')), check_in timestamptz, check_out timestamptz, note text NOT NULL DEFAULT '', request_id uuid REFERENCES public.requests(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,day), CHECK(check_out IS NULL OR (check_in IS NOT NULL AND check_out>=check_in)));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated, service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.attendance_records;
CREATE POLICY recon_read ON public.attendance_records FOR SELECT TO authenticated USING (public._work_team(user_id));

CREATE TABLE IF NOT EXISTS public.volunteer_availability (volunteer_id uuid PRIMARY KEY REFERENCES public.volunteers(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'available' CHECK(status IN ('available','busy','unavailable')), days text[] NOT NULL DEFAULT '{}', hours text NOT NULL DEFAULT '', note text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_availability TO authenticated, service_role;
ALTER TABLE public.volunteer_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.volunteer_availability;
CREATE POLICY recon_read ON public.volunteer_availability FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.volunteers v WHERE v.id=volunteer_id AND public._work_team(v.user_id)));

CREATE TABLE IF NOT EXISTS public.meetings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organizer_id uuid NOT NULL REFERENCES auth.users(id), title text NOT NULL, agenda text NOT NULL DEFAULT '', starts_at timestamptz NOT NULL, duration_min integer NOT NULL DEFAULT 30 CHECK(duration_min BETWEEN 5 AND 480), location text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','done','cancelled')), minutes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated, service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recon_read ON public.meetings;
CREATE POLICY recon_read ON public.meetings FOR SELECT TO authenticated USING (organizer_id=auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.meeting_attendees (meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES auth.users(id), response text NOT NULL DEFAULT 'pending' CHECK(response IN ('pending','accepted','declined')), PRIMARY KEY(meeting_id,user_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_attendees TO authenticated, service_role;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY recon_request_files_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='request-files' AND EXISTS(SELECT 1 FROM public.requests r WHERE r.id::text=split_part(name,'/',1) AND public._request_visible(r.id)));
DROP POLICY IF EXISTS recon_request_files_insert ON storage.objects;
CREATE POLICY recon_request_files_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='request-files' AND EXISTS(SELECT 1 FROM public.requests r WHERE r.id::text=split_part(name,'/',1) AND public._request_visible(r.id)));