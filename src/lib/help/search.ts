import { dashboardForPath, type DashboardKey } from '@/lib/dashboards';
import { helpArticles, helpTopics, type HelpArticle, type HelpTopicKey } from './content';

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}₹\s]/gu, ' ').replace(/\s+/g, ' ').trim();

/** Ranks help articles for a search: title words count most, then keywords, summary and steps. Empty query → []. */
export function searchHelp(query: string, limit = 12): HelpArticle[] {
  const q = norm(query); if (!q) return [];
  const words = q.split(' ').filter(w => w.length > 1 || /\d/.test(w));
  if (!words.length) return [];
  const scored = helpArticles.map(a => {
    const title = norm(a.title), kw = norm((a.keywords ?? []).join(' ')), sum = norm(a.summary), body = norm(a.steps.join(' ') + ' ' + (a.tips ?? []).join(' '));
    const exact = new Set([...title.split(' '), ...kw.split(' ')]);
    let score = 0;
    if (title.includes(q)) score += 20; if (kw.includes(q)) score += 15;
    if ((a.keywords ?? []).some(k => norm(k) === q)) score += 10;
    for (const w of words) {
      if (title.includes(w)) score += 6; if (kw.includes(w)) score += 5; if (sum.includes(w)) score += 3; if (body.includes(w)) score += 1;
      if (exact.has(w)) score += 2;
    }
    return { a, score };
  }).filter(x => x.score > 0);
  return scored.sort((x, y) => y.score - x.score).slice(0, limit).map(x => x.a);
}

export const articlesForTopic = (topic: HelpTopicKey) => helpArticles.filter(a => a.topic === topic);
export const findArticle = (slug: string) => helpArticles.find(a => a.slug === slug);
export const findTopic = (key: string) => helpTopics.find(t => t.key === key);
export const isHelpTopic = (key: unknown): key is HelpTopicKey => typeof key === 'string' && helpTopics.some(t => t.key === key);

/** The dashboard a workspace path belongs to, including sub-pages such as /crm/sales. */
export function dashboardKeyForPath(pathname: string): DashboardKey | null {
  return dashboardForPath(pathname) ?? (pathname.startsWith('/crm') ? 'crm' : null);
}

/** Per-person, per-dashboard flag so the first-login tour opens only once for each account on each dashboard. */
export const guideSeenKey = (dash: DashboardKey, uid: string) => `riloyd-guide-seen:${dash}:${uid}`;
