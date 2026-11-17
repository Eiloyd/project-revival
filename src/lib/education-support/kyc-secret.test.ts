import { describe, expect, it, vi } from "vitest";
import { KYC_SETTINGS_MESSAGE, VisitorError, requireKycSecret } from "./registration-store.server";

describe("bank/Aadhaar encryption key", () => {
  it("returns the configured key", () => {
    expect(requireKycSecret({ EDUCATION_KYC_ENCRYPTION_KEY: "k-123" })).toBe("k-123");
  });

  it("falls back to a key derived from the database secret when the dedicated key is missing", () => {
    expect(requireKycSecret({ SUPABASE_SERVICE_ROLE_KEY: "svc" })).toBe("riloyd-kyc-v1:svc");
    expect(requireKycSecret({ SUPABASE_SECRET_KEY: "sec" })).toBe("riloyd-kyc-v1:sec");
  });

  it("refuses to store bank/Aadhaar details without the key and shows a reference", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    let thrown: unknown;
    try { requireKycSecret({}); } catch (e) { thrown = e; }
    expect(thrown).toBeInstanceOf(VisitorError);
    expect((thrown as Error).message).toMatch(new RegExp(`^${KYC_SETTINGS_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} Reference: [0-9A-F]{10}$`));
    const line = JSON.parse(String(log.mock.calls[0]?.[0]));
    expect(line).toMatchObject({ event: "config_missing", variable: "EDUCATION_KYC_ENCRYPTION_KEY" });
    log.mockRestore();
  });
});
