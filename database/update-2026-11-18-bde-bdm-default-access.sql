-- RILOYD update (18 Nov 2026): every active BDE/BDM gets both the Employee CRM and BDE/BDM referrals.
-- New accounts get this automatically from the website; this file fixes accounts made before.
-- Safe to run more than once. Adds missing access only; never changes or removes existing access.

-- 1) Referral access without CRM → add CRM membership + employee profile (referral code used as employee code).
INSERT INTO public.crm_memberships (user_id, role, manager_id, active)
SELECT s.user_id, s.designation,
       CASE WHEN EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = s.manager_id AND m.role = 'BDM' AND m.active) THEN s.manager_id END,
       true
FROM public.education_staff_access s
WHERE s.active AND s.designation IN ('BDE','BDM')
  AND NOT EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = s.user_id)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.crm_employee_profiles (user_id, employee_code, full_name, phone, designation, joining_date)
SELECT s.user_id, s.referral_code,
       coalesce(nullif(btrim(p.display_name), ''), split_part(u.email, '@', 1), s.referral_code), '', s.designation, current_date
FROM public.education_staff_access s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN public.profiles p ON p.id = s.user_id
WHERE s.active AND s.designation IN ('BDE','BDM')
  AND NOT EXISTS (SELECT 1 FROM public.crm_employee_profiles e WHERE e.user_id = s.user_id)
  AND NOT EXISTS (SELECT 1 FROM public.crm_employee_profiles e WHERE upper(e.employee_code) = upper(s.referral_code))
ON CONFLICT DO NOTHING;

-- 2) CRM BDE/BDM without referral access → add referral access (employee code used as referral code).
INSERT INTO public.education_staff_access (user_id, designation, referral_code, manager_id, active)
SELECT m.user_id, m.role, upper(regexp_replace(e.employee_code, '[^A-Za-z0-9-]', '', 'g')),
       CASE WHEN m.role = 'BDE' AND EXISTS (SELECT 1 FROM public.education_staff_access x WHERE x.user_id = m.manager_id AND x.designation = 'BDM' AND x.active) THEN m.manager_id END,
       true
FROM public.crm_memberships m
JOIN public.crm_employee_profiles e ON e.user_id = m.user_id
WHERE m.active AND m.role IN ('BDE','BDM')
  AND length(regexp_replace(e.employee_code, '[^A-Za-z0-9-]', '', 'g')) >= 3
  AND NOT EXISTS (SELECT 1 FROM public.education_staff_access s WHERE s.user_id = m.user_id)
  AND NOT EXISTS (SELECT 1 FROM public.education_staff_access s WHERE upper(s.referral_code) = upper(regexp_replace(e.employee_code, '[^A-Za-z0-9-]', '', 'g')))
ON CONFLICT DO NOTHING;
