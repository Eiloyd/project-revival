/** Lead Research rules shared by the research screens; the database applies the same deadlines and freshness window. */
export type Difficulty = 'simple' | 'medium' | 'advanced';
export const difficulties: { value: Difficulty; label: string; days: number; dailyTarget: number }[] = [
  { value: 'simple', label: 'Simple', days: 2, dailyTarget: 100 },
  { value: 'medium', label: 'Medium', days: 5, dailyTarget: 50 },
  { value: 'advanced', label: 'Advanced', days: 10, dailyTarget: 20 },
];
/** Leads verified longer ago than this must be re-verified before they are reused. */
export const FRESH_DAYS = 90;

/** Deadline in working days (Sundays skipped) from the request date. */
export function researchDueDate(fromIso: string, difficulty: Difficulty): string {
  let left = difficulties.find(d => d.value === difficulty)!.days;
  const d = new Date(`${fromIso}T00:00:00Z`);
  while (left > 0) { d.setUTCDate(d.getUTCDate() + 1); if (d.getUTCDay() !== 0) left--; }
  return d.toISOString().slice(0, 10);
}

export function isFresh(verifiedAt: string | null | undefined, now = Date.now()): boolean {
  return Boolean(verifiedAt) && now - new Date(verifiedAt!).getTime() <= FRESH_DAYS * 86_400_000;
}

/** Delivery progress for partial delivery (e.g. 350 of 500). */
export function deliveryProgress(delivered: number, quantity: number) {
  const pct = quantity > 0 ? Math.min(100, Math.round((delivered / quantity) * 100)) : 0;
  return { delivered, pending: Math.max(0, quantity - delivered), pct, complete: delivered >= quantity };
}
