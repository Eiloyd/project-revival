import { describe, expect, it } from 'vitest';
import { dailyWagePay, DEFAULT_PAY_SETTINGS, presentDays, readPaySettings, recordedOn, zeroMessage, zeroNudge } from './sales-pay';

// 17 Nov 2026 is a Tuesday. IST = UTC + 5:30.
const ist = (hhmm: string, day = '2026-11-17') => new Date(`${day}T${hhmm}:00+05:30`);

describe('"Remove your zero" nudge', () => {
  it('uses the exact message with the 12:00 PM cut-off', () => {
    expect(zeroMessage()).toBe("Remove your zero before 12:00 PM! Start today's collection to mark your daily attendance and protect your daily wage.");
  });
  it('runs every 20 minutes from work start until 12:00 PM IST while collection is zero', () => {
    expect(DEFAULT_PAY_SETTINGS.nudge_every_minutes).toBe(20);
    expect(zeroNudge(ist('09:59'), 0).active).toBe(false);
    expect(zeroNudge(ist('10:00'), 0).active).toBe(true);
    expect(zeroNudge(ist('11:59'), 0)).toMatchObject({ active: true, minutesLeft: 1, everyMinutes: 20 });
    expect(zeroNudge(ist('12:00'), 0).active).toBe(false);
  });
  it('stops once the first collection of the day is recorded', () => {
    expect(zeroNudge(ist('10:30'), 1).active).toBe(false);
  });
  it('is quiet on Sundays and on leave', () => {
    expect(zeroNudge(ist('10:30', '2026-11-22'), 0).active).toBe(false);
    expect(zeroNudge(ist('10:30'), 0, DEFAULT_PAY_SETTINGS, true).active).toBe(false);
  });
  it('counts recorded collections but not rejected ones', () => {
    const rows = [{ owner_id: 'a', amount: 100, status: 'rejected', collected_on: '2026-11-17' }, { owner_id: 'b', amount: 100, status: 'unverified', collected_on: '2026-11-17' }];
    expect(recordedOn(rows, ['a'], '2026-11-17')).toBe(0);
    expect(recordedOn(rows, ['a', 'b'], '2026-11-17')).toBe(1);
  });
  it('reads database times like 10:00:00', () => {
    expect(readPaySettings({ work_start: '10:00:00', zero_cutoff: '12:00:00' })).toMatchObject({ work_start: '10:00', zero_cutoff: '12:00' });
  });
});

describe('collection-linked attendance and daily wage', () => {
  const rows = [
    { owner_id: 'e', amount: 5000, status: 'verified', collected_on: '2026-11-03' },
    { owner_id: 'e', amount: 800, status: 'unverified', collected_on: '2026-11-04' },
    { owner_id: 'e', amount: 300, status: 'rejected', collected_on: '2026-11-05' },
    { owner_id: 'e', amount: 200, status: 'verified', collected_on: '2026-11-06' },
  ];
  it('a day is present only with verified collection', () => {
    expect(presentDays(rows, ['e'], '2026-11')).toEqual(['2026-11-03', '2026-11-06']);
  });
  it('pays monthly gross ÷ 30 for each verified-collection day', () => {
    expect(dailyWagePay({ monthlyGross: 30000 }, 2)).toEqual({ daily: 1000, paidDays: 2, lopDays: 28, wage: 2000 });
    expect(dailyWagePay({ monthlyGross: 30000 }, 31).wage).toBe(30000);
    expect(dailyWagePay({ monthlyGross: 30000 }, 0).wage).toBe(0);
  });
});
