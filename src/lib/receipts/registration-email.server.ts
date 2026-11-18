import { buildRegistrationReceiptPdf, receiptEmailHtml, receiptFileName, receiptSubject, type ReceiptCoordinator, type RegistrationReceipt } from './registration-receipt';

/**
 * Emails the acknowledgement receipt (PDF attached) through Resend with the owner's own RESEND_API_KEY, so it works on
 * Vercel and on Lovable hosting alike. Best effort: it never throws and never blocks the visitor's submission.
 * RECEIPT_FROM_EMAIL (optional) overrides the sender; the sender's domain must be verified in Resend.
 */
export async function sendRegistrationReceipt(to: string, receipt: RegistrationReceipt): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env['RESEND_API_KEY'];
  if (!key) { console.warn('[receipt] RESEND_API_KEY is not set; acknowledgement email skipped for', receipt.reference); return { sent: false, reason: 'not_configured' }; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to.trim())) return { sent: false, reason: 'no_email' };
  const from = process.env['RECEIPT_FROM_EMAIL'] || 'RILOYD <noreply@riloyd.in>';
  let attachments: { filename: string; content: string }[] = [];
  try {
    const pdf = new Uint8Array(await buildRegistrationReceiptPdf(receipt));
    let bin = ''; for (let i = 0; i < pdf.length; i += 0x8000) bin += String.fromCharCode(...pdf.subarray(i, i + 0x8000));
    attachments = [{ filename: receiptFileName(receipt.reference), content: btoa(bin) }];
  } catch (e) { console.error('[receipt] PDF could not be built; sending the email without it', e); }
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `receipt-${receipt.reference}`.slice(0, 256) },
      body: JSON.stringify({ from, to: [to.trim()], reply_to: 'info@riloyd.in', subject: receiptSubject(receipt), html: receiptEmailHtml(receipt), attachments }),
    });
    if (!res.ok) { console.error(`[receipt] Resend refused [${res.status}]: ${(await res.text()).slice(0, 500)}`); return { sent: false, reason: `resend_${res.status}` }; }
    return { sent: true };
  } catch (e) { console.error('[receipt] email failed', e); return { sent: false, reason: 'network' }; }
  finally { clearTimeout(timer); }
}

/** Coordinator details for a code typed in or carried by a referral link (employee, coordinator or active volunteer). */
export async function coordinatorForCode(code: string | null | undefined): Promise<ReceiptCoordinator> {
  const c = (code ?? '').trim();
  if (!c) return null;
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { referralCoordinator } = await import('../education-support/registration-store.server');
    const found = await referralCoordinator(supabaseAdmin, c);
    return found ? { name: found.name, code: found.code, type: found.type, mobile: found.mobile } : { name: '', code: c.toUpperCase() };
  } catch (e) { console.error('[receipt] coordinator lookup failed', e); return { name: '', code: c.toUpperCase() }; }
}

/** Looks up the coordinator and sends the receipt; for use right after a form is saved. */
export async function emailReceiptAfterSave(to: string, receipt: Omit<RegistrationReceipt, 'coordinator' | 'submittedAt'> & { coordinatorCode?: string | null; coordinator?: ReceiptCoordinator }) {
  try {
    const coordinator = receipt.coordinator !== undefined ? receipt.coordinator : await coordinatorForCode(receipt.coordinatorCode);
    const { coordinatorCode: _c, ...rest } = receipt; void _c;
    return await sendRegistrationReceipt(to, { ...rest, coordinator, submittedAt: new Date() });
  } catch (e) { console.error('[receipt] unexpected failure', e); return { sent: false, reason: 'error' }; }
}
