import { z } from 'zod';

/** One incentive slab: from `min` % of the monthly revenue target, pay `rate` % of verified revenue plus a fixed `bonus` (₹). */
export type IncentiveSlab = { min: number; rate: number; bonus: number };
export type IncentivePlan = { role: 'BDE' | 'BDM'; slabs: IncentiveSlab[]; active: boolean };
export type Collection = { owner_id: string; amount: number | string; status: string; collected_on: string };

export const slabSchema = z.object({ min: z.number().min(0).max(1000), rate: z.number().min(0).max(100), bonus: z.number().min(0).max(10_000_000) });
export const incentivePlanSchema = z.object({
  role: z.enum(['BDE', 'BDM']),
  active: z.boolean(),
  slabs: z.array(slabSchema).max(10).refine(s => new Set(s.map(x => x.min)).size === s.length, 'Each slab needs a different starting %'),
});

export function sortSlabs(slabs: IncentiveSlab[]) { return [...slabs].sort((a, b) => a.min - b.min); }

/** Normalises whatever is stored in the database into clean slabs (bad rows are dropped). */
export function readSlabs(raw: unknown): IncentiveSlab[] {
  if (!Array.isArray(raw)) return [];
  return sortSlabs(raw.flatMap(r => { const p = slabSchema.safeParse(r); return p.success ? [p.data] : []; }));
}

export type IncentiveResult = {
  status: 'no_plan' | 'no_target' | 'below_first_slab' | 'earned';
  /** Direct verified collection — the only revenue the incentive is paid on. */
  revenue: number;
  /** Volunteer-sourced revenue: counts toward target achievement, earns 0% incentive. */
  volunteerRevenue: number;
  target: number; achievement: number; incentive: number;
  slab: IncentiveSlab | null; next: IncentiveSlab | null; nextGap: number;
};

/**
 * Incentive = DIRECT verified revenue × slab rate % + slab bonus. The slab is the highest one whose
 * starting % is reached, where achievement = (direct verified + volunteer-sourced revenue) ÷ target,
 * rounded down. Volunteer revenue helps reach the target but is never paid incentive on.
 * No active plan, or no target, means no incentive — nothing is invented.
 */
export function calculateIncentive(plan: Pick<IncentivePlan, 'slabs' | 'active'> | null | undefined, verifiedRevenue: number, target: number, volunteerRevenue = 0): IncentiveResult {
  const revenue = Math.max(0, Number.isFinite(verifiedRevenue) ? verifiedRevenue : 0);
  const vol = Math.max(0, Number.isFinite(volunteerRevenue) ? volunteerRevenue : 0);
  const towardTarget = revenue + vol;
  const slabs = sortSlabs(plan?.slabs ?? []);
  // Achievement is shown even without a plan, so people still see how close they are to target.
  const achievement = target > 0 ? Math.floor((towardTarget / target) * 100) : 0;
  const base = { revenue, volunteerRevenue: vol, target: target > 0 ? target : 0, achievement, incentive: 0, slab: null, next: null, nextGap: 0 };
  if (!plan?.active || slabs.length === 0) return { ...base, status: 'no_plan' };
  if (!(target > 0)) return { ...base, status: 'no_target' };
  const slab = [...slabs].reverse().find(s => achievement >= s.min) ?? null;
  const next = slabs.find(s => s.min > achievement) ?? null;
  const nextGap = next ? Math.max(0, Math.ceil((next.min / 100) * target - towardTarget)) : 0;
  if (!slab) return { ...base, achievement, next, nextGap, status: 'below_first_slab' };
  const incentive = Math.round(revenue * slab.rate / 100 + slab.bonus);
  return { ...base, achievement, slab, next, nextGap, incentive, status: 'earned' };
}

/** Only verified collections count as collected money. */
export function collectionTotals(rows: Collection[], owners: string[] | null, day?: string, month?: string) {
  const pick = rows.filter(r => (!owners || owners.includes(r.owner_id)) && (!day || r.collected_on === day) && (!month || r.collected_on.startsWith(month)));
  const sum = (status: string) => pick.filter(r => r.status === status).reduce((n, r) => n + Number(r.amount), 0);
  return { verified: sum('verified'), unverified: sum('unverified'), rejected: sum('rejected'), collected: sum('verified') };
}

/** Volunteer-sourced revenue rows (fee of each credited volunteer referral, per owning employee and India day). */
export type VolunteerRevenueRow = { employee_id: string; day: string; revenue: number | string; forms: number | string };
export function volunteerTotals(rows: VolunteerRevenueRow[], owners: string[] | null, day?: string, month?: string) {
  const pick = rows.filter(r => (!owners || owners.includes(r.employee_id)) && (!day || r.day === day) && (!month || r.day.startsWith(month)));
  return { revenue: pick.reduce((n, r) => n + Number(r.revenue), 0), forms: pick.reduce((n, r) => n + Number(r.forms), 0) };
}
