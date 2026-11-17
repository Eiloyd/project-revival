import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { siteThemes, type SiteTheme } from "./site-theme";

// Admin-chosen hero pictures per page and theme; bundled artwork shows when none is set.
export const heroPages = [
  { key: "home", label: "Homepage" },
  { key: "education-support", label: "Student Scholarship & Sponsorship" },
  { key: "young-innovators", label: "Young Innovators" },
] as const;
export type HeroPage = (typeof heroPages)[number]["key"];
export type HeroImage = { page: string; theme: string; image_url: string; storage_path: string };
export const HERO_BUCKET = "hero-images";
export const heroImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const HERO_MAX_BYTES = 5 * 1024 * 1024;
/** Lifetime of the signed link stored for each hero picture (10 years). */
export const HERO_LINK_SECONDS = 10 * 365 * 24 * 60 * 60;

export const heroImagesQuery = queryOptions({
  queryKey: ["hero-images"],
  queryFn: async (): Promise<HeroImage[]> => {
    const { data, error } = await supabase.from("hero_images").select("page, theme, image_url, storage_path");
    if (error) return []; // never block the page; bundled pictures stay
    return data ?? [];
  },
  staleTime: 5 * 60_000,
  retry: false,
});

export function heroImageFor(rows: readonly HeroImage[] | undefined, page: HeroPage, theme: SiteTheme): string | null {
  const url = rows?.find(r => r.page === page && r.theme === theme)?.image_url;
  return url && /^https:\/\//.test(url) ? url : null;
}

/** The theme currently applied to the page, read from the classes the theme switch sets. */
export function themeFromRoot(root: { classList: { contains(c: string): boolean } }): SiteTheme {
  return root.classList.contains("light") ? "light" : "dark";
}

export { siteThemes };
