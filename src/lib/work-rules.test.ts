import { describe, expect, it } from 'vitest';
import { canHandleMoneyStep, leaveAvailable, leaveDays, resolveSteps, workingDays, defaultLeaveAllowance } from './requests';
import { budgetAlertLevel, parseBankCsv } from './finance';
import { deliveryProgress, isFresh, researchDueDate } from './research';
import { parseDashboards } from './dashboards';

describe('approval routes', () => {
  const leave = { steps: ['manager', 'hr'], steps_no_manager: ['hr', 'admin'] };
  it('BDE leave goes to the BDM, then HR', () => expect(resolveSteps(leave, true)).toEqual(['manager', 'hr']));
  it('BDM leave (no manager) goes to HR, then Admin', () => expect(resolveSteps(leave, false)).toEqual(['hr', 'admin']));
  it('expense goes manager → Accounts → Finance', () => expect(resolveSteps({ steps: ['manager', 'accounts', 'finance'], steps_no_manager: ['accounts', 'finance'] }, true)).toEqual(['manager', 'accounts', 'finance']));
  it('never leaves a request without an approver', () => expect(resolveSteps({ steps: ['coordinator'], steps_no_manager: ['coordinator'] }, false)).toEqual(['admin']));
});

describe('leave', () => {
  it('yearly allowance is Casual 12, Sick 12, Earned 15', () => expect(defaultLeaveAllowance).toEqual({ casual: 12, sick: 12, earned: 15 }));
  it('Sundays are not counted', () => expect(workingDays('2026-11-14', '2026-11-16')).toBe(2)); // Sat, Sun, Mon
  it('a half day counts 0.5 only on one date', () => { expect(leaveDays('2026-11-17', '2026-11-17', true)).toBe(0.5); expect(leaveDays('2026-11-17', '2026-11-18', true)).toBe(2); });
  it('pending leave is held from the balance', () => expect(leaveAvailable(12, 4, 3)).toBe(5));
});

describe('maker-checker', () => {
  it('nobody approves their own request', () => expect(canHandleMoneyStep({ actorId: 'a', applicantId: 'a', earlierActors: [], action: 'approve' })).toBe(false));
  it('the Accounts verifier cannot give Finance approval', () => expect(canHandleMoneyStep({ actorId: 'v', applicantId: 'a', earlierActors: ['m', 'v'], action: 'approve' })).toBe(false));
  it('the Finance approver cannot also mark it paid', () => expect(canHandleMoneyStep({ actorId: 'f', applicantId: 'a', earlierActors: [], action: 'paid', financeApprover: 'f' })).toBe(false));
  it('a different Finance person can pay', () => expect(canHandleMoneyStep({ actorId: 'p', applicantId: 'a', earlierActors: ['m', 'v', 'f'], action: 'paid', financeApprover: 'f' })).toBe(true));
});

describe('budget alerts', () => {
  it('alerts at 75%, 90% and 100%', () => {
    expect(budgetAlertLevel(74, 100)).toBe(0); expect(budgetAlertLevel(75, 100)).toBe(75);
    expect(budgetAlertLevel(90, 100)).toBe(90); expect(budgetAlertLevel(100, 100)).toBe(100); expect(budgetAlertLevel(130, 100)).toBe(100);
  });
});

describe('bank statement import', () => {
  it('reads Indian DD/MM/YYYY dates and debit/credit columns', () => {
    const r = parseBankCsv('Date,Narration,Ref No,Debit,Credit\n05/11/2026,UPI to vendor,UTR123,"1,500.00",\n06/11/2026,Client payment,UTR9,,20000\nbad,row,,,');
    expect(r.lines).toEqual([{ date: '2026-11-05', description: 'UPI to vendor', ref: 'UTR123', amount: -1500 }, { date: '2026-11-06', description: 'Client payment', ref: 'UTR9', amount: 20000 }]);
    expect(r.skipped).toBe(1);
  });
  it('refuses a file without date and amount columns', () => expect(parseBankCsv('Name,Note\nx,y').error).toBeTruthy());
});

describe('lead research', () => {
  it('Simple 2, Medium 5, Advanced 10 working days', () => {
    expect(researchDueDate('2026-11-14', 'simple')).toBe('2026-11-17'); // skips Sunday 15th
    expect(researchDueDate('2026-11-16', 'medium')).toBe('2026-11-21');
    expect(researchDueDate('2026-11-16', 'advanced')).toBe('2026-11-27');
  });
  it('350 of 500 delivered leaves 150 pending', () => expect(deliveryProgress(350, 500)).toEqual({ delivered: 350, pending: 150, pct: 70, complete: false }));
  it('leads older than 90 days must be re-verified', () => {
    const now = Date.parse('2026-11-16T00:00:00Z');
    expect(isFresh('2026-09-01T00:00:00Z', now)).toBe(true); expect(isFresh('2026-08-01T00:00:00Z', now)).toBe(false); expect(isFresh(null, now)).toBe(false);
  });
});

describe('dashboards', () => {
  it('department dashboards are offered in the standard order', () => expect(parseDashboards(['finance', 'hr', 'research', 'support'])).toEqual(['hr', 'support', 'finance', 'research']));
});
