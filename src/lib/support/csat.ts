/** Customer satisfaction maths for the Support Desk (CSAT = share of 4-5 star ratings). */
export type Rated = { csat_rating: number | null; assigned_to: string | null };
export function csatSummary(rows: Rated[]) {
  const rated = rows.filter(r => r.csat_rating !== null) as (Rated & { csat_rating: number })[];
  const count = rated.length;
  const average = count ? rated.reduce((s, r) => s + r.csat_rating, 0) / count : null;
  const csat = count ? Math.round((rated.filter(r => r.csat_rating >= 4).length / count) * 100) : null;
  const byStar = [1, 2, 3, 4, 5].map(n => rated.filter(r => r.csat_rating === n).length);
  return { count, average, csat, byStar };
}
export function csatByOwner(rows: Rated[]) {
  const map = new Map<string, Rated[]>();
  for (const r of rows) { if (r.csat_rating === null || !r.assigned_to) continue; map.set(r.assigned_to, [...(map.get(r.assigned_to) ?? []), r]); }
  return [...map.entries()].map(([owner, list]) => ({ owner, ...csatSummary(list) }));
}
