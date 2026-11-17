import { describe, expect, it } from "vitest";
import { feeFor, withCurrentEducationFees, defaultFees } from "./payment-options";
import { studentFeeTotal } from "./young-innovators-forms";
import { prototypeRegistrationTotal } from "./prototype-programme";

describe("admin fees", () => {
  it("uses the admin amount when set", () => { expect(feeFor([{ key: "prototype_funding_registration", amount: 1499 }], "prototype_funding_registration")).toBe(1499); });
  it("falls back to the default fee when unset or invalid", () => {
    expect(feeFor([{ key: "funding_programme_summit", amount: null }], "funding_programme_summit")).toBe(3599);
    expect(feeFor([{ key: "funding_programme_summit", amount: 0 }], "funding_programme_summit")).toBe(defaultFees.funding_programme_summit);
  });
  it("swaps scholarship fees in policy text without double-replacing", () => {
    const fee = (k: string) => ({ education_sponsorship: 249, education_scholarship_25k: 349, education_scholarship_50k: 699 } as Record<string, number>)[k]!;
    expect(withCurrentEducationFees("₹149, ₹249 and ₹599; up to ₹25,000", fee)).toBe("₹249, ₹349 and ₹699; up to ₹25,000");
  });
  it("adds 18% GST to an admin-set Young Innovators fee", () => { expect(studentFeeTotal(6, 300)).toBe(354); });
  it("adds 18% GST to an admin-set prototype fee", () => { expect(prototypeRegistrationTotal(1000)).toBe(1180); });
});
