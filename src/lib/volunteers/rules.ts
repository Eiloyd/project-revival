// Browser-safe volunteer programme rules. The database enforces the same limits; these power the dashboards.

export const MAX_COMMISSION_PERCENT = 10;
export const DEFAULT_MIN_WITHDRAWAL = 3000;
/** Withdrawals below ₹3,000 are never allowed (the admin setting may raise it, never lower it). */
export const MIN_WITHDRAWAL_FLOOR = 3000;
export const effectiveMinWithdrawal = (setting: number | null | undefined) => Math.max(MIN_WITHDRAWAL_FLOOR, Number(setting) || 0);

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Commission for one form: percentage of the fee (never above the cap) plus a flat amount. */
export function commissionFor(fee: number, percent: number, flat = 0, cap = MAX_COMMISSION_PERCENT): number {
  const pct = Math.max(0, Math.min(percent, cap, MAX_COMMISSION_PERCENT));
  return round2(Math.max(0, fee) * pct / 100 + Math.max(0, flat));
}

export type CommissionRow = { amount: number | string; status: "pending" | "credited" | "reversed"; created_at: string; credited_at: string | null };
export type WithdrawalRow = { amount: number | string; status: "pending" | "processing" | "paid" | "rejected"; requested_at: string; paid_at: string | null };

const num = (v: number | string) => Number(v) || 0;
const sameMonth = (iso: string | null, now: Date) => { if (!iso) return false; const d = new Date(iso); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); };

export function walletSummary(commissions: CommissionRow[], withdrawals: WithdrawalRow[], now: Date = new Date()) {
  const credited = commissions.filter(c => c.status === "credited");
  const creditedTotal = round2(credited.reduce((s, c) => s + num(c.amount), 0));
  const pending = round2(commissions.filter(c => c.status === "pending").reduce((s, c) => s + num(c.amount), 0));
  const thisMonth = round2(credited.filter(c => sameMonth(c.credited_at ?? c.created_at, now)).reduce((s, c) => s + num(c.amount), 0));
  const reserved = round2(withdrawals.filter(w => w.status === "pending" || w.status === "processing").reduce((s, w) => s + num(w.amount), 0));
  const paid = withdrawals.filter(w => w.status === "paid");
  const withdrawn = round2(paid.reduce((s, w) => s + num(w.amount), 0));
  const last = [...paid].sort((a, b) => (b.paid_at ?? b.requested_at).localeCompare(a.paid_at ?? a.requested_at))[0] ?? null;
  return {
    lifetime: round2(creditedTotal + pending), credited: creditedTotal, pending, thisMonth, reserved, withdrawn,
    available: round2(Math.max(0, creditedTotal - reserved - withdrawn)),
    lastWithdrawal: last ? { amount: num(last.amount), date: last.paid_at ?? last.requested_at } : null,
  };
}

/** Why a withdrawal cannot be requested, or null when it can. */
export function withdrawalProblem(amount: number, available: number, minimum: number, kycStatus: string, hasPayoutMethod: boolean): string | null {
  if (kycStatus !== "verified") return "Your KYC must be verified before you can withdraw.";
  if (!hasPayoutMethod) return "Add your UPI ID or bank account first.";
  if (!Number.isFinite(amount) || amount <= 0) return "Enter the amount.";
  if (Math.round(amount * 100) !== amount * 100) return "Use at most two decimal places.";
  const min = effectiveMinWithdrawal(minimum);
  if (amount < min) return `The minimum withdrawal is ₹${min.toLocaleString("en-IN")}.`;
  if (amount > available) return `The amount is more than your available balance (₹${available.toLocaleString("en-IN")}).`;
  return null;
}

export type Referral = { form_key: string; form_status: string; payment_status: string; review_status: string; submitted_at: string; commission_status: string | null };

export type Stage = "incomplete" | "submitted" | "under_verification" | "documents_required" | "verified" | "approved" | "rejected" | "completed";
export const stageLabels: Record<Stage, string> = {
  incomplete: "Form incomplete", submitted: "Form submitted", under_verification: "Under verification", documents_required: "Documents required",
  verified: "Verified", approved: "Approved", rejected: "Rejected", completed: "Completed",
};

/** One tracking stage per referred application, across both forms. */
export function applicationStage(r: Pick<Referral, "form_key" | "form_status" | "payment_status" | "review_status">): Stage {
  if (r.form_key === "young_innovators") {
    if (r.review_status === "rejected") return "rejected";
    if (r.review_status === "approved") return "approved";
    return r.form_status === "submitted" ? "submitted" : "incomplete";
  }
  if (r.payment_status === "failed" || r.review_status === "not_eligible" || r.review_status === "not_selected") return "rejected";
  if (r.review_status === "selected") return "completed";
  if (r.review_status === "eligible") return "approved";
  if (r.review_status === "verified") return "verified";
  if (r.review_status === "incomplete_documents") return "documents_required";
  if (r.review_status === "under_verification") return "under_verification";
  return r.form_status === "completed" ? "submitted" : "incomplete";
}

export function referralStats(rows: Referral[]) {
  const stages = rows.map(applicationStage);
  const verified = stages.filter(s => s === "verified" || s === "approved" || s === "completed").length;
  const rejected = stages.filter(s => s === "rejected").length;
  const submitted = stages.filter(s => s !== "incomplete").length;
  return { referred: rows.length, submitted, verified, rejected, pending: submitted - verified - rejected, incomplete: rows.length - submitted,
    conversion: rows.length ? Math.round(verified / rows.length * 100) : 0 };
}

/** Counts per calendar month, oldest first, for the last `months` months. */
export function monthlyCounts(dates: string[], months = 6, now: Date = new Date()) {
  const out: { key: string; label: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("en-IN", { month: "short" }), count: 0 });
  }
  for (const iso of dates) { const d = new Date(iso); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; const m = out.find(o => o.key === k); if (m) m.count++; }
  return out;
}

export function countSince(dates: string[], days: number, now: Date = new Date()) {
  const from = now.getTime() - days * 86400000;
  return dates.filter(d => new Date(d).getTime() >= from).length;
}

export function targetPercent(done: number, target: number) { return target > 0 ? Math.min(100, Math.round(done / target * 100)) : 0; }

export const badgeLevels = [
  { name: "Starter", min: 1 }, { name: "Bronze", min: 10 }, { name: "Silver", min: 25 }, { name: "Gold", min: 50 }, { name: "Platinum", min: 100 },
] as const;
/** Badges earned from verified applications. */
export function earnedBadges(verified: number) { return badgeLevels.filter(b => verified >= b.min).map(b => b.name); }

export const ticketCategories = [
  { key: "application", label: "Application issue" }, { key: "commission", label: "Commission issue" }, { key: "withdrawal", label: "Withdrawal issue" },
  { key: "bank", label: "Bank details update" }, { key: "login", label: "Login problem" }, { key: "technical", label: "Technical problem" }, { key: "general", label: "General enquiry" },
] as const;

export const rupees = (n: number | string) => `₹${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// ── Incentive mode ────────────────────────────────────────────────────────────────────────────
// Default: commission per verified form, no mandatory revenue target. When Admin/BDM sets a fixed
// incentive, a mandatory monthly revenue target comes with it and per-form commission is 0%.
export type IncentiveMode = "commission" | "fixed";
export type RevenueRow = { form_key: string; fee_amount: number | string; status: string; credited_at: string | null; created_at: string };
const istDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(iso));

/** Revenue a volunteer generated: fees of credited referrals (fixed-incentive payouts excluded), optionally within [from, to] India days. */
export function volunteerRevenue(rows: RevenueRow[], from?: string, to?: string) {
  return round2(rows.filter(r => r.status === "credited" && r.form_key !== "fixed_incentive").filter(r => { const d = istDay(r.credited_at ?? r.created_at); return (!from || d >= from) && (!to || d <= to); })
    .reduce((s, r) => s + num(r.fee_amount), 0));
}

/** Why a fixed incentive cannot be saved, or null. A fixed incentive always needs a revenue target. */
export function incentiveProblem(mode: IncentiveMode, fixed: number, target: number): string | null {
  if (mode === "commission") return null;
  if (!(fixed > 0)) return "Enter the fixed incentive amount.";
  if (!(target > 0)) return "A fixed incentive needs a mandatory monthly revenue target.";
  return null;
}

export function fixedIncentiveProgress(revenue: number, target: number, fixed: number) {
  const pct = targetPercent(revenue, target);
  return { revenue, target, fixed, percent: pct, remaining: round2(Math.max(0, target - revenue)), earned: target > 0 && revenue >= target ? fixed : 0 };
}

// ── Reward & recognition schemes ──────────────────────────────────────────────────────────────
export type SchemeCriteria = "verified_forms" | "referrals" | "revenue";
export const schemeCriteriaLabels: Record<SchemeCriteria, string> = { verified_forms: "Verified forms", referrals: "Forms submitted", revenue: "Revenue (₹)" };
export const rewardTypeLabels = { cash: "Cash bonus", gift: "Gift / prize", certificate: "Certificate", trip: "Trip", other: "Other" } as const;
export type RewardScheme = {
  id: string; title: string; description: string; reward_type: keyof typeof rewardTypeLabels; reward: string; reward_amount: number;
  criteria: SchemeCriteria; criteria_target: number; starts_on: string; ends_on: string; badge: string; banner_tone: "gold" | "green" | "blue" | "red";
  audience: "all" | "team" | "own"; status: "active" | "paused" | "ended"; created_by: string; created_at: string;
};

/** Live (active and today inside its dates), upcoming, or over. */
export function schemeState(s: Pick<RewardScheme, "status" | "starts_on" | "ends_on">, today: string): "live" | "upcoming" | "over" | "paused" {
  if (s.status === "paused") return "paused";
  if (s.status === "ended" || today > s.ends_on) return "over";
  return today < s.starts_on ? "upcoming" : "live";
}

/** One volunteer's progress toward a scheme, counted only inside the scheme's dates. */
export function schemeProgress(s: Pick<RewardScheme, "criteria" | "criteria_target" | "starts_on" | "ends_on">, refs: Pick<Referral, "form_key" | "form_status" | "payment_status" | "review_status" | "submitted_at">[], revenueRows: RevenueRow[]) {
  const inside = refs.filter(r => { const d = istDay(r.submitted_at); return d >= s.starts_on && d <= s.ends_on; });
  const done = s.criteria === "revenue" ? volunteerRevenue(revenueRows, s.starts_on, s.ends_on)
    : s.criteria === "referrals" ? inside.filter(r => applicationStage(r) !== "incomplete").length
    : inside.filter(r => ["verified", "approved", "completed"].includes(applicationStage(r))).length;
  const target = Number(s.criteria_target) || 0;
  return { done, target, percent: targetPercent(done, target), remaining: Math.max(0, round2(target - done)), qualified: target > 0 && done >= target };
}
