import { describe, expect, it } from 'vitest';
import { leaveApprovalRoute } from './requests';

describe('leave approval rule', () => {
  it('manager approves a single day alone', () => expect(leaveApprovalRoute({ days: 1, adjacentToOtherLeave: false, managerOnlyDaysThisMonth: 0, hasManager: true }).steps).toEqual(['manager']));
  it('second single day in the month is still manager-only', () => expect(leaveApprovalRoute({ days: 1, adjacentToOtherLeave: false, managerOnlyDaysThisMonth: 1, hasManager: true }).steps).toEqual(['manager']));
  it('third manager-only day in the month goes to HR', () => expect(leaveApprovalRoute({ days: 1, adjacentToOtherLeave: false, managerOnlyDaysThisMonth: 2, hasManager: true })).toEqual({ steps: ['manager', 'hr'], hrReason: 'monthly_limit' }));
  it('2 continuous days cannot be approved by the manager alone', () => expect(leaveApprovalRoute({ days: 2, adjacentToOtherLeave: false, managerOnlyDaysThisMonth: 0, hasManager: true })).toEqual({ steps: ['manager', 'hr'], hrReason: 'continuous' }));
  it('a single day next to another leave goes to HR', () => expect(leaveApprovalRoute({ days: 1, adjacentToOtherLeave: true, managerOnlyDaysThisMonth: 0, hasManager: true }).hrReason).toBe('adjacent'));
  it('half day counts within the 2-day allowance', () => expect(leaveApprovalRoute({ days: 0.5, adjacentToOtherLeave: false, managerOnlyDaysThisMonth: 1.5, hasManager: true }).steps).toEqual(['manager']));
  it('no manager means HR', () => expect(leaveApprovalRoute({ days: 1, adjacentToOtherLeave: false, managerOnlyDaysThisMonth: 0, hasManager: false }).steps).toEqual(['hr']));
});
