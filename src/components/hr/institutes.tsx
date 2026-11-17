import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { downloadCsv } from '@/lib/finance';
import { stageLabels, type Stage } from '@/lib/hr/hiring';
import { bulkFileProblem, bulkTemplateCsv, mapCandidateRows, readCandidateFile, type BulkRow } from '@/lib/hr/bulk-candidates';
import { must, useAction } from '@/components/hr/hrms';

type Institute = { id: string; name: string; kind: string; contact_name: string; email: string; phone: string; city: string; active: boolean };
const kindLabel = (k: string) => (k === 'consultancy' ? 'Placement consultancy' : 'Institute / college');
const stageTone = (s: string) => (s === 'hired' ? 'success' : s === 'rejected' || s === 'withdrawn' ? 'danger' : 'warning') as 'success' | 'danger' | 'warning';

export function useInstitutes() {
  return useQuery({ queryKey: ['hrms', 'institutes'], queryFn: async () => must(await supabase.from('hr_institutes').select('*').order('name')) as Institute[] });
}
function useOpenJobs() {
  return useQuery({ queryKey: ['hrms', 'open-jobs'], queryFn: async () => must(await supabase.rpc('careers_open_jobs')) as { id: string; title: string; department: string; location: string }[] });
}

/** HR: institutes and consultancies, and which accounts can open their partner portal. */
export function InstitutesAdmin() {
  const a = useAction(); const list = useInstitutes();
  const blank = { name: '', kind: 'institute', contact_name: '', email: '', phone: '', city: '' };
  const [f, setF] = useState(blank); const [login, setLogin] = useState<Record<string, string>>({});
  const members = useQuery({ queryKey: ['hrms', 'institute-members'], queryFn: async () => must(await supabase.from('hr_institute_members').select('user_id,institute_id,active')) as { user_id: string; institute_id: string; active: boolean }[] });
  return <div className="grid gap-5">
    <Panel title="Add institute or consultancy">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Name"><input className={inputCls} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Type"><select className={inputCls} value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}><option value="institute">Institute / college</option><option value="consultancy">Placement consultancy</option></select></Field>
        <Field label="Coordinator name"><input className={inputCls} value={f.contact_name} onChange={e => setF({ ...f, contact_name: e.target.value })} /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Phone"><input inputMode="tel" className={inputCls} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="City"><input className={inputCls} value={f.city} onChange={e => setF({ ...f, city: e.target.value })} /></Field>
      </div>
      <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => { if (f.name.trim().length < 2) throw new Error('Enter the institute name.'); must(await supabase.from('hr_institutes').insert({ ...f, name: f.name.trim() })); setF(blank); }, 'Institute added.')}>Add institute</Button>
      <a.Status />
    </Panel>
    <Panel title="Institutes & consultancies">
      <ErrorNote error={list.error} />{list.isPending ? <Loading /> : !list.data?.length ? <Empty>No institutes yet.</Empty> :
        <Table head={['Name', 'Type', 'Coordinator', 'Portal logins', 'Status', 'Give portal login']}>{list.data.map(i => <tr key={i.id}>
          <Td className="font-medium">{i.name}<span className="block text-xs text-muted-foreground">{i.city}</span></Td><Td>{kindLabel(i.kind)}</Td>
          <Td className="text-xs">{i.contact_name}<span className="block">{[i.email, i.phone].filter(Boolean).join(' · ')}</span></Td>
          <Td>{(members.data ?? []).filter(m => m.institute_id === i.id && m.active).length}</Td>
          <Td><button type="button" onClick={() => void a.run(async () => must(await supabase.from('hr_institutes').update({ active: !i.active }).eq('id', i.id)), i.active ? 'Institute paused.' : 'Institute active again.')}><Pill tone={i.active ? 'success' : 'muted'}>{i.active ? 'active' : 'paused'}</Pill></button></Td>
          <Td><div className="flex min-w-56 gap-1"><input type="email" aria-label={`Login email for ${i.name}`} placeholder="Coordinator's account email" className={`${inputCls} h-8`} value={login[i.id] ?? ''} onChange={e => setLogin({ ...login, [i.id]: e.target.value })} />
            <Button size="sm" variant="outline" disabled={a.busy || !i.active} onClick={() => void a.run(async () => { must(await supabase.rpc('hr_add_institute_member', { _institute: i.id, _email: login[i.id] ?? '' })); setLogin({ ...login, [i.id]: '' }); }, 'Portal login given. They sign in at /institute-portal.')}>Give</Button></div></Td>
        </tr>)}</Table>}
      <p className="mt-3 text-xs text-muted-foreground">The coordinator first creates an account and verifies their email. They then see only their own candidates — never salaries or other HR records.</p>
    </Panel>
  </div>;
}

/** HR (any institute) or an institute (itself only) uploads a CSV / Excel list; the database skips duplicates and reports why. */
export function BulkCandidateUpload({ partner = false }: { partner?: boolean }) {
  const a = useAction(); const jobs = useOpenJobs(); const inst = useInstitutes();
  const [job, setJob] = useState(''); const [institute, setInstitute] = useState(''); const [rows, setRows] = useState<BulkRow[]>([]); const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<{ added: number; skipped: { row: number; name: string; reason: string }[] } | null>(null);
  const [fileError, setFileError] = useState<unknown>(null);
  const problem = rows.length || fileName ? bulkFileProblem(rows) : null;
  const pick = async (file: File | undefined) => {
    setResult(null); setFileError(null); setRows([]); setFileName(file?.name ?? '');
    if (!file) return; try { setRows(mapCandidateRows(await readCandidateFile(file))); } catch (e) { setFileError(e); }
  };
  return <Panel title="Bulk candidate upload" actions={<Button size="sm" variant="outline" onClick={() => { const b = new Blob([bulkTemplateCsv], { type: 'text/csv' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = 'riloyd-candidates-template.csv'; l.click(); URL.revokeObjectURL(u); }}><Download className="size-4" />Template</Button>}>
    <p className="mb-3 text-sm text-muted-foreground">Upload a CSV or Excel file (up to 500 rows) with the headings Full name, Email, Mobile, City, Experience, Notes. Each candidate needs a name and an email or 10-digit mobile. People already in the pipeline for the same job are skipped.</p>
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Job"><select className={inputCls} value={job} onChange={e => setJob(e.target.value)}><option value="">General pool</option>{jobs.data?.map(j => <option key={j.id} value={j.id}>{j.title}{j.location ? ` · ${j.location}` : ''}</option>)}</select></Field>
      {!partner && <Field label="Institute / consultancy"><select className={inputCls} value={institute} onChange={e => setInstitute(e.target.value)}><option value="">None (HR upload)</option>{inst.data?.filter(i => i.active).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field>}
      <Field label="File (.csv or .xlsx)"><input type="file" accept=".csv,.xlsx" className="text-sm" onChange={e => void pick(e.target.files?.[0])} /></Field>
    </div>
    {rows.length > 0 && !problem && <p className="mt-3 text-sm">{rows.length} candidate{rows.length === 1 ? '' : 's'} read from {fileName}. First: <b>{rows[0]!.full_name}</b>{rows[0]!.phone && ` · ${rows[0]!.phone}`}</p>}
    {problem && <p role="alert" className="mt-3 text-sm text-destructive">{problem}</p>}<ErrorNote error={fileError} />
    <Button className="mt-3" disabled={a.busy || !rows.length || Boolean(problem)} onClick={() => void a.run(async () => {
      const res = must(await supabase.rpc('hr_bulk_candidates', { _institute: (partner ? null : institute || null) as unknown as string, _job: (job || null) as unknown as string, _rows: rows })) as unknown as { added: number; skipped: { row: number; name: string; reason: string }[] };
      setResult(res); setRows([]); setFileName('');
    }, 'Upload finished.')}><Upload className="size-4" />Upload candidates</Button><a.Status />
    {result && <div className="mt-4 grid gap-2 text-sm"><p><b>{result.added}</b> added · <b>{result.skipped.length}</b> skipped</p>
      {result.skipped.length > 0 && <Table head={['Row', 'Name', 'Why skipped']}>{result.skipped.map(s => <tr key={s.row}><Td>{s.row}</Td><Td>{s.name || '—'}</Td><Td>{s.reason}</Td></tr>)}</Table>}</div>}
  </Panel>;
}

/** Candidates from institutes with their first 90 days after joining. Institutes see only their own. */
export function NinetyDayTracking({ partner = false }: { partner?: boolean }) {
  const inst = useInstitutes(); const [institute, setInstitute] = useState('');
  const q = useQuery({ queryKey: ['hrms', 'institute-cands', institute, partner], queryFn: async () => must(await supabase.rpc('institute_candidates', partner || !institute ? {} : { _institute: institute })) as { id: string; institute_name: string; full_name: string; job_title: string; stage: string; applied_on: string; joining_date: string | null; tracking_until: string | null; days_tracked: number; employment_status: string | null; present_days: number; absent_days: number; leave_days: number }[] });
  const rows = q.data ?? []; const joined = rows.filter(r => r.stage === 'hired');
  const status = (r: (typeof rows)[number]) => r.stage !== 'hired' ? '—' : !r.joining_date ? 'Joining date not set' : r.days_tracked >= 90 ? '90 days completed' : r.days_tracked === 0 ? 'Joins soon' : `Day ${r.days_tracked} of 90`;
  return <Panel title="Candidates & 90-day tracking" actions={<>
    {!partner && <select aria-label="Institute" className={`${inputCls} w-52`} value={institute} onChange={e => setInstitute(e.target.value)}><option value="">All institutes</option>{inst.data?.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>}
    {rows.length > 0 && <Button size="sm" variant="outline" onClick={() => downloadCsv('institute-candidates.csv', rows.map(r => ({ institute: r.institute_name, name: r.full_name, job: r.job_title, stage: r.stage, applied: r.applied_on, joined: r.joining_date ?? '', tracking: status(r), employment: r.employment_status ?? '', present: r.present_days, absent: r.absent_days, leave: r.leave_days })))}>Download CSV</Button>}</>}>
    <div className="mb-4 grid gap-3 sm:grid-cols-4">{[['Candidates', rows.length], ['In process', rows.filter(r => !['hired', 'rejected', 'withdrawn'].includes(r.stage)).length], ['Joined', joined.length], ['Inside 90 days', joined.filter(r => r.days_tracked > 0 && r.days_tracked < 90).length]].map(([l, v]) => <div key={l} className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold tabular-nums">{v}</p></div>)}</div>
    <ErrorNote error={q.error} />{q.isPending ? <Loading /> : !rows.length ? <Empty>No candidates from institutes yet.</Empty> :
      <Table head={[...(partner ? [] : ['Institute']), 'Candidate', 'Job', 'Stage', 'Joined', '90-day tracking', 'Present', 'Absent', 'Leave']}>{rows.map(r => <tr key={r.id}>
        {!partner && <Td className="text-xs">{r.institute_name}</Td>}<Td className="font-medium">{r.full_name}<span className="block text-xs text-muted-foreground">applied {r.applied_on}</span></Td><Td>{r.job_title}</Td>
        <Td><Pill tone={stageTone(r.stage)}>{stageLabels[r.stage as Stage] ?? r.stage}</Pill></Td><Td>{r.joining_date ?? '—'}</Td>
        <Td>{status(r)}{r.employment_status && r.stage === 'hired' && <span className="block text-xs text-muted-foreground">{r.employment_status === 'not linked' ? 'HR has not linked the employee yet' : `Employee: ${r.employment_status}`}</span>}</Td>
        <Td className="tabular-nums">{r.stage === 'hired' ? r.present_days : '—'}</Td><Td className="tabular-nums">{r.stage === 'hired' ? r.absent_days : '—'}</Td><Td className="tabular-nums">{r.stage === 'hired' ? r.leave_days : '—'}</Td></tr>)}</Table>}
    <p className="mt-3 text-xs text-muted-foreground">Attendance counts only the first 90 days from the joining date. Salary and personal HR details are never shown here.</p>
  </Panel>;
}
