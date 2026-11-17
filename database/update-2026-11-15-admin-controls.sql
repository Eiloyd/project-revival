-- RILOYD: admin controls for fees, payment embed codes and hero pictures.
-- Safe to run more than once. Run in Supabase -> SQL editor on a database already set up with schema.sql.

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

-- 3) Admin login for the owner (run AFTER abhinav@riloyd.in has signed up at /admin and confirmed the email).
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'abhinav@riloyd.in'
ON CONFLICT (user_id, role) DO NOTHING;
