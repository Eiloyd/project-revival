import { describe, expect, it } from 'vitest';
import { advanceInstallment, fillTemplate, fnf, lopDays, netPay, recoveryMonths } from './payroll';
import { defaultWeek, weekDays, weekStart } from './roster';
import { nextStage, stageCounts } from './hiring';
describe('payroll rules', () => {
  it('counts absent as 1 and half day as 0.5 loss of pay', () => expect(lopDays(['present', 'absent', 'half_day', 'leave', 'wfh'])).toBe(1.5));
  it('deducts gross/30 per LOP day', () => expect(netPay({ gross: 30000, deductions: 1800, lopDays: 2 })).toEqual({ lop: 2000, net: 26200 }));
  it('never pays negative salary', () => expect(netPay({ gross: 3000, deductions: 5000, lopDays: 0 }).net).toBe(0));
  it('adds approved reimbursements and subtracts advance recovery', () => expect(netPay({ gross: 30000, deductions: 0, lopDays: 0, reimbursement: 1200, advanceRecovery: 5000 }).net).toBe(26200));
  it('recovers at most the monthly instalment', () => expect(advanceInstallment({ monthly: 5000, balance: 20000, payAvailable: 30000 })).toBe(5000));
  it('recovers only what is still owed in the last month', () => expect(advanceInstallment({ monthly: 5000, balance: 2000, payAvailable: 30000 })).toBe(2000));
  it('never recovers more than the pay available', () => expect(advanceInstallment({ monthly: 5000, balance: 20000, payAvailable: 3000 })).toBe(3000));
  it('₹20,000 at ₹5,000 a month takes 4 months', () => expect(recoveryMonths(20000, 5000)).toBe(4));
  it('computes full and final', () => expect(fnf({ pending: 20000, encash: 5000, other: 1000, recover: 3000 })).toBe(23000));
  it('fills letter placeholders and leaves unknown ones', () => expect(fillTemplate('Dear {{name}}, ₹{{gross}} {{x}}', { name: 'Asha', gross: 25000 })).toBe('Dear Asha, ₹25000 {{x}}'));
});
describe('roster rules', () => {
  it('weeks start on Monday', () => expect(weekStart('2026-11-22')).toBe('2026-11-16'));
  it('a week has Monday to Sunday', () => expect(weekDays('2026-11-18')).toEqual(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']));
  it('default week gives Sunday off', () => expect(defaultWeek('2026-11-16', 'G')).toMatchObject({ '2026-11-16': 'G', '2026-11-21': 'G', '2026-11-22': 'WO' }));
});
describe('hiring rules', () => {
  it('moves forward one stage at a time', () => { expect(nextStage('applied')).toBe('screening'); expect(nextStage('offered')).toBe('hired'); expect(nextStage('hired')).toBeNull(); expect(nextStage('rejected')).toBeNull(); });
  it('counts candidates per stage', () => expect(stageCounts([{ stage: 'applied' }, { stage: 'applied' }, { stage: 'hired' }])).toMatchObject({ applied: 2, hired: 1, interview: 0 }));
});
