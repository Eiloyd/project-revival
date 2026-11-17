import { describe, expect, it } from 'vitest';
import { paceStatus, previousWorkday, sourceReport, underperformanceAlerts } from './performance';

describe('target pace', () => {
  it('is on track when achievement keeps up with the month', () => {
    expect(paceStatus(50000, 100000, 15, 30)).toMatchObject({ zone: 'on_track', expected: 50000, percentOfPace: 100 });
  });
  it('is at risk between 50% and 80% of pace', () => {
    expect(paceStatus(30000, 100000, 15, 30).zone).toBe('at_risk');
  });
  it('is behind below 50% of pace', () => {
    expect(paceStatus(20000, 100000, 15, 30).zone).toBe('behind');
  });
  it('gives no verdict without a target', () => {
    expect(paceStatus(20000, 0, 15, 30).zone).toBe('no_target');
  });
});

describe('underperformance alerts', () => {
  it('flags no calls, 3+ overdue follow-ups and a missing daily report on a workday', () => {
    expect(underperformanceAlerts({ pace: 'on_track', callsToday: 0, overdueTasks: 3, reportYesterday: false, workday: true })).toHaveLength(3);
  });
  it('stays quiet for a BDE who is on pace and up to date', () => {
    expect(underperformanceAlerts({ pace: 'on_track', callsToday: 4, overdueTasks: 1, reportYesterday: true, workday: true })).toEqual([]);
  });
});

describe('lead source report', () => {
  it('counts conversion per source', () => {
    const r = sourceReport([{ source: 'enquiry', stage: 'won', amount: 1000 }, { source: 'enquiry', stage: 'new', amount: 0 }, { source: 'manual', stage: 'lost', amount: 0 }]);
    expect(r[0]).toMatchObject({ source: 'enquiry', leads: 2, won: 1, conversion: 50, wonValue: 1000 });
  });
});

describe('previous workday', () => {
  it('skips Sunday', () => { expect(previousWorkday('2026-11-16')).toBe('2026-11-14'); });
});
