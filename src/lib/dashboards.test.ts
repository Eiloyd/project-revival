import { describe, expect, it } from 'vitest';
import { dashboardForPath, parseDashboards, routeAfterLogin } from './dashboards';

describe('dashboard routing after sign-in', () => {
  it('opens the only dashboard straight away', () => {
    expect(routeAfterLogin(['volunteer'])).toEqual({ kind: 'go', to: '/volunteer' });
  });
  it('asks which dashboard when the account has several', () => {
    expect(routeAfterLogin(['crm', 'staff', 'my-volunteers'])).toEqual({ kind: 'choose', options: ['crm', 'staff', 'my-volunteers'] });
  });
  it('reports no access when the account has none', () => {
    expect(routeAfterLogin([])).toEqual({ kind: 'none' });
  });
  it('ignores unknown names and duplicates, keeping the standard order', () => {
    expect(parseDashboards(['volunteer', 'billing', 'crm', 'crm'])).toEqual(['crm', 'volunteer']);
    expect(parseDashboards(null)).toEqual([]);
  });
  it('matches a page to its dashboard', () => {
    expect(dashboardForPath('/my-volunteers/')).toBe('my-volunteers');
    expect(dashboardForPath('/about')).toBeNull();
  });
});
