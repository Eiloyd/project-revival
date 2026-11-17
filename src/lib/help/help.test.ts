import { describe, expect, it } from 'vitest';
import { dashboardKeys } from '@/lib/dashboards';
import { dashboardGuides, helpArticles, helpTopics } from './content';
import { articlesForTopic, dashboardKeyForPath, guideSeenKey, searchHelp } from './search';

describe('help centre', () => {
  it('has a help topic with at least one answer for every dashboard', () => {
    for (const k of dashboardKeys) {
      expect(helpTopics.some(t => t.key === k)).toBe(true);
      expect(articlesForTopic(k).length).toBeGreaterThan(0);
    }
  });
  it('gives every dashboard a first-login guide', () => {
    for (const k of dashboardKeys) expect(dashboardGuides[k].places.length).toBeGreaterThan(0);
  });
  it('uses unique article addresses and only links to answers that exist', () => {
    const slugs = helpArticles.map(a => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const a of helpArticles) for (const r of a.related ?? []) expect(slugs).toContain(r);
  });
  it('finds how to raise a ticket first when searching "raise ticket"', () => {
    expect(searchHelp('raise ticket')[0]?.slug).toBe('raise-ticket');
  });
  it('answers the ₹3,000 withdrawal question for volunteers', () => {
    const a = searchHelp('withdraw')[0];
    expect(a?.slug).toBe('volunteer-withdraw');
    expect(a?.summary).toContain('₹3,000');
  });
  it('returns nothing for an empty search', () => { expect(searchHelp('   ')).toEqual([]); });
  it('treats /crm/sales as the CRM dashboard', () => {
    expect(dashboardKeyForPath('/crm/sales')).toBe('crm');
    expect(dashboardKeyForPath('/support-desk')).toBe('support');
    expect(dashboardKeyForPath('/about')).toBeNull();
  });
  it('remembers the tour separately for each person and dashboard', () => {
    expect(guideSeenKey('crm', 'a')).not.toBe(guideSeenKey('crm', 'b'));
    expect(guideSeenKey('crm', 'a')).not.toBe(guideSeenKey('hr', 'a'));
  });
});
