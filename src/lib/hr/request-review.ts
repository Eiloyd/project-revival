import { z } from 'zod';

// Browser-safe shape for the HR reviewer's AI request helper.
export const hrRequestCategories = ['Leave / time off', 'Attendance', 'Salary / payroll', 'Reimbursement / advance', 'Documents / letters', 'Profile / records', 'Grievance / complaint', 'Resignation / exit', 'Policy question', 'Other'] as const;
export const hrUrgency = ['high', 'medium', 'low'] as const;

export const hrReviewInputSchema = z.object({
  requestId: z.string().uuid().optional(),
  text: z.string().trim().max(4000).default(''),
  language: z.enum(['English', 'Hindi']).default('English'),
}).refine(v => Boolean(v.requestId) || v.text.length >= 10, 'Choose a request or paste at least 10 characters.');
export type HrReviewInput = z.input<typeof hrReviewInputSchema>;

export const hrReviewResultSchema = z.object({
  summary: z.string(),
  category: z.enum(hrRequestCategories),
  urgency: z.enum(hrUrgency),
  urgencyReason: z.string(),
  suggestedNextStep: z.string(),
  checks: z.array(z.string()),
});
export type HrReviewResult = z.infer<typeof hrReviewResultSchema>;

export const hrReviewJsonSchema = {
  type: 'object', additionalProperties: false,
  required: ['summary', 'category', 'urgency', 'urgencyReason', 'suggestedNextStep', 'checks'],
  properties: {
    summary: { type: 'string' },
    category: { type: 'string', enum: [...hrRequestCategories] },
    urgency: { type: 'string', enum: [...hrUrgency] },
    urgencyReason: { type: 'string' },
    suggestedNextStep: { type: 'string' },
    checks: { type: 'array', items: { type: 'string' } },
  },
} as const;

/** Only work facts go to the AI: never the applicant's name, email, phone, bank or ID numbers. */
export function requestForAi(r: { type: string; title: string; description: string; from_date: string | null; to_date: string | null; days: number | string | null; amount: number | string | null; priority: string; status: string; current_step: string | null; details: unknown }) {
  const details = r.details && typeof r.details === 'object' ? { ...(r.details as Record<string, unknown>) } : {};
  for (const k of ['client_key', 'payee', 'account', 'ifsc', 'upi', 'phone', 'email', 'bank', 'pan', 'aadhaar']) delete details[k];
  return { type: r.type, title: r.title, description: r.description, from: r.from_date, to: r.to_date, days: r.days, amount: r.amount, priority: r.priority, status: r.status, waitingFor: r.current_step, details };
}
