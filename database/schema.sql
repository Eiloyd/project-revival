-- RILOYD website: full database structure (no personal data).
-- Run once on an EMPTY Supabase/Postgres database (SQL editor or psql).
-- Already ran an older/partial setup? Run reset.sql first, then this file, then seed.sql.
-- Generated from the live database on 2026-11-15.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
-- Optional (scheduled jobs are run by the website): CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Optional: CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE SEQUENCE IF NOT EXISTS public.crm_customer_code_seq;
CREATE SEQUENCE IF NOT EXISTS public.crm_ticket_code_seq;
CREATE SEQUENCE IF NOT EXISTS public.education_ack_serial;
CREATE SEQUENCE IF NOT EXISTS public.sheet_mirror_queue_id_seq;

-- ===== Tables =====
CREATE TABLE public.ack_form_counters (
  form_code text NOT NULL,
  form_name text NOT NULL,
  last_serial integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.contact_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  service text NOT NULL,
  industry text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'new'::text NOT NULL,
  admin_notes text DEFAULT ''::text NOT NULL,
  coordinator_code text,
  coordinator_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  ack_number text DEFAULT ''::text NOT NULL
);
CREATE TABLE public.coordinators (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  full_name text NOT NULL,
  referral_code text NOT NULL,
  phone text DEFAULT ''::text NOT NULL,
  email text DEFAULT ''::text NOT NULL,
  city text DEFAULT ''::text NOT NULL,
  notes text DEFAULT ''::text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.country_logos (
  country text NOT NULL,
  theme text NOT NULL,
  file_path text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.country_programme_fees (
  country text NOT NULL,
  currency text NOT NULL,
  amount integer,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.crm_activities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  lead_id uuid,
  ticket_id uuid,
  kind text NOT NULL,
  body text DEFAULT ''::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.crm_customers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  customer_code text DEFAULT ('CUS-'::text || lpad((nextval('crm_customer_code_seq'::regclass))::text, 6, '0'::text)) NOT NULL,
  full_name text NOT NULL,
  email text DEFAULT ''::text NOT NULL,
  phone text DEFAULT ''::text NOT NULL,
  company text DEFAULT ''::text NOT NULL,
  acknowledgement text,
  owner_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.crm_employee_profiles (
  user_id uuid NOT NULL,
  employee_code text NOT NULL,
  full_name text NOT NULL,
  phone text DEFAULT ''::text NOT NULL,
  designation text DEFAULT ''::text NOT NULL,
  photo_url text,
  joining_date date DEFAULT CURRENT_DATE NOT NULL
);
CREATE TABLE public.crm_leads (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  customer_id uuid NOT NULL,
  title text NOT NULL,
  stage text DEFAULT 'new'::text NOT NULL,
  amount numeric DEFAULT 0 NOT NULL,
  source text DEFAULT 'manual'::text NOT NULL,
  source_id uuid,
  owner_id uuid,
  next_follow_up date,
  notes text DEFAULT ''::text NOT NULL,
  referral_code text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.crm_memberships (
  user_id uuid NOT NULL,
  role text NOT NULL,
  manager_id uuid,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.crm_targets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid NOT NULL,
  month date NOT NULL,
  revenue_target numeric DEFAULT 0 NOT NULL,
  wins_target integer DEFAULT 0 NOT NULL,
  calls_target integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.crm_tasks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  owner_id uuid NOT NULL,
  customer_id uuid,
  due_date date NOT NULL,
  status text DEFAULT 'open'::text NOT NULL,
  priority text DEFAULT 'normal'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.crm_tickets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  ticket_code text DEFAULT ('TKT-'::text || lpad((nextval('crm_ticket_code_seq'::regclass))::text, 6, '0'::text)) NOT NULL,
  customer_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  subject text NOT NULL,
  description text DEFAULT ''::text NOT NULL,
  status text DEFAULT 'open'::text NOT NULL,
  priority text DEFAULT 'normal'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.customer_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  report_number text NOT NULL,
  publish_date date NOT NULL,
  title text NOT NULL,
  category text DEFAULT 'business'::text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer DEFAULT 0 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.education_district_codes (
  state_code text NOT NULL,
  district_key text NOT NULL,
  district_name text NOT NULL,
  code integer NOT NULL
);
CREATE TABLE public.education_staff_access (
  user_id uuid NOT NULL,
  designation text NOT NULL,
  manager_id uuid,
  referral_code text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.education_support_registrations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  ack_number text DEFAULT ''::text NOT NULL,
  student_category text NOT NULL,
  current_class text,
  course_name text,
  education_sector text,
  institution_name text NOT NULL,
  education jsonb DEFAULT '{}'::jsonb NOT NULL,
  student_name text NOT NULL,
  father_name text NOT NULL,
  mother_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  nationality text NOT NULL,
  mobile text NOT NULL,
  whatsapp text,
  email text NOT NULL,
  permanent_address text NOT NULL,
  current_address text NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  city text NOT NULL,
  pin_code text NOT NULL,
  is_minor boolean DEFAULT false NOT NULL,
  guardian_name text,
  guardian_mobile text,
  guardian_email text,
  guardian_relationship text,
  guardian_consent_at timestamp with time zone,
  without_coordinator boolean DEFAULT false NOT NULL,
  coordinator jsonb DEFAULT '{}'::jsonb NOT NULL,
  coordinator_code text,
  coordinator_id uuid,
  application_type text NOT NULL,
  registration_fee integer NOT NULL,
  payment_status text DEFAULT 'pending'::text NOT NULL,
  payment_reference text,
  payment_reference_at timestamp with time zone,
  receipt_token_hash text NOT NULL,
  status text DEFAULT 'submitted'::text NOT NULL,
  status_reason text DEFAULT ''::text NOT NULL,
  declarations jsonb DEFAULT '{}'::jsonb NOT NULL,
  form_status text DEFAULT 'started'::text NOT NULL,
  completed_at timestamp with time zone,
  approval_status text DEFAULT 'pending'::text NOT NULL,
  approved_at timestamp with time zone,
  approved_by uuid,
  private_details_ciphertext text,
  aadhaar_last_four text,
  review_flags jsonb DEFAULT '[]'::jsonb NOT NULL,
  ai_review text DEFAULT ''::text NOT NULL,
  flags_checked_at timestamp with time zone,
  flags_confirmed_at timestamp with time zone,
  flags_confirmed_by uuid,
  flags_confirm_note text DEFAULT ''::text NOT NULL,
  employee_verified_at timestamp with time zone,
  employee_verified_by uuid,
  employee_verification_note text DEFAULT ''::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  registration_id text
);
CREATE TABLE public.employee_verification_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  employee_id text NOT NULL,
  success boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.employees (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  employee_id text NOT NULL,
  code_hash text NOT NULL,
  full_name text NOT NULL,
  photo_url text,
  designation text NOT NULL,
  department text NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  valid_until date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.form_submission_limits (
  key_hash text NOT NULL,
  window_started_at timestamp with time zone DEFAULT now() NOT NULL,
  attempts integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.foundation_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  kind text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'new'::text NOT NULL,
  admin_notes text DEFAULT ''::text NOT NULL,
  coordinator_code text,
  coordinator_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  ack_number text DEFAULT ''::text NOT NULL
);
CREATE TABLE public.google_copy_settings (
  id smallint DEFAULT 1 NOT NULL,
  sheet_id text,
  sheet_title text DEFAULT ''::text NOT NULL,
  drive_folder_id text,
  drive_folder_title text DEFAULT ''::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
CREATE TABLE public.payment_options (
  key text NOT NULL,
  programme text NOT NULL,
  label text NOT NULL,
  payment_link text,
  razorpay_button_id text,
  sort_order integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.payment_provider_tokens (
  provider text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamp with time zone NOT NULL
);
CREATE TABLE public.people_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  person_group text NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  role text DEFAULT ''::text NOT NULL,
  location text DEFAULT ''::text NOT NULL,
  focus text[] DEFAULT '{}'::text[] NOT NULL,
  summary text DEFAULT ''::text NOT NULL,
  bio text DEFAULT ''::text NOT NULL,
  photo_url text,
  sort_order integer DEFAULT 0 NOT NULL,
  source_application_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text DEFAULT ''::text NOT NULL,
  avatar_url text DEFAULT ''::text NOT NULL,
  preferences jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE public.programme_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  application_code text DEFAULT ''::text NOT NULL,
  programme text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  amount_paise integer NOT NULL,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'new'::text NOT NULL,
  submission_status text DEFAULT 'lead'::text NOT NULL,
  submitted_at timestamp with time zone,
  admin_notes text DEFAULT ''::text NOT NULL,
  coordinator_code text,
  coordinator_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.programme_payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  programme text DEFAULT ''::text NOT NULL,
  application_id uuid,
  application_kind text,
  amount_paise integer NOT NULL,
  currency text DEFAULT 'INR'::text NOT NULL,
  payer_name text NOT NULL,
  payer_email text NOT NULL,
  payer_phone text DEFAULT ''::text NOT NULL,
  provider text DEFAULT 'zoho'::text NOT NULL,
  provider_payment_id text,
  provider_reference text,
  razorpay_order_id text,
  razorpay_payment_id text,
  status text DEFAULT 'created'::text NOT NULL,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.prototype_ai_access_state (
  model_id text NOT NULL,
  status_code integer NOT NULL,
  message text DEFAULT ''::text NOT NULL,
  blocked_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.prototype_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  idea text NOT NULL,
  prototype text NOT NULL,
  funding_goal text DEFAULT ''::text NOT NULL,
  eligibility_context text DEFAULT ''::text NOT NULL,
  ai_output text DEFAULT ''::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.registration_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  application_code text DEFAULT ''::text NOT NULL,
  category text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  document_path text,
  document_name text,
  status text DEFAULT 'new'::text NOT NULL,
  admin_notes text DEFAULT ''::text NOT NULL,
  coordinator_code text,
  coordinator_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  drive_file_url text
);
CREATE TABLE public.sheet_mirror_queue (
  id bigint DEFAULT nextval('sheet_mirror_queue_id_seq'::regclass) NOT NULL,
  source_table text NOT NULL,
  row_id uuid NOT NULL,
  kind text DEFAULT 'row'::text NOT NULL,
  queued_at timestamp with time zone DEFAULT now() NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  last_error text DEFAULT ''::text NOT NULL
);
CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL
);
CREATE TABLE public.young_innovators_registrations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  application_code text DEFAULT ''::text NOT NULL,
  student_name text NOT NULL,
  school_class integer NOT NULL,
  city text NOT NULL,
  guardian_name text NOT NULL,
  guardian_email text NOT NULL,
  guardian_phone text NOT NULL,
  idea_title text NOT NULL,
  idea text NOT NULL,
  guardian_consent boolean NOT NULL,
  consent_at timestamp with time zone DEFAULT now() NOT NULL,
  fee_amount integer NOT NULL,
  gst_percent integer DEFAULT 18 NOT NULL,
  status text DEFAULT 'new'::text NOT NULL,
  submission_status text DEFAULT 'lead'::text NOT NULL,
  submitted_at timestamp with time zone,
  coordinator_code text,
  coordinator_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ===== Keys, unique rules and checks =====
ALTER TABLE public.ack_form_counters ADD CONSTRAINT ack_form_counters_form_code_check CHECK ((form_code ~ '^\d{2}$'::text));
ALTER TABLE public.ack_form_counters ADD CONSTRAINT ack_form_counters_last_serial_check CHECK (((last_serial >= 0) AND (last_serial <= 99999)));
ALTER TABLE public.ack_form_counters ADD CONSTRAINT ack_form_counters_pkey PRIMARY KEY (form_code);
ALTER TABLE public.contact_submissions ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);
ALTER TABLE public.coordinators ADD CONSTRAINT coordinators_pkey PRIMARY KEY (id);
ALTER TABLE public.coordinators ADD CONSTRAINT coordinators_referral_code_key UNIQUE (referral_code);
ALTER TABLE public.country_logos ADD CONSTRAINT country_logos_pkey PRIMARY KEY (country, theme);
ALTER TABLE public.country_logos ADD CONSTRAINT country_logos_theme_check CHECK ((theme = ANY (ARRAY['light'::text, 'dark'::text])));
ALTER TABLE public.country_programme_fees ADD CONSTRAINT country_programme_fees_pkey PRIMARY KEY (country);
ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_customers ADD CONSTRAINT crm_customers_customer_code_key UNIQUE (customer_code);
ALTER TABLE public.crm_customers ADD CONSTRAINT crm_customers_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_employee_profiles ADD CONSTRAINT crm_employee_profiles_employee_code_key UNIQUE (employee_code);
ALTER TABLE public.crm_employee_profiles ADD CONSTRAINT crm_employee_profiles_pkey PRIMARY KEY (user_id);
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_stage_check CHECK ((stage = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'proposal'::text, 'won'::text, 'lost'::text])));
ALTER TABLE public.crm_memberships ADD CONSTRAINT crm_memberships_pkey PRIMARY KEY (user_id);
ALTER TABLE public.crm_memberships ADD CONSTRAINT crm_memberships_role_check CHECK ((role = ANY (ARRAY['sales'::text, 'support'::text, 'BDE'::text, 'BDM'::text])));
ALTER TABLE public.crm_targets ADD CONSTRAINT crm_targets_owner_id_month_key UNIQUE (owner_id, month);
ALTER TABLE public.crm_targets ADD CONSTRAINT crm_targets_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_tasks ADD CONSTRAINT crm_tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_tasks ADD CONSTRAINT crm_tasks_priority_check CHECK ((priority = ANY (ARRAY['normal'::text, 'high'::text, 'urgent'::text])));
ALTER TABLE public.crm_tasks ADD CONSTRAINT crm_tasks_status_check CHECK ((status = ANY (ARRAY['open'::text, 'done'::text])));
ALTER TABLE public.crm_tickets ADD CONSTRAINT crm_tickets_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_tickets ADD CONSTRAINT crm_tickets_priority_check CHECK ((priority = ANY (ARRAY['normal'::text, 'high'::text, 'urgent'::text])));
ALTER TABLE public.crm_tickets ADD CONSTRAINT crm_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text])));
ALTER TABLE public.crm_tickets ADD CONSTRAINT crm_tickets_ticket_code_key UNIQUE (ticket_code);
ALTER TABLE public.customer_reports ADD CONSTRAINT customer_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.customer_reports ADD CONSTRAINT customer_reports_report_number_key UNIQUE (report_number);
ALTER TABLE public.education_district_codes ADD CONSTRAINT education_district_codes_code_check CHECK (((code >= 1) AND (code <= 99)));
ALTER TABLE public.education_district_codes ADD CONSTRAINT education_district_codes_pkey PRIMARY KEY (state_code, district_key);
ALTER TABLE public.education_staff_access ADD CONSTRAINT education_staff_access_designation_check CHECK ((designation = ANY (ARRAY['BDE'::text, 'BDM'::text])));
ALTER TABLE public.education_staff_access ADD CONSTRAINT education_staff_access_pkey PRIMARY KEY (user_id);
ALTER TABLE public.education_staff_access ADD CONSTRAINT education_staff_access_referral_code_key UNIQUE (referral_code);
ALTER TABLE public.education_support_registrations ADD CONSTRAINT education_support_registrations_ack_number_key UNIQUE (ack_number);
ALTER TABLE public.education_support_registrations ADD CONSTRAINT education_support_registrations_pkey PRIMARY KEY (id);
ALTER TABLE public.employee_verification_attempts ADD CONSTRAINT employee_verification_attempts_pkey PRIMARY KEY (id);
ALTER TABLE public.employees ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);
ALTER TABLE public.employees ADD CONSTRAINT employees_pkey PRIMARY KEY (id);
ALTER TABLE public.employees ADD CONSTRAINT employees_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
ALTER TABLE public.form_submission_limits ADD CONSTRAINT form_submission_limits_pkey PRIMARY KEY (key_hash);
ALTER TABLE public.foundation_submissions ADD CONSTRAINT foundation_submissions_pkey PRIMARY KEY (id);
ALTER TABLE public.google_copy_settings ADD CONSTRAINT google_copy_settings_drive_folder_id_check CHECK (((drive_folder_id IS NULL) OR (drive_folder_id ~ '^[A-Za-z0-9_-]{10,100}$'::text)));
ALTER TABLE public.google_copy_settings ADD CONSTRAINT google_copy_settings_id_check CHECK ((id = 1));
ALTER TABLE public.google_copy_settings ADD CONSTRAINT google_copy_settings_pkey PRIMARY KEY (id);
ALTER TABLE public.google_copy_settings ADD CONSTRAINT google_copy_settings_sheet_id_check CHECK (((sheet_id IS NULL) OR (sheet_id ~ '^[A-Za-z0-9_-]{20,100}$'::text)));
ALTER TABLE public.payment_options ADD CONSTRAINT payment_options_pkey PRIMARY KEY (key);
ALTER TABLE public.payment_provider_tokens ADD CONSTRAINT payment_provider_tokens_pkey PRIMARY KEY (provider);
ALTER TABLE public.people_profiles ADD CONSTRAINT people_profiles_person_group_check CHECK ((person_group = ANY (ARRAY['investors'::text, 'mentors'::text, 'team'::text, 'startups'::text, 'businesses'::text])));
ALTER TABLE public.people_profiles ADD CONSTRAINT people_profiles_person_group_slug_key UNIQUE (person_group, slug);
ALTER TABLE public.people_profiles ADD CONSTRAINT people_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.people_profiles ADD CONSTRAINT people_profiles_source_application_id_key UNIQUE (source_application_id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.programme_applications ADD CONSTRAINT programme_applications_application_code_key UNIQUE (application_code);
ALTER TABLE public.programme_applications ADD CONSTRAINT programme_applications_pkey PRIMARY KEY (id);
ALTER TABLE public.programme_payments ADD CONSTRAINT programme_payments_pkey PRIMARY KEY (id);
ALTER TABLE public.prototype_ai_access_state ADD CONSTRAINT prototype_ai_access_state_pkey PRIMARY KEY (model_id);
ALTER TABLE public.prototype_submissions ADD CONSTRAINT prototype_submissions_pkey PRIMARY KEY (id);
ALTER TABLE public.registration_applications ADD CONSTRAINT registration_applications_application_code_key UNIQUE (application_code);
ALTER TABLE public.registration_applications ADD CONSTRAINT registration_applications_category_check CHECK ((category = ANY (ARRAY['startup'::text, 'mentor'::text, 'investor'::text, 'business'::text])));
ALTER TABLE public.registration_applications ADD CONSTRAINT registration_applications_pkey PRIMARY KEY (id);
ALTER TABLE public.sheet_mirror_queue ADD CONSTRAINT sheet_mirror_queue_kind_check CHECK ((kind = ANY (ARRAY['row'::text, 'file'::text])));
ALTER TABLE public.sheet_mirror_queue ADD CONSTRAINT sheet_mirror_queue_pkey PRIMARY KEY (id);
ALTER TABLE public.sheet_mirror_queue ADD CONSTRAINT sheet_mirror_queue_source_table_row_id_kind_key UNIQUE (source_table, row_id, kind);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE public.young_innovators_registrations ADD CONSTRAINT young_innovators_registrations_application_code_key UNIQUE (application_code);
ALTER TABLE public.young_innovators_registrations ADD CONSTRAINT young_innovators_registrations_pkey PRIMARY KEY (id);
ALTER TABLE public.young_innovators_registrations ADD CONSTRAINT young_innovators_registrations_school_class_check CHECK (((school_class >= 6) AND (school_class <= 12)));

-- ===== Links between tables =====
ALTER TABLE public.contact_submissions ADD CONSTRAINT contact_submissions_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE SET NULL;
ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE;
ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES crm_tickets(id) ON DELETE CASCADE;
ALTER TABLE public.crm_employee_profiles ADD CONSTRAINT crm_employee_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES crm_memberships(user_id) ON DELETE CASCADE;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES crm_customers(id) ON DELETE CASCADE;
ALTER TABLE public.crm_memberships ADD CONSTRAINT crm_memberships_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES crm_memberships(user_id) ON DELETE SET NULL;
ALTER TABLE public.crm_tasks ADD CONSTRAINT crm_tasks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES crm_customers(id) ON DELETE SET NULL;
ALTER TABLE public.crm_tickets ADD CONSTRAINT crm_tickets_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES crm_customers(id) ON DELETE CASCADE;
ALTER TABLE public.education_staff_access ADD CONSTRAINT education_staff_access_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES education_staff_access(user_id) ON DELETE SET NULL;
ALTER TABLE public.education_support_registrations ADD CONSTRAINT education_support_registrations_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE SET NULL;
ALTER TABLE public.foundation_submissions ADD CONSTRAINT foundation_submissions_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE SET NULL;
ALTER TABLE public.people_profiles ADD CONSTRAINT people_profiles_source_application_id_fkey FOREIGN KEY (source_application_id) REFERENCES registration_applications(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.programme_applications ADD CONSTRAINT programme_applications_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE SET NULL;
ALTER TABLE public.registration_applications ADD CONSTRAINT registration_applications_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE SET NULL;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.young_innovators_registrations ADD CONSTRAINT young_innovators_registrations_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES coordinators(id) ON DELETE SET NULL;

-- ===== Indexes =====
CREATE INDEX crm_customers_email ON public.crm_customers USING btree (lower(email));
CREATE INDEX crm_leads_owner ON public.crm_leads USING btree (owner_id);
CREATE UNIQUE INDEX crm_leads_source_unique ON public.crm_leads USING btree (source, source_id) WHERE (source_id IS NOT NULL);
CREATE INDEX education_support_coordinator_code ON public.education_support_registrations USING btree (coordinator_code);
CREATE INDEX education_support_created_at ON public.education_support_registrations USING btree (created_at);
CREATE UNIQUE INDEX education_support_payment_reference_unique ON public.education_support_registrations USING btree (payment_reference) WHERE ((payment_reference IS NOT NULL) AND (payment_reference <> ''::text));
CREATE UNIQUE INDEX education_support_registration_id_unique ON public.education_support_registrations USING btree (registration_id) WHERE (registration_id IS NOT NULL);
CREATE INDEX employee_verification_attempts_lookup ON public.employee_verification_attempts USING btree (employee_id, created_at);

-- ===== Functions (numbering, CRM routing, Sheet queue, access checks) =====
SET check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.ack_state_code(_state text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT coalesce(lpad(array_position(ARRAY['andhra pradesh','arunachal pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana','himachal pradesh','jharkhand',
    'karnataka','kerala','madhya pradesh','maharashtra','manipur','meghalaya','mizoram','nagaland','odisha','punjab',
    'rajasthan','sikkim','tamil nadu','telangana','tripura','uttar pradesh','uttarakhand','west bengal',
    'andaman and nicobar islands','chandigarh','dadra and nagar haveli and daman and diu','delhi','jammu and kashmir','ladakh','lakshadweep','puducherry'],
    lower(btrim(coalesce(_state, ''))))::text, 2, '0'), '00')
$function$
;

CREATE OR REPLACE FUNCTION public.admin_import_records(_table text, _rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  _allowed constant text[] := ARRAY['contact_submissions','registration_applications','employees','people_profiles',
    'customer_reports','country_logos','country_programme_fees','prototype_submissions','young_innovators_registrations'];
  _row jsonb; _cols text; _bad text; _n integer; _inserted integer := 0; _skipped integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF _table IS NULL OR NOT (_table = ANY (_allowed)) THEN RAISE EXCEPTION 'This table cannot be imported'; END IF;
  IF jsonb_typeof(_rows) <> 'array' OR jsonb_array_length(_rows) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Provide 1 to 1000 rows'; END IF;
  FOR _row IN SELECT value FROM jsonb_array_elements(_rows) LOOP
    IF jsonb_typeof(_row) <> 'object' OR _row = '{}'::jsonb THEN RAISE EXCEPTION 'Each row must be a non-empty object'; END IF;
    SELECT k INTO _bad FROM jsonb_object_keys(_row) AS k
      WHERE NOT EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = format('public.%I', _table)::regclass
                        AND a.attname = k AND a.attnum > 0 AND NOT a.attisdropped) LIMIT 1;
    IF _bad IS NOT NULL THEN RAISE EXCEPTION 'Unknown column %', _bad; END IF;
    SELECT string_agg(format('%I', k), ', ') INTO _cols FROM jsonb_object_keys(_row) AS k;
    EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1) ON CONFLICT DO NOTHING',
      _table, _cols, _cols, _table) USING _row;
    GET DIAGNOSTICS _n = ROW_COUNT;
    IF _n > 0 THEN _inserted := _inserted + 1; ELSE _skipped := _skipped + 1; END IF;
  END LOOP;
  RETURN jsonb_build_object('inserted', _inserted, 'skipped', _skipped);
END $function$
;

CREATE OR REPLACE FUNCTION public.admin_save_employee(_employee_id text, _code text, _full_name text, _photo_url text, _designation text, _department text, _status text, _valid_until text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE _id text := trim(coalesce(_employee_id, ''));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF _id = '' OR trim(coalesce(_full_name, '')) = '' THEN RAISE EXCEPTION 'Employee ID and name are required'; END IF;
  IF coalesce(_status, 'active') NOT IN ('active', 'inactive') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  IF EXISTS (SELECT 1 FROM public.employees e WHERE upper(e.employee_id) = upper(_id)) THEN
    UPDATE public.employees e SET
      full_name = trim(_full_name),
      photo_url = nullif(trim(coalesce(_photo_url, '')), ''),
      designation = coalesce(_designation, ''),
      department = coalesce(_department, ''),
      status = coalesce(_status, 'active'),
      valid_until = nullif(coalesce(_valid_until, ''), '')::date,
      code_hash = CASE WHEN coalesce(_code, '') <> '' THEN extensions.crypt(_code, extensions.gen_salt('bf', 10)) ELSE e.code_hash END,
      updated_at = now()
    WHERE upper(e.employee_id) = upper(_id);
  ELSE
    IF length(coalesce(_code, '')) < 6 THEN RAISE EXCEPTION 'A verification code of at least 6 characters is required'; END IF;
    INSERT INTO public.employees (employee_id, code_hash, full_name, photo_url, designation, department, status, valid_until)
    VALUES (_id, extensions.crypt(_code, extensions.gen_salt('bf', 10)), trim(_full_name), nullif(trim(coalesce(_photo_url, '')), ''),
      coalesce(_designation, ''), coalesce(_department, ''), coalesce(_status, 'active'), nullif(coalesce(_valid_until, ''), '')::date);
  END IF;
END $function$
;

CREATE OR REPLACE FUNCTION public.admin_setup_metadata()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'tables', coalesce((
      SELECT jsonb_agg(jsonb_build_object('name', c.relname, 'rls', c.relrowsecurity, 'columns', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('name', a.attname, 'type', format_type(a.atttypid, NULL), 'nullable', NOT a.attnotnull) ORDER BY a.attnum), '[]'::jsonb)
        FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped)) ORDER BY c.relname)
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')), '[]'::jsonb),
    'functions', coalesce((SELECT jsonb_agg(DISTINCT p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'), '[]'::jsonb),
    'triggers', coalesce((SELECT jsonb_agg(DISTINCT t.tgname) FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
      JOIN pg_namespace n ON n.oid = p.pronamespace WHERE NOT t.tgisinternal AND n.nspname = 'public'), '[]'::jsonb)
  );
END $function$
;

CREATE OR REPLACE FUNCTION public.assign_education_ack_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _temp text; _paid boolean;
BEGIN
  _paid := NEW.payment_status IN ('reference_submitted', 'paid');
  IF TG_OP = 'INSERT' THEN
    IF coalesce(NEW.ack_number, '') = '' THEN
      IF _paid THEN NEW.ack_number := public.issue_ack_number('01', NEW.state); RETURN NEW; END IF;
      LOOP
        _temp := 'R' || to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYMMDD') || public.ack_state_code(NEW.state)
          || lpad(floor(random() * 10000000)::int::text, 7, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.education_support_registrations WHERE ack_number = _temp OR registration_id = _temp);
      END LOOP;
      NEW.ack_number := _temp;
      RETURN NEW;
    END IF;
  END IF;
  -- A temporary or backup number becomes a real acknowledgement number once the payment ID is shared.
  IF _paid AND NEW.ack_number ~ '^[A-Z]' THEN
    NEW.registration_id := NEW.ack_number;
    NEW.ack_number := public.issue_ack_number('01', NEW.state);
    IF TG_OP = 'UPDATE' THEN
      UPDATE public.crm_customers SET acknowledgement = NEW.ack_number WHERE acknowledgement = NEW.registration_id;
    END IF;
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.assign_form_ack_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _form text := TG_ARGV[0]; _state text;
BEGIN
  IF TG_TABLE_NAME IN ('foundation_submissions', 'contact_submissions') THEN
    IF coalesce(NEW.ack_number, '') <> '' THEN RETURN NEW; END IF;
  ELSIF coalesce(NEW.application_code, '') <> '' THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME IN ('registration_applications', 'programme_applications', 'foundation_submissions') THEN
    _state := NEW.details->>'state';
  END IF;
  IF TG_TABLE_NAME IN ('foundation_submissions', 'contact_submissions') THEN
    NEW.ack_number := public.issue_ack_number(_form, _state);
  ELSE
    NEW.application_code := public.issue_ack_number(_form, _state);
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.can_view_people_profiles()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = auth.uid() AND active)
    OR EXISTS (SELECT 1 FROM public.education_staff_access WHERE user_id = auth.uid() AND active)
    OR EXISTS (
      SELECT 1 FROM auth.users u
      JOIN public.registration_applications a ON lower(a.email) = lower(u.email) AND a.status = 'approved'
      WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
    )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('public.claim_first_admin'));
  IF public.first_admin_setup_status() <> 'eligible' THEN
    RAISE EXCEPTION 'First-admin setup is not available for this account' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END $function$
;

CREATE OR REPLACE FUNCTION public.consume_form_submission_limit(_key_hash text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _attempts integer;
BEGIN
  IF _key_hash IS NULL OR length(_key_hash) < 16 THEN RAISE EXCEPTION 'Invalid limiter key'; END IF;
  INSERT INTO public.form_submission_limits AS l (key_hash, window_started_at, attempts) VALUES (_key_hash, now(), 1)
  ON CONFLICT (key_hash) DO UPDATE SET
    attempts = CASE WHEN l.window_started_at < now() - interval '15 minutes' THEN 1 ELSE l.attempts + 1 END,
    window_started_at = CASE WHEN l.window_started_at < now() - interval '15 minutes' THEN now() ELSE l.window_started_at END
  RETURNING attempts INTO _attempts;
  IF random() < 0.01 THEN DELETE FROM public.form_submission_limits WHERE window_started_at < now() - interval '1 day'; END IF;
  RETURN _attempts <= 5;
END $function$
;

CREATE OR REPLACE FUNCTION public.coordinator_name_for_code(_code text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT coalesce(
    (SELECT c.full_name FROM public.coordinators c WHERE c.active AND upper(c.referral_code) = upper(btrim(_code)) LIMIT 1),
    (SELECT p.full_name FROM public.crm_employee_profiles p JOIN public.crm_memberships m ON m.user_id = p.user_id AND m.active
      WHERE upper(p.employee_code) = upper(btrim(_code)) LIMIT 1))
$function$
;

CREATE OR REPLACE FUNCTION public.coordinator_referral_stats()
 RETURNS TABLE(coordinator_id uuid, leads bigint, submitted bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
  SELECT s.cid, count(*)::bigint, count(*) FILTER (WHERE s.done)::bigint FROM (
    SELECT t.coordinator_id AS cid, true AS done FROM public.contact_submissions t WHERE t.coordinator_id IS NOT NULL
    UNION ALL SELECT t.coordinator_id, true FROM public.registration_applications t WHERE t.coordinator_id IS NOT NULL
    UNION ALL SELECT t.coordinator_id, true FROM public.foundation_submissions t WHERE t.coordinator_id IS NOT NULL
    UNION ALL SELECT t.coordinator_id, t.form_status = 'completed' FROM public.education_support_registrations t WHERE t.coordinator_id IS NOT NULL
    UNION ALL SELECT t.coordinator_id, t.submission_status = 'submitted' FROM public.young_innovators_registrations t WHERE t.coordinator_id IS NOT NULL
    UNION ALL SELECT t.coordinator_id, t.submission_status = 'submitted' FROM public.programme_applications t WHERE t.coordinator_id IS NOT NULL
  ) s GROUP BY s.cid;
END $function$
;

CREATE OR REPLACE FUNCTION public.create_account_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, left(coalesce(nullif(NEW.raw_user_meta_data->>'display_name', ''), nullif(NEW.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(NEW.email, ''), '@', 1)), 100))
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Account profile not created: %', SQLERRM;
  END;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_assign_lead(_lead uuid, _owner uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _role text := public.crm_role(); _current uuid; _customer uuid;
BEGIN
  IF _role IS NULL OR _role NOT IN ('admin', 'BDM') THEN RAISE EXCEPTION 'Only an admin or BDM can reassign leads' USING ERRCODE = '42501'; END IF;
  SELECT owner_id, customer_id INTO _current, _customer FROM public.crm_leads WHERE id = _lead FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found'; END IF;
  IF _role = 'BDM' AND (NOT public.crm_can_access(_current) OR _owner IS NULL OR NOT public.crm_can_access(_owner)) THEN
    RAISE EXCEPTION 'Lead and employee must be in your team' USING ERRCODE = '42501';
  END IF;
  IF _owner IS NOT NULL AND NOT public.has_role(_owner, 'admin')
     AND NOT EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = _owner AND active) THEN
    RAISE EXCEPTION 'Employee is not active';
  END IF;
  UPDATE public.crm_leads SET owner_id = _owner, updated_at = now() WHERE id = _lead;
  UPDATE public.crm_customers SET owner_id = _owner WHERE id = _customer AND (owner_id IS NULL OR owner_id IS NOT DISTINCT FROM _current);
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_can_access(_owner uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN public.has_role(auth.uid(), 'admin') THEN true
    WHEN _owner IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.crm_memberships me
      WHERE me.user_id = auth.uid() AND me.active
        AND (_owner = auth.uid()
          OR (me.role = 'BDM' AND EXISTS (
                SELECT 1 FROM public.crm_memberships r
                WHERE r.user_id = _owner AND r.manager_id = auth.uid() AND r.active)))
    )
  END
$function$
;

CREATE OR REPLACE FUNCTION public.crm_create_lead(_input jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE _owner uuid := (_input->>'ownerId')::uuid; _customer uuid; _lead uuid; _role text := public.crm_role();
BEGIN
  IF _role IS NULL OR _role = 'support' THEN RAISE EXCEPTION 'Sales access required' USING ERRCODE = '42501'; END IF;
  IF NOT public.has_role(_owner, 'admin') AND NOT EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = _owner AND active) THEN
    RAISE EXCEPTION 'Assigned employee is not active';
  END IF;
  INSERT INTO public.crm_customers (full_name, email, phone, company, acknowledgement, owner_id)
  VALUES (btrim(_input->>'fullName'), btrim(coalesce(_input->>'email', '')), btrim(coalesce(_input->>'phone', '')),
    btrim(coalesce(_input->>'company', '')), nullif(btrim(coalesce(_input->>'acknowledgement', '')), ''), _owner)
  RETURNING id INTO _customer;
  INSERT INTO public.crm_leads (customer_id, title, amount, owner_id, next_follow_up, source)
  VALUES (_customer, btrim(_input->>'title'), coalesce((_input->>'amount')::numeric, 0), _owner,
    nullif(coalesce(_input->>'followUp', ''), '')::date, 'manual')
  RETURNING id INTO _lead;
  RETURN _lead;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_customer_lookup(_reference text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _ref text := upper(btrim(coalesce(_reference, '')));
BEGIN
  IF public.crm_role() IS NULL THEN RAISE EXCEPTION 'CRM access required' USING ERRCODE = '42501'; END IF;
  IF length(_ref) < 6 THEN RETURN '[]'::jsonb; END IF;
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'id', c.id, 'customer_code', c.customer_code, 'full_name', c.full_name, 'company', c.company,
      'acknowledgement', c.acknowledgement,
      'phone_last_4', CASE WHEN length(regexp_replace(c.phone, '\D', '', 'g')) >= 4 THEN right(regexp_replace(c.phone, '\D', '', 'g'), 4) END,
      'latest_stage', (SELECT l.stage FROM public.crm_leads l WHERE l.customer_id = c.id ORDER BY l.created_at DESC LIMIT 1),
      'open_tickets', (SELECT count(*) FROM public.crm_tickets t WHERE t.customer_id = c.id AND t.status <> 'resolved'),
      'created_at', c.created_at))
    FROM public.crm_customers c
    WHERE upper(c.customer_code) = _ref OR upper(coalesce(c.acknowledgement, '')) = _ref
       OR EXISTS (SELECT 1 FROM public.crm_tickets t WHERE t.customer_id = c.id AND upper(t.ticket_code) = _ref)), '[]'::jsonb);
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_import_submission(_id uuid, _kind text, _owner uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _row jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF _owner IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = _owner AND active) THEN
    RAISE EXCEPTION 'Owner must be an active CRM employee';
  END IF;
  _row := CASE _kind
    WHEN 'enquiry' THEN (SELECT to_jsonb(t) FROM public.contact_submissions t WHERE t.id = _id)
    WHEN 'registration' THEN (SELECT to_jsonb(t) FROM public.registration_applications t WHERE t.id = _id)
    WHEN 'education' THEN (SELECT to_jsonb(t) FROM public.education_support_registrations t WHERE t.id = _id)
    WHEN 'foundation' THEN (SELECT to_jsonb(t) FROM public.foundation_submissions t WHERE t.id = _id)
    WHEN 'young_innovators' THEN (SELECT to_jsonb(t) FROM public.young_innovators_registrations t WHERE t.id = _id)
    WHEN 'programme' THEN (SELECT to_jsonb(t) FROM public.programme_applications t WHERE t.id = _id)
  END;
  IF _row IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;
  PERFORM public.crm_submission_lead(_kind, _row, _owner);
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_intake_submission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    PERFORM public.crm_submission_lead(CASE TG_TABLE_NAME
      WHEN 'contact_submissions' THEN 'enquiry'
      WHEN 'registration_applications' THEN 'registration'
      WHEN 'education_support_registrations' THEN 'education'
      WHEN 'foundation_submissions' THEN 'foundation'
      WHEN 'young_innovators_registrations' THEN 'young_innovators'
      WHEN 'programme_applications' THEN 'programme' END, to_jsonb(NEW), NULL);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'CRM intake skipped for %: %', TG_TABLE_NAME, SQLERRM;
  END;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_my_manager()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT m.manager_id FROM public.crm_memberships m WHERE m.user_id = auth.uid() AND m.active
$function$
;

CREATE OR REPLACE FUNCTION public.crm_onboard_member(_user_id uuid, _input jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _role text := _input->>'role'; _manager uuid := nullif(coalesce(_input->>'managerId', ''), '')::uuid;
  _code text := upper(btrim(coalesce(_input->>'employeeCode', '')));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF _user_id IS NULL OR _role IS NULL OR _role NOT IN ('sales', 'support', 'BDE', 'BDM') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF _code = '' OR btrim(coalesce(_input->>'fullName', '')) = '' THEN RAISE EXCEPTION 'Employee code and name are required'; END IF;
  IF _manager IS NOT NULL AND (_manager = _user_id OR NOT EXISTS (
      SELECT 1 FROM public.crm_memberships WHERE user_id = _manager AND active AND role = 'BDM')) THEN
    RAISE EXCEPTION 'Manager must be an active BDM';
  END IF;
  INSERT INTO public.crm_memberships (user_id, role, manager_id, active)
  VALUES (_user_id, _role, _manager, coalesce((_input->>'active')::boolean, true))
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, manager_id = EXCLUDED.manager_id, active = EXCLUDED.active;
  INSERT INTO public.crm_employee_profiles (user_id, employee_code, full_name, phone, designation, photo_url, joining_date)
  VALUES (_user_id, _code, btrim(_input->>'fullName'), btrim(coalesce(_input->>'phone', '')), btrim(coalesce(_input->>'designation', '')),
    nullif(btrim(coalesce(_input->>'photoUrl', '')), ''), coalesce(nullif(coalesce(_input->>'joiningDate', ''), '')::date, current_date))
  ON CONFLICT (user_id) DO UPDATE SET employee_code = EXCLUDED.employee_code, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone,
    designation = EXCLUDED.designation, photo_url = EXCLUDED.photo_url, joining_date = EXCLUDED.joining_date;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_owner_for_code(_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
  RETURN _owner;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN NULL
    WHEN public.has_role(auth.uid(), 'admin') THEN 'admin'
    ELSE (SELECT m.role FROM public.crm_memberships m WHERE m.user_id = auth.uid() AND m.active)
  END
$function$
;

CREATE OR REPLACE FUNCTION public.crm_route_submission(_source text, _source_id uuid, _full_name text, _email text, _phone text, _company text, _title text, _code text, _acknowledgement text, _amount numeric, _owner uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _lead uuid; _customer uuid; _o uuid;
BEGIN
  SELECT id INTO _lead FROM public.crm_leads WHERE source = _source AND source_id = _source_id;
  IF FOUND THEN RETURN _lead; END IF;
  _o := coalesce(_owner, public.crm_owner_for_code(_code));
  IF btrim(coalesce(_email, '')) <> '' THEN
    SELECT id INTO _customer FROM public.crm_customers WHERE lower(email) = lower(btrim(_email)) ORDER BY created_at LIMIT 1;
  END IF;
  IF _customer IS NULL THEN
    INSERT INTO public.crm_customers (full_name, email, phone, company, acknowledgement, owner_id)
    VALUES (left(coalesce(nullif(btrim(_full_name), ''), 'Website visitor'), 200), left(btrim(coalesce(_email, '')), 320),
      left(btrim(coalesce(_phone, '')), 40), left(coalesce(_company, ''), 150), nullif(left(coalesce(_acknowledgement, ''), 60), ''), _o)
    RETURNING id INTO _customer;
  ELSIF _o IS NOT NULL THEN
    UPDATE public.crm_customers SET owner_id = _o WHERE id = _customer AND owner_id IS NULL;
  END IF;
  INSERT INTO public.crm_leads (customer_id, title, amount, source, source_id, owner_id, referral_code)
  VALUES (_customer, left(coalesce(nullif(btrim(_title), ''), 'Website lead'), 200), coalesce(_amount, 0), _source, _source_id, _o,
    nullif(upper(btrim(coalesce(_code, ''))), ''))
  RETURNING id INTO _lead;
  RETURN _lead;
END $function$
;

CREATE OR REPLACE FUNCTION public.crm_submission_lead(_kind text, r jsonb, _owner uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN CASE _kind
    WHEN 'enquiry' THEN public.crm_route_submission('enquiry', (r->>'id')::uuid, r->>'name', r->>'email', r->>'phone', '',
      'Enquiry: ' || coalesce(r->>'service', ''), r->>'coordinator_code', NULL, 0, _owner)
    WHEN 'registration' THEN public.crm_route_submission('registration', (r->>'id')::uuid, r->>'full_name', r->>'email', r->>'phone',
      coalesce(r->'details'->>'startupName', r->'details'->>'organization', r->'details'->>'businessName', ''),
      'Registration: ' || coalesce(r->>'category', ''), r->>'coordinator_code', r->>'application_code', 0, _owner)
    WHEN 'education' THEN public.crm_route_submission('education', (r->>'id')::uuid, r->>'student_name', r->>'email', r->>'mobile',
      coalesce(r->>'institution_name', ''), 'Education Support: ' || coalesce(r->>'application_type', ''), r->>'coordinator_code',
      r->>'ack_number', coalesce((r->>'registration_fee')::numeric, 0), _owner)
    WHEN 'foundation' THEN public.crm_route_submission('foundation', (r->>'id')::uuid, r->>'full_name', r->>'email', r->>'phone', '',
      'Foundation: ' || coalesce(r->>'kind', ''), r->>'coordinator_code', NULL, 0, _owner)
    WHEN 'young_innovators' THEN public.crm_route_submission('young_innovators', (r->>'id')::uuid, r->>'guardian_name', r->>'guardian_email',
      r->>'guardian_phone', '', 'Young Innovators: Class ' || coalesce(r->>'school_class', ''), r->>'coordinator_code', r->>'application_code',
      coalesce((r->>'fee_amount')::numeric, 0), _owner)
    WHEN 'programme' THEN public.crm_route_submission('programme', (r->>'id')::uuid, r->>'full_name', r->>'email', r->>'phone', '',
      'Programme: ' || coalesce(r->>'programme', ''), r->>'coordinator_code', r->>'application_code',
      coalesce((r->>'amount_paise')::numeric, 0) / 100, _owner)
    ELSE NULL END;
END $function$
;

CREATE OR REPLACE FUNCTION public.first_admin_setup_status()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _first uuid; _confirmed timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 'closed'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN 'closed'; END IF;
  SELECT u.id INTO _first FROM auth.users u ORDER BY u.created_at, u.id LIMIT 1;
  IF _first IS DISTINCT FROM auth.uid() THEN RETURN 'not_first_account'; END IF;
  SELECT u.email_confirmed_at INTO _confirmed FROM auth.users u WHERE u.id = auth.uid();
  RETURN CASE WHEN _confirmed IS NULL THEN 'unverified' ELSE 'eligible' END;
END $function$
;

CREATE OR REPLACE FUNCTION public.guard_education_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- A new mismatch check needs a fresh human confirmation.
    IF NEW.flags_checked_at IS DISTINCT FROM OLD.flags_checked_at AND NEW.flags_confirmed_at IS NOT DISTINCT FROM OLD.flags_confirmed_at THEN
      NEW.flags_confirmed_at := NULL; NEW.flags_confirmed_by := NULL;
    END IF;
    IF NEW.flags_confirmed_at IS NOT NULL AND NEW.flags_confirmed_at IS DISTINCT FROM OLD.flags_confirmed_at THEN
      IF NEW.flags_checked_at IS NULL THEN RAISE EXCEPTION 'Run the mismatch check first' USING ERRCODE = '23514'; END IF;
      NEW.flags_confirmed_at := now(); NEW.flags_confirmed_by := auth.uid();
    END IF;
    NEW.updated_at := now();
  END IF;
  IF NEW.approval_status = 'approved' AND (TG_OP = 'INSERT' OR OLD.approval_status IS DISTINCT FROM 'approved') THEN
    IF NEW.payment_status <> 'paid' OR NEW.flags_checked_at IS NULL OR NEW.flags_confirmed_at IS NULL THEN
      RAISE EXCEPTION 'Approval needs confirmed payment and a confirmed mismatch check' USING ERRCODE = '23514';
    END IF;
    NEW.approved_at := now(); NEW.approved_by := auth.uid();
  ELSIF NEW.approval_status IS DISTINCT FROM 'approved' THEN
    NEW.approved_at := NULL; NEW.approved_by := NULL;
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$function$
;

CREATE OR REPLACE FUNCTION public.issue_ack_number(_form text, _state text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _serial integer; _initial integer; _table text; _column text; _maximum integer; _name text;
BEGIN
  _name := CASE _form WHEN '01' THEN 'Scholarship' WHEN '02' THEN 'Young Innovators' WHEN '03' THEN 'Funding Programme'
    WHEN '04' THEN 'Foundation' WHEN '05' THEN 'Registration' WHEN '06' THEN 'Enquiry' END;
  IF _name IS NULL THEN RAISE EXCEPTION 'Unknown form code for acknowledgement number'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('acknowledgement:' || _form));
  IF NOT EXISTS (SELECT 1 FROM public.ack_form_counters WHERE form_code = _form) THEN
    _initial := 0;
    FOR _table, _column IN SELECT c.table_name, c.column_name FROM information_schema.columns c WHERE c.table_schema='public' AND c.column_name IN ('ack_number','acknowledgement_number','acknowledgement_no') LOOP
      EXECUTE format('SELECT coalesce(max(right(%1$I,5)::integer),0) FROM public.%2$I WHERE %1$I ~ ''^[0-9]{15}$'' AND substring(%1$I FROM 9 FOR 2) = $1', _column, _table) INTO _maximum USING _form;
      _initial := greatest(_initial, _maximum);
    END LOOP;
    INSERT INTO public.ack_form_counters(form_code, form_name, last_serial) VALUES (_form, _name, _initial) ON CONFLICT (form_code) DO NOTHING;
  END IF;
  UPDATE public.ack_form_counters SET last_serial = last_serial + 1 WHERE form_code = _form AND last_serial < 99999 RETURNING last_serial INTO _serial;
  IF _serial IS NULL THEN RAISE EXCEPTION 'Acknowledgement series exhausted; contact the Foundation team'; END IF;
  RETURN to_char(now() AT TIME ZONE 'Asia/Kolkata','YYMMDD') || public.ack_state_code(_state) || _form || lpad(_serial::text,5,'0');
END $function$
;

CREATE OR REPLACE FUNCTION public.json_text_list(_value jsonb)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE jsonb_typeof(_value)
    WHEN 'array' THEN ARRAY(SELECT public.people_profile_safe_text(x) FROM jsonb_array_elements_text(_value) x WHERE btrim(x) <> '' LIMIT 12)
    WHEN 'string' THEN ARRAY(SELECT public.people_profile_safe_text(x) FROM unnest(string_to_array(_value #>> '{}', ',')) x WHERE btrim(x) <> '' LIMIT 12)
    ELSE '{}'::text[] END
$function$
;

CREATE OR REPLACE FUNCTION public.people_profile_safe_text(_value text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT left(btrim(regexp_replace(regexp_replace(coalesce(_value, ''),
    '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}', '', 'g'),
    '\+?[0-9][0-9 ().-]{7,}[0-9]', '', 'g')), 600)
$function$
;

CREATE OR REPLACE FUNCTION public.queue_drive_document()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.document_path IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.document_path IS DISTINCT FROM OLD.document_path) THEN
    INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind)
    VALUES (TG_TABLE_NAME, NEW.id, 'file')
    ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.queue_sheet_mirror()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind)
  VALUES (TG_TABLE_NAME, NEW.id, 'row')
  ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.requeue_all_google_copies(_include_documents boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _count integer := 0;
  _n integer;
  _t text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  FOREACH _t IN ARRAY ARRAY['contact_submissions','registration_applications','programme_applications','foundation_submissions','young_innovators_registrations','prototype_submissions','crm_leads','programme_payments'] LOOP
    EXECUTE format(
      'INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind) SELECT %L, id, ''row'' FROM public.%I
       ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = ''''', _t, _t);
    GET DIAGNOSTICS _n = ROW_COUNT;
    _count := _count + _n;
  END LOOP;
  IF _include_documents THEN
    INSERT INTO public.sheet_mirror_queue (source_table, row_id, kind)
    SELECT 'registration_applications', id, 'file' FROM public.registration_applications WHERE document_path IS NOT NULL
    ON CONFLICT (source_table, row_id, kind) DO UPDATE SET queued_at = now(), attempts = 0, last_error = '';
  END IF;
  RETURN _count;
END $function$
;

CREATE OR REPLACE FUNCTION public.sync_approved_application_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _d jsonb := coalesce(NEW.details, '{}'::jsonb);
  _group text; _name text; _role text; _location text; _focus text[]; _summary text; _slug text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'approved' THEN
    DELETE FROM public.people_profiles WHERE source_application_id = NEW.id;
    RETURN NEW;
  END IF;
  _group := CASE NEW.category WHEN 'investor' THEN 'investors' WHEN 'mentor' THEN 'mentors' WHEN 'startup' THEN 'startups' WHEN 'business' THEN 'businesses' END;
  IF _group IS NULL THEN RETURN NEW; END IF;
  _name := public.people_profile_safe_text(CASE NEW.category
    WHEN 'startup' THEN coalesce(nullif(_d->>'startupName', ''), NEW.full_name)
    WHEN 'business' THEN coalesce(nullif(_d->>'businessName', ''), NEW.full_name)
    ELSE NEW.full_name END);
  _role := public.people_profile_safe_text(CASE NEW.category
    WHEN 'mentor' THEN concat_ws(', ', nullif(_d->>'designation', ''), nullif(_d->>'organization', ''))
    WHEN 'investor' THEN coalesce(_d->>'investmentFocus', '')
    WHEN 'startup' THEN concat_ws(' · ', nullif(_d->>'startupStage', ''), nullif(_d->>'industry', ''))
    ELSE coalesce(_d->>'industry', '') END);
  _location := public.people_profile_safe_text(coalesce(nullif(_d->>'location', ''), nullif(_d->>'headquarter', ''), nullif(_d->>'city', ''), ''));
  _focus := public.json_text_list(coalesce(_d->'supportAreas', _d->'expertise', _d->'interests', _d->'mentorAudience'));
  _summary := public.people_profile_safe_text(coalesce(nullif(_d->>'product', ''), nullif(_d->>'mentorAreas', ''),
    nullif(_d->>'investmentThesis', ''), nullif(_d->>'products', ''), ''));
  _slug := btrim(lower(regexp_replace(coalesce(nullif(_name, ''), 'profile'), '[^a-zA-Z0-9]+', '-', 'g')), '-')
    || '-' || left(replace(NEW.id::text, '-', ''), 6);
  INSERT INTO public.people_profiles (person_group, slug, name, role, location, focus, summary, source_application_id)
  VALUES (_group, _slug, coalesce(nullif(_name, ''), 'Profile'), _role, _location, coalesce(_focus, '{}'), _summary, NEW.id)
  ON CONFLICT (source_application_id) DO UPDATE SET
    person_group = EXCLUDED.person_group, name = EXCLUDED.name, role = EXCLUDED.role,
    location = EXCLUDED.location, focus = EXCLUDED.focus, summary = EXCLUDED.summary;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.verify_employee(_employee_id text, _code text)
 RETURNS TABLE(employee_id text, full_name text, photo_url text, designation text, department text, status text, valid_until date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
#variable_conflict use_column
DECLARE _id text := upper(trim(coalesce(_employee_id, ''))); _e public.employees%ROWTYPE; _ok boolean := false;
BEGIN
  IF (SELECT count(*) FROM public.employee_verification_attempts a
      WHERE a.employee_id = _id AND NOT a.success AND a.created_at > now() - interval '15 minutes') >= 5 THEN
    RAISE EXCEPTION 'too_many_attempts';
  END IF;
  SELECT * INTO _e FROM public.employees e WHERE upper(e.employee_id) = _id;
  IF FOUND AND coalesce(_code, '') <> '' THEN _ok := _e.code_hash = extensions.crypt(_code, _e.code_hash); END IF;
  INSERT INTO public.employee_verification_attempts (employee_id, success) VALUES (_id, _ok);
  IF random() < 0.01 THEN DELETE FROM public.employee_verification_attempts a WHERE a.created_at < now() - interval '7 days'; END IF;
  IF _ok THEN
    RETURN QUERY SELECT _e.employee_id, _e.full_name, _e.photo_url, _e.designation, _e.department, _e.status, _e.valid_until;
  END IF;
END $function$
;
SET check_function_bodies = on;

-- ===== Triggers, row security, policies, grants, storage buckets =====
CREATE TRIGGER assign_ack BEFORE INSERT ON public.contact_submissions FOR EACH ROW EXECUTE FUNCTION assign_form_ack_number('06');
CREATE TRIGGER crm_intake AFTER INSERT ON public.contact_submissions FOR EACH ROW EXECUTE FUNCTION crm_intake_submission();
CREATE TRIGGER mirror_contact_submissions AFTER INSERT OR UPDATE ON public.contact_submissions FOR EACH ROW EXECUTE FUNCTION queue_sheet_mirror();
CREATE TRIGGER mirror_crm_leads AFTER INSERT OR UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION queue_sheet_mirror();
CREATE TRIGGER assign_education_ack BEFORE INSERT ON public.education_support_registrations FOR EACH ROW EXECUTE FUNCTION assign_education_ack_number();
CREATE TRIGGER assign_education_ack_on_payment BEFORE UPDATE OF payment_status ON public.education_support_registrations FOR EACH ROW EXECUTE FUNCTION assign_education_ack_number();
CREATE TRIGGER crm_intake AFTER INSERT ON public.education_support_registrations FOR EACH ROW EXECUTE FUNCTION crm_intake_submission();
CREATE TRIGGER guard_education_approval BEFORE INSERT OR UPDATE ON public.education_support_registrations FOR EACH ROW EXECUTE FUNCTION guard_education_approval();
CREATE TRIGGER assign_ack BEFORE INSERT ON public.foundation_submissions FOR EACH ROW EXECUTE FUNCTION assign_form_ack_number('04');
CREATE TRIGGER crm_intake AFTER INSERT ON public.foundation_submissions FOR EACH ROW EXECUTE FUNCTION crm_intake_submission();
CREATE TRIGGER mirror_foundation_submissions AFTER INSERT OR UPDATE ON public.foundation_submissions FOR EACH ROW EXECUTE FUNCTION queue_sheet_mirror();
CREATE TRIGGER assign_ack BEFORE INSERT ON public.programme_applications FOR EACH ROW EXECUTE FUNCTION assign_form_ack_number('03');
CREATE TRIGGER crm_intake AFTER INSERT ON public.programme_applications FOR EACH ROW EXECUTE FUNCTION crm_intake_submission();
CREATE TRIGGER mirror_programme_applications AFTER INSERT OR UPDATE ON public.programme_applications FOR EACH ROW EXECUTE FUNCTION queue_sheet_mirror();
CREATE TRIGGER mirror_programme_payments AFTER INSERT OR UPDATE ON public.programme_payments FOR EACH ROW EXECUTE FUNCTION queue_sheet_mirror();
CREATE TRIGGER mirror_prototype_submissions AFTER INSERT OR UPDATE ON public.prototype_submissions FOR EACH ROW EXECUTE FUNCTION queue_sheet_mirror();
CREATE TRIGGER assign_ack BEFORE INSERT ON public.registration_applications FOR EACH ROW EXECUTE FUNCTION assign_form_ack_number('05');
CREATE TRIGGER crm_intake AFTER INSERT ON public.registration_applications FOR EACH ROW EXECUTE FUNCTION crm_intake_submission();
CREATE TRIGGER mirror_registration_applications AFTER INSERT OR UPDATE ON public.registration_applications FOR EACH ROW EXECUTE FUNCTION queue_sheet_mirror();
CREATE TRIGGER mirror_registration_documents AFTER INSERT OR UPDATE OF document_path ON public.registration_applications FOR EACH ROW EXECUTE FUNCTION queue_drive_document();
CREATE TRIGGER sync_approved_application_profile AFTER INSERT OR UPDATE OF status, category, full_name, details ON public.registration_applications FOR EACH ROW EXECUTE FUNCTION sync_approved_application_profile();
CREATE TRIGGER assign_ack BEFORE INSERT ON public.young_innovators_registrations FOR EACH ROW EXECUTE FUNCTION assign_form_ack_number('02');
CREATE TRIGGER crm_intake AFTER INSERT ON public.young_innovators_registrations FOR EACH ROW EXECUTE FUNCTION crm_intake_submission();
CREATE TRIGGER mirror_young_innovators_registrations AFTER INSERT OR UPDATE ON public.young_innovators_registrations FOR EACH ROW EXECUTE FUNCTION queue_sheet_mirror();
ALTER TABLE public.ack_form_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_programme_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_district_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_staff_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_support_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submission_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foundation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_copy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_provider_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prototype_ai_access_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prototype_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_mirror_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.young_innovators_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage enquiries" ON public.contact_submissions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage coordinators" ON public.coordinators AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage country logos" ON public.country_logos AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete programme fees" ON public.country_programme_fees AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert programme fees" ON public.country_programme_fees AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read all programme fees" ON public.country_programme_fees AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update programme fees" ON public.country_programme_fees AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Visitors read announced programme fees" ON public.country_programme_fees AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((amount IS NOT NULL));
CREATE POLICY "CRM log own activities" ON public.crm_activities AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((actor_id = auth.uid()) AND crm_can_access(owner_id) AND (kind = ANY (ARRAY['note'::text, 'call'::text, 'email'::text, 'meeting'::text]))));
CREATE POLICY "CRM read visible activities" ON public.crm_activities AS PERMISSIVE FOR SELECT TO authenticated USING (crm_can_access(owner_id));
CREATE POLICY "Admins delete customers" ON public.crm_customers AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "CRM read visible customers" ON public.crm_customers AS PERMISSIVE FOR SELECT TO authenticated USING ((crm_can_access(owner_id) OR (EXISTS ( SELECT 1
   FROM crm_leads l
  WHERE ((l.customer_id = crm_customers.id) AND crm_can_access(l.owner_id))))));
CREATE POLICY "CRM sales create customers" ON public.crm_customers AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((crm_role() = ANY (ARRAY['admin'::text, 'sales'::text, 'BDE'::text, 'BDM'::text])) AND crm_can_access(owner_id)));
CREATE POLICY "CRM update visible customers" ON public.crm_customers AS PERMISSIVE FOR UPDATE TO authenticated USING (crm_can_access(owner_id)) WITH CHECK (crm_can_access(owner_id));
CREATE POLICY "Admins manage CRM profiles" ON public.crm_employee_profiles AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "CRM members read visible profiles" ON public.crm_employee_profiles AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR crm_can_access(user_id) OR (user_id = crm_my_manager())));
CREATE POLICY "Admins delete leads" ON public.crm_leads AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "CRM read visible leads" ON public.crm_leads AS PERMISSIVE FOR SELECT TO authenticated USING (crm_can_access(owner_id));
CREATE POLICY "CRM sales create leads" ON public.crm_leads AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((crm_role() = ANY (ARRAY['admin'::text, 'sales'::text, 'BDE'::text, 'BDM'::text])) AND crm_can_access(owner_id)));
CREATE POLICY "CRM update visible leads" ON public.crm_leads AS PERMISSIVE FOR UPDATE TO authenticated USING (crm_can_access(owner_id)) WITH CHECK (crm_can_access(owner_id));
CREATE POLICY "Admins manage CRM members" ON public.crm_memberships AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "CRM members read visible members" ON public.crm_memberships AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR crm_can_access(user_id) OR (user_id = crm_my_manager())));
CREATE POLICY "CRM read visible targets" ON public.crm_targets AS PERMISSIVE FOR SELECT TO authenticated USING (crm_can_access(owner_id));
CREATE POLICY "Managers set targets" ON public.crm_targets AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((crm_role() = ANY (ARRAY['admin'::text, 'BDM'::text])) AND crm_can_access(owner_id)));
CREATE POLICY "Managers update targets" ON public.crm_targets AS PERMISSIVE FOR UPDATE TO authenticated USING (((crm_role() = ANY (ARRAY['admin'::text, 'BDM'::text])) AND crm_can_access(owner_id))) WITH CHECK (((crm_role() = ANY (ARRAY['admin'::text, 'BDM'::text])) AND crm_can_access(owner_id)));
CREATE POLICY "CRM create tasks" ON public.crm_tasks AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (crm_can_access(owner_id));
CREATE POLICY "CRM delete visible tasks" ON public.crm_tasks AS PERMISSIVE FOR DELETE TO authenticated USING (crm_can_access(owner_id));
CREATE POLICY "CRM read visible tasks" ON public.crm_tasks AS PERMISSIVE FOR SELECT TO authenticated USING (crm_can_access(owner_id));
CREATE POLICY "CRM update visible tasks" ON public.crm_tasks AS PERMISSIVE FOR UPDATE TO authenticated USING (crm_can_access(owner_id)) WITH CHECK (crm_can_access(owner_id));
CREATE POLICY "Admins delete tickets" ON public.crm_tickets AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "CRM create tickets" ON public.crm_tickets AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (crm_can_access(owner_id));
CREATE POLICY "CRM read visible tickets" ON public.crm_tickets AS PERMISSIVE FOR SELECT TO authenticated USING (crm_can_access(owner_id));
CREATE POLICY "CRM update visible tickets" ON public.crm_tickets AS PERMISSIVE FOR UPDATE TO authenticated USING (crm_can_access(owner_id)) WITH CHECK (crm_can_access(owner_id));
CREATE POLICY "Admins manage reports" ON public.customer_reports AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read district codes" ON public.education_district_codes AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete staff access" ON public.education_staff_access AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert staff access" ON public.education_staff_access AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update staff access" ON public.education_staff_access AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff read own access; admins read all" ON public.education_staff_access AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins manage education registrations" ON public.education_support_registrations AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage employees" ON public.employees AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage foundation forms" ON public.foundation_submissions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins add Google copy settings" ON public.google_copy_settings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins change Google copy settings" ON public.google_copy_settings AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read Google copy settings" ON public.google_copy_settings AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read all payment options" ON public.payment_options AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update payment options" ON public.payment_options AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Visitors read configured payment options" ON public.payment_options AS PERMISSIVE FOR SELECT TO anon, authenticated USING (((payment_link IS NOT NULL) OR (razorpay_button_id IS NOT NULL)));
CREATE POLICY "Admins delete people profiles" ON public.people_profiles AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert people profiles" ON public.people_profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update people profiles" ON public.people_profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Permitted viewers read people profiles" ON public.people_profiles AS PERMISSIVE FOR SELECT TO anon, authenticated USING (can_view_people_profiles());
CREATE POLICY "Own profile insert" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));
CREATE POLICY "Own profile read" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((id = auth.uid()));
CREATE POLICY "Own profile update" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));
CREATE POLICY "Admins manage programme applications" ON public.programme_applications AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read programme payments" ON public.programme_payments AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage prototype submissions" ON public.prototype_submissions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage applications" ON public.registration_applications AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users read own roles; admins read all" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins delete student registrations" ON public.young_innovators_registrations AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins import student registrations" ON public.young_innovators_registrations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read student registrations" ON public.young_innovators_registrations AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins review student registrations" ON public.young_innovators_registrations AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) AND (status = ANY (ARRAY['new'::text, 'reviewed'::text, 'approved'::text, 'rejected'::text]))));
CREATE POLICY "Admins delete country logo files" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'country-logos'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins delete customer report files" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'customer-reports'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins read country logo files" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'country-logos'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins read customer report files" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'customer-reports'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins read registration documents" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'registration-documents'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins replace country logo files" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'country-logos'::text) AND has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((bucket_id = 'country-logos'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins replace customer report files" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'customer-reports'::text) AND has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((bucket_id = 'customer-reports'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins upload country logo files" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'country-logos'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins upload customer report files" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'customer-reports'::text) AND has_role(auth.uid(), 'admin'::app_role)));
REVOKE ALL ON FUNCTION ack_state_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION ack_state_code(text) TO anon;
GRANT EXECUTE ON FUNCTION ack_state_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION ack_state_code(text) TO service_role;
REVOKE ALL ON FUNCTION admin_import_records(text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_import_records(text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_import_records(text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION admin_save_employee(text,text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_save_employee(text,text,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_save_employee(text,text,text,text,text,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION admin_setup_metadata() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_setup_metadata() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_setup_metadata() TO service_role;
REVOKE ALL ON FUNCTION assign_education_ack_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION assign_education_ack_number() TO service_role;
REVOKE ALL ON FUNCTION assign_form_ack_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION assign_form_ack_number() TO service_role;
REVOKE ALL ON FUNCTION can_view_people_profiles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION can_view_people_profiles() TO anon;
GRANT EXECUTE ON FUNCTION can_view_people_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_people_profiles() TO service_role;
REVOKE ALL ON FUNCTION claim_first_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_first_admin() TO service_role;
REVOKE ALL ON FUNCTION consume_form_submission_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_form_submission_limit(text) TO service_role;
REVOKE ALL ON FUNCTION coordinator_name_for_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION coordinator_name_for_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION coordinator_name_for_code(text) TO service_role;
REVOKE ALL ON FUNCTION coordinator_referral_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION coordinator_referral_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION coordinator_referral_stats() TO service_role;
REVOKE ALL ON FUNCTION create_account_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_account_profile() TO service_role;
REVOKE ALL ON FUNCTION crm_assign_lead(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_assign_lead(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION crm_assign_lead(uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION crm_can_access(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_can_access(uuid) TO anon;
GRANT EXECUTE ON FUNCTION crm_can_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION crm_can_access(uuid) TO service_role;
REVOKE ALL ON FUNCTION crm_create_lead(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_create_lead(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION crm_create_lead(jsonb) TO service_role;
REVOKE ALL ON FUNCTION crm_customer_lookup(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_customer_lookup(text) TO authenticated;
GRANT EXECUTE ON FUNCTION crm_customer_lookup(text) TO service_role;
REVOKE ALL ON FUNCTION crm_import_submission(uuid,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_import_submission(uuid,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION crm_import_submission(uuid,text,uuid) TO service_role;
REVOKE ALL ON FUNCTION crm_intake_submission() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_intake_submission() TO service_role;
REVOKE ALL ON FUNCTION crm_my_manager() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_my_manager() TO anon;
GRANT EXECUTE ON FUNCTION crm_my_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION crm_my_manager() TO service_role;
REVOKE ALL ON FUNCTION crm_onboard_member(uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_onboard_member(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION crm_onboard_member(uuid,jsonb) TO service_role;
REVOKE ALL ON FUNCTION crm_owner_for_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_owner_for_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION crm_owner_for_code(text) TO service_role;
REVOKE ALL ON FUNCTION crm_role() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_role() TO anon;
GRANT EXECUTE ON FUNCTION crm_role() TO authenticated;
GRANT EXECUTE ON FUNCTION crm_role() TO service_role;
REVOKE ALL ON FUNCTION crm_route_submission(text,uuid,text,text,text,text,text,text,text,numeric,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_route_submission(text,uuid,text,text,text,text,text,text,text,numeric,uuid) TO service_role;
REVOKE ALL ON FUNCTION crm_submission_lead(text,jsonb,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION crm_submission_lead(text,jsonb,uuid) TO service_role;
REVOKE ALL ON FUNCTION first_admin_setup_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION first_admin_setup_status() TO authenticated;
GRANT EXECUTE ON FUNCTION first_admin_setup_status() TO service_role;
REVOKE ALL ON FUNCTION guard_education_approval() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION guard_education_approval() TO service_role;
REVOKE ALL ON FUNCTION has_role(uuid,app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION has_role(uuid,app_role) TO anon;
GRANT EXECUTE ON FUNCTION has_role(uuid,app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(uuid,app_role) TO service_role;
REVOKE ALL ON FUNCTION issue_ack_number(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION issue_ack_number(text,text) TO service_role;
REVOKE ALL ON FUNCTION json_text_list(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION json_text_list(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION json_text_list(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION json_text_list(jsonb) TO service_role;
REVOKE ALL ON FUNCTION people_profile_safe_text(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION people_profile_safe_text(text) TO anon;
GRANT EXECUTE ON FUNCTION people_profile_safe_text(text) TO authenticated;
GRANT EXECUTE ON FUNCTION people_profile_safe_text(text) TO service_role;
REVOKE ALL ON FUNCTION queue_drive_document() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION queue_drive_document() TO service_role;
REVOKE ALL ON FUNCTION queue_sheet_mirror() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION queue_sheet_mirror() TO service_role;
REVOKE ALL ON FUNCTION requeue_all_google_copies(boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION requeue_all_google_copies(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION requeue_all_google_copies(boolean) TO service_role;
REVOKE ALL ON FUNCTION sync_approved_application_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION sync_approved_application_profile() TO service_role;
REVOKE ALL ON FUNCTION verify_employee(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_employee(text,text) TO anon;
GRANT EXECUTE ON FUNCTION verify_employee(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_employee(text,text) TO service_role;
-- ===== Table access (a new Supabase project grants none by default) =====
-- Row Level Security policies above still decide which rows each role can see or change.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.ack_form_counters TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ack_form_counters TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_submissions TO authenticated;
GRANT ALL ON public.coordinators TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coordinators TO authenticated;
GRANT ALL ON public.country_logos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.country_logos TO authenticated;
GRANT ALL ON public.country_programme_fees TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.country_programme_fees TO authenticated;
GRANT SELECT ON public.country_programme_fees TO anon;
GRANT ALL ON public.crm_activities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities TO authenticated;
GRANT ALL ON public.crm_customers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_customers TO authenticated;
GRANT ALL ON public.crm_employee_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_employee_profiles TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_memberships TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_memberships TO authenticated;
GRANT ALL ON public.crm_targets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_targets TO authenticated;
GRANT ALL ON public.crm_tasks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tasks TO authenticated;
GRANT ALL ON public.crm_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tickets TO authenticated;
GRANT ALL ON public.customer_reports TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_reports TO authenticated;
GRANT ALL ON public.education_district_codes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education_district_codes TO authenticated;
GRANT ALL ON public.education_staff_access TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education_staff_access TO authenticated;
GRANT ALL ON public.education_support_registrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education_support_registrations TO authenticated;
GRANT ALL ON public.employee_verification_attempts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_verification_attempts TO authenticated;
GRANT ALL ON public.employees TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.form_submission_limits TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_submission_limits TO authenticated;
GRANT ALL ON public.foundation_submissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foundation_submissions TO authenticated;
GRANT ALL ON public.google_copy_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_copy_settings TO authenticated;
GRANT ALL ON public.payment_options TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_options TO authenticated;
GRANT SELECT ON public.payment_options TO anon;
GRANT ALL ON public.payment_provider_tokens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_provider_tokens TO authenticated;
GRANT ALL ON public.people_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_profiles TO authenticated;
GRANT SELECT ON public.people_profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.programme_applications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programme_applications TO authenticated;
GRANT ALL ON public.programme_payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programme_payments TO authenticated;
GRANT ALL ON public.prototype_ai_access_state TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prototype_ai_access_state TO authenticated;
GRANT ALL ON public.prototype_submissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prototype_submissions TO authenticated;
GRANT ALL ON public.registration_applications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registration_applications TO authenticated;
GRANT ALL ON public.sheet_mirror_queue TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sheet_mirror_queue TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.young_innovators_registrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.young_innovators_registrations TO authenticated;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('country-logos', 'country-logos', false, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('customer-reports', 'customer-reports', false, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('registration-documents', 'registration-documents', false, NULL, NULL) ON CONFLICT (id) DO NOTHING;

-- ===== Admin controls: fees, payment embed codes, hero pictures =====

-- 1) Fees and payment embed codes live on each payment option.
ALTER TABLE public.payment_options ADD COLUMN IF NOT EXISTS amount integer;
ALTER TABLE public.payment_options ADD COLUMN IF NOT EXISTS embed_code text;
ALTER TABLE public.payment_options DROP CONSTRAINT IF EXISTS payment_options_amount_check;
ALTER TABLE public.payment_options ADD CONSTRAINT payment_options_amount_check CHECK (amount IS NULL OR (amount >= 1 AND amount <= 1000000));
ALTER TABLE public.payment_options DROP CONSTRAINT IF EXISTS payment_options_embed_code_check;
ALTER TABLE public.payment_options ADD CONSTRAINT payment_options_embed_code_check CHECK (embed_code IS NULL OR length(embed_code) <= 10000);
DROP POLICY IF EXISTS "Visitors read configured payment options" ON public.payment_options;
CREATE POLICY "Visitors read configured payment options" ON public.payment_options AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (payment_link IS NOT NULL OR razorpay_button_id IS NOT NULL OR amount IS NOT NULL OR embed_code IS NOT NULL);

-- 2) Hero pictures chosen by the admin per page and theme.
CREATE TABLE IF NOT EXISTS public.hero_images (
  page text NOT NULL CHECK (page IN ('home', 'education-support', 'young-innovators')),
  theme text NOT NULL CHECK (theme IN ('dark', 'light')),
  image_url text NOT NULL CHECK (image_url ~ '^https://'),
  storage_path text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid,
  PRIMARY KEY (page, theme)
);
GRANT SELECT ON public.hero_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_images TO authenticated;
GRANT ALL ON public.hero_images TO service_role;
ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone reads hero images" ON public.hero_images;
CREATE POLICY "Everyone reads hero images" ON public.hero_images FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins add hero images" ON public.hero_images;
CREATE POLICY "Admins add hero images" ON public.hero_images FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins change hero images" ON public.hero_images;
CREATE POLICY "Admins change hero images" ON public.hero_images FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins remove hero images" ON public.hero_images;
CREATE POLICY "Admins remove hero images" ON public.hero_images FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Public picture folder (pictures are shown on the website); only admins can upload, replace or delete.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('hero-images', 'hero-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Admins upload hero image files" ON storage.objects;
CREATE POLICY "Admins upload hero image files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins replace hero image files" ON storage.objects;
CREATE POLICY "Admins replace hero image files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins delete hero image files" ON storage.objects;
CREATE POLICY "Admins delete hero image files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hero-images' AND has_role(auth.uid(), 'admin'::app_role));


-- Creates a profile row for every new login account (enable if wanted):
-- CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.create_account_profile();
