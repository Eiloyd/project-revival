export type SlaTicket = {
  assigned_to: string | null; status: string; priority: string; created_at: string;
  due_at: string | null; first_response_at: string | null; resolved_at: string | null; escalation_level: number;
};
export type TeamMember = { user_id: string; full_name: string; level: string; active: boolean };
type Instant = string | number | Date;
const millis = (value: Instant) => new Date(value).getTime();
export function hoursBetween(start: Instant, end: Instant): number {
  const hours = (millis(end) - millis(start)) / 3_600_000;
  return Number.isFinite(hours) ? Math.max(0, hours) : 0;
}
export function slaState(ticket: SlaTicket, now: Instant): 'breached' | 'at_risk' | 'ok' | 'done' {
  if (['resolved', 'closed'].includes(ticket.status)) return 'done';
  if (!ticket.due_at || !Number.isFinite(millis(ticket.due_at))) return 'ok';
  const remaining = millis(ticket.due_at) - millis(now);
  return remaining < 0 ? 'breached' : remaining <= 7_200_000 ? 'at_risk' : 'ok';
}
export function averageHours(tickets: SlaTicket[], field: 'first_response_at' | 'resolved_at'): number | null {
  const values = tickets.filter(t => t[field] && Number.isFinite(millis(t[field]!)) && millis(t[field]!) >= millis(t.created_at));
  return values.length ? values.reduce((sum, t) => sum + hoursBetween(t.created_at, t[field]!), 0) / values.length : null;
}
export function teamStats(tickets: SlaTicket[], team: TeamMember[], now: Instant, monthPrefix: string) {
  return {
    unassigned: tickets.filter(t => !t.assigned_to && !['resolved', 'closed'].includes(t.status)).length,
    members: team.map(member => {
      const owned = tickets.filter(t => t.assigned_to === member.user_id);
      return { ...member, assignedOpen: owned.filter(t => !['resolved', 'closed'].includes(t.status)).length,
        resolvedThisMonth: owned.filter(t => ['resolved', 'closed'].includes(t.status) && t.resolved_at?.startsWith(monthPrefix)).length,
        slaBreaches: owned.filter(t => slaState(t, now) === 'breached').length,
        avgFirstResponseHours: averageHours(owned, 'first_response_at'), avgResolutionHours: averageHours(owned, 'resolved_at'),
        escalatedCount: owned.filter(t => t.escalation_level > 0 && !['resolved', 'closed'].includes(t.status)).length };
    }),
  };
}
