import { useMemo, useState } from 'react';
import { csvCell } from '@/lib/share/whatsapp';
import { AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, ErrorNote, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { biggestBottleneck, delayReport, type StepStats, type Waiting } from '@/lib/manpower/delays';
import { useMpEvents, type Client, type Manpower, type MpCandidate, type MpDeployment, type MpInvoice, type MpTimesheet } from './data';

type Props = { clients: Client[]; reqs: Manpower[]; cands: MpCandidate[]; deps: MpDeployment[]; ts: MpTimesheet[]; inv: MpInvoice[] };
const periods = [['30', 'Last 30 days'], ['90', 'Last 90 days'], ['365', 'Last 12 months'], ['all', 'All time']] as const;
const days = (n: number | null) => n == null ? '—' : `${n} day${n === 1 ? '' : 's'}`;

/** Ventures desk: how long each manpower step takes and which work is waiting too long, from the database step log. */
export function ManpowerDelays({ clients, reqs, cands, deps, ts, inv }: Props) {
  const events = useMpEvents();
  const [client, setClient] = useState(''); const [period, setPeriod] = useState<string>('90');
  const stats = useMemo(() => {
    const now = new Date();
    const since = period === 'all' ? undefined : new Date(now.getTime() - Number(period) * 864e5);
    return delayReport(events.data ?? [], now, { ...(client ? { clientId: client } : {}), ...(since ? { since } : {}) });
  }, [events.data, client, period]);
  if (events.isPending) return <Loading />;
  if (events.error) return <ErrorNote error={events.error} />;
  const cName = (id: string) => clients.find(c => c.id === id)?.name ?? '—';
  const describe = (w: Waiting) => {
    if (w.step === 'sourcing') { const r = reqs.find(x => x.id === w.key); return r ? `${r.role_title} (${r.headcount} needed)` : 'Requirement'; }
    if (w.step === 'client_decision' || w.step === 'placement') { const c = cands.find(x => x.id === w.key); const r = reqs.find(x => x.id === c?.requirement_id); return c ? `${c.full_name}${r ? ` · ${r.role_title}` : ''}` : 'Candidate'; }
    if (w.step === 'attendance') { const t = ts.find(x => x.id === w.key); const d = deps.find(x => x.id === t?.deployment_id); return t ? `${d?.worker_name ?? 'Staff'} · ${new Date(`${t.month.slice(0, 7)}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : 'Timesheet'; }
    const i = inv.find(x => x.id === w.key); return i ? `${i.invoice_no} · ₹${Number(i.total).toLocaleString('en-IN')}` : 'Invoice';
  };
  const stepLabel = (k: string) => stats.find(s => s.key === k)?.label ?? k;
  const waiting = stats.flatMap(s => s.waiting).sort((a, b) => Number(b.delayed) - Number(a.delayed) || b.days - a.days);
  const top = biggestBottleneck(stats);
  const totalDelayed = stats.reduce((n, s) => n + s.delayedNow, 0);
  const exportCsv = () => {
    const rows = [['Step', 'Waiting on', 'Limit (days)', 'Finished', 'Average days', 'Median days', 'Longest days', 'On time %', 'Waiting now', 'Delayed now'],
      ...stats.map(s => [s.label, s.waitingOn, s.limitDays, s.done, s.avgDays ?? '', s.medianDays ?? '', s.maxDays ?? '', s.onTimePercent ?? '', s.waiting.length, s.delayedNow]), [],
      ['Waiting item', 'Step', 'Client', 'Waiting since', 'Days', 'Delayed'], ...waiting.map(w => [describe(w), stepLabel(w.step), cName(w.client_id), new Date(w.since).toLocaleDateString('en-IN'), w.days, w.delayed ? 'Yes' : 'No'])];
    const text = rows.map(r => r.map(v => csvCell(v)).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv' })); const a = document.createElement('a'); a.href = url; a.download = 'manpower-delays.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return <div className="grid min-w-0 gap-5">
    <Panel title="Where manpower work gets delayed" actions={<>
      <select aria-label="Client" className={`${inputCls} w-auto`} value={client} onChange={e => setClient(e.target.value)}><option value="">All clients</option>{clients.filter(c => reqs.some(r => r.client_id === c.id) || deps.some(d => d.client_id === c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select aria-label="Period" className={`${inputCls} w-auto`} value={period} onChange={e => setPeriod(e.target.value)}>{periods.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <Button size="sm" variant="outline" onClick={exportCsv}><Download className="size-3.5" />Export</Button></>}>
      {top ? <div role="status" className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-surface p-3 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--dash-danger)' }} /><p><b>Biggest hold-up: {top.label}.</b> {top.delayedNow ? `${top.delayedNow} item${top.delayedNow === 1 ? ' is' : 's are'} waiting longer than ${top.limitDays} days` : `Taking ${top.avgDays} days on average against a ${top.limitDays}-day limit`} — waiting on {top.waitingOn.toLowerCase()}. {totalDelayed > (top.delayedNow || 0) ? `${totalDelayed} delayed items in total.` : ''}</p></div>
        : <p className="mb-4 text-sm text-muted-foreground">Nothing is running late right now.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{stats.map(s => <StepCard key={s.key} s={s} />)}</div>
      <p className="mt-3 text-xs text-muted-foreground">Times are measured from the moment each step happened, recorded automatically when records change. "Delayed" means waiting longer than the limit on each card. Steps that finished before tracking started use the record's last update date.</p>
    </Panel>
    <Panel title={`Waiting now (${waiting.length})`}>
      {!waiting.length ? <Empty>No work is waiting on any step.</Empty> : <Table head={['Item', 'Step', 'Client', 'Waiting since', 'Days', '']}>{waiting.slice(0, 100).map(w => <tr key={`${w.step}-${w.key}`}>
        <Td><b>{describe(w)}</b></Td><Td className="text-xs">{stepLabel(w.step)}</Td><Td>{cName(w.client_id)}</Td>
        <Td className="text-xs">{new Date(w.since).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Td><Td className="tabular-nums">{w.days}</Td>
        <Td><Pill tone={w.delayed ? 'danger' : 'muted'}>{w.delayed ? 'Delayed' : 'Within limit'}</Pill></Td></tr>)}</Table>}
    </Panel>
  </div>;
}

function StepCard({ s }: { s: StepStats }) {
  const tone = s.delayedNow ? 'danger' : s.avgDays != null && s.avgDays > s.limitDays ? 'warning' : 'success';
  return <div className="dash-card p-4" data-step={s.key}>
    <p className="text-xs font-semibold">{s.label}</p><p className="text-[11px] text-muted-foreground">Waiting on {s.waitingOn.toLowerCase()} · limit {s.limitDays} days</p>
    <p className="mt-2 text-2xl font-bold tabular-nums">{days(s.avgDays)}</p><p className="text-[11px] text-muted-foreground">average · median {days(s.medianDays)} · longest {days(s.maxDays)}</p>
    <div className="mt-2 flex flex-wrap gap-1.5"><Pill tone={tone}>{s.delayedNow} delayed now</Pill><Pill tone="muted">{s.waiting.length} waiting</Pill>{s.onTimePercent != null && <Pill tone="info">{s.onTimePercent}% on time</Pill>}</div>
    <p className="mt-1 text-[11px] text-muted-foreground">{s.done} finished in this period</p>
  </div>;
}
