/** The switch offers exactly two choices: the dark design and the light design. */
export const siteThemes = ['dark', 'light'] as const;
export type SiteTheme = typeof siteThemes[number];

export const siteThemeLabels: Record<SiteTheme, string> = { dark: 'Dark', light: 'Light' };

export function readSiteTheme(value: string | null): SiteTheme {
  if (value === 'light') return 'light';
  return 'dark'; // default, and retires the earlier festive / Chhath / Diwali choices
}

export function nextSiteTheme(theme: SiteTheme): SiteTheme {
  return theme === 'dark' ? 'light' : 'dark';
}

export function usesLightSurfaces(theme: SiteTheme): boolean {
  return theme === 'light';
}

export function applySiteTheme(theme: SiteTheme) {
  const root = document.documentElement;
  const light = usesLightSurfaces(theme);
  root.classList.toggle('light', light);
  // Older visitors may still carry the retired festival classes; clear them on every switch.
  root.classList.remove('diwali', 'chhath');
  delete root.dataset['festiveDecor'];
  root.style.colorScheme = light ? 'light' : 'dark';
}
