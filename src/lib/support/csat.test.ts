import { describe, expect, it } from 'vitest';
import { csatByOwner, csatSummary } from './csat';
describe('CSAT', () => {
  it('counts only 4 and 5 stars as satisfied', () => {
    const s = csatSummary([{ csat_rating: 5, assigned_to: 'a' }, { csat_rating: 4, assigned_to: 'a' }, { csat_rating: 2, assigned_to: 'b' }, { csat_rating: null, assigned_to: 'b' }]);
    expect(s.count).toBe(3); expect(s.csat).toBe(67); expect(s.average).toBeCloseTo(3.667, 2);
  });
  it('returns no score when nobody has rated', () => { expect(csatSummary([{ csat_rating: null, assigned_to: 'a' }]).csat).toBeNull(); });
  it('groups ratings by the executive who owned the ticket', () => {
    const r = csatByOwner([{ csat_rating: 5, assigned_to: 'a' }, { csat_rating: 1, assigned_to: 'b' }, { csat_rating: 3, assigned_to: null }]);
    expect(r.find(x => x.owner === 'a')?.csat).toBe(100); expect(r).toHaveLength(2);
  });
});
