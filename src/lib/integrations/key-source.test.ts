import { describe, expect, it } from "vitest";
import { integrationsKeySource } from "./store.server";

describe("integration keys encryption key", () => {
  it("uses the dedicated key when it is set", () => {
    expect(integrationsKeySource({ INTEGRATIONS_ENCRYPTION_KEY: "k1", SUPABASE_SERVICE_ROLE_KEY: "svc" })).toBe("k1");
  });
  it("works without the dedicated key by deriving one from the database secret", () => {
    expect(integrationsKeySource({ SUPABASE_SERVICE_ROLE_KEY: "svc" })).toBe("derived:svc");
    expect(integrationsKeySource({ SUPABASE_SECRET_KEY: "sec" })).toBe("derived:sec");
  });
  it("has no key (and so stores nothing) when neither is set", () => {
    expect(integrationsKeySource({})).toBeNull();
  });
});
