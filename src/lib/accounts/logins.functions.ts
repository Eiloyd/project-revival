import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { loginPurposes, loginSetupSchema, mayProvision, mustChangePassword, temporaryPasswordProblem, type LoginPurpose } from './logins';

async function callerRights(ctx: { supabase: SupabaseClient; userId: string }, purpose: LoginPurpose, email: string) {
  const { data: admin } = await ctx.supabase.rpc('has_role', { _user_id: ctx.userId, _role: 'admin' });
  let hr = false; let ownsVolunteer = false;
  if (!admin && purpose === 'institute') { const { data } = await ctx.supabase.rpc('hr_staff'); hr = data === true; }
  if (!admin && purpose === 'volunteer') {
    const { data } = await ctx.supabase.from('volunteers').select('id').eq('employee_id', ctx.userId).ilike('email', email.trim()).is('user_id', null).limit(1);
    ownsVolunteer = Boolean(data?.length);
  }
  return { admin: admin === true, hr, ownsVolunteer };
}

/** Creates (or prepares) a login for someone the caller is adding: optional temporary password + optional instant email verification. */
export const provisionLogin = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ email: z.string().trim().email().max(254), fullName: z.string().trim().max(120).optional(), purpose: z.enum(loginPurposes), setup: loginSetupSchema }).parse(v))
  .handler(async ({ context, data }) => {
    const ctx = context as unknown as { supabase: SupabaseClient; userId: string };
    if (!mayProvision(data.purpose, await callerRights(ctx, data.purpose, data.email))) throw new Error('You can create logins only for people you add yourself.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { ensureLogin } = await import('./logins.server');
    return ensureLogin(supabaseAdmin as unknown as SupabaseClient, { email: data.email, ...(data.fullName ? { fullName: data.fullName } : {}), setup: data.setup, actorId: context.userId, purpose: data.purpose });
  });

/** Admin, or the person who created the login, marks its email as verified without the email link. */
export const verifyAccountEmail = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ userId: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: found, error } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (error || !found.user) throw new Error('Account not found.');
    const { data: admin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!admin && found.user.app_metadata?.['created_by'] !== context.userId) throw new Error('Only an admin or the person who created this login can verify it.');
    if (found.user.email_confirmed_at) return { ok: true, already: true };
    const { error: upd } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email_confirm: true });
    if (upd) throw new Error('The email could not be verified. Please try again.');
    await supabaseAdmin.from('audit_logs').insert({ actor_id: context.userId, action: 'email_verified_by_staff', entity: 'auth_user', entity_id: data.userId, details: {} }).then(() => undefined, () => undefined);
    return { ok: true, already: false };
  });

/** First sign-in with a temporary password: the person sets their own password, which clears the flag. */
export const completeFirstPasswordChange = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ password: z.string().min(8).max(72) }).parse(v))
  .handler(async ({ context, data }) => {
    const problem = temporaryPasswordProblem(data.password); if (problem) throw new Error(problem.replace('Temporary password', 'Password'));
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: found, error } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (error || !found.user) throw new Error('Your account could not be loaded. Please sign in again.');
    if (!mustChangePassword(found.user.app_metadata)) return { ok: true };
    const { error: upd } = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password: data.password, app_metadata: { ...found.user.app_metadata, must_change_password: false } });
    if (upd) throw new Error(/same|different/i.test(upd.message) ? 'Choose a new password, different from the temporary one.' : 'Your password could not be saved. Please try again.');
    return { ok: true };
  });

/** Admin → Users & access: verify an email, give a new temporary password, or block / unblock sign-in. Admin only; an admin cannot block themself. */
export const adminAccountAction = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ userId: z.string().uuid(), action: z.enum(['verify', 'reset', 'deactivate', 'reactivate']), password: z.string().max(72).optional() }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: admin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (admin !== true) throw new Error('Admin access required.');
    if (data.action === 'deactivate' && data.userId === context.userId) throw new Error('You cannot block your own account.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: found, error } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (error || !found.user) throw new Error('Account not found.');
    let patch: Record<string, unknown>;
    if (data.action === 'verify') patch = { email_confirm: true };
    else if (data.action === 'reset') {
      const problem = temporaryPasswordProblem(data.password ?? ''); if (problem) throw new Error(problem);
      patch = { password: data.password, app_metadata: { ...found.user.app_metadata, must_change_password: true } };
    } else patch = { ban_duration: data.action === 'deactivate' ? '876000h' : 'none' };
    const { error: upd } = await supabaseAdmin.auth.admin.updateUserById(data.userId, patch);
    if (upd) throw new Error('The account could not be updated. Please try again.');
    if (data.action === 'deactivate') await supabaseAdmin.auth.admin.signOut(data.userId).then(() => undefined, () => undefined);
    await supabaseAdmin.from('audit_logs').insert({ actor_id: context.userId, action: `account_${data.action}`, entity: 'auth_user', entity_id: data.userId, details: {} }).then(() => undefined, () => undefined);
    return { ok: true };
  });

/** Which accounts are blocked from signing in (Admin → Users & access). */
export const adminBlockedAccounts = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: admin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (admin !== true) throw new Error('Admin access required.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const blocked: string[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    for (const u of data.users) { const until = (u as { banned_until?: string | null }).banned_until; if (until && new Date(until) > new Date()) blocked.push(u.id); }
    if (data.users.length < 200) break;
  }
  return blocked;
});
