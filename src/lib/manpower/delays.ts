/**
 * Manpower delay analytics, worked out from the step log the database keeps (manpower_events).
 * Each step has a start event, end events and "stop" events (item dropped/closed). Finished cycles
 * give the time taken; started-but-unfinished cycles are work still waiting.
 */
export type MpEvent = { item_id: string; item_table: string; client_id: string; requirement_id: string | null; event: string; happened_at: string };

export type StepKey = 'sourcing' | 'client_decision' | 'placement' | 'attendance' | 'payment';
type StepDef = { key: StepKey; label: string; waitingOn: string; limitDays: number; group: (e: MpEvent) => string | null; start: string[]; end: string[]; stop: string[]; once?: boolean };

/** Days after which a waiting item counts as delayed. Owner to confirm these limits. */
export const delayLimits: Record<StepKey, number> = { sourcing: 3, client_decision: 3, placement: 7, attendance: 3, payment: 30 };

const SHARED = ['candidate_shared', 'candidate_client_interview', 'candidate_selected', 'candidate_joined'];
export const delaySteps: StepDef[] = [
  { key: 'sourcing', label: 'Requirement → first profile shared', waitingOn: 'Our team', limitDays: delayLimits.sourcing, once: true,
    group: e => e.requirement_id, start: ['requirement_posted'], end: SHARED, stop: ['requirement_closed'] },
  { key: 'client_decision', label: 'Profile shared → client selects or rejects', waitingOn: 'Client', limitDays: delayLimits.client_decision, once: true,
    group: e => e.item_table === 'candidate' ? e.item_id : null, start: ['candidate_shared', 'candidate_client_interview'], end: ['candidate_selected', 'candidate_rejected', 'candidate_joined'], stop: ['candidate_dropped'] },
  { key: 'placement', label: 'Selected → staff placed', waitingOn: 'Our team / candidate', limitDays: delayLimits.placement, once: true,
    group: e => e.item_table === 'candidate' ? e.item_id : null, start: ['candidate_selected'], end: ['candidate_joined'], stop: ['candidate_dropped', 'candidate_rejected'] },
  { key: 'attendance', label: 'Attendance sent → client approves', waitingOn: 'Client', limitDays: delayLimits.attendance,
    group: e => e.item_table === 'timesheet' ? e.item_id : null, start: ['timesheet_submitted'], end: ['timesheet_approved', 'timesheet_disputed'], stop: ['timesheet_invoiced'] },
  { key: 'payment', label: 'Invoice issued → payment received', waitingOn: 'Client / Finance', limitDays: delayLimits.payment, once: true,
    group: e => e.item_table === 'invoice' ? e.item_id : null, start: ['invoice_issued'], end: ['invoice_paid'], stop: ['invoice_cancelled'] },
];

export type Waiting = { step: StepKey; key: string; client_id: string; since: string; days: number; delayed: boolean };
export type StepStats = { key: StepKey; label: string; waitingOn: string; limitDays: number; done: number; avgDays: number | null; medianDays: number | null; maxDays: number | null; onTimePercent: number | null; waiting: Waiting[]; delayedNow: number };

const DAY = 864e5;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Works out time taken and work still waiting for every manpower step. `since` limits finished cycles to those ending after it. */
export function delayReport(events: MpEvent[], now: Date, opts: { clientId?: string; since?: Date } = {}): StepStats[] {
  const list = events.filter(e => !opts.clientId || e.client_id === opts.clientId).slice().sort((a, b) => a.happened_at.localeCompare(b.happened_at));
  return delaySteps.map(step => {
    const groups = new Map<string, MpEvent[]>();
    for (const e of list) { const g = step.group(e); if (!g) continue; if (!groups.has(g)) groups.set(g, []); groups.get(g)!.push(e); }
    const took: number[] = []; const waiting: Waiting[] = [];
    for (const [key, evs] of groups) {
      let open: MpEvent | null = null; let finished = false;
      for (const e of evs) {
        if (finished && step.once) break;
        if (!open && step.start.includes(e.event)) open = e;
        else if (open && step.end.includes(e.event)) {
          const end = new Date(e.happened_at);
          if (!opts.since || end >= opts.since) took.push((end.getTime() - new Date(open.happened_at).getTime()) / DAY);
          open = null; finished = true;
        } else if (step.stop.includes(e.event)) { open = null; if (step.once) finished = true; }
      }
      if (open && !(finished && step.once)) {
        const days = (now.getTime() - new Date(open.happened_at).getTime()) / DAY;
        waiting.push({ step: step.key, key, client_id: open.client_id, since: open.happened_at, days: round1(days), delayed: days > step.limitDays });
      }
    }
    const sorted = took.map(n => Math.max(0, n)).sort((a, b) => a - b);
    const mid = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2]! : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2) : null;
    waiting.sort((a, b) => b.days - a.days);
    return {
      key: step.key, label: step.label, waitingOn: step.waitingOn, limitDays: step.limitDays, done: sorted.length,
      avgDays: sorted.length ? round1(sorted.reduce((n, x) => n + x, 0) / sorted.length) : null,
      medianDays: mid == null ? null : round1(mid), maxDays: sorted.length ? round1(sorted[sorted.length - 1]!) : null,
      onTimePercent: sorted.length ? Math.round(sorted.filter(x => x <= step.limitDays).length / sorted.length * 100) : null,
      waiting, delayedNow: waiting.filter(w => w.delayed).length,
    };
  });
}

/** The step holding up the most work right now: most delayed items, then slowest average. Null when nothing is late or slow. */
export function biggestBottleneck(stats: StepStats[]): StepStats | null {
  const late = stats.filter(s => s.delayedNow > 0).sort((a, b) => b.delayedNow - a.delayedNow || (b.waiting[0]?.days ?? 0) - (a.waiting[0]?.days ?? 0));
  if (late[0]) return late[0];
  const slow = stats.filter(s => s.avgDays != null && s.avgDays > s.limitDays).sort((a, b) => b.avgDays! / b.limitDays - a.avgDays! / a.limitDays);
  return slow[0] ?? null;
}
