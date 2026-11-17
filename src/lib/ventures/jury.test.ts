import { describe, expect, it } from 'vitest';
import { averageDaysPerStage, juryTally } from './rules';

describe('jury desk and ventures reports', () => {
  it('tallies each jury decision for a round', () => {
    const e = (round: number, decision: string) => ({ round, decision, innovation: 5, market: 5, team: 5, feasibility: 5 });
    expect(juryTally([e(1, 'cleared'), e(1, 'cleared'), e(1, 'revise'), e(2, 'rejected')], 1)).toEqual({ cleared: 2, revise: 1, rejected: 0 });
  });
  it('averages days per stage until the next move', () => {
    const d = (x: string) => `2026-11-${x}T00:00:00Z`;
    const r = averageDaysPerStage([
      { application_id: 'a', to_stage: 's1', created_at: d('01') }, { application_id: 'a', to_stage: 's2', created_at: d('05') },
      { application_id: 'b', to_stage: 's1', created_at: d('01') }, { application_id: 'b', to_stage: 's2', created_at: d('03') },
    ], new Date(d('10')).getTime());
    expect(r['s1']).toBe(3);
    expect(r['s2']).toBe(6);
  });
});
