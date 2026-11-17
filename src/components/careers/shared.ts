import { supabase } from '@/integrations/supabase/client';

export type PublicJob = { id: string; job_code: string; title: string; department: string; designation: string; location: string; employment_type: string; work_mode: string; openings: number; salary_range: string; description: string; responsibilities: string; qualification: string; skills: string; experience_required: string; working_days: string; working_hours: string; apply_end: string | null; selection_process: string; required_docs: string; created_at: string };
export type Referral = { valid: boolean; reason?: string; code?: string; kind?: string; name?: string; institute?: string | null };
export async function openJobs(): Promise<PublicJob[]> { const { data, error } = await supabase.rpc('careers_open_jobs'); if (error) throw error; return (data ?? []) as PublicJob[]; }
export async function lookupReferral(code: string, job?: string): Promise<Referral> { const { data, error } = await supabase.rpc('careers_referral_lookup', { _code: code, ...(job ? { _job: job } : {}) }); if (error) throw error; return data as unknown as Referral; }
/** Counts a referral link visit once per browser session. */
export function countReferralVisit(code: string) {
  try { const k = `ref-visit-${code.toUpperCase()}`; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch { /* storage blocked: still count */ }
  // Query builders only send when awaited/then-ed; fire and forget without blocking the page.
  supabase.rpc('careers_referral_click', { _code: code }).then(() => undefined, () => undefined);
}
export const typeLabel: Record<string, string> = { full_time: 'Full-time', part_time: 'Part-time', intern: 'Internship', contract: 'Contract' };
export const modeLabel: Record<string, string> = { office: 'Office', hybrid: 'Hybrid', remote: 'Remote', field: 'Field' };
export const kindLabel: Record<string, string> = { institute: 'Institute', coordinator: 'Coordinator', individual: 'Referral partner', employee: 'Employee referral' };
