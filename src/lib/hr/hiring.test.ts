import { describe, expect, it } from 'vitest';
import { allowedJobStatuses, averageDaysToHire, funnel, nextStage, pct, referralUrl, samePerson } from './hiring';

describe('recruitment rules', () => {
  it('moves through every hiring stage in order and stops at joined', () => {
    expect(nextStage('applied')).toBe('screening');
    expect(nextStage('shortlisted')).toBe('assessment');
    expect(nextStage('selected')).toBe('offered');
    expect(nextStage('hired')).toBeNull();
    expect(nextStage('rejected')).toBeNull();
  });
  it('lets only Admin or an HR manager publish, and only Admin cancel or archive', () => {
    expect(allowedJobStatuses('draft', { admin: false, hrManager: false })).not.toContain('open');
    expect(allowedJobStatuses('draft', { admin: false, hrManager: true })).toContain('open');
    expect(allowedJobStatuses('open', { admin: false, hrManager: true })).not.toContain('archived');
    expect(allowedJobStatuses('open', { admin: true, hrManager: false })).toEqual(expect.arrayContaining(['cancelled', 'archived']));
  });
  it('counts a candidate at every stage up to the furthest reached', () => {
    const f = funnel([{ stage: 'hired', reached: 7 }, { stage: 'rejected', reached: 4 }, { stage: 'applied', reached: 0 }]);
    expect(f).toMatchObject({ applications: 3, shortlisted: 2, interviewed: 2, selected: 1, joined: 1, rejected: 1 });
    expect(pct(f.joined, f.applications)).toBe(33);
    expect(pct(1, 0)).toBe(0);
  });
  it('averages days from application to joining', () => {
    expect(averageDaysToHire([{ created_at: '2026-11-01T00:00:00Z', hired_at: '2026-11-11T00:00:00Z' }, { created_at: '2026-11-01T00:00:00Z', hired_at: null }])).toBe(10);
    expect(averageDaysToHire([])).toBeNull();
  });
  it('builds job-wise referral links', () => {
    expect(referralUrl('https://riloyd.in', 'RJ-0001', 'INST-1001')).toBe('https://riloyd.in/careers/RJ-0001?ref=INST-1001');
    expect(referralUrl('https://riloyd.in', null, 'REF-1002')).toBe('https://riloyd.in/careers?ref=REF-1002');
  });
  it('treats the same email or mobile as the same person', () => {
    expect(samePerson({ email: 'A@x.in', phone: '' }, { email: 'a@x.in', phone: '' })).toBe(true);
    expect(samePerson({ email: '', phone: '+91 98765 43210' }, { email: 'b@x.in', phone: '9876543210' })).toBe(true);
    expect(samePerson({ email: 'a@x.in', phone: '1' }, { email: 'b@x.in', phone: '2' })).toBe(false);
  });
});
