import { useMemo, useState } from 'react';
import { csvCell } from '@/lib/share/whatsapp';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Printer, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { manpowerStatusLabels } from '@/lib/ventures/rules';
import { billAmount, candidateStageLabels, contractTypeLabels, deploymentStatusLabels, fillRate, invoiceStatusLabels, invoiceTotals, payrollLine, timesheetStatusLabels } from '@/lib/manpower/rules';
import { ManpowerDelays } from './manpower-delays';
import { date, inr, must, openResume, uploadResume, useAct, useClients, useManpower, useMpCandidates, useMpDeployments, useMpInvoices, useMpTimesheets, type Client, type Manpower, type MpDeployment, type MpInvoice } from './data';

type Tone = 'success' | 'danger' | 'warning' | 'info' | 'muted';
const lbl = (m: Record<string, string>, k: string) => m[k] ?? k;
const tone = (s: string): Tone => ['deployed', 'active', 'selected', 'joined', 'client_approved', 'paid', 'invoiced'].includes(s) ? 'success' : ['rejected', 'dropped', 'disputed', 'cancelled', 'exited', 'replacement', 'replacement_requested'].includes(s) ? 'danger' : ['open', 'submitted', 'issued', 'client_interview'].includes(s) ? 'warning' : ['closed', 'replaced'].includes(s) ? 'muted' : 'info';
function Status({ a }: { a: ReturnType<typeof useAct> }) { return <div className="mt-2 space-y-1"><ErrorNote error={a.error} />{a.notice && <p role="status" className="text-sm text-muted-foreground">{a.notice}</p>}</div>; }
const thisMonth = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).slice(0, 7);
const monthDate = (m: string) => `${m}-01`;
const monthLabel = (d: string) => new Date(`${d.slice(0, 7)}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const daysIn = (m: string) => { const [y, mo] = m.split('-').map(Number); return new Date(y!, mo!, 0).getDate(); };
function csv(name: string, rows: (string | number)[][]) {
  const text = rows.map(r => r.map(v => csvCell(v)).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv' })); const el = document.createElement('a'); el.href = url; el.download = name; el.click(); URL.revokeObjectURL(url);
}
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
/** Opens a clean printable copy of an invoice (the browser's Print → Save as PDF). */
export function printInvoice(inv: MpInvoice, clientName: string) {
  const w = window.open('', '_blank'); if (!w) return;
  const rows = inv.lines.map(l => `<tr><td>${esc(l.worker_code)}</td><td>${esc(l.worker_name)}<br><small>${esc(l.designation)}</small></td><td>${l.present_days}/${l.working_days}</td><td>${l.ot_hours}</td><td class=r>${inr(l.amount)}</td></tr>`).join('');
  w.document.write(`<!doctype html><title>${esc(inv.invoice_no)}</title><style>body{font:14px system-ui,sans-serif;margin:40px;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}.r{text-align:right}h1{margin:0}small{color:#666}</style>
  <h1>RILOYD</h1><p>Manpower services invoice</p><p><b>${esc(inv.invoice_no)}</b> · ${monthLabel(inv.month)} · Issued ${date(inv.created_at)}<br>Bill to: <b>${esc(clientName)}</b></p>
  <table><thead><tr><th>Code</th><th>Staff</th><th>Days present</th><th>OT hours</th><th class=r>Amount</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td colspan=4 class=r>Subtotal</td><td class=r>${inr(inv.subtotal)}</td></tr><tr><td colspan=4 class=r>Service fee (${inv.service_fee_percent}%)</td><td class=r>${inr(inv.service_fee)}</td></tr><tr><td colspan=4 class=r>GST (${inv.gst_percent}%)</td><td class=r>${inr(inv.gst)}</td></tr><tr><td colspan=4 class=r><b>Total</b></td><td class=r><b>${inr(inv.total)}</b></td></tr></tfoot></table>
  <p>Status: ${esc(lbl(invoiceStatusLabels, inv.status))}${inv.paid_reference ? ` · Ref ${esc(inv.paid_reference)}` : ''}</p><script>print()</script>`);
  w.document.close();
}

const tabs = [['requirements', 'Requirements'], ['candidates', 'Candidates'], ['staff', 'Deployed staff'], ['timesheets', 'Attendance & timesheets'], ['payroll', 'Payroll register'], ['invoices', 'Invoices'], ['delays', 'Delays & bottlenecks'], ['reports', 'Reports']] as const;
type Tab = typeof tabs[number][0];

/** Ventures desk: the full manpower supply workflow, requirement → candidates → deployment → attendance → payroll → invoice. */
export function ManpowerSuite() {
  const [tab, setTab] = useState<Tab>('requirements');
  const clients = useClients(); const reqs = useManpower(); const cands = useMpCandidates(); const deps = useMpDeployments(); const ts = useMpTimesheets(); const inv = useMpInvoices();
  const err = clients.error || reqs.error || cands.error || deps.error || ts.error || inv.error;
  if (clients.isPending || reqs.isPending || cands.isPending || deps.isPending || ts.isPending || inv.isPending) return <Loading />;
  if (err) return <ErrorNote error={err} />;
  const ctx = { clients: clients.data ?? [], reqs: reqs.data ?? [], cands: cands.data ?? [], deps: deps.data ?? [], ts: ts.data ?? [], inv: inv.data ?? [] };
  const fr = fillRate(ctx.reqs); const active = ctx.deps.filter(d => ['active', 'replacement_requested'].includes(d.status));
  return <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[
      ['Open positions', fr.need - fr.got], ['Fill rate', `${fr.percent}%`], ['Staff deployed', active.length],
      ['Replacements pending', ctx.deps.filter(d => d.status === 'replacement_requested').length], ['Unpaid invoices', inr(ctx.inv.filter(i => i.status === 'issued').reduce((n, i) => n + Number(i.total), 0))],
    ].map(([k, v]) => <div key={String(k)} className="dash-card p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-2xl font-bold tabular-nums">{v}</p></div>)}</div>
    <div role="tablist" aria-label="Manpower sections" className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">{tabs.map(([k, v]) => <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{v}</button>)}</div>
    {tab === 'requirements' && <Requirements {...ctx} />}
    {tab === 'candidates' && <Candidates {...ctx} />}
    {tab === 'staff' && <Staff {...ctx} />}
    {tab === 'timesheets' && <Timesheets {...ctx} />}
    {tab === 'payroll' && <Payroll {...ctx} />}
    {tab === 'invoices' && <Invoices {...ctx} />}
    {tab === 'delays' && <ManpowerDelays {...ctx} />}
    {tab === 'reports' && <Reports {...ctx} />}
  </div>;
}
type Ctx = { clients: Client[]; reqs: Manpower[]; cands: ReturnType<typeof useMpCandidates>['data'] & object; deps: MpDeployment[]; ts: NonNullable<ReturnType<typeof useMpTimesheets>['data']>; inv: MpInvoice[] };
const clientName = (c: Client[], id: string) => c.find(x => x.id === id)?.name ?? '—';
const reqName = (r: Manpower[], id: string | null) => r.find(x => x.id === id)?.role_title ?? '—';

function RequirementForm({ clients, fixedClient, onDone }: { clients?: Client[]; fixedClient?: string; onDone?: () => void }) {
  const a = useAct(); const blank = { client_id: fixedClient ?? '', role_title: '', headcount: '1', experience: '', shift: '', budget: '', location: '', needed_by: '', contract_type: 'contract', priority: 'normal', description: '' };
  const [f, setF] = useState(blank); const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {!fixedClient && <Field label="Client"><select className={inputCls} value={f.client_id} onChange={set('client_id')}><option value="">Choose…</option>{(clients ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
    <Field label="Role / profile"><input className={inputCls} value={f.role_title} onChange={set('role_title')} placeholder="e.g. Security guard, Data entry operator" /></Field>
    <Field label="Number of people"><input className={inputCls} type="number" min="1" max="5000" value={f.headcount} onChange={set('headcount')} /></Field>
    <Field label="Type"><select className={inputCls} value={f.contract_type} onChange={set('contract_type')}>{Object.entries(contractTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
    <Field label="Needed by"><input className={inputCls} type="date" value={f.needed_by} onChange={set('needed_by')} /></Field>
    <Field label="Priority"><select className={inputCls} value={f.priority} onChange={set('priority')}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></Field>
    <Field label="Experience"><input className={inputCls} placeholder="e.g. 1–3 years" value={f.experience} onChange={set('experience')} /></Field>
    <Field label="Shift / timing"><input className={inputCls} value={f.shift} onChange={set('shift')} /></Field>
    <Field label="Budget per person (monthly)"><input className={inputCls} value={f.budget} onChange={set('budget')} /></Field>
    <Field label="Work location"><input className={inputCls} value={f.location} onChange={set('location')} /></Field></div>
    <div className="mt-3"><Field label="Job description & skills"><textarea className={areaCls} maxLength={2000} value={f.description} onChange={set('description')} /></Field></div>
    <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => {
      if (!f.client_id) throw new Error('Choose the client.'); if (f.role_title.trim().length < 2) throw new Error('Enter the role.');
      must(await supabase.from('manpower_requirements').insert({ ...f, needed_by: f.needed_by || null, headcount: Math.max(1, Math.min(5000, Number(f.headcount) || 1)) })); setF(blank); onDone?.();
    }, 'Requirement posted.')}>Post requirement</Button><Status a={a} /></>;
}

function Requirements({ clients, reqs, cands }: Ctx) {
  const a = useAct(); const [edit, setEdit] = useState<Record<string, { status: string; update_note: string }>>({}); const [filter, setFilter] = useState('active');
  const rows = reqs.filter(r => filter === 'all' || (filter === 'active' ? r.status !== 'closed' : r.status === filter));
  return <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
    <Panel title="New requirement (for a client)"><RequirementForm clients={clients} /></Panel>
    <Panel title="Requirements" actions={<select aria-label="Filter" className={`${inputCls} w-auto`} value={filter} onChange={e => setFilter(e.target.value)}><option value="active">Not closed</option><option value="all">All</option>{Object.entries(manpowerStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}>
      {!rows.length ? <Empty>No requirements.</Empty> : <Table head={['Client / role', 'Need', 'Candidates', 'Status & note for client', '']}>{rows.map(x => {
        const e = edit[x.id] ?? { status: x.status, update_note: x.update_note }; const c = cands.filter(y => y.requirement_id === x.id);
        const late = x.needed_by && x.needed_by < new Date().toISOString().slice(0, 10) && x.filled < x.headcount && x.status !== 'closed';
        return <tr key={x.id}><Td><b>{x.role_title}</b><div className="text-xs text-muted-foreground">{clientName(clients, x.client_id)} · {lbl(contractTypeLabels, x.contract_type)} · {x.location || 'location not set'}</div>{x.priority !== 'normal' && <Pill tone="danger">{x.priority}</Pill>}</Td>
          <Td><b>{x.filled}/{x.headcount}</b> filled<div className={`text-xs ${late ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>{x.needed_by ? `by ${date(x.needed_by)}${late ? ' · overdue' : ''}` : 'no date'}</div><div className="text-xs text-muted-foreground">{[x.experience, x.shift, x.budget].filter(Boolean).join(' · ')}</div></Td>
          <Td className="text-xs">{c.length} total · {c.filter(y => y.stage === 'shared' || y.stage === 'client_interview').length} with client · {c.filter(y => y.stage === 'selected').length} selected</Td>
          <Td><div className="grid gap-1"><select className={inputCls} value={e.status} onChange={ev => setEdit({ ...edit, [x.id]: { ...e, status: ev.target.value } })}>{Object.entries(manpowerStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><input className={inputCls} maxLength={1000} placeholder="Update for client" value={e.update_note} onChange={ev => setEdit({ ...edit, [x.id]: { ...e, update_note: ev.target.value } })} /></div></Td>
          <Td><Button size="sm" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.from('manpower_requirements').update(e).eq('id', x.id)), 'Requirement updated.')}>Save</Button></Td></tr>;
      })}</Table>}<Status a={a} /></Panel>
  </div>;
}

const staffStages = ['sourced', 'screened', 'shared', 'rejected', 'dropped'];
function Candidates({ clients, reqs, cands }: Ctx) {
  const a = useAct(); const pa = useAct(); const openReqs = reqs.filter(r => r.status !== 'closed'); const [req, setReq] = useState('');
  const blank = { requirement_id: '', full_name: '', phone: '', email: '', skills: '', experience_years: '', location: '', expected_salary: '', internal_note: '', stage: 'sourced' };
  const [f, setF] = useState(blank); const [file, setFile] = useState<File | null>(null); const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const rows = cands.filter(c => !req || c.requirement_id === req);
  const cols = ['sourced', 'screened', 'shared', 'client_interview', 'selected', 'joined', 'rejected', 'dropped'];
  return <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
    <Panel title="Add candidate"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="For requirement"><select className={inputCls} value={f.requirement_id} onChange={set('requirement_id')}><option value="">Choose…</option>{openReqs.map(r => <option key={r.id} value={r.id}>{r.role_title} · {clientName(clients, r.client_id)}</option>)}</select></Field>
      <Field label="Full name"><input className={inputCls} value={f.full_name} onChange={set('full_name')} /></Field>
      <Field label="Phone"><input className={inputCls} inputMode="tel" maxLength={20} value={f.phone} onChange={set('phone')} /></Field>
      <Field label="Email"><input className={inputCls} type="email" value={f.email} onChange={set('email')} /></Field>
      <Field label="Skills"><input className={inputCls} maxLength={500} value={f.skills} onChange={set('skills')} /></Field>
      <Field label="Experience (years)"><input className={inputCls} type="number" min="0" max="60" step="0.5" value={f.experience_years} onChange={set('experience_years')} /></Field>
      <Field label="Current location"><input className={inputCls} value={f.location} onChange={set('location')} /></Field>
      <Field label="Expected salary (₹/month)"><input className={inputCls} type="number" min="0" value={f.expected_salary} onChange={set('expected_salary')} /></Field>
      <Field label="Starting stage"><select className={inputCls} value={f.stage} onChange={set('stage')}>{['sourced', 'screened', 'shared'].map(s => <option key={s} value={s}>{candidateStageLabels[s]}</option>)}</select></Field>
      <Field label="Resume (optional)"><label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm"><Upload className="size-4" />{file ? file.name.slice(0, 28) : 'Choose file'}<input type="file" className="sr-only" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label></Field>
      <div className="sm:col-span-2"><Field label="Screening note (internal, never shown to the client)"><input className={inputCls} maxLength={1000} value={f.internal_note} onChange={set('internal_note')} /></Field></div></div>
      <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => {
        const r = reqs.find(x => x.id === f.requirement_id); if (!r) throw new Error('Choose the requirement.'); if (f.full_name.trim().length < 2) throw new Error('Enter the candidate name.');
        const resume_path = file ? await uploadResume(r.client_id, file) : null;
        must(await supabase.from('manpower_candidates').insert({ ...f, client_id: r.client_id, full_name: f.full_name.trim(), experience_years: f.experience_years === '' ? null : Number(f.experience_years), expected_salary: f.expected_salary === '' ? null : Number(f.expected_salary), resume_path }));
        setF({ ...blank, requirement_id: f.requirement_id }); setFile(null);
      }, 'Candidate added.')}>Add candidate</Button><Status a={a} /></Panel>
    <Panel title="Candidate pipeline" actions={<select aria-label="Requirement" className={`${inputCls} w-auto max-w-64`} value={req} onChange={e => setReq(e.target.value)}><option value="">All requirements</option>{reqs.map(r => <option key={r.id} value={r.id}>{r.role_title} · {clientName(clients, r.client_id)}</option>)}</select>}>
      <p className="mb-3 text-xs text-muted-foreground">Clients see only candidates marked "Shared with client" or later — never phone, email, salary or internal notes. Clients decide interview / select / reject themselves; a candidate becomes "Joined" when you add them to Deployed staff.</p>
      {!rows.length ? <Empty>No candidates yet.</Empty> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{cols.map(s => { const list = rows.filter(c => c.stage === s); return <section key={s} className="rounded-lg border border-border bg-surface p-2"><h4 className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{candidateStageLabels[s]}<span>{list.length}</span></h4>
        <div className="grid gap-2">{list.map(c => <article key={c.id} className="rounded-md border border-border bg-background p-2.5 text-sm">
          <b>{c.full_name}</b><p className="text-xs text-muted-foreground">{reqName(reqs, c.requirement_id)} · {c.experience_years ?? '?'} yrs · {c.location || '—'}</p>
          <p className="text-xs text-muted-foreground">{c.phone}{c.expected_salary ? ` · exp. ${inr(c.expected_salary)}` : ''}</p>
          {c.skills && <p className="mt-1 text-xs">{c.skills}</p>}{c.internal_note && <p className="mt-1 text-xs italic text-muted-foreground">{c.internal_note}</p>}
          {c.interview_at && <p className="mt-1 text-xs">Interview: {new Date(c.interview_at).toLocaleString('en-IN')}</p>}{c.client_feedback && <p className="mt-1 text-xs"><b>Client:</b> {c.client_feedback}</p>}
          <div className="mt-2 flex flex-wrap gap-1">{c.resume_path && <Button size="sm" variant="ghost" onClick={() => void pa.run(() => openResume(c.resume_path!), 'Resume opened.')}><FileText className="size-3.5" />Resume</Button>}
            {!['joined'].includes(c.stage) && <select aria-label="Move to" className={`${inputCls} h-8 w-auto text-xs`} value="" onChange={e => { const v = e.target.value; if (v) void pa.run(async () => must(await supabase.from('manpower_candidates').update({ stage: v }).eq('id', c.id)), `Moved to ${candidateStageLabels[v]}.`); }}><option value="">Move to…</option>{staffStages.filter(x => x !== c.stage).map(x => <option key={x} value={x}>{candidateStageLabels[x]}</option>)}</select>}</div>
        </article>)}</div></section>; })}</div>}<Status a={pa} /></Panel>
  </div>;
}

function Staff({ clients, reqs, cands, deps }: Ctx) {
  const a = useAct(); const la = useAct(); const [prefill, setPrefill] = useState('');
  const blank = { requirement_id: '', candidate_id: '', worker_name: '', worker_phone: '', designation: '', start_date: new Date().toISOString().slice(0, 10), monthly_salary: '', billing_rate: '', ot_rate: '0', pf_applicable: true, esic_applicable: true };
  const [f, setF] = useState(blank); const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const selected = cands.filter(c => c.stage === 'selected' && (!f.requirement_id || c.requirement_id === f.requirement_id));
  const [action, setAction] = useState<Record<string, { kind: string; text: string; by: string }>>({}); const [status, setStatus] = useState('current');
  const rows = deps.filter(d => status === 'all' || (status === 'current' ? ['active', 'replacement_requested'].includes(d.status) : d.status === status));
  if (prefill) { const c = cands.find(x => x.id === prefill); setPrefill(''); if (c) setF({ ...blank, requirement_id: c.requirement_id, candidate_id: c.id, worker_name: c.full_name, worker_phone: c.phone, designation: reqName(reqs, c.requirement_id), monthly_salary: c.expected_salary?.toString() ?? '' }); }
  const margin = (Number(f.billing_rate) || 0) - (Number(f.monthly_salary) || 0);
  return <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
    <Panel title="Deploy staff to a client">
      {cands.some(c => c.stage === 'selected') && <div className="mb-3 flex flex-wrap gap-2 text-sm"><span className="text-muted-foreground">Selected by client, ready to join:</span>{cands.filter(c => c.stage === 'selected').map(c => <Button key={c.id} size="sm" variant="outline" onClick={() => setPrefill(c.id)}>{c.full_name} · {reqName(reqs, c.requirement_id)}</Button>)}</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Requirement"><select className={inputCls} value={f.requirement_id} onChange={set('requirement_id')}><option value="">Choose…</option>{reqs.filter(r => r.status !== 'closed').map(r => <option key={r.id} value={r.id}>{r.role_title} · {clientName(clients, r.client_id)} ({r.filled}/{r.headcount})</option>)}</select></Field>
        <Field label="Selected candidate (optional)"><select className={inputCls} value={f.candidate_id} onChange={e => { const c = cands.find(x => x.id === e.target.value); setF({ ...f, candidate_id: e.target.value, worker_name: c?.full_name ?? f.worker_name, worker_phone: c?.phone ?? f.worker_phone }); }}><option value="">— none / direct —</option>{selected.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select></Field>
        <Field label="Worker name"><input className={inputCls} value={f.worker_name} onChange={set('worker_name')} /></Field>
        <Field label="Phone"><input className={inputCls} maxLength={20} value={f.worker_phone} onChange={set('worker_phone')} /></Field>
        <Field label="Designation at client"><input className={inputCls} value={f.designation} onChange={set('designation')} /></Field>
        <Field label="Start date"><input className={inputCls} type="date" value={f.start_date} onChange={set('start_date')} /></Field>
        <Field label="Monthly salary to worker (₹)"><input className={inputCls} type="number" min="0" value={f.monthly_salary} onChange={set('monthly_salary')} /></Field>
        <Field label="Monthly billing rate to client (₹)"><input className={inputCls} type="number" min="0" value={f.billing_rate} onChange={set('billing_rate')} /></Field>
        <Field label="Overtime rate (₹/hour, billed)"><input className={inputCls} type="number" min="0" value={f.ot_rate} onChange={set('ot_rate')} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.pf_applicable} onChange={e => setF({ ...f, pf_applicable: e.target.checked })} />PF applies</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.esic_applicable} onChange={e => setF({ ...f, esic_applicable: e.target.checked })} />ESIC applies (salary up to ₹21,000)</label>
        <p className={`text-sm ${margin < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>Gross margin per month: <b>{inr(margin)}</b>{margin < 0 ? ' — billing is below salary' : ''}</p></div>
      <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => {
        const r = reqs.find(x => x.id === f.requirement_id); if (!r) throw new Error('Choose the requirement.'); if (f.worker_name.trim().length < 2) throw new Error('Enter the worker name.');
        if (!(Number(f.billing_rate) > 0)) throw new Error('Enter the monthly billing rate.');
        must(await supabase.from('manpower_deployments').insert({ ...f, client_id: r.client_id, candidate_id: f.candidate_id || null, worker_name: f.worker_name.trim(), monthly_salary: Number(f.monthly_salary) || 0, billing_rate: Number(f.billing_rate), ot_rate: Number(f.ot_rate) || 0 })); setF(blank);
      }, 'Staff deployed. The requirement fill count is updated automatically.')}>Deploy</Button><Status a={a} /></Panel>
    <Panel title="Deployed staff" actions={<div className="flex gap-2"><select aria-label="Status" className={`${inputCls} w-auto`} value={status} onChange={e => setStatus(e.target.value)}><option value="current">Current</option><option value="all">All</option>{Object.entries(deploymentStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <Button size="sm" variant="outline" onClick={() => csv('deployed-staff.csv', [['Code', 'Name', 'Phone', 'Client', 'Role', 'Designation', 'Start', 'End', 'Status', 'Salary', 'Billing', 'OT rate', 'PF', 'ESIC'], ...rows.map(d => [d.worker_code, d.worker_name, d.worker_phone, clientName(clients, d.client_id), reqName(reqs, d.requirement_id), d.designation, d.start_date, d.end_date ?? '', d.status, d.monthly_salary, d.billing_rate, d.ot_rate, d.pf_applicable ? 'Yes' : 'No', d.esic_applicable ? 'Yes' : 'No'])])}><Download className="size-3.5" />CSV</Button></div>}>
      {!rows.length ? <Empty>No staff.</Empty> : <Table head={['Worker', 'Client / role', 'Dates', 'Salary · billing', 'Status', 'Action']}>{rows.map(d => {
        const act = action[d.id] ?? { kind: '', text: '', by: '' }; const repl = deps.filter(x => x.id !== d.id && x.client_id === d.client_id && x.status === 'active');
        return <tr key={d.id}><Td><span className="font-mono text-xs text-muted-foreground">{d.worker_code}</span><br /><b>{d.worker_name}</b><div className="text-xs text-muted-foreground">{d.worker_phone}</div></Td>
          <Td>{clientName(clients, d.client_id)}<div className="text-xs text-muted-foreground">{d.designation || reqName(reqs, d.requirement_id)}</div></Td>
          <Td className="text-xs">From {date(d.start_date)}{d.end_date && <><br />to {date(d.end_date)}</>}</Td>
          <Td className="text-xs tabular-nums">{inr(d.monthly_salary)} · {inr(d.billing_rate)}<br />OT {inr(d.ot_rate)}/h · {[d.pf_applicable && 'PF', d.esic_applicable && 'ESIC'].filter(Boolean).join(' + ') || 'no PF/ESIC'}</Td>
          <Td><Pill tone={tone(d.status)}>{lbl(deploymentStatusLabels, d.status)}</Pill>{d.replacement_reason && d.status === 'replacement_requested' && <p className="mt-1 max-w-48 text-xs">{d.replacement_reason}</p>}{d.exit_reason && <p className="mt-1 max-w-48 text-xs text-muted-foreground">{d.exit_reason}</p>}</Td>
          <Td>{['active', 'replacement_requested'].includes(d.status) && <div className="grid min-w-44 gap-1">
            <select aria-label="Action" className={`${inputCls} h-8 text-xs`} value={act.kind} onChange={e => setAction({ ...action, [d.id]: { ...act, kind: e.target.value } })}><option value="">Choose action…</option>{d.status === 'active' && <option value="replace_req">Request replacement</option>}<option value="replaced">Mark replaced</option><option value="exit">Exit / release</option></select>
            {act.kind === 'replaced' && <select aria-label="Replaced by" className={`${inputCls} h-8 text-xs`} value={act.by} onChange={e => setAction({ ...action, [d.id]: { ...act, by: e.target.value } })}><option value="">Replaced by…</option>{repl.map(x => <option key={x.id} value={x.id}>{x.worker_name} ({x.worker_code})</option>)}</select>}
            {act.kind && act.kind !== 'replaced' && <input className={`${inputCls} h-8 text-xs`} placeholder="Reason" value={act.text} onChange={e => setAction({ ...action, [d.id]: { ...act, text: e.target.value } })} />}
            {act.kind && <Button size="sm" disabled={la.busy} onClick={() => void la.run(async () => {
              if (act.kind === 'replace_req') must(await supabase.rpc('manpower_request_replacement', { _id: d.id, _reason: act.text }));
              else if (act.kind === 'replaced') { if (!act.by) throw new Error('Deploy the new worker first, then choose them here.'); must(await supabase.from('manpower_deployments').update({ status: 'replaced', replaced_by: act.by }).eq('id', d.id)); }
              else must(await supabase.from('manpower_deployments').update({ status: 'exited', exit_reason: act.text }).eq('id', d.id));
              setAction({ ...action, [d.id]: { kind: '', text: '', by: '' } });
            }, 'Staff record updated.')}>Apply</Button>}</div>}</Td></tr>;
      })}</Table>}<Status a={la} /></Panel>
  </div>;
}

function Timesheets({ clients, deps, ts }: Ctx) {
  const a = useAct(); const [month, setMonth] = useState(thisMonth()); const [client, setClient] = useState('');
  const md = monthDate(month); const end = `${month}-${String(daysIn(month)).padStart(2, '0')}`;
  const list = deps.filter(d => d.start_date <= end && (!d.end_date || d.end_date >= md) && (!client || d.client_id === client));
  const [v, setV] = useState<Record<string, { working: string; present: string; ot: string }>>({});
  return <Panel title="Monthly attendance & timesheets" actions={<div className="flex flex-wrap gap-2"><input type="month" aria-label="Month" className={`${inputCls} w-auto`} value={month} onChange={e => setMonth(e.target.value || thisMonth())} /><select aria-label="Client" className={`${inputCls} w-auto`} value={client} onChange={e => setClient(e.target.value)}><option value="">All clients</option>{clients.filter(c => deps.some(d => d.client_id === c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}>
    <p className="mb-3 text-xs text-muted-foreground">Enter days present for {monthLabel(md)} and send to the client. The client approves or disputes in their portal; approved timesheets are locked and used for the invoice and payroll.</p>
    {!list.length ? <Empty>No staff working in this month.</Empty> : <Table head={['Worker', 'Working days', 'Present', 'OT hours', 'Bill (est.)', 'Status', '']}>{list.map(d => {
      const t = ts.find(x => x.deployment_id === d.id && x.month.startsWith(month)); const locked = t && ['client_approved', 'invoiced'].includes(t.status);
      const e = v[d.id] ?? { working: String(t?.working_days ?? 26), present: String(t?.present_days ?? ''), ot: String(t?.ot_hours ?? 0) };
      const s = (k: keyof typeof e) => (ev: { target: { value: string } }) => setV({ ...v, [d.id]: { ...e, [k]: ev.target.value } });
      return <tr key={d.id}><Td><b>{d.worker_name}</b><div className="text-xs text-muted-foreground">{d.worker_code} · {clientName(clients, d.client_id)}</div></Td>
        <Td><input aria-label="Working days" className={`${inputCls} w-20`} type="number" min="1" max="31" disabled={!!locked} value={e.working} onChange={s('working')} /></Td>
        <Td><input aria-label="Present days" className={`${inputCls} w-20`} type="number" min="0" step="0.5" disabled={!!locked} value={e.present} onChange={s('present')} /></Td>
        <Td><input aria-label="OT hours" className={`${inputCls} w-20`} type="number" min="0" max="400" disabled={!!locked} value={e.ot} onChange={s('ot')} /></Td>
        <Td className="tabular-nums">{inr(billAmount(d.billing_rate, Number(e.present) || 0, Number(e.working) || 0, Number(e.ot) || 0, d.ot_rate))}</Td>
        <Td>{t ? <><Pill tone={tone(t.status)}>{lbl(timesheetStatusLabels, t.status)}</Pill>{t.client_note && <p className="mt-1 max-w-48 text-xs">{t.client_note}</p>}</> : <span className="text-xs text-muted-foreground">Not sent</span>}</Td>
        <Td>{!locked && <Button size="sm" disabled={a.busy} onClick={() => void a.run(async () => {
          const working = Number(e.working), present = Number(e.present), ot = Number(e.ot) || 0;
          if (!(working >= 1 && working <= 31)) throw new Error('Working days must be 1–31.'); if (!(present >= 0 && present <= working) || e.present === '') throw new Error('Present days must be between 0 and working days.');
          if (t) must(await supabase.from('manpower_timesheets').update({ working_days: working, present_days: present, ot_hours: ot, status: 'submitted' }).eq('id', t.id));
          else must(await supabase.from('manpower_timesheets').insert({ deployment_id: d.id, client_id: d.client_id, month: md, working_days: working, present_days: present, ot_hours: ot }));
        }, 'Timesheet sent to the client for approval.')}>{t ? 'Resend' : 'Send'}</Button>}</Td></tr>;
    })}</Table>}<Status a={a} /></Panel>;
}

function Payroll({ clients, deps, ts }: Ctx) {
  const [month, setMonth] = useState(thisMonth());
  const rows = ts.filter(t => t.month.startsWith(month)).map(t => { const d = deps.find(x => x.id === t.deployment_id)!; return d && { t, d, p: payrollLine({ salary: d.monthly_salary, presentDays: t.present_days, workingDays: t.working_days, pf: d.pf_applicable, esic: d.esic_applicable }) }; }).filter(Boolean) as { t: Ctx['ts'][number]; d: MpDeployment; p: ReturnType<typeof payrollLine> }[];
  const sum = (k: keyof ReturnType<typeof payrollLine>) => rows.reduce((n, r) => n + r.p[k], 0);
  const head = ['Code', 'Worker', 'Client', 'Present / working', 'Monthly salary', 'Earned gross', 'PF (employee)', 'ESIC (employee)', 'Net pay', 'PF (employer)', 'ESIC (employer)', 'Cost to company', 'Timesheet'];
  return <Panel title="Payroll register" actions={<div className="flex gap-2"><input type="month" aria-label="Month" className={`${inputCls} w-auto`} value={month} onChange={e => setMonth(e.target.value || thisMonth())} /><Button size="sm" variant="outline" disabled={!rows.length} onClick={() => csv(`manpower-payroll-${month}.csv`, [head, ...rows.map(r => [r.d.worker_code, r.d.worker_name, clientName(clients, r.d.client_id), `${r.t.present_days}/${r.t.working_days}`, r.d.monthly_salary, r.p.earned, r.p.pfEmployee, r.p.esicEmployee, r.p.netPay, r.p.pfEmployer, r.p.esicEmployer, r.p.employerCost, r.t.status])])}><Download className="size-3.5" />Export</Button></div>}>
    <p className="mb-3 text-xs text-muted-foreground">Earned gross = monthly salary × present ÷ working days. PF 12% on earned wages up to ₹15,000; ESIC 0.75% (employee) and 3.25% (employer) when salary is ₹21,000 or less. These are standard rates — have your accountant confirm before paying salaries or filing returns.</p>
    {!rows.length ? <Empty>No timesheets for {monthLabel(monthDate(month))}.</Empty> : <><Table head={['Worker', 'Days', 'Earned', 'PF / ESIC (emp.)', 'Net pay', 'Employer PF / ESIC', 'Cost', '']}>{rows.map(r => <tr key={r.t.id}><Td><b>{r.d.worker_name}</b><div className="text-xs text-muted-foreground">{r.d.worker_code} · {clientName(clients, r.d.client_id)}</div></Td><Td>{r.t.present_days}/{r.t.working_days}</Td><Td className="tabular-nums">{inr(r.p.earned)}</Td><Td className="tabular-nums text-xs">{inr(r.p.pfEmployee)} / {inr(r.p.esicEmployee)}</Td><Td className="tabular-nums font-semibold">{inr(r.p.netPay)}</Td><Td className="tabular-nums text-xs">{inr(r.p.pfEmployer)} / {inr(r.p.esicEmployer)}</Td><Td className="tabular-nums">{inr(r.p.employerCost)}</Td><Td>{r.t.status === 'submitted' || r.t.status === 'disputed' ? <Pill tone="warning">Not approved yet</Pill> : null}</Td></tr>)}</Table>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">{[['Earned gross', sum('earned')], ['Net pay', sum('netPay')], ['PF total', sum('pfEmployee') + sum('pfEmployer')], ['ESIC total', sum('esicEmployee') + sum('esicEmployer')], ['Cost to company', sum('employerCost')]].map(([k, v]) => <div key={String(k)} className="rounded-lg border border-border p-3"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="font-semibold tabular-nums">{inr(Number(v))}</dd></div>)}</dl></>}
  </Panel>;
}

function Invoices({ clients, ts, inv, deps }: Ctx) {
  const a = useAct(); const la = useAct(); const [g, setG] = useState({ client: '', month: thisMonth(), fee: '' }); const [note, setNote] = useState<Record<string, string>>({}); const [open, setOpen] = useState('');
  const approved = ts.filter(t => t.client_id === g.client && t.month.startsWith(g.month) && t.status === 'client_approved');
  const pending = ts.filter(t => t.client_id === g.client && t.month.startsWith(g.month) && ['submitted', 'disputed'].includes(t.status)).length;
  const sub = approved.reduce((n, t) => { const d = deps.find(x => x.id === t.deployment_id); return n + (d ? billAmount(d.billing_rate, t.present_days, t.working_days, t.ot_hours, d.ot_rate) : 0); }, 0);
  const pre = invoiceTotals(sub, Number(g.fee) || 0);
  return <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
    <Panel title="Generate monthly invoice"><div className="grid gap-3 sm:grid-cols-3">
      <Field label="Client"><select className={inputCls} value={g.client} onChange={e => setG({ ...g, client: e.target.value })}><option value="">Choose…</option>{clients.filter(c => deps.some(d => d.client_id === c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Month"><input type="month" className={inputCls} value={g.month} onChange={e => setG({ ...g, month: e.target.value || thisMonth() })} /></Field>
      <Field label="Service fee % (agreed with client)"><input type="number" min="0" max="100" step="0.01" className={inputCls} value={g.fee} onChange={e => setG({ ...g, fee: e.target.value })} placeholder="e.g. 8" /></Field></div>
      {g.client && <p className="mt-3 text-sm">{approved.length} approved timesheet{approved.length === 1 ? '' : 's'}{pending ? ` · ${pending} still waiting for client` : ''} · Subtotal {inr(pre.subtotal)} + fee {inr(pre.fee)} + GST 18% {inr(pre.gst)} = <b>{inr(pre.total)}</b></p>}
      <Button className="mt-3" disabled={a.busy || !g.client || g.fee === ''} onClick={() => void a.run(async () => { const no = must(await supabase.rpc('manpower_generate_invoice', { _client: g.client, _month: monthDate(g.month), _fee_percent: Number(g.fee) })); setNote({ ...note, last: String(no) }); }, 'Invoice generated. Accounts/Finance confirm the payment when the client pays.')}>Generate invoice</Button><Status a={a} /></Panel>
    <InvoiceList inv={inv} clients={clients} note={note} setNote={setNote} open={open} setOpen={setOpen} a={la} staff />
  </div>;
}

function InvoiceList({ inv, clients, note, setNote, open, setOpen, a, staff, finance }: { inv: MpInvoice[]; clients: Client[]; note: Record<string, string>; setNote: (n: Record<string, string>) => void; open: string; setOpen: (s: string) => void; a: ReturnType<typeof useAct>; staff?: boolean; finance?: boolean }) {
  return <Panel title="Manpower invoices">{!inv.length ? <Empty>No invoices yet.</Empty> : <Table head={['Invoice', 'Client · month', 'Total', 'Status', '']}>{inv.map(i => <tr key={i.id} className="align-top"><Td><button type="button" className="font-mono text-xs font-semibold hover:text-primary" onClick={() => setOpen(open === i.id ? '' : i.id)}>{i.invoice_no}</button>
    {open === i.id && <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{i.lines.map(l => <li key={l.timesheet_id}>{l.worker_code} {l.worker_name}: {l.present_days}/{l.working_days} days{l.ot_hours ? ` + ${l.ot_hours}h OT` : ''} = {inr(l.amount)}</li>)}<li>Fee {i.service_fee_percent}%: {inr(i.service_fee)} · GST {i.gst_percent}%: {inr(i.gst)}</li></ul>}</Td>
    <Td>{clientName(clients, i.client_id) !== '—' ? clientName(clients, i.client_id) : i.client_name || '—'}<div className="text-xs text-muted-foreground">{monthLabel(i.month)}</div></Td><Td className="tabular-nums font-semibold">{inr(i.total)}</Td>
    <Td><Pill tone={tone(i.status)}>{lbl(invoiceStatusLabels, i.status)}</Pill>{i.paid_reference && <p className="mt-1 text-xs">Ref {i.paid_reference}</p>}{i.cancel_reason && <p className="mt-1 text-xs">{i.cancel_reason}</p>}</Td>
    <Td><div className="flex flex-wrap items-center gap-1"><Button size="sm" variant="ghost" onClick={() => printInvoice(i, clientName(clients, i.client_id) !== '—' ? clientName(clients, i.client_id) : i.client_name)}><Printer className="size-3.5" />Print</Button>
      {i.status === 'issued' && (staff || finance) && <><input className={`${inputCls} h-8 w-40 text-xs`} placeholder={finance ? 'UTR / reference' : 'Cancel reason'} value={note[i.id] ?? ''} onChange={e => setNote({ ...note, [i.id]: e.target.value })} />
        {finance && <Button size="sm" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.rpc('manpower_invoice_action', { _id: i.id, _action: 'paid', _note: note[i.id] ?? '' })), 'Payment confirmed.')}>Mark paid</Button>}
        {staff && <Button size="sm" variant="outline" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.rpc('manpower_invoice_action', { _id: i.id, _action: 'cancel', _note: note[i.id] ?? '' })), 'Invoice cancelled; its timesheets are free to invoice again.')}>Cancel</Button>}</>}</div></Td></tr>)}</Table>}<Status a={a} /></Panel>;
}

/** Accounts / Finance: confirm manpower invoice payments (the person who raised an invoice cannot confirm it). */
export function FinanceManpowerInvoices() {
  const inv = useMpInvoices(); const clients = useClients(); const a = useAct(); const [note, setNote] = useState<Record<string, string>>({}); const [open, setOpen] = useState('');
  if (inv.isPending) return <Loading />; if (inv.error) return <ErrorNote error={inv.error} />;
  return <InvoiceList inv={inv.data ?? []} clients={clients.data ?? []} note={note} setNote={setNote} open={open} setOpen={setOpen} a={a} finance />;
}

function Reports({ clients, reqs, deps, inv, cands }: Ctx) {
  const rows = useMemo(() => clients.filter(c => reqs.some(r => r.client_id === c.id) || deps.some(d => d.client_id === c.id)).map(c => {
    const r = reqs.filter(x => x.client_id === c.id); const d = deps.filter(x => x.client_id === c.id); const fr = fillRate(r);
    const fills = r.map(x => { const first = d.filter(y => y.requirement_id === x.id).map(y => y.start_date).sort()[0]; return first ? (new Date(first).getTime() - new Date(x.created_at).getTime()) / 864e5 : null; }).filter((n): n is number => n != null && n >= 0);
    const left = d.filter(x => ['exited', 'replaced'].includes(x.status)).length;
    const i = inv.filter(x => x.client_id === c.id && x.status !== 'cancelled');
    return { name: c.name, open: fr.need - fr.got, fill: fr.percent, active: d.filter(x => ['active', 'replacement_requested'].includes(x.status)).length, ttf: fills.length ? Math.round(fills.reduce((n, x) => n + x, 0) / fills.length) : null, attrition: d.length ? Math.round(left / d.length * 100) : 0, replacements: d.filter(x => x.status === 'replacement_requested' || x.replaced_by).length, billed: i.reduce((n, x) => n + Number(x.total), 0), due: i.filter(x => x.status === 'issued').reduce((n, x) => n + Number(x.total), 0), margin: d.filter(x => x.status === 'active').reduce((n, x) => n + x.billing_rate - x.monthly_salary, 0), shared: cands.filter(x => x.client_id === c.id && !['sourced', 'screened'].includes(x.stage)).length };
  }), [clients, reqs, deps, inv, cands]);
  const head = ['Client', 'Open positions', 'Fill rate %', 'Active staff', 'Avg days to fill', 'Attrition %', 'Replacements', 'Profiles shared', 'Billed', 'Outstanding', 'Monthly gross margin'];
  return <Panel title="Client-wise manpower report" actions={<Button size="sm" variant="outline" disabled={!rows.length} onClick={() => csv('manpower-report.csv', [head, ...rows.map(r => [r.name, r.open, r.fill, r.active, r.ttf ?? '', r.attrition, r.replacements, r.shared, r.billed, r.due, r.margin])])}><Download className="size-3.5" />Export</Button>}>
    {!rows.length ? <Empty>No manpower clients yet.</Empty> : <Table head={['Client', 'Open', 'Fill rate', 'Active', 'Days to fill', 'Attrition', 'Billed · due', 'Margin / month']}>{rows.map(r => <tr key={r.name}><Td><b>{r.name}</b><div className="text-xs text-muted-foreground">{r.shared} profiles shared · {r.replacements} replacements</div></Td><Td>{r.open}</Td><Td>{r.fill}%</Td><Td>{r.active}</Td><Td>{r.ttf ?? '—'}</Td><Td>{r.attrition}%</Td><Td className="tabular-nums">{inr(r.billed)}<div className="text-xs text-muted-foreground">due {inr(r.due)}</div></Td><Td className="tabular-nums">{inr(r.margin)}</Td></tr>)}</Table>}
    <p className="mt-3 text-xs text-muted-foreground">Days to fill = days from posting a requirement to the first staff start date. Attrition = exited or replaced staff ÷ all staff ever deployed. Margin = billing rate − salary for active staff (before PF/ESIC and service fee).</p>
  </Panel>;
}

/* ------------------------------------ Client portal ------------------------------------ */
type ClientCand = { id: string; requirement_id: string; role_title: string; full_name: string; skills: string; experience_years: number | null; location: string; stage: string; interview_at: string | null; client_feedback: string };
type ClientDep = { id: string; worker_code: string; worker_name: string; designation: string; role_title: string | null; start_date: string; end_date: string | null; status: string; billing_rate: number; replacement_reason: string };

/** Client side: post requirements, review shortlisted profiles, see deployed staff, approve attendance, view invoices. */
export function ClientManpower({ client }: { client: Client }) {
  const reqs = useManpower(); const ts = useMpTimesheets(); const inv = useMpInvoices(); const a = useAct(); const ca = useAct(); const da = useAct();
  const cands = useQuery({ queryKey: ['ventures', 'mp-client-cands'], queryFn: async () => must(await supabase.rpc('manpower_client_candidates')) as ClientCand[] });
  const deps = useQuery({ queryKey: ['ventures', 'mp-client-deps'], queryFn: async () => must(await supabase.rpc('manpower_client_deployments')) as ClientDep[] });
  const [fb, setFb] = useState<Record<string, { text: string; at: string }>>({}); const [why, setWhy] = useState<Record<string, string>>({}); const [tsNote, setTsNote] = useState<Record<string, string>>({}); const [open, setOpen] = useState('');
  if (reqs.isPending || cands.isPending || deps.isPending || ts.isPending || inv.isPending) return <Loading />;
  const mine = (reqs.data ?? []).filter(x => x.client_id === client.id);
  const pendingTs = (ts.data ?? []).filter(t => t.client_id === client.id);
  const workerFor = (id: string) => (deps.data ?? []).find(d => d.id === id);
  return <div className="grid min-w-0 gap-5 [&>*]:min-w-0">
    <Panel title="Post a manpower requirement"><RequirementForm fixedClient={client.id} /></Panel>
    <Panel title="My requirements">{!mine.length ? <Empty>None yet.</Empty> : <div className="grid gap-2">{mine.map(x => <div key={x.id} className="rounded-md border border-border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span><b>{x.role_title}</b> · {x.filled}/{x.headcount} filled{x.needed_by ? ` · needed by ${date(x.needed_by)}` : ''}</span><Pill tone={tone(x.status)}>{lbl(manpowerStatusLabels, x.status)}</Pill></div>{x.update_note && <p className="mt-1 text-xs">RILOYD update: {x.update_note}</p>}</div>)}</div>}</Panel>
    <Panel title="Shortlisted candidates">{cands.error ? <ErrorNote error={cands.error} /> : !cands.data?.length ? <Empty>RILOYD will share matching profiles here.</Empty> : <div className="grid gap-3 md:grid-cols-2">{cands.data.map(c => { const f = fb[c.id] ?? { text: '', at: '' }; const decide = ['shared', 'client_interview'].includes(c.stage);
      return <article key={c.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-start justify-between gap-2"><div><b>{c.full_name}</b><p className="text-xs text-muted-foreground">{c.role_title} · {c.experience_years ?? '?'} yrs · {c.location || '—'}</p></div><Pill tone={tone(c.stage)}>{lbl(candidateStageLabels, c.stage)}</Pill></div>
        {c.skills && <p className="mt-1 text-xs">{c.skills}</p>}{c.interview_at && <p className="mt-1 text-xs">Interview: {new Date(c.interview_at).toLocaleString('en-IN')}</p>}{c.client_feedback && <p className="mt-1 text-xs">Your feedback: {c.client_feedback}</p>}
        {decide && <div className="mt-2 grid gap-2"><input className={inputCls} placeholder="Feedback (required to reject)" value={f.text} onChange={e => setFb({ ...fb, [c.id]: { ...f, text: e.target.value } })} />
          <div className="flex flex-wrap items-center gap-2">{c.stage === 'shared' && <><input type="datetime-local" aria-label="Interview time" className={`${inputCls} w-auto`} value={f.at} onChange={e => setFb({ ...fb, [c.id]: { ...f, at: e.target.value } })} /><Button size="sm" variant="outline" disabled={ca.busy} onClick={() => void ca.run(async () => must(await supabase.rpc('manpower_client_decide', { _id: c.id, _decision: 'client_interview', _feedback: f.text, ...(f.at ? { _interview_at: new Date(f.at).toISOString() } : {}) })), 'Interview scheduled.')}>Schedule interview</Button></>}
            <Button size="sm" disabled={ca.busy} onClick={() => void ca.run(async () => must(await supabase.rpc('manpower_client_decide', { _id: c.id, _decision: 'selected', _feedback: f.text })), 'Selected — RILOYD will arrange joining.')}>Select</Button>
            <Button size="sm" variant="outline" disabled={ca.busy} onClick={() => void ca.run(async () => must(await supabase.rpc('manpower_client_decide', { _id: c.id, _decision: 'rejected', _feedback: f.text })), 'Feedback sent.')}>Reject</Button></div></div>}
      </article>; })}</div>}<Status a={ca} /></Panel>
    <Panel title="My deployed staff">{!deps.data?.length ? <Empty>No staff deployed yet.</Empty> : <Table head={['Staff', 'Role', 'Since', 'Monthly rate', 'Status', '']}>{deps.data.map(d => <tr key={d.id}><Td><b>{d.worker_name}</b><div className="font-mono text-xs text-muted-foreground">{d.worker_code}</div></Td><Td>{d.designation || d.role_title || '—'}</Td><Td>{date(d.start_date)}{d.end_date ? ` – ${date(d.end_date)}` : ''}</Td><Td className="tabular-nums">{inr(d.billing_rate)}</Td><Td><Pill tone={tone(d.status)}>{lbl(deploymentStatusLabels, d.status)}</Pill>{d.replacement_reason && d.status === 'replacement_requested' && <p className="mt-1 text-xs">{d.replacement_reason}</p>}</Td>
      <Td>{d.status === 'active' && <div className="flex gap-1"><input className={`${inputCls} h-8 w-44 text-xs`} placeholder="Why replace?" value={why[d.id] ?? ''} onChange={e => setWhy({ ...why, [d.id]: e.target.value })} /><Button size="sm" variant="outline" disabled={da.busy} onClick={() => void da.run(async () => must(await supabase.rpc('manpower_request_replacement', { _id: d.id, _reason: why[d.id] ?? '' })), 'Replacement requested. RILOYD will share new profiles.')}>Request replacement</Button></div>}</Td></tr>)}</Table>}<Status a={da} /></Panel>
    <Panel title="Attendance to approve">{!pendingTs.length ? <Empty>No timesheets yet.</Empty> : <Table head={['Month', 'Staff', 'Present / working', 'OT hours', 'Status', '']}>{pendingTs.map(t => { const w = workerFor(t.deployment_id); return <tr key={t.id}><Td>{monthLabel(t.month)}</Td><Td>{w?.worker_name ?? '—'}<div className="font-mono text-xs text-muted-foreground">{w?.worker_code}</div></Td><Td>{t.present_days}/{t.working_days}</Td><Td>{t.ot_hours}</Td><Td><Pill tone={tone(t.status)}>{lbl(timesheetStatusLabels, t.status)}</Pill>{t.client_note && <p className="mt-1 text-xs">{t.client_note}</p>}</Td>
      <Td>{t.status === 'submitted' && <div className="flex flex-wrap gap-1"><Button size="sm" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.rpc('manpower_client_timesheet', { _id: t.id, _approve: true, _note: '' })), 'Attendance approved.')}>Approve</Button><input className={`${inputCls} h-8 w-40 text-xs`} placeholder="What is wrong?" value={tsNote[t.id] ?? ''} onChange={e => setTsNote({ ...tsNote, [t.id]: e.target.value })} /><Button size="sm" variant="outline" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.rpc('manpower_client_timesheet', { _id: t.id, _approve: false, _note: tsNote[t.id] ?? '' })), 'Dispute sent to RILOYD.')}>Dispute</Button></div>}</Td></tr>; })}</Table>}<Status a={a} /></Panel>
    <Panel title="Invoices">{!(inv.data ?? []).filter(i => i.client_id === client.id).length ? <Empty>No invoices yet.</Empty> : <Table head={['Invoice', 'Month', 'Total', 'Status', '']}>{(inv.data ?? []).filter(i => i.client_id === client.id).map(i => <tr key={i.id} className="align-top"><Td><button type="button" className="font-mono text-xs font-semibold" onClick={() => setOpen(open === i.id ? '' : i.id)}>{i.invoice_no}</button>{open === i.id && <ul className="mt-1 text-xs text-muted-foreground">{i.lines.map(l => <li key={l.timesheet_id}>{l.worker_name}: {inr(l.amount)}</li>)}</ul>}</Td><Td>{monthLabel(i.month)}</Td><Td className="tabular-nums font-semibold">{inr(i.total)}</Td><Td><Pill tone={tone(i.status)}>{lbl(invoiceStatusLabels, i.status)}</Pill></Td><Td><Button size="sm" variant="ghost" onClick={() => printInvoice(i, client.name)}><Printer className="size-3.5" />Print</Button></Td></tr>)}</Table>}</Panel>
  </div>;
}
