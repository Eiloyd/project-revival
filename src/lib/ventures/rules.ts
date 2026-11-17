/** Browser-safe Ventures rules (startups, businesses, manpower, funding). Mirrors the database guards in the ventures migration. */
export const categories = ['idea', 'mvp', 'early_traction', 'growth', 'msme', 'other'] as const;
export type Category = (typeof categories)[number];
export const categoryLabels: Record<Category, string> = { idea: 'Idea stage', mvp: 'MVP stage', early_traction: 'Early traction', growth: 'Growth / revenue', msme: 'MSME / business', other: 'Other' };
export const categoryDocs: Record<Category, string[]> = {
  idea: ['Pitch deck', 'Founder ID proof', 'Problem & solution note'],
  mvp: ['Pitch deck', 'MVP / prototype demo link', 'User feedback summary', 'Founder ID proof'],
  early_traction: ['Pitch deck', 'Company registration (CIN/LLPIN)', 'Traction metrics', 'Bank statement (6 months)'],
  growth: ['Pitch deck', 'Audited financials', 'Cap table', 'GST certificate', 'Bank statement (12 months)'],
  msme: ['Company profile', 'GST certificate', 'Udyam / MSME certificate', 'Audited financials'],
  other: ['Pitch deck', 'Founder ID proof'],
};
export const kinds = { startup: 'Startup', business: 'Business', manpower_client: 'Manpower client' } as const;
export const appStatusLabels = { active: 'In progress', on_hold: 'On hold', rejected: 'Not selected', funded: 'Funded', withdrawn: 'Withdrawn' } as const;
export const docStatusLabels = { requested: 'Upload needed', pending_review: 'Under review', approved: 'Approved', changes_requested: 'Changes requested' } as const;
export const orderStatusLabels = { requested: 'Requested', quoted: 'Quoted', active: 'In progress', delivered: 'Delivered', cancelled: 'Cancelled' } as const;
export const manpowerStatusLabels = { open: 'Open', sourcing: 'Sourcing candidates', interviewing: 'Client interviews', deployed: 'Deployed', replacement: 'Replacement needed', closed: 'Closed' } as const;

export type Stage = { id: string; name: string; position: number; jury_round: number | null; active: boolean };
export type Evaluation = { round: number; decision: string; innovation: number; market: number; team: number; feasibility: number };

/** Active stages in order. */
export const orderedStages = <T extends Stage>(s: T[]) => s.filter(x => x.active).sort((a, b) => a.position - b.position);

/** The first mandatory jury round that is not yet cleared before `target`, or null when the move is allowed. */
export function juryBlock(stages: Stage[], evals: Evaluation[], target: Stage | 'funded'): number | null {
  const limit = target === 'funded' ? Infinity : target.position;
  const need = stages.filter(s => s.jury_round != null && s.position < limit).sort((a, b) => a.position - b.position);
  for (const s of need) if (!evals.some(e => e.round === s.jury_round && e.decision === 'cleared')) return s.jury_round;
  return null;
}

/** Total score out of 40 and average per juror for one round. */
export function roundScore(evals: Evaluation[], round: number): { count: number; average: number | null } {
  const list = evals.filter(e => e.round === round);
  if (!list.length) return { count: 0, average: null };
  const sum = list.reduce((t, e) => t + e.innovation + e.market + e.team + e.feasibility, 0);
  return { count: list.length, average: Math.round((sum / list.length) * 10) / 10 };
}

/** Progress (0–100) of a file through the active stages. */
export function stageProgress(stages: Stage[], stageId: string | null, status: string): number {
  if (status === 'funded') return 100;
  const list = orderedStages(stages); const i = list.findIndex(s => s.id === stageId);
  return i < 0 || !list.length ? 0 : Math.round(((i + 1) / list.length) * 100);
}

/** How the jury voted in one round. */
export function juryTally(evals: Evaluation[], round: number): { cleared: number; revise: number; rejected: number } {
  const t = { cleared: 0, revise: 0, rejected: 0 };
  for (const e of evals) if (e.round === round && e.decision in t) t[e.decision as keyof typeof t]++;
  return t;
}

/** Average days files spent in each stage, from the stage history (time until the next move; the current stage counts until `now`). */
export function averageDaysPerStage(history: { application_id: string; to_stage: string | null; created_at: string }[], now = Date.now()): Record<string, number> {
  const byApp = new Map<string, typeof history>();
  for (const h of history) byApp.set(h.application_id, [...(byApp.get(h.application_id) ?? []), h]);
  const sums: Record<string, { days: number; n: number }> = {};
  for (const list of byApp.values()) {
    const sorted = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
    sorted.forEach((h, i) => {
      if (!h.to_stage) return;
      const end = i + 1 < sorted.length ? new Date(sorted[i + 1]!.created_at).getTime() : now;
      const s = (sums[h.to_stage] ??= { days: 0, n: 0 }); s.days += (end - new Date(h.created_at).getTime()) / 86_400_000; s.n++;
    });
  }
  return Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, Math.round((v.days / v.n) * 10) / 10]));
}
