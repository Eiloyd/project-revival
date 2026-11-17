import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canDecide, expectedAmountPaise, programmePaymentInfo, programmePaymentSchema } from "./rules";

const missingTable = (e: { code?: string } | null) => !!e && ["42P01", "PGRST205", "42703", "PGRST204"].includes(e.code ?? "");
const SAFE = "If you have already paid, your money is safe — our team will contact you. You can also email info@riloyd.in with your transaction ID.";

/** Public: a payer sends the transaction ID after paying through the admin's embed code or link. */
export const submitProgrammePayment = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => programmePaymentSchema.parse(v))
  .handler(async ({ data }) => {
    const { limitSubmission } = await import("../submissions.server");
    await limitSubmission(data.email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: used, error: usedErr } = await supabaseAdmin.from("programme_payments").select("id").eq("provider_reference", data.reference).neq("status", "failed").limit(1);
    if (usedErr) { console.error("programme_payments lookup", usedErr.code, usedErr.message); throw new Error(`Transaction ID could not be saved right now. ${SAFE}`); }
    if (used?.length) throw new Error("This transaction ID has already been sent. If this is a mistake, contact us with your receipt.");
    const { data: edu } = await supabaseAdmin.from("education_support_registrations").select("id").eq("payment_reference", data.reference).limit(1);
    if (edu?.length) throw new Error("This transaction ID is already used for another form.");
    let applicationId: string | null = null;
    if (data.applicationCode && data.key.startsWith("young_innovators")) {
      const { data: app } = await supabaseAdmin.from("young_innovators_registrations").select("id, guardian_email").eq("application_code", data.applicationCode).maybeSingle();
      if (app && String(app.guardian_email).toLowerCase() === data.email) applicationId = app.id;
    }
    const fee = await (await import("../fees.server")).currentFee(data.key);
    const info = programmePaymentInfo[data.key];
    const { error } = await supabaseAdmin.from("programme_payments").insert({
      programme: info.programme, application_id: applicationId, application_kind: data.key, amount_paise: expectedAmountPaise(data.key, fee), currency: "INR",
      payer_name: data.name, payer_email: data.email, payer_phone: data.phone, provider: "manual", provider_reference: data.reference,
      provider_payment_id: data.applicationCode || null, status: "reference_submitted",
    });
    if (error) {
      console.error("programme_payments insert", error.code, error.message);
      if (error.code === "23505") throw new Error("This transaction ID has already been sent.");
      throw new Error(missingTable(error) ? `Payment details cannot be received yet (setup pending). ${SAFE}` : `Transaction ID could not be saved. ${SAFE}`);
    }
    return { ok: true as const };
  });

async function requireAdmin(context: { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: unknown }> }; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (data !== true) throw new Error("Admin access required.");
}

export type ProgrammePaymentRow = { id: string; programme: string; application_kind: string | null; amount_paise: number; payer_name: string; payer_email: string; payer_phone: string; provider_reference: string | null; provider_payment_id: string | null; status: string; paid_at: string | null; created_at: string };

/** Admin: every payment sent from the Young Innovators, Prototype and Funding Programme forms. */
export const listProgrammePayments = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ status: z.enum(["all", "reference_submitted", "paid", "failed"]) }).parse(v))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    let q = context.supabase.from("programme_payments").select("id, programme, application_kind, amount_paise, payer_name, payer_email, payer_phone, provider_reference, provider_payment_id, status, paid_at, created_at").order("created_at", { ascending: false }).limit(500);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) {
      if (missingTable(error)) return { setupMissing: true as const, rows: [] as ProgrammePaymentRow[] };
      throw new Error("Payments could not be loaded.");
    }
    return { setupMissing: false as const, rows: (rows ?? []) as ProgrammePaymentRow[] };
  });

/** Admin: mark a sent transaction ID as verified (money received) or rejected. */
export const decideProgrammePayment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid(), decision: z.enum(["paid", "failed"]) }).parse(v))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("programme_payments").select("status").eq("id", data.id).maybeSingle();
    if (error || !row) throw new Error("Payment not found.");
    if (!canDecide(row.status)) throw new Error("This payment has already been decided.");
    const { error: upErr } = await supabaseAdmin.from("programme_payments").update({ status: data.decision, paid_at: data.decision === "paid" ? new Date().toISOString() : null }).eq("id", data.id).eq("status", row.status);
    if (upErr) throw new Error("Payment could not be updated.");
    await supabaseAdmin.from("audit_logs").insert({ action: `programme_payment_${data.decision}`, actor_id: context.userId, entity: "programme_payments", entity_id: data.id }).then(() => undefined, () => undefined);
    return { ok: true as const };
  });
