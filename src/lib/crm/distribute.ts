import { downlineOf, isManagerRole, isSalesRole } from './hierarchy';
/**
 * Lead distribution: share the picked leads equally (round-robin, in the order shown) among the chosen people.
 * Admin can give leads to anyone in sales or keep them; every manager (SSM, SM, ASM, BDM, BDE) can give them to
 * anyone in their own down-line or keep them.
 */
export function splitEvenly<T>(items: readonly T[], people: readonly string[]): Map<string, T[]> {
  const out = new Map<string, T[]>(people.map(p => [p, []]));
  if (!people.length) return out;
  items.forEach((item, i) => out.get(people[i % people.length]!)!.push(item));
  return out;
}

/** Who may receive leads: Admin → every active sales person + self; a manager → own active down-line + self; others → nobody. */
export function leadReceivers(role: string, selfId: string, members: readonly { user_id: string; role: string; manager_id: string | null; active: boolean }[]): string[] {
  if (!isManagerRole(role)) return [];
  const below = new Set(downlineOf(selfId, [...members]));
  const others = members.filter(m => m.active && m.user_id !== selfId && (role === 'admin' ? (isSalesRole(m.role) || m.role === 'sales') : below.has(m.user_id))).map(m => m.user_id);
  return [selfId, ...others];
}
