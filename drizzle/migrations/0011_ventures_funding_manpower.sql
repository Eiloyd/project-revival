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
CREATE TRIGGER g3_funding_guard BEFORE INSERT OR UPDATE ON public.funding_applications FOR EACH ROW EXECUTE FUNCTION public.g3_funding_guard();
CREATE OR REPLACE FUNCTION public.g3_funding_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF TG_OP='INSERT' THEN INSERT INTO funding_stage_history(application_id,to_stage,status,changed_by) VALUES(NEW.id,NEW.stage_id,NEW.status,auth.uid());
 ELSIF NEW.stage_id IS DISTINCT FROM OLD.stage_id OR NEW.status IS DISTINCT FROM OLD.status THEN INSERT INTO funding_stage_history(application_id,from_stage,to_stage,status,changed_by) VALUES(NEW.id,OLD.stage_id,NEW.stage_id,NEW.status,auth.uid()); END IF;
 RETURN NEW; END $$;
DROP TRIGGER IF EXISTS g3_funding_history ON public.funding_applications;
CREATE TRIGGER g3_funding_history AFTER INSERT OR UPDATE ON public.funding_applications FOR EACH ROW EXECUTE FUNCTION public.g3_funding_history();
CREATE OR REPLACE FUNCTION public.g3_stage_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF OLD.jury_round IS NOT NULL THEN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Mandatory jury stages cannot be removed'; END IF;
 IF NEW.jury_round IS DISTINCT FROM OLD.jury_round OR NOT NEW.active OR NEW.position<>OLD.position THEN RAISE EXCEPTION 'Mandatory jury stages cannot be disabled or reordered'; END IF;
 END IF; IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW; END $$;
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
CREATE POLICY g3_read ON public.venture_services FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL) ;

DROP POLICY IF EXISTS g3_manage ON public.venture_services;
CREATE POLICY g3_manage ON public.venture_services FOR ALL TO authenticated USING (venture_is_admin()) WITH CHECK (venture_is_admin());

DROP POLICY IF EXISTS g3_read ON public.funding_stages;
CREATE POLICY g3_read ON public.funding_stages FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL) ;

DROP POLICY IF EXISTS g3_manage ON public.funding_stages;
CREATE POLICY g3_manage ON public.funding_stages FOR ALL TO authenticated USING (venture_is_admin()) WITH CHECK (venture_is_admin());

DROP POLICY IF EXISTS g3_read ON public.venture_jurors;
CREATE POLICY g3_read ON public.venture_jurors FOR SELECT TO authenticated USING (user_id=auth.uid() OR venture_is_admin()) ;

DROP POLICY IF EXISTS g3_manage ON public.venture_jurors;
CREATE POLICY g3_manage ON public.venture_jurors FOR ALL TO authenticated USING (venture_is_admin()) WITH CHECK (venture_is_admin());

DROP POLICY IF EXISTS g3_read ON public.venture_clients;
CREATE POLICY g3_read ON public.venture_clients FOR SELECT TO authenticated USING (venture_can_see(id)) ;

DROP POLICY IF EXISTS g3_insert ON public.venture_clients;
CREATE POLICY g3_insert ON public.venture_clients FOR INSERT TO authenticated WITH CHECK (venture_is_admin() OR (venture_is_desk() AND crm_can_access(assigned_bde)));

DROP POLICY IF EXISTS g3_update ON public.venture_clients;
CREATE POLICY g3_update ON public.venture_clients FOR UPDATE TO authenticated USING (venture_can_work(id)) WITH CHECK (venture_is_admin() OR (venture_is_desk() AND crm_can_access(assigned_bde)));

DROP POLICY IF EXISTS g3_read ON public.venture_orders;
CREATE POLICY g3_read ON public.venture_orders FOR SELECT TO authenticated USING (venture_can_see_ops(client_id)) ;

DROP POLICY IF EXISTS g3_staff ON public.venture_orders;
CREATE POLICY g3_staff ON public.venture_orders FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_client_insert ON public.venture_orders;
CREATE POLICY g3_client_insert ON public.venture_orders FOR INSERT TO authenticated WITH CHECK (venture_is_owner(client_id) AND status='requested' AND assigned_to IS NULL AND amount IS NULL AND progress_note='');

DROP POLICY IF EXISTS g3_read ON public.venture_documents;
CREATE POLICY g3_read ON public.venture_documents FOR SELECT TO authenticated USING (venture_can_see(client_id)) ;

DROP POLICY IF EXISTS g3_staff ON public.venture_documents;
CREATE POLICY g3_staff ON public.venture_documents FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_client_insert ON public.venture_documents;
CREATE POLICY g3_client_insert ON public.venture_documents FOR INSERT TO authenticated WITH CHECK (venture_is_owner(client_id) AND status='pending_review');

DROP POLICY IF EXISTS g3_read ON public.venture_tickets;
CREATE POLICY g3_read ON public.venture_tickets FOR SELECT TO authenticated USING (venture_can_see_ops(client_id)) ;

DROP POLICY IF EXISTS g3_staff ON public.venture_tickets;
CREATE POLICY g3_staff ON public.venture_tickets FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_client_insert ON public.venture_tickets;
CREATE POLICY g3_client_insert ON public.venture_tickets FOR INSERT TO authenticated WITH CHECK (venture_is_owner(client_id) AND status='open' AND reply='');

DROP POLICY IF EXISTS g3_read ON public.funding_applications;
CREATE POLICY g3_read ON public.funding_applications FOR SELECT TO authenticated USING (venture_can_see(client_id)) ;

DROP POLICY IF EXISTS g3_staff ON public.funding_applications;
CREATE POLICY g3_staff ON public.funding_applications FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_read ON public.manpower_requirements;
CREATE POLICY g3_read ON public.manpower_requirements FOR SELECT TO authenticated USING (venture_can_see_ops(client_id)) ;

DROP POLICY IF EXISTS g3_staff ON public.manpower_requirements;
CREATE POLICY g3_staff ON public.manpower_requirements FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_client_insert ON public.manpower_requirements;
CREATE POLICY g3_client_insert ON public.manpower_requirements FOR INSERT TO authenticated WITH CHECK (venture_is_owner(client_id) AND status='open' AND filled=0);

DROP POLICY IF EXISTS g3_client_upload ON public.venture_documents;
CREATE POLICY g3_client_upload ON public.venture_documents FOR UPDATE TO authenticated USING (venture_is_owner(client_id) AND status IN ('requested','changes_requested')) WITH CHECK (venture_is_owner(client_id) AND status='pending_review');

DROP POLICY IF EXISTS g3_staff ON public.manpower_candidates;
CREATE POLICY g3_staff ON public.manpower_candidates FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_staff ON public.manpower_deployments;
CREATE POLICY g3_staff ON public.manpower_deployments FOR ALL TO authenticated USING (venture_can_work(client_id)) WITH CHECK (venture_can_work(client_id));

DROP POLICY IF EXISTS g3_read ON public.manpower_timesheets;
CREATE POLICY g3_read ON public.manpower_timesheets FOR SELECT TO authenticated USING (venture_can_see_ops(client_id) OR _work_department('accounts') OR _work_department('finance')) ;

DROP POLICY IF EXISTS g3_read ON public.manpower_invoices;
CREATE POLICY g3_read ON public.manpower_invoices FOR SELECT TO authenticated USING (venture_can_see_ops(client_id) OR _work_department('accounts') OR _work_department('finance')) ;

DROP POLICY IF EXISTS g3_insert ON public.manpower_timesheets;
CREATE POLICY g3_insert ON public.manpower_timesheets FOR INSERT TO authenticated WITH CHECK (venture_can_work(client_id) AND status='submitted');

DROP POLICY IF EXISTS g3_update ON public.manpower_timesheets;
CREATE POLICY g3_update ON public.manpower_timesheets FOR UPDATE TO authenticated USING (venture_can_work(client_id) AND status IN ('submitted','disputed')) WITH CHECK (venture_can_work(client_id) AND status='submitted');

DROP POLICY IF EXISTS g3_read ON public.manpower_events;
CREATE POLICY g3_read ON public.manpower_events FOR SELECT TO authenticated USING (venture_can_work(client_id)) ;

DROP POLICY IF EXISTS g3_read ON public.funding_stage_history;
CREATE POLICY g3_read ON public.funding_stage_history FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM funding_applications a WHERE a.id=application_id AND venture_can_see(a.client_id))) ;

DROP POLICY IF EXISTS g3_read ON public.jury_evaluations;
CREATE POLICY g3_read ON public.jury_evaluations FOR SELECT TO authenticated USING (venture_is_admin() OR venture_is_juror() OR EXISTS(SELECT 1 FROM funding_applications a WHERE a.id=application_id AND venture_can_work(a.client_id))) ;

DROP POLICY IF EXISTS g3_vote ON public.jury_evaluations;
CREATE POLICY g3_vote ON public.jury_evaluations FOR ALL TO authenticated USING (venture_is_admin() OR (venture_is_juror() AND juror_id=auth.uid())) WITH CHECK (venture_is_admin() OR (venture_is_juror() AND juror_id=auth.uid()));

DROP POLICY IF EXISTS g3_read ON public.research_milestones;
CREATE POLICY g3_read ON public.research_milestones FOR SELECT TO authenticated USING (c_department_access('research') OR EXISTS(SELECT 1 FROM research_requests r WHERE r.id=request_id AND r.requested_by=auth.uid())) ;

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
CREATE POLICY g3_docs_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='venture-docs' AND venture_can_see(venture_folder_client(name)));
DROP POLICY IF EXISTS g3_docs_insert ON storage.objects;
CREATE POLICY g3_docs_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='venture-docs' AND venture_can_see_ops(venture_folder_client(name)));
DROP POLICY IF EXISTS g3_docs_update ON storage.objects;
CREATE POLICY g3_docs_update ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='venture-docs' AND venture_can_see_ops(venture_folder_client(name))) WITH CHECK(bucket_id='venture-docs' AND venture_can_see_ops(venture_folder_client(name)));
DROP POLICY IF EXISTS g3_docs_delete ON storage.objects;
CREATE POLICY g3_docs_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='venture-docs' AND venture_can_work(venture_folder_client(name)));
DO $$ DECLARE r record; BEGIN FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname LIKE 'g3_%' OR p.proname IN ('venture_is_admin','venture_is_desk','venture_is_juror','venture_is_owner','venture_can_see','venture_can_see_ops','venture_can_work','venture_folder_client','funding_move','funding_public_feedback','manpower_in_rpc','manpower_client_candidates','manpower_client_decide','manpower_client_deployments','manpower_client_timesheet','manpower_generate_invoice','manpower_invoice_action','manpower_request_replacement')) LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',r.sig);
 IF r.sig::text NOT LIKE 'g3_%' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated,service_role',r.sig); END IF;
END LOOP; END $$;
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
CREATE TRIGGER g3_document_guard BEFORE INSERT OR UPDATE ON public.venture_documents FOR EACH ROW EXECUTE FUNCTION public.g3_document_guard();
REVOKE ALL ON FUNCTION public.g3_document_guard() FROM PUBLIC,anon;