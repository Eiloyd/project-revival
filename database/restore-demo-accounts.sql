-- Test logins for every dashboard (preview/testing only). All use @riloyd.demo and one shared
-- password; first-admin setup ignores this domain. DELETE THESE ACCOUNTS BEFORE GOING LIVE.
-- Safe to run again: existing accounts and access rows are kept.
DO $$
DECLARE r record; uid uuid;
BEGIN
FOR r IN SELECT * FROM (VALUES
 ('demo.admin','Demo Admin'),('demo.hr','Demo HR Manager'),('demo.support.manager','Demo Support Manager'),('demo.support.exec','Demo Support Executive'),
 ('demo.finance','Demo Finance Manager'),('demo.accounts','Demo Accounts Executive'),('demo.research','Demo Research Manager'),('demo.bdm','Demo BDM'),
 ('demo.bde','Demo BDE'),('demo.juror','Demo Juror'),('demo.startup','Demo Startup Founder'),('demo.institute','Demo Institute Partner'),
 ('demo.volunteer','Demo Volunteer'),('demo.candidate','Demo Candidate')
) AS v(handle,name) LOOP
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = r.handle||'@riloyd.demo') THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',r.handle||'@riloyd.demo',extensions.crypt('Riloyd@Demo2026',extensions.gen_salt('bf')),now(),
      '{"provider":"email","providers":["email"]}',jsonb_build_object('full_name',r.name),now(),now(),'','','','');
    INSERT INTO auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email',r.handle||'@riloyd.demo','email_verified',true),'email',now(),now(),now());
  END IF;
  SELECT id INTO uid FROM auth.users WHERE email = r.handle||'@riloyd.demo';
  INSERT INTO public.profiles(id,display_name) VALUES (uid,r.name) ON CONFLICT (id) DO NOTHING;
END LOOP;
END $$;

INSERT INTO public.user_roles(user_id,role) SELECT id,'admin' FROM auth.users WHERE email='demo.admin@riloyd.demo' ON CONFLICT DO NOTHING;
INSERT INTO public.department_staff(user_id,department,level,approval_limit,active)
SELECT u.id, v.dep, v.lvl, v.lim, true FROM (VALUES ('demo.hr','hr','manager',100000),('demo.support.manager','support','manager',0),('demo.support.exec','support','executive',0),
 ('demo.finance','finance','manager',500000),('demo.accounts','accounts','executive',50000),('demo.research','research','manager',0)) v(h,dep,lvl,lim)
JOIN auth.users u ON u.email=v.h||'@riloyd.demo' ON CONFLICT DO NOTHING;
INSERT INTO public.crm_memberships(user_id,role,active) SELECT id,'BDM',true FROM auth.users WHERE email='demo.bdm@riloyd.demo' ON CONFLICT DO NOTHING;
INSERT INTO public.crm_memberships(user_id,role,manager_id,active) SELECT b.id,'BDE',m.id,true FROM auth.users b, auth.users m WHERE b.email='demo.bde@riloyd.demo' AND m.email='demo.bdm@riloyd.demo' ON CONFLICT DO NOTHING;
INSERT INTO public.education_staff_access(user_id,designation,referral_code,active) SELECT id,'BDM','DEMOBDM',true FROM auth.users WHERE email='demo.bdm@riloyd.demo' ON CONFLICT DO NOTHING;
INSERT INTO public.education_staff_access(user_id,designation,manager_id,referral_code,active) SELECT b.id,'BDE',m.id,'DEMOBDE',true FROM auth.users b, auth.users m WHERE b.email='demo.bde@riloyd.demo' AND m.email='demo.bdm@riloyd.demo' ON CONFLICT DO NOTHING;
INSERT INTO public.crm_employee_profiles(user_id,employee_code,full_name,designation,joining_date)
SELECT u.id, v.code, v.name, v.des, current_date - 90 FROM (VALUES ('demo.bdm','DEMO-BDM-01','Demo BDM','Business Development Manager'),('demo.bde','DEMO-BDE-01','Demo BDE','Business Development Executive')) v(h,code,name,des)
JOIN auth.users u ON u.email=v.h||'@riloyd.demo' ON CONFLICT DO NOTHING;
INSERT INTO public.hr_employee_master(user_id,employee_code,full_name,designation,department,joining_date,employment_type,status)
SELECT u.id, v.code, v.name, v.des, v.dep, current_date - 120, 'full_time', 'active' FROM (VALUES
 ('demo.hr','DEMO-HR-01','Demo HR Manager','HR Manager','HR'),('demo.support.manager','DEMO-SUP-01','Demo Support Manager','Support Manager','Support'),
 ('demo.support.exec','DEMO-SUP-02','Demo Support Executive','Support Executive','Support'),('demo.finance','DEMO-FIN-01','Demo Finance Manager','Finance Manager','Finance'),
 ('demo.accounts','DEMO-ACC-01','Demo Accounts Executive','Accounts Executive','Accounts'),('demo.research','DEMO-RES-01','Demo Research Manager','Research Manager','Lead Research'),
 ('demo.bdm','DEMO-BDM-01','Demo BDM','Business Development Manager','Sales'),('demo.bde','DEMO-BDE-01','Demo BDE','Business Development Executive','Sales')) v(h,code,name,des,dep)
JOIN auth.users u ON u.email=v.h||'@riloyd.demo' ON CONFLICT DO NOTHING;
INSERT INTO public.venture_jurors(user_id,name,active) SELECT id,'Demo Juror',true FROM auth.users WHERE email='demo.juror@riloyd.demo' ON CONFLICT DO NOTHING;
INSERT INTO public.venture_clients(owner_user_id,kind,category,name,founder_name,email,city,status)
SELECT id,'startup','mvp','DEMO Startup Pvt Ltd','Demo Startup Founder','demo.startup@riloyd.demo','Bhopal','active' FROM auth.users u WHERE email='demo.startup@riloyd.demo' AND NOT EXISTS (SELECT 1 FROM public.venture_clients c WHERE c.owner_user_id=u.id);
INSERT INTO public.hr_institutes(name,kind,contact_name,email,city,active)
SELECT 'DEMO Skills Institute','institute','Demo Institute Partner','demo.institute@riloyd.demo','Bhopal',true WHERE NOT EXISTS (SELECT 1 FROM public.hr_institutes WHERE name='DEMO Skills Institute');
INSERT INTO public.hr_institute_members(user_id,institute_id,active)
SELECT u.id,i.id,true FROM auth.users u, public.hr_institutes i WHERE u.email='demo.institute@riloyd.demo' AND i.name='DEMO Skills Institute' ON CONFLICT DO NOTHING;
INSERT INTO public.volunteers(employee_id,user_id,full_name,mobile,email,state,district,status,kyc_status,payout_method)
SELECT b.id,v.id,'Demo Volunteer','9000000001','demo.volunteer@riloyd.demo','Madhya Pradesh','Bhopal','active','pending','upi'
FROM auth.users b, auth.users v WHERE b.email='demo.bde@riloyd.demo' AND v.email='demo.volunteer@riloyd.demo' AND NOT EXISTS (SELECT 1 FROM public.volunteers x WHERE x.user_id=v.id);
