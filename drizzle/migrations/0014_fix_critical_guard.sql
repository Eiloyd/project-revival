CREATE OR REPLACE FUNCTION public.c_critical_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_TABLE_NAME='volunteers' THEN
  IF TG_OP='UPDATE' AND NEW.commission_percent IS NOT DISTINCT FROM OLD.commission_percent THEN RETURN NEW; END IF;
  IF TG_OP='INSERT' AND NEW.commission_percent IS NULL THEN RETURN NEW; END IF;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.c_critical_write_context WHERE tx=txid_current() AND actor=auth.uid()) THEN RAISE EXCEPTION 'Critical setting requires maker-checker approval'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.c_critical_guard() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.c_critical_guard() TO service_role;