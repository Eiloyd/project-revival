/**
 * Registration acknowledgement receipt (reference number + details + coordinator), emailed as a PDF after every
 * website registration. Browser-safe: no secrets, no network. Contact, bank and Aadhaar details are never printed.
 */
export type ReceiptCoordinator = { name: string; code: string; type?: string; mobile?: string } | null;
export type RegistrationReceipt = {
  formName: string;          // e.g. "Startup Registration"
  reference: string;         // acknowledgement / application number
  referenceLabel?: string;   // defaults to "Reference number"
  name: string;              // person the receipt is for
  submittedAt: Date | string;
  details: [string, string][];
  coordinator: ReceiptCoordinator;
  note?: string;
};

const clean = (v: string) => v.replace(/[\u0000-\u001f]/g, ' ').trim();

/** The rows printed on the receipt, in order. Coordinator phone is optional and shown only when known. */
export function receiptRows(r: RegistrationReceipt): [string, string][] {
  const when = new Date(r.submittedAt);
  const rows: [string, string][] = [
    [r.referenceLabel ?? 'Reference number', r.reference],
    ['Name', r.name],
    ['Form', r.formName],
    ['Submitted on', Number.isNaN(when.getTime()) ? '—' : when.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })],
    ...r.details.filter(([, v]) => clean(String(v ?? '')) !== ''),
  ];
  if (r.coordinator && clean(r.coordinator.name || r.coordinator.code)) {
    rows.push(['Coordinator', clean(r.coordinator.name) || '—']);
    if (clean(r.coordinator.code)) rows.push(['Coordinator code', clean(r.coordinator.code)]);
    if (r.coordinator.type && clean(r.coordinator.type)) rows.push(['Coordinator type', clean(r.coordinator.type)]);
    if (r.coordinator.mobile && clean(r.coordinator.mobile)) rows.push(['Coordinator contact', clean(r.coordinator.mobile)]);
  } else rows.push(['Coordinator', 'Registered without a coordinator']);
  return rows.map(([k, v]) => [clean(k), clean(String(v))] as [string, string]);
}

export const receiptSubject = (r: Pick<RegistrationReceipt, 'formName' | 'reference'>) => `RILOYD ${r.formName} — acknowledgement ${r.reference}`;
export const receiptFileName = (reference: string) => `RILOYD-acknowledgement-${reference.replace(/[^A-Za-z0-9-]/g, '') || 'receipt'}.pdf`;

/** Builds the PDF. QR squares are drawn directly so this runs on any server runtime (no canvas). */
export async function buildRegistrationReceiptPdf(r: RegistrationReceipt): Promise<ArrayBuffer> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFillColor(11, 31, 75); doc.rect(0, 0, 595, 100, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('RILOYD', 40, 48);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.text(doc.splitTextToSize(clean(r.formName), 515), 40, 72);
  doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text('Registration Acknowledgement', 40, 140);
  doc.setFontSize(22); doc.setTextColor(29, 78, 216); doc.text(clean(r.reference), 40, 172);
  let y = 210; doc.setFontSize(11);
  for (const [k, v] of receiptRows(r).slice(1)) {
    if (k === 'Coordinator') { doc.setDrawColor(226, 232, 240); doc.line(40, y - 14, 555, y - 14); y += 4; }
    const lines = doc.splitTextToSize(v || '—', 320) as string[];
    doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal'); doc.text(k, 40, y);
    doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.text(lines, 220, y);
    y += Math.max(24, lines.length * 14 + 10);
    if (y > 700) { doc.addPage(); y = 60; }
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
  const note = r.note ?? 'Keep this reference number for all communication with RILOYD. This acknowledgement confirms that your form was received; it is not proof of payment, selection or approval.';
  doc.text(doc.splitTextToSize(note, 515), 40, y + 10);
  try {
    const QR = await import('qrcode');
    const qr = QR.create(`RILOYD ${clean(r.formName)}\nReference: ${clean(r.reference)}`, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size; const cell = 90 / size; const x0 = 40, y0 = y + 50;
    doc.setFillColor(15, 23, 42);
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) if (qr.modules.get(row, col)) doc.rect(x0 + col * cell, y0 + row * cell, cell, cell, 'F');
    doc.text('Reference QR — scan to read the reference number.', 145, y0 + 48);
  } catch { /* QR is a convenience only */ }
  return doc.output('arraybuffer');
}

/** Plain email body (HTML). Every value is escaped. */
export function receiptEmailHtml(r: RegistrationReceipt): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const rows = receiptRows(r).map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:14px;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600">${esc(v)}</td></tr>`).join('');
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif"><div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#0b1f4b;color:#ffffff;padding:18px 20px;border-radius:8px 8px 0 0"><div style="font-size:20px;font-weight:700">RILOYD</div><div style="font-size:13px;opacity:.85">${esc(r.formName)}</div></div>
<div style="border:1px solid #e2e8f0;border-top:0;padding:20px;border-radius:0 0 8px 8px">
<p style="font-size:15px;color:#0f172a;margin:0 0 12px">Dear ${esc(r.name || 'applicant')},</p>
<p style="font-size:14px;color:#334155;margin:0 0 16px">Thank you — we have received your form. Your reference number is:</p>
<p style="font-size:24px;font-weight:700;color:#1d4ed8;margin:0 0 16px;letter-spacing:.5px">${esc(r.reference)}</p>
<table style="border-collapse:collapse;width:100%">${rows}</table>
<p style="font-size:13px;color:#475569;margin:16px 0 0">Your acknowledgement receipt is attached as a PDF. Please quote the reference number whenever you contact us at info@riloyd.in.</p>
</div></div></body></html>`;
}
