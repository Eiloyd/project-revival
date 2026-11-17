/** Browser-safe rules for the Phase 2–6 features (tested in rules.test.ts). */
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
export const isGstin = (v: string) => v === '' || GSTIN_RE.test(v.trim().toUpperCase());
export const VIEW_AS_MIN_REASON = 10;
export const RESEARCH_STEPS = ['Survey', 'Verification', 'Analysis', 'Final dossier'] as const;
export const STARTER_POLICIES = ['Code of Conduct', 'POSH (Prevention of Sexual Harassment)', 'Data Security & Confidentiality', 'Attendance & Leave'] as const;
/** Share of employees who signed every active policy (0–100). */
export function compliancePct(employees: number, fullySigned: number) { return employees ? Math.round((fullySigned / employees) * 100) : 0; }
export function milestoneProgress(ms: { done_at: string | null }[]) { return ms.length ? Math.round((ms.filter(m => m.done_at).length / ms.length) * 100) : 0; }
