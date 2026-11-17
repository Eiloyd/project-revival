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
CREATE POLICY g4_read ON public.crm_coaching_notes FOR SELECT TO authenticated USING (employee_id=auth.uid() OR public.crm_can_access(employee_id));
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
CREATE POLICY g4_read ON public.crm_daily_reports FOR SELECT TO authenticated USING (public.crm_can_access(owner_id));
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
CREATE POLICY g4_read ON public.crm_documents FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.crm_customers c WHERE c.id=customer_id AND public.crm_can_access(c.owner_id)));
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
CREATE POLICY g4_read ON public.crm_lead_assignments FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.crm_leads l WHERE l.id=lead_id AND public.crm_can_access(l.owner_id)));
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
CREATE POLICY g4_read ON public.crm_manufacturers FOR SELECT TO authenticated USING (public.crm_can_access(owner_id));
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
CREATE POLICY g4_read ON public.target_revisions FOR SELECT TO authenticated USING (public.crm_can_access(owner_id));
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
CREATE POLICY g4_read ON public.customer_ticket_events FOR SELECT TO authenticated USING (public.c_department_access('support'));
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
CREATE POLICY g4_read ON public.support_kb_articles FOR SELECT TO authenticated USING (public.c_department_access('support'));
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
CREATE POLICY g4_read ON public.user_activity_logs FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
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
CREATE POLICY g4_read ON public.volunteer_verify_codes FOR SELECT TO authenticated USING (false);
DROP POLICY IF EXISTS g4_write ON public.volunteer_verify_codes;
CREATE POLICY g4_write ON public.volunteer_verify_codes FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE TABLE IF NOT EXISTS public.work_request_counters (
 last_serial integer NOT NULL DEFAULT 0,
 period text NOT NULL PRIMARY KEY
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.work_request_counters TO authenticated,service_role;
ALTER TABLE public.work_request_counters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS g4_read ON public.work_request_counters;
CREATE POLICY g4_read ON public.work_request_counters FOR SELECT TO authenticated USING (false);
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
CREATE TRIGGER g4_ticket_history AFTER INSERT OR UPDATE ON public.customer_tickets FOR EACH ROW EXECUTE FUNCTION public.g4_ticket_history();
CREATE OR REPLACE FUNCTION public.g4_refund_sync() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status IS DISTINCT FROM OLD.status THEN
  UPDATE customer_tickets SET finance_status=CASE WHEN NEW.status='pending' THEN 'sent' ELSE NEW.status END WHERE finance_request_id=NEW.id;
 END IF; RETURN NEW;
END $$;
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