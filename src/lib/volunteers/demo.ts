// Clearly fictional sample data for the preview-only volunteer and employee demos. Nothing here is real or saved.
import type { VolunteerBundle } from "./data";

const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const ids = ["d-vol-1", "d-vol-2", "d-vol-3"];
const base = { employee_id: "d-emp", date_of_birth: "2001-04-12", gender: "", address: "Sample address", qualification: "Graduate", photo_path: null, kyc_note: "", commission_percent: null, payout_masked: "UPI sa••••@okbank", payout_method: "upi" as const };

export function demoVolunteerBundle(): VolunteerBundle {
  const names = ["Sample Volunteer A", "Sample Volunteer B", "Sample Volunteer C"];
  const volunteers = ids.map((id, i) => ({ ...base, id, volunteer_code: `VOL-0000${i + 1}`, referral_code: `VDEMO00${i + 1}`, user_id: i < 2 ? `d-user-${i}` : null, full_name: names[i]!,
    mobile: `98765000${i}0`, email: `volunteer${i + 1}@example.demo`, state: ["Bihar", "Madhya Pradesh", "Rajasthan"][i]!, district: ["Patna", "Bhopal", "Jaipur"][i]!,
    status: (i === 2 ? "inactive" : "active") as "active" | "inactive", kyc_status: (["verified", "submitted", "pending"] as const)[i]!, monthly_target: 20,
    activated_at: i < 2 ? day(60) : null, last_login_at: i < 2 ? day(i) : null, created_at: day(70 - i * 10) }));
  const stages: [string, string, string][] = [["completed", "paid", "verified"], ["completed", "paid", "eligible"], ["completed", "reference_submitted", "under_verification"], ["started", "pending", "submitted"], ["completed", "failed", "submitted"], ["completed", "paid", "incomplete_documents"]];
  const referrals = Array.from({ length: 90 }, (_, i) => { const [form_status, payment_status, review_status] = stages[i % stages.length]!; const credited = review_status === "verified" || review_status === "eligible";
    return { volunteer_id: ids[i % 2]!, form_key: "education", source_id: `d-ref-${i}`, application_code: `2611151001${String(i + 1).padStart(5, "0")}`, student_name: `Sample Student ${i + 1}`,
      submitted_at: day(i), completed_at: form_status === "completed" ? day(i) : null, form_status, payment_status, review_status, status_reason: review_status === "incomplete_documents" ? "Upload marksheet" : "",
      commission_amount: payment_status === "failed" || form_status !== "completed" ? null : 559.9, commission_status: credited ? "credited" : payment_status === "failed" ? "reversed" : form_status === "completed" ? "pending" : null }; });
  const commissions = referrals.filter(r => r.commission_status).map((r, i) => ({ id: `d-c-${i}`, volunteer_id: r.volunteer_id, form_key: "education", application_code: r.application_code, fee_amount: 599, percent: 10, flat_amount: 500,
    amount: 559.9, status: r.commission_status as "pending" | "credited" | "reversed", created_at: r.submitted_at, credited_at: r.commission_status === "credited" ? r.submitted_at : null }));
  const withdrawals = [
    { id: "d-w-1", request_number: "WD-000001", volunteer_id: ids[0]!, amount: 3000, method: "upi" as const, payout_masked: "UPI sa••••@okbank", status: "paid" as const, transaction_id: "UTR-DEMO-1", rejection_reason: "", escalated_at: null, escalation_note: "", requested_at: day(20), processed_at: day(19), paid_at: day(18) },
    { id: "d-w-2", request_number: "WD-000002", volunteer_id: ids[0]!, amount: 3000, method: "upi" as const, payout_masked: "UPI sa••••@okbank", status: "pending" as const, transaction_id: "", rejection_reason: "", escalated_at: null, escalation_note: "", requested_at: day(1), processed_at: null, paid_at: null },
    { id: "d-w-3", request_number: "WD-000003", volunteer_id: ids[1]!, amount: 3500, method: "bank" as const, payout_masked: "Bank ••••1234 (HDFC)", status: "rejected" as const, transaction_id: "", rejection_reason: "KYC not verified yet", escalated_at: null, escalation_note: "", requested_at: day(5), processed_at: day(4), paid_at: null },
  ];
  const tickets = [{ id: "d-t-1", ticket_number: "VT-000001", volunteer_id: ids[0]!, category: "commission", subject: "Commission not shown for one student", status: "answered" as const, escalated: false, created_at: day(3), updated_at: day(2) }];
  const notices = [
    { id: "d-n-1", volunteer_id: ids[0]!, kind: "announcement" as const, title: "November target: 20 verified forms", body: "Top volunteers get a certificate.", read_at: null, created_at: day(1) },
    { id: "d-n-2", volunteer_id: ids[0]!, kind: "status" as const, title: "Commission credited: ₹559.90", body: "A referred form was verified.", read_at: day(2), created_at: day(2) },
  ];
  return { volunteers, referrals, commissions, withdrawals, tickets, notices, settings: { max_percent: 10, min_withdrawal: 3000, payout_note: "Withdrawals are paid within 7 working days." },
    rates: [{ form_key: "education", label: "Student Scholarship & Sponsorship", percent: 10, flat_amount: 500, active: true }, { form_key: "young_innovators", label: "Young Innovators 2026", percent: 10, flat_amount: 0, active: true }] };
}
