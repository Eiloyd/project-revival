/** Browser-safe manpower supply rules. The database computes invoices the same way (`manpower_generate_invoice`). */

export const candidateStages = ['sourced', 'screened', 'shared', 'client_interview', 'selected', 'rejected', 'joined', 'dropped'] as const;
export const candidateStageLabels: Record<string, string> = { sourced: 'Sourced', screened: 'Screened', shared: 'Shared with client', client_interview: 'Client interview', selected: 'Selected', rejected: 'Rejected', joined: 'Joined', dropped: 'Dropped out' };
export const deploymentStatusLabels: Record<string, string> = { active: 'Active', replacement_requested: 'Replacement requested', replaced: 'Replaced', exited: 'Exited' };
export const timesheetStatusLabels: Record<string, string> = { submitted: 'Waiting for client', client_approved: 'Client approved', disputed: 'Disputed by client', invoiced: 'Invoiced' };
export const invoiceStatusLabels: Record<string, string> = { issued: 'Issued', paid: 'Paid', cancelled: 'Cancelled' };
export const contractTypeLabels: Record<string, string> = { contract: 'Contract staffing', temporary: 'Temporary', permanent: 'Permanent placement', project: 'Project based' };

export const GST_PERCENT = 18;
/** Statutory limits used for the payroll register (PF wage ceiling and ESIC eligibility, ₹ per month). */
export const PF_WAGE_CEILING = 15000;
export const PF_RATE = 12;
export const ESIC_GROSS_LIMIT = 21000;
export const ESIC_EMPLOYEE_RATE = 0.75;
export const ESIC_EMPLOYER_RATE = 3.25;

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Bill for one worker for one month: billing rate for days present plus overtime. */
export function billAmount(billingRate: number, presentDays: number, workingDays: number, otHours = 0, otRate = 0) {
  if (!(workingDays > 0)) return 0;
  return r2(billingRate * Math.min(presentDays, workingDays) / workingDays + otHours * otRate);
}

/** Invoice totals: subtotal + service fee % + 18% GST on (subtotal + fee). */
export function invoiceTotals(subtotal: number, feePercent: number) {
  const fee = r2(subtotal * feePercent / 100);
  const gst = r2((subtotal + fee) * GST_PERCENT / 100);
  return { subtotal: r2(subtotal), fee, gst, total: r2(subtotal + fee + gst) };
}

/**
 * Monthly payroll register line for a deployed worker. Earned gross = salary × present ÷ working days.
 * PF 12% each side on earned wages up to ₹15,000. ESIC 0.75% employee / 3.25% employer only when the
 * monthly salary is ₹21,000 or less.
 */
export function payrollLine(p: { salary: number; presentDays: number; workingDays: number; pf: boolean; esic: boolean }) {
  const earned = p.workingDays > 0 ? r2(p.salary * Math.min(p.presentDays, p.workingDays) / p.workingDays) : 0;
  const pfWage = Math.min(earned, PF_WAGE_CEILING);
  const pfEmployee = p.pf ? Math.round(pfWage * PF_RATE / 100) : 0;
  const pfEmployer = pfEmployee;
  const esicOn = p.esic && p.salary <= ESIC_GROSS_LIMIT;
  const esicEmployee = esicOn ? Math.ceil(earned * ESIC_EMPLOYEE_RATE / 100) : 0;
  const esicEmployer = esicOn ? Math.ceil(earned * ESIC_EMPLOYER_RATE / 100) : 0;
  return { earned, pfEmployee, pfEmployer, esicEmployee, esicEmployer, netPay: r2(earned - pfEmployee - esicEmployee), employerCost: r2(earned + pfEmployer + esicEmployer) };
}

/** Share of requested positions filled across requirements. */
export function fillRate(rows: { headcount: number; filled: number; status: string }[]) {
  const open = rows.filter(r => r.status !== 'closed');
  const need = open.reduce((n, r) => n + r.headcount, 0);
  const got = open.reduce((n, r) => n + Math.min(r.filled, r.headcount), 0);
  return { need, got, percent: need ? Math.round(got / need * 100) : 0 };
}
