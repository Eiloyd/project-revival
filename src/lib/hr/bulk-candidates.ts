/** Bulk candidate files (CSV or Excel) from HR, institutes and consultancies. The database repeats every check. */
export const MAX_BULK_ROWS = 500;
export type BulkRow = { full_name: string; email: string; phone: string; city: string; experience_years: string; notes: string };

const aliases: Record<keyof BulkRow, string[]> = {
  full_name: ['full name', 'name', 'candidate name', 'student name', 'full_name'],
  email: ['email', 'email id', 'email address', 'e-mail'],
  phone: ['phone', 'mobile', 'mobile number', 'phone number', 'contact', 'contact number', 'whatsapp'],
  city: ['city', 'location', 'town'],
  experience_years: ['experience', 'experience years', 'experience (years)', 'exp', 'years of experience', 'experience_years'],
  notes: ['notes', 'remarks', 'comment', 'comments', 'qualification', 'course'],
};
const norm = (h: string) => h.trim().toLowerCase().replace(/\s+/g, ' ');

/** Maps each file column to a candidate field by its heading; unknown columns are ignored. */
export function mapCandidateRows(rows: Record<string, unknown>[]): BulkRow[] {
  return rows.map(r => {
    const out: BulkRow = { full_name: '', email: '', phone: '', city: '', experience_years: '', notes: '' };
    for (const [key, value] of Object.entries(r)) {
      const field = (Object.keys(aliases) as (keyof BulkRow)[]).find(f => aliases[f].includes(norm(key)));
      if (field && !out[field]) out[field] = String(value ?? '').trim();
    }
    return out;
  }).filter(r => Object.values(r).some(Boolean));
}

/** A file is accepted for upload only when it has rows, at most 500, and a name column. */
export function bulkFileProblem(rows: BulkRow[]): string | null {
  if (!rows.length) return 'The file has no candidate rows. Use the template headings: Full name, Email, Mobile, City, Experience, Notes.';
  if (rows.length > MAX_BULK_ROWS) return `Upload at most ${MAX_BULK_ROWS} candidates at a time (this file has ${rows.length}).`;
  if (!rows.some(r => r.full_name)) return 'No "Full name" column found. Use the template headings.';
  return null;
}

export const bulkTemplateCsv = 'Full name,Email,Mobile,City,Experience,Notes\nAsha Verma,asha@example.com,9876543210,Gwalior,0,B.Com 2026\n';

/** Reads a .csv or .xlsx file into heading → value rows. */
export async function readCandidateFile(file: File): Promise<Record<string, unknown>[]> {
  if (/\.xlsx$/i.test(file.name)) {
    const ExcelJS = (await import('exceljs')).default; const wb = new ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0]; if (!ws) return [];
    const heads: string[] = []; const out: Record<string, unknown>[] = [];
    ws.eachRow((row, i) => {
      const vals = (row.values as unknown[]).slice(1).map(v => (v && typeof v === 'object' && 'text' in (v as object) ? (v as { text: string }).text : v ?? ''));
      if (i === 1) vals.forEach((v, k) => { heads[k] = String(v); }); else out.push(Object.fromEntries(heads.map((h, k) => [h, vals[k] ?? ''])));
    });
    return out;
  }
  if (!/\.csv$/i.test(file.name)) throw new Error('Upload a .csv or .xlsx file.');
  const Papa = (await import('papaparse')).default;
  const parsed = Papa.parse<Record<string, unknown>>(await file.text(), { header: true, skipEmptyLines: true });
  return parsed.data;
}
