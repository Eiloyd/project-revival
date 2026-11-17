import { describe, expect, it, vi } from "vitest";
import { describeFailure, submissionFailure } from "./db-errors.server";

describe("database failure reporting", () => {
  it("treats a missing table grant as a setup problem", () => {
    expect(describeFailure({ code: "42501", message: "permission denied for table contact_submissions" }).kind).toBe("setup");
  });
  it("treats a table missing from the Data API as a setup problem", () => {
    expect(describeFailure({ code: "PGRST205", message: "Could not find the table 'public.x' in the schema cache" }).kind).toBe("setup");
  });
  it("treats a missing service key as a settings problem", () => {
    expect(describeFailure(new Error("Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY.")).kind).toBe("settings");
  });
  it("never logs database details, which can echo submitted values", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    submissionFailure("Could not save.", "insert", "contact_submissions", { code: "23505", message: "duplicate key", details: "Key (email)=(a@b.com) exists" });
    const line = String(spy.mock.calls[0]?.[0]);
    spy.mockRestore();
    expect(line).not.toContain("a@b.com");
    expect(JSON.parse(line)).toMatchObject({ code: "23505", target: "contact_submissions", operation: "insert" });
  });
  it("redacts keys that appear in an error message", () => {
    expect(describeFailure(new Error("bad key sb_secret_abc123")).message).not.toContain("sb_secret_abc123");
  });
  it("gives the visitor a reference ID", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = submissionFailure("Could not save.", "insert", "t", { code: "42501", message: "permission denied" }, "REF1234567");
    spy.mockRestore();
    expect(err.message).toBe("Could not save. The website's database setup is incomplete. Reference: REF1234567");
  });
});
