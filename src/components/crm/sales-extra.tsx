import { useState, type FormEvent, type ReactNode } from 'react';
import { csvCell } from '@/lib/share/whatsapp';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, Check, Download, FileText, MessageSquareText, Phone, Upload, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { KpiCard } from '../dashboard/shell';
import { Empty, ErrorNote, Field, Panel, Pill, StatusPill, Table, Td, areaCls, inputCls } from '../work/common';
import type { getCrm } from '@/lib/crm.functions';
import { sourceLabels, stageLabels, stages } from '@/lib/crm/rules';
import { calculateIncentive, collectionTotals, readSlabs } from '@/lib/crm/incentives';
import { paceStatus, previousWorkday, sourceReport, underperformanceAlerts } from '@/lib/crm/performance';
import { money, modeLabels, volRevenue } from './sales-money';
import { leadReceivers, splitEvenly } from '@/lib/crm/distribute';

type Data = Awaited<ReturnType<typeof getCrm>>;
type NameFn = (id: string | null) => string;
const istDate = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(iso));
const fmtDate = (s: string | null | undefined) => s ? new Date(s.length === 10 ? `${s}T00:00:00` : s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const zoneTone = { on_track: 'success', at_risk: 'warning', behind: 'danger', no_target: 'muted' } as const;
const zoneLabel = { on_track: 'On track', at_risk: 'At risk', behind: 'Behind', no_target: 'No target' } as const;

function useCrmAction() {
  const qc = useQueryClient(); const [notice, setNotice] = useState('');
  const m = useMutation({ mutationFn: async (fn: () => Promise<unknown>) => { await fn(); }, onSuccess: () => { void qc.invalidateQueries({ queryKey: ['crm'] }); } });
  const run = (fn: () => Promise<unknown>, msg = 'Saved.') => { setNotice(''); m.mutate(fn, { onSuccess: () => setNotice(msg) }); };
  return { run, busy: m.isPending, error: m.error, notice };
}
function Status({ a }: { a: ReturnType<typeof useCrmAction> }) { return <div className="mt-2 space-y-1"><ErrorNote error={a.error} />{a.notice && <p role="status" className="text-sm text-muted-foreground">{a.notice}</p>}</div>; }
const ok = async (p: PromiseLike<{ error: unknown }>) => { const { error } = await p; if (error) throw error; };

/** People this account manages: a BDM's active reports, or every active sales member for admin. */
export function teamMembers(d: Data) {
  return d.members.filter(m => m.active && m.user_id !== d.userId && (d.role === 'admin' ? ['BDE', 'BDM', 'sales'].includes(m.role) : m.manager_id === d.userId));
}
function dayCounts(d: Data, uid: string, day: string) {
  return {
    calls: d.activities.filter(a => a.actor_id === uid && a.kind === 'call' && istDate(a.created_at) === day).length,
    meetings: d.activities.filter(a => a.actor_id === uid && a.kind === 'meeting' && istDate(a.created_at) === day).length,
    leads: d.leads.filter(l => l.owner_id === uid && istDate(l.created_at) === day).length,
    done: d.tasks.filter(t => t.owner_id === uid && t.status === 'done' && t.completed_at && istDate(t.completed_at) === day).length,
    won: d.leads.filter(l => l.owner_id === uid && l.stage === 'won' && istDate(l.updated_at) === day).length,
    collected: d.collections.filter(c => c.owner_id === uid && c.collected_on === day && c.status !== 'rejected').reduce((n, c) => n + Number(c.amount), 0),
  };
}

/* ---------------------------------- BDE: My day ---------------------------------- */
export function MyDayPanel({ d, name, onOpenLead, onGo }: { d: Data; name: NameFn; onOpenLead: (id: string) => void; onGo: (view: string) => void }) {
  const a = useCrmAction(); const today = d.today; const me = d.userId;
  const tasks = d.tasks.filter(t => t.owner_id === me && t.status === 'open');
  const overdue = tasks.filter(t => t.due_date < today), dueToday = tasks.filter(t => t.due_date === today), upcoming = tasks.filter(t => t.due_date > today).slice(0, 5);
  const followLeads = d.leads.filter(l => l.owner_id === me && l.next_follow_up && l.next_follow_up <= today && !['won', 'lost'].includes(l.stage));
  const c = dayCounts(d, me, today); const report = d.reports.find(r => r.owner_id === me && r.report_date === today);
  const coachingDue = d.coaching.filter(n => n.employee_id === me && !n.acknowledged_at).length;
  const taskRow = (t: Data['tasks'][number]) => <li key={t.id} className="flex items-start justify-between gap-3 py-2.5"><div><p className="text-sm font-medium">{t.title}</p><p className="text-xs text-muted-foreground">Due {fmtDate(t.due_date)} · {t.priority}</p></div>
    <Button size="sm" variant="outline" disabled={a.busy} onClick={() => a.run(() => ok(supabase.from('crm_tasks').update({ status: 'done' }).eq('id', t.id)), 'Follow-up marked done.')}><Check className="size-3.5" />Done</Button></li>;
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Overdue follow-ups" value={overdue.length} icon={AlertTriangle} tone={overdue.length ? 'danger' : 'default'} />
      <KpiCard label="Due today" value={dueToday.length + followLeads.length} note={`${dueToday.length} tasks · ${followLeads.length} lead follow-ups`} icon={CalendarClock} tone="warning" />
      <KpiCard label="Calls / meetings today" value={`${c.calls} / ${c.meetings}`} note="From your logged activities" icon={Phone} />
      <KpiCard label="Today's daily report" value={report ? (report.status === 'reviewed' ? 'Reviewed' : report.status === 'needs_changes' ? 'Changes asked' : 'Submitted') : 'Not sent'} icon={FileText} tone={report ? 'success' : 'warning'} />
    </div>
    {!report && d.role !== 'admin' && <button type="button" onClick={() => onGo('dsr')} className="w-full rounded-xl border border-primary/30 bg-accent p-4 text-left text-sm font-semibold text-accent-foreground">Submit today's daily report before you log off →</button>}
    {coachingDue > 0 && <button type="button" onClick={() => onGo('coaching')} className="w-full rounded-xl border border-border bg-surface p-4 text-left text-sm font-semibold">{coachingDue} coaching note{coachingDue === 1 ? '' : 's'} from your manager waiting for you →</button>}
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Overdue & today's follow-ups">{!overdue.length && !dueToday.length ? <Empty>Nothing due. Plan your next calls.</Empty> : <ul className="divide-y divide-border">{[...overdue, ...dueToday].map(taskRow)}</ul>}<Status a={a} /></Panel>
      <Panel title="Leads to call back today">{!followLeads.length ? <Empty>No lead follow-ups due.</Empty> : <ul className="divide-y divide-border">{followLeads.map(l => <li key={l.id} className="flex items-center justify-between gap-3 py-2.5"><div><p className="text-sm font-medium">{l.title}</p><p className="text-xs text-muted-foreground">{stageLabels[l.stage as typeof stages[number]] ?? l.stage} · follow-up {fmtDate(l.next_follow_up)} · {money(l.amount)}</p></div><Button size="sm" variant="outline" onClick={() => onOpenLead(l.id)}>Open</Button></li>)}</ul>}</Panel>
      <Panel title="Coming up">{!upcoming.length ? <Empty>No upcoming tasks.</Empty> : <ul className="divide-y divide-border">{upcoming.map(taskRow)}</ul>}</Panel>
      <Panel title="Today so far"><dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">{[['New leads', c.leads], ['Follow-ups done', c.done], ['Deals won', c.won], ['Collections recorded', money(c.collected)], ['Calls', c.calls], ['Meetings', c.meetings]].map(([k, v]) => <div key={String(k)}><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="text-lg font-semibold tabular-nums">{v}</dd></div>)}</dl><p className="mt-3 text-xs text-muted-foreground">Signed in as {name(me)}.</p></Panel>
    </div>
  </div>;
}

/* ------------------------------ Daily sales report ------------------------------ */
export function DailyReportPanel({ d, name }: { d: Data; name: NameFn }) {
  const a = useCrmAction(); const today = d.today; const yesterday = previousWorkday(today);
  const canSubmit = ['BDE', 'BDM', 'sales'].includes(d.role); const canReview = d.role === 'BDM' || d.role === 'admin';
  const [day, setDay] = useState(today); const mine = d.reports.find(r => r.owner_id === d.userId && r.report_date === day);
  const [f, setF] = useState({ summary: '', plan: '', blockers: '' }); const [loadedFor, setLoadedFor] = useState('');
  if (mine && loadedFor !== mine.id) { setLoadedFor(mine.id); setF({ summary: mine.summary, plan: mine.plan_tomorrow, blockers: mine.blockers }); }
  const c = dayCounts(d, d.userId, day);
  const team = teamMembers(d); const [reviewDay, setReviewDay] = useState(today); const [notes, setNotes] = useState<Record<string, string>>({});
  const teamReports = d.reports.filter(r => r.owner_id !== d.userId && r.report_date === reviewDay);
  const missing = team.filter(m => !teamReports.some(r => r.owner_id === m.user_id));
  function submit(e: FormEvent) { e.preventDefault(); a.run(() => ok(supabase.rpc('crm_submit_daily_report', { _date: day, _summary: f.summary, _plan: f.plan, _blockers: f.blockers })), 'Daily report submitted. Your manager can now review it.'); }
  return <div className="space-y-6">
    {canSubmit && <Panel title="My daily sales report">
      <form onSubmit={submit} className="grid gap-4">
        <div className="flex flex-wrap items-end gap-3"><Field label="Report for"><select className={inputCls} value={day} onChange={e => { setDay(e.target.value); setLoadedFor(''); setF({ summary: '', plan: '', blockers: '' }); }}><option value={today}>Today ({fmtDate(today)})</option><option value={new Date(new Date(`${today}T00:00:00Z`).getTime() - 864e5).toISOString().slice(0, 10)}>Yesterday</option></select></Field>
          {mine && <div className="pb-1"><Pill tone={mine.status === 'reviewed' ? 'success' : mine.status === 'needs_changes' ? 'danger' : 'info'}>{mine.status === 'reviewed' ? 'Reviewed' : mine.status === 'needs_changes' ? 'Changes asked' : 'Submitted'}</Pill></div>}</div>
        {mine?.status === 'needs_changes' && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">Manager note: {mine.review_note}</p>}
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-3 text-sm sm:grid-cols-6">{[['Calls', c.calls], ['Meetings', c.meetings], ['New leads', c.leads], ['Follow-ups done', c.done], ['Won', c.won], ['Collected', money(c.collected)]].map(([k, v]) => <div key={String(k)}><p className="text-[11px] text-muted-foreground">{k}</p><p className="font-semibold tabular-nums">{v}</p></div>)}<p className="col-span-2 text-xs text-muted-foreground sm:col-span-6">These numbers are counted automatically from your CRM entries when you submit — they cannot be typed in.</p></div>
        <Field label="What did you do today?"><textarea required minLength={10} maxLength={3000} className={areaCls} value={f.summary} disabled={mine?.status === 'reviewed'} onChange={e => setF({ ...f, summary: e.target.value })} placeholder="Calls made, meetings, customers spoken to, deals moved…" /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Plan for tomorrow"><textarea maxLength={2000} className={areaCls} value={f.plan} disabled={mine?.status === 'reviewed'} onChange={e => setF({ ...f, plan: e.target.value })} /></Field><Field label="Blockers / help needed"><textarea maxLength={2000} className={areaCls} value={f.blockers} disabled={mine?.status === 'reviewed'} onChange={e => setF({ ...f, blockers: e.target.value })} /></Field></div>
        <div><Button type="submit" disabled={a.busy || mine?.status === 'reviewed'}>{mine ? 'Update report' : 'Submit report'}</Button></div>
      </form><Status a={a} /></Panel>}
    {canReview && <Panel title="Team daily reports" actions={<input type="date" aria-label="Report date" className={`${inputCls} w-auto`} value={reviewDay} max={today} onChange={e => setReviewDay(e.target.value || today)} />}>
      {missing.length > 0 && <p className="mb-3 rounded-md border border-border bg-surface p-3 text-sm"><b>Not submitted ({missing.length}):</b> {missing.map(m => name(m.user_id)).join(', ')}{reviewDay === yesterday ? '' : ''}</p>}
      {!teamReports.length ? <Empty>No reports for this day yet.</Empty> : <div className="grid gap-3">{teamReports.map(r => <article key={r.id} className="rounded-lg border border-border p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><b>{name(r.owner_id)}</b><Pill tone={r.status === 'reviewed' ? 'success' : r.status === 'needs_changes' ? 'danger' : 'warning'}>{r.status === 'reviewed' ? 'Reviewed' : r.status === 'needs_changes' ? 'Changes asked' : 'Waiting for review'}</Pill></div>
        <p className="mt-1 text-xs text-muted-foreground">Calls {r.calls} · Meetings {r.meetings} · New leads {r.new_leads} · Follow-ups done {r.follow_ups_done} · Won {r.won_deals} · Collected {money(Number(r.collected))}</p>
        <p className="mt-2 whitespace-pre-wrap">{r.summary}</p>{r.plan_tomorrow && <p className="mt-2 whitespace-pre-wrap text-muted-foreground"><b className="text-foreground">Tomorrow:</b> {r.plan_tomorrow}</p>}{r.blockers && <p className="mt-1 whitespace-pre-wrap text-muted-foreground"><b className="text-foreground">Blockers:</b> {r.blockers}</p>}
        {r.review_note && <p className="mt-2 text-xs">Review note: {r.review_note}</p>}
        {r.status !== 'reviewed' && <div className="mt-3 flex flex-wrap gap-2"><input className={`${inputCls} max-w-sm`} placeholder="Note (required to ask for changes)" value={notes[r.id] ?? ''} onChange={e => setNotes({ ...notes, [r.id]: e.target.value })} />
          <Button size="sm" disabled={a.busy} onClick={() => a.run(() => ok(supabase.rpc('crm_review_daily_report', { _id: r.id, _status: 'reviewed', _note: notes[r.id] ?? '' })), 'Report marked reviewed.')}><Check className="size-3.5" />Mark reviewed</Button>
          <Button size="sm" variant="outline" disabled={a.busy} onClick={() => a.run(() => ok(supabase.rpc('crm_review_daily_report', { _id: r.id, _status: 'needs_changes', _note: notes[r.id] ?? '' })), 'Sent back for changes.')}>Ask for changes</Button></div>}
      </article>)}</div>}
      {!canSubmit && <Status a={a} />}</Panel>}
    {canSubmit && <Panel title="My recent reports">{!d.reports.filter(r => r.owner_id === d.userId).length ? <Empty>No reports yet.</Empty> : <Table head={['Date', 'Calls', 'Meetings', 'Leads', 'Won', 'Collected', 'Status']}>{d.reports.filter(r => r.owner_id === d.userId).slice(0, 30).map(r => <tr key={r.id}><Td>{fmtDate(r.report_date)}</Td><Td>{r.calls}</Td><Td>{r.meetings}</Td><Td>{r.new_leads}</Td><Td>{r.won_deals}</Td><Td>{money(Number(r.collected))}</Td><Td><Pill tone={r.status === 'reviewed' ? 'success' : r.status === 'needs_changes' ? 'danger' : 'info'}>{r.status.replace('_', ' ')}</Pill></Td></tr>)}</Table>}</Panel>}
  </div>;
}

/* --------------------------------- Lead sources --------------------------------- */
export function LeadSourcesPanel({ d }: { d: Data }) {
  const [month, setMonth] = useState(''); const rows = sourceReport(d.leads.filter(l => !month || l.created_at.startsWith(month)));
  return <Panel title="Lead source report" actions={<input type="month" aria-label="Month" className={`${inputCls} w-auto`} value={month} onChange={e => setMonth(e.target.value)} />}>
    <p className="mb-3 text-sm text-muted-foreground">Where your {month ? 'leads for this month' : 'leads'} came from and how many turned into sales. Leave the month empty to see all time.</p>
    {!rows.length ? <Empty>No leads yet.</Empty> : <Table head={['Source', 'Leads', 'Won', 'Lost', 'Conversion', 'Won value']}>{rows.map(r => <tr key={r.source}><Td>{sourceLabels[r.source] ?? r.source}</Td><Td>{r.leads}</Td><Td>{r.won}</Td><Td>{r.lost}</Td><Td><span className="font-semibold">{r.conversion}%</span></Td><Td>{money(r.wonValue)}</Td></tr>)}</Table>}
  </Panel>;
}

/* ---------------------------- Cancellation & refunds ---------------------------- */
export function RefundPanel({ d, name }: { d: Data; name: NameFn }) {
  const a = useCrmAction(); const [f, setF] = useState({ collection: '', kind: 'refund', amount: '', reason: '' });
  const cols = d.collections.filter(c => c.status === 'verified');
  const col = cols.find(c => c.id === f.collection); const lead = d.leads.find(l => l.id === col?.lead_id); const cust = d.customers.find(c => c.id === lead?.customer_id);
  function submit(e: FormEvent) {
    e.preventDefault();
    a.run(async () => {
      if (!col) throw new Error('Choose the verified payment to refund.');
      const amount = Number(f.amount); if (!(amount > 0) || amount > Number(col.amount)) throw new Error(`Refund amount must be between ₹1 and ${money(Number(col.amount))}.`);
      if (f.reason.trim().length < 10) throw new Error('Explain the reason in at least 10 characters.');
      await ok(supabase.rpc('request_submit', { _type: 'customer_refund', _title: `${f.kind === 'cancellation' ? 'Cancellation' : 'Refund'} · ${col.code}${cust ? ` · ${cust.full_name}` : ''}`, _description: f.reason.trim(), _details: { kind: f.kind, collection_code: col.code, collection_id: col.id, lead: lead?.title ?? '', customer: cust?.full_name ?? col.payer_name ?? '', customer_code: cust?.customer_code ?? '', paid_amount: Number(col.amount), payment_mode: col.mode, reference: col.reference ?? '' } as never, _amount: amount }));
      setF({ collection: '', kind: 'refund', amount: '', reason: '' });
    }, 'Request raised. Accounts checks it first, then Finance approves and pays.');
  }
  return <div className="space-y-6">
    <Panel title="Raise a cancellation or refund">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Verified payment"><select required className={inputCls} value={f.collection} onChange={e => setF({ ...f, collection: e.target.value, amount: String(cols.find(c => c.id === e.target.value)?.amount ?? '') })}><option value="">Choose…</option>{cols.map(c => <option key={c.id} value={c.id}>{c.code} · {money(Number(c.amount))} · {c.collected_on} · {name(c.owner_id)}</option>)}</select></Field>
        <Field label="Type"><select className={inputCls} value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}><option value="refund">Refund (money back)</option><option value="cancellation">Cancellation (service stopped)</option></select></Field>
        <Field label="Amount to refund (₹)"><input required type="number" min={1} step="0.01" className={inputCls} value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="Customer">{<p className="py-2 text-sm">{cust ? `${cust.full_name} · ${cust.customer_code}` : col ? (col.payer_name || '—') : '—'}</p>}</Field>
        <div className="sm:col-span-2"><Field label="Reason"><textarea required minLength={10} maxLength={2000} className={areaCls} value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} /></Field></div>
        <div><Button type="submit" disabled={a.busy || !cols.length}>Raise request</Button></div>
      </form>
      {!cols.length && <p className="mt-2 text-sm text-muted-foreground">Only payments already verified by Accounts can be refunded.</p>}
      <Status a={a} /></Panel>
    <Panel title="Cancellation & refund requests">{!d.refunds.length ? <Empty>No requests yet.</Empty> : <Table head={['Request', 'Raised by', 'Amount', 'Date', 'Status']}>{d.refunds.map(r => <tr key={r.id}><Td><span className="block font-mono text-xs text-muted-foreground">{r.code}</span>{r.title}</Td><Td>{name(r.applicant_id)}</Td><Td>{r.amount != null ? money(Number(r.amount)) : '—'}</Td><Td>{fmtDate(r.created_at)}</Td><Td><StatusPill status={r.status} />{r.resolution && <p className="mt-1 text-xs text-muted-foreground">{r.resolution}</p>}</Td></tr>)}</Table>}</Panel>
  </div>;
}

/* -------------------------------- Customer 360 -------------------------------- */
const docTypes = { agreement: 'Agreement', proposal: 'Proposal', quotation: 'Quotation', invoice: 'Invoice', receipt: 'Receipt', other: 'Other' } as const;
export function Customer360({ d, customerId, name, onClose, onOpenLead }: { d: Data; customerId: string | null; name: NameFn; onClose: () => void; onOpenLead: (id: string) => void }) {
  const a = useCrmAction(); const [docType, setDocType] = useState<keyof typeof docTypes>('agreement'); const [leadId, setLeadId] = useState(''); const [note, setNote] = useState('');
  const c = d.customers.find(x => x.id === customerId);
  const leads = c ? d.leads.filter(l => l.customer_id === c.id) : []; const leadIds = leads.map(l => l.id);
  const cols = d.collections.filter(x => x.lead_id && leadIds.includes(x.lead_id));
  const acts = d.activities.filter(x => x.lead_id && leadIds.includes(x.lead_id));
  const tasks = c ? d.tasks.filter(t => t.customer_id === c.id) : []; const tickets = c ? d.tickets.filter(t => t.customer_id === c.id) : [];
  const docs = c ? d.documents.filter(x => x.customer_id === c.id) : [];
  const refunds = d.refunds.filter(r => cols.some(x => (r.details as { collection_id?: string } | null)?.collection_id === x.id));
  const totals = collectionTotals(cols, null);
  async function upload(file: File) {
    if (!c) return;
    if (file.size > 20 * 1024 * 1024) throw new Error('File must be 20 MB or smaller.');
    if (!/\.(pdf|docx?|xlsx?|png|jpe?g)$/i.test(file.name)) throw new Error('Upload a PDF, Word, Excel or image file.');
    const path = `${c.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, '_').slice(-80)}`;
    const up = await supabase.storage.from('crm-docs').upload(path, file, { contentType: file.type || undefined }); if (up.error) throw up.error;
    await ok(supabase.from('crm_documents').insert({ customer_id: c.id, lead_id: leadId || null, doc_type: docType, file_path: path, file_name: file.name.slice(0, 200), note: note.slice(0, 500) }));
    setNote('');
  }
  async function open(path: string) { const { data, error } = await supabase.storage.from('crm-docs').createSignedUrl(path, 120); if (error) throw error; window.open(data.signedUrl, '_blank', 'noopener'); }
  const Section = ({ title, children }: { title: string; children: ReactNode }) => <section className="mt-5"><h4 className="mb-2 text-sm font-semibold">{title}</h4>{children}</section>;
  return <Dialog open={Boolean(c)} onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="dash-shell max-h-[90vh] overflow-y-auto bg-background text-foreground sm:max-w-3xl">
    <DialogHeader><DialogTitle>{c?.full_name} · {c?.customer_code}</DialogTitle></DialogHeader>
    {c && <>
      <dl className="grid gap-3 text-sm sm:grid-cols-3">{[['Email', c.email || '—'], ['Phone', c.phone || '—'], ['Company', c.company || '—'], ['Acknowledgement', c.acknowledgement || '—'], ['Owner', name(c.owner_id)], ['Customer since', fmtDate(c.created_at)]].map(([k, v]) => <div key={k}><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="break-words">{v}</dd></div>)}</dl>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Deals', leads.length], ['Won value', money(leads.filter(l => l.stage === 'won').reduce((n, l) => n + l.amount, 0))], ['Verified paid', money(totals.verified)], ['Waiting check', money(totals.unverified)]].map(([k, v]) => <div key={String(k)} className="rounded-lg border border-border bg-surface p-3"><p className="text-[11px] text-muted-foreground">{k}</p><p className="text-base font-semibold tabular-nums">{v}</p></div>)}</div>
      <Section title="Deals">{!leads.length ? <Empty>No deals.</Empty> : <ul className="divide-y divide-border text-sm">{leads.map(l => <li key={l.id} className="flex items-center justify-between gap-2 py-2"><span>{l.title} · {stageLabels[l.stage as typeof stages[number]] ?? l.stage} · {money(l.amount)} <span className="text-xs text-muted-foreground">({sourceLabels[l.source] ?? l.source})</span></span><Button size="sm" variant="ghost" onClick={() => { onClose(); onOpenLead(l.id); }}>Open</Button></li>)}</ul>}</Section>
      <Section title="Payments">{!cols.length ? <Empty>No payments recorded.</Empty> : <ul className="divide-y divide-border text-sm">{cols.map(x => <li key={x.id} className="py-2">{x.code} · {money(Number(x.amount))} · {x.collected_on} · {modeLabels[x.mode] ?? x.mode} · <b className="capitalize">{x.status}</b></li>)}</ul>}</Section>
      <Section title="Agreements & documents">
        <div className="grid gap-2 sm:grid-cols-4"><select aria-label="Document type" className={inputCls} value={docType} onChange={e => setDocType(e.target.value as keyof typeof docTypes)}>{Object.entries(docTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select aria-label="Deal" className={inputCls} value={leadId} onChange={e => setLeadId(e.target.value)}><option value="">Any deal</option>{leads.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select>
          <input className={inputCls} placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium"><Upload className="size-4" />Upload<input type="file" className="sr-only" disabled={a.busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) a.run(() => upload(file), 'Document uploaded.'); }} /></label></div>
        {!docs.length ? <Empty>No documents yet.</Empty> : <ul className="mt-2 divide-y divide-border text-sm">{docs.map(x => <li key={x.id} className="flex items-center justify-between gap-2 py-2"><span><b>{docTypes[x.doc_type as keyof typeof docTypes] ?? x.doc_type}</b> · {x.file_name}{x.note ? ` · ${x.note}` : ''} <span className="text-xs text-muted-foreground">{fmtDate(x.created_at)} · {name(x.uploaded_by)}</span></span><Button size="sm" variant="outline" onClick={() => a.run(() => open(x.file_path), 'Opened in a new tab.')}><Download className="size-3.5" />Open</Button></li>)}</ul>}
        <Status a={a} /></Section>
      <Section title="Follow-ups & tickets"><ul className="divide-y divide-border text-sm">{tasks.map(t => <li key={t.id} className="py-2">Task: {t.title} · due {fmtDate(t.due_date)} · {t.status}</li>)}{tickets.map(t => <li key={t.id} className="py-2">Ticket {t.ticket_code}: {t.subject} · {t.status}</li>)}{refunds.map(r => <li key={r.id} className="py-2">Refund {r.code}: {r.amount != null ? money(Number(r.amount)) : ''} · {r.status}</li>)}</ul>{!tasks.length && !tickets.length && !refunds.length && <Empty>None.</Empty>}</Section>
      <Section title="Timeline">{!acts.length ? <Empty>No activity logged.</Empty> : <ol className="space-y-2 text-sm">{acts.map(x => <li key={x.id} className="border-l border-border pl-3"><p>{x.body}</p><p className="text-xs text-muted-foreground">{x.kind} · {name(x.actor_id)} · {new Date(x.created_at).toLocaleString('en-IN')}</p></li>)}</ol>}</Section>
    </>}
  </DialogContent></Dialog>;
}

/* ------------------------------ BDM: team performance ------------------------------ */
export function TeamComparePanel({ d, name }: { d: Data; name: NameFn }) {
  const [month, setMonth] = useState(d.today.slice(0, 7)); const team = teamMembers(d);
  const isCurrent = month === d.today.slice(0, 7);
  const [y, mo] = month.split('-').map(Number); const daysInMonth = new Date(y!, mo!, 0).getDate();
  const dayOfMonth = isCurrent ? Number(d.today.slice(8, 10)) : daysInMonth;
  const workday = new Date(`${d.today}T00:00:00Z`).getUTCDay() !== 0; const lastWorkday = previousWorkday(d.today);
  const rows = team.map(m => {
    const id = m.user_id; const t = d.targets.find(x => x.owner_id === id && x.month.startsWith(month));
    const verified = collectionTotals(d.collections, [id], undefined, month).verified;
    // Target pace counts volunteer-sourced revenue too (it closes the target); the incentive itself is paid on direct collection only.
    const vol = volRevenue(d, [id], month).revenue;
    const won = d.leads.filter(l => l.owner_id === id && l.stage === 'won' && l.updated_at.startsWith(month));
    const calls = d.activities.filter(a => a.actor_id === id && a.kind === 'call' && a.created_at.startsWith(month)).length;
    const meetings = d.activities.filter(a => a.actor_id === id && a.kind === 'meeting' && a.created_at.startsWith(month)).length;
    const open = d.leads.filter(l => l.owner_id === id && !['won', 'lost'].includes(l.stage)).length;
    const overdue = d.tasks.filter(x => x.owner_id === id && x.status === 'open' && x.due_date < d.today).length;
    const pace = paceStatus(verified + vol, Number(t?.revenue_target ?? 0), dayOfMonth, daysInMonth);
    const reports = d.reports.filter(r => r.owner_id === id && r.report_date.startsWith(month)).length;
    const att = d.attendance.find(x => x.user_id === id && x.day === d.today);
    const alerts = isCurrent ? underperformanceAlerts({ pace: pace.zone, callsToday: dayCounts(d, id, d.today).calls, overdueTasks: overdue, reportYesterday: d.reports.some(r => r.owner_id === id && r.report_date === lastWorkday), workday }) : [];
    return { id, role: m.role, target: Number(t?.revenue_target ?? 0), verified, won: won.length, wonValue: won.reduce((n, l) => n + l.amount, 0), calls, meetings, open, overdue, pace, reports, att: att?.status ?? (isCurrent ? 'Not marked' : '—'), alerts };
  }).sort((a, b) => b.verified - a.verified);
  const flagged = rows.filter(r => r.alerts.length);
  function exportCsv() {
    const head = ['Employee', 'Role', 'Target', 'Verified collection', 'Pace %', 'Status', 'Won deals', 'Won value', 'Calls', 'Meetings', 'Open leads', 'Overdue follow-ups', 'Daily reports', 'Alerts'];
    const body = rows.map(r => [name(r.id), r.role, r.target, r.verified, r.pace.percentOfPace, zoneLabel[r.pace.zone], r.won, r.wonValue, r.calls, r.meetings, r.open, r.overdue, r.reports, r.alerts.join('; ')]);
    const csv = [head, ...body].map(x => x.map(v => csvCell(v)).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' })); const el = document.createElement('a'); el.href = url; el.download = `team-report-${month}.csv`; el.click(); URL.revokeObjectURL(url);
  }
  if (!team.length) return <p className="dash-card p-6 text-sm text-muted-foreground">No one reports to you yet. The admin assigns BDEs to a BDM from Employees.</p>;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end gap-3"><Field label="Month"><input type="month" className={`${inputCls} w-auto`} value={month} max={d.today.slice(0, 7)} onChange={e => setMonth(e.target.value || d.today.slice(0, 7))} /></Field><Button variant="outline" onClick={exportCsv}><Download className="size-4" />Export team report</Button></div>
    {isCurrent && <Panel title={<span className="flex items-center gap-2"><AlertTriangle className="size-4 text-[var(--dash-warning)]" />Underperformance alerts</span>}>
      {!flagged.length ? <Empty>Everyone is on pace and up to date.</Empty> : <ul className="divide-y divide-border text-sm">{flagged.map(r => <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5"><b>{name(r.id)}</b><span className="flex flex-wrap gap-1">{r.alerts.map(x => <Pill key={x} tone="danger">{x}</Pill>)}</span></li>)}</ul>}
      <p className="mt-3 text-xs text-muted-foreground">Pace compares verified collection with the monthly target spread evenly over the month: below 50% of pace is "Behind", below 80% is "At risk". Sundays are treated as the weekly off.</p></Panel>}
    <Panel title="BDE performance comparison"><Table head={['Employee', 'Verified / target', 'Pace', 'Won', 'Calls · meetings', 'Open leads', 'Overdue', 'Reports', ...(isCurrent ? ['Today'] : [])]}>{rows.map((r, i) => <tr key={r.id}><Td><span className="mr-2 text-xs text-muted-foreground">#{i + 1}</span><b>{name(r.id)}</b><span className="block text-xs text-muted-foreground">{r.role}</span></Td>
      <Td className="tabular-nums">{money(r.verified)}<span className="block text-xs text-muted-foreground">of {r.target ? money(r.target) : 'not set'}</span></Td><Td><Pill tone={zoneTone[r.pace.zone]}>{zoneLabel[r.pace.zone]}{r.pace.zone !== 'no_target' ? ` · ${r.pace.percentOfPace}%` : ''}</Pill></Td>
      <Td>{r.won}<span className="block text-xs text-muted-foreground">{money(r.wonValue)}</span></Td><Td>{r.calls} · {r.meetings}</Td><Td>{r.open}</Td><Td>{r.overdue}</Td><Td>{r.reports}</Td>{isCurrent && <Td className="capitalize">{r.att}</Td>}</tr>)}</Table></Panel>
  </div>;
}

/* ------------------------- BDM: workload & reassignment ------------------------- */
export function WorkloadPanel({ d, name }: { d: Data; name: NameFn }) {
  const a = useCrmAction(); const team = teamMembers(d); const people = d.role === 'admin' ? team : [{ user_id: d.userId, role: 'BDM' }, ...team];
  const [from, setFrom] = useState(''); const [targets, setTargets] = useState<string[]>([]); const receivers = leadReceivers(d.role, d.userId, d.members); const [reason, setReason] = useState(''); const [picked, setPicked] = useState<string[]>([]);
  const openLeads = d.leads.filter(l => !['won', 'lost'].includes(l.stage) && (from === '__none' ? l.owner_id === null : !from || l.owner_id === from));
  const load = people.map(p => ({ id: p.user_id, leads: d.leads.filter(l => l.owner_id === p.user_id && !['won', 'lost'].includes(l.stage)).length, value: d.leads.filter(l => l.owner_id === p.user_id && !['won', 'lost'].includes(l.stage)).reduce((n, l) => n + l.amount, 0), tasks: d.tasks.filter(t => t.owner_id === p.user_id && t.status === 'open').length, overdue: d.tasks.filter(t => t.owner_id === p.user_id && t.status === 'open' && t.due_date < d.today).length }));
  const max = Math.max(1, ...load.map(l => l.leads));
  const avg = load.length ? load.reduce((n, l) => n + l.leads, 0) / load.length : 0;
  return <div className="space-y-6">
    <Panel title={<span className="flex items-center gap-2"><Users className="size-4" />Workload distribution</span>}>
      <ul className="space-y-3">{load.map(l => <li key={l.id}><div className="flex flex-wrap items-baseline justify-between gap-2 text-sm"><b>{name(l.id)}</b><span className="text-xs text-muted-foreground">{l.leads} open leads · {money(l.value)} · {l.tasks} open tasks{l.overdue ? ` · ${l.overdue} overdue` : ''}{l.leads >= 5 && l.leads > avg * 1.5 ? ' · overloaded' : ''}</span></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.round(l.leads / max * 100)}%` }} /></div></li>)}</ul>
      <p className="mt-3 text-xs text-muted-foreground">"Overloaded" means 5 or more open leads and over 1.5× the team average.</p></Panel>
    <Panel title="Distribute / reassign leads">
      <p className="mb-3 text-xs text-muted-foreground">{d.role === 'admin' ? 'Give leads to a BDM (their team) or straight to BDEs, share them equally, or keep them yourself.' : 'Give your leads to your BDEs, share them equally, or keep them yourself.'}</p>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Leads owned by"><select className={inputCls} value={from} onChange={e => { setFrom(e.target.value); setPicked([]); }}><option value="">Everyone</option>{d.role === 'admin' && <option value="__none">Unassigned (new website leads)</option>}{people.map(p => <option key={p.user_id} value={p.user_id}>{name(p.user_id)}</option>)}</select></Field>
        <Field label="Reason (saved in history)"><input className={inputCls} maxLength={300} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. New leads for this week, BDE on leave" /></Field></div>
      <fieldset className="mt-3"><legend className="text-xs font-semibold">Give to {targets.length > 1 ? `(shared equally among ${targets.length})` : ''}</legend>
        <div className="mt-2 flex flex-wrap gap-2">{receivers.map(id => { const on = targets.includes(id); const m = d.members.find(x => x.user_id === id); return <label key={id} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${on ? 'border-primary bg-primary/10 font-semibold' : 'border-border'}`}><input type="checkbox" className="size-3.5" checked={on} onChange={e => setTargets(e.target.checked ? [...targets, id] : targets.filter(x => x !== id))} />{id === d.userId ? 'Me (keep)' : `${name(id)}${m ? ` · ${m.role}` : ''}`}</label>; })}</div></fieldset>
      <div className="mt-3 max-h-80 overflow-y-auto rounded-md border border-border">{!openLeads.length ? <Empty>No open leads.</Empty> : <ul className="divide-y divide-border text-sm">{openLeads.map(l => <li key={l.id}><label className="flex items-center gap-3 px-3 py-2"><input type="checkbox" checked={picked.includes(l.id)} onChange={e => setPicked(e.target.checked ? [...picked, l.id] : picked.filter(x => x !== l.id))} /><span className="flex-1">{l.title} · {money(l.amount)}</span><span className="text-xs text-muted-foreground">{l.owner_id ? name(l.owner_id) : 'Unassigned'}</span></label></li>)}</ul>}</div>
      <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setPicked(openLeads.map(l => l.id))}>Select all ({openLeads.length})</Button>
        <Button size="sm" disabled={a.busy || !picked.length || !targets.length || reason.trim().length < 3} onClick={() => a.run(async () => {
          for (const [owner, leads] of splitEvenly(openLeads.filter(l => picked.includes(l.id)).map(l => l.id), targets)) {
            if (!leads.length) continue;
            // Admin keeping leads: admins have no CRM membership, so each lead is assigned to them one by one.
            if (d.role === 'admin' && owner === d.userId) { for (const id of leads) await ok(supabase.rpc('crm_assign_lead', { _lead: id, _owner: owner })); }
            else await ok(supabase.rpc('crm_reassign_leads', { _leads: leads, _owner: owner, _reason: reason }));
          }
          setPicked([]); setReason('');
        }, `${picked.length} lead${picked.length === 1 ? '' : 's'} given to ${targets.length === 1 ? (targets[0] === d.userId ? 'you' : name(targets[0]!)) : `${targets.length} people`}.`)}>Give {picked.length || ''} lead{picked.length === 1 ? '' : 's'}</Button>
        {reason.trim().length < 3 && picked.length > 0 && <span className="self-center text-xs text-muted-foreground">Write a short reason first.</span>}</div>
      <Status a={a} /></Panel>
    <Panel title="Reassignment history">{!d.assignments.length ? <Empty>No reassignments yet.</Empty> : <Table head={['When', 'Lead', 'From', 'To', 'By', 'Reason']}>{d.assignments.slice(0, 200).map(x => <tr key={x.id}><Td>{new Date(x.created_at).toLocaleString('en-IN')}</Td><Td>{d.leads.find(l => l.id === x.lead_id)?.title ?? 'Lead'}</Td><Td>{x.from_owner ? name(x.from_owner) : 'Unassigned'}</Td><Td>{x.to_owner ? name(x.to_owner) : 'Unassigned'}</Td><Td>{x.changed_by ? name(x.changed_by) : 'System'}</Td><Td className="text-xs">{x.reason || '—'}</Td></tr>)}</Table>}</Panel>
  </div>;
}

/* ------------------------------ Coaching & training ------------------------------ */
const coachKinds = { coaching: 'Coaching', training: 'Training', review: 'Performance review', warning: 'Warning' } as const;
export function CoachingPanel({ d, name }: { d: Data; name: NameFn }) {
  const a = useCrmAction(); const canCoach = d.role === 'BDM' || d.role === 'admin'; const team = teamMembers(d);
  const blank = { employee: '', kind: 'coaching', topic: '', date: d.today, notes: '', actions: '', follow: '' }; const [f, setF] = useState(blank);
  const mine = d.coaching.filter(n => n.employee_id === d.userId); const given = d.coaching.filter(n => n.employee_id !== d.userId);
  function submit(e: FormEvent) { e.preventDefault(); a.run(async () => { await ok(supabase.from('crm_coaching_notes').insert({ employee_id: f.employee, coach_id: d.userId, kind: f.kind, topic: f.topic, session_date: f.date, notes: f.notes, action_items: f.actions, follow_up_date: f.follow || null })); setF(blank); }, 'Session saved. The employee can see and acknowledge it.'); }
  const card = (n: Data['coaching'][number], own: boolean) => <article key={n.id} className="rounded-lg border border-border p-4 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><b>{n.topic}</b><span className="flex gap-1"><Pill tone={n.kind === 'warning' ? 'danger' : n.kind === 'training' ? 'info' : 'muted'}>{coachKinds[n.kind as keyof typeof coachKinds] ?? n.kind}</Pill><Pill tone={n.acknowledged_at ? 'success' : 'warning'}>{n.acknowledged_at ? 'Acknowledged' : 'Not acknowledged'}</Pill></span></div>
    <p className="text-xs text-muted-foreground">{own ? `From ${name(n.coach_id)}` : `${name(n.employee_id)} · by ${name(n.coach_id)}`} · {fmtDate(n.session_date)}{n.follow_up_date ? ` · follow-up ${fmtDate(n.follow_up_date)}` : ''}</p>
    {n.notes && <p className="mt-2 whitespace-pre-wrap">{n.notes}</p>}{n.action_items && <p className="mt-2 whitespace-pre-wrap"><b>Action items:</b> {n.action_items}</p>}
    {own && !n.acknowledged_at && <Button size="sm" className="mt-3" disabled={a.busy} onClick={() => a.run(() => ok(supabase.rpc('crm_ack_coaching', { _id: n.id })), 'Thanks — acknowledged.')}><Check className="size-3.5" />I have read this</Button>}
  </article>;
  return <div className="space-y-6">
    {canCoach && team.length > 0 && <Panel title={<span className="flex items-center gap-2"><MessageSquareText className="size-4" />Log a coaching or training session</span>}>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Employee"><select required className={inputCls} value={f.employee} onChange={e => setF({ ...f, employee: e.target.value })}><option value="">Choose…</option>{team.map(m => <option key={m.user_id} value={m.user_id}>{name(m.user_id)}</option>)}</select></Field>
        <Field label="Type"><select className={inputCls} value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}>{Object.entries(coachKinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Topic"><input required minLength={2} maxLength={200} className={inputCls} value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })} placeholder="e.g. Handling price objections" /></Field>
        <Field label="Session date"><input type="date" required max={d.today} className={inputCls} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Notes"><textarea maxLength={3000} className={areaCls} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></Field>
        <Field label="Action items"><textarea maxLength={2000} className={areaCls} value={f.actions} onChange={e => setF({ ...f, actions: e.target.value })} /></Field>
        <Field label="Follow-up date (optional)"><input type="date" className={inputCls} value={f.follow} onChange={e => setF({ ...f, follow: e.target.value })} /></Field>
        <div className="flex items-end"><Button type="submit" disabled={a.busy}>Save session</Button></div>
      </form><Status a={a} /></Panel>}
    {d.role !== 'admin' && <Panel title="My coaching & training">{!mine.length ? <Empty>No sessions yet.</Empty> : <div className="grid gap-3">{mine.map(n => card(n, true))}</div>}{!canCoach && <Status a={a} />}</Panel>}
    {canCoach && <Panel title="Sessions with my team">{!given.length ? <Empty>No sessions logged yet.</Empty> : <div className="grid gap-3">{given.map(n => card(n, false))}</div>}</Panel>}
  </div>;
}

/* ------------------------------ Incentive calculator ------------------------------ */
export function IncentiveCalculator({ d }: { d: Data }) {
  const role = d.role === 'BDM' ? 'BDM' : 'BDE';
  const plan = d.plans.find(p => p.role === role); const target = d.targets.filter(t => t.owner_id === d.userId && t.month.startsWith(d.today.slice(0, 7))).reduce((n, t) => n + Number(t.revenue_target), 0);
  const [rev, setRev] = useState(''); const [tgt, setTgt] = useState(target ? String(target) : '');
  const r = calculateIncentive(plan ? { active: plan.active, slabs: readSlabs(plan.slabs) } : null, Number(rev) || 0, Number(tgt) || 0);
  return <Panel title="Incentive calculator (what if)">
    <p className="mb-3 text-sm text-muted-foreground">Try a collection amount to see the incentive under the current {role} plan. This is only an estimate — real incentive uses verified collections.</p>
    <div className="grid gap-3 sm:grid-cols-3"><Field label="Verified collection (₹)"><input type="number" min={0} className={inputCls} value={rev} onChange={e => setRev(e.target.value)} /></Field><Field label="Monthly target (₹)"><input type="number" min={0} className={inputCls} value={tgt} onChange={e => setTgt(e.target.value)} /></Field>
      <div className="rounded-lg border border-border bg-surface p-3"><p className="text-[11px] text-muted-foreground">Estimated incentive</p><p className="text-2xl font-bold tabular-nums">{money(r.incentive)}</p><p className="text-xs text-muted-foreground">{r.status === 'no_plan' ? 'Admin has not switched on a plan.' : r.status === 'no_target' ? 'Enter a target.' : r.status === 'below_first_slab' ? `${money(r.nextGap)} more to reach ${r.next?.min}%` : `${r.achievement}% of target · ${r.slab?.rate}% slab`}</p></div></div>
  </Panel>;
}
