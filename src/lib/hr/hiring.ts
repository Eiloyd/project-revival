/** Candidate stages in pipeline order. Closed stages end an application; parked stages pause it. */
export const hiringStages = ['applied', 'screening', 'shortlisted', 'assessment', 'interview', 'selected', 'offered', 'hired'] as const;
export const closedStages = ['rejected', 'withdrawn', 'offer_declined'] as const;
export const parkedStages = ['on_hold', 'waitlisted'] as const;
export type Stage = (typeof hiringStages)[number] | (typeof closedStages)[number] | (typeof parkedStages)[number];
export const allStages: readonly Stage[] = [...hiringStages, ...parkedStages, ...closedStages];
export const stageLabels: Record<Stage, string> = {
  applied: 'Applied', screening: 'Screening', shortlisted: 'Shortlisted', assessment: 'Assessment', interview: 'Interview', selected: 'Selected',
  offered: 'Offer released', hired: 'Joined', rejected: 'Rejected', withdrawn: 'Withdrawn', offer_declined: 'Offer declined', on_hold: 'On hold', waitlisted: 'Waitlisted',
};
export const sourceLabels: Record<string, string> = { direct: 'Direct', referral: 'Referral', job_portal: 'Job portal', consultancy: 'Consultancy', campus: 'Campus / institute', research: 'Lead Research', walk_in: 'Walk-in', career_page: 'Career page', other: 'Other' };

export const jobStatuses = ['draft', 'pending_approval', 'open', 'on_hold', 'closed', 'cancelled', 'archived'] as const;
export type JobStatus = (typeof jobStatuses)[number];
export const jobStatusLabels: Record<JobStatus, string> = { draft: 'Draft', pending_approval: 'Pending approval', open: 'Published', on_hold: 'Paused', closed: 'Closed', cancelled: 'Cancelled', archived: 'Archived' };
export const workModes = { office: 'Office', hybrid: 'Hybrid', remote: 'Remote', field: 'Field' } as const;
export const employmentTypes = { full_time: 'Full-time', part_time: 'Part-time', intern: 'Internship', contract: 'Contract' } as const;
export const roundLabels = { hr: 'HR round', technical: 'Technical round', department_head: 'Department head round', management: 'Management round', final: 'Final interview' } as const;
export const assessmentKinds = { online: 'Online assessment', technical: 'Technical test', aptitude: 'Aptitude test', written: 'Written test', practical: 'Practical task', assignment: 'Assignment' } as const;
export const recommendationLabels = { next_round: 'Next round', select: 'Select', hold: 'Hold', reject: 'Reject' } as const;
export const referralKinds = { institute: 'Institute', coordinator: 'Coordinator', individual: 'Individual', employee: 'Employee referral' } as const;

/** Status changes a role may make on a job. The database enforces the same rule. */
export function allowedJobStatuses(current: JobStatus, role: { admin: boolean; hrManager: boolean }): JobStatus[] {
  if (current === 'archived') return role.admin ? ['archived', 'draft'] : ['archived'];
  const out: JobStatus[] = [current, 'draft', 'pending_approval', 'on_hold', 'closed'];
  if (role.admin || role.hrManager) out.push('open');
  if (role.admin) out.push('cancelled', 'archived');
  return [...new Set(out)];
}

/** The next step forward from a stage, or null when joined, closed or parked. */
export function nextStage(s: Stage): Stage | null {
  const i = (hiringStages as readonly string[]).indexOf(s);
  return i >= 0 && i < hiringStages.length - 1 ? hiringStages[i + 1]! : null;
}
export const isClosed = (s: string) => (closedStages as readonly string[]).includes(s);
export const isActive = (s: string) => !isClosed(s) && s !== 'hired';

/** Count candidates per stage for the pipeline board. */
export function stageCounts(list: { stage: string }[]): Record<Stage, number> {
  const out = Object.fromEntries(allStages.map(s => [s, 0])) as Record<Stage, number>;
  for (const c of list) if (c.stage in out) out[c.stage as Stage]++;
  return out;
}

/** Furthest pipeline stage a candidate reached, from their stage history (closed candidates keep the stage they got to). */
export function furthestStage(events: { to_stage: string }[], current: string): number {
  let best = (hiringStages as readonly string[]).indexOf(current);
  for (const e of events) best = Math.max(best, (hiringStages as readonly string[]).indexOf(e.to_stage));
  return best;
}

export type Funnel = { applications: number; shortlisted: number; interviewed: number; selected: number; offered: number; accepted: number; joined: number; rejected: number };
/** Funnel counts: a candidate counts at every stage up to the furthest one they reached. */
export function funnel(rows: { stage: string; offer_status?: string; reached: number }[]): Funnel {
  const at = (s: Stage) => (hiringStages as readonly string[]).indexOf(s);
  const f: Funnel = { applications: rows.length, shortlisted: 0, interviewed: 0, selected: 0, offered: 0, accepted: 0, joined: 0, rejected: 0 };
  for (const r of rows) {
    if (r.reached >= at('shortlisted')) f.shortlisted++;
    if (r.reached >= at('interview')) f.interviewed++;
    if (r.reached >= at('selected')) f.selected++;
    if (r.reached >= at('offered')) f.offered++;
    if (r.offer_status === 'accepted' || r.stage === 'hired') f.accepted++;
    if (r.stage === 'hired') f.joined++;
    if (r.stage === 'rejected') f.rejected++;
  }
  return f;
}
/** Whole-number percentage, 0 when there is nothing to divide by. */
export const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Days from application to joining, averaged over joined candidates (null when nobody joined). */
export function averageDaysToHire(rows: { created_at: string; hired_at: string | null }[]): number | null {
  const d = rows.filter(r => r.hired_at).map(r => (new Date(r.hired_at!).getTime() - new Date(r.created_at).getTime()) / 86_400_000);
  return d.length ? Math.round((d.reduce((a, b) => a + b, 0) / d.length) * 10) / 10 : null;
}

/** Public links: the job page, and the same page carrying a referral code. */
export const jobUrl = (origin: string, jobCode: string) => `${origin}/careers/${encodeURIComponent(jobCode)}`;
export const referralUrl = (origin: string, jobCode: string | null, code: string) => jobCode ? `${jobUrl(origin, jobCode)}?ref=${encodeURIComponent(code)}` : `${origin}/careers?ref=${encodeURIComponent(code)}`;

/** Same person applying again: matched by email or the last 10 digits of the mobile number. */
export function samePerson(a: { email: string; phone: string }, b: { email: string; phone: string }) {
  const p = (x: string) => x.replace(/\D/g, '').slice(-10);
  return (!!a.email && a.email.toLowerCase() === b.email.toLowerCase()) || (p(a.phone).length === 10 && p(a.phone) === p(b.phone));
}
