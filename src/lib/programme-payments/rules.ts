import { z } from "zod";
import { paymentIdPattern, type PaymentOptionKey } from "@/lib/payment-options";

/**
 * Paid forms outside the scholarship form that collect money directly (admin embed code / payment link)
 * and then ask the payer for the transaction ID, so the team can match and verify the payment.
 */
export const programmePaymentKeys = [
  "young_innovators_6_8", "young_innovators_9_10", "young_innovators_11_12",
  "prototype_funding_registration", "funding_programme_registration", "funding_programme_summit",
] as const satisfies readonly PaymentOptionKey[];
export type ProgrammePaymentKey = (typeof programmePaymentKeys)[number];

export const programmePaymentInfo: Record<ProgrammePaymentKey, { programme: string; label: string; gstPercent: number }> = {
  young_innovators_6_8: { programme: "Young Innovators 2026", label: "Registration fee (Class 6–8)", gstPercent: 18 },
  young_innovators_9_10: { programme: "Young Innovators 2026", label: "Registration fee (Class 9–10)", gstPercent: 18 },
  young_innovators_11_12: { programme: "Young Innovators 2026", label: "Registration fee (Class 11–12)", gstPercent: 18 },
  prototype_funding_registration: { programme: "Prototype & Seed Funding", label: "Registration fee", gstPercent: 18 },
  funding_programme_registration: { programme: "Funding Programme", label: "Registration fee", gstPercent: 18 },
  funding_programme_summit: { programme: "Funding Programme", label: "Summit package", gstPercent: 0 },
};

/** Amount the payer should have paid, in paise: fee plus GST where the page adds GST. */
export function expectedAmountPaise(key: ProgrammePaymentKey, fee: number): number {
  return Math.round(fee * (100 + programmePaymentInfo[key].gstPercent));
}

/** Same rule as the scholarship form, so one payment ID can never be used for two forms. */
export function normaliseTransactionId(v: string): string { return v.trim().replace(/\s+/g, ""); }

export const programmePaymentSchema = z.object({
  key: z.enum(programmePaymentKeys),
  reference: z.string().transform(normaliseTransactionId).pipe(z.string().regex(paymentIdPattern, "Enter the transaction / payment ID from your receipt (6–60 letters, numbers, - or _).")),
  name: z.string().trim().min(2, "Enter the payer's name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(254),
  phone: z.string().trim().regex(/^\+?[0-9 ]{10,15}$/, "Enter a valid mobile number."),
  applicationCode: z.string().trim().max(40).regex(/^[A-Za-z0-9-]*$/, "Use the reference exactly as shown.").optional(),
});
export type ProgrammePaymentInput = z.input<typeof programmePaymentSchema>;

export type ProgrammePaymentStatus = "reference_submitted" | "paid" | "failed";
export const programmePaymentStatusLabel: Record<string, string> = { reference_submitted: "Waiting for check", paid: "Verified", failed: "Rejected", created: "Started" };
/** Only a payment still waiting for a check can be verified or rejected; a decision is final. */
export function canDecide(status: string): boolean { return status === "reference_submitted" || status === "created"; }
