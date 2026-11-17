import { describe, expect, it } from 'vitest';
import { biggestBottleneck, delayLimits, delayReport, type MpEvent } from './delays';

const ev = (item_table: string, item_id: string, event: string, day: number, requirement_id: string | null = 'R1', client_id = 'C1'): MpEvent =>
  ({ item_table, item_id, event, requirement_id, client_id, happened_at: new Date(Date.UTC(2026, 10, day)).toISOString() });
const now = new Date(Date.UTC(2026, 10, 20));
const step = (r: ReturnType<typeof delayReport>, k: string) => r.find(s => s.key === k)!;

describe('manpower delay limits', () => {
  it('uses 3/3/7/3/30 day limits', () => {
    expect(delayLimits).toEqual({ sourcing: 3, client_decision: 3, placement: 7, attendance: 3, payment: 30 });
  });
});

describe('delayReport', () => {
  it('measures requirement → first profile shared once per requirement', () => {
    const r = delayReport([ev('requirement', 'R1', 'requirement_posted', 1), ev('candidate', 'A', 'candidate_shared', 3), ev('candidate', 'B', 'candidate_shared', 9)], now);
    expect(step(r, 'sourcing')).toMatchObject({ done: 1, avgDays: 2, waiting: [] });
  });
  it('lists an open requirement with no profile as waiting and delayed after 3 days', () => {
    const r = delayReport([ev('requirement', 'R2', 'requirement_posted', 15, 'R2')], now);
    expect(step(r, 'sourcing').waiting[0]).toMatchObject({ key: 'R2', days: 5, delayed: true });
    expect(step(r, 'sourcing').delayedNow).toBe(1);
  });
  it('stops waiting when the requirement is closed', () => {
    const r = delayReport([ev('requirement', 'R2', 'requirement_posted', 1, 'R2'), ev('requirement', 'R2', 'requirement_closed', 2, 'R2')], now);
    expect(step(r, 'sourcing').waiting).toHaveLength(0);
  });
  it('times client decision and selection → placement per candidate', () => {
    const r = delayReport([ev('candidate', 'A', 'candidate_shared', 1), ev('candidate', 'A', 'candidate_selected', 5), ev('candidate', 'A', 'candidate_joined', 15)], now);
    expect(step(r, 'client_decision')).toMatchObject({ done: 1, avgDays: 4, onTimePercent: 0 });
    expect(step(r, 'placement')).toMatchObject({ done: 1, avgDays: 10, onTimePercent: 0 });
  });
  it('counts each resend of attendance as a new approval cycle', () => {
    const r = delayReport([ev('timesheet', 'T', 'timesheet_submitted', 1), ev('timesheet', 'T', 'timesheet_disputed', 2), ev('timesheet', 'T', 'timesheet_submitted', 3), ev('timesheet', 'T', 'timesheet_approved', 7)], now);
    expect(step(r, 'attendance')).toMatchObject({ done: 2, avgDays: 2.5, maxDays: 4, onTimePercent: 50 });
  });
  it('an unpaid invoice is delayed only after 30 days', () => {
    const r = delayReport([ev('invoice', 'I1', 'invoice_issued', 1, null), ev('invoice', 'I2', 'invoice_issued', 1, null, 'C2')], new Date(Date.UTC(2026, 11, 5)));
    expect(step(r, 'payment').waiting.every(w => w.delayed)).toBe(true);
    const early = delayReport([ev('invoice', 'I1', 'invoice_issued', 1, null)], now);
    expect(step(early, 'payment').delayedNow).toBe(0);
  });
  it('filters by client', () => {
    const r = delayReport([ev('invoice', 'I1', 'invoice_issued', 1, null), ev('invoice', 'I2', 'invoice_issued', 1, null, 'C2')], now, { clientId: 'C2' });
    expect(step(r, 'payment').waiting.map(w => w.key)).toEqual(['I2']);
  });
  it('names the step with the most delayed work as the bottleneck', () => {
    const r = delayReport([ev('requirement', 'R1', 'requirement_posted', 1), ev('timesheet', 'T', 'timesheet_submitted', 10), ev('timesheet', 'U', 'timesheet_submitted', 11)], now);
    expect(biggestBottleneck(r)?.key).toBe('attendance');
  });
});
