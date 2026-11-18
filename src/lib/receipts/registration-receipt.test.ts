import { describe, expect, it } from 'vitest';
import { buildRegistrationReceiptPdf, receiptEmailHtml, receiptRows, receiptSubject } from './registration-receipt';

const base = { formName: 'Startup Registration', reference: '18112026UP05000031', name: 'Asha Verma', submittedAt: '2026-11-18T04:00:00Z', details: [['Category', 'Startup'], ['Empty', '']] as [string, string][] };

describe('registration acknowledgement receipt', () => {
  it('starts with the reference number and skips empty details', () => {
    const rows = receiptRows({ ...base, coordinator: null });
    expect(rows[0]).toEqual(['Reference number', '18112026UP05000031']);
    expect(rows.map(r => r[0])).not.toContain('Empty');
  });
  it('prints coordinator name, code and contact number when known', () => {
    const rows = receiptRows({ ...base, coordinator: { name: 'Ravi Kumar', code: 'BDE-101', type: 'RILOYD Employee', mobile: '9876543210' } });
    expect(rows).toContainEqual(['Coordinator', 'Ravi Kumar']);
    expect(rows).toContainEqual(['Coordinator code', 'BDE-101']);
    expect(rows).toContainEqual(['Coordinator contact', '9876543210']);
  });
  it('coordinator contact number is optional', () => {
    const rows = receiptRows({ ...base, coordinator: { name: 'Ravi Kumar', code: 'BDE-101' } });
    expect(rows.map(r => r[0])).not.toContain('Coordinator contact');
  });
  it('says so when there is no coordinator', () => {
    expect(receiptRows({ ...base, coordinator: null })).toContainEqual(['Coordinator', 'Registered without a coordinator']);
  });
  it('subject carries the reference number and the email escapes values', () => {
    expect(receiptSubject(base)).toContain('18112026UP05000031');
    expect(receiptEmailHtml({ ...base, name: '<b>x</b>', coordinator: null })).not.toContain('<b>x</b>');
  });
  it('builds a real PDF', async () => {
    const pdf = new Uint8Array(await buildRegistrationReceiptPdf({ ...base, coordinator: { name: 'Ravi', code: 'BDE-101', mobile: '9876543210' } }));
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe('%PDF-');
  });
});
