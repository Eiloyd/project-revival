import { describe, expect, it } from 'vitest';
import { hoursBetween, slaState, teamStats, type SlaTicket } from './sla';
const now = '2026-06-10T12:00:00Z';
const ticket: SlaTicket = { assigned_to: 'a', status: 'open', priority: 'urgent', created_at: '2026-06-10T07:00:00Z', due_at: '2026-06-10T11:00:00Z', first_response_at: '2026-06-10T09:00:00Z', resolved_at: null, escalation_level: 1 };
describe('SLA states', () => {
  it('marks a five-hour-old urgent ticket overdue at its four-hour deadline', () => expect(slaState(ticket, now)).toBe('breached'));
  it('marks a ticket due in one hour at risk', () => expect(slaState({ ...ticket, due_at: '2026-06-10T13:00:00Z' }, now)).toBe('at_risk'));
  it('marks resolved and closed tickets done despite old deadlines', () => {
    expect(slaState({ ...ticket, status: 'resolved' }, now)).toBe('done');
    expect(slaState({ ...ticket, status: 'closed' }, now)).toBe('done');
  });
  it('handles boundaries and missing deadlines', () => {
    expect(slaState({ ...ticket, due_at: now }, now)).toBe('at_risk');
    expect(slaState({ ...ticket, due_at: '2026-06-10T14:00:00Z' }, now)).toBe('at_risk');
    expect(slaState({ ...ticket, due_at: '2026-06-10T14:00:01Z' }, now)).toBe('ok');
    expect(slaState({ ...ticket, due_at: null }, now)).toBe('ok');
  });
});
it('calculates hours without negative or invalid durations', () => {
  expect(hoursBetween(ticket.created_at, now)).toBe(5);
  expect(hoursBetween(now, ticket.created_at)).toBe(0);
  expect(hoursBetween('invalid', now)).toBe(0);
});
it('calculates concrete team totals and excludes missing response samples', () => {
  const result = teamStats([ticket, { ...ticket, status: 'resolved', resolved_at: '2026-06-10T11:00:00Z', first_response_at: null }, { ...ticket, assigned_to: null }], [{ user_id: 'a', full_name: 'A', level: 'executive', active: true }, { user_id: 'b', full_name: 'B', level: 'executive', active: true }], now, '2026-06');
  expect(result.unassigned).toBe(1);
  expect(result.members[0]).toMatchObject({ assignedOpen: 1, resolvedThisMonth: 1, slaBreaches: 1, avgFirstResponseHours: 2, avgResolutionHours: 4, escalatedCount: 1 });
  expect(result.members[1]).toMatchObject({ assignedOpen: 0, avgFirstResponseHours: null, avgResolutionHours: null });
  expect(teamStats([{ ...ticket, status: 'resolved', resolved_at: '2026-05-31T12:00:00Z' }], result.members, now, '2026-06').members[0]?.resolvedThisMonth).toBe(0);
});
