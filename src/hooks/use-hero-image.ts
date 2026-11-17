import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { heroImageFor, heroImagesQuery, themeFromRoot, type HeroPage } from "@/lib/hero-images";
import type { SiteTheme } from "@/lib/site-theme";

/** The admin's hero picture for this page in the current theme, or null to keep the bundled artwork. */
export function useHeroImage(page: HeroPage): string | null {
  const [theme, setTheme] = useState<SiteTheme | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setTheme(themeFromRoot(root));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  const { data } = useQuery({ ...heroImagesQuery, enabled: theme !== null });
  return theme ? heroImageFor(data, page, theme) : null;
}
