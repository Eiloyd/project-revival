import { describe, expect, it } from 'vitest';
import { compliancePct, isGstin, milestoneProgress, RESEARCH_STEPS } from './rules';
describe('ops rules', () => {
  it('accepts a valid GSTIN and rejects a wrong one', () => { expect(isGstin('27AAPFU0939F1ZV')).toBe(true); expect(isGstin('27AAPFU0939F1V')).toBe(false); });
  it('research milestones are Survey → Verification → Analysis → Final dossier', () => expect([...RESEARCH_STEPS]).toEqual(['Survey', 'Verification', 'Analysis', 'Final dossier']));
  it('compliance % rounds signed over employees', () => { expect(compliancePct(3, 2)).toBe(67); expect(compliancePct(0, 0)).toBe(0); });
  it('milestone progress counts done steps', () => expect(milestoneProgress([{ done_at: 'x' }, { done_at: null }, { done_at: null }, { done_at: 'y' }])).toBe(50));
});
