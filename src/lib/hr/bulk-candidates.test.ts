import { describe, expect, it } from 'vitest';
import { bulkFileProblem, mapCandidateRows, MAX_BULK_ROWS } from './bulk-candidates';

describe('bulk candidate files', () => {
  it('maps common headings like "Candidate Name" and "Mobile Number"', () => {
    const [r] = mapCandidateRows([{ 'Candidate Name': ' Asha ', 'Mobile Number': '9876543210', 'Email ID': 'a@x.in', Extra: 'x' }]);
    expect(r).toEqual({ full_name: 'Asha', email: 'a@x.in', phone: '9876543210', city: '', experience_years: '', notes: '' });
  });
  it('allows at most 500 candidates per upload', () => {
    const rows = mapCandidateRows(Array.from({ length: MAX_BULK_ROWS + 1 }, (_, i) => ({ Name: `P${i}` })));
    expect(MAX_BULK_ROWS).toBe(500);
    expect(bulkFileProblem(rows)).toMatch(/at most 500/);
    expect(bulkFileProblem(rows.slice(0, 500))).toBeNull();
  });
  it('rejects a file with no name column', () => {
    expect(bulkFileProblem(mapCandidateRows([{ Email: 'a@x.in' }]))).toMatch(/Full name/);
  });
});
