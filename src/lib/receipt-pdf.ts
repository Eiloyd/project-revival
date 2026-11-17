// Browser-only A4 receipt PDF (jsPDF + QR loaded on demand). Not a tax invoice: GST invoices come from Zoho.
import logoUrl from '@/assets/local/riloyd-logo-dark.png.optimized.webp';
import { amountInWordsINR, receiptNo, receiptQrText, type ReceiptData } from './receipts';

async function pngFrom(url: string): Promise<string | null> {
  try {
    const img = new Image(); img.crossOrigin = 'anonymous';
    await new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(new Error('image')); img.src = url; });
    const scale = Math.min(1, 600 / (img.naturalWidth || 1)); const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * scale); cv.height = Math.round(img.naturalHeight * scale);
    const ctx = cv.getContext('2d'); if (!ctx || !cv.width) return null; ctx.drawImage(img, 0, 0, cv.width, cv.height); return cv.toDataURL('image/png');
  } catch { return null; }
}

export async function receiptPdf(r: ReceiptData) {
  const [{ jsPDF }, QR] = await Promise.all([import('jspdf'), import('qrcode')]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); const W = 210; const brand = '#B5121B';
  const logo = await pngFrom(logoUrl);
  if (logo) doc.addImage(logo, 'PNG', 15, 12, 45, 16, undefined, 'FAST'); else { doc.setFontSize(20); doc.setTextColor(brand); doc.text('RILOYD', 15, 24); }
  doc.setTextColor(20); doc.setFontSize(18); doc.text('PAYMENT RECEIPT', W - 15, 20, { align: 'right' });
  doc.setFontSize(9); doc.setTextColor(90); doc.text(`Receipt no. ${receiptNo(r.ref)}`, W - 15, 26, { align: 'right' }); doc.text(`Date: ${r.date}`, W - 15, 31, { align: 'right' });
  doc.setDrawColor(brand); doc.setLineWidth(0.8); doc.line(15, 36, W - 15, 36);
  // watermark
  doc.setTextColor(240); doc.setFontSize(60); doc.text('RILOYD', W / 2, 160, { align: 'center', angle: 30 });
  doc.setTextColor(20); doc.setFontSize(11);
  const rows: [string, string][] = [['Received from', r.party || '—'], ['Amount', `INR ${r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`], ['Amount in words', amountInWordsINR(r.amount)], ['Payment mode', r.mode], ['UTR / reference', r.utr || '—'], ['Towards', r.description || '—'], ['Received in account', r.account || '—'], ['Entry status', r.status]];
  let y = 50;
  for (const [k, v] of rows) {
    doc.setFont('helvetica', 'bold'); doc.text(k, 18, y); doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(v, 110) as string[]; doc.text(lines, 70, y); y += Math.max(1, lines.length) * 6 + 4;
    doc.setDrawColor(225); doc.setLineWidth(0.2); doc.line(15, y - 5, W - 15, y - 5);
  }
  const qr = await QR.toDataURL(receiptQrText(r), { margin: 1, width: 300 });
  doc.addImage(qr, 'PNG', 18, y + 6, 36, 36, undefined, 'FAST'); doc.setFontSize(8); doc.setTextColor(90); doc.text('Scan to read receipt details', 18, y + 46);
  doc.setDrawColor(120); doc.rect(W - 80, y + 10, 62, 28); doc.text('Authorised signatory (Accounts)', W - 49, y + 43, { align: 'center' });
  doc.setFontSize(8.5); doc.setTextColor(110);
  doc.text(doc.splitTextToSize('This receipt only acknowledges money received by RILOYD. It is not a tax invoice — GST invoices are issued separately through Zoho. Computer-generated receipt.', W - 30) as string[], 15, 275);
  doc.setFillColor(brand); doc.rect(0, 289, W, 8, 'F');
  doc.save(`${receiptNo(r.ref)}.pdf`);
}
