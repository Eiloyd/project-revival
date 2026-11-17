import { describe, expect, it } from 'vitest';
import { podium } from './leaderboard';

describe('sales leaderboard podium', () => {
  it('puts the top three earners on the podium and the rest below', () => {
    const rows = [1, 2, 3, 4].map(rank => ({ user_id: String(rank), rank, verified: 1000 / rank }));
    const { top, rest } = podium(rows);
    expect(top.map(r => r.rank)).toEqual([1, 2, 3]);
    expect(rest.map(r => r.rank)).toEqual([4]);
  });
  it('gives no badge to people with no verified collection yet', () => {
    const { top, rest } = podium([{ user_id: 'a', rank: 1, verified: 0 }, { user_id: 'b', rank: 1, verified: 0 }]);
    expect(top).toEqual([]);
    expect(rest).toHaveLength(2);
  });
});
