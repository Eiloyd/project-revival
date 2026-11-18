import { useMemo, useState } from 'react';
import { BadgeCheck, ChevronRight, HeartHandshake, Phone, Target, Trophy, Users, Wallet } from 'lucide-react';
import { Button } from '../ui/button';
import { KpiCard } from '../dashboard/shell';
import type { getCrm } from '@/lib/crm.functions';
import { collectionTotals } from '@/lib/crm/incentives';
import { downlineOf, roleNames, teamIdsOf, teamTabsFor, type SalesRole } from '@/lib/crm/hierarchy';
import { money, volRevenue } from './sales-money';

type Data = Awaited<ReturnType<typeof getCrm>>;
type NameFn = (id: string | null) => string;
type Tab = SalesRole | 'volunteers';
const tabLabel = (t: Tab) => (t === 'volunteers' ? 'My Volunteers' : `My ${t}`);

/**
 * "My Teams": every ladder level below the viewer (admin: all levels). Clicking a person opens the people who report
 * to them, with each one's own team totals, so Admin → SM → ASM → BDM → BDE can be followed step by step.
 * Rows come from getCrm, already limited by the database to the viewer's own down-line.
 */
export function MyTeamsPanel({ d, name, onOpen, onSetTarget }: { d: Data; name: NameFn; onOpen: (ownerId: string, view: 'pipeline' | 'collections' | 'tasks') => void; onSetTarget?: (ownerId: string) => void }) {
  const tabs = teamTabsFor(d.role);
  const [tab, setTab] = useState<Tab>(tabs[0] ?? 'volunteers');
  const [path, setPath] = useState<string[]>([]);
  const month = d.today.slice(0, 7);
  const below = useMemo(() => new Set(d.role === 'admin' ? d.members.map(m => m.user_id) : downlineOf(d.userId, d.members)), [d]);
  const targetOf = (id: string) => d.targets.filter(t => t.owner_id === id && t.month.startsWith(month)).reduce((n, t) => n + Number(t.revenue_target), 0);
  const stats = (id: string) => {
    const ids = teamIdsOf(id, d.members);
    const coll = collectionTotals(d.collections, ids, undefined, month);
    const vol = volRevenue(d, ids, month);
    const own = targetOf(id); const team = ids.slice(1).reduce((n, x) => n + targetOf(x), 0);
    const won = d.leads.filter(l => ids.includes(l.owner_id ?? '') && l.stage === 'won' && l.updated_at.startsWith(month));
    const volunteers = (d.teamVolunteers ?? []).filter(v => ids.includes(v.employee_id) && v.status === 'active').length;
    return { size: ids.length - 1, verified: coll.verified, unverified: coll.unverified, vol: vol.revenue, own, team, total: own + team, won: won.length, wonValue: won.reduce((n, l) => n + l.amount, 0), volunteers };
  };
  const canTarget = (id: string) => Boolean(onSetTarget) && id !== d.userId && (d.role === 'admin' || below.has(id));

  if (!tabs.length) return <p className="dash-card p-6 text-sm text-muted-foreground">Nobody reports to you yet. The admin maps people under you from Employees.</p>;

  const current = path[path.length - 1];
  const people = current
    ? d.members.filter(m => m.manager_id === current)
    : tab === 'volunteers' ? [] : d.members.filter(m => m.role === tab && below.has(m.user_id));
  const vols = (d.teamVolunteers ?? []).filter(v => current ? v.employee_id === current : true);

  const card = (m: Data['members'][number]) => {
    const p = d.profiles.find(x => x.user_id === m.user_id); const s = stats(m.user_id);
    const pct = s.total ? Math.min(100, Math.round(((s.verified + s.vol) / s.total) * 100)) : 0;
    return <article key={m.user_id} className="dash-card flex flex-col p-5">
      <button type="button" onClick={() => setPath([...path, m.user_id])} className="flex items-start gap-3 text-left" aria-label={`Open ${name(m.user_id)}'s team`}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">{(p?.full_name ?? '?').split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase()}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold">{name(m.user_id)} {!m.active && <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Inactive</span>}</span>
          <span className="block text-xs text-muted-foreground">{m.role} · {p?.employee_code ?? '—'}{m.manager_id ? ` · reports to ${name(m.manager_id)}` : ''}</span>
        </span>
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
      </button>
      {p?.phone && <a href={`tel:${p.phone}`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary"><Phone className="size-3" />{p.phone}</a>}
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div><dt className="text-[11px] text-muted-foreground">Team members</dt><dd className="font-semibold tabular-nums">{s.size}</dd></div>
        <div><dt className="text-[11px] text-muted-foreground">Volunteers</dt><dd className="font-semibold tabular-nums">{d.teamVolunteers ? s.volunteers : '—'}</dd></div>
        <div><dt className="text-[11px] text-muted-foreground">Own target</dt><dd className="font-semibold tabular-nums">{s.own ? money(s.own) : 'Not set'}</dd></div>
        <div><dt className="text-[11px] text-muted-foreground">Team target (own + team)</dt><dd className="font-semibold tabular-nums">{s.total ? money(s.total) : 'Not set'}</dd></div>
        <div><dt className="text-[11px] text-muted-foreground">Verified collection</dt><dd className="font-semibold tabular-nums">{money(s.verified)}</dd></div>
        <div><dt className="text-[11px] text-muted-foreground">Won this month</dt><dd className="font-semibold tabular-nums">{s.won} · {money(s.wonValue)}</dd></div>
      </dl>
      {s.total > 0 && <div className="mt-3"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div><p className="mt-1 text-[11px] text-muted-foreground">{pct}% of team target (verified + volunteer-sourced)</p></div>}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Button size="sm" variant="outline" onClick={() => onOpen(m.user_id, 'pipeline')}>Leads</Button>
        <Button size="sm" variant="outline" onClick={() => onOpen(m.user_id, 'collections')}>Collections</Button>
        {canTarget(m.user_id) && <Button size="sm" variant="outline" onClick={() => onSetTarget!(m.user_id)}><Target className="size-3.5" />Target</Button>}
      </div>
    </article>;
  };

  const head = current ? stats(current) : null;
  const all = tab === 'volunteers' && !current ? null : (current ? null : people.map(p => stats(p.user_id)));
  return <div className="space-y-6">
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Team levels">
      {tabs.map(t => <Button key={t} role="tab" aria-selected={!current && tab === t} size="sm" variant={!current && tab === t ? 'default' : 'outline'} onClick={() => { setTab(t); setPath([]); }}>
        {tabLabel(t)} <span className="ml-1 tabular-nums opacity-70">{t === 'volunteers' ? (d.teamVolunteers?.length ?? '—') : d.members.filter(m => m.role === t && m.active && below.has(m.user_id)).length}</span>
      </Button>)}
    </div>

    {current && <nav aria-label="Team path" className="flex flex-wrap items-center gap-1 text-sm">
      <button type="button" className="font-medium text-primary" onClick={() => setPath([])}>{tabLabel(tab)}</button>
      {path.map((id, i) => <span key={id} className="flex items-center gap-1"><ChevronRight className="size-3.5 text-muted-foreground" /><button type="button" className={i === path.length - 1 ? 'font-semibold' : 'font-medium text-primary'} onClick={() => setPath(path.slice(0, i + 1))}>{name(id)}</button></span>)}
    </nav>}

    {current && head && <>
      <div>
        <h3 className="text-lg font-semibold">{name(current)}'s team</h3>
        <p className="text-sm text-muted-foreground">{roleNames[d.members.find(m => m.user_id === current)?.role ?? ''] ?? ''} · people reporting directly, each with their own team totals.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Whole team" value={head.size} note="Everyone below, all levels" icon={Users} />
        <KpiCard label="Team target (own + team)" value={head.total ? money(head.total) : 'Not set'} note={`Own ${head.own ? money(head.own) : 'not set'} + team ${money(head.team)}`} icon={Target} />
        <KpiCard label="Verified collection" value={money(head.verified)} note={`${money(head.unverified)} waiting for Accounts`} icon={BadgeCheck} tone="success" />
        <KpiCard label="Won this month" value={money(head.wonValue)} note={`${head.won} deal(s) · volunteer-sourced ${money(head.vol)}`} icon={Trophy} />
      </div>
    </>}

    {!current && all && all.length > 0 && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label={tabLabel(tab)} value={people.filter(p => p.active).length} note={`${people.filter(p => !p.active).length} inactive`} icon={Users} />
      <KpiCard label="Their team targets" value={money(all.reduce((n, s) => n + s.total, 0))} note="This month, own + team" icon={Target} />
      <KpiCard label="Verified collection" value={money(all.reduce((n, s) => n + s.verified, 0))} note="Their whole teams, this month" icon={Wallet} tone="success" />
      <KpiCard label="Volunteer-sourced" value={money(all.reduce((n, s) => n + s.vol, 0))} note="Counts toward target, 0% incentive" icon={HeartHandshake} />
    </div>}

    {(current || tab !== 'volunteers') && (people.length
      ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{people.map(card)}</div>
      : <p className="dash-card p-6 text-sm text-muted-foreground">{current ? 'Nobody reports directly to this person yet.' : `No ${tab} in your team yet. The admin adds them from Employees.`}</p>)}

    {(current || tab === 'volunteers') && <section>
      <h3 className="mb-3 text-base font-semibold">{current ? `Volunteers added by ${name(current)}` : 'Volunteers in my team'}</h3>
      {d.teamVolunteers === null
        ? <p className="dash-card p-5 text-sm text-muted-foreground">The team volunteer list is not set up in the database yet. Run <b className="text-foreground">database/update-2026-11-18-sales-hierarchy.sql</b> once in Supabase.</p>
        : vols.length
          ? <div className="dash-card overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-border bg-surface"><tr>{['Volunteer', 'Code', 'Mobile', 'Area', 'Added by', 'KYC', 'Status'].map(h => <th key={h} className="px-3 py-3 text-[10px] font-bold uppercase text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>{vols.map(v => <tr key={v.id} className="border-b border-border"><td className="px-3 py-3 font-semibold">{v.full_name}</td><td className="px-3 py-3">{v.volunteer_code}</td><td className="px-3 py-3"><a className="text-primary" href={`tel:${v.mobile}`}>{v.mobile}</a></td><td className="px-3 py-3">{[v.district, v.state].filter(Boolean).join(', ') || '—'}</td><td className="px-3 py-3">{name(v.employee_id)}</td><td className="px-3 py-3 capitalize">{v.kyc_status}</td><td className="px-3 py-3 capitalize">{v.status}</td></tr>)}</tbody></table></div>
          : <p className="dash-card p-5 text-sm text-muted-foreground">No volunteers here yet.</p>}
    </section>}
  </div>;
}
