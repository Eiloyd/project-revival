import { describe, expect, it } from 'vitest';
import { billAmount, fillRate, invoiceTotals, payrollLine } from './rules';

describe('manpower billing', () => {
  it('bills only the days present plus overtime', () => {
    expect(billAmount(26000, 24, 26, 10, 150)).toBe(25500);
  });
  it('adds the service fee and 18% GST on top', () => {
    expect(invoiceTotals(100000, 10)).toEqual({ subtotal: 100000, fee: 10000, gst: 19800, total: 129800 });
  });
});

describe('payroll register', () => {
  it('caps PF at ₹15,000 wages and skips ESIC above ₹21,000 salary', () => {
    const l = payrollLine({ salary: 30000, presentDays: 30, workingDays: 30, pf: true, esic: true });
    expect(l.pfEmployee).toBe(1800);
    expect(l.esicEmployee).toBe(0);
  });
  it('applies ESIC 0.75% / 3.25% at or below ₹21,000 salary', () => {
    const l = payrollLine({ salary: 20000, presentDays: 30, workingDays: 30, pf: false, esic: true });
    expect([l.esicEmployee, l.esicEmployer, l.netPay]).toEqual([150, 650, 19850]);
  });
  it('pays salary pro rata for days present', () => {
    expect(payrollLine({ salary: 15000, presentDays: 15, workingDays: 30, pf: false, esic: false }).earned).toBe(7500);
  });
});

describe('fill rate', () => {
  it('ignores closed requirements', () => {
    expect(fillRate([{ headcount: 10, filled: 5, status: 'sourcing' }, { headcount: 4, filled: 0, status: 'closed' }])).toEqual({ need: 10, got: 5, percent: 50 });
  });
});
