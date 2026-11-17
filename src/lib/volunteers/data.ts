// Volunteer programme data, read in the browser through the signed-in user's own database rules:
// a volunteer sees only themself, an employee only volunteers they created, an admin everyone.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_MIN_WITHDRAWAL, effectiveMinWithdrawal, MAX_COMMISSION_PERCENT, type IncentiveMode, type RewardScheme } from "./rules";

/** The volunteer tables come from database/update-2026-11-15-volunteers.sql and are not in the generated types. */
export const vdb = supabase as unknown as SupabaseClient;

export type Volunteer = {
  id: string; volunteer_code: string; public_listing?: boolean; referral_code: string; employee_id: string; user_id: string | null; full_name: string; mobile: string; email: string;
  date_of_birth: string | null; gender: string; address: string; state: string; district: string; qualification: string; photo_path: string | null;
  status: "active" | "inactive"; kyc_status: "pending" | "submitted" | "verified" | "rejected"; kyc_note: string; commission_percent: number | null;
  monthly_target: number; payout_method: "upi" | "bank" | null; payout_masked: string; activated_at: string | null; last_login_at: string | null; created_at: string;
  /** From database/update-2026-11-17-sales-pay-volunteer-rewards.sql; missing on older databases (= commission). */
  incentive_mode?: IncentiveMode; fixed_incentive?: number; revenue_target?: number;
};
export type VReferral = {
  volunteer_id: string; form_key: string; source_id: string; application_code: string; student_name: string; submitted_at: string; completed_at: string | null;
  form_status: string; payment_status: string; review_status: string; status_reason: string; commission_amount: number | null; commission_status: string | null;
};
export type VCommission = { id: string; volunteer_id: string; form_key: string; application_code: string; fee_amount: number; percent: number; flat_amount: number; amount: number; status: "pending" | "credited" | "reversed"; created_at: string; credited_at: string | null };
export type VWithdrawal = { id: string; request_number: string; volunteer_id: string; amount: number; method: "upi" | "bank"; payout_masked: string; status: "pending" | "processing" | "paid" | "rejected"; transaction_id: string; rejection_reason: string; escalated_at: string | null; escalation_note: string; requested_at: string; processed_at: string | null; paid_at: string | null };
export type VTicket = { id: string; ticket_number: string; volunteer_id: string; category: string; subject: string; status: "open" | "answered" | "resolved" | "reopened"; escalated: boolean; created_at: string; updated_at: string };
export type VTicketMessage = { id: string; ticket_id: string; author_role: "volunteer" | "employee" | "admin"; body: string; created_at: string };
export type VNotice = { id: string; volunteer_id: string; kind: "message" | "announcement" | "status"; title: string; body: string; read_at: string | null; created_at: string };
export type VSettings = { max_percent: number; min_withdrawal: number; payout_note: string };
export type VRate = { form_key: string; label: string; percent: number; flat_amount: number; active: boolean };

export type VolunteerBundle = {
  volunteers: Volunteer[]; referrals: VReferral[]; commissions: VCommission[]; withdrawals: VWithdrawal[]; tickets: VTicket[]; notices: VNotice[];
  settings: VSettings; rates: VRate[];
  /** Reward & recognition schemes; null when database/update-2026-11-17-sales-pay-volunteer-rewards.sql has not been run yet. */
  schemes: RewardScheme[] | null;
};
export const REWARDS_SETUP_MESSAGE = "Reward schemes and fixed incentives are not set up in the database yet. Run database/update-2026-11-17-sales-pay-volunteer-rewards.sql once in the Supabase SQL editor.";

const MISSING = /relation .* does not exist|Could not find the (table|function)|schema cache/i;
export const SETUP_MESSAGE = "The volunteer programme is not set up in the database yet. Run database/update-2026-11-15-volunteers.sql once in the Supabase SQL editor.";
function fail(error: { message: string } | null) { if (error) throw new Error(MISSING.test(error.message) ? SETUP_MESSAGE : error.message); }

export async function loadVolunteerBundle(): Promise<VolunteerBundle> {
  const [v, r, c, w, t, n, s, rt] = await Promise.all([
    vdb.from("volunteers").select("*").order("created_at", { ascending: false }).limit(2000),
    vdb.rpc("volunteer_referrals"),
    vdb.from("volunteer_commissions").select("*").order("created_at", { ascending: false }).limit(5000),
    vdb.from("volunteer_withdrawals").select("*").order("requested_at", { ascending: false }).limit(2000),
    vdb.from("volunteer_tickets").select("*").order("updated_at", { ascending: false }).limit(1000),
    vdb.from("volunteer_notices").select("*").order("created_at", { ascending: false }).limit(300),
    vdb.from("volunteer_settings").select("max_percent, min_withdrawal, payout_note").maybeSingle(),
    vdb.from("volunteer_form_commissions").select("form_key, label, percent, flat_amount, active").order("form_key"),
  ]);
  const sc = await vdb.from("volunteer_reward_schemes").select("*").order("ends_on", { ascending: false }).limit(300);
  if (sc.error && !MISSING.test(sc.error.message)) fail(sc.error);
  for (const res of [v, r, c, w, t, n, s, rt]) fail(res.error);
  const toNum = <T extends Record<string, unknown>>(rows: T[], keys: (keyof T)[]) => rows.map(row => { const o = { ...row }; for (const k of keys) if (o[k] != null) (o as Record<keyof T, unknown>)[k] = Number(o[k]); return o; });
  return {
    volunteers: toNum((v.data ?? []) as Volunteer[], ["commission_percent", "fixed_incentive", "revenue_target"]),
    referrals: toNum((r.data ?? []) as VReferral[], ["commission_amount"]),
    commissions: toNum((c.data ?? []) as VCommission[], ["fee_amount", "percent", "flat_amount", "amount"]),
    withdrawals: toNum((w.data ?? []) as VWithdrawal[], ["amount"]),
    tickets: (t.data ?? []) as VTicket[], notices: (n.data ?? []) as VNotice[],
    settings: s.data ? { max_percent: Number(s.data.max_percent), min_withdrawal: effectiveMinWithdrawal(Number(s.data.min_withdrawal)), payout_note: s.data.payout_note ?? "" } : { max_percent: MAX_COMMISSION_PERCENT, min_withdrawal: DEFAULT_MIN_WITHDRAWAL, payout_note: "" },
    rates: toNum((rt.data ?? []) as VRate[], ["percent", "flat_amount"]),
    schemes: sc.error ? null : toNum((sc.data ?? []) as RewardScheme[], ["reward_amount", "criteria_target"]),
  };
}

export async function loadTicketMessages(ticketId: string): Promise<VTicketMessage[]> {
  const { data, error } = await vdb.from("volunteer_ticket_messages").select("id, ticket_id, author_role, body, created_at").eq("ticket_id", ticketId).order("created_at");
  fail(error); return (data ?? []) as VTicketMessage[];
}

export async function rpc<T = unknown>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await vdb.rpc(name, args); fail(error); return data as T;
}

/** Private files: folder = volunteer id. KYC documents open only for the volunteer and admins. */
export async function uploadVolunteerFile(bucket: "volunteer-photos" | "volunteer-kyc", volunteerId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  const path = `${volunteerId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await vdb.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
  fail(error); return path;
}
export async function listVolunteerFiles(bucket: "volunteer-photos" | "volunteer-kyc", volunteerId: string) {
  const { data, error } = await vdb.storage.from(bucket).list(volunteerId, { limit: 50, sortBy: { column: "created_at", order: "desc" } });
  fail(error); return (data ?? []).map(f => ({ name: f.name, path: `${volunteerId}/${f.name}` }));
}
export async function openVolunteerFile(bucket: "volunteer-photos" | "volunteer-kyc", path: string) {
  const { data, error } = await vdb.storage.from(bucket).createSignedUrl(path, 120);
  fail(error); return data?.signedUrl ?? "";
}

export const isActiveEmployee = async (uid: string) => Boolean(await rpc<boolean>("is_active_employee", { _uid: uid }));
