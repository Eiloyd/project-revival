// Server-only: creates or prepares a login for someone, on behalf of a creator whose permission was already checked.
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { maySetTemporaryPassword, mustChangePassword, temporaryPasswordProblem, type LoginSetup } from './logins';

export type LoginResult = { userId: string; created: boolean; verified: boolean; passwordSet: boolean; emailSent: boolean };

export async function findUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  const want = email.trim().toLowerCase();
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error('Account lookup failed. Please try again.');
    const hit = data.users.find(u => u.email?.toLowerCase() === want);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

/**
 * Finds the account for this email or creates it. With `setup.verify` the email is marked verified right away
 * (the creator vouches for it). A temporary password forces a password change at first sign-in.
 */
export async function ensureLogin(admin: SupabaseClient, input: { email: string; fullName?: string; setup: LoginSetup; actorId: string; purpose: string }): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.setup.password?.trim() ? input.setup.password : undefined;
  if (password) { const p = temporaryPasswordProblem(password); if (p) throw new Error(p); }
  let user = await findUserByEmail(admin, email);
  let created = false; let passwordSet = false; let emailSent = false;

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email, ...(password ? { password } : {}), email_confirm: input.setup.verify,
      user_metadata: { ...(input.fullName ? { full_name: input.fullName } : {}) },
      app_metadata: { must_change_password: Boolean(password), created_by: input.actorId },
    });
    if (error || !data.user) throw new Error(/registered|exists/i.test(error?.message ?? '') ? 'An account with this email already exists.' : 'The login could not be created. Please try again.');
    user = data.user; created = true; passwordSet = Boolean(password);
  } else {
    const patch: Record<string, unknown> = {};
    if (password) {
      if (!maySetTemporaryPassword({ lastSignInAt: user.last_sign_in_at, mustChange: mustChangePassword(user.app_metadata) }))
        throw new Error('This person already uses their own password, so it cannot be replaced. They can use "Forgot password" on the sign-in page.');
      patch.password = password; patch.app_metadata = { ...user.app_metadata, must_change_password: true };
    }
    if (input.setup.verify && !user.email_confirmed_at) patch.email_confirm = true;
    if (Object.keys(patch).length) {
      const { data, error } = await admin.auth.admin.updateUserById(user.id, patch);
      if (error || !data.user) throw new Error('The login could not be updated. Please try again.');
      user = data.user; passwordSet = Boolean(password);
    }
  }

  const verified = Boolean(user.email_confirmed_at);
  if (!verified) {
    // Not vouched for: email them a sign-in code; using it verifies the address.
    const { error } = await admin.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    emailSent = !error;
  }
  await admin.from('audit_logs').insert({ actor_id: input.actorId, action: created ? 'login_created' : 'login_updated', entity: 'auth_user', entity_id: user.id, details: { purpose: input.purpose, verified, password_set: passwordSet } }).then(() => undefined, () => undefined);
  return { userId: user.id, created, verified, passwordSet, emailSent };
}

/** Plain message shown when access is held back because the email is still unverified. */
export function notVerifiedMessage(r: LoginResult): string {
  return `${r.created ? 'Login created, but the' : 'The'} email is not verified yet${r.emailSent ? ' — we emailed them a sign-in code' : ''}. Tick "Mark email as verified" and save again, or save again after they verify.`;
}
