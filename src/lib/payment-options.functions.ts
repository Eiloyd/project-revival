import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizePaymentLink, paymentOptionSaveSchema } from "./payment-options";

export const savePaymentOption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => paymentOptionSaveSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: admin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!admin) throw new Error("Admin access required.");
    // Payment configuration is critical: it changes only after a second admin approves (Admin → Change approvals).
    const payload = { payment_link: normalizePaymentLink(data.paymentLink) ?? "", ...(data.amount !== undefined ? { amount: data.amount } : {}), ...(data.embedCode !== undefined ? { embed_code: data.embedCode || "" } : {}) };
    const { data: code, error } = await context.supabase.rpc("critical_change_propose", { _kind: "payment_option", _target: data.key, _payload: payload, _summary: `Payment option ${data.key}${data.amount !== undefined ? `: ₹${data.amount}` : ""}` });
    if (error) throw new Error(error.message);
    return { ok: true, pending: true, code: String(code) };
  });
