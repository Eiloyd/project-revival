/** Browser-safe sales performance rules used by the BDE / BDM dashboards. */

export type PaceZone = 'no_target' | 'on_track' | 'at_risk' | 'behind';
/**
 * Compares what someone has achieved so far this month with where they should be if the target
 * were spread evenly over the month. Below 50% of that pace = behind, below 80% = at risk.
 */
export function paceStatus(achieved: number, target: number, dayOfMonth: number, daysInMonth: number) {
  if (!(target > 0) || !(daysInMonth > 0)) return { zone: 'no_target' as PaceZone, expected: 0, percentOfPace: 0 };
  const day = Math.min(Math.max(1, Math.floor(dayOfMonth)), daysInMonth);
  const expected = Math.round(target * day / daysInMonth);
  const percentOfPace = expected > 0 ? Math.round(Math.max(0, achieved) / expected * 100) : 0;
  const zone: PaceZone = percentOfPace < 50 ? 'behind' : percentOfPace < 80 ? 'at_risk' : 'on_track';
  return { zone, expected, percentOfPace };
}

export type AlertInput = { pace: PaceZone; callsToday: number; overdueTasks: number; reportYesterday: boolean; workday: boolean };
/** Plain-language alerts a BDM sees for one BDE. */
export function underperformanceAlerts(a: AlertInput): string[] {
  const out: string[] = [];
  if (a.pace === 'behind') out.push('Far behind this month\'s target pace');
  else if (a.pace === 'at_risk') out.push('Slightly behind target pace');
  if (a.workday && a.callsToday === 0) out.push('No calls logged today');
  if (a.overdueTasks >= 3) out.push(`${a.overdueTasks} overdue follow-ups`);
  if (a.workday && !a.reportYesterday) out.push('Daily report missing for the last working day');
  return out;
}

type LeadLite = { source: string; stage: string; amount: number };
/** Lead count, won count, conversion % and won value per lead source. */
export function sourceReport(leads: LeadLite[]) {
  const map = new Map<string, { source: string; leads: number; won: number; lost: number; wonValue: number }>();
  for (const l of leads) {
    const r = map.get(l.source) ?? { source: l.source, leads: 0, won: 0, lost: 0, wonValue: 0 };
    r.leads += 1;
    if (l.stage === 'won') { r.won += 1; r.wonValue += Number(l.amount) || 0; }
    if (l.stage === 'lost') r.lost += 1;
    map.set(l.source, r);
  }
  return [...map.values()].map(r => ({ ...r, conversion: r.leads ? Math.round(r.won / r.leads * 100) : 0 })).sort((a, b) => b.leads - a.leads);
}

/** Last working day before `today` (Sunday is the weekly off). Dates are YYYY-MM-DD. */
export function previousWorkday(today: string) {
  const d = new Date(`${today}T00:00:00Z`);
  do { d.setUTCDate(d.getUTCDate() - 1); } while (d.getUTCDay() === 0);
  return d.toISOString().slice(0, 10);
}
