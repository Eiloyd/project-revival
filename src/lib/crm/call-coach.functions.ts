import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callCoachInputSchema, callCoachJsonSchema, callCoachResultSchema, type CallCoachResult } from "./call-coach";

const INSTRUCTIONS = `You are a sales coach for RILOYD's Business Development Executives (BDEs).
RILOYD (Rishishwar Industry Private Limited) runs a startup Funding Programme, Prototype & Seed Funding, RILOYD Foundation Education Support scholarships, the Young Innovators challenge, manpower supply and business services.
A BDE gives you notes from a customer call or meeting, plus the lead's details and recent history when available.
Return:
- summary: 1-2 sentences on what the customer said and wants.
- interest: hot (ready to buy / clear timeline), warm (interested, needs info or time), cold (not interested now).
- nextStep: one specific, doable action for the BDE (what, and with whom), based only on the notes.
- followUpInDays: when to follow up (0 = today). Honour any date or day the customer mentioned.
- followUpChannel: the best way to follow up.
- followUpMessage: a short ready-to-send message to the customer in the requested language (Hinglish = Hindi in Roman letters mixed with English). Greet by first name if given. For WhatsApp keep it under 80 words with no subject line. Recap what was discussed and the agreed next step.
- suggestedStage: the pipeline stage that fits now (new, contacted, qualified, proposal, won, lost) and stageReason in one line.
Rules: use only facts in the notes and lead details; never invent prices, discounts, dates, guarantees, funding approvals or policies — if the customer asked about these, say the BDE will confirm. Never ask for bank, card, OTP or Aadhaar details. Sign messages "Team RILOYD".`;

export const suggestCallFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => callCoachInputSchema.parse(input))
  .handler(async ({ context, data }): Promise<{ result: CallCoachResult | null; error: string | null }> => {
    const { data: role } = await context.supabase.rpc("crm_role");
    if (!role || role === "support") throw new Error("Sales CRM access required.");
    let lead: Record<string, unknown> | null = null;
    if (data.leadId) {
      // Read through the caller's own access rules, so a BDE can only use leads they may see.
      const { data: row } = await context.supabase.from("crm_leads").select("title, stage, amount, source, customer_id, next_follow_up").eq("id", data.leadId).maybeSingle();
      if (!row) throw new Error("Lead not found or not yours.");
      const [{ data: cust }, { data: acts }] = await Promise.all([
        context.supabase.from("crm_customers").select("full_name, company").eq("id", row.customer_id).maybeSingle(),
        context.supabase.from("crm_activities").select("kind, body, created_at").eq("lead_id", data.leadId).order("created_at", { ascending: false }).limit(5),
      ]);
      // Contact details (phone, email) are intentionally not sent to the AI.
      lead = { title: row.title, stage: row.stage, dealValueInr: row.amount, source: row.source, nextFollowUp: row.next_follow_up,
        customerFirstName: (cust?.full_name ?? "").split(/\s+/)[0] || null, company: cust?.company || null,
        recentHistory: (acts ?? []).map(a => ({ kind: a.kind, date: a.created_at.slice(0, 10), note: a.body.slice(0, 500) })) };
    }
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const { streamResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const stream = await streamResponse({
        model: "openai/gpt-6-astra",
        instructions: INSTRUCTIONS,
        input: JSON.stringify({ today, conversationType: data.kind, notes: data.notes, messageLanguage: data.language, lead }),
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "call_follow_up", strict: true, schema: callCoachJsonSchema } },
      });
      let text = ""; let refused = false; let incomplete = false;
      for await (const event of stream) {
        if (event.type === "response.output_text.delta") text += event.delta;
        if (event.type === "response.refusal.delta" || event.type === "response.refusal.done") refused = true;
        if (event.type === "response.incomplete") incomplete = true;
      }
      if (refused) return { result: null, error: "The AI declined to handle these notes." };
      if (incomplete || !text) return { result: null, error: "The AI answer was incomplete. Please try again." };
      const parsed = callCoachResultSchema.safeParse(JSON.parse(text));
      if (!parsed.success) return { result: null, error: "The AI answer could not be read. Please try again." };
      return { result: parsed.data, error: null };
    } catch (err) {
      if (err instanceof GatewayError) {
        console.error("Call follow-up AI failed", err.code, err.httpStatus);
        if (err.code === "payment_required") return { result: null, error: "AI credits have run out. Please add credits and try again." };
        if (err.code === "rate_limited") return { result: null, error: "Too many AI requests right now. Please wait a minute and try again." };
        if (err.code === "permission_denied") return { result: null, error: err.recovery?.message ?? "AI access is not available for this workspace." };
        return { result: null, error: "The AI helper is unavailable right now. Please try again later." };
      }
      console.error("Call follow-up AI failed", err);
      return { result: null, error: "The AI helper could not process these notes." };
    }
  });
