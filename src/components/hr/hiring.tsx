import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { closedStages, stageLabels, type Stage } from '@/lib/hr/hiring';
import { must, useAction } from '@/components/hr/hrms';

type Job = { id: string; title: string; department: string; location: string; employment_type: string; openings: number; salary_range: string; description: string; status: string; created_at: string };
type Cand = { id: string; job_id: string | null; full_name: string; email: string; phone: string; city: string; source: string; source_detail: string; stage: string; interview_at: string | null; interviewer: string; rating: number | null; experience_years: number | null; current_ctc: number | null; expected_ctc: number | null; offered_ctc: number | null; joining_date: string | null; notes: string; resume_path: string | null; created_at: string; institute_id: string | null; employee_user_id: string | null };
const num = (v: string) => (v === '' ? null : Number(v));
const stageTone = (s: string) => (s === 'hired' ? 'success' : s === 'offered' || s === 'selected' ? 'info' : (closedStages as readonly string[]).includes(s) ? 'danger' : 'warning') as 'success' | 'info' | 'danger' | 'warning';

async function uploadResume(file: File | null, folder: string) {
  if (!file) return null;
  if (file.size > 5 * 1024 * 1024) throw new Error('Resume must be 5 MB or smaller.');
  if (!/\.(pdf|docx?|png|jpe?g)$/i.test(file.name)) throw new Error('Resume must be a PDF, Word file or image.');
  const path = `${folder}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, '_').slice(-80)}`;
  const { error } = await supabase.storage.from('hr-resumes').upload(path, file, { contentType: file.type || undefined });
  if (error) throw error; return path;
}
export const openResume = async (path: string) => { const { data, error } = await supabase.storage.from('hr-resumes').createSignedUrl(path, 120); if (error) throw error; window.open(data.signedUrl, '_blank', 'noopener'); };

function useJobs() { return useQuery({ queryKey: ['hrms', 'jobs'], queryFn: async () => must(await supabase.from('hr_job_openings').select('*').order('created_at', { ascending: false })) as Job[] }); }

/** Lead Research: source candidates for open jobs; sees only the candidates they added and their stage. */
export function CandidateSourcing() {
  const a = useAction(); const jobs = useJobs();
  const mine = useQuery({ queryKey: ['hrms', 'cands-mine'], queryFn: async () => { const uid = (await supabase.auth.getUser()).data.user?.id; return must(await supabase.from('hr_candidates').select('id,job_id,full_name,stage,created_at').eq('created_by', uid ?? '').order('created_at', { ascending: false })) as Pick<Cand, 'id' | 'job_id' | 'full_name' | 'stage' | 'created_at'>[]; } });
  const blank = { job_id: '', full_name: '', email: '', phone: '', city: '', source_detail: '', experience_years: '', expected_ctc: '', notes: '' };
  const [f, setF] = useState(blank); const [file, setFile] = useState<File | null>(null);
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return <div className="grid gap-5">
    <Panel title="Open jobs from HR">{jobs.isPending ? <Loading /> : !jobs.data?.length ? <Empty>HR has no open jobs right now.</Empty> :
      <ul className="grid gap-2 text-sm">{jobs.data.map(j => <li key={j.id} className="border-b border-border pb-2"><b>{j.title}</b> · {j.department} · {j.location} · {j.openings} opening(s){j.salary_range && ` · ${j.salary_range}`}{j.description && <p className="text-muted-foreground">{j.description}</p>}</li>)}</ul>}</Panel>
    <Panel title="Submit a candidate to HR">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Job"><select className={inputCls} value={f.job_id} onChange={set('job_id')}><option value="">Choose…</option>{jobs.data?.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}</select></Field>
        <Field label="Full name"><input className={inputCls} value={f.full_name} onChange={set('full_name')} /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone"><input inputMode="tel" className={inputCls} value={f.phone} onChange={set('phone')} /></Field>
        <Field label="City"><input className={inputCls} value={f.city} onChange={set('city')} /></Field>
        <Field label="Where found (portal, college…)"><input className={inputCls} value={f.source_detail} onChange={set('source_detail')} /></Field>
        <Field label="Experience (years)"><input type="number" min="0" className={inputCls} value={f.experience_years} onChange={set('experience_years')} /></Field>
        <Field label="Expected salary (₹/month)"><input type="number" min="0" className={inputCls} value={f.expected_ctc} onChange={set('expected_ctc')} /></Field>
        <Field label="Resume (max 5 MB)"><input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="text-sm" onChange={e => setFile(e.target.files?.[0] ?? null)} /></Field>
      </div>
      <Field label="Notes for HR"><textarea className={areaCls} value={f.notes} onChange={set('notes')} /></Field>
      <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => { if (!f.job_id) throw new Error('Choose a job.'); if (f.full_name.trim().length < 2) throw new Error('Enter the candidate name.');
        const uid = (await supabase.auth.getUser()).data.user?.id; if (!uid) throw new Error('Please sign in again.');
        const resume_path = await uploadResume(file, uid);
        must(await supabase.from('hr_candidates').insert({ ...f, full_name: f.full_name.trim(), source: 'research', created_by: uid, experience_years: num(f.experience_years), expected_ctc: num(f.expected_ctc), resume_path }));
        setF(blank); setFile(null); }, 'Candidate sent to HR.')}>Send to HR</Button><a.Status />
    </Panel>
    <Panel title="Candidates I sourced">{mine.isPending ? <Loading /> : !mine.data?.length ? <Empty>None yet.</Empty> :
      <Table head={['Date', 'Candidate', 'Job', 'Stage']}>{mine.data.map(c => <tr key={c.id} className="border-b border-border"><Td>{new Date(c.created_at).toLocaleDateString('en-IN')}</Td><Td>{c.full_name}</Td><Td>{jobs.data?.find(j => j.id === c.job_id)?.title ?? '—'}</Td><Td><Pill tone={stageTone(c.stage)}>{stageLabels[c.stage as Stage] ?? c.stage}</Pill></Td></tr>)}</Table>}</Panel>
  </div>;
}
