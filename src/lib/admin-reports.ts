export type Period = 'today' | 'week' | 'month' | 'last_month' | 'quarter' | 'year' | 'custom';
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Date range for a report period (weeks start Monday; the financial year starts 1 April). */
export function periodRange(p: Period, now = new Date()): { from: string; to: string } {
  const y = now.getFullYear(), m = now.getMonth(), today = iso(now);
  switch (p) {
    case 'today': return { from: today, to: today };
    case 'week': { const d = new Date(now); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return { from: iso(d), to: today }; }
    case 'last_month': return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case 'quarter': return { from: iso(new Date(y, m - (m % 3), 1)), to: today };
    case 'year': return { from: iso(new Date(m >= 3 ? y : y - 1, 3, 1)), to: today };
    default: return { from: iso(new Date(y, m, 1)), to: today };
  }
}

export type SalesPerson = { user_id: string; role: string; manager_id: string | null; name: string; target: number; collected: number; leads: number; won: number };
export type Team = { id: string; name: string; target: number; collected: number; leads: number; won: number; members: SalesPerson[] };
/** Groups BDEs under their BDM; the team total includes the BDM's own numbers. BDEs without a BDM form an "Unassigned" team. */
export function teamRollup(people: SalesPerson[]): Team[] {
  const bdms = people.filter(p => p.role === 'BDM');
  const teams: Team[] = bdms.map(b => ({ id: b.user_id, name: `${b.name} (BDM)`, target: 0, collected: 0, leads: 0, won: 0, members: [b, ...people.filter(p => p.role !== 'BDM' && p.manager_id === b.user_id)] }));
  const loose = people.filter(p => p.role !== 'BDM' && !bdms.some(b => b.user_id === p.manager_id));
  if (loose.length) teams.push({ id: 'unassigned', name: 'No BDM assigned', target: 0, collected: 0, leads: 0, won: 0, members: loose });
  for (const t of teams) for (const m of t.members) { t.target += Number(m.target) || 0; t.collected += Number(m.collected) || 0; t.leads += m.leads; t.won += m.won; }
  return teams;
}
