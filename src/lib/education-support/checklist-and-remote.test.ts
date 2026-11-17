import { describe, expect, it } from "vitest";
import { checklistInputSchema, hasSensitiveDetail, missingChecklistItems } from "./checklist";
import { homeBaseFor } from "./remote";
import { educationCors } from "./public-api.server";

const base = { lang: "en" as const, studentCategory: "school" as const, classOrCourse: "10", applicationType: "sponsorship" as const, state: "Madhya Pradesh", under18: true, infoReady: [], documentsReady: [], note: "" };

describe("student AI checklist accepts only non-sensitive details", () => {
  it("rejects a 12-digit Aadhaar-like number in the note", () => {
    expect(checklistInputSchema.safeParse({ ...base, note: "my aadhaar 2345 6789 0123" }).success).toBe(false);
  });
  it("rejects a 10-digit mobile number in the note", () => {
    expect(hasSensitiveDetail("call 9876543210")).toBe(true);
  });
  it("rejects an email address and an IFSC code", () => {
    expect(hasSensitiveDetail("student@example.com")).toBe(true);
    expect(hasSensitiveDetail("SBIN0001234")).toBe(true);
  });
  it("accepts ordinary notes with class numbers and years", () => {
    expect(checklistInputSchema.safeParse({ ...base, note: "Class 10, changed school in 2026" }).success).toBe(true);
  });
  it("skips guardian details for students 18 or older", () => {
    expect(missingChecklistItems({ infoReady: [], documentsReady: [], under18: false }).info.some(i => /guardian/i.test(i))).toBe(false);
    expect(missingChecklistItems({ infoReady: [], documentsReady: [], under18: true }).info.some(i => /guardian/i.test(i))).toBe(true);
  });
});

describe("scholarship form responses from every website address reach this project", () => {
  const home = "https://riloyd-home.lovable.app";
  it("other hosts send to the published Lovable site", () => {
    expect(homeBaseFor("www.riloyd.in", home)).toBe(home);
    expect(homeBaseFor("student-form.vercel.app", home)).toBe(home);
  });
  it("this project's own hosts save directly", () => {
    expect(homeBaseFor("localhost", home)).toBe("");
    expect(homeBaseFor("riloyd.lovable.app", home)).toBe("");
  });
  it("public form service accepts HTTPS sites only, without cookies", () => {
    expect(educationCors("https://student-form.vercel.app")["Access-Control-Allow-Origin"]).toBe("https://student-form.vercel.app");
    expect(educationCors("http://untrusted.example")["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(educationCors("null")["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(educationCors("https://student-form.vercel.app")["Access-Control-Allow-Credentials"]).toBeUndefined();
  });
});
