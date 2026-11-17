/**
 * Lead distribution: share the picked leads equally (round-robin, in the order shown) among the chosen people.
 * Admin can give leads to a BDM's team, to BDEs or keep them; a BDM can give them to own BDEs or keep them.
 */
export function splitEvenly<T>(items: readonly T[], people: readonly string[]): Map<string, T[]> {
  const out = new Map<string, T[]>(people.map(p => [p, []]));
  if (!people.length) return out;
  items.forEach((item, i) => out.get(people[i % people.length]!)!.push(item));
  return out;
}

/** Who may receive leads: Admin → every active BDM/BDE/sales + self; BDM → own BDEs + self; others → nobody. */
export function leadReceivers(role: string, selfId: string, members: readonly { user_id: string; role: string; manager_id: string | null; active: boolean }[]): string[] {
  if (role !== 'admin' && role !== 'BDM') return [];
  const others = members.filter(m => m.active && m.user_id !== selfId && (role === 'admin' ? ['BDM', 'BDE', 'sales'].includes(m.role) : m.manager_id === selfId && m.role === 'BDE')).map(m => m.user_id);
  return [selfId, ...others];
}
