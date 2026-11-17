/** Mirrors hr_generate_payroll(): loss of pay = gross / 30 per absent day (half day = 0.5). */
export function lopDays(statuses: string[]): number {
  return statuses.reduce((n, s) => n + (s === 'absent' ? 1 : s === 'half_day' ? 0.5 : 0), 0);
}
/** Net pay = gross − deductions − loss of pay + incentive + approved reimbursements − salary advance recovery (never below 0). No PF/ESI/TDS. */
export function netPay(s: { gross: number; deductions: number; lopDays: number; incentive?: number; reimbursement?: number; advanceRecovery?: number }) {
  const lop = Math.round((s.gross / 30) * s.lopDays * 100) / 100;
  return { lop, net: Math.max(0, s.gross - s.deductions - lop + (s.incentive ?? 0) + (s.reimbursement ?? 0) - (s.advanceRecovery ?? 0)) };
}
/** Mirrors hr_generate_payroll(): this month's advance recovery = smallest of the monthly instalment, what is still owed and the pay available. */
export function advanceInstallment(x: { monthly: number; balance: number; payAvailable: number }) {
  return Math.max(0, Math.min(x.monthly, x.balance, x.payAvailable));
}
/** Months needed to recover an advance at a fixed monthly instalment. */
export const recoveryMonths = (amount: number, monthly: number) => (monthly > 0 ? Math.ceil(amount / monthly) : 0);
/** Full & final = pending salary + leave encashment + other dues − recoveries. */
export const fnf = (x: { pending: number; encash: number; other: number; recover: number }) => x.pending + x.encash + x.other - x.recover;
/** Replace {{field}} placeholders; unknown fields stay visible so HR notices them. */
export function fillTemplate(body: string, values: Record<string, string | number | null | undefined>) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => { const v = values[k]; return v === null || v === undefined || v === '' ? m : String(v); });
}
