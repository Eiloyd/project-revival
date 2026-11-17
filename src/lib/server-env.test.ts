import { describe, expect, it } from "vitest";
import { fillServerEnvAliases } from "./server-env";

describe("fillServerEnvAliases", () => {
  it("uses SUPABASE_SECRET_KEY when SUPABASE_SERVICE_ROLE_KEY is missing", () => {
    const env: Record<string, string | undefined> = { SUPABASE_SECRET_KEY: "secret-a" };
    fillServerEnvAliases(env);
    expect(env["SUPABASE_SERVICE_ROLE_KEY"]).toBe("secret-a");
  });
  it("never overwrites an existing SUPABASE_SERVICE_ROLE_KEY", () => {
    const env: Record<string, string | undefined> = {
      SUPABASE_SERVICE_ROLE_KEY: "kept",
      SUPABASE_SECRET_KEY: "other",
    };
    fillServerEnvAliases(env);
    expect(env["SUPABASE_SERVICE_ROLE_KEY"]).toBe("kept");
  });
  it("fills the server URL and publishable key from the Vercel integration names", () => {
    const env: Record<string, string | undefined> = {
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
    };
    expect(fillServerEnvAliases(env).sort()).toEqual(["SUPABASE_PUBLISHABLE_KEY", "SUPABASE_URL"]);
    expect(env["SUPABASE_URL"]).toBe("https://x.supabase.co");
    expect(env["SUPABASE_PUBLISHABLE_KEY"]).toBe("anon-key");
  });
  it("accepts Vercel's CRON_SECRET for scheduled jobs without replacing an existing job secret", () => {
    const vercel: Record<string, string | undefined> = { CRON_SECRET: "cron-a" };
    fillServerEnvAliases(vercel);
    expect(vercel["LOVABLE_CRON_SECRET"]).toBe("cron-a");
    const lovable: Record<string, string | undefined> = {
      LOVABLE_CRON_SECRET: "kept",
      CRON_SECRET: "cron-b",
    };
    fillServerEnvAliases(lovable);
    expect(lovable["LOVABLE_CRON_SECRET"]).toBe("kept");
  });
});
