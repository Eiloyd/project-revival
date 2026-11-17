import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowUp, Headset } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/shell';
import { Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { dateTime } from '@/lib/requests';
import { averageHours, slaState, teamStats } from '@/lib/support/sla';
import { channels, label, statuses, useNow, useSupport, type Ticket } from './data';
import { TicketDetail, SlaPill } from './ticket-detail';
import { TicketAiAssistant } from './ticket-ai-assistant';
import { LogTicket } from './log-ticket';

const duration = (value: number | null) => value === null ? '—' : `${value.toFixed(1)} h`;
export function SupportDashboard({ uid, section = 's-inbox' }: { uid: string; section?: string }) {
  const data = useSupport(uid); const now = useNow();
  const [selected, setSelected] = useState<string | null>(null); const [channel, setChannel] = useState('all'); const [status, setStatus] = useState('all'); const [owner, setOwner] = useState('all'); const [search, setSearch] = useState('');
  const [error, setError] = useState<unknown>(null); const [pending, setPending] = useState<string | null>(null);
  const internal = useQuery({ queryKey: ['support-internal', uid], enabled: section === 's-inbox', queryFn: async () => {
    const { data, error } = await supabase.from('requests').select('id,code,title,description,status,applicant_id,applicant_name,created_at,type').in('type', ['technical_ticket', 'support_ticket']).order('created_at', { ascending: false }).limit(200); if (error) throw error; return data;
  }, refetchInterval: 60_000 });
  const tickets = data.tickets.data ?? []; const team = data.team.data ?? []; const manager = data.manager.data === true;
  const active = tickets.filter(t => !['resolved', 'closed'].includes(t.status));
  const selectedTicket = tickets.find(t => t.id === selected);
  const ownerName = (id: string | null) => id ? team.find(m => m.user_id === id)?.full_name ?? 'Assigned' : 'Unassigned';
  const breached = active.filter(t => slaState(t, now) === 'breached'); const atRisk = active.filter(t => slaState(t, now) === 'at_risk');
  async function escalate(t: Ticket) { setPending(t.id); setError(null); try { await data.save(t.id, { escalation_level: Math.min(3, t.escalation_level + 1) }); } catch (e) { setError(e); } finally { setPending(null); } }
  const incidents = () => { const cols: [string, Ticket[], string][] = [['SLA breached', breached, 'border-destructive'], ['At risk (due in 2 h)', atRisk, 'border-[var(--dash-warning)]'], ['On track', active.filter(t => slaState(t, now) !== 'breached' && slaState(t, now) !== 'at_risk' && ['urgent', 'high'].includes(t.priority)), 'border-border']];
    const left = (t: Ticket) => { if (!t.due_at) return 'No deadline'; const m = Math.round((new Date(t.due_at).getTime() - now) / 60000); const a = Math.abs(m); const txt = a >= 60 ? `${Math.floor(a / 60)} h ${a % 60} m` : `${a} m`; return m < 0 ? `${txt} overdue` : `${txt} left`; };
    return <Panel title="Incident board"><p className="mb-4 text-sm text-muted-foreground">Live view of breached, at-risk and open urgent/high tickets. Refreshes every minute. New tickets go automatically to the support executive with the fewest open tickets.</p><div className="grid gap-4 lg:grid-cols-3">{cols.map(([name, rows, border]) => <section key={name} className={`rounded-md border-t-4 ${border} bg-muted/30 p-3`}><h3 className="mb-3 text-sm font-semibold">{name} <span className="text-muted-foreground">({rows.length})</span></h3>{!rows.length ? <p className="text-xs text-muted-foreground">Nothing here.</p> : <ul className="grid gap-2">{[...rows].sort((a, b) => (a.due_at ?? 'z').localeCompare(b.due_at ?? 'z')).map(t => <li key={t.id} className="dash-card p-3 text-sm"><button className="font-mono text-xs text-primary underline" onClick={() => setSelected(t.id)}>{t.ticket_code}</button> <Pill>{label(t.priority)}</Pill><p className="mt-1 font-medium">{t.subject}</p><p className="text-xs text-muted-foreground">{ownerName(t.assigned_to)} · {left(t)}{t.escalation_level ? ` · escalated L${t.escalation_level}` : ''}</p>{t.escalation_level < 3 && <Button size="sm" variant="outline" className="mt-2" disabled={pending === t.id} onClick={() => void escalate(t)}><ArrowUp className="size-3" />Escalate</Button>}</li>)}</ul>}</section>)}</div></Panel>; };
  const table = (rows: Ticket[], refund = false, escalation = false) => !rows.length ? <Empty>No matching tickets.</Empty> : <Table head={['Ticket / channel', 'Customer / subject', 'Owner', 'Status / SLA', refund ? 'Refund / Finance' : 'Priority / escalation', 'Actions']}>{rows.map(t => <tr key={t.id}>
    <Td><button className="font-mono text-xs text-primary underline" onClick={() => setSelected(t.id)}>{t.ticket_code}</button><div><Pill>{channels[t.channel as keyof typeof channels] ?? t.channel}</Pill></div><span className="text-xs text-muted-foreground">{dateTime(t.created_at)}</span></Td>
    <Td><b>{t.full_name}</b><p>{t.subject}</p><span className="text-xs text-muted-foreground">{label(t.request_type)}</span></Td><Td>{ownerName(t.assigned_to)}</Td><Td><Pill>{label(t.status)}</Pill><div><SlaPill ticket={t} now={now} /></div>{t.due_at && <span className="text-xs text-muted-foreground">{dateTime(t.due_at)}</span>}</Td>
    <Td>{refund ? <><p>INR {t.refund_amount ?? '—'}</p><Pill>{label(t.finance_status)}</Pill></> : <><Pill tone={t.priority === 'urgent' ? 'danger' : 'muted'}>{t.priority}</Pill><p className="text-xs">Level {t.escalation_level}/3</p></>}</Td>
    <Td><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setSelected(t.id)}>{refund && t.finance_status === 'none' ? 'Hand off to Finance' : 'Details'}</Button>{escalation && <Button size="sm" variant="outline" disabled={pending !== null || t.escalation_level >= 3} onClick={() => void escalate(t)}><ArrowUp className="size-4" />Escalate</Button>}</div></Td>
  </tr>)}</Table>;
  function overview() {
    const today = new Date(now).toISOString().slice(0, 10);
    const metrics: [string, string | number][] = [['Open', active.length], ['Unassigned', active.filter(t => !t.assigned_to).length], ['SLA breached', breached.length], ['Due within 2 h', atRisk.length], ['Escalated', active.filter(t => t.escalation_level > 0).length], ['Resolved today', tickets.filter(t => ['resolved', 'closed'].includes(t.status) && t.resolved_at?.startsWith(today)).length], ['Avg first response', duration(averageHours(tickets, 'first_response_at'))], ['Refunds with Finance', tickets.filter(t => ['sent', 'approved'].includes(t.finance_status)).length]];
    return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([name, value]) => <KpiCard key={name} label={name} value={value} icon={name === 'SLA breached' ? AlertTriangle : Headset} tone={name === 'SLA breached' ? 'danger' : 'default'} />)}</div><Panel title="Manager alerts"><p className="mb-3 text-xs text-muted-foreground">Breached, unassigned or urgent active tickets. Times use UTC.</p>{table(active.filter(t => slaState(t, now) === 'breached' || !t.assigned_to || t.priority === 'urgent').sort((a, b) => (a.due_at ?? 'z').localeCompare(b.due_at ?? 'z')))}</Panel></>;
  }
  function inbox() {
    const needle = search.trim().toLowerCase();
    const customers = tickets.filter(t => (channel === 'all' || channel === t.channel) && (status === 'all' || status === t.status) && (owner === 'all' || (owner === 'mine' ? t.assigned_to === uid : !t.assigned_to)) && `${t.ticket_code} ${t.full_name} ${t.email} ${t.phone} ${t.subject} ${t.description}`.toLowerCase().includes(needle));
    const requests = (internal.data ?? []).filter(r => (channel === 'all' || channel === 'internal') && (status === 'all' || status === r.status) && owner === 'all' && `${r.code} ${r.applicant_name} ${r.title} ${r.description}`.toLowerCase().includes(needle));
    const rows = [...customers.map(t => ({ id: t.id, created: t.created_at, customer: t, request: null })), ...requests.map(r => ({ id: r.id, created: r.created_at, customer: null, request: r }))].sort((a, b) => b.created.localeCompare(a.created));
    return <Panel title="Unified inbox"><div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Field label="Channel"><select className={inputCls} value={channel} onChange={e => setChannel(e.target.value)}><option value="all">All channels</option>{Object.entries(channels).map(([v, name]) => <option key={v} value={v}>{name}</option>)}<option value="internal">Internal</option></select></Field>
      <Field label="Status"><select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option>{[...statuses, 'pending', 'approved', 'rejected', 'cancelled', 'paid'].map(s => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
      <Field label="Owner"><select className={inputCls} value={owner} onChange={e => setOwner(e.target.value)}><option value="all">Everyone</option><option value="mine">Mine</option><option value="unassigned">Unassigned</option></select></Field>
      <Field label="Search tickets"><input type="search" className={inputCls} value={search} onChange={e => setSearch(e.target.value)} /></Field>
    </div><p className="mb-3 text-xs text-muted-foreground">Internal requests are the latest 200 visible to your account. They use approval routing, not individual ticket ownership, and appear under Everyone. Manage them in Team tickets or All internal tickets.</p><ErrorNote error={internal.error} />
      {internal.isPending ? <Loading /> : !rows.length ? <Empty>No matching tickets.</Empty> : <Table head={['Ticket', 'Channel', 'From / subject', 'Status', 'Owner', 'Created']}>{rows.map(row => row.customer ? <tr key={`customer-${row.id}`}><Td><button className="font-mono text-xs text-primary underline" onClick={() => setSelected(row.id)}>{row.customer.ticket_code}</button></Td><Td><Pill>{channels[row.customer.channel as keyof typeof channels] ?? row.customer.channel}</Pill></Td><Td>{row.customer.full_name}<p>{row.customer.subject}</p></Td><Td><Pill>{label(row.customer.status)}</Pill><SlaPill ticket={row.customer} now={now} /></Td><Td>{ownerName(row.customer.assigned_to)}</Td><Td>{dateTime(row.created)}</Td></tr>
        : row.request && <tr key={`internal-${row.id}`}><Td>{row.request.code}</Td><Td><Pill tone="info">Internal</Pill></Td><Td>{row.request.applicant_name}<p>{row.request.title}</p><p className="text-xs text-muted-foreground">{label(row.request.type)}</p></Td><Td><Pill>{label(row.request.status)}</Pill></Td><Td>Approval routing</Td><Td>{dateTime(row.created)}</Td></tr>)}</Table>}
    </Panel>;
  }
  function performance() {
    const result = teamStats(tickets, team.filter(m => manager || m.user_id === uid), now, new Date(now).toISOString().slice(0, 7));
    const max = Math.max(1, ...result.members.map(m => m.assignedOpen));
    return <Panel title={manager ? 'Team performance' : 'My performance'}><p className="mb-4 text-sm text-muted-foreground">Unassigned open: {result.unassigned}. Current owner attribution; resolved this month uses UTC. Averages include completed timestamp samples only. SLA breaches and escalations count active tickets.</p>
      {!result.members.length ? <Empty>No team profile available.</Empty> : <Table head={['Executive', 'Assigned open / workload', 'Resolved this month', 'SLA breaches', 'Avg response', 'Avg resolution', 'Escalated']}>{result.members.map(m => <tr key={m.user_id}><Td>{m.full_name}<p className="text-xs text-muted-foreground">{m.level}{!m.active ? ' · inactive' : ''}</p></Td><Td>{m.assignedOpen}<progress aria-label={`${m.full_name} open workload`} className="mt-1 block h-2 w-full accent-primary" value={m.assignedOpen} max={max} /></Td><Td>{m.resolvedThisMonth}</Td><Td>{m.slaBreaches}</Td><Td>{duration(m.avgFirstResponseHours)}</Td><Td>{duration(m.avgResolutionHours)}</Td><Td>{m.escalatedCount}</Td></tr>)}</Table>}
    </Panel>;
  }
  return <div className="grid gap-5"><ErrorNote error={data.tickets.error || data.team.error || data.manager.error || error} />
    {data.tickets.isPending || data.team.isPending || data.manager.isPending ? <Loading /> : data.tickets.isError ? <Empty>Tickets could not be loaded. Please try again.</Empty> : <>
      {section === 's-overview' ? overview() : section === 's-log' ? <LogTicket onCreated={data.refresh} /> : section === 's-sla' ? <Panel title="SLA & escalations"><p className="mb-4 text-sm text-muted-foreground">SLA rules: Urgent 4 h · High 24 h · Normal 48 h. At risk = due within 2 hours. Resolved and closed tickets are excluded.</p>{table([...breached, ...atRisk].sort((a, b) => (a.due_at ?? 'z').localeCompare(b.due_at ?? 'z')), false, true)}</Panel> : section === 's-refunds' ? <Panel title="Cancellations & refunds"><p className="mb-4 text-sm text-muted-foreground">Open a ticket to view the Finance status timeline or hand off a refund. Finance approval and payment sync automatically.</p>{table(tickets.filter(t => ['cancellation', 'refund'].includes(t.request_type)), true)}</Panel> : section === 's-incidents' ? incidents() : section === 's-team' ? performance() : section === 's-ai' ? <TicketAiAssistant /> : inbox()}
      {selectedTicket && <TicketDetail key={selectedTicket.id} ticket={selectedTicket} uid={uid} data={data} now={now} onClose={() => setSelected(null)} />}
    </>}
  </div>;
}
