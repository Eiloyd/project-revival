import { z } from "zod";
import type { ApplicationType } from "./education-support/rules";

// Browser-safe rules for admin-editable payment links and Zoho Checkout embeds.
export const paymentOptionKeys = [
  "education_sponsorship", "education_scholarship_25k", "education_scholarship_50k",
  "young_innovators_6_8", "young_innovators_9_10", "young_innovators_11_12",
  "funding_programme_registration", "funding_programme_summit", "prototype_funding_registration",
] as const;
export type PaymentOptionKey = (typeof paymentOptionKeys)[number];
export type PaymentOption = { key: string; programme: string; label: string; payment_link: string | null; razorpay_button_id: string | null; sort_order: number; amount?: number | null; embed_code?: string | null };

/** Fees used until the admin sets a different amount (rupees, before GST where GST applies). */
export const defaultFees: Record<PaymentOptionKey, number> = {
  education_sponsorship: 149, education_scholarship_25k: 249, education_scholarship_50k: 599,
  young_innovators_6_8: 249, young_innovators_9_10: 349, young_innovators_11_12: 499,
  funding_programme_registration: 999, funding_programme_summit: 3599, prototype_funding_registration: 999,
};

/** The admin's amount when set, otherwise the default fee. */
export function feeFor(options: readonly Pick<PaymentOption, "key" | "amount">[] | undefined, key: PaymentOptionKey): number {
  const amount = options?.find(o => o.key === key)?.amount;
  return typeof amount === "number" && Number.isInteger(amount) && amount >= 1 && amount <= 1_000_000 ? amount : defaultFees[key];
}

/** Swaps the default scholarship fees written in policy text (₹149/₹249/₹599) for the current fees, in one pass. */
export function withCurrentEducationFees(text: string, fee: (key: PaymentOptionKey) => number): string {
  const keys: Record<string, PaymentOptionKey> = { "149": "education_sponsorship", "249": "education_scholarship_25k", "599": "education_scholarship_50k" };
  return text.replace(/₹(149|249|599)(?!\d|,\d)/g, (_, n: string) => `₹${fee(keys[n]!).toLocaleString("en-IN")}`);
}

/**
 * Any payment embed code. A code that is only an <iframe> shows that https page directly;
 * anything else (script buttons such as Razorpay or PayU) runs in an isolated sandboxed frame.
 */
export type PaymentEmbed = { kind: "iframe"; src: string } | { kind: "html"; html: string };
export function parsePaymentEmbed(code: string | null | undefined): PaymentEmbed | null {
  const raw = (code ?? "").trim();
  if (!raw) return null;
  const iframes = raw.match(/<iframe\b[^>]*>/gi) ?? [];
  const onlyIframe = iframes.length === 1 && raw.replace(/<iframe\b[\s\S]*?(<\/iframe>|\/>)/i, "").replace(/<\/?(div|p|br|center)\b[^>]*>/gi, "").trim() === "";
  if (onlyIframe) {
    const src = iframes[0]!.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g, "&").trim();
    if (src && /^https:\/\/[^\s<>"'`]+$/.test(src)) return { kind: "iframe", src };
  }
  return { kind: "html", html: raw };
}

export const educationPaymentKey = (type: ApplicationType): PaymentOptionKey => `education_${type}` as PaymentOptionKey;
export function youngInnovatorsPaymentKey(schoolClass: number): PaymentOptionKey | null {
  if (schoolClass >= 6 && schoolClass <= 8) return "young_innovators_6_8";
  if (schoolClass >= 9 && schoolClass <= 10) return "young_innovators_9_10";
  if (schoolClass >= 11 && schoolClass <= 12) return "young_innovators_11_12";
  return null;
}

/** Accepts a payment page link or a Zoho Checkout `<iframe>` embed code and returns the https link; "" clears it. */
export function normalizePaymentLink(input: string): string | null | undefined {
  const raw = input.trim();
  if (!raw) return null;
  const src = /<iframe\b/i.test(raw) ? raw.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] : raw;
  const url = src?.replace(/&amp;/g, "&").trim();
  if (!url || url.length > 500 || !/^https:\/\/[^\s<>"'`]+$/.test(url)) return undefined;
  try { new URL(url); return url; } catch { return undefined; }
}

const zohoCheckoutHost = /(^|\.)(zohosecurepay\.(in|com|eu|com\.au|jp|ca|sa)|zohocheckout\.(in|com|eu))$/;
/** Zoho Checkout pages are shown inside the form; any other link opens in a new tab. */
export function isZohoCheckoutUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try { const u = new URL(url); return u.protocol === "https:" && zohoCheckoutHost.test(u.hostname); } catch { return false; }
}

/** ISO 3166-2:IN two-letter codes Zoho Checkout expects in `billing_state_code` for India. */
const indiaStateCodes: Record<string, string> = {
  "Andhra Pradesh": "AP", "Arunachal Pradesh": "AR", "Assam": "AS", "Bihar": "BR", "Chhattisgarh": "CT", "Goa": "GA", "Gujarat": "GJ", "Haryana": "HR",
  "Himachal Pradesh": "HP", "Jharkhand": "JH", "Karnataka": "KA", "Kerala": "KL", "Madhya Pradesh": "MP", "Maharashtra": "MH", "Manipur": "MN",
  "Meghalaya": "ML", "Mizoram": "MZ", "Nagaland": "NL", "Odisha": "OR", "Punjab": "PB", "Rajasthan": "RJ", "Sikkim": "SK", "Tamil Nadu": "TN",
  "Telangana": "TG", "Tripura": "TR", "Uttar Pradesh": "UP", "Uttarakhand": "UT", "West Bengal": "WB", "Andaman and Nicobar Islands": "AN",
  "Chandigarh": "CH", "Dadra and Nagar Haveli and Daman and Diu": "DH", "Delhi": "DL", "Jammu and Kashmir": "JK", "Ladakh": "LA", "Lakshadweep": "LD", "Puducherry": "PY",
};

export type ZohoPrefill = { name?: string; email?: string; mobile?: string; street?: string; city?: string; state?: string; zip?: string };

/** Pre-fills the Zoho Checkout page with the student's account details and billing address (Zoho's documented page parameters). */
export function zohoPrefillUrl(url: string, p: ZohoPrefill): string {
  const u = new URL(url);
  const parts = (p.name ?? "").trim().split(/\s+/).filter(Boolean);
  const set = (k: string, v: string | undefined) => { if (v && v.trim()) u.searchParams.set(k, v.trim()); };
  set("first_name", parts[0]); set("last_name", parts.slice(1).join(" ")); set("email", p.email); set("mobile", p.mobile);
  set("billing_street", p.street); set("billing_city", p.city); set("billing_zip", p.zip);
  const stateCode = p.state ? indiaStateCodes[p.state.trim()] : undefined;
  set("billing_state_code", stateCode);
  if (stateCode || p.city || p.zip || p.street) set("billing_country_code", "IN");
  return u.toString();
}

/** Payment ID sent back by the payment page on its return address, if any. */
export const paymentIdPattern = /^[A-Za-z0-9_-]{6,60}$/;
const paymentIdParams = ["payment_id", "paymentid", "payment_reference", "transaction_id", "txn_id", "razorpay_payment_id"];
export function paymentIdFromSearch(params: URLSearchParams): string | null {
  for (const key of paymentIdParams) { const v = params.get(key)?.trim(); if (v && paymentIdPattern.test(v)) return v; }
  return null;
}

/** Hand-over between the payment return page and the open form (same site only). */
export const PAYMENT_RETURN_KEY = "riloyd-payment-return";
export const PAYMENT_MESSAGE_TYPE = "riloyd:payment-id";
const PAYMENT_RETURN_MAX_AGE = 2 * 60 * 60 * 1000;
export function readStoredPaymentId(raw: string | null, now = Date.now()): string | null {
  if (!raw) return null;
  try { const v = JSON.parse(raw) as { id?: unknown; at?: unknown }; return typeof v.id === "string" && paymentIdPattern.test(v.id) && typeof v.at === "number" && now - v.at >= 0 && now - v.at < PAYMENT_RETURN_MAX_AGE ? v.id : null; } catch { return null; }
}
export function readPaymentMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as { type?: unknown; paymentId?: unknown };
  return d.type === PAYMENT_MESSAGE_TYPE && typeof d.paymentId === "string" && paymentIdPattern.test(d.paymentId) ? d.paymentId : null;
}

export const paymentOptionSaveSchema = z.object({
  key: z.enum(paymentOptionKeys),
  paymentLink: z.string().trim().max(4000).refine(v => normalizePaymentLink(v) !== undefined, "Paste an https:// payment link or the Zoho Checkout embed code."),
  amount: z.number().int("Enter the fee in whole rupees.").min(1, "The fee must be at least ₹1.").max(1_000_000, "The fee is too large.").nullable().optional(),
  embedCode: z.string().trim().max(10_000, "The embed code is too long.").optional(),
});
