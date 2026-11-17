import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { useEffect, useState, type ReactNode } from "react";
import { Copy, Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { referralForms, referralLink } from "@/lib/referral";
import { applicationStage, stageLabels, rupees, type Stage } from "@/lib/volunteers/rules";
import type { VReferral, VWithdrawal, Volunteer } from "@/lib/volunteers/data";

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return <article className="rounded-xl border border-border bg-card p-4 shadow-sm"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">{value}</p>{note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}</article>;
}

export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="rounded-xl border border-border bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3"><h3 className="text-sm font-bold text-foreground">{title}</h3>{action}</div><div className="p-4">{children}</div></section>;
}

const stageTone: Record<Stage, string> = {
  incomplete: "bg-muted text-muted-foreground", submitted: "bg-accent text-accent-foreground", under_verification: "bg-accent text-accent-foreground",
  documents_required: "bg-secondary text-secondary-foreground", verified: "bg-primary/15 text-primary", approved: "bg-primary/15 text-primary",
  rejected: "bg-destructive/15 text-destructive", completed: "bg-primary text-primary-foreground",
};
export function StageBadge({ referral }: { referral: VReferral }) {
  const s = applicationStage(referral);
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${stageTone[s]}`}>{stageLabels[s]}</span>;
}

export function StatusPill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "good" | "bad" | "warn" }) {
  const cls = { muted: "bg-muted text-muted-foreground", good: "bg-primary/15 text-primary", bad: "bg-destructive/15 text-destructive", warn: "bg-secondary text-secondary-foreground" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>{children}</span>;
}
export const withdrawalTone = (s: VWithdrawal["status"]) => s === "paid" ? "good" : s === "rejected" ? "bad" : "warn";
export const kycTone = (s: Volunteer["kyc_status"]) => s === "verified" ? "good" : s === "rejected" ? "bad" : s === "submitted" ? "warn" : "muted";

export function Bars({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return <div className="flex h-36 items-end gap-2" role="img" aria-label={data.map(d => `${d.label}: ${d.count}`).join(", ")}>
    {data.map(d => <div key={d.label} className="flex flex-1 flex-col items-center gap-1"><span className="text-xs font-semibold tabular-nums text-foreground">{d.count}</span><div className="w-full rounded-t-md bg-primary" style={{ height: `${Math.max(4, d.count / max * 100)}px` }} /><span className="text-[11px] text-muted-foreground">{d.label}</span></div>)}
  </div>;
}

export const fmtDate = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const copyText = (text: string, done = "Copied.") => { void navigator.clipboard.writeText(text).then(() => toast.success(done)).catch(() => toast.error("Copy failed — select the text and copy it.")); };

export async function qrDataUrl(text: string) { const QR = await import("qrcode"); return QR.toDataURL(text, { margin: 1, width: 512 }); }

/** Referral code, links to every form and a downloadable QR code. */
export function ReferralTools({ code }: { code: string }) {
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const main = referralLink(origin, "/education-support", code);
  useEffect(() => { if (origin) void qrDataUrl(main).then(setQr).catch(() => setQr("")); }, [origin, main]);
  return <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-muted-foreground">Referral code</span><code className="rounded-md bg-accent px-2.5 py-1 text-sm font-bold text-accent-foreground">{code}</code><Button size="sm" variant="outline" onClick={() => copyText(code, "Referral code copied.")}><Copy size={14} />Copy code</Button></div>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {referralForms.filter(f => f.key === "education" || f.key === "young-innovators" || f.key === "foundation").map(f => { const link = referralLink(origin, f.path, code); return <li key={f.key} className="flex flex-wrap items-center justify-between gap-2 p-2.5 text-sm"><span className="min-w-0"><span className="block font-semibold text-foreground">{f.label}</span><code className="break-all text-xs text-muted-foreground">{link}</code></span><span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => copyText(link, "Referral link copied.")}><Copy size={14} />Copy</Button><WhatsAppShareButton text={`${f.label} — RILOYD: ${link}`} /></span></li>; })}
      </ul>
      <div className="flex flex-wrap gap-2"><Button asChild size="sm"><a href={main} target="_blank" rel="noreferrer">New student registration</a></Button><Button asChild size="sm" variant="outline"><a href={`https://wa.me/?text=${encodeURIComponent(`RILOYD Student Scholarship & Sponsorship registration: ${main}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a></Button></div>
    </div>
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-3">
      {qr ? <img src={qr} alt={`QR code for referral link ${code}`} className="h-36 w-36 rounded bg-background p-1" /> : <div className="flex h-36 w-36 items-center justify-center text-muted-foreground"><QrCode /></div>}
      <Button size="sm" variant="outline" disabled={!qr} onClick={() => { const a = document.createElement("a"); a.href = qr; a.download = `riloyd-referral-${code}.png`; a.click(); }}><Download size={14} />Download QR</Button>
    </div>
  </div>;
}

async function pdf() { const { jsPDF } = await import("jspdf"); return new jsPDF({ unit: "mm", format: "a4" }); }
const save = (doc: { save: (n: string) => void }, name: string) => doc.save(name);

export async function downloadIdCard(v: Volunteer, origin: string) {
  const doc = await pdf(); const qr = await qrDataUrl(referralLink(origin, "/education-support", v.referral_code));
  doc.setDrawColor(40); doc.roundedRect(20, 20, 86, 54, 3, 3);
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("RILOYD Volunteer", 25, 30);
  doc.setFontSize(10); doc.text(v.full_name, 25, 40); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text(`Volunteer ID: ${v.volunteer_code}`, 25, 47); doc.text(`Referral code: ${v.referral_code}`, 25, 53); doc.text(`Joined: ${fmtDate(v.activated_at ?? v.created_at)}`, 25, 59);
  doc.text(`Status: ${v.status}`, 25, 65); doc.addImage(qr, "PNG", 80, 40, 22, 22);
  doc.setFontSize(8); doc.text("Verify this volunteer with RILOYD before sharing personal details.", 20, 82);
  save(doc, `riloyd-volunteer-id-${v.volunteer_code}.pdf`);
}

/** Experience certificate for an active, KYC-verified volunteer, with a QR code to the public verification page. */
export async function downloadCertificate(v: Volunteer, origin: string, referrals: number) {
  const { jsPDF } = await import("jspdf"); const QR = await import("qrcode");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const qr = await QR.toDataURL(`${origin}/team#verify-volunteer`, { margin: 0, width: 220 });
  doc.setDrawColor(181, 18, 27); doc.setLineWidth(1.2); doc.rect(10, 10, 277, 190); doc.setLineWidth(0.3); doc.rect(14, 14, 269, 182);
  doc.setTextColor(181, 18, 27); doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.text("RILOYD", 148.5, 36, { align: "center" });
  doc.setTextColor(30); doc.setFontSize(20); doc.text("Certificate of Volunteer Service", 148.5, 54, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.text("This is to certify that", 148.5, 72, { align: "center" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text(v.full_name, 148.5, 88, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(12);
  const since = fmtDate(v.activated_at ?? v.created_at); const issued = fmtDate(new Date().toISOString());
  doc.text(doc.splitTextToSize(`has served as a RILOYD Volunteer (ID ${v.volunteer_code}) since ${since}, helping students and families learn about RILOYD programmes and complete their applications. During this period ${referrals} student application${referrals === 1 ? " was" : "s were"} referred through their volunteer code.`, 220), 148.5, 104, { align: "center" });
  doc.text("We thank them for their honest and dedicated service.", 148.5, 132, { align: "center" });
  doc.setFontSize(10); doc.text(`Issued on ${issued}`, 30, 176); doc.text(`Volunteer ID: ${v.volunteer_code}`, 30, 182);
  doc.line(110, 172, 187, 172); doc.text("For RILOYD", 148.5, 178, { align: "center" });
  doc.addImage(qr, "PNG", 245, 158, 26, 26); doc.setFontSize(7); doc.text("Scan to verify", 258, 188, { align: "center" });
  save(doc, `riloyd-volunteer-certificate-${v.volunteer_code}.pdf`);
}

export async function downloadReceipt(v: Volunteer, w: VWithdrawal) {
  const doc = await pdf(); let y = 25; const line = (t: string, bold = false) => { doc.setFont("helvetica", bold ? "bold" : "normal"); doc.text(t, 20, y); y += 8; };
  doc.setFontSize(16); line("RILOYD — Withdrawal receipt", true); doc.setFontSize(11);
  line(`Receipt for request ${w.request_number}`); line(`Volunteer: ${v.full_name} (${v.volunteer_code})`); line(`Amount: Rs. ${Number(w.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
  line(`Paid to: ${w.payout_masked.replace(/•/g, "*")}`); line(`Transaction ID: ${w.transaction_id || "—"}`); line(`Requested: ${fmtDate(w.requested_at)}   Paid: ${fmtDate(w.paid_at)}`);
  y += 4; doc.setFontSize(9); line("This receipt was generated from the RILOYD volunteer dashboard.");
  save(doc, `riloyd-receipt-${w.request_number}.pdf`);
}

export async function downloadStatement(v: Volunteer, rows: { date: string; text: string; amount: string; status: string }[], title = "Earnings statement") {
  const doc = await pdf(); const { default: autoTable } = await import("jspdf-autotable");
  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(`RILOYD — ${title}`, 14, 18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(`${v.full_name} · ${v.volunteer_code} · generated ${fmtDate(new Date().toISOString())}`, 14, 26);
  autoTable(doc, { startY: 32, head: [["Date", "Details", "Amount", "Status"]], body: rows.map(r => [r.date, r.text, r.amount.replace("₹", "Rs. "), r.status]), styles: { fontSize: 9 } });
  save(doc, `riloyd-${title.toLowerCase().replace(/\s+/g, "-")}-${v.volunteer_code}.pdf`);
}

export async function downloadWorkbook(name: string, sheets: { title: string; rows: Record<string, unknown>[] }[]) {
  const { default: ExcelJS } = await import("exceljs"); const book = new ExcelJS.Workbook();
  for (const s of sheets) { const sheet = book.addWorksheet(s.title.slice(0, 31)); const cols = Object.keys(s.rows[0] ?? { "No records": "" }); sheet.addRow(cols); s.rows.forEach(r => sheet.addRow(cols.map(c => r[c] ?? ""))); sheet.getRow(1).font = { bold: true }; sheet.views = [{ state: "frozen", ySplit: 1 }]; sheet.columns.forEach(c => { c.width = 22; }); }
  const buffer = await book.xlsx.writeBuffer(); const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export { rupees };
