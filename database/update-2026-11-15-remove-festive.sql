-- Retire the festive theme (15 Nov 2026).
-- The site switch now offers only Dark and Light, so the festive hero-picture slot is removed.
-- Run this once in your database. It deletes any festive hero pictures and narrows the allowed themes.

DELETE FROM public.hero_images WHERE theme = 'festive';

ALTER TABLE public.hero_images DROP CONSTRAINT IF EXISTS hero_images_theme_check;
ALTER TABLE public.hero_images ADD CONSTRAINT hero_images_theme_check CHECK (theme IN ('dark', 'light'));
