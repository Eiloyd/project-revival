import { describe, expect, it } from 'vitest';
import { nextSiteTheme, readSiteTheme, siteThemes, siteThemeLabels, usesLightSurfaces } from './site-theme';

describe('two site themes', () => {
  it('offers only dark and light', () => {
    expect(siteThemes).toEqual(['dark', 'light']);
    expect(siteThemeLabels).toEqual({ dark: 'Dark', light: 'Light' });
  });
  it('cycles dark to light and back to dark', () => {
    expect(nextSiteTheme('dark')).toBe('light');
    expect(nextSiteTheme('light')).toBe('dark');
  });
  it('defaults to dark and retires the old festival choices', () => {
    expect(readSiteTheme('dark')).toBe('dark');
    expect(readSiteTheme('light')).toBe('light');
    expect(readSiteTheme('festive')).toBe('dark');
    expect(readSiteTheme('diwali')).toBe('dark');
    expect(readSiteTheme('chhath')).toBe('dark');
    expect(readSiteTheme(null)).toBe('dark');
  });
  it('uses light surfaces only for the light theme', () => {
    expect(usesLightSurfaces('light')).toBe(true);
    expect(usesLightSurfaces('dark')).toBe(false);
  });
});
