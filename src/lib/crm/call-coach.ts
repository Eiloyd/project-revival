import { z } from "zod";
import { stages } from "./rules";

// Browser-safe shapes for the BDE "call notes → next step" AI helper.
export const followUpChannels = ["whatsapp", "call", "email", "meeting"] as const;
export const interestLevels = ["hot", "warm", "cold"] as const;
export const channelLabels: Record<(typeof followUpChannels)[number], string> = { whatsapp: "WhatsApp", call: "Phone call", email: "Email", meeting: "Meeting" };

export const callCoachInputSchema = z.object({
  leadId: z.string().uuid().optional(),
  kind: z.enum(["call", "meeting"]).default("call"),
  notes: z.string().trim().min(15, "Write at least a few words about the conversation (15+ characters).").max(4000, "Keep notes under 4,000 characters."),
  language: z.enum(["English", "Hindi", "Hinglish"]).default("English"),
});
export type CallCoachInput = z.input<typeof callCoachInputSchema>;

export const callCoachResultSchema = z.object({
  summary: z.string(),
  interest: z.enum(interestLevels),
  nextStep: z.string(),
  followUpInDays: z.number().int().min(0).max(30),
  followUpChannel: z.enum(followUpChannels),
  followUpMessage: z.string(),
  suggestedStage: z.enum(stages),
  stageReason: z.string(),
});
export type CallCoachResult = z.infer<typeof callCoachResultSchema>;

export const callCoachJsonSchema = {
  type: "object", additionalProperties: false,
  required: ["summary", "interest", "nextStep", "followUpInDays", "followUpChannel", "followUpMessage", "suggestedStage", "stageReason"],
  properties: {
    summary: { type: "string" },
    interest: { type: "string", enum: [...interestLevels] },
    nextStep: { type: "string" },
    followUpInDays: { type: "integer", minimum: 0, maximum: 30 },
    followUpChannel: { type: "string", enum: [...followUpChannels] },
    followUpMessage: { type: "string" },
    suggestedStage: { type: "string", enum: [...stages] },
    stageReason: { type: "string" },
  },
} as const;

/** Follow-up date (YYYY-MM-DD) a number of days after today's IST date. */
export function followUpDate(todayIst: string, days: number) {
  const d = new Date(`${todayIst}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + Math.max(0, Math.min(30, Math.round(days))));
  return d.toISOString().slice(0, 10);
}

/** Hot leads get a high-priority follow-up task; others stay normal. */
export const followUpPriority = (interest: CallCoachResult["interest"]) => interest === "hot" ? "high" as const : "normal" as const;

/** Activity text saved on the lead: the BDE's own notes first, then the AI summary and agreed next step. */
export function activityBody(notes: string, r: Pick<CallCoachResult, "summary" | "nextStep">) {
  return `${notes.trim()}\n\nSummary: ${r.summary.trim()}\nNext step: ${r.nextStep.trim()}`.slice(0, 3000);
}
