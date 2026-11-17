/** Who can become a RILOYD volunteer. Browser-safe so the page and tests share one rule set. */
export const VOLUNTEER_MIN_AGE = 18;

export const eligibilityCriteria = [
  { title: `Age ${VOLUNTEER_MIN_AGE} years or above`, text: "You must be an adult, because volunteers sign up for their own dashboard, complete KYC and receive payouts in their own name." },
  { title: "Indian resident with a valid ID", text: "Aadhaar card and PAN card in your own name for KYC verification." },
  { title: "Minimum 12th pass", text: "Students currently in college, graduates, professionals, teachers and homemakers are all welcome." },
  { title: "Bank account in your own name", text: "Withdrawals are paid only to your own verified bank account or UPI ID." },
  { title: "Smartphone with internet", text: "You will use WhatsApp, your referral link and your volunteer dashboard on your phone." },
  { title: "Basic Hindi or English", text: "You should be able to explain programmes clearly to students and parents." },
  { title: "A few hours every week", text: "Choose up to 10, 10–20, 20–30 or more than 30 hours a week — whatever fits your studies or work." },
  { title: "Honest and respectful", text: "You agree to the volunteer code of conduct below: no cash collection, no false promises, private data stays private." },
] as const;

export type EligibilityAnswers = { age: number | null; twelfthPass: boolean; ownBankAccount: boolean; smartphone: boolean; acceptsConduct: boolean };

/** Reasons someone cannot join yet; an empty list means they can apply. */
export function eligibilityProblems(a: EligibilityAnswers): string[] {
  const out: string[] = [];
  if (a.age === null || !Number.isFinite(a.age)) out.push("Enter your age.");
  else if (a.age < VOLUNTEER_MIN_AGE) out.push(`You must be at least ${VOLUNTEER_MIN_AGE} years old.`);
  if (!a.twelfthPass) out.push("You need to have passed 12th class.");
  if (!a.ownBankAccount) out.push("You need a bank account in your own name for payouts.");
  if (!a.smartphone) out.push("You need a smartphone with internet.");
  if (!a.acceptsConduct) out.push("You must accept the volunteer code of conduct.");
  return out;
}
