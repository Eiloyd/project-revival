// Admin-only: switch sign-in methods on/off. Rows live in global_settings (public read), written with the server key
// after the caller's admin role is confirmed, because admins may only update — not create — settings rows.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { authChangeProblem, authSettingDefs, readAuthSettings, type AuthSettingKey } from "./methods";

const keys = authSettingDefs.map(d => d.key) as [AuthSettingKey, ...AuthSettingKey[]];

export const saveAuthSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ key: z.enum(keys), value: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !isAdmin) throw new Error("Admin access required.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error: readError } = await supabaseAdmin.from("global_settings").select("key,value").like("key", "auth\\_%");
    if (readError) throw new Error("Sign-in settings could not be read. Please try again.");
    const current = readAuthSettings(Object.fromEntries((rows ?? []).map(r => [r.key, r.value])));
    const problem = authChangeProblem(current, data.key, data.value);
    if (problem) throw new Error(problem);
    const def = authSettingDefs.find(d => d.key === data.key)!;
    const { error } = await supabaseAdmin.from("global_settings").upsert({
      key: def.key, value: data.value, category: "Sign-in & security", label: def.label, description: def.description,
      is_public: true, updated_by: context.userId, updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (error) throw new Error("The change could not be saved. Please try again.");
    return { key: def.key, value: data.value };
  });
