-- Fix: "Access could not be checked" on the Admin panel (17 Nov 2026).
-- Two versions of public.has_role existed (role as app_role AND role as text), so the website could not
-- tell which one to call and every admin check failed. This removes the extra text version.
-- Safe to run more than once. Every rule and policy uses the app_role version, which stays.
DROP FUNCTION IF EXISTS public.has_role(uuid, text);
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
