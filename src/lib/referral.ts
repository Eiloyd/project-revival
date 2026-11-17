// Referral links for every website form: ?ref=CODE fills the employee / coordinator code. Browser-safe and tested.
import { z } from "zod";

export const REFERRAL_PARAM = "ref";
export const REFERRAL_STORAGE_KEY = "riloyd-referral-code";

/** Optional employee / coordinator code: letters, numbers and dashes, saved in capitals. */
export const referralCodeSchema = z.string().trim().max(40).regex(/^[A-Za-z0-9-]*$/, "Referral code can contain only letters, numbers and dashes.")
  .transform(s => s.toUpperCase()).optional().default("");

/** A code from a link or storage, or "" when it is missing or not a valid code. */
export function cleanReferralCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const code = raw.trim();
  return /^[A-Za-z0-9-]{2,40}$/.test(code) ? code.toUpperCase() : "";
}

export const referralForms = [
  { key: "education", label: "Student Scholarship & Sponsorship", path: "/education-support" },
  { key: "contact", label: "Contact / enquiry", path: "/contact" },
  { key: "startup", label: "Startup registration", path: "/register/startup" },
  { key: "investor", label: "Investor registration", path: "/register/investor" },
  { key: "mentor", label: "Mentor registration", path: "/register/mentor" },
  { key: "business", label: "Business registration", path: "/register/business" },
  { key: "young-innovators", label: "Young Innovators 2026", path: "/young-innovators-2026" },
  { key: "foundation", label: "RILOYD Foundation forms", path: "/foundation" },
] as const;

export function referralLink(origin: string, path: string, code: string): string {
  const clean = cleanReferralCode(code);
  return `${origin.replace(/\/$/, "")}${path}${clean ? `?${REFERRAL_PARAM}=${encodeURIComponent(clean)}` : ""}`;
}
