import { describe, expect, it } from "vitest";
import { cleanReferralCode, referralCodeSchema, referralForms, referralLink } from "./referral";

describe("referral links", () => {
  it("builds a link for every form with the code in capitals", () => {
    expect(referralLink("https://www.riloyd.in/", "/contact", "bde-01")).toBe("https://www.riloyd.in/contact?ref=BDE-01");
    expect(referralForms.map(f => f.path)).toContain("/education-support");
    expect(referralForms.length).toBe(8);
  });
  it("ignores codes that are not letters, numbers or dashes", () => {
    expect(cleanReferralCode("<script>")).toBe("");
    expect(cleanReferralCode("A")).toBe("");
    expect(referralLink("https://x.in", "/foundation", "bad code")).toBe("https://x.in/foundation");
  });
  it("form code field is optional and rejects symbols", () => {
    expect(referralCodeSchema.parse(undefined)).toBe("");
    expect(referralCodeSchema.parse(" emp7 ")).toBe("EMP7");
    expect(referralCodeSchema.safeParse("a b").success).toBe(false);
  });
});
