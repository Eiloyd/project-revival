import { describe, expect, it } from "vitest";
import { eligibilityProblems, VOLUNTEER_MIN_AGE } from "./eligibility";

const ok = { age: 18, twelfthPass: true, ownBankAccount: true, smartphone: true, acceptsConduct: true };

describe("volunteer eligibility", () => {
  it("minimum age is 18", () => {
    expect(VOLUNTEER_MIN_AGE).toBe(18);
    expect(eligibilityProblems({ ...ok, age: 17 })).toHaveLength(1);
    expect(eligibilityProblems(ok)).toEqual([]);
  });
  it("needs 12th pass", () => { expect(eligibilityProblems({ ...ok, twelfthPass: false })).toHaveLength(1); });
  it("needs a bank account in own name", () => { expect(eligibilityProblems({ ...ok, ownBankAccount: false })).toHaveLength(1); });
  it("needs a smartphone and accepting the code of conduct", () => {
    expect(eligibilityProblems({ ...ok, smartphone: false, acceptsConduct: false })).toHaveLength(2);
  });
  it("missing age is a problem", () => { expect(eligibilityProblems({ ...ok, age: null })).toHaveLength(1); });
});
