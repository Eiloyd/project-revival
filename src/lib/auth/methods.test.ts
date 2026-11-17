import { describe, expect, it } from 'vitest';
import { authChangeProblem, enabledOAuthProviders, normalisePhone, readAuthSettings } from './methods';

describe('sign-in method switches', () => {
  it('uses email code and password by default, social sign-in off', () => {
    const s = readAuthSettings({});
    expect(s.auth_email_code).toBe(true);
    expect(s.auth_password).toBe(true);
    expect(s.auth_google).toBe(false);
    expect(enabledOAuthProviders(s)).toEqual([]);
  });
  it('turns password back on if every email-based sign-in is off', () => {
    const s = readAuthSettings({ auth_password: false, auth_email_code: false, auth_magic_link: false });
    expect(s.auth_password).toBe(true);
  });
  it('refuses to switch off the last email-based sign-in', () => {
    const s = readAuthSettings({ auth_email_code: false, auth_magic_link: false });
    expect(authChangeProblem(s, 'auth_password', false)).not.toBeNull();
  });
  it('allows switching off password while the email code stays on', () => {
    expect(authChangeProblem(readAuthSettings({}), 'auth_password', false)).toBeNull();
  });
  it('lists switched-on social providers', () => {
    expect(enabledOAuthProviders(readAuthSettings({ auth_google: true, auth_azure: true })).map(p => p.provider)).toEqual(['google', 'azure']);
  });
  it('adds +91 to a 10-digit Indian mobile and rejects junk', () => {
    expect(normalisePhone('98765 43210')).toBe('+919876543210');
    expect(normalisePhone('+14155550123')).toBe('+14155550123');
    expect(normalisePhone('12345')).toBeNull();
  });
});

describe('who may create their own account', () => {
  it('never offers sign-up on admin or employee dashboards', async () => {
    const { signupAllowedFor } = await import('./methods');
    for (const p of ['/admin', '/login', '/crm', '/hr', '/finance', '/support-desk', '/research', '/manpower', '/ventures', '/work', '/staff', '/my-volunteers', '/client-portal', '/downloads'])
      expect(signupAllowedFor(p)).toBe(false);
  });
  it('offers sign-up only to candidates, volunteers and institute partners', async () => {
    const { signupAllowedFor } = await import('./methods');
    for (const p of ['/candidate-portal', '/volunteer', '/become-a-volunteer', '/institute-portal', '/volunteer/']) expect(signupAllowedFor(p)).toBe(true);
  });
});
