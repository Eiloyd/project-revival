import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { BadgeCheck, CalendarClock, Clock3, HeartHandshake, IndianRupee, Phone, Plus, Trophy, UserRound, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { KpiCard } from '../dashboard/shell';
import { TargetGauge } from '../dashboard/target-gauge';
import { getCrm, recordCrmCollection, verifyCrmCollection } from '@/lib/crm.functions';
import { downlineOf, teamIdsOf } from '@/lib/crm/hierarchy';
import { calculateIncentive, collectionTotals, readSlabs, volunteerTotals, type IncentiveResult } from '@/lib/crm/incentives';

type Data = Awaited<ReturnType<typeof getCrm>>;
export const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export const modeLabels: Record<string, string> = { upi: 'UPI', bank_transfer: 'Bank transfer', cash: 'Cash', cheque: 'Cheque', card: 'Card', gateway: 'Payment gateway', other: 'Other' };
const input = 'mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm';
export const istToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

/** The person plus their whole active down-line (BDM: BDEs and JBDEs; ASM: BDMs and below; …). */
export function teamOf(d: Data, managerId: string) {
  return teamIdsOf(managerId, d.members);
}
const revenueTarget = (d: Data, ids: string[], month: string) => d.targets.filter(t => ids.includes(t.owner_id) && t.month.startsWith(month)).reduce((n, t) => n + Number(t.revenue_target), 0);
const planFor = (d: Data, role: 'BDE' | 'BDM') => { const p = d.plans.find(p => p.role === role); return p ? { active: p.active, slabs: readSlabs(p.slabs) } : null; };
/**
 * Volunteer-sourced revenue for these people: the fee of every credited referral by a volunteer belonging
 * to the team. Counts toward the monthly target, pays 0% incentive. Zero until
 * database/update-2026-11-17-sales-pay-volunteer-rewards.sql has been run (the function then does not exist).
 */
export const volRevenue = (d: Data, ids: string[] | null, month?: string, day?: string) =>
  d.volunteerRevenue ? volunteerTotals(d.volunteerRevenue, ids, day, month) : { revenue: 0, forms: 0 };

/** BDE: own verified collection vs own target. BDM: team verified collection vs team target. */
export function incentiveFor(d: Data, userId: string, month: string): { role: 'BDE' | 'BDM' | null; result: IncentiveResult | null } {
  const role = d.members.find(m => m.user_id === userId)?.role;
  if (role !== 'BDE' && role !== 'BDM') return { role: null, result: null };
  const ids = role === 'BDM' ? teamOf(d, userId) : [userId];
  const verified = collectionTotals(d.collections, ids, undefined, month).verified;
  return { role, result: calculateIncentive(planFor(d, role), verified, revenueTarget(d, ids, month), volRevenue(d, ids, month).revenue) };
}

export function CollectionKpis({ d, ids }: { d: Data; ids: string[] | null }) {
  const today = istToday();
  const t = collectionTotals(d.collections, ids, today);
  const m = collectionTotals(d.collections, ids, undefined, today.slice(0, 7));
  const v = volRevenue(d, ids, today.slice(0, 7));
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <KpiCard label="Today's verified collection" value={money(t.verified)} note="Counted as collected" icon={BadgeCheck} tone="success" />
    <KpiCard label="Today's unverified collection" value={money(t.unverified)} note="Waiting for Accounts check — not counted yet" icon={Clock3} tone="warning" />
    <KpiCard label="Collected this month" value={money(m.verified)} note="Verified only" icon={IndianRupee} />
    <KpiCard label="Unverified this month" value={money(m.unverified)} note={m.rejected ? `${money(m.rejected)} rejected` : 'Pending verification'} icon={CalendarClock} />
    <KpiCard label="Direct BDE collection" value={money(m.verified)} note="Your own recorded money — incentive is paid on this" icon={UserRound} />
    <KpiCard label="Volunteer-sourced collection" value={money(v.revenue)} note={`${v.forms} credited form(s) · counts toward target, 0% incentive`} icon={HeartHandshake} />
  </div>;
}

function StatusPill({ status }: { status: string }) {
  const cls = status === 'verified' ? 'bg-[color-mix(in_oklab,var(--dash-success)_18%,transparent)] text-[var(--dash-success)]' : status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-[color-mix(in_oklab,var(--dash-warning)_22%,transparent)] text-foreground';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${cls}`}>{status}</span>;
}

export function CollectionsPanel({ d, name, owners, ownerFilter }: { d: Data; name: (id: string | null) => string; owners: string[]; ownerFilter: string }) {
  const qc = useQueryClient();
  const record = useServerFn(recordCrmCollection), verify = useServerFn(verifyCrmCollection);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [show, setShow] = useState(false);
  const m = useMutation({ mutationFn: (fn: () => Promise<unknown>) => fn(), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['crm'] }); setErr(''); }, onError: e => setErr(e.message) });
  const canRecord = d.role !== 'support';
  const leads = d.leads.filter(l => l.stage !== 'lost');
  const rows = d.collections.filter(c => !ownerFilter || c.owner_id === ownerFilter);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); const el = e.currentTarget; setMsg('');
    const leadId = String(f.get('leadId') || '') || null;
    m.mutate(async () => {
      const r = await record({ data: { leadId, ownerId: String(f.get('ownerId') || '') || null, amount: Number(f.get('amount') || 0), date: String(f.get('date')), mode: String(f.get('mode')) as 'upi', reference: String(f.get('reference') ?? ''), payer: String(f.get('payer') ?? ''), note: String(f.get('note') ?? '') } });
      el.reset(); setShow(false); setMsg(`Collection ${r.code} saved as Unverified. It counts once Accounts verifies it.`);
    });
  }
  return <div className="space-y-6">
    <CollectionKpis d={d} ids={ownerFilter ? [ownerFilter] : null} />
    <p className="rounded-lg border border-border bg-surface p-3 text-sm text-muted-foreground">Only <b className="text-foreground">verified</b> collections count as collected money, in targets and in incentives. Accounts or Finance checks each entry against the bank — never the person who recorded it.</p>
    {msg && <p role="status" className="rounded-md border border-[var(--dash-success)] p-3 text-sm">{msg}</p>}
    {err && <p role="alert" className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm">{err}</p>}
    {canRecord && (show ? <form onSubmit={submit} className="dash-card grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
      <h3 className="text-base font-semibold sm:col-span-2">Record a collection</h3>
      <label className="block text-sm font-semibold">Lead (optional)<select name="leadId" className={input} defaultValue=""><option value="">No lead</option>{leads.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
      <label className="block text-sm font-semibold">Credited employee<select name="ownerId" className={input} defaultValue={d.role === 'admin' ? '' : d.userId}>{d.role === 'admin' && <option value="">Lead owner / me</option>}{owners.map(id => <option key={id} value={id}>{name(id)}</option>)}</select></label>
      <label className="block text-sm font-semibold">Amount (₹)<input name="amount" type="number" min={1} step="0.01" required className={input} /></label>
      <label className="block text-sm font-semibold">Date received<input name="date" type="date" required defaultValue={istToday()} max={istToday()} className={input} /></label>
      <label className="block text-sm font-semibold">Payment mode<select name="mode" className={input} defaultValue="upi">{Object.entries(modeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label className="block text-sm font-semibold">UTR / transaction reference<input name="reference" maxLength={80} className={input} placeholder="Required except for cash" /></label>
      <label className="block text-sm font-semibold">Paid by (name)<input name="payer" maxLength={120} className={input} /></label>
      <label className="block text-sm font-semibold">Note<input name="note" maxLength={500} className={input} /></label>
      <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={m.isPending}>{m.isPending ? 'Saving…' : 'Save as unverified'}</Button><Button type="button" variant="outline" onClick={() => setShow(false)}>Cancel</Button></div>
    </form> : <Button onClick={() => setShow(true)}><Plus className="size-4" />Record a collection</Button>)}
    <div className="dash-card overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-border bg-surface"><tr>{['Collection', 'Date', 'Employee', 'Lead', 'Amount', 'Mode / reference', 'Status', ''].map(h => <th key={h} className="px-3 py-3 text-[10px] font-bold uppercase text-muted-foreground">{h}</th>)}</tr></thead>
      <tbody>{rows.map(c => <tr key={c.id} className="border-b border-border align-top">
        <td className="px-3 py-3 font-semibold">{c.code}</td><td className="px-3 py-3">{c.collected_on}</td><td className="px-3 py-3">{name(c.owner_id)}</td>
        <td className="px-3 py-3">{d.leads.find(l => l.id === c.lead_id)?.title ?? '—'}</td><td className="px-3 py-3 font-semibold tabular-nums">{money(Number(c.amount))}</td>
        <td className="px-3 py-3">{modeLabels[c.mode] ?? c.mode}<br /><span className="text-xs text-muted-foreground">{c.reference ?? '—'}{c.payer_name ? ` · ${c.payer_name}` : ''}</span></td>
        <td className="px-3 py-3"><StatusPill status={c.status} />{c.verify_note && <p className="mt-1 max-w-48 text-xs text-muted-foreground">{c.verify_note}</p>}</td>
        <td className="px-3 py-3">{d.role === 'admin' && c.status === 'unverified' && c.recorded_by !== d.userId && c.owner_id !== d.userId && <div className="flex gap-1"><Button size="sm" disabled={m.isPending} onClick={() => m.mutate(() => verify({ data: { id: c.id, approve: true, note: '' } }))}><BadgeCheck className="size-3.5" />Verify</Button><Button size="sm" variant="outline" disabled={m.isPending} onClick={() => { const note = window.prompt('Reason for rejecting this collection'); if (note) m.mutate(() => verify({ data: { id: c.id, approve: false, note } })); }}><XCircle className="size-3.5" />Reject</Button></div>}</td>
      </tr>)}</tbody></table>{!rows.length && <p className="px-4 py-10 text-sm text-muted-foreground">No collections recorded yet.</p>}</div>
  </div>;
}

function IncentiveCard({ title, r, sub }: { title: string; r: IncentiveResult; sub?: ReactNode }) {
  const msg = r.status === 'no_plan' ? 'The admin has not switched on an incentive plan yet.' : r.status === 'no_target' ? 'No revenue target is set for this month, so no incentive is calculated.'
    : r.status === 'below_first_slab' ? `Collect ${money(r.nextGap)} more verified revenue to reach ${r.next?.min}% and start earning.`
    : `${r.slab?.rate}% of verified revenue${r.slab?.bonus ? ` + ${money(r.slab.bonus)} bonus` : ''} (slab from ${r.slab?.min}%).${r.next ? ` ${money(r.nextGap)} more reaches the ${r.next.min}% slab.` : ''}`;
  return <article className="dash-card p-5">
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Trophy className="size-4 text-primary" />{title}</p>
    <p className="mt-2 text-3xl font-bold tabular-nums">{money(r.incentive)}</p>
    <p className="mt-1 text-sm text-muted-foreground">{msg}</p>
    <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><div><dt className="text-[11px] text-muted-foreground">Verified revenue</dt><dd className="font-semibold tabular-nums">{money(r.revenue)}</dd></div><div><dt className="text-[11px] text-muted-foreground">Volunteer-sourced</dt><dd className="font-semibold tabular-nums">{money(r.volunteerRevenue)}</dd></div><div><dt className="text-[11px] text-muted-foreground">Target</dt><dd className="font-semibold tabular-nums">{r.target ? money(r.target) : 'Not set'}</dd></div><div><dt className="text-[11px] text-muted-foreground">Achieved</dt><dd className="font-semibold tabular-nums">{r.target ? `${r.achievement}%` : '—'}</dd></div></dl>
    {sub}
  </article>;
}

export function IncentivePanel({ d, name }: { d: Data; name: (id: string | null) => string }) {
  const [month, setMonth] = useState(istToday().slice(0, 7));
  const mine = incentiveFor(d, d.userId, month);
  const below = downlineOf(d.userId, d.members);
  const people = d.members.filter(m => m.active && (m.role === 'BDE' || m.role === 'BDM') && (d.role === 'admin' || below.includes(m.user_id)));
  const slabTable = (role: 'BDE' | 'BDM') => { const p = planFor(d, role); const slabs = p?.slabs ?? []; return <div className="dash-card p-4"><h4 className="text-sm font-semibold">{role} plan {p?.active ? '' : <span className="ml-1 text-xs font-normal text-muted-foreground">(not active)</span>}</h4>{slabs.length ? <table className="mt-2 w-full text-sm"><thead><tr className="text-left text-[11px] uppercase text-muted-foreground"><th className="py-1">Target reached</th><th>Incentive</th><th>Bonus</th></tr></thead><tbody>{slabs.map(s => <tr key={s.min} className="border-t border-border"><td className="py-1.5">{s.min}% +</td><td>{s.rate}% of verified revenue</td><td>{s.bonus ? money(s.bonus) : '—'}</td></tr>)}</tbody></table> : <p className="mt-2 text-sm text-muted-foreground">No slabs set by admin yet.</p>}</div>; };
  return <div className="space-y-6">
    <label className="block max-w-xs text-sm font-semibold">Month<input type="month" className={input} value={month} max={istToday().slice(0, 7)} onChange={e => setMonth(e.target.value || istToday().slice(0, 7))} /></label>
    {mine.result && <IncentiveCard title={mine.role === 'BDM' ? 'My incentive (team performance)' : 'My incentive'} r={mine.result} />}
    {people.length > 0 && <section><h3 className="mb-3 text-base font-semibold">{d.role === 'admin' ? 'BDE & BDM incentives' : 'My BDE incentives'}</h3>
      <div className="dash-card overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-border bg-surface"><tr>{['Employee', 'Role', 'Verified revenue', 'Target', 'Achieved', 'Incentive'].map(h => <th key={h} className="px-3 py-3 text-[10px] font-bold uppercase text-muted-foreground">{h}</th>)}</tr></thead>
        <tbody>{people.map(p => { const r = incentiveFor(d, p.user_id, month).result!; return <tr key={p.user_id} className="border-b border-border"><td className="px-3 py-3 font-semibold">{name(p.user_id)}</td><td className="px-3 py-3">{p.role}{p.role === 'BDM' ? <span className="block text-xs text-muted-foreground">team basis</span> : null}</td><td className="px-3 py-3 tabular-nums">{money(r.revenue)}</td><td className="px-3 py-3 tabular-nums">{r.target ? money(r.target) : 'Not set'}</td><td className="px-3 py-3 tabular-nums">{r.target ? `${r.achievement}%` : '—'}</td><td className="px-3 py-3 font-semibold tabular-nums">{money(r.incentive)}</td></tr>; })}</tbody></table></div></section>}
    <section><h3 className="mb-3 text-base font-semibold">How incentive is calculated</h3><p className="mb-3 text-sm text-muted-foreground">Automatically from <b className="text-foreground">verified collections</b> against the monthly revenue target, using the plan set by the admin. BDE: own collections and target. BDM: whole team (BDM + their BDEs). Unverified or rejected collections are not counted. <b className="text-foreground">Volunteer-sourced revenue</b> counts toward reaching the target (the slab you land in) but pays <b className="text-foreground">0% incentive</b> — the incentive amount is always computed on direct verified collection only.</p><div className="grid gap-4 md:grid-cols-2">{slabTable('BDE')}{slabTable('BDM')}</div></section>
  </div>;
}

/** BDM view of their own BDEs (reporting to them only — the database already limits rows to the team). */
export function MyBdePanel({ d, name, onOpen }: { d: Data; name: (id: string | null) => string; onOpen: (ownerId: string, view: 'pipeline' | 'collections' | 'tasks') => void }) {
  const month = istToday().slice(0, 7); const today = istToday();
  // Admin sees every BDE in the company; a manager sees the BDEs anywhere in their own down-line.
  const below = downlineOf(d.userId, d.members);
  const bdes = d.members.filter(m => m.role === 'BDE' && (d.role === 'admin' || below.includes(m.user_id)));
  if (!bdes.length) return <p className="dash-card p-6 text-sm text-muted-foreground">No BDE reports to you yet. The admin assigns BDEs to a BDM from Employees.</p>;
  const team = bdes.map(b => b.user_id);
  const teamMoney = collectionTotals(d.collections, team, undefined, month);
  const teamVol = volRevenue(d, team, month);
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard label="My BDEs" value={bdes.filter(b => b.active).length} note={`${bdes.filter(b => !b.active).length} inactive`} icon={UserRound} />
      <KpiCard label="BDE verified collection" value={money(teamMoney.verified)} note="This month" icon={BadgeCheck} tone="success" />
      <KpiCard label="BDE unverified" value={money(teamMoney.unverified)} note="Waiting for Accounts" icon={Clock3} tone="warning" />
      <KpiCard label="Volunteer-sourced" value={money(teamVol.revenue)} note={`${teamVol.forms} credited form(s) · target pace only, 0% incentive`} icon={HeartHandshake} />
      <KpiCard label="BDE won deals" value={d.leads.filter(l => team.includes(l.owner_id ?? '') && l.stage === 'won' && l.updated_at.startsWith(month)).length} note="This month" icon={Trophy} />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">{bdes.map(b => {
      const p = d.profiles.find(x => x.user_id === b.user_id);
      const leads = d.leads.filter(l => l.owner_id === b.user_id);
      const c = collectionTotals(d.collections, [b.user_id], undefined, month);
      const vr = volRevenue(d, [b.user_id], month);
      const todayC = collectionTotals(d.collections, [b.user_id], today);
      const target = revenueTarget(d, [b.user_id], month);
      const inc = incentiveFor(d, b.user_id, month).result!;
      const tasks = d.tasks.filter(t => t.owner_id === b.user_id && t.status === 'open');
      const calls = d.activities.filter(a => a.owner_id === b.user_id && a.kind === 'call' && a.created_at.startsWith(month)).length;
      return <article key={b.user_id} className="dash-card p-5">
        <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">{(p?.full_name ?? '?').split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase()}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-base font-semibold">{name(b.user_id)}</p><p className="text-xs text-muted-foreground">{p?.employee_code ?? '—'} · {p?.designation ?? 'BDE'} · joined {p?.joining_date ?? '—'}</p>{p?.phone && <a href={`tel:${p.phone}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary"><Phone className="size-3" />{p.phone}</a>}</div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.active ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{b.active ? 'Active' : 'Inactive'}</span></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[150px_1fr]">
          <TargetGauge compact title="Target (incl. volunteer)" achieved={c.verified + vr.revenue} target={target} format={money} />
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div><dt className="text-[11px] text-muted-foreground">Open leads</dt><dd className="font-semibold">{leads.filter(l => !['won', 'lost'].includes(l.stage)).length}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Won this month</dt><dd className="font-semibold">{leads.filter(l => l.stage === 'won' && l.updated_at.startsWith(month)).length}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Today verified / unverified</dt><dd className="font-semibold tabular-nums">{money(todayC.verified)} / {money(todayC.unverified)}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Month collected</dt><dd className="font-semibold tabular-nums">{money(c.verified)}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Volunteer-sourced</dt><dd className="font-semibold tabular-nums">{money(vr.revenue)} · {vr.forms} form(s)</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Calls this month</dt><dd className="font-semibold">{calls}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Open / overdue tasks</dt><dd className="font-semibold">{tasks.length} / {tasks.filter(t => t.due_date < today).length}</dd></div>
            <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Incentive this month</dt><dd className="font-semibold tabular-nums">{money(inc.incentive)}{inc.target ? ` · ${inc.achievement}% of target` : ' · target not set'}</dd></div>
          </dl>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => onOpen(b.user_id, 'pipeline')}>Leads</Button><Button size="sm" variant="outline" onClick={() => onOpen(b.user_id, 'collections')}>Collections</Button><Button size="sm" variant="outline" onClick={() => onOpen(b.user_id, 'tasks')}>Tasks</Button></div>
      </article>;
    })}</div>
  </div>;
}
