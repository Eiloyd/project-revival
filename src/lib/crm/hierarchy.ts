/**
 * Browser-safe sales hierarchy rules. They mirror database/update-2026-11-18-sales-hierarchy.sql
 * (crm_rank, crm_senior_role, crm_downline, target_set), which stays the real gate.
 *   SSM → SM → ASM → BDM → BDE → JBDE   (volunteers hang off the employee who added them)
 */
export const salesLadder = ['SSM', 'SM', 'ASM', 'BDM', 'BDE', 'JBDE'] as const;
export type SalesRole = (typeof salesLadder)[number];

export const roleNames: Record<string, string> = {
  admin: 'Administrator', SSM: 'Senior Sales Manager', SM: 'Sales Manager', ASM: 'Assistant Sales Manager',
  BDM: 'Business Development Manager', BDE: 'Business Development Executive', JBDE: 'Junior Business Development Executive',
  sales: 'Sales', support: 'Support',
};

export const isSalesRole = (role: string): role is SalesRole => (salesLadder as readonly string[]).includes(role);
/** 1 = most senior; null outside the sales ladder. */
export const rankOf = (role: string) => (isSalesRole(role) ? salesLadder.indexOf(role) + 1 : null);
/** The role a person reports to (SSM reports to the admin → null). Sales/support keep reporting to a BDM. */
export function seniorRoleOf(role: string): string | null {
  const r = rankOf(role);
  if (r === null) return 'BDM';
  return r === 1 ? null : (salesLadder[r - 2] ?? null);
}
/** Roles that have people below them (and so may hand out leads in their team). */
export const isManagerRole = (role: string) => role === 'admin' || (isSalesRole(role) && role !== 'JBDE');

export type TeamMember = { user_id: string; role: string; manager_id: string | null; active: boolean };

/** Everyone below a person (active only; the chain is followed through inactive managers too). */
export function downlineOf(userId: string, members: TeamMember[]): string[] {
  const out = new Set<string>(); const seen = new Set<string>([userId]); let frontier = [userId];
  for (let depth = 0; depth < 10 && frontier.length; depth++) {
    const next: string[] = [];
    for (const m of members) if (m.manager_id && frontier.includes(m.manager_id) && !seen.has(m.user_id)) { seen.add(m.user_id); next.push(m.user_id); if (m.active) out.add(m.user_id); }
    frontier = next;
  }
  return [...out];
}
/** Everyone above a person, nearest first. */
export function uplineOf(userId: string, members: TeamMember[]): string[] {
  const out: string[] = []; let cur = members.find(m => m.user_id === userId)?.manager_id ?? null;
  while (cur && !out.includes(cur) && cur !== userId && out.length < 10) { out.push(cur); cur = members.find(m => m.user_id === cur)?.manager_id ?? null; }
  return out;
}
/** The person plus their whole active down-line: the basis for team targets, collections and pay. */
export const teamIdsOf = (userId: string, members: TeamMember[]) => [userId, ...downlineOf(userId, members)];

/** Which "My …" tabs a viewer sees: every ladder role below theirs (admin: all), plus Volunteers for everyone except JBDE. */
export function teamTabsFor(role: string): (SalesRole | 'volunteers')[] {
  if (role === 'admin') return [...salesLadder, 'volunteers'];
  const r = rankOf(role); if (r === null || r === 6) return [];
  return [...salesLadder.slice(r), 'volunteers'];
}

export type TargetValues = { revenue: number; wins: number; calls: number };
/**
 * Who may set a target and how: the admin sets or changes any target; a senior anywhere above the person may
 * set it or raise it, never lower it; nobody sets their own.
 */
export function targetChangeAllowed(o: { actorRole: string; actorId: string; ownerId: string; members: TeamMember[]; old: TargetValues | null; next: TargetValues }): { ok: true } | { ok: false; reason: string } {
  if (o.actorRole === 'admin') return { ok: true };
  if (o.actorId === o.ownerId) return { ok: false, reason: 'You cannot set your own target. Your senior or the admin sets it.' };
  if (!uplineOf(o.ownerId, o.members).includes(o.actorId)) return { ok: false, reason: "Only a senior in this person's reporting line (or the admin) can set their target." };
  if (o.old && (o.next.revenue < o.old.revenue || o.next.wins < o.old.wins || o.next.calls < o.old.calls)) return { ok: false, reason: 'A senior can only increase a target, never reduce it. Ask the admin to lower it.' };
  return { ok: true };
}

/** Team target = the person's own individual target + every individual target in their down-line. */
export function teamTarget(userId: string, members: TeamMember[], targetOf: (id: string) => number) {
  const ids = teamIdsOf(userId, members);
  const own = targetOf(userId);
  return { own, team: ids.slice(1).reduce((n, id) => n + targetOf(id), 0), total: ids.reduce((n, id) => n + targetOf(id), 0) };
}

/** A Won lead with Accounts-verified money may be forwarded to Support once, by the BDE or anyone senior (admin too). */
export function canForwardToSupport(o: { actorRole: string; stage: string; verifiedPaid: number; alreadyForwarded: boolean }): { ok: true } | { ok: false; reason: string } {
  const r = rankOf(o.actorRole);
  if (o.actorRole !== 'admin' && (r === null || r > 5)) return { ok: false, reason: 'Only a BDE or a senior can forward a lead to Support.' };
  if (o.alreadyForwarded) return { ok: false, reason: 'Already forwarded to Support.' };
  if (o.stage !== 'won') return { ok: false, reason: 'Move the lead to Won first.' };
  if (o.verifiedPaid <= 0) return { ok: false, reason: 'Payment is not confirmed yet: Accounts must verify a collection for this lead first.' };
  return { ok: true };
}
