import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { must, useAction } from '@/components/hr/hrms';

type Task = { id: string; employee_id: string; task: string; done: boolean; done_at: string | null; sort: number };

/** HR: onboarding checklist per new joiner. */
export function OnboardingAdmin() {
  const a = useAction(); const qc = useQueryClient(); const [emp, setEmp] = useState('');
  const people = useQuery({ queryKey: ['hrms', 'onb-emps'], queryFn: async () => must(await supabase.from('employees').select('employee_id,full_name,joining_date').order('joining_date', { ascending: false, nullsFirst: false })) as { employee_id: string; full_name: string; joining_date: string | null }[] });
  const tasks = useQuery({ queryKey: ['hrms', 'onboarding'], queryFn: async () => must(await supabase.from('hr_onboarding_tasks').select('id,employee_id,task,done,done_at,sort').order('sort')) as Task[] });
  const refresh = () => qc.invalidateQueries({ queryKey: ['hrms', 'onboarding'] });
  const byEmp = new Map<string, Task[]>(); tasks.data?.forEach(t => byEmp.set(t.employee_id, [...(byEmp.get(t.employee_id) ?? []), t]));
  const name = (id: string) => people.data?.find(p => p.employee_id === id)?.full_name ?? id;
  return <div className="grid gap-5">
    <Panel title="Start onboarding">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="New joiner"><select className={inputCls} value={emp} onChange={e => setEmp(e.target.value)}><option value="">Choose employee</option>{people.data?.map(p => <option key={p.employee_id} value={p.employee_id}>{p.full_name} · {p.employee_id}</option>)}</select></Field>
        <Button disabled={a.busy || !emp} onClick={() => void a.run(async () => { must(await supabase.rpc('hr_onboarding_start', { _employee_id: emp })); await refresh(); }, 'Checklist created.')}>Create checklist</Button>
      </div><a.Status />
    </Panel>
    <ErrorNote error={tasks.error} />{tasks.isPending ? <Loading /> : !byEmp.size ? <Empty>No onboarding checklists yet.</Empty> :
      [...byEmp.entries()].map(([id, list]) => { const done = list.filter(t => t.done).length;
        return <Panel key={id} title={`${name(id)} · ${id}`} actions={<Pill tone={done === list.length ? 'success' : 'info'}>{done}/{list.length} done</Pill>}>
          <ul className="grid gap-2">{list.map(t => <li key={t.id} className="flex items-center gap-3 text-sm">
            <input type="checkbox" aria-label={t.task} checked={t.done} onChange={e => void a.run(async () => { const { data: u } = await supabase.auth.getUser();
              must(await supabase.from('hr_onboarding_tasks').update({ done: e.target.checked, done_at: e.target.checked ? new Date().toISOString() : null, done_by: e.target.checked ? u.user?.id ?? null : null }).eq('id', t.id)); await refresh(); })} />
            <span className={t.done ? 'line-through opacity-60' : ''}>{t.task}</span>
            {t.done_at && <span className="text-xs opacity-60">{new Date(t.done_at).toLocaleDateString('en-IN')}</span>}</li>)}</ul>
        </Panel>; })}
  </div>;
}

const cats: Record<string, string> = { harassment: 'Harassment', discrimination: 'Discrimination', workplace: 'Workplace safety / environment', manager: 'Manager behaviour', pay: 'Pay or benefits', policy: 'Policy concern', other: 'Other' };
const statuses: Record<string, string> = { open: 'Open', in_review: 'In review', resolved: 'Resolved', closed: 'Closed' };
type Grievance = { id: string; tracking_code: string; category: string; details: string; anonymous: boolean; status: string; hr_response: string | null; created_at: string };

/** HR: grievance inbox. Anonymous ones carry no submitter. */
export function GrievanceAdmin() {
  const a = useAction(); const qc = useQueryClient(); const [reply, setReply] = useState<Record<string, string>>({});
  const q = useQuery({ queryKey: ['hrms', 'grievances'], queryFn: async () => must(await supabase.from('hr_grievances').select('id,tracking_code,category,details,anonymous,status,hr_response,created_at').order('created_at', { ascending: false })) as Grievance[] });
  return <Panel title="Grievances">
    <ErrorNote error={q.error} />{q.isPending ? <Loading /> : !q.data?.length ? <Empty>No grievances raised.</Empty> :
      <div className="grid gap-4">{q.data.map(g => <div key={g.id} className="rounded-lg border p-4 text-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2"><b>{g.tracking_code}</b><Pill tone="muted">{cats[g.category] ?? g.category}</Pill><Pill tone={g.status === 'open' ? 'warning' : g.status === 'in_review' ? 'info' : 'success'}>{statuses[g.status]}</Pill>{g.anonymous && <Pill tone="muted">Anonymous</Pill>}<span className="text-xs opacity-60">{new Date(g.created_at).toLocaleString('en-IN')}</span></div>
        <p className="mb-3 whitespace-pre-wrap">{g.details}</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Field label="Response to employee"><textarea className={inputCls} rows={2} maxLength={2000} value={reply[g.id] ?? g.hr_response ?? ''} onChange={e => setReply({ ...reply, [g.id]: e.target.value })} /></Field>
          <select aria-label="Status" className={inputCls} defaultValue={g.status} id={`st-${g.id}`}>{Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <Button size="sm" disabled={a.busy} onClick={() => void a.run(async () => { const st = (document.getElementById(`st-${g.id}`) as HTMLSelectElement).value;
            must(await supabase.from('hr_grievances').update({ status: st, hr_response: (reply[g.id] ?? g.hr_response ?? '').trim() || null }).eq('id', g.id)); await qc.invalidateQueries({ queryKey: ['hrms', 'grievances'] }); }, 'Saved.')}>Save</Button>
        </div></div>)}</div>}
    <a.Status />
  </Panel>;
}

/** Any employee: raise a grievance (anonymous by default) and track it by code. */
export function MyGrievance() {
  const a = useAction(); const [f, setF] = useState({ category: 'workplace', details: '', anonymous: true }); const [code, setCode] = useState(''); const [track, setTrack] = useState('');
  const [found, setFound] = useState<{ status: string; hr_response: string | null } | null | 'none'>(null);
  return <div className="grid gap-5">
    <Panel title="Raise a grievance">
      <p className="mb-3 text-sm opacity-80">Anonymous grievances do not record who sent them. Keep the tracking code to see HR's reply.</p>
      <div className="grid gap-3">
        <Field label="Category"><select className={inputCls} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{Object.entries(cats).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="What happened?"><textarea className={inputCls} rows={5} maxLength={4000} value={f.details} onChange={e => setF({ ...f, details: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.anonymous} onChange={e => setF({ ...f, anonymous: e.target.checked })} /> Send anonymously</label>
        <Button className="w-fit" disabled={a.busy} onClick={() => void a.run(async () => { const c = must(await supabase.rpc('grievance_submit', { _category: f.category, _details: f.details, _anonymous: f.anonymous })) as string; setCode(c); setF({ ...f, details: '' }); }, 'Grievance sent to HR.')}>Send</Button>
        {code && <p className="text-sm">Your tracking code: <b>{code}</b></p>}
      </div><a.Status />
    </Panel>
    <Panel title="Track a grievance">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Tracking code"><input className={inputCls} value={track} onChange={e => setTrack(e.target.value)} placeholder="GRV-…" /></Field>
        <Button variant="outline" onClick={() => void (async () => { const { data } = await supabase.rpc('grievance_status', { _code: track }); setFound((data as { status: string; hr_response: string | null }[] | null)?.[0] ?? 'none'); })()}>Check</Button>
      </div>
      {found === 'none' ? <p className="mt-3 text-sm">No grievance found with that code.</p> : found && <Table head={['Status', 'HR reply']}><tr><Td>{statuses[found.status]}</Td><Td>{found.hr_response ?? 'No reply yet'}</Td></tr></Table>}
    </Panel>
  </div>;
}
