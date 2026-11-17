import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill } from '@/components/work/common';
import { dateTime } from '@/lib/requests';
import { ticketCategories } from '@/lib/submission-schemas';
import { requestTypes } from '@/lib/support/ticket-triage';
import { hoursBetween, slaState } from '@/lib/support/sla';
import { channels, label, statuses, type SupportData, type Ticket, type TicketPatch } from './data';
import { TicketAiAssistant } from './ticket-ai-assistant';

export function SlaPill({ ticket, now }: { ticket: Ticket; now: number }) {
  const state = slaState(ticket, now);
  return <Pill tone={state === 'breached' ? 'danger' : state === 'at_risk' ? 'warning' : state === 'done' ? 'success' : 'muted'}>{state === 'done' ? 'Done' : !ticket.due_at ? 'No SLA deadline' : state === 'breached' ? `${hoursBetween(ticket.due_at, now).toFixed(1)} h overdue` : `${hoursBetween(now, ticket.due_at).toFixed(1)} h remaining`}</Pill>;
}
export function TicketDetail({ ticket: t, uid, data, now, onClose }: { ticket: Ticket; uid: string; data: SupportData; now: number; onClose: () => void }) {
  const [resolution, setResolution] = useState(t.resolution); const [privateNotes, setPrivateNotes] = useState(t.private_notes);
  const [amount, setAmount] = useState(''); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [notice, setNotice] = useState('');
  const [ai, setAi] = useState(false);
  const history = useQuery({ queryKey: ['ticket-history', uid, t.id], queryFn: async () => {
    const rows = []; for (let offset = 0; ; offset += 500) { const { data, error } = await supabase.from('customer_ticket_events').select('*').eq('ticket_id', t.id).order('created_at', { ascending: false }).order('id').range(offset, offset + 499); if (error) throw error; rows.push(...data); if (data.length < 500) return rows; }
  } });
  const manager = data.manager.data === true;
  async function action(fn: () => Promise<void>, message = 'Saved.') { setBusy(true); setError(null); setNotice(''); try { await fn(); setNotice(message); } catch (e) { setError(e); } finally { setBusy(false); } }
  const save = (patch: TicketPatch) => action(() => data.save(t.id, patch));
  const choose = (title: string, value: string, values: readonly string[], field: 'status' | 'priority' | 'request_type' | 'category') => <Field label={title}><select disabled={busy} className={inputCls} value={value} onChange={e => void save({ [field]: e.target.value })}>{values.map(v => <option key={v} value={v}>{label(v)}</option>)}</select></Field>;
  return <Panel title={`${t.ticket_code} — ${t.subject}`} actions={<Button variant="ghost" aria-label="Close ticket detail" onClick={onClose}><X className="size-4" /></Button>}>
    <div className="grid gap-4"><ErrorNote error={error} />{notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      <div className="flex flex-wrap gap-2"><Pill>{channels[t.channel as keyof typeof channels] ?? t.channel}</Pill><SlaPill ticket={t} now={now} /><Pill>Escalation {t.escalation_level}/3</Pill></div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Customer</dt><dd>{t.full_name} · {t.email} · {t.phone}</dd></div><div><dt className="text-muted-foreground">Reference</dt><dd>{t.customer_reference || '—'}</dd></div><div><dt className="text-muted-foreground">Created / updated</dt><dd>{dateTime(t.created_at)} / {dateTime(t.updated_at)}</dd></div><div><dt className="text-muted-foreground">SLA deadline</dt><dd>{t.due_at ? dateTime(t.due_at) : '—'}</dd></div><div><dt className="text-muted-foreground">First response / resolved</dt><dd>{t.first_response_at ? dateTime(t.first_response_at) : '—'} / {t.resolved_at ? dateTime(t.resolved_at) : '—'}</dd></div><div><dt className="text-muted-foreground">Last escalated</dt><dd>{t.escalated_at ? dateTime(t.escalated_at) : '—'}</dd></div></dl>
      <p className="whitespace-pre-wrap text-sm">{t.description}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {manager ? <Field label="Owner"><select className={inputCls} value={t.assigned_to ?? ''} disabled={busy} onChange={e => void save({ assigned_to: e.target.value || null })}><option value="">Unassigned</option>{t.assigned_to && !data.team.data?.some(m => m.active && m.user_id === t.assigned_to) && <option value={t.assigned_to}>Inactive / former owner</option>}{data.team.data?.filter(m => m.active).map(m => <option key={m.user_id} value={m.user_id}>{m.full_name} ({m.level})</option>)}</select></Field>
          : <div className="grid gap-2 text-sm"><span>Owner: {t.assigned_to === uid ? 'Mine' : data.team.data?.find(m => m.user_id === t.assigned_to)?.full_name ?? (t.assigned_to ? 'Assigned' : 'Unassigned')}</span>{t.assigned_to !== uid && <Button disabled={busy || data.manager.isPending} variant="outline" onClick={() => void save({ assigned_to: uid })}>Take it</Button>}</div>}
        {choose('Status', t.status, statuses, 'status')}{choose('Priority', t.priority, ['normal', 'high', 'urgent'], 'priority')}{choose('Request type', t.request_type, requestTypes, 'request_type')}
        {choose('Category', t.category, ticketCategories.map(c => c.value), 'category')}
        <div className="flex items-end gap-2"><Button disabled={busy || t.escalation_level >= 3} variant="outline" onClick={() => void save({ escalation_level: Math.min(3, t.escalation_level + 1) })}><ArrowUp className="size-4" />Escalate</Button>{manager && <Button disabled={busy || t.escalation_level <= 0} variant="outline" onClick={() => void save({ escalation_level: Math.max(0, t.escalation_level - 1) })}>Lower</Button>}</div>
      </div>
      <Field label="Resolution / reply note"><textarea className={areaCls} maxLength={4000} value={resolution} onChange={e => setResolution(e.target.value)} /></Field>
      <Field label="Private notes (staff only)"><textarea className={areaCls} maxLength={4000} value={privateNotes} onChange={e => setPrivateNotes(e.target.value)} /></Field>
      <p className="text-xs text-muted-foreground">Saving a reply records a note; it does not send an email.</p>
      <div className="flex gap-2"><Button disabled={busy} onClick={() => void save({ resolution, private_notes: privateNotes })}>Save notes</Button><Button variant="outline" onClick={() => setAi(!ai)}>AI suggest</Button></div>
      {ai && <TicketAiAssistant subject={t.subject} description={t.description} onApply={r => data.save(t.id, { category: r.category, priority: r.priority, request_type: r.requestType })} onReply={setResolution} />}
      {['cancellation', 'refund'].includes(t.request_type) && <section className="grid gap-3 rounded-md border border-border p-4"><h3 className="font-semibold">Refund hand-off to Accounts → Finance</h3><Pill>{label(t.finance_status)}</Pill>
        <p className="text-sm">Amount: {t.refund_amount ?? 'Not sent'} · Finance request: {t.finance_request_id ?? '—'}</p>
        <ol aria-label="Finance status timeline" className="flex flex-wrap gap-2 text-xs">{['none', 'sent', 'approved', 'paid'].map(s => <li key={s} className={s === t.finance_status ? 'font-bold text-primary' : 'text-muted-foreground'} aria-current={s === t.finance_status ? 'step' : undefined}>{label(s)} →</li>)}{['rejected', 'cancelled'].includes(t.finance_status) && <li className="font-bold text-destructive">{label(t.finance_status)}</li>}</ol>
        <p className="text-xs text-muted-foreground">Current status above is authoritative; actual transitions appear in history below.</p>
        {t.finance_status === 'none' && <form className="grid gap-3" onSubmit={e => { e.preventDefault(); void action(async () => { const value = Number(amount); if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a positive refund amount.'); const { error } = await supabase.rpc('support_send_refund', { _ticket: t.id, _amount: value, _note: note }); if (error) throw error; await data.refresh(); }, 'Refund sent to Accounts → Finance.'); }}>
          <Field label="Refund amount (INR)"><input required className={inputCls} type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></Field><Field label="Finance note"><textarea required className={areaCls} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></Field><Button disabled={busy} type="submit">Send refund to Finance</Button></form>}
      </section>}
      <section><h3 className="mb-3 font-semibold">Full ticket history</h3><ErrorNote error={history.error} />{history.isPending ? <Loading /> : !history.data?.length ? <Empty>No events yet.</Empty> : <ol className="grid gap-3">{history.data.map(event => <li className="border-l-2 border-border pl-3 text-sm" key={event.id}><b>{label(event.action)}</b> · {event.actor_name} <time className="text-xs text-muted-foreground">{dateTime(event.created_at)}</time><p className="whitespace-pre-wrap">{event.note}</p></li>)}</ol>}</section>
    </div>
  </Panel>;
}
