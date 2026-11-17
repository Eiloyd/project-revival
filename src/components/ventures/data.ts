import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const must = <T,>(r: { data: T | null; error: unknown }) => { if (r.error) throw r.error; return r.data as T; };
export type Client = { id: string; owner_user_id: string | null; kind: string; category: string; name: string; sector: string; cin: string; gst: string; founder_name: string; email: string; phone: string; city: string; website: string; pitch: string; team_size: number | null; monthly_revenue: number | null; assigned_bde: string | null; status: string; internal_notes: string; created_at: string };
export type StageRow = { id: string; name: string; position: number; description: string; required_docs: string; jury_round: number | null; active: boolean };
export type App = { id: string; client_id: string; category: string; stage_id: string | null; status: string; funding_ask: number | null; funding_type: string; use_of_funds: string; next_action: string; internal_notes: string; created_at: string; updated_at: string };
export type Evaluation = { id: string; application_id: string; round: number; juror_id: string; innovation: number; market: number; team: number; feasibility: number; decision: string; remarks: string; public_remarks: string; created_at: string };
export type Doc = { id: string; client_id: string; application_id: string | null; doc_type: string; file_path: string | null; file_name: string; status: string; review_note: string; created_at: string };
export type Service = { id: string; pillar: string; name: string; description: string; price_note: string; active: boolean; position: number };
export type Order = { id: string; client_id: string; service_id: string | null; status: string; amount: number | null; client_note: string; progress_note: string; created_at: string };
export type Manpower = { id: string; client_id: string; role_title: string; headcount: number; experience: string; shift: string; budget: string; location: string; description: string; status: string; filled: number; update_note: string; created_at: string; needed_by: string | null; contract_type: string; priority: string };
export type Ticket = { id: string; client_id: string; topic: string; subject: string; body: string; status: string; reply: string; created_at: string };
export type History = { id: string; application_id: string; from_stage: string | null; to_stage: string | null; status: string | null; note: string; created_at: string };

const q = <T,>(key: string, fn: () => PromiseLike<{ data: unknown; error: unknown }>) => ({ queryKey: ['ventures', key], queryFn: async () => must(await fn()) as T });
export const useClients = () => useQuery(q<Client[]>('clients', () => supabase.from('venture_clients').select('*').order('created_at', { ascending: false })));
export const useStages = () => useQuery(q<StageRow[]>('stages', () => supabase.from('funding_stages').select('*').order('position')));
export const useApps = () => useQuery(q<App[]>('apps', () => supabase.from('funding_applications').select('*').order('updated_at', { ascending: false })));
export const useEvals = (enabled = true) => useQuery({ ...q<Evaluation[]>('evals', () => supabase.from('jury_evaluations').select('*').order('created_at')), enabled });
export const useDocs = () => useQuery(q<Doc[]>('docs', () => supabase.from('venture_documents').select('*').order('created_at', { ascending: false })));
export const useServices = () => useQuery(q<Service[]>('services', () => supabase.from('venture_services').select('*').order('position')));
export const useOrders = () => useQuery(q<Order[]>('orders', () => supabase.from('venture_orders').select('*').order('created_at', { ascending: false })));
export const useManpower = () => useQuery(q<Manpower[]>('manpower', () => supabase.from('manpower_requirements').select('*').order('created_at', { ascending: false })));
export type MpCandidate = { id: string; requirement_id: string; client_id: string; full_name: string; phone: string; email: string; skills: string; experience_years: number | null; location: string; expected_salary: number | null; stage: string; interview_at: string | null; client_feedback: string; internal_note: string; resume_path: string | null; created_at: string; updated_at: string };
export type MpDeployment = { id: string; worker_code: string; client_id: string; requirement_id: string | null; candidate_id: string | null; worker_name: string; worker_phone: string; designation: string; start_date: string; end_date: string | null; monthly_salary: number; billing_rate: number; ot_rate: number; pf_applicable: boolean; esic_applicable: boolean; status: string; replacement_reason: string; replaced_by: string | null; exit_reason: string; created_at: string };
export type MpTimesheet = { id: string; deployment_id: string; client_id: string; month: string; working_days: number; present_days: number; ot_hours: number; status: string; client_note: string; approved_at: string | null; created_at: string };
export type MpInvoiceLine = { timesheet_id: string; worker_code: string; worker_name: string; designation: string; present_days: number; working_days: number; ot_hours: number; billing_rate: number; ot_rate: number; amount: number };
export type MpInvoice = { id: string; invoice_no: string; client_id: string; month: string; subtotal: number; service_fee_percent: number; service_fee: number; gst_percent: number; gst: number; total: number; lines: MpInvoiceLine[]; status: string; paid_reference: string; paid_at: string | null; paid_by: string | null; created_by: string | null; cancel_reason: string; client_name: string; created_at: string };
export const useMpCandidates = () => useQuery(q<MpCandidate[]>('mp-candidates', () => supabase.from('manpower_candidates').select('*').order('updated_at', { ascending: false })));
export const useMpDeployments = () => useQuery(q<MpDeployment[]>('mp-deployments', () => supabase.from('manpower_deployments').select('*').order('start_date', { ascending: false })));
export const useMpTimesheets = () => useQuery(q<MpTimesheet[]>('mp-timesheets', () => supabase.from('manpower_timesheets').select('*').order('month', { ascending: false }).limit(5000)));
export const useMpEvents = () => useQuery(q<import('@/lib/manpower/delays').MpEvent[]>('mp-events', () => supabase.from('manpower_events').select('item_id, item_table, client_id, requirement_id, event, happened_at').order('happened_at').limit(20000)));
export const useMpInvoices = () => useQuery(q<MpInvoice[]>('mp-invoices', () => supabase.from('manpower_invoices').select('*').order('month', { ascending: false })));
export async function uploadResume(clientId: string, file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Resume must be 10 MB or smaller.');
  if (!/\.(pdf|docx?|png|jpe?g)$/i.test(file.name)) throw new Error('Upload the resume as PDF, Word or an image.');
  const path = `${clientId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, '_').slice(-80)}`;
  const { error } = await supabase.storage.from('manpower-files').upload(path, file, { contentType: file.type || undefined }); if (error) throw error; return path;
}
export async function openResume(path: string) { const { data, error } = await supabase.storage.from('manpower-files').createSignedUrl(path, 120); if (error) throw error; window.open(data.signedUrl, '_blank', 'noopener'); }
export const useTickets = () => useQuery(q<Ticket[]>('tickets', () => supabase.from('venture_tickets').select('*').order('created_at', { ascending: false })));
export const useHistory = () => useQuery(q<History[]>('history', () => supabase.from('funding_stage_history').select('*').order('created_at', { ascending: false }).limit(1000)));
export const useBdes = () => useQuery({ queryKey: ['ventures', 'bdes'], queryFn: async () => {
  const m = must(await supabase.from('crm_memberships').select('user_id, role, active')) as { user_id: string; role: string; active: boolean }[];
  const p = must(await supabase.from('crm_employee_profiles').select('user_id, full_name, employee_code')) as { user_id: string; full_name: string; employee_code: string }[];
  return m.filter(x => x.active).map(x => { const e = p.find(y => y.user_id === x.user_id); return { user_id: x.user_id, role: x.role, name: e?.full_name || e?.employee_code || x.user_id.slice(0, 8) }; });
} });

export function useAct() {
  const qc = useQueryClient(); const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [notice, setNotice] = useState('');
  const run = async (fn: () => Promise<unknown>, msg = 'Saved.') => { setBusy(true); setError(null); setNotice(''); try { await fn(); setNotice(msg); await qc.invalidateQueries({ queryKey: ['ventures'] }); await qc.invalidateQueries({ queryKey: ['my-dashboards'] }); } catch (e) { setError(e); } finally { setBusy(false); } };
  return { busy, error, notice, run };
}

export async function uploadDoc(clientId: string, file: File) {
  if (file.size > 20 * 1024 * 1024) throw new Error('File must be 20 MB or smaller.');
  if (!/\.(pdf|pptx?|docx?|xlsx?|csv|png|jpe?g)$/i.test(file.name)) throw new Error('Upload a PDF, PowerPoint, Word, Excel or image file.');
  const path = `${clientId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, '_').slice(-80)}`;
  const { error } = await supabase.storage.from('venture-docs').upload(path, file, { contentType: file.type || undefined });
  if (error) throw error; return path;
}
export async function openDoc(path: string) { const { data, error } = await supabase.storage.from('venture-docs').createSignedUrl(path, 120); if (error) throw error; window.open(data.signedUrl, '_blank', 'noopener'); }
export const inr = (n: number | null | undefined) => n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`;
export const date = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
