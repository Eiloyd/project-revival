import { describe, expect, it } from 'vitest';
import { juryBlock, roundScore, stageProgress, type Stage } from './rules';

const stages: Stage[] = [
  { id: 's1', name: 'Screening', position: 10, jury_round: null, active: true },
  { id: 'j1', name: 'Jury 1', position: 20, jury_round: 1, active: true },
  { id: 'j2', name: 'Jury 2', position: 30, jury_round: 2, active: true },
  { id: 'dd', name: 'Due diligence', position: 40, jury_round: null, active: true },
];
const ev = (round: number, decision: string) => ({ round, decision, innovation: 8, market: 7, team: 9, feasibility: 6 });

describe('mandatory jury rounds', () => {
  it('allows moving into Jury Round 1 without any evaluation', () => { expect(juryBlock(stages, [], stages[1]!)).toBeNull(); });
  it('blocks Jury Round 2 until Round 1 is cleared', () => { expect(juryBlock(stages, [ev(1, 'revise')], stages[2]!)).toBe(1); });
  it('blocks due diligence until Round 2 is cleared too', () => { expect(juryBlock(stages, [ev(1, 'cleared')], stages[3]!)).toBe(2); });
  it('allows due diligence after both rounds are cleared', () => { expect(juryBlock(stages, [ev(1, 'cleared'), ev(2, 'cleared')], stages[3]!)).toBeNull(); });
  it('blocks marking funded until both rounds are cleared', () => { expect(juryBlock(stages, [ev(1, 'cleared')], 'funded')).toBe(2); });
});

describe('scores and progress', () => {
  it('averages the 40-point jury score per juror', () => { expect(roundScore([ev(1, 'cleared'), { ...ev(1, 'revise'), innovation: 4 }], 1)).toEqual({ count: 2, average: 28 }); });
  it('shows progress through active stages', () => { expect(stageProgress(stages, 'j2', 'active')).toBe(75); expect(stageProgress(stages, 's1', 'funded')).toBe(100); });
});
