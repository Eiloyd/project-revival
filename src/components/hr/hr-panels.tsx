import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { History, Pencil, Sparkles, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/shell';
import { calculateIncentive, readSlabs } from '@/lib/crm/incentives';
import { dateTime, money, shortDate, todayIST } from '@/lib/requests';
import { reviewHrRequest } from '@/lib/hr/request-review.functions';
import type { HrReviewResult } from '@/lib/hr/request-review';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';

const monthOf = (m: string) => `${m}-01`;
type Person = { user_id: string; full_name: string; employee_code: string | null; designation: string | null; team_role: string | null; departments: string | null; manager_name: string | null; monthly_gross: number | null; deductions: number | null; net_pay: number | null; present: number; wfh: number; leave_days: number; half_days: number; absent: number; marked_days: number; revenue_target: number | null; verified_revenue: number; unverified_revenue: number; plan_active: boolean | null; plan_slabs: unknown };

function usePeople(month: string) {
  return useQuery({ queryKey: ['hr-people-overview', month], queryFn: async () => { const { data, error } = await supabase.rpc('hr_people_overview', { _month: monthOf(month) }); if (error) throw error; return (data ?? []) as unknown as Person[]; } });
}
const incentiveFor = (p: Person) => calculateIncentive(p.plan_slabs ? { slabs: readSlabs(p.plan_slabs), active: Boolean(p.plan_active) } : null, Number(p.verified_revenue), Number(p.revenue_target ?? 0));

/** HR / Admin / Accounts: every employee's salary, this month's attendance, target, verified revenue and incentive in one list. */
export function PeopleSalaryOverview({ canEdit = true }: { canEdit?: boolean }) {
  const [month, setMonth] = useState(todayIST().slice(0, 7)); const [edit, setEdit] = useState<Person | null>(null); const [search, setSearch] = useState('');
  const q = usePeople(month);
  const rows = (q.data ?? []).filter(p => !search || `${p.full_name} ${p.employee_code ?? ''} ${p.departments ?? ''} ${p.team_role ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const totalNet = rows.reduce((n, p) => n + Number(p.net_pay ?? 0), 0); const totalInc = rows.reduce((n, p) => n + incentiveFor(p).incentive, 0);
  return <div className="grid gap-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Employees" value={rows.length} />
      <KpiCard label="Monthly net salary" value={money(totalNet)} note="from salary structures" />
      <KpiCard label="Incentive earned (verified)" value={money(totalInc)} tone="success" note="per active incentive plan" />
      <KpiCard label="No salary structure yet" value={rows.filter(p => p.monthly_gross == null).length} tone="warning" />
    </div>
    <Panel title="Salary, incentive & attendance" actions={<><input aria-label="Search employees" className={`${inputCls} w-48`} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} /><input aria-label="Month" type="month" className={`${inputCls} w-auto`} value={month} onChange={e => setMonth(e.target.value)} /></>}>
      <p className="mb-3 text-xs text-muted-foreground">Attendance counts days marked this month (P present · WFH · L leave · ½ half day · A absent). Incentive uses only collections verified by Accounts and the active BDE/BDM plan; without a plan or target it stays ₹0.</p>
      <ErrorNote error={q.error} />
      {q.isPending ? <Loading /> : !rows.length ? <Empty>No employees found.</Empty> : <Table head={['Employee', 'Gross / net salary', 'Attendance', 'Target', 'Verified revenue', 'Incentive', '']}>{rows.map(p => { const inc = incentiveFor(p); return <tr key={p.user_id}>
        <Td><span className="font-medium">{p.full_name}</span><span className="block text-xs text-muted-foreground">{[p.employee_code, p.designation, p.team_role, p.departments].filter(Boolean).join(' · ') || '—'}</span>{p.manager_name && <span className="block text-xs text-muted-foreground">Reports to {p.manager_name}</span>}</Td>
        <Td className="whitespace-nowrap">{p.monthly_gross == null ? <Pill tone="warning">Not set</Pill> : <>{money(p.monthly_gross)}<span className="block text-xs text-muted-foreground">Net {money(p.net_pay)}</span></>}</Td>
        <Td className="whitespace-nowrap text-xs">P {p.present} · WFH {p.wfh} · L {p.leave_days} · ½ {p.half_days} · <span className={p.absent ? 'font-semibold text-destructive' : ''}>A {p.absent}</span></Td>
        <Td className="whitespace-nowrap">{p.revenue_target == null ? '—' : money(p.revenue_target)}</Td>
        <Td className="whitespace-nowrap">{money(p.verified_revenue)}{Number(p.unverified_revenue) > 0 && <span className="block text-xs text-muted-foreground">+{money(p.unverified_revenue)} unverified</span>}{p.revenue_target ? <span className="block text-xs text-muted-foreground">{inc.achievement}% of target</span> : null}</Td>
        <Td className="whitespace-nowrap">{inc.status === 'earned' ? <span className="font-semibold">{money(inc.incentive)}</span> : <span className="text-xs text-muted-foreground">{inc.status === 'no_plan' ? 'No plan' : inc.status === 'no_target' ? 'No target' : 'Below first slab'}</span>}</Td>
        <Td>{canEdit && <Button size="sm" variant="outline" onClick={() => setEdit(p)}><Pencil className="size-3.5" />Salary</Button>}</Td>
      </tr>; })}</Table>}
    </Panel>
    {edit && <SalaryForm person={edit} onDone={() => setEdit(null)} />}
  </div>;
}

function SalaryForm({ person, onDone }: { person: Person; onDone: () => void }) {
  const qc = useQueryClient(); const [err, setErr] = useState<unknown>(null); const [busy, setBusy] = useState(false);
  const cur = useQuery({ queryKey: ['salary', person.user_id], queryFn: async () => { const { data, error } = await supabase.from('hr_salary_structures').select('*').eq('user_id', person.user_id).maybeSingle(); if (error) throw error; return data; } });
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); const n = (k: string) => Math.max(0, Number(f.get(k) || 0));
    const basic = n('basic'), hra = n('hra'), allowances = n('allowances');
    setBusy(true); setErr(null);
    const { error } = await supabase.from('hr_salary_structures').upsert({ user_id: person.user_id, basic, hra, allowances, monthly_gross: basic + hra + allowances, deductions: n('deductions'), effective_from: String(f.get('effective_from') || todayIST()), note: String(f.get('note') ?? '').slice(0, 500) }, { onConflict: 'user_id' });
    setBusy(false); if (error) { setErr(error.message.includes('row-level') ? 'Only HR or Admin can set salary, and nobody can set their own.' : error); return; }
    void qc.invalidateQueries({ queryKey: ['hr-people-overview'] }); onDone();
  }
  const c = cur.data;
  return <Panel title={`Salary structure · ${person.full_name}`} actions={<Button variant="ghost" size="sm" onClick={onDone}>Close</Button>}>
    {cur.isPending ? <Loading /> : <form key={c?.updated_at ?? 'new'} onSubmit={e => void submit(e)} className="grid gap-3 sm:grid-cols-3">
      <Field label="Basic (₹ / month)"><input name="basic" type="number" min={0} step="1" className={inputCls} defaultValue={c?.basic ?? 0} /></Field>
      <Field label="HRA (₹)"><input name="hra" type="number" min={0} step="1" className={inputCls} defaultValue={c?.hra ?? 0} /></Field>
      <Field label="Other allowances (₹)"><input name="allowances" type="number" min={0} step="1" className={inputCls} defaultValue={c?.allowances ?? 0} /></Field>
      <Field label="Other deductions (₹)"><input name="deductions" type="number" min={0} step="1" className={inputCls} defaultValue={c?.deductions ?? 0} /></Field>
      <Field label="Effective from"><input name="effective_from" type="date" className={inputCls} defaultValue={c?.effective_from ?? todayIST()} /></Field>
      <Field label="Note"><input name="note" maxLength={500} className={inputCls} defaultValue={c?.note ?? ''} /></Field>
      <div className="sm:col-span-3"><ErrorNote error={err} /><p className="mb-2 text-xs text-muted-foreground">Gross = basic + HRA + allowances. Every change is saved in the audit log with old and new amounts.</p><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save salary'}</Button></div>
    </form>}
  </Panel>;
}

type Revision = { id: string; owner_id: string; month: string; action: string; old_revenue: number | null; old_wins: number | null; old_calls: number | null; new_revenue: number; new_wins: number; new_calls: number; reason: string; changed_by_name: string; changed_by_role: string; created_at: string };

/** HR assigns the joining (first) target; after that only an Admin can revise it, with a reason. Full history below. */
export function TargetAssignment({ mode }: { mode: 'hr' | 'admin' }) {
  const qc = useQueryClient(); const [err, setErr] = useState<unknown>(null); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false); const [owner, setOwner] = useState('');
  const people = usePeople(todayIST().slice(0, 7));
  const targets = useQuery({ queryKey: ['all-targets'], queryFn: async () => { const { data, error } = await supabase.from('crm_targets').select('owner_id,month,revenue_target,wins_target,calls_target').order('month', { ascending: false }).limit(2000); if (error) throw error; return data ?? []; } });
  const history = useQuery({ queryKey: ['target-revisions'], queryFn: async () => { const { data, error } = await supabase.from('target_revisions').select('*').order('created_at', { ascending: false }).limit(300); if (error) throw error; return (data ?? []) as Revision[]; } });
  const hasTarget = new Set((targets.data ?? []).map(t => t.owner_id));
  const all = people.data ?? []; const choices = mode === 'hr' ? all.filter(p => !hasTarget.has(p.user_id)) : all;
  const nameOf = (id: string) => all.find(p => p.user_id === id)?.full_name ?? 'Employee';
  const revising = mode === 'admin' && hasTarget.has(owner);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setErr(null); setOk('');
    const reason = String(f.get('reason') ?? '').trim();
    if (revising && reason.length < 5) { setErr('A reason (at least 5 characters) is required to change a target after joining.'); return; }
    setBusy(true);
    const { error } = await supabase.rpc('target_set', { _owner: owner, _month: monthOf(String(f.get('month'))), _revenue: Number(f.get('revenue') || 0), _wins: Number(f.get('wins') || 0), _calls: Number(f.get('calls') || 0), _reason: reason });
    setBusy(false); if (error) { setErr(error); return; }
    setOk('Target saved and recorded in the history.'); e.currentTarget.reset(); setOwner('');
    for (const k of ['all-targets', 'target-revisions', 'hr-people-overview']) void qc.invalidateQueries({ queryKey: [k] });
  }
  const current = (targets.data ?? []).filter(t => t.owner_id === owner).slice(0, 3);
  return <div className="grid gap-5">
    <Panel title={mode === 'hr' ? 'Assign joining target' : 'Set or revise employee target'}>
      <p className="mb-4 text-sm text-muted-foreground">{mode === 'hr' ? 'HR can set only the first target when an employee joins. After that, only an Admin can change, increase or decrease it.' : 'Admins can change, increase or decrease any target after joining. A reason is mandatory; old and new values, your name and the time are saved.'} BDM, BDE and other employees cannot change targets.</p>
      <ErrorNote error={err} />{ok && <p role="status" className="mb-3 text-sm text-primary">{ok}</p>}
      <form onSubmit={e => void submit(e)} className="grid gap-3 sm:grid-cols-3">
        <Field label="Employee"><select required className={inputCls} value={owner} onChange={e => setOwner(e.target.value)}><option value="">Choose…</option>{choices.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name}{p.team_role ? ` · ${p.team_role}` : ''}{mode === 'admin' && !hasTarget.has(p.user_id) ? ' (no target yet)' : ''}</option>)}</select></Field>
        <Field label="Month"><input name="month" type="month" required className={inputCls} defaultValue={todayIST().slice(0, 7)} /></Field>
        <Field label="Revenue target (₹)"><input name="revenue" type="number" min={0} required className={inputCls} /></Field>
        <Field label="Won deals target"><input name="wins" type="number" min={0} step={1} required className={inputCls} defaultValue={0} /></Field>
        <Field label="Calls target"><input name="calls" type="number" min={0} step={1} required className={inputCls} defaultValue={0} /></Field>
        <Field label={revising ? 'Reason for change (required)' : 'Note (optional)'}><textarea name="reason" maxLength={500} required={revising} className={areaCls} placeholder={revising ? 'e.g. Territory expanded to 3 districts' : ''} /></Field>
        {current.length > 0 && <p className="text-xs text-muted-foreground sm:col-span-3">Current: {current.map(t => `${t.month.slice(0, 7)} → ${money(t.revenue_target)}, ${t.wins_target} wins, ${t.calls_target} calls`).join(' · ')}</p>}
        <div className="sm:col-span-3"><Button type="submit" disabled={busy || !owner}><Target className="size-4" />{busy ? 'Saving…' : revising ? 'Revise target' : 'Assign target'}</Button>{mode === 'hr' && !choices.length && !people.isPending && <span className="ml-3 text-xs text-muted-foreground">Every employee already has a joining target. Changes now need an Admin.</span>}</div>
      </form>
    </Panel>
    <Panel title={<span className="inline-flex items-center gap-2"><History className="size-4" />Target change history</span>}>
      <ErrorNote error={history.error} />
      {history.isPending ? <Loading /> : !history.data?.length ? <Empty>No target changes yet.</Empty> : <Table head={['When', 'Employee', 'Month', 'Old → new (revenue · wins · calls)', 'Reason', 'Changed by']}>{history.data.map(r => <tr key={r.id}>
        <Td className="whitespace-nowrap text-xs">{dateTime(r.created_at)}</Td><Td>{nameOf(r.owner_id)}</Td><Td className="whitespace-nowrap">{shortDate(r.month).slice(3)}</Td>
        <Td className="text-xs">{r.old_revenue == null ? <Pill tone="info">{r.action === 'initial' ? 'Joining target' : 'New month'}</Pill> : <>{money(r.old_revenue)} · {r.old_wins} · {r.old_calls}</>} → <b>{money(r.new_revenue)} · {r.new_wins} · {r.new_calls}</b></Td>
        <Td className="max-w-64 text-xs">{r.reason || '—'}</Td><Td className="text-xs">{r.changed_by_name || '—'} <Pill>{r.changed_by_role.toUpperCase()}</Pill></Td>
      </tr>)}</Table>}
    </Panel>
  </div>;
}

const urgencyTone = { high: 'danger', medium: 'warning', low: 'muted' } as const;
/** HR reviewers pick a request (or paste details); the AI returns a summary, category, urgency and the next step. Nothing is saved. */
export function HrRequestAi() {
  const run = useServerFn(reviewHrRequest);
  const [requestId, setRequestId] = useState(''); const [text, setText] = useState(''); const [language, setLanguage] = useState<'English' | 'Hindi'>('English');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState<HrReviewResult | null>(null);
  const list = useQuery({ queryKey: ['hr-ai-requests'], queryFn: async () => { const { data, error } = await supabase.from('requests').select('id,code,title,type,status,current_step').order('created_at', { ascending: false }).limit(200); if (error) throw error; return data ?? []; } });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setResult(null);
    try { const r = await run({ data: { ...(requestId ? { requestId } : {}), text, language } }); if (r.error || !r.result) setError(r.error ?? 'No answer.'); else setResult(r.result); }
    catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); } finally { setBusy(false); }
  }
  return <div className="grid gap-5 lg:grid-cols-2">
    <Panel title="AI request review"><form onSubmit={e => void submit(e)} className="grid gap-3">
      <p className="text-sm text-muted-foreground">Choose an employee request or paste the details. Only the request facts are sent to the AI — never names, phone numbers, emails or bank details. Nothing is saved; you still decide.</p>
      <Field label="Request"><select className={inputCls} value={requestId} onChange={e => setRequestId(e.target.value)}><option value="">— Paste details instead —</option>{(list.data ?? []).map(r => <option key={r.id} value={r.id}>{r.code} · {r.title} ({r.status}{r.current_step ? ` · ${r.current_step}` : ''})</option>)}</select></Field>
      <Field label={requestId ? 'Extra notes for the AI (optional)' : 'Request details'}><textarea className={`${areaCls} min-h-36`} value={text} maxLength={4000} onChange={e => setText(e.target.value)} placeholder="e.g. Employee asks for 3 days sick leave from Monday, medical certificate attached…" /></Field>
      <Field label="Answer language"><select className={inputCls} value={language} onChange={e => setLanguage(e.target.value as 'English')}><option>English</option><option>Hindi</option></select></Field>
      <Button type="submit" disabled={busy || (!requestId && text.trim().length < 10)}><Sparkles className="size-4" />{busy ? 'Reviewing…' : 'Review with AI'}</Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form></Panel>
    <Panel title="Suggestion">
      {!result && !busy && <p className="text-sm text-muted-foreground">Summary, category, urgency and next step appear here.</p>}
      {busy && <p className="text-sm text-muted-foreground" aria-live="polite">Reading the request…</p>}
      {result && <div className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2"><Pill tone="info">{result.category}</Pill><Pill tone={urgencyTone[result.urgency]}>{result.urgency.toUpperCase()} urgency</Pill></div>
        <p><b>Summary:</b> {result.summary}</p><p><b>Why this urgency:</b> {result.urgencyReason}</p><p><b>Next step:</b> {result.suggestedNextStep}</p>
        {result.checks.length > 0 && <div><b>Check before deciding:</b><ul className="mt-1 list-disc pl-5">{result.checks.map(c => <li key={c}>{c}</li>)}</ul></div>}
        <p className="text-xs text-muted-foreground">AI suggestions can be wrong. Approve or reject from the request itself.</p>
      </div>}
    </Panel>
  </div>;
}
