import { describe, expect, it } from 'vitest';
import { activityBody, callCoachInputSchema, followUpDate, followUpPriority } from './call-coach';

describe('call notes AI helper rules', () => {
  it('follow-up date counts days from today and caps at 30', () => {
    expect(followUpDate('2026-11-28', 3)).toBe('2026-12-01');
    expect(followUpDate('2026-11-17', 0)).toBe('2026-11-17');
    expect(followUpDate('2026-11-17', 90)).toBe('2026-12-17');
  });
  it('hot leads get a high-priority follow-up, others normal', () => {
    expect(followUpPriority('hot')).toBe('high');
    expect(followUpPriority('warm')).toBe('normal');
    expect(followUpPriority('cold')).toBe('normal');
  });
  it('rejects notes shorter than 15 characters', () => {
    expect(callCoachInputSchema.safeParse({ notes: 'too short' }).success).toBe(false);
    expect(callCoachInputSchema.safeParse({ notes: 'Customer wants a proposal by Friday' }).success).toBe(true);
  });
  it('saved activity keeps the BDE notes first and fits the 3000-character limit', () => {
    const body = activityBody('x'.repeat(3500), { summary: 's', nextStep: 'n' });
    expect(body.startsWith('xxx')).toBe(true); expect(body.length).toBe(3000);
    expect(activityBody('Spoke to Ravi', { summary: 'Interested', nextStep: 'Send deck' })).toBe('Spoke to Ravi\n\nSummary: Interested\nNext step: Send deck');
  });
});
