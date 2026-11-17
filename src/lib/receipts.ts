// Payment receipt rules (tested). A receipt only acknowledges money received; GST tax invoices come from Zoho.
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
function below100(n: number): string { return n < 20 ? ones[n]! : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''}`; }
function below1000(n: number): string { const h = Math.floor(n / 100), r = n % 100; return [h ? `${ones[h]} Hundred` : '', r ? below100(r) : ''].filter(Boolean).join(' '); }
/** Indian numbering words: 125000.5 → "Rupees One Lakh Twenty Five Thousand and Fifty Paise Only". */
export function amountInWordsINR(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Amount must be zero or more');
  const paise = Math.round(amount * 100) % 100; let n = Math.floor(Math.round(amount * 100) / 100);
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${crore >= 1000 ? amountInWordsINR(crore).replace(/^Rupees | Only$/g, '') : below1000(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  const rupees = parts.length ? parts.join(' ') : 'Zero';
  return `Rupees ${rupees}${paise ? ` and ${below100(paise)} Paise` : ''} Only`;
}
export const receiptNo = (ref: string) => `RCPT-${ref.trim().toUpperCase()}`;
/** Receipts only for verified/reconciled money received — never for recorded (unchecked) or void entries. */
export const canIssueReceipt = (t: { direction: string; status: string }) => t.direction === 'in' && (t.status === 'verified' || t.status === 'reconciled');
export type ReceiptData = { ref: string; date: string; party: string; amount: number; mode: string; utr?: string | null; description?: string | null; account?: string | null; status: string };
export function receiptQrText(r: ReceiptData): string {
  return [`RILOYD payment receipt ${receiptNo(r.ref)}`, `Date: ${r.date}`, `Received from: ${r.party || '—'}`, `Amount: INR ${r.amount.toFixed(2)}`, `Mode: ${r.mode}${r.utr ? ` · UTR ${r.utr}` : ''}`, `Status: ${r.status}`].join('\n');
}
