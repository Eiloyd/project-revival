import { describe, expect, it } from "vitest";
import { examMarks, scholarshipCeiling, scholarshipExam, syllabusId, syllabusTracks } from "./exam";

describe("Scholarship examination policy", () => {
  it("has 50 questions", () => expect(scholarshipExam.questions).toBe(50));
  it("lasts 40 minutes", () => expect(scholarshipExam.minutes).toBe(40));
  it("has a maximum of 100 marks", () => expect(examMarks(50, 0)).toBe(100));
  it("awards two marks per correct answer", () => expect(examMarks(1, 0)).toBe(2));
  it("deducts 1.5 marks per wrong answer", () => expect(examMarks(0, 1)).toBe(-1.5));
  it("leaves unanswered questions at zero", () => expect(examMarks(0, 0)).toBe(0));
  it("refuses more than 50 answers", () => expect(() => examMarks(49, 2)).toThrow());
  it("gives up to 50% from 80 through 95 inclusive", () => { for (const n of [80, 90, 91, 95]) expect(scholarshipCeiling(n, 25000)).toBe(12500); });
  it("gives up to 100% only above 95", () => { expect(scholarshipCeiling(95.5, 25000)).toBe(25000); expect(scholarshipCeiling(100, 50000)).toBe(50000); });
  it("has no exam-based award below 80", () => expect(scholarshipCeiling(79.5, 25000)).toBe(0));
  it("makes the registration fee non-refundable", () => expect(scholarshipExam.registrationFeeRefundable).toBe(false));
  it("prohibits AI assistance and fraud", () => { expect(scholarshipExam.prohibitedAssistance).toContain("ai"); expect(scholarshipExam.prohibitedAssistance).toContain("forged_documents"); });
  it("groups classes 4–5 and 6–8 separately", () => { expect(syllabusId("school", "4")).toBe("4-5"); expect(syllabusId("school", "5")).toBe("4-5"); expect(syllabusId("school", "6")).toBe("6-8"); expect(syllabusId("school", "8")).toBe("6-8"); expect(syllabusId("school", "3")).toBeUndefined(); });
  it("provides 50 questions for every syllabus group", () => { expect(syllabusTracks).toHaveLength(8); for (const s of syllabusTracks) expect(s.sections.reduce((sum, part) => sum + part.questions, 0)).toBe(50); });
  it("matches Diploma and competitive candidates to their own syllabus", () => { expect(syllabusId("diploma")).toBe("diploma"); expect(syllabusId("competitive")).toBe("competitive"); });
});