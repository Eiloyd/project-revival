-- RILOYD update (18 Nov 2026): Admin sees and opens every dashboard; admin sign-up is closed.
-- Safe to run more than once. Does not delete or change any data.

-- 1) Dashboards: Admin gets every staff dashboard (nothing hidden from Admin).
CREATE OR REPLACE FUNCTION public.my_dashboards()
RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE ds text[] := '{}'; dep text; v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN ARRAY[]::text[]; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role::text = 'admin') THEN
    ds := ARRAY['admin','crm','staff','my-volunteers','hr','support','finance','research','ventures','manpower','work'];
  END IF;
  IF to_regclass('public.crm_memberships') IS NOT NULL AND EXISTS (SELECT 1 FROM public.crm_memberships WHERE user_id = v_uid AND active) THEN ds := array_append(ds, 'crm'); END IF;
  IF to_regclass('public.education_staff_access') IS NOT NULL AND EXISTS (SELECT 1 FROM public.education_staff_access WHERE user_id = v_uid AND active) THEN ds := array_append(ds, 'staff'); END IF;
  IF to_regclass('public.volunteers') IS NOT NULL AND EXISTS (SELECT 1 FROM public.volunteers WHERE employee_id = v_uid) THEN ds := array_append(ds, 'my-volunteers'); END IF;
  IF to_regclass('public.department_staff') IS NOT NULL THEN
    FOR dep IN SELECT DISTINCT department FROM public.department_staff WHERE user_id = v_uid AND active LOOP
      ds := array_append(ds, CASE WHEN dep = 'accounts' THEN 'finance' ELSE dep END);
    END LOOP;
  END IF;
  IF cardinality(ds) > 0 THEN ds := array_append(ds, 'work'); END IF;
  IF to_regclass('public.volunteers') IS NOT NULL AND EXISTS (SELECT 1 FROM public.volunteers WHERE user_id = v_uid AND status = 'active') THEN ds := array_append(ds, 'volunteer'); END IF;
  RETURN ARRAY(SELECT DISTINCT x FROM unnest(ds) x);
END $function$;
REVOKE ALL ON FUNCTION public.my_dashboards() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_dashboards() TO authenticated, service_role;

-- 2) My Volunteers: Admin counts as an active employee too.
CREATE OR REPLACE FUNCTION public.is_active_employee(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT _uid IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = _uid AND r.role::text = 'admin')
    OR EXISTS (SELECT 1 FROM public.education_staff_access s WHERE s.user_id = _uid AND s.active)
    OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = _uid AND m.active))
$function$;

-- 3) Nobody can make themself Admin from the website any more. New admins are added by an existing admin
--    (user_roles) or by the owner in the database.
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  RAISE EXCEPTION 'Admin sign-up is closed. An existing admin or the database owner adds new admins.' USING ERRCODE = '42501';
END $function$;
COMMENT ON FUNCTION public.claim_first_admin() IS 'Closed on purpose: admin accounts are added only by an existing admin or the database owner.';

NOTIFY pgrst, 'reload schema';
