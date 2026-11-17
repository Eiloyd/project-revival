/** Browser-safe Accounts & Finance helpers. Balances and approvals are computed and enforced in the database. */

/** Budget alert level reached: alerts fire at 75%, 90% and 100% of a budget. */
export function budgetAlertLevel(spent: number, budget: number): 0 | 75 | 90 | 100 {
  if (!(budget > 0)) return 0;
  const pct = (spent / budget) * 100;
  return pct >= 100 ? 100 : pct >= 90 ? 90 : pct >= 75 ? 75 : 0;
}

export type BankLine = { date: string; description: string; ref: string; amount: number };

function splitCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out.map(s => s.trim());
}

function toIsoDate(v: string): string | null {
  const s = v.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return `${m[1]}-${m[2]!.padStart(2, '0')}-${m[3]!.padStart(2, '0')}`;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(s); // Indian bank statements: DD/MM/YYYY
  if (m) { const y = m[3]!.length === 2 ? `20${m[3]}` : m[3]!; return `${y}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`; }
  return null;
}

const num = (v: string | undefined) => { const n = Number((v ?? '').replace(/[₹,\s]/g, '')); return Number.isFinite(n) ? n : 0; };

/**
 * Reads a bank statement CSV. Needs a Date column and either Amount (credit +, debit −) or separate Debit/Credit columns.
 * Optional Description/Narration and Ref/UTR/Cheque columns. Rows without a valid date or a non-zero amount are skipped.
 */
export function parseBankCsv(text: string): { lines: BankLine[]; skipped: number; error?: string } {
  const rows = text.replace(/\r/g, '').split('\n').filter(r => r.trim());
  if (rows.length < 2) return { lines: [], skipped: 0, error: 'The file has no rows.' };
  const head = splitCsvLine(rows[0]!).map(h => h.toLowerCase());
  const find = (...names: string[]) => head.findIndex(h => names.some(n => h.includes(n)));
  const di = find('date'); const ai = find('amount'); const dr = find('debit', 'withdrawal'); const cr = find('credit', 'deposit');
  const de = find('description', 'narration', 'particular', 'remark'); const re = find('utr', 'ref', 'cheque', 'chq');
  if (di < 0 || (ai < 0 && dr < 0 && cr < 0)) return { lines: [], skipped: rows.length - 1, error: 'Columns needed: Date and Amount (or Debit and Credit).' };
  const lines: BankLine[] = []; let skipped = 0;
  for (const r of rows.slice(1)) {
    const c = splitCsvLine(r); const date = toIsoDate(c[di] ?? '');
    const amount = Math.round((ai >= 0 ? num(c[ai]) : num(c[cr]) - num(c[dr])) * 100) / 100;
    if (!date || amount === 0) { skipped++; continue; }
    lines.push({ date, amount, description: de >= 0 ? (c[de] ?? '') : '', ref: re >= 0 ? (c[re] ?? '') : '' });
  }
  return { lines, skipped };
}

export const txnTypes = [
  { value: 'received', label: 'Money received', dir: 'in' }, { value: 'paid', label: 'Money paid', dir: 'out' }, { value: 'reimbursement', label: 'Reimbursement', dir: 'out' },
  { value: 'salary', label: 'Salary', dir: 'out' }, { value: 'commission', label: 'Commission', dir: 'out' }, { value: 'refund', label: 'Refund', dir: 'out' },
  { value: 'advance', label: 'Advance', dir: 'out' }, { value: 'transfer', label: 'Bank transfer', dir: 'either' }, { value: 'bank_charge', label: 'Bank charges', dir: 'out' },
  { value: 'interest', label: 'Interest', dir: 'in' }, { value: 'adjustment', label: 'Adjustment / correction', dir: 'either' },
] as const;

/** Formula-safe CSV shared with every other export (see share/whatsapp.ts). */
export { toCsv } from './share/whatsapp';
import { toCsv } from './share/whatsapp';

export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
