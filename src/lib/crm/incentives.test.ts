import { describe, expect, it } from 'vitest';
import { calculateIncentive, collectionTotals, incentivePlanSchema } from './incentives';

const plan = { active: true, slabs: [{ min: 50, rate: 2, bonus: 0 }, { min: 100, rate: 5, bonus: 2000 }, { min: 80, rate: 3, bonus: 500 }] };

describe('BDE/BDM incentive', () => {
  it('pays nothing without an active admin plan', () => {
    expect(calculateIncentive({ ...plan, active: false }, 100000, 100000).incentive).toBe(0);
    expect(calculateIncentive({ active: true, slabs: [] }, 100000, 100000).status).toBe('no_plan');
  });
  it('still shows target achieved without a plan: ₹55,000 of ₹1,00,000 is 55%', () => {
    expect(calculateIncentive(null, 55000, 100000)).toMatchObject({ status: 'no_plan', achievement: 55, incentive: 0 });
  });
  it('pays nothing when no revenue target is set', () => {
    expect(calculateIncentive(plan, 100000, 0)).toMatchObject({ status: 'no_target', incentive: 0 });
  });
  it('pays nothing below the first slab and shows the gap to it', () => {
    expect(calculateIncentive(plan, 40000, 100000)).toMatchObject({ status: 'below_first_slab', incentive: 0, nextGap: 10000 });
  });
  it('uses the highest slab reached: 85% of target earns 3% + ₹500', () => {
    expect(calculateIncentive(plan, 85000, 100000)).toMatchObject({ status: 'earned', achievement: 85, incentive: 3050 });
  });
  it('overachievement at 120% earns the top slab: 5% + ₹2000', () => {
    expect(calculateIncentive(plan, 120000, 100000).incentive).toBe(8000);
  });
  it('rounds achievement down so 99.9% stays in the 80% slab', () => {
    expect(calculateIncentive(plan, 99900, 100000).slab?.min).toBe(80);
  });
  it('rejects two slabs with the same starting %', () => {
    expect(incentivePlanSchema.safeParse({ role: 'BDE', active: true, slabs: [{ min: 50, rate: 1, bonus: 0 }, { min: 50, rate: 2, bonus: 0 }] }).success).toBe(false);
  });
});

describe("today's collection", () => {
  const rows = [
    { owner_id: 'a', amount: 5000, status: 'verified', collected_on: '2026-11-16' },
    { owner_id: 'a', amount: '2500', status: 'unverified', collected_on: '2026-11-16' },
    { owner_id: 'a', amount: 1000, status: 'rejected', collected_on: '2026-11-16' },
    { owner_id: 'b', amount: 9000, status: 'verified', collected_on: '2026-11-15' },
  ];
  it('splits verified and unverified; only verified is collected', () => {
    expect(collectionTotals(rows, ['a'], '2026-11-16')).toEqual({ verified: 5000, unverified: 2500, rejected: 1000, collected: 5000 });
  });
  it('totals a month across the team', () => {
    expect(collectionTotals(rows, null, undefined, '2026-11').collected).toBe(14000);
  });
});
