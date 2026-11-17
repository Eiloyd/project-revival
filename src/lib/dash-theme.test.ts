import { describe, expect, it } from 'vitest';
import { nextDashTheme, readDashTheme } from './dash-theme';
describe('workspace themes', () => {
  it('defaults to light for missing or unknown values', () => { expect(readDashTheme(null)).toBe('light'); expect(readDashTheme('festive')).toBe('light'); });
  it('keeps a saved eye comfort choice', () => expect(readDashTheme('comfort')).toBe('comfort'));
  it('cycles light → dark → eye comfort → light', () => { expect(nextDashTheme('light')).toBe('dark'); expect(nextDashTheme('dark')).toBe('comfort'); expect(nextDashTheme('comfort')).toBe('light'); });
});
