CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE SEQUENCE IF NOT EXISTS public.crm_customer_code_seq;
CREATE SEQUENCE IF NOT EXISTS public.crm_ticket_code_seq;
CREATE SEQUENCE IF NOT EXISTS public.education_ack_serial;
CREATE SEQUENCE IF NOT EXISTS public.sheet_mirror_queue_id_seq;

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

CREATE INDEX crm_customers_email ON public.crm_customers USING btree (lower(email));
CREATE INDEX crm_leads_owner ON public.crm_leads USING btree (owner_id);
CREATE UNIQUE INDEX crm_leads_source_unique ON public.crm_leads USING btree (source, source_id) WHERE (source_id IS NOT NULL);
CREATE INDEX education_support_coordinator_code ON public.education_support_registrations USING btree (coordinator_code);
CREATE INDEX education_support_created_at ON public.education_support_registrations USING btree (created_at);
CREATE UNIQUE INDEX education_support_payment_reference_unique ON public.education_support_registrations USING btree (payment_reference) WHERE ((payment_reference IS NOT NULL) AND (payment_reference <> ''::text));
CREATE UNIQUE INDEX education_support_registration_id_unique ON public.education_support_registrations USING btree (registration_id) WHERE (registration_id IS NOT NULL);
CREATE INDEX employee_verification_attempts_lookup ON public.employee_verification_attempts USING btree (employee_id, created_at);