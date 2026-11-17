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
CREATE POLICY c_support_read ON public.customer_tickets FOR SELECT TO authenticated USING(public.c_department_access('support'));
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
CREATE POLICY c_settings_read ON public.global_settings FOR SELECT TO anon,authenticated USING(is_public OR public.has_role(auth.uid(),'admin'));
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
CREATE POLICY c_service_only ON public.integration_connections TO service_role USING(true) WITH CHECK(true);

CREATE TABLE IF NOT EXISTS public.integration_sync_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, action text NOT NULL DEFAULT 'sync', ok boolean NOT NULL, message text NOT NULL DEFAULT '', items integer NOT NULL DEFAULT 0 CHECK(items>=0), actor_id uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.integration_sync_logs TO service_role;
REVOKE ALL ON public.integration_sync_logs FROM anon,authenticated;
GRANT SELECT ON public.integration_sync_logs TO authenticated;
ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY c_bank_read ON public.research_leads FOR SELECT TO authenticated USING(public.c_department_access('research'));

CREATE TABLE IF NOT EXISTS public.research_request_leads (
 request_id uuid NOT NULL REFERENCES public.research_requests(id) ON DELETE CASCADE, lead_id uuid NOT NULL REFERENCES public.research_leads(id), reused boolean NOT NULL DEFAULT false, delivered_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(request_id,lead_id)
);
GRANT ALL ON public.research_request_leads TO service_role;
REVOKE ALL ON public.research_request_leads FROM anon,authenticated;
GRANT SELECT ON public.research_request_leads TO authenticated;
ALTER TABLE public.research_request_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS c_links_read ON public.research_request_leads;
CREATE POLICY c_links_read ON public.research_request_leads FOR SELECT TO authenticated USING(public.c_department_access('research') OR (delivered_at IS NOT NULL AND EXISTS(SELECT 1 FROM public.research_requests r WHERE r.id=request_id AND r.requested_by=auth.uid())));
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
CREATE POLICY c_feedback_read ON public.research_feedback FOR SELECT TO authenticated USING(public.c_department_access('research') OR EXISTS(SELECT 1 FROM public.research_requests r WHERE r.id=request_id AND r.requested_by=auth.uid()));
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