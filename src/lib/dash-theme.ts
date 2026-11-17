/** Workspace (dashboard) themes, separate from the public website theme. Light is the default. */
export const dashThemes = ['light', 'dark', 'comfort'] as const;
export type DashTheme = (typeof dashThemes)[number];
export const dashThemeLabels: Record<DashTheme, string> = { light: 'Light', dark: 'Dark', comfort: 'Eye comfort' };
export const DASH_THEME_KEY = 'riloyd-dash-theme';
export function readDashTheme(value: string | null | undefined): DashTheme {
  return (dashThemes as readonly string[]).includes(value ?? '') ? (value as DashTheme) : 'light';
}
export function nextDashTheme(t: DashTheme): DashTheme { return dashThemes[(dashThemes.indexOf(t) + 1) % dashThemes.length]!; }
