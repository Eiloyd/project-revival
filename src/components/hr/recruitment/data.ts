import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { must } from '@/components/hr/hrms';

export type Job = { id: string; job_code: string; title: string; department: string; designation: string; location: string; employment_type: string; work_mode: string; openings: number; salary_range: string; show_salary: boolean; description: string; responsibilities: string; qualification: string; skills: string; experience_required: string; working_days: string; working_hours: string; reporting_manager: string; apply_start: string | null; apply_end: string | null; selection_process: string; required_docs: string; visibility: string; status: string; recruiter_id: string | null; approved_at: string | null; created_at: string };
export type Cand = { id: string; job_id: string | null; full_name: string; email: string; phone: string; city: string; state: string; pincode: string; source: string; source_detail: string; stage: string; experience_years: number | null; current_ctc: number | null; expected_ctc: number | null; offered_ctc: number | null; joining_date: string | null; notes: string; resume_path: string | null; application_ref: string | null; created_by: string | null; created_at: string; updated_at: string; institute_id: string | null; employee_user_id: string | null; dob: string | null; gender: string; current_address: string; permanent_address: string; qualification: string; course: string; specialisation: string; university: string; passing_year: number | null; score: string; is_fresher: boolean; current_org: string; current_designation: string; notice_period: string; skills: string; languages: string; why_join: string; availability: string; priority: string; assigned_recruiter: string | null; candidate_user_id: string | null; offer_status: string; offer_note: string; offer_responded_at: string | null; probation_months: number | null; rejection_reason: string; referral_link_id: string | null; referral_code: string; referral_name: string; referral_conflict: boolean };
export type Round = { id: string; candidate_id: string; round_type: string; scheduled_at: string; mode: string; location_or_link: string; interviewer_user_id: string | null; interviewer_name: string; status: string; score: number | null; recommendation: string; internal_feedback: string; candidate_feedback: string; created_at: string };
export type Assessment = { id: string; candidate_id: string; kind: string; title: string; instructions: string; link: string; due_at: string | null; max_marks: number; marks: number | null; result: string; status: string; share_score: boolean; evaluator_notes: string; submission_note: string; submission_path: string | null; submitted_at: string | null; created_at: string };
export type Message = { id: string; candidate_id: string; sender: string; kind: string; body: string; file_path: string | null; created_at: string };
export type Ev = { id: string; candidate_id: string; from_stage: string | null; to_stage: string; actor_name: string; created_at: string };
export type Link = { id: string; code: string; kind: string; job_id: string | null; institute_id: string | null; coordinator_id: string | null; owner_name: string; owner_contact: string; commission_amount: number; active: boolean; expires_at: string | null; clicks: number; created_at: string };
export type Payout = { id: string; candidate_id: string; link_id: string | null; amount: number; status: string; paid_reference: string; note: string; created_at: string; updated_at: string };
export type Person = { user_id: string; full_name: string; employee_code: string; department: string; designation: string };

const k = (x: string) => ['hrms', 'rec', x];
export const useJobs = () => useQuery({ queryKey: k('jobs'), queryFn: async () => must(await supabase.from('hr_job_openings').select('*').order('created_at', { ascending: false })) as unknown as Job[] });
export const useCands = () => useQuery({ queryKey: k('cands'), queryFn: async () => must(await supabase.from('hr_candidates').select('*').order('created_at', { ascending: false }).limit(5000)) as unknown as Cand[] });
export const useRounds = () => useQuery({ queryKey: k('rounds'), queryFn: async () => must(await supabase.from('hr_interview_rounds').select('*').order('scheduled_at', { ascending: false }).limit(5000)) as unknown as Round[] });
export const useAssessments = () => useQuery({ queryKey: k('assess'), queryFn: async () => must(await supabase.from('hr_assessments').select('*').order('created_at', { ascending: false }).limit(5000)) as unknown as Assessment[] });
export const useEvents = () => useQuery({ queryKey: k('events'), queryFn: async () => must(await supabase.from('hr_candidate_events').select('*').order('created_at').limit(20000)) as unknown as Ev[] });
export const useMessages = (cid: string) => useQuery({ queryKey: k(`msg-${cid}`), queryFn: async () => must(await supabase.from('hr_candidate_messages').select('*').eq('candidate_id', cid).order('created_at')) as unknown as Message[] });
export const useLinks = () => useQuery({ queryKey: k('links'), queryFn: async () => must(await supabase.from('hr_referral_links').select('*').order('created_at', { ascending: false })) as unknown as Link[] });
export const usePayouts = () => useQuery({ queryKey: k('payouts'), queryFn: async () => must(await supabase.from('hr_referral_payouts').select('*').order('created_at', { ascending: false })) as unknown as Payout[] });
export const useInstitutes = () => useQuery({ queryKey: k('inst'), queryFn: async () => must(await supabase.from('hr_institutes').select('id,name,kind,active').order('name')) as { id: string; name: string; kind: string; active: boolean }[] });
/** Employees who can be recruiters or interviewers. */
export const usePeople = () => useQuery({ queryKey: k('people'), queryFn: async () => must(await supabase.from('hr_employee_master').select('user_id,full_name,employee_code,department,designation').eq('status', 'active').order('full_name')) as Person[] });
/** Who am I: Admin and/or HR manager (the database checks the same thing on every change). */
export const useRecruitRole = () => useQuery({ queryKey: k('role'), queryFn: async () => {
  const { data: u } = await supabase.auth.getUser(); const uid = u.user?.id ?? '';
  const [{ data: dash }, { data: dep }] = await Promise.all([supabase.rpc('my_dashboards'), supabase.from('department_staff').select('department,level,active').eq('user_id', uid)]);
  const admin = Array.isArray(dash) && dash.includes('admin');
  return { uid, admin, hrManager: admin || !!dep?.some(d => d.active && d.department === 'hr' && d.level === 'manager') };
} });

export async function openHrFile(path: string) { const { data, error } = await supabase.storage.from('hr-resumes').createSignedUrl(path, 120); if (error) throw error; window.open(data.signedUrl, '_blank', 'noopener'); }
export const fmtDate = (d: string | null | undefined) => d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (d: string | null | undefined) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
export const toLocalInput = (iso: string | null) => iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
