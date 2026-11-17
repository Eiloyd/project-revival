import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { hrReviewInputSchema, hrReviewJsonSchema, hrReviewResultSchema, requestForAi, type HrReviewResult } from './request-review';

const INSTRUCTIONS = `You help HR reviewers at RILOYD (Rishishwar Industry Private Limited) handle employee requests.
Read the request and return: a two-sentence summary, the best HR category, an urgency level (high = payroll/salary problems, grievances, safety, deadlines today or tomorrow, resignation with short notice; medium = needs action this week; low = routine), a one-line reason, the single best next step for the HR reviewer, and up to 4 short things HR should check before deciding.
Company leave rule: a reporting manager (BDM / senior) may approve up to 2 single-day leaves a month alone; continuous leave of 2 or more days, or leave touching another leave, needs HR approval.
Never invent policy, salary figures, dates or outcomes. Do not decide the request — suggest. Write in the requested language.`;

export const reviewHrRequest = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => hrReviewInputSchema.parse(input))
  .handler(async ({ context, data }): Promise<{ result: HrReviewResult | null; error: string | null }> => {
    const { data: dashes } = await context.supabase.rpc('my_dashboards');
    const mine = Array.isArray(dashes) ? dashes as string[] : [];
    if (!mine.includes('hr') && !mine.includes('admin')) throw new Error('HR or Admin access required.');
    let request: unknown = null;
    if (data.requestId) {
      // Read with the reviewer's own access: RLS decides whether they may see this request.
      const { data: row } = await context.supabase.from('requests').select('type,title,description,from_date,to_date,days,amount,priority,status,current_step,details').eq('id', data.requestId).maybeSingle();
      if (!row) return { result: null, error: 'This request was not found or you cannot see it.' };
      request = requestForAi(row);
    }
    const { streamResponse, GatewayError } = await import('@lovable.dev/ai-gateway');
    try {
      const stream = await streamResponse({
        model: 'openai/gpt-6-astra',
        instructions: INSTRUCTIONS,
        input: JSON.stringify({ request, reviewerNotes: data.text || null, language: data.language }),
        reasoning: { effort: 'low' },
        text: { format: { type: 'json_schema', name: 'hr_request_review', strict: true, schema: hrReviewJsonSchema } },
      });
      let text = ''; let refused = false; let incomplete = false;
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') text += event.delta;
        if (event.type === 'response.refusal.delta' || event.type === 'response.refusal.done') refused = true;
        if (event.type === 'response.incomplete') incomplete = true;
      }
      if (refused) return { result: null, error: 'The AI declined to review this request.' };
      if (incomplete || !text) return { result: null, error: 'The AI answer was incomplete. Please try again.' };
      const parsed = hrReviewResultSchema.safeParse(JSON.parse(text));
      if (!parsed.success) return { result: null, error: 'The AI answer could not be read. Please try again.' };
      return { result: parsed.data, error: null };
    } catch (err) {
      if (err instanceof GatewayError) {
        console.error('HR request review failed', err.code, err.httpStatus);
        if (err.code === 'payment_required') return { result: null, error: 'AI credits have run out. Please add credits and try again.' };
        if (err.code === 'rate_limited') return { result: null, error: 'Too many AI requests right now. Please wait a minute and try again.' };
        if (err.code === 'permission_denied') return { result: null, error: err.recovery?.message ?? 'AI access is not available for this workspace.' };
        return { result: null, error: 'The AI helper is unavailable right now. Please try again later.' };
      }
      console.error('HR request review failed', err);
      return { result: null, error: 'The AI helper could not review this request.' };
    }
  });
