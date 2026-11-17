// Collection-linked attendance, the "Remove your zero" nudge and the daily-wage view for BDE/BDM.
// Rules mirror database/update-2026-11-17-sales-pay-volunteer-rewards.sql and the tested lib/crm/sales-pay.ts.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { AlarmClock, BadgeCheck, CalendarClock, IndianRupee, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '../ui/button';
import { KpiCard } from '../dashboard/shell';
import { savePaySettings, type getCrm } from '@/lib/crm.functions';
import {
  PAY_DAYS, clockLabel, dailyWagePay, istClock, monthDays, presentDays, readPaySettings, recordedOn, zeroMessage, zeroNudge,
} from '@/lib/crm/sales-pay';

type Data = Awaited<ReturnType<typeof getCrm>>;
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const input = 'mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm';
/** Attendance statuses that mean the person was not expected to collect. */
const OFF = ['leave', 'holiday'];

/**
 * The "Remove your zero" alert: a red banner plus a pop-up every `nudge_every_minutes` from work start
 * until the cut-off, while nothing has been recorded today. It stops the moment a collection is recorded.
 */
export function ZeroNudge({ d, ids, onGo }: { d: Data; ids: string[]; onGo: (view: 'collections') => void }) {
  const s = readPaySettings(d.paySettings);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  const clock = istClock(now);
  const recorded = recordedOn(d.collections, ids, clock.day);
  const onLeave = d.attendance.some(a => a.day === clock.day && ids.includes(a.user_id) && OFF.includes(a.status));
  const n = zeroNudge(now, recorded, s, onLeave);
  const firedAt = useRef(-1);
  useEffect(() => {
    if (!n.active) { firedAt.current = -1; return; }
    if (firedAt.current < 0 || clock.minutes - firedAt.current >= n.everyMinutes) {
      firedAt.current = clock.minutes;
      toast.warning(zeroMessage(s), { description: `${n.minutesLeft} minute${n.minutesLeft === 1 ? '' : 's'} left before ${clockLabel(s.zero_cutoff)}.`, duration: 20_000 });
    }
  }, [n.active, n.minutesLeft, n.everyMinutes, clock.minutes, s]);
  if (!s.collection_attendance) return null;
  if (!n.active) {
    if (recorded <= 0) return null;
    return <p className="mb-4 flex items-center gap-2 rounded-md border border-[var(--dash-success)] bg-[color-mix(in_oklab,var(--dash-success)_12%,transparent)] p-3 text-sm">
      <BadgeCheck className="size-4 shrink-0 text-[var(--dash-success)]" />Today's collection is recorded — the "remove your zero" reminder has stopped. Attendance turns present once Accounts verifies it.
    </p>;
  }
  return <div className="zero-alert mb-4 p-4" role="alert" aria-live="assertive">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold sm:text-base">{zeroMessage(s)}</p>
          <p className="mt-1 text-xs opacity-90">{clockLabel(s.work_start)}–{clockLabel(s.zero_cutoff)} · reminder every {n.everyMinutes} min · {n.minutesLeft} min left · nothing recorded today</p>
        </div>
      </div>
      <Button size="sm" onClick={() => onGo('collections')}>Record a collection</Button>
    </div>
  </div>;
}

/** Daily wage, paid days from verified collection, the month's day-by-day strip and (admin) the pay rules. */
export function DailyWagePanel({ d, name, ids }: { d: Data; name: (id: string | null) => string; ids: string[] }) {
  const s = readPaySettings(d.paySettings);
  const qc = useQueryClient();
  const save = useServerFn(savePaySettings);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const m = useMutation({ mutationFn: (fn: () => Promise<unknown>) => fn(), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['crm'] }); setErr(''); setMsg('Pay settings saved.'); }, onError: e => { setMsg(''); setErr(e.message); } });
  const month = d.today.slice(0, 7);
  const days = presentDays(d.collections, ids, month, s.min_daily_collection);
  const daily = Number(d.dailyWage ?? 0);
  const pay = dailyWagePay({ dailyWage: daily }, days.length);
  const strip = monthDays(month, d.today);
  const statusOf = (day: string) => {
    if (days.includes(day)) return 'present';
    const rec = d.attendance.find(a => a.day === day && ids.includes(a.user_id));
    return rec?.status ?? 'pending';
  };
  const tone = (st: string) => st === 'present' ? 'bg-[color-mix(in_oklab,var(--dash-success)_22%,transparent)] text-[var(--dash-success)]'
    : st === 'absent' ? 'bg-destructive/10 text-destructive'
      : st === 'pending' ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground';
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setMsg(''); setErr('');
    m.mutate(() => save({ data: {
      collection_attendance: f.get('collection_attendance') === 'on',
      min_daily_collection: Number(f.get('min_daily_collection') || 1),
      work_start: String(f.get('work_start') || '10:00'),
      zero_cutoff: String(f.get('zero_cutoff') || '12:00'),
      nudge_every_minutes: Number(f.get('nudge_every_minutes') || 20),
    } }));
  }
  return <div className="space-y-6">
    {!d.paySettings && <p className="rounded-md border border-border bg-surface p-3 text-sm text-muted-foreground">Pay settings are not set up in this database yet, so the built-in rules apply ({clockLabel(s.work_start)}–{clockLabel(s.zero_cutoff)}, reminder every {s.nudge_every_minutes} min, ₹{s.min_daily_collection} minimum). Run <b className="text-foreground">database/update-2026-11-17-sales-pay-volunteer-rewards.sql</b> once to change them.</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Daily wage" value={daily ? money(daily) : '—'} note={daily ? 'Monthly gross ÷ 30' : 'No salary structure found for you'} icon={IndianRupee} />
      <KpiCard label="Days with verified collection" value={`${pay.paidDays} / ${PAY_DAYS}`} note={`This month, minimum ₹${s.min_daily_collection} a day`} icon={BadgeCheck} tone="success" />
      <KpiCard label="Wage earned this month" value={money(pay.wage)} note={`${pay.lopDays} loss-of-pay day(s)`} icon={CalendarClock} />
      <KpiCard label="Attendance basis" value={s.collection_attendance ? 'Collection' : 'Manual'} note={s.collection_attendance ? `Present only on verified-collection days` : 'Manual check-in decides presence'} icon={AlarmClock} tone={s.collection_attendance ? 'warning' : 'default'} />
    </div>
    <section className="dash-card p-4 sm:p-5">
      <h3 className="text-base font-semibold">This month, day by day</h3>
      <p className="mt-1 text-sm text-muted-foreground">A day turns <b className="text-foreground">present</b> when verified collection reaches ₹{s.min_daily_collection}. Check-in alone does not mark you present while collection-linked attendance is on.</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {strip.map(day => <span key={day} className={`rounded-md px-2 py-1 text-[11px] font-semibold tabular-nums ${tone(statusOf(day))}`} title={`${day} · ${statusOf(day)}`}>{day.slice(8)}</span>)}
        {!strip.length && <p className="text-sm text-muted-foreground">No days in this month yet.</p>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Grey = no record yet · green = present (verified collection) · red = absent · amber = leave / half day / work from home / holiday.</p>
    </section>
    {d.role === 'admin' && <section className="dash-card p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold"><ShieldCheck className="size-4 text-primary" />Pay rules (admin)</h3>
      {msg && <p role="status" className="mt-2 rounded-md border border-[var(--dash-success)] p-2 text-sm">{msg}</p>}
      {err && <p role="alert" className="mt-2 rounded-md border border-destructive bg-destructive/10 p-2 text-sm">{err}</p>}
      <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2 sm:p-0">
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" name="collection_attendance" defaultChecked={s.collection_attendance} />Attendance is linked to collection (BDE/BDM are present only on verified-collection days)</label>
        <label className="block text-sm font-semibold">Minimum verified collection a day (₹)<input name="min_daily_collection" type="number" min={1} step="0.01" required defaultValue={s.min_daily_collection} className={input} /></label>
        <label className="block text-sm font-semibold">Reminder every (minutes)<input name="nudge_every_minutes" type="number" min={5} max={120} required defaultValue={s.nudge_every_minutes} className={input} /></label>
        <label className="block text-sm font-semibold">Work starts at<input name="work_start" type="time" required defaultValue={s.work_start} className={input} /></label>
        <label className="block text-sm font-semibold">Zero cut-off<input name="zero_cutoff" type="time" required defaultValue={s.zero_cutoff} className={input} /></label>
        <div className="sm:col-span-2"><Button type="submit" disabled={m.isPending}>{m.isPending ? 'Saving…' : 'Save pay rules'}</Button></div>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">Work start must be before the cut-off (the database refuses it otherwise). The reminder runs from work start to the cut-off, not on Sundays, and stops as soon as a collection is recorded. Bell alerts need the scheduled job <code>crm-zero-collection-nudge</code> (pg_cron) in the database.</p>
    </section>}
    <p className="text-xs text-muted-foreground">For {ids.length === 1 ? name(ids[0] ?? null) : `${ids.length} people (you and your team)`}. Wage = monthly gross ÷ {PAY_DAYS} × paid days, at most {PAY_DAYS} days; salary and incentives both derive from verified collection only.</p>
  </div>;
}
