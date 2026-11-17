/** Browser-safe request rules shared by the request screens. The database enforces the same rules (`request_submit` / `request_act`). */
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'resolved' | 'paid';
export type Step = 'manager' | 'coordinator' | 'hr' | 'support' | 'accounts' | 'finance' | 'admin';
export type RouteKind = 'leave' | 'attendance' | 'money' | 'ticket' | 'general' | 'exit';
export type Audience = 'employee' | 'volunteer' | 'all';
export type RequestRoute = { type: string; label: string; category: string; audience: Audience; kind: RouteKind; steps: string[]; steps_no_manager: string[]; sla_hours: number; active: boolean; sort_order: number };

export const stepLabels: Record<Step, string> = { manager: 'Reporting manager', coordinator: 'Coordinator', hr: 'HR', support: 'Support', accounts: 'Accounts', finance: 'Finance', admin: 'Admin' };
export const stepLabel = (s: string | null | undefined) => (s && s in stepLabels ? stepLabels[s as Step] : s ?? '');

export const statusLabels: Record<RequestStatus, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled', resolved: 'Resolved', paid: 'Paid' };
export const statusTone: Record<RequestStatus, 'warning' | 'success' | 'danger' | 'muted'> = { pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'muted', resolved: 'success', paid: 'success' };

export const leaveTypes = [{ value: 'casual', label: 'Casual leave' }, { value: 'sick', label: 'Sick leave' }, { value: 'earned', label: 'Earned leave' }, { value: 'unpaid', label: 'Unpaid leave' }] as const;
export const defaultLeaveAllowance = { casual: 12, sick: 12, earned: 15 } as const;

/** Which steps a request goes through: people without a manager/coordinator use the no-manager route, never an empty route. */
export function resolveSteps(route: Pick<RequestRoute, 'steps' | 'steps_no_manager'>, hasManager: boolean): string[] {
  const base = hasManager ? route.steps : route.steps_no_manager.filter(s => s !== 'manager' && s !== 'coordinator');
  return base.length ? base : ['admin'];
}

/** Working days between two dates (inclusive), Sundays excluded — matches the leave count used for balances. */
export function workingDays(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`); const b = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
  let n = 0;
  for (let d = a; d <= b; d = new Date(d.getTime() + 86_400_000)) if (d.getUTCDay() !== 0) n++;
  return n;
}

/** Days a leave request uses: a half day counts 0.5 only on a single date. */
export function leaveDays(from: string, to: string, halfDay = false): number {
  return halfDay && from === to ? (workingDays(from, to) ? 0.5 : 0) : workingDays(from, to);
}

/** Leave still available: allowance minus approved and pending days. */
export function leaveAvailable(allowed: number, used: number, pending: number): number {
  return Math.max(0, allowed - used - pending);
}

/** Maker-checker for money requests: nobody approves their own request, handles two steps, or pays one they verified/approved. */
export function canHandleMoneyStep(input: { actorId: string; applicantId: string; earlierActors: string[]; action: 'approve' | 'paid'; financeApprover?: string | null }): boolean {
  if (input.actorId === input.applicantId) return false;
  if (input.earlierActors.includes(input.actorId)) return false;
  if (input.action === 'paid' && input.financeApprover && input.financeApprover === input.actorId) return false;
  return true;
}

/** Fields each request type asks for in the form. */
export function requestFields(kind: RouteKind, type: string) {
  return {
    dates: kind === 'leave' || kind === 'attendance',
    range: kind === 'leave',
    amount: kind === 'money',
    leaveType: type === 'leave',
    halfDay: type === 'leave',
    correction: type === 'attendance_correction',
    payee: type === 'payment_request',
    reference: kind === 'money',
    category: kind === 'money',
  };
}

export const money = (v: number | string | null | undefined) => `₹${Number(v ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const shortDate = (v: string | null | undefined) => (v ? new Date(v.length <= 10 ? `${v}T00:00:00` : v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const dateTime = (v: string | null | undefined) => (v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const todayIST = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);

/** Leave rule (mirrors `request_submit`): the reporting manager (BDM / senior) may approve alone up to 2 single-day,
 * non-continuous leave days a month; continuous leave (2+ working days), leave touching another leave, or more than
 * 2 manager-approved days in the month also goes to HR. Without a manager, HR approves. */
export const MANAGER_LEAVE_DAYS_PER_MONTH = 2;
export type LeaveRoute = { steps: string[]; hrReason: 'continuous' | 'adjacent' | 'monthly_limit' | 'no_manager' | null };
export function leaveApprovalRoute(input: { days: number; adjacentToOtherLeave: boolean; managerOnlyDaysThisMonth: number; hasManager: boolean }): LeaveRoute {
  if (!input.hasManager) return { steps: ['hr'], hrReason: 'no_manager' };
  if (input.days > 1) return { steps: ['manager', 'hr'], hrReason: 'continuous' };
  if (input.adjacentToOtherLeave) return { steps: ['manager', 'hr'], hrReason: 'adjacent' };
  if (input.managerOnlyDaysThisMonth + input.days > MANAGER_LEAVE_DAYS_PER_MONTH) return { steps: ['manager', 'hr'], hrReason: 'monthly_limit' };
  return { steps: ['manager'], hrReason: null };
}
export const hrReasonLabels: Record<Exclude<LeaveRoute['hrReason'], null>, string> = {
  continuous: 'Continuous leave (2 or more days) needs HR approval',
  adjacent: 'Touches another leave, so it counts as continuous — HR approves',
  monthly_limit: 'Manager can approve only 2 leave days a month alone — HR approves the rest',
  no_manager: 'No reporting manager — HR approves',
};
