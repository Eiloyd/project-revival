/** Splits the database ranking into the podium (ranks 1–3, ties share a rank) and everyone else. */
export function podium<T extends { rank: number; verified: number }>(rows: T[]): { top: T[]; rest: T[] } {
  const top = rows.filter(r => r.rank <= 3 && r.verified > 0).slice(0, 3);
  return { top, rest: rows.filter(r => !top.includes(r)) };
}
