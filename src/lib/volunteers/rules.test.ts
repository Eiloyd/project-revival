import { describe, expect, it } from "vitest";
import { applicationStage, commissionFor, DEFAULT_MIN_WITHDRAWAL, MAX_COMMISSION_PERCENT, walletSummary, withdrawalProblem } from "./rules";

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
