ALTER TABLE public.global_settings DISABLE TRIGGER c_settings_history;
ALTER TABLE public.payment_options DISABLE TRIGGER c_settings_history;
ALTER TABLE public.volunteer_settings DISABLE TRIGGER c_settings_history;
ALTER TABLE public.volunteer_form_commissions DISABLE TRIGGER c_settings_history;
ALTER TABLE public.crm_incentive_plans DISABLE TRIGGER c_settings_history;

SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"service_role"}',true);
INSERT INTO public.c_critical_write_context(tx,actor) VALUES (txid_current(),'00000000-0000-0000-0000-000000000001');
INSERT INTO public.ack_form_counters (form_code, form_name, last_serial) VALUES
  ('01','Scholarship',0),('02','Young Innovators',0),('03','Funding Programme',0),('04','Foundation',0),('05','Registration',0),('06','Enquiry',0)
ON CONFLICT (form_code) DO NOTHING;

INSERT INTO public.leave_policies(leave_type,label,days_per_year,sort_order) VALUES ('casual','Casual leave',12,1),('sick','Sick leave',12,2),('earned','Earned leave',15,3),('unpaid','Unpaid leave',0,4) ON CONFLICT DO NOTHING;

INSERT INTO public.request_routes(type,label,category,audience,kind,steps,steps_no_manager,sla_hours,sort_order) VALUES
  ('leave','Leave','Leave & attendance','employee','leave',ARRAY['manager','hr'],ARRAY['hr'],48,0),
  ('wfh','Work from home','Leave & attendance','employee','leave',ARRAY['manager','hr'],ARRAY['hr'],48,1),
  ('permission','Permission','Leave & attendance','employee','attendance',ARRAY['manager'],ARRAY['hr'],24,2),
  ('attendance_correction','Attendance correction','Leave & attendance','employee','attendance',ARRAY['manager','hr'],ARRAY['hr'],48,3),
  ('volunteer_absence','Volunteer absence','Volunteers','volunteer','leave',ARRAY['coordinator'],ARRAY['admin'],48,4),
  ('reimbursement','Reimbursement','Money','employee','money',ARRAY['manager','accounts','finance'],ARRAY['accounts','finance'],72,5),
  ('salary_advance','Salary advance','Money','employee','money',ARRAY['manager','hr','finance'],ARRAY['hr','finance'],72,6),
  ('expense','Expense claim','Money','employee','money',ARRAY['manager','accounts','finance'],ARRAY['accounts','finance'],72,7),
  ('payment_request','Payment request','Money','employee','money',ARRAY['manager','accounts','finance'],ARRAY['accounts','finance'],72,8),
  ('customer_refund','Customer cancellation / refund','Money','employee','money',ARRAY['accounts','finance'],ARRAY['accounts','finance'],72,9),
  ('technical_ticket','Technical support','Support & HR help','all','ticket',ARRAY['support'],ARRAY['support'],24,10),
  ('support_ticket','Support ticket','Support & HR help','all','ticket',ARRAY['support'],ARRAY['support'],24,11),
  ('hr_ticket','HR help','Support & HR help','employee','ticket',ARRAY['hr'],ARRAY['hr'],48,12),
  ('salary_query','Salary query','Support & HR help','employee','ticket',ARRAY['hr'],ARRAY['hr'],48,13),
  ('document_request','Document request','Support & HR help','employee','general',ARRAY['hr'],ARRAY['hr'],48,14),
  ('profile_update','Profile update','Support & HR help','employee','general',ARRAY['hr'],ARRAY['hr'],48,15),
  ('meeting_request','Meeting request','Support & HR help','employee','general',ARRAY['manager'],ARRAY['admin'],48,16),
  ('complaint','Complaint','Support & HR help','all','ticket',ARRAY['hr'],ARRAY['hr'],48,17),
  ('resignation','Resignation','Exit','employee','exit',ARRAY['manager','hr'],ARRAY['hr'],72,18),
  ('general','General request','General','all','general',ARRAY['admin'],ARRAY['admin'],48,19)
ON CONFLICT (type) DO NOTHING;

INSERT INTO public.global_settings(key,value,category,label,description,is_public) VALUES
  ('contact_info_email','"info@riloyd.in"','Contact','General email','Shown in the website footer and contact page.',true),
  ('contact_business_email','"business@riloyd.in"','Contact','Business email','For business and partnership enquiries.',true),
  ('contact_careers_email','"careers@riloyd.in"','Contact','Careers email','For job seekers.',true),
  ('contact_idea_email','"idea@riloyd.in"','Contact','Idea submission email','For startup ideas.',true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.payment_options(key,programme,label,sort_order,amount) VALUES
  ('education_sponsorship','Education Support','Sponsorship registration',1,149),
  ('education_scholarship_25k','Education Support','Scholarship up to ₹25,000',2,249),
  ('education_scholarship_50k','Education Support','Scholarship up to ₹50,000',3,599),
  ('young_innovators_6_8','Young Innovators','Classes 6–8',4,249),
  ('young_innovators_9_10','Young Innovators','Classes 9–10',5,349),
  ('young_innovators_11_12','Young Innovators','Classes 11–12',6,499),
  ('funding_programme_registration','Funding Programme','Registration',7,999),
  ('funding_programme_summit','Funding Programme','Summit pass',8,3599),
  ('prototype_funding_registration','Prototype Funding','Registration',9,999)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.volunteer_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.volunteer_form_commissions (form_key, label) VALUES ('education','Student Scholarship & Sponsorship'),('young_innovators','Young Innovators 2026') ON CONFLICT (form_key) DO NOTHING;
INSERT INTO public.hr_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.crm_incentive_plans(role,slabs,active) VALUES ('BDE','[]',false),('BDM','[]',false) ON CONFLICT (role) DO NOTHING;

INSERT INTO public.hr_shifts(code,name,start_time,end_time,is_off,sort_order) VALUES
  ('GEN','General (10:00-18:30)','10:00','18:30',false,1),('MOR','Morning (07:00-15:30)','07:00','15:30',false,2),
  ('EVE','Evening (14:00-22:30)','14:00','22:30',false,3),('OFF','Weekly off',NULL,NULL,true,4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.hr_letter_templates(name,kind,body)
SELECT v.name, v.kind, v.body FROM (VALUES
  ('Offer letter','offer','Date: {{date}}

Dear {{name}},

We are pleased to offer you the position of {{designation}} in the {{department}} department at Rishishwar Industry Private Limited (RILOYD).

Your monthly gross salary will be ₹{{gross}}. Your joining date is {{joining_date}}.

Please confirm your acceptance through the candidate portal.

For RILOYD
HR Department'),
  ('Appointment letter','appointment','Date: {{date}}

Dear {{name}},

Further to your acceptance of our offer, you are appointed as {{designation}} in the {{department}} department with effect from {{joining_date}}, at a monthly gross salary of ₹{{gross}}.

Your other terms of employment are as per company policy.

For RILOYD
HR Department'),
  ('Experience letter','experience','Date: {{date}}

TO WHOM IT MAY CONCERN

This is to certify that {{name}} worked with Rishishwar Industry Private Limited (RILOYD) as {{designation}} in the {{department}} department.

We wish them every success.

For RILOYD
HR Department'),
  ('Relieving letter','relieving','Date: {{date}}

Dear {{name}},

This is to confirm that you have been relieved from your duties as {{designation}} at Rishishwar Industry Private Limited (RILOYD).

For RILOYD
HR Department')
) AS v(name,kind,body) WHERE NOT EXISTS (SELECT 1 FROM public.hr_letter_templates t WHERE t.kind = v.kind);

DELETE FROM public.c_critical_write_context WHERE tx = txid_current();
SELECT set_config('request.jwt.claims','{}',true);

INSERT INTO public.funding_stages(name,position,description,required_docs,jury_round)
SELECT v.* FROM (VALUES
  ('Application & screening',10,'File received and checked for eligibility.','Pitch deck, founder ID proof',NULL::int),
  ('Document review',20,'Documents for the category are reviewed.','Category documents',NULL),
  ('Jury Scanning Round 1',30,'Mandatory first jury round.','',1),
  ('Jury Scanning Round 2',40,'Mandatory second jury round.','',2),
  ('Due diligence',50,'Financial and legal checks.','Financials, company documents',NULL),
  ('Investor connect',60,'Introductions and pitch meetings with investors.','',NULL)
) AS v(name,position,description,required_docs,jury_round) WHERE NOT EXISTS (SELECT 1 FROM public.funding_stages);

INSERT INTO public.venture_services(pillar,name,description,position)
SELECT v.* FROM (VALUES
  ('startup','Company registration','Help registering your company or LLP.',10),
  ('startup','Pitch deck & business plan','Preparing an investor-ready pitch deck and plan.',20),
  ('funding','Funding readiness review','Review of your file before it goes to investors.',30),
  ('funding','Investor connect','Introductions to investors after the jury rounds.',40),
  ('manpower','Manpower supply','Trained staff deployed at your site.',50),
  ('manpower','Recruitment services','Hiring permanent staff for your company.',60),
  ('business','Compliance support','GST and other compliance help.',70)
) AS v(pillar,name,description,position) WHERE NOT EXISTS (SELECT 1 FROM public.venture_services);

ALTER TABLE public.global_settings ENABLE TRIGGER c_settings_history;
ALTER TABLE public.payment_options ENABLE TRIGGER c_settings_history;
ALTER TABLE public.volunteer_settings ENABLE TRIGGER c_settings_history;
ALTER TABLE public.volunteer_form_commissions ENABLE TRIGGER c_settings_history;
ALTER TABLE public.crm_incentive_plans ENABLE TRIGGER c_settings_history;