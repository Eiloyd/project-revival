import { describe, expect, it } from 'vitest';
import { dashboardForPath, parseDashboards, routeAfterLogin, withAdminAccess } from './dashboards';

describe('dashboard routing after sign-in', () => {
  it('opens the only dashboard straight away', () => {
    expect(routeAfterLogin(['volunteer'])).toEqual({ kind: 'go', to: '/volunteer' });
  });
  it('asks which dashboard when the account has several', () => {
    expect(routeAfterLogin(['hr', 'finance', 'work'])).toEqual({ kind: 'choose', options: ['hr', 'finance', 'work'] });
  });
  it('opens the CRM by default for BDE/BDM (CRM + referrals + My Work)', () => {
    expect(routeAfterLogin(['crm', 'staff', 'my-volunteers', 'work'])).toEqual({ kind: 'go', to: '/crm' });
  });
  it('still lets an admin choose, even with CRM access', () => {
    expect(routeAfterLogin(['admin', 'crm', 'work']).kind).toBe('choose');
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

describe('admin sees every dashboard', () => {
  it('gives admin every staff dashboard to switch to', () => {
    expect(withAdminAccess(['admin'])).toEqual(['admin', 'crm', 'staff', 'my-volunteers', 'hr', 'support', 'finance', 'research', 'ventures', 'manpower', 'work']);
  });
  it('keeps an admin\'s own portal and adds nothing for non-admins', () => {
    expect(withAdminAccess(['admin', 'volunteer'])).toContain('volunteer');
    expect(withAdminAccess(['crm', 'work'])).toEqual(['crm', 'work']);
  });
});
