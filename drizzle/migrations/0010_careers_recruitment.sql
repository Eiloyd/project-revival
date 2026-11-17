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
CREATE TRIGGER g1_job_guard BEFORE INSERT OR UPDATE ON public.hr_job_openings FOR EACH ROW EXECUTE FUNCTION public.g1_job_guard();
CREATE OR REPLACE FUNCTION public.g1_candidate_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NEW.stage NOT IN ('applied','screening','shortlisted','assessment','interview','selected','offered','hired','rejected','withdrawn','offer_declined','on_hold','waitlisted') OR NEW.offer_status NOT IN ('none','released','pending','accepted','declined','not_sent','sent') OR NEW.experience_years<0 OR NEW.rating NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Invalid candidate values'; END IF;
NEW.updated_at:=now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS g1_candidate_guard ON public.hr_candidates;
CREATE TRIGGER g1_candidate_guard BEFORE INSERT OR UPDATE ON public.hr_candidates FOR EACH ROW EXECUTE FUNCTION public.g1_candidate_guard();
CREATE OR REPLACE FUNCTION public.g1_candidate_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF TG_OP='INSERT' THEN INSERT INTO hr_candidate_events(candidate_id,to_stage,actor_id,actor_name) VALUES(NEW.id,NEW.stage,auth.uid(),coalesce(candidate_email(),'Applicant'));
ELSIF NEW.stage IS DISTINCT FROM OLD.stage THEN INSERT INTO hr_candidate_events(candidate_id,from_stage,to_stage,actor_id,actor_name) VALUES(NEW.id,OLD.stage,NEW.stage,auth.uid(),coalesce(candidate_email(),'Staff')); END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS g1_candidate_history ON public.hr_candidates;
CREATE TRIGGER g1_candidate_history AFTER INSERT OR UPDATE ON public.hr_candidates FOR EACH ROW EXECUTE FUNCTION public.g1_candidate_history();
DROP POLICY IF EXISTS g1_letter_self ON public.hr_letters;
CREATE POLICY g1_letter_self ON public.hr_letters FOR SELECT TO authenticated USING(user_id=auth.uid());
DROP POLICY IF EXISTS g1_member_self ON public.hr_institute_members;
CREATE POLICY g1_member_self ON public.hr_institute_members FOR SELECT TO authenticated USING(user_id=auth.uid());
DROP POLICY IF EXISTS g1_interviewer_read ON public.hr_interview_rounds;
CREATE POLICY g1_interviewer_read ON public.hr_interview_rounds FOR SELECT TO authenticated USING(interviewer_user_id=auth.uid());
DROP POLICY IF EXISTS g1_interviewer_update ON public.hr_interview_rounds;
CREATE POLICY g1_interviewer_update ON public.hr_interview_rounds FOR UPDATE TO authenticated USING(interviewer_user_id=auth.uid()) WITH CHECK(interviewer_user_id=auth.uid());
DROP POLICY IF EXISTS g1_resume_insert ON storage.objects;
CREATE POLICY g1_resume_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='hr-resumes' AND (public.hr_staff() OR (name LIKE 'candidate/'||auth.uid()::text||'/%' AND name NOT LIKE '%..%')));
DROP POLICY IF EXISTS g1_resume_read ON storage.objects;
CREATE POLICY g1_resume_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='hr-resumes' AND (public.hr_staff() OR name LIKE 'candidate/'||auth.uid()::text||'/%'));
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
CREATE TRIGGER g1_round_guard BEFORE UPDATE ON public.hr_interview_rounds FOR EACH ROW EXECUTE FUNCTION public.g1_round_guard();