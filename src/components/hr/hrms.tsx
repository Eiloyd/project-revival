import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { fillTemplate } from '@/lib/hr/payroll';
import cardLogo from '@/assets/local/riloyd-logo-dark.png.optimized.webp';
import { MyRoster } from '@/components/hr/roster';

export const inr = (n: number | null | undefined) => n === null || n === undefined ? '—' : `₹${Number(n).toLocaleString('en-IN')}`;
export const thisMonth = () => new Date().toISOString().slice(0, 7);
export type Master = { user_id: string; employee_code: string; full_name: string; designation: string; department: string; joining_date: string | null; employment_type: string; work_location: string; shift: string; reporting_manager: string | null; status: string; emergency_contact: string; pan_last4: string; bank_last4: string; employee_record_id: string | null };

export function useAction() {
  const qc = useQueryClient(); const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [notice, setNotice] = useState('');
  const run = async (fn: () => Promise<unknown>, msg = 'Saved.') => { setBusy(true); setError(null); setNotice(''); try { await fn(); setNotice(msg); await qc.invalidateQueries({ queryKey: ['hrms'] }); } catch (e) { setError(e); } finally { setBusy(false); } };
  const Status = () => <><ErrorNote error={error} />{notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}</>;
  return { busy, run, Status };
}
export const must = <T,>(r: { data: T | null; error: unknown }) => { if (r.error) throw r.error; return r.data as T; };
export function useMasters() { return useQuery({ queryKey: ['hrms', 'master'], queryFn: async () => must(await supabase.from('hr_employee_master').select('*').order('full_name')) as Master[] }); }
/** People HR can add to the master: active CRM members and department staff. */
function usePeople() { return useQuery({ queryKey: ['hrms', 'people'], queryFn: async () => must(await supabase.rpc('hr_people_overview', { _month: `${thisMonth()}-01` })) as { user_id: string; full_name: string; employee_code: string | null; designation: string | null; monthly_gross: number | null }[] }); }

export function EmployeeMaster() {
  const masters = useMasters(); const people = usePeople(); const a = useAction();
  const blank = { user_id: '', employee_code: '', full_name: '', designation: '', department: '', joining_date: '', employment_type: 'full_time', work_location: '', shift: 'General (10:00-18:30)', status: 'active', emergency_contact: '', pan_last4: '', bank_last4: '' };
  const [f, setF] = useState(blank);
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const pick = (uid: string) => { const m = masters.data?.find(x => x.user_id === uid); const p = people.data?.find(x => x.user_id === uid);
    setF(m ? { ...blank, ...Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v ?? ''])) } as typeof blank : { ...blank, user_id: uid, full_name: p?.full_name ?? '', employee_code: p?.employee_code ?? '', designation: p?.designation ?? '' }); };
  const save = () => a.run(async () => { if (!f.user_id || !f.employee_code.trim() || !f.full_name.trim()) throw new Error('Choose a person and enter code and name.');
    must(await supabase.from('hr_employee_master').upsert({ ...f, joining_date: f.joining_date || null, updated_at: new Date().toISOString() })); setF(blank); }, 'Employee record saved.');
  return <div className="grid gap-5">
    <Panel title="Add or edit employee">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Person"><select className={inputCls} value={f.user_id} onChange={e => pick(e.target.value)}><option value="">Choose…</option>{people.data?.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}</select></Field>
        <Field label="Employee code"><input className={inputCls} value={f.employee_code} onChange={set('employee_code')} /></Field>
        <Field label="Full name"><input className={inputCls} value={f.full_name} onChange={set('full_name')} /></Field>
        <Field label="Designation"><input className={inputCls} value={f.designation} onChange={set('designation')} /></Field>
        <Field label="Department"><input className={inputCls} value={f.department} onChange={set('department')} /></Field>
        <Field label="Joining date"><input type="date" className={inputCls} value={f.joining_date} onChange={set('joining_date')} /></Field>
        <Field label="Employment type"><select className={inputCls} value={f.employment_type} onChange={set('employment_type')}>{['full_time', 'part_time', 'intern', 'contract'].map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}</select></Field>
        <Field label="Work location"><input className={inputCls} value={f.work_location} onChange={set('work_location')} /></Field>
        <Field label="Shift / roster"><input className={inputCls} value={f.shift} onChange={set('shift')} /></Field>
        <Field label="Status"><select className={inputCls} value={f.status} onChange={set('status')}>{['active', 'probation', 'notice', 'exited'].map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Emergency contact"><input className={inputCls} value={f.emergency_contact} onChange={set('emergency_contact')} /></Field>
        <Field label="PAN (last 4 only)"><input className={inputCls} maxLength={4} value={f.pan_last4} onChange={set('pan_last4')} /></Field>
        <Field label="Bank account (last 4 only)"><input className={inputCls} maxLength={4} inputMode="numeric" value={f.bank_last4} onChange={set('bank_last4')} /></Field>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Only the last 4 digits of PAN and bank account are stored here, so full numbers never sit in the HR list.</p>
      <div className="mt-3 flex gap-2"><Button disabled={a.busy} onClick={() => void save()}>Save employee</Button><Button variant="outline" onClick={() => setF(blank)}>Clear</Button></div><a.Status />
    </Panel>
    <Panel title="Employee master">
      <ErrorNote error={masters.error} />{masters.isPending ? <Loading /> : !masters.data?.length ? <Empty>No employees in the master yet.</Empty> :
        <Table head={['Code', 'Name', 'Designation', 'Department', 'Joining', 'Shift', 'Status', '']}>{masters.data.map(m => <tr key={m.user_id} className="border-b border-border">
          <Td>{m.employee_code}</Td><Td>{m.full_name}</Td><Td>{m.designation}</Td><Td>{m.department}</Td><Td>{m.joining_date ?? '—'}</Td><Td>{m.shift}</Td><Td><Pill tone={m.status === 'exited' ? 'danger' : m.status === 'notice' ? 'warning' : 'success'}>{m.status}</Pill></Td>
          <Td><Button size="sm" variant="outline" onClick={() => pick(m.user_id)}>Edit</Button></Td></tr>)}</Table>}
    </Panel>
  </div>;
}

type Slip = { id: string; user_id: string; month: string; gross: number; basic: number; hra: number; allowances: number; deductions: number; lop_days: number; lop_amount: number; incentive: number; reimbursement: number; advance_recovery: number; net: number; status: string; paid_ref: string };
type Item = { id: string; payslip_id: string; kind: string; amount: number; label: string };
export function Payroll() {
  const [month, setMonth] = useState(thisMonth()); const a = useAction(); const masters = useMasters();
  const slips = useQuery({ queryKey: ['hrms', 'slips', month], queryFn: async () => must(await supabase.from('hr_payslips').select('*').eq('month', `${month}-01`)) as Slip[] });
  const name = (uid: string) => masters.data?.find(m => m.user_id === uid)?.full_name ?? 'Employee';
  const upd = (id: string, patch: Partial<Slip>) => a.run(async () => { must(await supabase.from('hr_payslips').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)); });
  const items = useQuery({ queryKey: ['hrms', 'items', month, slips.data?.map(s => s.id).join()], enabled: !!slips.data?.length, queryFn: async () => must(await supabase.from('hr_payslip_items').select('id,payslip_id,kind,amount,label').in('payslip_id', slips.data!.map(s => s.id))) as Item[] });
  const lines = (id: string) => (items.data ?? []).filter(i => i.payslip_id === id);
  const total = (slips.data ?? []).reduce((n, s) => n + Number(s.net), 0);
  return <Panel title="Monthly payroll & payslips" actions={<><input aria-label="Month" type="month" className={inputCls} value={month} onChange={e => setMonth(e.target.value)} />
    <Button disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.rpc('hr_generate_payroll', { _month: `${month}-01` })), 'Payroll generated from salary structures, attendance, approved reimbursements and advance recovery plans.')}>Generate payroll</Button></>}>
    <p className="mb-3 text-sm text-muted-foreground">Loss of pay = monthly gross ÷ 30 for each absent day (half day counts 0.5). Fully approved reimbursement / expense requests are added to the salary, and salary advance instalments are deducted. No PF, ESI or TDS is deducted. Draft slips can be regenerated; approved slips become visible to the employee; marking a slip paid also marks its reimbursements paid.</p>
    <a.Status /><ErrorNote error={slips.error} />
    {slips.isPending ? <Loading /> : !slips.data?.length ? <Empty>No payslips for this month. Set salaries under "Salary, incentive & attendance", then generate.</Empty> : <>
      <p className="mb-2 text-sm font-semibold">Total net payable: {inr(total)}</p>
      <Table head={['Employee', 'Gross', 'Deductions', 'LOP', 'Incentive', 'Reimbursement', 'Advance recovery', 'Net', 'Status', '']}>{slips.data.map(s => <tr key={s.id} className="border-b border-border">
        <Td>{name(s.user_id)}</Td><Td>{inr(s.gross)}</Td><Td>{inr(s.deductions)}</Td><Td>{s.lop_days} d · {inr(s.lop_amount)}</Td>
        <Td>{s.status === 'draft' ? <input aria-label="Incentive" type="number" min="0" className={`${inputCls} w-24`} defaultValue={s.incentive} onBlur={e => { const v = Number(e.target.value) || 0; if (v !== Number(s.incentive)) void upd(s.id, { incentive: v, net: Math.max(0, Number(s.gross) - Number(s.deductions) - Number(s.lop_amount) + v + Number(s.reimbursement) - Number(s.advance_recovery)) }); }} /> : inr(s.incentive)}</Td>
        <Td>{inr(s.reimbursement)}{lines(s.id).filter(i => i.kind === 'reimbursement').map(i => <div key={i.id} className="text-xs text-muted-foreground">{i.label} · {inr(i.amount)}</div>)}</Td>
        <Td>{Number(s.advance_recovery) ? `− ${inr(s.advance_recovery)}` : inr(0)}</Td>
        <Td className="font-semibold">{inr(s.net)}</Td><Td><Pill tone={s.status === 'paid' ? 'success' : s.status === 'approved' ? 'warning' : 'muted'}>{s.status}</Pill></Td>
        <Td><div className="flex flex-wrap gap-1">{s.status === 'draft' && <Button size="sm" onClick={() => void upd(s.id, { status: 'approved' })}>Approve</Button>}
          {s.status === 'approved' && <Button size="sm" onClick={() => { const ref = prompt('Payment reference (UTR)'); if (ref) void upd(s.id, { status: 'paid', paid_ref: ref }); }}>Mark paid</Button>}
          <Button size="sm" variant="outline" onClick={() => void downloadPayslip(s, name(s.user_id), lines(s.id))}>PDF</Button></div></Td></tr>)}</Table></>}
  </Panel>;
}

type Adv = { id: string; user_id: string; request_id: string | null; amount: number; monthly_recovery: number; start_month: string; status: string; note: string; recovered: number; balance: number; created_at: string };
/** Salary advances recovered through payroll: plan from an approved request (or manual), balance and stop. */
export function Advances() {
  const a = useAction(); const masters = useMasters();
  const advs = useQuery({ queryKey: ['hrms', 'advances'], queryFn: async () => must(await supabase.rpc('hr_advance_balances')) as Adv[] });
  const reqs = useQuery({ queryKey: ['hrms', 'adv-reqs'], queryFn: async () => must(await supabase.from('requests').select('id,code,applicant_id,applicant_name,amount,status,created_at').eq('type', 'salary_advance').in('status', ['approved', 'paid']).order('created_at', { ascending: false })) as { id: string; code: string; applicant_id: string; applicant_name: string; amount: number; status: string }[] });
  const planned = new Set((advs.data ?? []).map(x => x.request_id));
  const waiting = (reqs.data ?? []).filter(r => !planned.has(r.id));
  const [f, setF] = useState({ request: '', user: '', amount: '', monthly: '', start: thisMonth(), note: '' });
  const req = waiting.find(r => r.id === f.request);
  const nm = (u: string) => masters.data?.find(m => m.user_id === u)?.full_name ?? reqs.data?.find(r => r.applicant_id === u)?.applicant_name ?? 'Employee';
  const amount = req ? Number(req.amount) : Number(f.amount) || 0; const monthly = Number(f.monthly) || 0;
  return <div className="grid gap-5">
    <Panel title="Recover a salary advance through payroll">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Approved advance request"><select className={inputCls} value={f.request} onChange={e => setF({ ...f, request: e.target.value })}><option value="">None — enter manually</option>{waiting.map(r => <option key={r.id} value={r.id}>{r.code} · {r.applicant_name} · {inr(r.amount)}</option>)}</select></Field>
        {!req && <><Field label="Employee"><select className={inputCls} value={f.user} onChange={e => setF({ ...f, user: e.target.value })}><option value="">Choose…</option>{masters.data?.filter(m => m.status !== 'exited').map(m => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select></Field>
          <Field label="Advance amount (₹)"><input type="number" min="1" className={inputCls} value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></Field></>}
        <Field label="Recover per month (₹)" hint={monthly > 0 && amount > 0 ? `About ${Math.ceil(amount / monthly)} month(s)` : undefined}><input type="number" min="1" className={inputCls} value={f.monthly} onChange={e => setF({ ...f, monthly: e.target.value })} /></Field>
        <Field label="Start recovering from"><input type="month" className={inputCls} value={f.start} onChange={e => setF({ ...f, start: e.target.value })} /></Field>
        <Field label="Note"><input className={inputCls} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></Field>
      </div>
      <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => { const user = req?.applicant_id ?? f.user; if (!user) throw new Error('Choose an employee or an approved request.');
        must(await supabase.rpc('hr_advance_plan', { _user: user, _amount: amount, _monthly: monthly, _start: `${f.start}-01`, ...(req ? { _request: req.id } : {}), _note: f.note })); setF({ request: '', user: '', amount: '', monthly: '', start: thisMonth(), note: '' }); }, 'Recovery plan saved. It is deducted when payroll is generated.')}>Save recovery plan</Button><a.Status />
    </Panel>
    <Panel title="Salary advances"><ErrorNote error={advs.error} />{advs.isPending ? <Loading /> : !advs.data?.length ? <Empty>No salary advances being recovered.</Empty> :
      <Table head={['Employee', 'Advance', 'Per month', 'From', 'Recovered', 'Balance', 'Status', '']}>{advs.data.map(x => <tr key={x.id} className="border-b border-border">
        <Td>{nm(x.user_id)}{x.note && <div className="text-xs text-muted-foreground">{x.note}</div>}</Td><Td>{inr(x.amount)}</Td><Td>{inr(x.monthly_recovery)}</Td><Td>{x.start_month.slice(0, 7)}</Td><Td>{inr(x.recovered)}</Td><Td className="font-semibold">{inr(x.balance)}</Td>
        <Td><Pill tone={x.status === 'active' ? 'warning' : x.status === 'closed' ? 'success' : 'muted'}>{x.status}</Pill></Td>
        <Td>{x.status === 'active' && <Button size="sm" variant="outline" onClick={() => { const r = prompt('Reason for stopping recovery'); if (r) void a.run(async () => must(await supabase.rpc('hr_advance_cancel', { _id: x.id, _reason: r })), 'Recovery stopped.'); }}>Stop</Button>}</Td></tr>)}</Table>}</Panel>
  </div>;
}

export async function downloadPayslip(s: Slip, name: string, items: Item[] = []) {
  const { jsPDF } = await import('jspdf'); const doc = new jsPDF();
  doc.setFontSize(16); doc.text('RILOYD — Payslip', 14, 18); doc.setFontSize(11);
  doc.text(`Employee: ${name}`, 14, 30); doc.text(`Month: ${s.month.slice(0, 7)}`, 14, 37);
  const rows: [string, number][] = [['Basic', s.basic], ['HRA', s.hra], ['Allowances', s.allowances], ['Gross', s.gross], ['Incentive', s.incentive],
    ...items.filter(i => i.kind === 'reimbursement').map(i => [`Reimbursement ${i.label}`.slice(0, 60), Number(i.amount)] as [string, number]),
    ...(Number(s.reimbursement) && !items.length ? [['Reimbursement', s.reimbursement] as [string, number]] : []),
    ['Deductions', -s.deductions], [`Loss of pay (${s.lop_days} days)`, -s.lop_amount], ...(Number(s.advance_recovery) ? [['Salary advance recovery', -s.advance_recovery] as [string, number]] : []), ['Net pay', s.net]];
  rows.forEach(([k, v], i) => { doc.text(k, 14, 50 + i * 8); doc.text(`Rs ${Number(v).toLocaleString('en-IN')}`, 140, 50 + i * 8); });
  const y = 58 + rows.length * 8;
  doc.text(`Status: ${s.status}${s.paid_ref ? ` · Ref ${s.paid_ref}` : ''}`, 14, y); doc.setFontSize(9); doc.text('System-generated payslip.', 14, y + 15);
  doc.save(`payslip-${s.month.slice(0, 7)}-${name.replace(/\W+/g, '-')}.pdf`);
}

type Tpl = { id: string; name: string; kind: string; body: string; active: boolean };
const STANDARD_TEMPLATES = [
  { name: 'Warning letter', kind: 'warning', body: 'Date: {{date}}\n\nDear {{name}} ({{employee_code}}),\n\nSubject: Warning\n\nThis letter is a formal warning regarding: {{reason}}.\n\nYou are advised to correct this immediately. Repeated instances may lead to further disciplinary action as per company policy.\n\nPlease acknowledge receipt of this letter.\n\nFor Rishishwar Industry Private Limited (RILOYD)\nHR Department' },
  { name: 'Probation confirmation letter', kind: 'probation', body: 'Date: {{date}}\n\nDear {{name}} ({{employee_code}}),\n\nWe are pleased to confirm that you have successfully completed your probation as {{designation}} in the {{department}} department. Your employment is confirmed with effect from {{date}} at a monthly gross salary of Rs {{salary}}.\n\nWe look forward to your continued contribution.\n\nFor Rishishwar Industry Private Limited (RILOYD)\nHR Department' },
];
/** Reference number shown on the letterhead, e.g. RIL/HR/WAR/2026/4821. */
export function letterRef(kind: string, now = new Date()) { return `RIL/HR/${kind.slice(0, 3).toUpperCase()}/${now.getFullYear()}/${String(now.getTime()).slice(-6)}`; }
export function Letters() {
  const a = useAction(); const masters = useMasters(); const people = usePeople();
  const tpls = useQuery({ queryKey: ['hrms', 'tpl'], queryFn: async () => must(await supabase.from('hr_letter_templates').select('*').order('name')) as Tpl[] });
  const issued = useQuery({ queryKey: ['hrms', 'letters'], queryFn: async () => must(await supabase.from('hr_letters').select('*').order('issued_at', { ascending: false }).limit(100)) as { id: string; user_id: string; kind: string; title: string; body: string; issued_at: string; ref_no: string | null }[] });
  const [edit, setEdit] = useState<Partial<Tpl>>({ kind: 'custom', name: '', body: '' }); const [tplId, setTplId] = useState(''); const [uid, setUid] = useState(''); const [draft, setDraft] = useState(''); const [reason, setReason] = useState('');
  const missing = STANDARD_TEMPLATES.filter(st => !tpls.data?.some(t => t.name === st.name));
  const preview = () => { const t = tpls.data?.find(x => x.id === tplId); const m = masters.data?.find(x => x.user_id === uid); const p = people.data?.find(x => x.user_id === uid);
    if (!t || !m) return setDraft(''); setDraft(fillTemplate(t.body, { ...m, name: m.full_name, gross: p?.monthly_gross?.toLocaleString('en-IN'), salary: p?.monthly_gross?.toLocaleString('en-IN'), reason: reason.trim() || '—', date: new Date().toLocaleDateString('en-IN') })); };
  const nm = (u: string) => masters.data?.find(m => m.user_id === u)?.full_name ?? 'Employee';
  return <div className="grid gap-5">
    <Panel title="Generate offer / appointment / custom letter">
      <div className="grid gap-3 sm:grid-cols-3"><Field label="Template"><select className={inputCls} value={tplId} onChange={e => setTplId(e.target.value)}><option value="">Choose…</option>{tpls.data?.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Employee (from master)"><select className={inputCls} value={uid} onChange={e => setUid(e.target.value)}><option value="">Choose…</option>{masters.data?.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select></Field>
        <Field label="Reason / note ({{reason}})"><input className={inputCls} value={reason} onChange={e => setReason(e.target.value)} placeholder="Needed for warning letters" /></Field>
        <div className="flex items-end"><Button variant="outline" onClick={preview}>Fill letter</Button></div></div>
      {missing.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">Standard templates not added yet: {missing.map(m => m.name).join(', ')}
        <Button size="sm" variant="outline" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.from('hr_letter_templates').insert(missing.map(m => ({ ...m, active: true })))), 'Standard templates added.')}>Add them</Button></div>}
      {draft && <><Field label="Letter (edit before issuing)"><textarea className={`${areaCls} min-h-64`} value={draft} onChange={e => setDraft(e.target.value)} /></Field>
        <div className="mt-2 flex gap-2"><Button disabled={a.busy} onClick={() => void a.run(async () => { const t = tpls.data!.find(x => x.id === tplId)!; if (t.kind === 'warning' && !reason.trim()) throw new Error('Write the reason for the warning.'); must(await supabase.from('hr_letters').insert({ user_id: uid, kind: t.kind, title: t.name, body: draft, ref_no: letterRef(t.kind) })); }, 'Letter issued — the employee can see it under My HR.')}>Issue letter</Button>
          <Button variant="outline" onClick={() => void letterPdf('Letter', draft)}>Download PDF</Button></div></>}
      <a.Status />
    </Panel>
    <Panel title="Letter template builder">
      <p className="mb-2 text-xs text-muted-foreground">{'Placeholders: {{name}} {{employee_code}} {{designation}} {{department}} {{joining_date}} {{shift}} {{gross}} {{salary}} {{reason}} {{date}}'}</p>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Template name"><input className={inputCls} value={edit.name ?? ''} onChange={e => setEdit({ ...edit, name: e.target.value })} /></Field>
        <Field label="Type"><select className={inputCls} value={edit.kind} onChange={e => setEdit({ ...edit, kind: e.target.value })}>{['offer', 'appointment', 'probation', 'warning', 'experience', 'relieving', 'custom'].map(k => <option key={k}>{k}</option>)}</select></Field></div>
      <Field label="Body"><textarea className={`${areaCls} min-h-48`} value={edit.body ?? ''} onChange={e => setEdit({ ...edit, body: e.target.value })} /></Field>
      <div className="mt-2 flex gap-2"><Button disabled={a.busy} onClick={() => void a.run(async () => { if (!edit.name?.trim() || !edit.body?.trim()) throw new Error('Name and body are required.');
        const row = { name: edit.name, kind: edit.kind!, body: edit.body, updated_at: new Date().toISOString() }; must(edit.id ? await supabase.from('hr_letter_templates').update(row).eq('id', edit.id) : await supabase.from('hr_letter_templates').insert(row)); setEdit({ kind: 'custom', name: '', body: '' }); }, 'Template saved.')}>{edit.id ? 'Update template' : 'Add template'}</Button>
        {edit.id && <Button variant="outline" onClick={() => setEdit({ kind: 'custom', name: '', body: '' })}>New</Button>}</div>
      <ul className="mt-4 grid gap-2 text-sm">{tpls.data?.map(t => <li key={t.id} className="flex items-center justify-between gap-2 border-b border-border pb-2"><span>{t.name} <Pill>{t.kind}</Pill>{!t.active && <Pill tone="danger">off</Pill>}</span>
        <span className="flex gap-1"><Button size="sm" variant="outline" onClick={() => setEdit(t)}>Edit</Button><Button size="sm" variant="outline" onClick={() => void a.run(async () => must(await supabase.from('hr_letter_templates').update({ active: !t.active }).eq('id', t.id)))}>{t.active ? 'Turn off' : 'Turn on'}</Button></span></li>)}</ul>
    </Panel>
    <Panel title="Issued letters">{issued.isPending ? <Loading /> : !issued.data?.length ? <Empty>No letters issued yet.</Empty> :
      <Table head={['Date', 'Ref no.', 'Employee', 'Letter', '']}>{issued.data.map(l => <tr key={l.id} className="border-b border-border"><Td>{new Date(l.issued_at).toLocaleDateString('en-IN')}</Td><Td className="text-xs">{l.ref_no ?? '—'}</Td><Td>{nm(l.user_id)}</Td><Td>{l.title}</Td><Td><Button size="sm" variant="outline" onClick={() => void letterPdf(l.title, l.body, l.ref_no)}>PDF</Button></Td></tr>)}</Table>}</Panel>
  </div>;
}
/** Official letterhead PDF: company header, reference number, watermark and signature box. */
export async function letterPdf(title: string, body: string, ref?: string | null) {
  const { jsPDF } = await import('jspdf'); const doc = new jsPDF();
  doc.setTextColor(235); doc.setFontSize(60); doc.text('RILOYD', 105, 170, { align: 'center', angle: 35 }); doc.setTextColor(0);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text('RISHISHWAR INDUSTRY PRIVATE LIMITED (RILOYD)', 14, 16);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text('riloyd.in', 14, 22); doc.setLineWidth(0.6); doc.line(14, 25, 196, 25);
  doc.setFontSize(10); doc.text(`Ref: ${ref ?? 'Draft — not issued'}`, 14, 32); doc.text(title, 196, 32, { align: 'right' });
  doc.setFontSize(11); const lines = doc.splitTextToSize(body.replace(/₹/g, 'Rs '), 180) as string[]; doc.text(lines, 14, 42);
  const y = Math.min(42 + lines.length * 5 + 12, 255); doc.rect(130, y, 66, 26); doc.setFontSize(9); doc.text('Authorised signatory', 133, y + 22);
  doc.text('This is a system-generated letter from RILOYD HR.', 14, 288); doc.save(`${title.replace(/\W+/g, '-')}.pdf`);
}

type Emp = { id: string; employee_id: string; full_name: string; photo_url: string | null; designation: string; department: string; status: string; card_status: string; card_reprints: number; joining_date: string | null; valid_until: string | null };
/** Loads any picture (WebP, JPEG, PNG) and re-encodes it as PNG so the PDF library can embed it; returns null when it cannot load. */
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const img = new Image(); img.crossOrigin = 'anonymous';
    await new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(new Error('image failed')); img.src = url; });
    const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const ctx = cv.getContext('2d'); if (!ctx || !cv.width) return null; ctx.drawImage(img, 0, 0); return cv.toDataURL('image/png');
  } catch { return null; }
}
/** Portrait CR80 card (54 × 86 mm), one page per employee. */
export async function idCardsPdf(list: Emp[], color: string, footer: string) {
  const [{ jsPDF }, QR] = await Promise.all([import('jspdf'), import('qrcode')]);
  const doc = new jsPDF({ unit: 'mm', format: [54, 86], orientation: 'portrait' }); const logo = await toDataUrl(cardLogo);
  for (const [i, e] of list.entries()) {
    if (i) doc.addPage([54, 86], 'portrait');
    doc.setFillColor(color); doc.rect(0, 0, 54, 18, 'F');
    if (logo) doc.addImage(logo, 'PNG', 12, 3, 30, 11); else { doc.setTextColor(255); doc.setFontSize(14); doc.text('RILOYD', 27, 11, { align: 'center' }); }
    const photo = e.photo_url ? await toDataUrl(e.photo_url) : null;
    doc.setDrawColor(color); doc.rect(16, 21, 22, 26);
    if (photo) doc.addImage(photo, 'PNG', 16, 21, 22, 26); else { doc.setTextColor(150); doc.setFontSize(7); doc.text('Photo', 27, 35, { align: 'center' }); }
    doc.setTextColor(20); doc.setFontSize(9.5); doc.text(doc.splitTextToSize(e.full_name, 48), 27, 52, { align: 'center' });
    doc.setFontSize(7); doc.text(e.designation, 27, 57, { align: 'center' }); doc.text(e.department, 27, 60.5, { align: 'center' });
    doc.text(`ID: ${e.employee_id}`, 4, 66); doc.text(`Joined: ${e.joining_date ?? '—'}`, 4, 69.5);
    const qr = await QR.toDataURL(`${window.location.origin}/team?verify=${encodeURIComponent(e.employee_id)}`, { margin: 0, width: 200 }); doc.addImage(qr, 'PNG', 36, 62, 14, 14);
    doc.setFillColor(color); doc.rect(0, 79, 54, 7, 'F'); doc.setTextColor(255); doc.setFontSize(5.5); doc.text(footer.slice(0, 60), 27, 83.5, { align: 'center' });
  }
  doc.save(list.length === 1 ? `id-card-${list[0]!.employee_id}.pdf` : `id-cards-${list.length}.pdf`);
}
export function IdCards() {
  const a = useAction(); const [sel, setSel] = useState<string[]>([]);
  const emps = useQuery({ queryKey: ['hrms', 'cards'], queryFn: async () => must(await supabase.from('employees').select('id,employee_id,full_name,photo_url,designation,department,status,card_status,card_reprints,joining_date,valid_until').order('full_name')) as Emp[] });
  const cfg = useQuery({ queryKey: ['hrms', 'cfg'], queryFn: async () => must(await supabase.from('hr_settings').select('*').maybeSingle()) as { card_color: string; card_footer: string } | null });
  const [color, setColor] = useState<string | null>(null); const [footer, setFooter] = useState<string | null>(null);
  const c = color ?? cfg.data?.card_color ?? '#B5121B'; const ft = footer ?? cfg.data?.card_footer ?? '';
  const active = (emps.data ?? []).filter(e => e.status === 'active' && e.card_status !== 'inactive');
  const setCard = (e: Emp, patch: Partial<Emp>) => a.run(async () => must(await supabase.from('employees').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', e.id)));
  const print = (list: Emp[]) => a.run(async () => { if (!list.length) throw new Error('Select at least one active employee.'); await idCardsPdf(list, c, ft);
    for (const e of list) must(await supabase.from('employees').update({ card_issued_at: new Date().toISOString() }).eq('id', e.id)); }, `${list.length} ID card(s) generated.`);
  return <div className="grid gap-5">
    <Panel title="ID card design (portrait)">
      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end"><Field label="Brand colour"><input type="color" className="h-9 w-20" value={c} onChange={e => setColor(e.target.value)} /></Field>
        <Field label="Footer text"><input className={inputCls} maxLength={60} value={ft} onChange={e => setFooter(e.target.value)} /></Field>
        <Button disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.from('hr_settings').update({ card_color: c, card_footer: ft, updated_at: new Date().toISOString() }).eq('id', true)), 'Design saved.')}>Save design</Button></div>
      <p className="mt-2 text-xs text-muted-foreground">Card shows RILOYD logo, photo, name, ID, designation, department, joining date and a QR code that opens the public verification page.</p>
    </Panel>
    <Panel title="Employee ID cards" actions={<><Button variant="outline" onClick={() => setSel(sel.length === active.length ? [] : active.map(e => e.id))}>{sel.length === active.length && sel.length ? 'Clear selection' : 'Select all active'}</Button>
      <Button disabled={a.busy || !sel.length} onClick={() => void print(active.filter(e => sel.includes(e.id)))}>Bulk generate ({sel.length})</Button></>}>
      <a.Status /><ErrorNote error={emps.error} />
      {emps.isPending ? <Loading /> : !emps.data?.length ? <Empty>No employee ID records yet. Admin adds them under Employees in the Admin dashboard.</Empty> :
        <Table head={['', 'ID', 'Name', 'Designation', 'Card', 'Reprints', 'Actions']}>{emps.data.map(e => <tr key={e.id} className="border-b border-border">
          <Td><input type="checkbox" aria-label={`Select ${e.full_name}`} disabled={!active.includes(e)} checked={sel.includes(e.id)} onChange={() => setSel(sel.includes(e.id) ? sel.filter(x => x !== e.id) : [...sel, e.id])} /></Td>
          <Td>{e.employee_id}</Td><Td>{e.full_name}</Td><Td>{e.designation}</Td><Td><Pill tone={e.card_status === 'inactive' || e.status !== 'active' ? 'danger' : 'success'}>{e.status !== 'active' ? 'inactive' : e.card_status}</Pill></Td><Td>{e.card_reprints}</Td>
          <Td><div className="flex flex-wrap gap-1">{active.includes(e) && <><Button size="sm" variant="outline" onClick={() => void print([e])}>PDF</Button>
            <Button size="sm" variant="outline" onClick={() => void setCard(e, { card_status: 'reprint', card_reprints: e.card_reprints + 1 })}>Reprint</Button>
            <Button size="sm" variant="outline" onClick={() => void setCard(e, { card_status: 'replaced', card_reprints: e.card_reprints + 1 })}>Replace</Button>
            <Button size="sm" variant="outline" onClick={() => void setCard(e, { card_status: 'inactive' })}>Deactivate</Button></>}
            {!active.includes(e) && e.status === 'active' && <Button size="sm" variant="outline" onClick={() => void setCard(e, { card_status: 'active' })}>Reactivate</Button>}</div></Td></tr>)}</Table>}
    </Panel>
  </div>;
}

type Appraisal = { id: string; user_id: string; period: string; kpi_score: number | null; rating: number | null; strengths: string; improvements: string; increment_percent: number; status: string };
export function Appraisals() {
  const a = useAction(); const masters = useMasters();
  const list = useQuery({ queryKey: ['hrms', 'appraisals'], queryFn: async () => must(await supabase.from('hr_appraisals').select('*').order('created_at', { ascending: false })) as Appraisal[] });
  const blank = { user_id: '', period: `${new Date().getFullYear()}-H${new Date().getMonth() < 6 ? 1 : 2}`, kpi_score: '', rating: '3', strengths: '', improvements: '', increment_percent: '0' };
  const [f, setF] = useState(blank); const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const nm = (u: string) => masters.data?.find(m => m.user_id === u)?.full_name ?? 'Employee';
  return <div className="grid gap-5">
    <Panel title="Performance review">
      <div className="grid gap-3 sm:grid-cols-3"><Field label="Employee"><select className={inputCls} value={f.user_id} onChange={set('user_id')}><option value="">Choose…</option>{masters.data?.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select></Field>
        <Field label="Review period"><input className={inputCls} value={f.period} onChange={set('period')} /></Field>
        <Field label="KPI / target score (0-100)"><input type="number" min="0" max="100" className={inputCls} value={f.kpi_score} onChange={set('kpi_score')} /></Field>
        <Field label="Rating (1-5)"><select className={inputCls} value={f.rating} onChange={set('rating')}>{[1, 2, 3, 4, 5].map(r => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Recommended increment %"><input type="number" min="0" max="100" className={inputCls} value={f.increment_percent} onChange={set('increment_percent')} /></Field></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Strengths"><textarea className={areaCls} value={f.strengths} onChange={set('strengths')} /></Field><Field label="Areas to improve"><textarea className={areaCls} value={f.improvements} onChange={set('improvements')} /></Field></div>
      <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => { if (!f.user_id) throw new Error('Choose an employee.');
        must(await supabase.from('hr_appraisals').upsert({ ...f, kpi_score: f.kpi_score === '' ? null : Number(f.kpi_score), rating: Number(f.rating), increment_percent: Number(f.increment_percent), reviewer_id: (await supabase.auth.getUser()).data.user?.id ?? null }, { onConflict: 'user_id,period' })); setF(blank); }, 'Review saved as draft.')}>Save review</Button><a.Status />
    </Panel>
    <Panel title="Appraisals">{list.isPending ? <Loading /> : !list.data?.length ? <Empty>No reviews yet.</Empty> :
      <Table head={['Employee', 'Period', 'KPI', 'Rating', 'Increment', 'Status', '']}>{list.data.map(r => <tr key={r.id} className="border-b border-border"><Td>{nm(r.user_id)}</Td><Td>{r.period}</Td><Td>{r.kpi_score ?? '—'}</Td><Td>{r.rating}/5</Td><Td>{r.increment_percent}%</Td><Td><Pill>{r.status}</Pill></Td>
        <Td>{r.status === 'draft' && <Button size="sm" onClick={() => void a.run(async () => must(await supabase.from('hr_appraisals').update({ status: 'shared' }).eq('id', r.id)), 'Shared with the employee.')}>Share with employee</Button>}</Td></tr>)}</Table>}</Panel>
  </div>;
}

type ExitRow = { id: string; user_id: string; resignation_date: string; last_working_day: string | null; reason: string; status: string; assets_returned: boolean; pending_salary: number; leave_encashment: number; other_dues: number; recoveries: number; fnf_amount: number; settled_at: string | null };
export function Exits() {
  const a = useAction(); const masters = useMasters();
  const list = useQuery({ queryKey: ['hrms', 'exits'], queryFn: async () => must(await supabase.from('hr_exits').select('*').order('resignation_date', { ascending: false })) as ExitRow[] });
  const [uid, setUid] = useState(''); const [lwd, setLwd] = useState(''); const [reason, setReason] = useState('');
  const nm = (u: string) => masters.data?.find(m => m.user_id === u)?.full_name ?? 'Employee';
  const upd = (id: string, patch: Partial<ExitRow>, msg?: string) => a.run(async () => must(await supabase.from('hr_exits').update(patch).eq('id', id)), msg);
  return <div className="grid gap-5">
    <Panel title="Start exit / resignation">
      <div className="grid gap-3 sm:grid-cols-3"><Field label="Employee"><select className={inputCls} value={uid} onChange={e => setUid(e.target.value)}><option value="">Choose…</option>{masters.data?.filter(m => m.status !== 'exited').map(m => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select></Field>
        <Field label="Last working day"><input type="date" className={inputCls} value={lwd} onChange={e => setLwd(e.target.value)} /></Field><Field label="Reason"><input className={inputCls} value={reason} onChange={e => setReason(e.target.value)} /></Field></div>
      <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => { if (!uid) throw new Error('Choose an employee.'); must(await supabase.from('hr_exits').insert({ user_id: uid, last_working_day: lwd || null, reason, status: 'notice' })); setUid(''); }, 'Exit started; employee marked on notice.')}>Start exit</Button><a.Status />
    </Panel>
    <Panel title="Exits & full and final settlement">{list.isPending ? <Loading /> : !list.data?.length ? <Empty>No exits.</Empty> : <div className="grid gap-4">{list.data.map(x => <div key={x.id} className="rounded-md border border-border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><b>{nm(x.user_id)}</b><Pill tone={x.status === 'settled' ? 'success' : 'warning'}>{x.status}</Pill></div>
      <p className="text-muted-foreground">Resigned {x.resignation_date} · Last day {x.last_working_day ?? '—'} · {x.reason}</p>
      {x.status !== 'settled' ? <><div className="mt-2 grid gap-2 sm:grid-cols-4">{(['pending_salary', 'leave_encashment', 'other_dues', 'recoveries'] as const).map(k => <Field key={k} label={k.replace('_', ' ')}><input type="number" min="0" className={inputCls} defaultValue={x[k]} onBlur={e => { const v = Number(e.target.value) || 0; if (v !== Number(x[k])) void upd(x.id, { [k]: v }); }} /></Field>)}</div>
        <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={x.assets_returned} onChange={e => void upd(x.id, { assets_returned: e.target.checked })} />Laptop, ID card and other assets returned</label>
        <p className="mt-2 font-semibold">Full & final: {inr(x.fnf_amount)}</p>
        <div className="mt-2 flex gap-2">{x.status === 'notice' && <Button size="sm" variant="outline" onClick={() => void upd(x.id, { status: 'clearance' })}>Move to clearance</Button>}
          <Button size="sm" disabled={!x.assets_returned} onClick={() => { if (confirm('Settle and close? This deactivates the employee and their ID card.')) void upd(x.id, { status: 'settled' }, 'Settled. Employee and ID card deactivated.'); }}>Settle & close</Button></div></>
        : <p className="mt-2">Settled {x.settled_at ? new Date(x.settled_at).toLocaleDateString('en-IN') : ''} · F&F {inr(x.fnf_amount)}</p>}
    </div>)}</div>}</Panel>
  </div>;
}

/** Employee self-service: own profile, payslips, letters, appraisals, ID card and exit status. */
export function MyHr({ uid }: { uid: string }) {
  const q = useQuery({ queryKey: ['hrms', 'me', uid], queryFn: async () => {
    const [m, s, l, ap, x, adv] = await Promise.all([supabase.from('hr_employee_master').select('*').eq('user_id', uid).maybeSingle(), supabase.from('hr_payslips').select('*').eq('user_id', uid).order('month', { ascending: false }),
      supabase.from('hr_letters').select('*').eq('user_id', uid).order('issued_at', { ascending: false }), supabase.from('hr_appraisals').select('*').eq('user_id', uid), supabase.from('hr_exits').select('*').eq('user_id', uid).maybeSingle(), supabase.rpc('hr_advance_balances')]);
    const slips = must(s) as Slip[]; const it = slips.length ? must(await supabase.from('hr_payslip_items').select('id,payslip_id,kind,amount,label').in('payslip_id', slips.map(p => p.id))) as Item[] : [];
    return { it, adv: (must(adv) as Adv[]).filter(a => a.user_id === uid), m: must(m) as Master | null, s: slips, l: must(l) as { id: string; title: string; body: string; issued_at: string }[], ap: must(ap) as Appraisal[], x: must(x) as ExitRow | null };
  } });
  if (q.isPending) return <Loading />; if (q.error) return <ErrorNote error={q.error} />;
  const { m, s, l, ap, x, it, adv } = q.data!;
  return <div className="grid gap-5">
    <Panel title="My HR profile">{!m ? <Empty>HR has not added your employee record yet.</Empty> : <dl className="grid gap-2 text-sm sm:grid-cols-3">{([['Employee code', m.employee_code], ['Designation', m.designation], ['Department', m.department], ['Joining date', m.joining_date ?? '—'], ['Shift', m.shift], ['Status', m.status], ['PAN', m.pan_last4 ? `••••${m.pan_last4}` : '—'], ['Bank', m.bank_last4 ? `••••${m.bank_last4}` : '—']] as const).map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}</dl>}
      <p className="mt-3 text-xs text-muted-foreground">To change details, raise a "Profile update" request under Support & HR help. Your ID card is issued by HR.</p></Panel>
    <Panel title="My payslips">{!s.length ? <Empty>No payslips released yet.</Empty> : <Table head={['Month', 'Gross', 'Reimbursement', 'Advance recovery', 'Net', 'Status', '']}>{s.map(p => <tr key={p.id} className="border-b border-border"><Td>{p.month.slice(0, 7)}</Td><Td>{inr(p.gross)}</Td><Td>{inr(p.reimbursement)}</Td><Td>{inr(p.advance_recovery)}</Td><Td>{inr(p.net)}</Td><Td><Pill>{p.status}</Pill></Td><Td><Button size="sm" variant="outline" onClick={() => void downloadPayslip(p, m?.full_name ?? 'me', it.filter(i => i.payslip_id === p.id))}>PDF</Button></Td></tr>)}</Table>}</Panel>
    <MyRoster uid={uid} />
    {adv.length > 0 && <Panel title="My salary advances"><Table head={['Advance', 'Per month', 'Recovered', 'Balance', 'Status']}>{adv.map(v => <tr key={v.id} className="border-b border-border"><Td>{inr(v.amount)}</Td><Td>{inr(v.monthly_recovery)}</Td><Td>{inr(v.recovered)}</Td><Td>{inr(v.balance)}</Td><Td><Pill>{v.status}</Pill></Td></tr>)}</Table></Panel>}
    <Panel title="My letters & documents">{!l.length ? <Empty>No letters yet.</Empty> : <ul className="grid gap-2 text-sm">{l.map(d => <li key={d.id} className="flex items-center justify-between border-b border-border pb-2">{d.title} · {new Date(d.issued_at).toLocaleDateString('en-IN')}<Button size="sm" variant="outline" onClick={() => void letterPdf(d.title, d.body, (d as { ref_no?: string | null }).ref_no)}>PDF</Button></li>)}</ul>}</Panel>
    <Panel title="My appraisals">{!ap.length ? <Empty>No shared reviews yet.</Empty> : ap.map(r => <div key={r.id} className="border-b border-border py-2 text-sm"><b>{r.period}</b> · Rating {r.rating}/5 · KPI {r.kpi_score ?? '—'}<p>Strengths: {r.strengths}</p><p>To improve: {r.improvements}</p></div>)}</Panel>
    {x && <Panel title="My exit"><p className="text-sm">Status: <Pill>{x.status}</Pill> · Last day {x.last_working_day ?? '—'} · Full & final {inr(x.fnf_amount)}</p></Panel>}
  </div>;
}
