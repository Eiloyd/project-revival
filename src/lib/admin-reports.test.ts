import { describe, expect, it } from 'vitest';
import { periodRange, teamRollup } from './admin-reports';

describe('admin report periods', () => {
  const now = new Date(2026, 10, 17); // Tue 17 Nov 2026
  it('starts the week on Monday and the financial year on 1 April', () => {
    expect(periodRange('week', now)).toEqual({ from: '2026-11-16', to: '2026-11-17' });
    expect(periodRange('year', now)).toEqual({ from: '2026-04-01', to: '2026-11-17' });
    expect(periodRange('year', new Date(2027, 1, 10)).from).toBe('2026-04-01');
  });
  it('gives full previous month and current quarter', () => {
    expect(periodRange('last_month', now)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(periodRange('quarter', now).from).toBe('2026-10-01');
  });
});

describe('team target roll-up', () => {
  it('adds BDEs to their BDM team, including the BDM, and keeps BDEs without a BDM separate', () => {
    const t = teamRollup([
      { user_id: 'm', role: 'BDM', manager_id: null, name: 'Mona', target: 100, collected: 50, leads: 1, won: 0 },
      { user_id: 'a', role: 'BDE', manager_id: 'm', name: 'Arun', target: 200, collected: 250, leads: 4, won: 2 },
      { user_id: 'b', role: 'BDE', manager_id: null, name: 'Bina', target: 50, collected: 0, leads: 0, won: 0 },
    ]);
    expect(t[0]).toMatchObject({ target: 300, collected: 300, leads: 5, won: 2 });
    expect(t[0]!.members.map(x => x.user_id)).toEqual(['m', 'a']);
    expect(t[1]).toMatchObject({ id: 'unassigned', target: 50 });
  });
});
