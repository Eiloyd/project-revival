import { describe, expect, it } from 'vitest';
import { generateTemporaryPassword, mayProvision, maySetTemporaryPassword, mustChangePassword, temporaryPasswordProblem } from './logins';

describe('temporary passwords', () => {
  it('needs 8+ characters with a letter and a number', () => {
    expect(temporaryPasswordProblem('Ab1')).toMatch(/at least 8/);
    expect(temporaryPasswordProblem('abcdefgh')).toMatch(/letter and one number/);
    expect(temporaryPasswordProblem('12345678')).toMatch(/letter and one number/);
    expect(temporaryPasswordProblem('ASDF#1234')).toBeNull();
  });
  it('generated passwords always pass the rules', () => {
    for (let i = 0; i < 50; i++) expect(temporaryPasswordProblem(generateTemporaryPassword())).toBeNull();
    expect(temporaryPasswordProblem(generateTemporaryPassword(() => 0))).toBeNull();
  });
});

describe('who may create a login', () => {
  const none = { admin: false, hr: false, ownsVolunteer: false };
  it('admin may create any login', () => { expect(mayProvision('crm', { ...none, admin: true })).toBe(true); expect(mayProvision('user', { ...none, admin: true })).toBe(true); });
  it('BDE/BDM may create a login only for their own volunteer', () => {
    expect(mayProvision('volunteer', { ...none, ownsVolunteer: true })).toBe(true);
    expect(mayProvision('volunteer', none)).toBe(false);
    expect(mayProvision('staff', { ...none, ownsVolunteer: true })).toBe(false);
  });
  it('HR may create institute partner logins only', () => {
    expect(mayProvision('institute', { ...none, hr: true })).toBe(true);
    expect(mayProvision('department', { ...none, hr: true })).toBe(false);
  });
});

describe('setting a password on an existing account', () => {
  it('allowed for an account never signed in or still on its temporary password', () => {
    expect(maySetTemporaryPassword({ lastSignInAt: null, mustChange: false })).toBe(true);
    expect(maySetTemporaryPassword({ lastSignInAt: '2026-11-01T00:00:00Z', mustChange: true })).toBe(true);
  });
  it('refused once the person has chosen their own password', () => {
    expect(maySetTemporaryPassword({ lastSignInAt: '2026-11-01T00:00:00Z', mustChange: false })).toBe(false);
  });
});

describe('first-login password change flag', () => {
  it('only a true app_metadata flag forces the change', () => {
    expect(mustChangePassword({ must_change_password: true })).toBe(true);
    expect(mustChangePassword({ must_change_password: 'true' })).toBe(false);
    expect(mustChangePassword(undefined)).toBe(false);
  });
});
