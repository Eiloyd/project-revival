import { describe, expect, it } from 'vitest';
import { canForwardToSupport, downlineOf, seniorRoleOf, targetChangeAllowed, teamTabsFor, teamTarget, uplineOf } from './hierarchy';

const m = (user_id: string, role: string, manager_id: string | null, active = true) => ({ user_id, role, manager_id, active });
const members = [
  m('ssm', 'SSM', null), m('sm', 'SM', 'ssm'), m('asm', 'ASM', 'sm'), m('bdm', 'BDM', 'asm'), m('bde', 'BDE', 'bdm'), m('jbde', 'JBDE', 'bde'),
  m('bde2', 'BDE', 'bdm', false), m('jbde2', 'JBDE', 'bde2'), m('other-bdm', 'BDM', null), m('other-bde', 'BDE', 'other-bdm'),
];

describe('sales hierarchy', () => {
  it('each role reports to the role directly above it; SSM reports to the admin', () => {
    expect(seniorRoleOf('SM')).toBe('SSM'); expect(seniorRoleOf('ASM')).toBe('SM'); expect(seniorRoleOf('BDM')).toBe('ASM');
    expect(seniorRoleOf('BDE')).toBe('BDM'); expect(seniorRoleOf('JBDE')).toBe('BDE'); expect(seniorRoleOf('SSM')).toBeNull();
  });
  it('an SSM sees the whole down-line, but not another team', () => {
    const d = downlineOf('ssm', members);
    expect(d).toEqual(expect.arrayContaining(['sm', 'asm', 'bdm', 'bde', 'jbde', 'jbde2']));
    expect(d).not.toContain('other-bde');
  });
  it('an inactive manager is skipped but their active people still count for the senior', () => {
    const d = downlineOf('bdm', members);
    expect(d).toContain('jbde2'); expect(d).not.toContain('bde2');
  });
  it('a BDE sees only own JBDEs; a JBDE sees nobody', () => {
    expect(downlineOf('bde', members)).toEqual(['jbde']); expect(downlineOf('jbde', members)).toEqual([]);
  });
  it('team tabs follow the ladder below the viewer', () => {
    expect(teamTabsFor('admin')).toEqual(['SSM', 'SM', 'ASM', 'BDM', 'BDE', 'JBDE', 'volunteers']);
    expect(teamTabsFor('SSM')).toEqual(['SM', 'ASM', 'BDM', 'BDE', 'JBDE', 'volunteers']);
    expect(teamTabsFor('SM')).toEqual(['ASM', 'BDM', 'BDE', 'JBDE', 'volunteers']);
    expect(teamTabsFor('ASM')).toEqual(['BDM', 'BDE', 'JBDE', 'volunteers']);
    expect(teamTabsFor('BDM')).toEqual(['BDE', 'JBDE', 'volunteers']);
    expect(teamTabsFor('BDE')).toEqual(['JBDE', 'volunteers']);
    expect(teamTabsFor('JBDE')).toEqual([]);
  });
  it('upline is nearest senior first', () => { expect(uplineOf('jbde', members)).toEqual(['bde', 'bdm', 'asm', 'sm', 'ssm']); });
});

describe('targets', () => {
  const t = { revenue: 100000, wins: 10, calls: 200 };
  it('a BDM team target is own individual target plus every member below', () => {
    const own: Record<string, number> = { bdm: 50000, bde: 100000, jbde: 30000 };
    expect(teamTarget('bdm', members, id => own[id] ?? 0)).toEqual({ own: 50000, team: 130000, total: 180000 });
  });
  it('a senior can raise a target but never lower it', () => {
    expect(targetChangeAllowed({ actorRole: 'ASM', actorId: 'asm', ownerId: 'bde', members, old: t, next: { ...t, revenue: 150000 } }).ok).toBe(true);
    expect(targetChangeAllowed({ actorRole: 'ASM', actorId: 'asm', ownerId: 'bde', members, old: t, next: { ...t, revenue: 90000 } }).ok).toBe(false);
    expect(targetChangeAllowed({ actorRole: 'BDM', actorId: 'bdm', ownerId: 'bde', members, old: t, next: { ...t, calls: 150 } }).ok).toBe(false);
  });
  it('the admin can lower a target', () => {
    expect(targetChangeAllowed({ actorRole: 'admin', actorId: 'adm', ownerId: 'bde', members, old: t, next: { ...t, revenue: 1 } }).ok).toBe(true);
  });
  it('nobody outside the reporting line, and nobody for themselves', () => {
    expect(targetChangeAllowed({ actorRole: 'BDM', actorId: 'other-bdm', ownerId: 'bde', members, old: null, next: t }).ok).toBe(false);
    expect(targetChangeAllowed({ actorRole: 'BDM', actorId: 'bdm', ownerId: 'bdm', members, old: null, next: t }).ok).toBe(false);
    expect(targetChangeAllowed({ actorRole: 'BDE', actorId: 'bde', ownerId: 'asm', members, old: null, next: t }).ok).toBe(false);
  });
});

describe('forward won lead to Support', () => {
  it('needs Won + verified payment, by a BDE or senior, only once', () => {
    expect(canForwardToSupport({ actorRole: 'BDE', stage: 'won', verifiedPaid: 5000, alreadyForwarded: false }).ok).toBe(true);
    expect(canForwardToSupport({ actorRole: 'SSM', stage: 'won', verifiedPaid: 5000, alreadyForwarded: false }).ok).toBe(true);
    expect(canForwardToSupport({ actorRole: 'JBDE', stage: 'won', verifiedPaid: 5000, alreadyForwarded: false }).ok).toBe(false);
    expect(canForwardToSupport({ actorRole: 'BDE', stage: 'proposal', verifiedPaid: 5000, alreadyForwarded: false }).ok).toBe(false);
    expect(canForwardToSupport({ actorRole: 'BDE', stage: 'won', verifiedPaid: 0, alreadyForwarded: false }).ok).toBe(false);
    expect(canForwardToSupport({ actorRole: 'admin', stage: 'won', verifiedPaid: 1, alreadyForwarded: true }).ok).toBe(false);
  });
});
