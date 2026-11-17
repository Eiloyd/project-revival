// Browser-safe rules for logins that a creator (admin, HR, BDE/BDM with volunteers) makes for someone else.
// The server functions in logins.functions.ts apply the same rules before touching any account.
import { z } from 'zod';

export const loginPurposes = ['user', 'staff', 'crm', 'department', 'volunteer', 'institute'] as const;
export type LoginPurpose = (typeof loginPurposes)[number];

/** Optional login set-up sent with an onboarding form. Blank password = no password is set (they can use an email code). */
export const loginSetupSchema = z.object({
  password: z.string().max(72).optional(),
  verify: z.boolean(),
});
export type LoginSetup = z.infer<typeof loginSetupSchema>;

/** Temporary passwords: 8–72 characters with at least one letter and one number. */
export function temporaryPasswordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Temporary password must be at least 8 characters.';
  if (pw.length > 72) return 'Temporary password must be 72 characters or fewer.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Temporary password needs at least one letter and one number.';
  if (/\s/.test(pw)) return 'Temporary password cannot contain spaces.';
  return null;
}

/** A readable temporary password (no 0/O/1/l look-alikes), e.g. "Riloyd-7KQ4-M9TX". */
export function generateTemporaryPassword(random: (n: number) => number = n => (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) % n): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const part = () => Array.from({ length: 4 }, () => chars[random(chars.length)]).join('');
  let pw = `Riloyd-${part()}-${part()}`;
  if (!/\d/.test(pw)) pw += '7';
  return pw;
}

/** Who may make or change a login for each purpose. Admins may do all; HR only partner logins; employees only their own volunteers. */
export function mayProvision(purpose: LoginPurpose, caller: { admin: boolean; hr: boolean; ownsVolunteer: boolean }): boolean {
  if (caller.admin) return true;
  if (purpose === 'institute') return caller.hr;
  if (purpose === 'volunteer') return caller.ownsVolunteer;
  return false;
}

/**
 * A creator may set a temporary password only on an account that has never been used, or that is still waiting for
 * its first password change — never on someone who already chose their own password (that would let a creator take it over).
 */
export function maySetTemporaryPassword(account: { lastSignInAt: string | null | undefined; mustChange: boolean }): boolean {
  return !account.lastSignInAt || account.mustChange;
}

/** The first-login flag lives in app_metadata, which only the server can write. */
export function mustChangePassword(appMetadata: unknown): boolean {
  return Boolean(appMetadata && typeof appMetadata === 'object' && (appMetadata as Record<string, unknown>)['must_change_password'] === true);
}
