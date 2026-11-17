import { z } from 'zod';
import { ticketCategories } from '@/lib/submission-schemas';
const categories = ticketCategories.map(c => c.value) as [typeof ticketCategories[number]['value'], ...typeof ticketCategories[number]['value'][]];
export const requestTypes = ['support', 'complaint', 'enquiry', 'cancellation', 'refund'] as const;
export const triageInputSchema = z.object({
  subject: z.string().trim().max(200).optional().default(''),
  description: z.string().trim().min(10, 'Enter at least 10 characters.').max(4000),
  tone: z.enum(['friendly', 'formal']).default('friendly'), language: z.enum(['English', 'Hindi']).default('English'),
});
export type TriageInput = z.input<typeof triageInputSchema>;
export const triageResultSchema = z.object({
  category: z.enum(categories), priority: z.enum(['normal', 'high', 'urgent']), requestType: z.enum(requestTypes),
  reason: z.string(), summary: z.string(), suggestedNextStep: z.string(), replySubject: z.string(), replyBody: z.string(),
});
export type TriageResult = z.infer<typeof triageResultSchema>;
export const triageJsonSchema = {
  type: 'object', additionalProperties: false,
  required: ['category', 'priority', 'requestType', 'reason', 'summary', 'suggestedNextStep', 'replySubject', 'replyBody'],
  properties: {
    category: { type: 'string', enum: categories }, priority: { type: 'string', enum: ['normal', 'high', 'urgent'] },
    requestType: { type: 'string', enum: [...requestTypes] }, reason: { type: 'string' }, summary: { type: 'string' },
    suggestedNextStep: { type: 'string' }, replySubject: { type: 'string' }, replyBody: { type: 'string' },
  },
} as const;
