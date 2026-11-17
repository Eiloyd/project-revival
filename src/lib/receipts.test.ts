import { describe, expect, it } from 'vitest';
import { amountInWordsINR, canIssueReceipt, receiptNo } from './receipts';
describe('payment receipts', () => {
  it('writes amounts in Indian words with paise', () => { expect(amountInWordsINR(125000.5)).toBe('Rupees One Lakh Twenty Five Thousand and Fifty Paise Only'); });
  it('handles crores', () => { expect(amountInWordsINR(23456789)).toBe('Rupees Two Crore Thirty Four Lakh Fifty Six Thousand Seven Hundred Eighty Nine Only'); });
  it('handles zero', () => { expect(amountInWordsINR(0)).toBe('Rupees Zero Only'); });
  it('numbers receipts from the entry ref', () => { expect(receiptNo(' fin-2611-0004 ')).toBe('RCPT-FIN-2611-0004'); });
  it('only issues receipts for checked money received', () => {
    expect(canIssueReceipt({ direction: 'in', status: 'verified' })).toBe(true);
    expect(canIssueReceipt({ direction: 'in', status: 'reconciled' })).toBe(true);
    expect(canIssueReceipt({ direction: 'in', status: 'recorded' })).toBe(false);
    expect(canIssueReceipt({ direction: 'in', status: 'void' })).toBe(false);
    expect(canIssueReceipt({ direction: 'out', status: 'verified' })).toBe(false);
  });
});
