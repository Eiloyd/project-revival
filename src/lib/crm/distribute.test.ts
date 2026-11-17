import { describe, expect, it } from 'vitest';
import { leadReceivers, splitEvenly } from './distribute';

const members = [
  { user_id: 'bdm1', role: 'BDM', manager_id: null, active: true },
  { user_id: 'bde1', role: 'BDE', manager_id: 'bdm1', active: true },
  { user_id: 'bde2', role: 'BDE', manager_id: 'bdm1', active: true },
  { user_id: 'bde3', role: 'BDE', manager_id: 'bdm2', active: true },
  { user_id: 'old', role: 'BDE', manager_id: 'bdm1', active: false },
];

describe('lead distribution', () => {
  it('shares 5 leads among 2 people as 3 and 2', () => {
    const r = splitEvenly(['a', 'b', 'c', 'd', 'e'], ['p1', 'p2']);
    expect(r.get('p1')).toEqual(['a', 'c', 'e']);
    expect(r.get('p2')).toEqual(['b', 'd']);
  });
  it('admin can give leads to any active BDM/BDE or keep them', () => {
    expect(leadReceivers('admin', 'adm', members)).toEqual(['adm', 'bdm1', 'bde1', 'bde2', 'bde3']);
  });
  it('a BDM can give leads only to own active BDEs or keep them', () => {
    expect(leadReceivers('BDM', 'bdm1', members)).toEqual(['bdm1', 'bde1', 'bde2']);
  });
  it('a BDE cannot hand leads to anyone', () => { expect(leadReceivers('BDE', 'bde1', members)).toEqual([]); });
});
