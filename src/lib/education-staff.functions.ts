import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { loginSetupSchema } from '@/lib/accounts/logins';

export const listEducationStaff = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: admin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (!admin) throw new Error('Admin access required.');
  const { data, error } = await context.supabase.from('education_staff_access').select('*').order('created_at');
  if (error) throw new Error('Staff could not be loaded.');
  return data ?? [];
});

export const saveEducationStaff = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ email: z.string().trim().email(), designation: z.enum(['BDE','BDM']), referralCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,40}$/), managerId: z.string().uuid().optional(), active: z.boolean(), fullName: z.string().trim().max(120).optional(), setup: loginSetupSchema.optional() }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: admin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!admin) throw new Error('Admin access required.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    // The admin creates the login if it does not exist yet (optional temporary password, email verified by the admin).
    const { ensureLogin } = await import('@/lib/accounts/logins.server');
    const login = await ensureLogin(supabaseAdmin as unknown as SupabaseClient, { email: data.email, ...(data.fullName ? { fullName: data.fullName } : {}), setup: data.setup ?? { verify: true }, actorId: context.userId, purpose: 'staff' });
    if (!login.verified) throw new Error('The email is not verified yet. Tick "Mark email as verified" and save again.');
    const userId = login.userId;
    if (data.managerId) {
      const { data: manager } = await context.supabase.from('education_staff_access').select('designation, active').eq('user_id', data.managerId).single();
      if (!manager?.active || manager.designation !== 'BDM' || data.managerId === userId) throw new Error('Select an active BDM as manager.');
    }
    const { error } = await context.supabase.from('education_staff_access').upsert({ user_id: userId, designation: data.designation, referral_code: data.referralCode, manager_id: data.designation === 'BDE' ? data.managerId ?? null : null, active: data.active });
    if (error) throw new Error('Staff access could not be saved; check that the referral code is unique.');
    // BDE/BDM get the Employee CRM by default (it holds My Work and the referrals). Existing CRM access is left as it is.
    let crmLinked = false;
    const { data: crm } = await supabaseAdmin.from('crm_memberships').select('user_id').eq('user_id', userId).maybeSingle();
    if (!crm && data.active) {
      const { data: mgr } = data.managerId ? await supabaseAdmin.from('crm_memberships').select('user_id').eq('user_id', data.managerId).eq('role', 'BDM').eq('active', true).maybeSingle() : { data: null };
      const { error: crmErr } = await context.supabase.rpc('crm_onboard_member', { _user_id: userId, _input: { role: data.designation, employeeCode: data.referralCode, fullName: data.fullName || data.email.split('@')[0], designation: data.designation, phone: '', photoUrl: '', active: true, ...(mgr ? { managerId: data.managerId } : {}) } });
      crmLinked = !crmErr;
      if (crmErr) console.error('crm_onboard_member from staff access', crmErr.code, crmErr.message);
    } else crmLinked = !!crm;
    return { ok: true, created: login.created, passwordSet: login.passwordSet, crmLinked };
  });

export const getEducationStaffLeads = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: staff } = await context.supabase.from('education_staff_access').select('*').eq('user_id', context.userId).eq('active', true).maybeSingle();
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  if (!staff) {
    // Admin can open every dashboard: they see every referred student.
    const { data: admin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (!admin) throw new Error('Active BDE or BDM access required.');
    const { data: rows, error } = await supabaseAdmin.from('education_support_registrations').select('ack_number, student_name, father_name, mother_name, date_of_birth, student_category, current_class, course_name, institution_name, district, state, coordinator_code, form_status, payment_status, approval_status, employee_verified_at, employee_verification_note, created_at').not('coordinator_code', 'is', null).neq('coordinator_code', '').order('created_at', { ascending: false }).limit(1000);
    if (error) throw new Error('Referrals could not be loaded.');
    return { designation: 'Admin' as string, code: 'ALL', rows: rows ?? [] };
  }
  const codes = [staff.referral_code];
  if (staff.designation === 'BDM') {
    const { data: team } = await supabaseAdmin.from('education_staff_access').select('referral_code').eq('manager_id', context.userId).eq('active', true);
    codes.push(...(team ?? []).map(t => t.referral_code));
  }
  const { data: rows, error } = await supabaseAdmin.from('education_support_registrations').select('ack_number, student_name, father_name, mother_name, date_of_birth, student_category, current_class, course_name, institution_name, district, state, coordinator_code, form_status, payment_status, approval_status, employee_verified_at, employee_verification_note, created_at').in('coordinator_code', codes).order('created_at', { ascending: false }).limit(500);
  if (error) throw new Error('Your referrals could not be loaded.');
  return { designation: staff.designation, code: staff.referral_code, rows: rows ?? [] };
});
/** BDE/BDM marks a referred, completed registration as checked. Payment confirmation and approval stay with admins. */
export const verifyEducationReferral = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ ackNumber: z.string().trim().max(20), note: z.string().trim().max(300) }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: staff } = await context.supabase.from('education_staff_access').select('*').eq('user_id', context.userId).eq('active', true).maybeSingle();
    if (!staff) throw new Error('Active BDE or BDM access required.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const codes = [staff.referral_code];
    if (staff.designation === 'BDM') {
      const { data: team } = await supabaseAdmin.from('education_staff_access').select('referral_code').eq('manager_id', context.userId).eq('active', true);
      codes.push(...(team ?? []).map(t => t.referral_code));
    }
    const { data: rows, error } = await supabaseAdmin.from('education_support_registrations')
      .update({ employee_verified_at: new Date().toISOString(), employee_verified_by: context.userId, employee_verification_note: data.note })
      .eq('ack_number', data.ackNumber).in('coordinator_code', codes).eq('form_status', 'completed').select('ack_number');
    if (error || !rows?.length) throw new Error('Only completed registrations from your referrals can be verified.');
    return { ok: true };
  });
