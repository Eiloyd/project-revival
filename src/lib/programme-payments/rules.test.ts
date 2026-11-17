import { describe, expect, it } from "vitest";
import { canDecide, expectedAmountPaise, programmePaymentSchema } from "./rules";

const base = { key: "prototype_funding_registration", name: "Asha Verma", email: "Asha@Example.com", phone: "9876543210" } as const;

describe("programme payments", () => {
  it("adds 18% GST to the prototype and funding registration fees", () => {
    expect(expectedAmountPaise("prototype_funding_registration", 999)).toBe(117882);
    expect(expectedAmountPaise("funding_programme_registration", 1000)).toBe(118000);
    expect(expectedAmountPaise("young_innovators_6_8", 249)).toBe(29382);
  });
  it("charges the summit package without GST", () => { expect(expectedAmountPaise("funding_programme_summit", 3599)).toBe(359900); });
  it("accepts a Razorpay/Zoho style transaction ID and strips spaces", () => {
    const r = programmePaymentSchema.parse({ ...base, reference: " pay_ABC 12345 " });
    expect(r.reference).toBe("pay_ABC12345");
    expect(r.email).toBe("asha@example.com");
  });
  it("rejects a too-short or odd transaction ID", () => {
    expect(programmePaymentSchema.safeParse({ ...base, reference: "123" }).success).toBe(false);
    expect(programmePaymentSchema.safeParse({ ...base, reference: "pay<script>" }).success).toBe(false);
  });
  it("does not take scholarship fees through this form", () => {
    expect(programmePaymentSchema.safeParse({ ...base, key: "education_sponsorship", reference: "pay_ABC12345" }).success).toBe(false);
  });
  it("lets a waiting payment be decided once only", () => {
    expect(canDecide("reference_submitted")).toBe(true);
    expect(canDecide("paid")).toBe(false);
    expect(canDecide("failed")).toBe(false);
  });
});
