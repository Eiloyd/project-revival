CREATE OR REPLACE FUNCTION public.notify_urgent_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text;
BEGIN
  IF NEW.priority NOT IN ('urgent','high') OR NEW.status IN ('resolved','closed') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to AND OLD.priority IS NOT DISTINCT FROM NEW.priority THEN RETURN NEW; END IF;
  _title := initcap(NEW.priority) || ' ticket ' || coalesce(NEW.ticket_code,'') || ': ' || left(coalesce(NEW.subject,''), 80);
  IF NEW.assigned_to IS NOT NULL THEN
    IF NEW.assigned_to IS DISTINCT FROM auth.uid() THEN
      INSERT INTO public.notifications(user_id, kind, title, body, link)
      VALUES (NEW.assigned_to, 'alert', _title, 'Customer: ' || coalesce(NEW.full_name,'') || '. Please respond within the SLA.', '/support-desk');
    END IF;
  ELSE
    INSERT INTO public.notifications(user_id, kind, title, body, link)
    SELECT ds.user_id, 'alert', _title, 'No one is assigned yet. Please assign an owner.', '/support-desk'
    FROM public.department_staff ds
    WHERE ds.department = 'support' AND ds.level = 'manager' AND ds.active AND ds.user_id IS DISTINCT FROM auth.uid();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS c_ticket_urgent_alert ON public.customer_tickets;
CREATE TRIGGER c_ticket_urgent_alert AFTER INSERT OR UPDATE OF assigned_to, priority ON public.customer_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_urgent_ticket();

CREATE OR REPLACE FUNCTION public.notify_lead_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_id IS NULL OR NEW.owner_id IS NOT DISTINCT FROM auth.uid() THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.owner_id IS NOT DISTINCT FROM NEW.owner_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications(user_id, kind, title, body, link)
  VALUES (NEW.owner_id, 'alert', 'New lead assigned: ' || left(coalesce(NEW.title,''), 80),
          'Stage: ' || coalesce(NEW.stage,'new') || '. Call the customer soon.', '/crm');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS crm_lead_assigned_alert ON public.crm_leads;
CREATE TRIGGER crm_lead_assigned_alert AFTER INSERT OR UPDATE OF owner_id ON public.crm_leads
FOR EACH ROW EXECUTE FUNCTION public.notify_lead_assigned();

REVOKE EXECUTE ON FUNCTION public.notify_urgent_ticket() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_lead_assigned() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_staff_member(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT _uid IS NOT NULL AND (
    public.has_role(_uid, 'admin') OR public.has_role(_uid, 'moderator')
    OR EXISTS (SELECT 1 FROM public.crm_memberships m WHERE m.user_id = _uid AND m.active)
    OR EXISTS (SELECT 1 FROM public.department_staff d WHERE d.user_id = _uid AND d.active)
    OR EXISTS (SELECT 1 FROM public.education_staff_access e WHERE e.user_id = _uid AND e.active))
$fn$;
REVOKE ALL ON FUNCTION public.is_staff_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff_member(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_linked_volunteer(_uid uuid, _active_only boolean DEFAULT true) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT _uid IS NOT NULL AND EXISTS (SELECT 1 FROM public.volunteers v WHERE v.user_id = _uid AND (NOT _active_only OR v.status = 'active'))
$fn$;
REVOKE ALL ON FUNCTION public.is_linked_volunteer(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_linked_volunteer(uuid, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.hr_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.department_staff WHERE user_id = auth.uid() AND active AND department = 'hr'))
$fn$;
CREATE OR REPLACE FUNCTION public.hr_is_manager() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.department_staff WHERE user_id = auth.uid() AND active AND department = 'hr' AND level = 'manager'))
$fn$;
CREATE OR REPLACE FUNCTION public.hr_or_finance() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.department_staff WHERE user_id = auth.uid() AND active AND department IN ('hr','accounts','finance')))
$fn$;
CREATE OR REPLACE FUNCTION public.support_is_manager() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT auth.uid() IS NOT NULL AND (public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.department_staff WHERE user_id = auth.uid() AND active AND department = 'support' AND level = 'manager'))
$fn$;
CREATE OR REPLACE FUNCTION public.c_staff_name(_uid uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT CASE WHEN auth.uid() IS NULL OR _uid IS NULL THEN NULL ELSE coalesce(
    (SELECT nullif(full_name,'') FROM public.crm_employee_profiles WHERE user_id = _uid),
    (SELECT nullif(full_name,'') FROM public.volunteers WHERE user_id = _uid LIMIT 1),
    (SELECT nullif(display_name,'') FROM public.profiles WHERE id = _uid),
    'Staff') END
$fn$;
DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['hr_staff()','hr_is_manager()','hr_or_finance()','support_is_manager()','c_staff_name(uuid)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', f);
  END LOOP;
END $$;