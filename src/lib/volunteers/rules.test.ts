import { describe, expect, it } from "vitest";
import { applicationStage, commissionFor, DEFAULT_MIN_WITHDRAWAL, effectiveMinWithdrawal, fixedIncentiveProgress, incentiveProblem, MAX_COMMISSION_PERCENT, MIN_WITHDRAWAL_FLOOR, schemeProgress, schemeState, volunteerRevenue, walletSummary, withdrawalProblem } from "./rules";

describe("volunteer commission", () => {
  it("never pays more than 10% of the fee, plus the flat amount", () => {
    expect(MAX_COMMISSION_PERCENT).toBe(10);
    expect(commissionFor(249, 10)).toBe(24.9);
    expect(commissionFor(599, 25)).toBe(59.9);
    expect(commissionFor(249, 10, 20)).toBe(44.9);
  });
});

describe("volunteer wallet", () => {
  const now = new Date("2026-11-15T10:00:00Z");
  it("counts only credited commission as withdrawable, minus waiting and paid withdrawals", () => {
    const w = walletSummary(
      [{ amount: 4000, status: "credited", created_at: "2026-11-01", credited_at: "2026-11-02" }, { amount: 50, status: "pending", created_at: "2026-11-03", credited_at: null }, { amount: 30, status: "reversed", created_at: "2026-11-03", credited_at: null }],
      [{ amount: 500, status: "paid", requested_at: "2026-11-05", paid_at: "2026-11-06" }, { amount: 300, status: "pending", requested_at: "2026-11-10", paid_at: null }, { amount: 900, status: "rejected", requested_at: "2026-11-11", paid_at: null }],
      now);
    expect(w.available).toBe(3200);
    expect(w.pending).toBe(50);
    expect(w.withdrawn).toBe(500);
    expect(w.reserved).toBe(300);
  });

  it("minimum withdrawal is ₹3,000", () => {
    expect(DEFAULT_MIN_WITHDRAWAL).toBe(3000);
    expect(withdrawalProblem(2999, 10000, DEFAULT_MIN_WITHDRAWAL, "verified", true)).toMatch(/minimum/);
    expect(withdrawalProblem(3000, 10000, DEFAULT_MIN_WITHDRAWAL, "verified", true)).toBeNull();
  });

  it("needs verified KYC and enough balance", () => {
    expect(withdrawalProblem(3000, 10000, 3000, "submitted", true)).toMatch(/KYC/);
    expect(withdrawalProblem(5000, 4000, 3000, "verified", true)).toMatch(/available balance/);
  });
});

describe("application tracking", () => {
  it("commission-relevant scholarship stages", () => {
    expect(applicationStage({ form_key: "education", form_status: "started", payment_status: "pending", review_status: "submitted" })).toBe("incomplete");
    expect(applicationStage({ form_key: "education", form_status: "completed", payment_status: "paid", review_status: "verified" })).toBe("verified");
    expect(applicationStage({ form_key: "education", form_status: "completed", payment_status: "failed", review_status: "submitted" })).toBe("rejected");
  });
});

describe("withdrawal floor", () => {
  it("never allows a withdrawal below ₹3,000, even if the setting is lower", () => {
    expect(MIN_WITHDRAWAL_FLOOR).toBe(3000);
    expect(effectiveMinWithdrawal(1000)).toBe(3000);
    expect(effectiveMinWithdrawal(5000)).toBe(5000);
    expect(withdrawalProblem(2500, 10000, 1000, "verified", true)).toMatch(/₹3,000/);
  });
});

describe("volunteer incentive mode", () => {
  it("commission mode needs no revenue target", () => {
    expect(incentiveProblem("commission", 0, 0)).toBeNull();
  });
  it("a fixed incentive always needs a mandatory revenue target", () => {
    expect(incentiveProblem("fixed", 500, 0)).toMatch(/target/);
    expect(incentiveProblem("fixed", 0, 10000)).toMatch(/amount/);
    expect(incentiveProblem("fixed", 500, 10000)).toBeNull();
  });
  it("the fixed incentive is earned only when the revenue target is reached", () => {
    expect(fixedIncentiveProgress(9999, 10000, 500).earned).toBe(0);
    expect(fixedIncentiveProgress(10000, 10000, 500)).toMatchObject({ earned: 500, percent: 100, remaining: 0 });
  });
  it("revenue counts fees of credited referrals only", () => {
    const rows = [
      { form_key: "education", fee_amount: 599, status: "credited", credited_at: "2026-11-10T06:00:00Z", created_at: "2026-11-09T06:00:00Z" },
      { form_key: "education", fee_amount: 249, status: "pending", credited_at: null, created_at: "2026-11-10T06:00:00Z" },
      { form_key: "fixed_incentive", fee_amount: 0, status: "credited", credited_at: "2026-11-01T06:00:00Z", created_at: "2026-11-01T06:00:00Z" },
    ];
    expect(volunteerRevenue(rows)).toBe(599);
    expect(volunteerRevenue(rows, "2026-11-11")).toBe(0);
  });
});

describe("reward schemes", () => {
  const scheme = { criteria: "verified_forms" as const, criteria_target: 2, starts_on: "2026-11-01", ends_on: "2026-11-30", status: "active" as const };
  const ref = (submitted_at: string, review_status: string) => ({ form_key: "education", form_status: "completed", payment_status: "paid", review_status, submitted_at });
  it("counts only progress inside the scheme dates", () => {
    const p = schemeProgress(scheme, [ref("2026-11-05T05:00:00Z", "verified"), ref("2026-10-20T05:00:00Z", "verified"), ref("2026-11-06T05:00:00Z", "submitted")], []);
    expect(p).toMatchObject({ done: 1, target: 2, percent: 50, qualified: false });
  });
  it("qualifies once the target is reached", () => {
    expect(schemeProgress(scheme, [ref("2026-11-05T05:00:00Z", "verified"), ref("2026-11-07T05:00:00Z", "eligible")], []).qualified).toBe(true);
  });
  it("knows live, upcoming, paused and finished schemes", () => {
    expect(schemeState(scheme, "2026-11-17")).toBe("live");
    expect(schemeState(scheme, "2026-10-31")).toBe("upcoming");
    expect(schemeState(scheme, "2026-12-01")).toBe("over");
    expect(schemeState({ ...scheme, status: "paused" }, "2026-11-17")).toBe("paused");
  });
});
