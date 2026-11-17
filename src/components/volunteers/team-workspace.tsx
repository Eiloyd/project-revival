import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Award, Calculator, Share2, FileSpreadsheet, LayoutDashboard, MessageSquare, Settings2, UserPlus, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { provisionLogin } from "@/lib/accounts/logins.functions";
import { LoginSetupFields, loginDoneText } from "@/components/accounts/login-setup";
import type { LoginSetup } from "@/lib/accounts/logins";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listVolunteerFiles, loadVolunteerBundle, openVolunteerFile, rpc, uploadVolunteerFile, vdb, type Volunteer, type VolunteerBundle } from "@/lib/volunteers/data";
import { demoVolunteerBundle } from "@/lib/volunteers/demo";
import { applicationStage, commissionFor, countSince, MAX_COMMISSION_PERCENT, MIN_WITHDRAWAL_FLOOR, monthlyCounts, referralStats, stageLabels, targetPercent, walletSummary } from "@/lib/volunteers/rules";
import { fmtDate, kycTone, Panel, ReferralTools, rupees, StageBadge, Stat, StatusPill, withdrawalTone, downloadWorkbook } from "./shared";
import { TicketThread } from "./tickets";
import { IncentiveSetter, SchemeManager, SettleFixedIncentives } from "./rewards";

type Role = "employee" | "admin";
/** Sections of the employee volunteer workspace, used by the left menu on the My Volunteers page. */
export const teamSections = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "create", label: "Create volunteer", icon: UserPlus },
  { key: "list", label: "My volunteers", icon: Users },
  { key: "referrals", label: "Referral tracking", icon: Share2 },
  { key: "withdrawals", label: "Withdrawals", icon: Wallet },
  { key: "messages", label: "Messages & tickets", icon: MessageSquare },
  { key: "reports", label: "Performance & reports", icon: FileSpreadsheet },
  { key: "rewards", label: "Reward schemes", icon: Award },
  { key: "commission", label: "Commission calculator", icon: Calculator },
] as const;
const STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Other"];

function useAct(demo: boolean) {
  const qc = useQueryClient();
  return async (fn: () => Promise<unknown>, done: string) => {
    if (demo) { toast.info("Demo preview: nothing is saved."); return false; }
    try { await fn(); toast.success(done); await qc.invalidateQueries({ queryKey: ["volunteer-bundle"] }); return true; }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save."); return false; }
  };
}
const must = async (p: PromiseLike<{ error: { message: string } | null }>) => { const { error } = await p; if (error) throw new Error(error.message); };

/** Employee "My Volunteers" workspace; with role="admin" the same screens show every volunteer plus finance controls. */
export function TeamWorkspace({ role, demo, uid, tab, onTab }: { role: Role; demo: boolean; uid: string; tab?: string | undefined; onTab?: ((t: string) => void) | undefined }) {
  const bundle = useQuery({ queryKey: ["volunteer-bundle", demo ? "demo" : role], queryFn: async () => demo ? demoVolunteerBundle() : loadVolunteerBundle(), retry: false });
  if (bundle.isPending) return <p className="mt-6 text-sm text-muted-foreground">Loading volunteers…</p>;
  if (bundle.error) return <p role="alert" className="mt-6 rounded-xl border border-border bg-card p-5 text-sm">{bundle.error.message}</p>;
  return <Workspace data={bundle.data} role={role} demo={demo} uid={uid} tab={tab} onTab={onTab} />;
}

function Workspace({ data, role, demo, uid, tab, onTab }: { data: VolunteerBundle; role: Role; demo: boolean; uid: string; tab?: string | undefined; onTab?: ((t: string) => void) | undefined }) {
  const [profile, setProfile] = useState<Volunteer | null>(null);
  const act = useAct(demo);
  const name = (id: string) => data.volunteers.find(v => v.id === id)?.full_name ?? "—";
  const perVol = useMemo(() => data.volunteers.map(v => {
    const refs = data.referrals.filter(r => r.volunteer_id === v.id);
    const wallet = walletSummary(data.commissions.filter(c => c.volunteer_id === v.id), data.withdrawals.filter(w => w.volunteer_id === v.id));
    const st = referralStats(refs);
    const monthVerified = monthlyCounts(refs.filter(r => ["verified", "approved", "completed"].includes(applicationStage(r))).map(r => r.submitted_at), 1)[0]!.count;
    return { v, refs, wallet, st, month: monthlyCounts(refs.map(r => r.submitted_at), 1)[0]!.count, monthVerified, target: targetPercent(monthVerified, v.monthly_target) };
  }), [data]);
  const totals = referralStats(data.referrals);
  const earned = perVol.reduce((s, p) => s + p.wallet.lifetime, 0);
  const pendingWd = data.withdrawals.filter(w => w.status === "pending" || w.status === "processing");
  const created = data.volunteers.map(v => v.created_at);

  return <div className="space-y-5">
    {demo && <p className="rounded-lg border border-dashed border-border bg-surface p-3 text-xs text-muted-foreground">Demo preview with sample volunteers. Buttons do not save anything.</p>}
    <Tabs {...(tab !== undefined ? { value: tab, onValueChange: onTab ?? (() => undefined) } : { defaultValue: "overview" })}>
      {tab === undefined && <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted p-1">
        <TabsTrigger value="overview"><LayoutDashboard size={14} className="mr-1" />Overview</TabsTrigger>
        {role === "employee" && <TabsTrigger value="create"><UserPlus size={14} className="mr-1" />Create volunteer</TabsTrigger>}
        <TabsTrigger value="list"><Users size={14} className="mr-1" />{role === "admin" ? "All volunteers" : "My volunteers"}</TabsTrigger>
        <TabsTrigger value="referrals">Referral tracking</TabsTrigger>
        <TabsTrigger value="withdrawals"><Wallet size={14} className="mr-1" />Withdrawals{pendingWd.length ? ` (${pendingWd.length})` : ""}</TabsTrigger>
        <TabsTrigger value="messages"><MessageSquare size={14} className="mr-1" />Messages & tickets</TabsTrigger>
        <TabsTrigger value="reports"><FileSpreadsheet size={14} className="mr-1" />Performance & reports</TabsTrigger>
        <TabsTrigger value="rewards"><Award size={14} className="mr-1" />Reward schemes</TabsTrigger>
        <TabsTrigger value="commission">{role === "admin" ? <><Settings2 size={14} className="mr-1" />Commission settings</> : <><Calculator size={14} className="mr-1" />Commission calculator</>}</TabsTrigger>
      </TabsList>}

      <TabsContent value="overview" className="mt-4 space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total volunteers" value={data.volunteers.length} /><Stat label="Active volunteers" value={data.volunteers.filter(v => v.status === "active").length} />
          <Stat label="Forms by volunteers" value={totals.submitted} note={`${totals.referred} students referred`} /><Stat label="Verified forms" value={totals.verified} />
          <Stat label="Volunteer earnings" value={rupees(earned)} /><Stat label="Pending withdrawals" value={pendingWd.length} note={rupees(pendingWd.reduce((s, w) => s + w.amount, 0))} />
          <Stat label="New today" value={countSince(created, 1)} note={`${monthlyCounts(created, 1)[0]!.count} this month`} /><Stat label="Pending KYC" value={data.volunteers.filter(v => v.kyc_status === "pending" || v.kyc_status === "submitted").length} />
          <Stat label="Inactive volunteers" value={data.volunteers.filter(v => v.status === "inactive").length} /><Stat label="Pending applications" value={totals.pending} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Recent activities">{data.notices.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : <ul className="space-y-2 text-sm">{data.notices.slice(0, 10).map(n => <li key={n.id} className="flex justify-between gap-2"><span><span className="font-semibold text-foreground">{name(n.volunteer_id)}</span> <span className="text-muted-foreground">· {n.title}</span></span><span className="shrink-0 text-xs text-muted-foreground">{fmtDate(n.created_at)}</span></li>)}</ul>}</Panel>
          <Panel title="Alerts">{(() => { const inactive = perVol.filter(p => p.v.status === "active" && countSince(p.refs.map(r => r.submitted_at), 30) === 0); const low = perVol.filter(p => p.v.status === "active" && p.v.monthly_target > 0 && p.target < 30); const esc = data.withdrawals.filter(w => w.escalated_at && (w.status === "pending" || w.status === "processing"));
            return inactive.length + low.length + esc.length === 0 ? <p className="text-sm text-muted-foreground">Nothing needs attention.</p> : <ul className="space-y-2 text-sm">
              {inactive.map(p => <li key={`i${p.v.id}`} className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-destructive" />{p.v.full_name}: no referrals in 30 days</li>)}
              {low.map(p => <li key={`l${p.v.id}`} className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-destructive" />{p.v.full_name}: {p.target}% of monthly target</li>)}
              {esc.map(w => <li key={w.id} className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-destructive" />Withdrawal {w.request_number} escalated: {w.escalation_note || "no note"}</li>)}
            </ul>; })()}</Panel>
        </div>
      </TabsContent>

      {role === "employee" && <TabsContent value="create" className="mt-4"><CreateVolunteer demo={demo} uid={uid} /></TabsContent>}

      <TabsContent value="list" className="mt-4"><VolunteerList rows={perVol} role={role} onOpen={setProfile} demo={demo} /></TabsContent>

      <TabsContent value="referrals" className="mt-4"><Panel title={`Referred students (${data.referrals.length})`}>{data.referrals.length === 0 ? <p className="text-sm text-muted-foreground">No referrals yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-2">Application ID</th><th>Student</th><th>Volunteer</th><th>Referred on</th><th>Submitted</th><th>Status</th><th>Commission</th></tr></thead>
        <tbody>{data.referrals.slice(0, 500).map(r => <tr key={r.source_id} className="border-t border-border align-top"><td className="py-2 font-mono text-xs">{r.application_code || "—"}</td><td className="font-semibold">{r.student_name}</td><td className="text-xs">{name(r.volunteer_id)}</td><td className="text-xs">{fmtDate(r.submitted_at)}</td><td className="text-xs">{fmtDate(r.completed_at)}</td><td><StageBadge referral={r} />{r.status_reason && <p className="mt-1 max-w-48 text-xs text-muted-foreground">{r.status_reason}</p>}</td><td className="text-xs">{r.commission_amount != null ? `${rupees(r.commission_amount)} · ${r.commission_status}` : "Not eligible yet"}</td></tr>)}</tbody></table></div>}</Panel></TabsContent>

      <TabsContent value="withdrawals" className="mt-4"><WithdrawalsTab data={data} role={role} name={name} act={act} /></TabsContent>

      <TabsContent value="messages" className="mt-4 space-y-5">
        <BulkMessage volunteers={data.volunteers} act={act} />
        <Panel title="Volunteer tickets">{data.tickets.length === 0 ? <p className="text-sm text-muted-foreground">No tickets.</p> : <ul className="space-y-2">{data.tickets.map(t => <TicketThread key={t.id} ticket={t} viewer={role} demo={demo} who={name(t.volunteer_id)} />)}</ul>}</Panel>
      </TabsContent>

      <TabsContent value="reports" className="mt-4 space-y-5">
        <Panel title="Download reports" action={<Button size="sm" onClick={() => void downloadWorkbook(`riloyd-volunteers-${new Date().toISOString().slice(0, 10)}.xlsx`, [
          { title: "Volunteers", rows: perVol.map(p => ({ "Volunteer ID": p.v.volunteer_code, Name: p.v.full_name, Mobile: p.v.mobile, Email: p.v.email, State: p.v.state, District: p.v.district, Status: p.v.status, KYC: p.v.kyc_status, "Referral code": p.v.referral_code, Joined: fmtDate(p.v.created_at), Referred: p.st.referred, Verified: p.st.verified, Rejected: p.st.rejected, Earned: p.wallet.lifetime, Available: p.wallet.available, Withdrawn: p.wallet.withdrawn })) },
          { title: "Referrals", rows: data.referrals.map(r => ({ "Application ID": r.application_code, Student: r.student_name, Volunteer: name(r.volunteer_id), Form: r.form_key, Referred: fmtDate(r.submitted_at), Status: stageLabels[applicationStage(r)], Commission: r.commission_amount ?? "", "Commission status": r.commission_status ?? "" })) },
          { title: "Commission", rows: data.commissions.map(c => ({ Volunteer: name(c.volunteer_id), "Application ID": c.application_code, Fee: c.fee_amount, Percent: c.percent, Flat: c.flat_amount, Amount: c.amount, Status: c.status, Date: fmtDate(c.created_at) })) },
          { title: "Withdrawals", rows: data.withdrawals.map(w => ({ Request: w.request_number, Volunteer: name(w.volunteer_id), Amount: w.amount, To: w.payout_masked, Status: w.status, "Transaction ID": w.transaction_id, Reason: w.rejection_reason, Requested: fmtDate(w.requested_at), Paid: fmtDate(w.paid_at) })) },
        ])}><FileSpreadsheet size={14} />Excel (all sheets)</Button>}><p className="text-sm text-muted-foreground">One workbook with volunteers, referrals, commission and withdrawals. Bank numbers stay hidden.</p></Panel>
        <Panel title="This month's comparison"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-2">Volunteer</th><th>Status</th><th>Referred (month)</th><th>Verified (month)</th><th>Target</th><th>Conversion</th><th>Earned</th></tr></thead>
          <tbody>{[...perVol].sort((a, b) => b.monthVerified - a.monthVerified).map((p, i) => <tr key={p.v.id} className="border-t border-border"><td className="py-2 font-semibold">{i === 0 && p.monthVerified > 0 ? "🏆 " : ""}{p.v.full_name}</td><td><StatusPill tone={p.v.status === "active" ? "good" : "muted"}>{p.v.status}</StatusPill></td><td className="tabular-nums">{p.month}</td><td className="tabular-nums">{p.monthVerified}</td><td className="text-xs">{p.v.monthly_target ? `${p.target}% of ${p.v.monthly_target}` : "Not set"}</td><td className="tabular-nums">{p.st.conversion}%</td><td className="tabular-nums">{rupees(p.wallet.lifetime)}</td></tr>)}</tbody></table></div></Panel>
      </TabsContent>

      <TabsContent value="rewards" className="mt-4 space-y-5"><SchemeManager data={data} role={role} demo={demo} uid={uid} /></TabsContent>

      <TabsContent value="commission" className="mt-4 space-y-5">{role === "admin" && <><SettleFixedIncentives demo={demo} /><CommissionSettings data={data} act={act} /></>}<CommissionCalculator data={data} /></TabsContent>
    </Tabs>
    {profile && <ProfileDialog p={perVol.find(x => x.v.id === profile.id)!} role={role} demo={demo} onClose={() => setProfile(null)} data={data} />}
  </div>;
}

type PerVol = { v: Volunteer; refs: VolunteerBundle["referrals"]; wallet: ReturnType<typeof walletSummary>; st: ReturnType<typeof referralStats>; month: number; monthVerified: number; target: number };

const emptyNew = { full_name: "", mobile: "", email: "", date_of_birth: "", gender: "", address: "", state: "", district: "", qualification: "", monthly_target: "20", upi: "", holder: "", account: "", ifsc: "", bank: "" };
function CreateVolunteer({ demo, uid }: { demo: boolean; uid: string }) {
  const [f, setF] = useState(emptyNew);
  const [photo, setPhoto] = useState<File | null>(null);
  const [kyc, setKyc] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code: string; ref: string; email: string; login?: string } | null>(null);
  const [loginSetup, setLoginSetup] = useState<LoginSetup>({ verify: true });
  const provision = useServerFn(provisionLogin);
  const qc = useQueryClient();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.full_name.trim().length < 2) { toast.error("Enter the full name."); return; }
    if (!/^[6-9][0-9]{9}$/.test(f.mobile)) { toast.error("Enter a 10-digit Indian mobile number."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) { toast.error("Enter a valid email — the volunteer signs in with it."); return; }
    if (demo) { setDone({ code: "VOL-00099", ref: "VDEMO099", email: f.email }); toast.info("Demo preview: nothing was saved."); return; }
    setBusy(true);
    try {
      const { data, error } = await vdb.from("volunteers").insert({ employee_id: uid, full_name: f.full_name, mobile: f.mobile, email: f.email, date_of_birth: f.date_of_birth || null, gender: f.gender, address: f.address, state: f.state, district: f.district, qualification: f.qualification, monthly_target: Number(f.monthly_target) || 0, kyc_status: kyc ? "submitted" : "pending" }).select("id, volunteer_code, referral_code, email").single();
      if (error) throw new Error(/volunteers_email_key|duplicate/i.test(error.message) ? "A volunteer with this email already exists." : error.message);
      const warn: string[] = [];
      if (f.upi || f.account) await rpc("volunteer_set_payout", { _volunteer: data.id, _upi: f.upi, _holder: f.holder, _account: f.account, _ifsc: f.ifsc, _bank: f.bank }).catch((er: Error) => warn.push(`Payout details: ${er.message}`));
      if (photo) await uploadVolunteerFile("volunteer-photos", data.id, photo).then(path => must(vdb.from("volunteers").update({ photo_path: path }).eq("id", data.id))).catch((er: Error) => warn.push(`Photo: ${er.message}`));
      if (kyc) await uploadVolunteerFile("volunteer-kyc", data.id, kyc).catch((er: Error) => warn.push(`KYC document: ${er.message}`));
      // Login made by the creator: no approval needed, optional temporary password, email verified by the creator.
      let login: string | undefined;
      await provision({ data: { email: data.email, fullName: f.full_name, purpose: "volunteer", setup: loginSetup } }).then(r => { login = loginDoneText(r); }).catch((er: Error) => warn.push(`Login: ${er.message}`));
      setDone({ code: data.volunteer_code, ref: data.referral_code, email: data.email, ...(login ? { login } : {}) }); setF(emptyNew); setPhoto(null); setKyc(null); setLoginSetup({ verify: true });
      toast.success("Volunteer created."); warn.forEach(w => toast.error(w));
      await qc.invalidateQueries({ queryKey: ["volunteer-bundle"] });
    } catch (er) { toast.error(er instanceof Error ? er.message : "Could not create the volunteer."); } finally { setBusy(false); }
  };
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  if (done) return <Panel title="Volunteer created">
    <p className="text-sm text-foreground">Volunteer ID <strong>{done.code}</strong> · Referral code <strong>{done.ref}</strong></p>
    {done.login ? <p className="mt-2 text-sm text-muted-foreground">{done.login} They sign in at <code className="text-foreground">{origin}/volunteer</code> with <strong>{done.email}</strong>.</p>
      : <p className="mt-2 text-sm text-muted-foreground">Activation: ask the volunteer to open <code className="text-foreground">{origin}/volunteer</code> and sign in with <strong>{done.email}</strong> (email code). The account activates automatically.</p>}
    <div className="mt-4"><ReferralTools code={done.ref} /></div>
    <Button className="mt-4" variant="outline" onClick={() => setDone(null)}>Create another volunteer</Button>
  </Panel>;
  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <div className="grid gap-1.5"><Label htmlFor={`nv-${k}`}>{label}</Label><Input id={`nv-${k}`} value={f[k]} onChange={set(k)} {...props} /></div>;
  return <form onSubmit={submit} className="space-y-5">
    <Panel title="Personal details"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {field("full_name", "Full name *", { maxLength: 120 })}{field("mobile", "Mobile number *", { inputMode: "numeric", maxLength: 10 })}{field("email", "Email (login) *", { type: "email", maxLength: 254 })}
      {field("date_of_birth", "Date of birth", { type: "date" })}
      <div className="grid gap-1.5"><Label htmlFor="nv-gender">Gender</Label><select id="nv-gender" value={f.gender} onChange={set("gender")} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></div>
      {field("qualification", "Qualification", { maxLength: 120 })}
      <div className="grid gap-1.5 sm:col-span-2 lg:col-span-3"><Label htmlFor="nv-address">Address</Label><Textarea id="nv-address" value={f.address} onChange={set("address")} maxLength={400} rows={2} /></div>
      <div className="grid gap-1.5"><Label htmlFor="nv-state">State</Label><select id="nv-state" value={f.state} onChange={set("state")} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="">Choose</option>{STATES.map(s => <option key={s}>{s}</option>)}</select></div>
      {field("district", "District", { maxLength: 80 })}{field("monthly_target", "Monthly target (verified forms)", { inputMode: "numeric", maxLength: 5 })}
      <div className="grid gap-1.5"><Label htmlFor="nv-photo">Photo (JPG/PNG, up to 2 MB)</Label><Input id="nv-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setPhoto(e.target.files?.[0] ?? null)} /></div>
    </div></Panel>
    <Panel title="Payout & KYC (optional now)"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {field("upi", "UPI ID", { autoComplete: "off" })}{field("holder", "Account holder name", { autoComplete: "off" })}{field("account", "Account number", { inputMode: "numeric", autoComplete: "off" })}
      <div className="grid gap-1.5"><Label htmlFor="nv-ifsc">IFSC</Label><Input id="nv-ifsc" value={f.ifsc} onChange={e => setF({ ...f, ifsc: e.target.value.toUpperCase() })} autoComplete="off" /></div>{field("bank", "Bank name", { autoComplete: "off" })}
      <div className="grid gap-1.5"><Label htmlFor="nv-kyc">KYC document (Aadhaar/PAN, up to 5 MB)</Label><Input id="nv-kyc" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setKyc(e.target.files?.[0] ?? null)} /></div>
    </div><p className="mt-3 text-xs text-muted-foreground">You can add payout details only once, at registration. After that only the volunteer or an admin can change them, and you will see them only partly hidden. KYC documents are verified by an admin; you cannot open them after upload.</p></Panel>
    <LoginSetupFields value={loginSetup} onChange={setLoginSetup} idPrefix="nv-login" />
    <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create volunteer"}</Button>
    <p className="text-xs text-muted-foreground">Volunteer ID, referral code, referral link and QR code are created automatically. The volunteer stays permanently linked to you.</p>
  </form>;
}

function VolunteerList({ rows, role, onOpen, demo }: { rows: PerVol[]; role: Role; onOpen: (v: Volunteer) => void; demo: boolean }) {
  const [q, setQ] = useState(""); const [status, setStatus] = useState("all"); const [kyc, setKyc] = useState("all"); const [sort, setSort] = useState("new");
  const list = rows.filter(p => (status === "all" || p.v.status === status) && (kyc === "all" || p.v.kyc_status === kyc) && (!q || `${p.v.full_name} ${p.v.volunteer_code} ${p.v.mobile} ${p.v.email} ${p.v.district}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => sort === "name" ? a.v.full_name.localeCompare(b.v.full_name) : sort === "referrals" ? b.st.referred - a.st.referred : sort === "earnings" ? b.wallet.lifetime - a.wallet.lifetime : b.v.created_at.localeCompare(a.v.created_at));
  const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground";
  return <Panel title={`${list.length} volunteer${list.length === 1 ? "" : "s"}`} action={<Button size="sm" variant="outline" onClick={() => void downloadWorkbook("riloyd-volunteer-list.xlsx", [{ title: "Volunteers", rows: list.map(p => ({ "Volunteer ID": p.v.volunteer_code, Name: p.v.full_name, Mobile: p.v.mobile, Email: p.v.email, State: p.v.state, District: p.v.district, Status: p.v.status, KYC: p.v.kyc_status, Referred: p.st.referred, Verified: p.st.verified, Earned: p.wallet.lifetime, Balance: p.wallet.available })) }])}><FileSpreadsheet size={14} />Excel</Button>}>
    <div className="mb-3 flex flex-wrap gap-2"><Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, ID, mobile, district" className="max-w-xs" aria-label="Search volunteers" />
      <select value={status} onChange={e => setStatus(e.target.value)} className={sel} aria-label="Status"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      <select value={kyc} onChange={e => setKyc(e.target.value)} className={sel} aria-label="KYC"><option value="all">Any KYC</option><option value="pending">KYC pending</option><option value="submitted">KYC submitted</option><option value="verified">KYC verified</option><option value="rejected">KYC rejected</option></select>
      <select value={sort} onChange={e => setSort(e.target.value)} className={sel} aria-label="Sort"><option value="new">Newest first</option><option value="name">Name A–Z</option><option value="referrals">Most referrals</option><option value="earnings">Highest earnings</option></select></div>
    {list.length === 0 ? <p className="text-sm text-muted-foreground">{rows.length ? "No volunteer matches these filters." : role === "employee" ? "No volunteers yet. Use Create volunteer to add the first one." : "No volunteers yet."}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-2">Volunteer</th><th>Mobile</th><th>Place</th><th>Status</th><th>KYC</th><th>Referred / verified</th><th>Earned</th><th>Balance</th><th>Last login</th><th></th></tr></thead>
      <tbody>{list.map(p => <tr key={p.v.id} className="border-t border-border align-top"><td className="py-2"><span className="block font-semibold text-foreground">{p.v.full_name}</span><span className="font-mono text-xs text-muted-foreground">{p.v.volunteer_code}</span></td><td className="text-xs">{p.v.mobile}</td><td className="text-xs">{[p.v.district, p.v.state].filter(Boolean).join(", ") || "—"}</td><td><StatusPill tone={p.v.status === "active" ? "good" : "muted"}>{p.v.status}</StatusPill></td><td><StatusPill tone={kycTone(p.v.kyc_status)}>{p.v.kyc_status}</StatusPill></td><td className="tabular-nums">{p.st.referred} / {p.st.verified}</td><td className="tabular-nums">{rupees(p.wallet.lifetime)}</td><td className="tabular-nums">{rupees(p.wallet.available)}</td><td className="text-xs">{p.v.user_id ? fmtDate(p.v.last_login_at) : "Not activated"}</td><td><Button size="sm" variant="outline" onClick={() => onOpen(p.v)}>View</Button></td></tr>)}</tbody></table></div>}
    {demo && <p className="mt-2 text-xs text-muted-foreground">Sample volunteers only.</p>}
  </Panel>;
}

function ProfileDialog({ p, role, demo, onClose, data }: { p: PerVol; role: Role; demo: boolean; onClose: () => void; data: VolunteerBundle }) {
  const v = p.v; const act = useAct(demo);
  const qcv = useQueryClient(); const [verifyCode, setVerifyCode] = useState(""); const [listing, setListing] = useState(v.public_listing !== false);
  const hasCode = useQuery({ queryKey: ["volunteer-has-verify-code", v.id], enabled: !demo, queryFn: async () => { const { data, error } = await supabase.rpc("volunteer_has_verify_code", { _volunteer: v.id }); if (error) throw error; return data === true; } });
  const saveCode = async () => {
    const code = verifyCode.trim(); if (code.length < 6 || code.length > 64) { toast.error("Verification code must be 6–64 characters."); return; }
    const ok = await act(async () => { const { error } = await supabase.rpc("volunteer_set_verify_code", { _volunteer: v.id, _code: code }); if (error) throw new Error(error.message); }, "Verification code saved. Share it only with the volunteer.");
    if (ok) { setVerifyCode(""); void qcv.invalidateQueries({ queryKey: ["volunteer-has-verify-code", v.id] }); }
  };
  const saveListing = async (on: boolean) => { const ok = await act(async () => { const { error } = await supabase.from("volunteers").update({ public_listing: on }).eq("id", v.id); if (error) throw new Error(error.message); }, on ? "Shown on the website Team page." : "Hidden from the website Team page."); if (ok) setListing(on); };
  const [edit, setEdit] = useState({ full_name: v.full_name, mobile: v.mobile, email: v.email, address: v.address, state: v.state, district: v.district, qualification: v.qualification, monthly_target: String(v.monthly_target) });
  const [kycNote, setKycNote] = useState(v.kyc_note); const [pct, setPct] = useState(v.commission_percent == null ? "" : String(v.commission_percent));
  const kycFiles = useQuery({ queryKey: ["volunteer-kyc-files", v.id], enabled: role === "admin" && !demo, queryFn: () => listVolunteerFiles("volunteer-kyc", v.id) });
  const photo = useQuery({ queryKey: ["volunteer-photo", v.photo_path], enabled: Boolean(v.photo_path) && !demo, queryFn: () => openVolunteerFile("volunteer-photos", v.photo_path!) });
  const update = (patch: Record<string, unknown>, done: string) => act(() => must(vdb.from("volunteers").update(patch).eq("id", v.id)), done);
  const timeline = [
    { d: v.created_at, t: "Volunteer registered" }, ...(v.activated_at ? [{ d: v.activated_at, t: "Account activated" }] : []),
    ...data.notices.filter(n => n.volunteer_id === v.id).map(n => ({ d: n.created_at, t: n.title })),
  ].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 25);
  const wds = data.withdrawals.filter(w => w.volunteer_id === v.id);
  const set = (k: keyof typeof edit) => (e: React.ChangeEvent<HTMLInputElement>) => setEdit({ ...edit, [k]: e.target.value });
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
    <DialogContent className="dash-shell max-h-[90vh] max-w-4xl overflow-y-auto">
      <DialogHeader><DialogTitle>{v.full_name} · {v.volunteer_code}</DialogTitle></DialogHeader>
      <IncentiveSetter v={v} demo={demo} />
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
        <div className="grid gap-1.5"><Label htmlFor={`verify-code-${v.id}`}>Volunteer verification code (for the website Team page)</Label>
          <Input id={`verify-code-${v.id}`} type="password" autoComplete="new-password" maxLength={64} value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="6–64 characters" />
          <p className="text-xs text-muted-foreground">{demo ? "Demo preview" : hasCode.isPending ? "Checking…" : hasCode.data ? "A code is set — saving replaces it." : "No code set yet, so this volunteer cannot be verified."}</p></div>
        <Button type="button" size="sm" variant="outline" onClick={() => void saveCode()}>Set code</Button>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={listing} onChange={e => void saveListing(e.target.checked)} className="accent-primary" />Show on website</label>
      </div>
      <div className="grid gap-4 md:grid-cols-[140px_1fr]">
        <div>{photo.data ? <img src={photo.data} alt={v.full_name} loading="lazy" decoding="async" className="h-32 w-32 rounded-lg object-cover" /> : <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-muted text-3xl font-bold text-muted-foreground">{v.full_name.slice(0, 1)}</div>}</div>
        <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">{[["Referral code", v.referral_code], ["Joined", fmtDate(v.created_at)], ["Status", v.status], ["KYC", v.kyc_status], ["Last login", v.user_id ? fmtDate(v.last_login_at) : "Not activated"], ["Payout", v.payout_masked || "Not added"], ["Email", v.email], ["Mobile", v.mobile], ["Date of birth", fmtDate(v.date_of_birth)], ["Commission rate", v.commission_percent == null ? "Form default" : `${v.commission_percent}%`]].map(([k, val]) => <div key={k} className="flex gap-2"><dt className="w-32 shrink-0 text-muted-foreground">{k}</dt><dd className="break-all text-foreground">{val}</dd></div>)}</dl>
      </div>
      <div className="grid gap-3 sm:grid-cols-4"><Stat label="Referrals" value={p.st.referred} /><Stat label="Verified / rejected" value={`${p.st.verified} / ${p.st.rejected}`} /><Stat label="Earned" value={rupees(p.wallet.lifetime)} note={`${rupees(p.wallet.pending)} pending`} /><Stat label="Balance / withdrawn" value={rupees(p.wallet.available)} note={`${rupees(p.wallet.withdrawn)} withdrawn · ${rupees(p.wallet.reserved)} waiting`} /></div>
      <Panel title="Edit details"><form className="grid gap-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); void update({ ...edit, monthly_target: Number(edit.monthly_target) || 0 }, "Details saved."); }}>
        {(["full_name", "mobile", "email", "address", "state", "district", "qualification", "monthly_target"] as const).map(k => <div key={k} className="grid gap-1"><Label htmlFor={`ed-${k}`} className="text-xs capitalize">{k.replace("_", " ")}</Label><Input id={`ed-${k}`} value={edit[k]} onChange={set(k)} disabled={k === "email" && Boolean(v.user_id) && role !== "admin"} /></div>)}
        <div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" size="sm">Save details</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void update({ status: v.status === "active" ? "inactive" : "active" }, v.status === "active" ? "Volunteer deactivated." : "Volunteer activated.")}>{v.status === "active" ? "Deactivate" : "Activate"}</Button>
          <Button type="button" size="sm" variant="outline" disabled={!v.user_id} onClick={() => void act(async () => { const { error } = await supabase.auth.resetPasswordForEmail(v.email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) throw new Error(error.message); }, "Password reset email sent to the volunteer.")}>Reset login (email link)</Button></div>
      </form></Panel>
      {role === "admin" && <Panel title="Admin: KYC & commission">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2"><p className="text-sm">KYC documents: {demo ? "sample" : kycFiles.data?.length ?? "…"}</p>
            <ul className="space-y-1 text-sm">{(kycFiles.data ?? []).map(f => <li key={f.path}><button type="button" className="text-primary underline" onClick={() => void openVolunteerFile("volunteer-kyc", f.path).then(u => window.open(u, "_blank", "noopener"))}>{f.name}</button></li>)}</ul>
            <Label htmlFor="kyc-note" className="text-xs">Note to volunteer (required to reject)</Label><Input id="kyc-note" value={kycNote} maxLength={300} onChange={e => setKycNote(e.target.value)} />
            <div className="flex gap-2"><Button size="sm" onClick={() => void update({ kyc_status: "verified", kyc_note: kycNote }, "KYC verified.")}>Verify KYC</Button><Button size="sm" variant="outline" onClick={() => { if (!kycNote.trim()) { toast.error("Write the reason first."); return; } void update({ kyc_status: "rejected", kyc_note: kycNote }, "KYC rejected."); }}>Reject KYC</Button></div></div>
          <div className="space-y-2"><Label htmlFor="v-pct" className="text-xs">Personal commission % (blank = form default, max {MAX_COMMISSION_PERCENT}%)</Label><Input id="v-pct" inputMode="decimal" value={pct} onChange={e => setPct(e.target.value.replace(/[^0-9.]/g, ""))} />
            <Button size="sm" variant="outline" onClick={() => { const n = pct === "" ? null : Number(pct); if (n != null && (n < 0 || n > MAX_COMMISSION_PERCENT)) { toast.error(`Use 0 to ${MAX_COMMISSION_PERCENT}%.`); return; } void act(() => must(vdb.rpc("critical_change_propose", { _kind: "volunteer_rate", _target: v.id, _payload: { commission_percent: n }, _summary: `Commission rate for ${v.full_name}: ${n == null ? "form default" : `${n}%`}` })), "Sent for a second admin's approval (Admin → Change approvals)."); }}>Save rate</Button><p className="text-xs text-muted-foreground">Applies to new referred forms; existing commission rows keep their rate.</p></div>
        </div>
      </Panel>}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Applications">{p.refs.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : <ul className="max-h-64 space-y-1.5 overflow-y-auto text-sm">{p.refs.map(r => <li key={r.source_id} className="flex justify-between gap-2"><span>{r.student_name} <span className="font-mono text-xs text-muted-foreground">{r.application_code}</span></span><StageBadge referral={r} /></li>)}</ul>}</Panel>
        <Panel title="Withdrawals">{wds.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : <ul className="space-y-1.5 text-sm">{wds.map(w => <li key={w.id} className="flex justify-between gap-2"><span>{w.request_number} · {rupees(w.amount)} · {fmtDate(w.requested_at)}</span><StatusPill tone={withdrawalTone(w.status)}>{w.status}</StatusPill></li>)}</ul>}</Panel>
      </div>
      <Panel title="Activity timeline"><ol className="space-y-1.5 text-sm">{timeline.map((t, i) => <li key={i} className="flex justify-between gap-3"><span className="text-foreground">{t.t}</span><span className="shrink-0 text-xs text-muted-foreground">{fmtDate(t.d)}</span></li>)}</ol></Panel>
    </DialogContent>
  </Dialog>;
}

function WithdrawalsTab({ data, role, name, act }: { data: VolunteerBundle; role: Role; name: (id: string) => string; act: ReturnType<typeof useAct> }) {
  const [filter, setFilter] = useState("open");
  const rows = data.withdrawals.filter(w => filter === "all" || (filter === "open" ? w.status === "pending" || w.status === "processing" : w.status === filter));
  return <Panel title="Withdrawal requests" action={<select value={filter} onChange={e => setFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground" aria-label="Filter withdrawals"><option value="open">Waiting</option><option value="paid">Paid</option><option value="rejected">Rejected</option><option value="all">All</option></select>}>
    {role === "employee" && <p className="mb-3 text-xs text-muted-foreground">You can follow and escalate requests. Only the RILOYD finance admin can approve or pay them.</p>}
    {rows.length === 0 ? <p className="text-sm text-muted-foreground">No withdrawal requests here.</p> : <ul className="space-y-2">{rows.map(w => <WithdrawalRow key={w.id} w={w} role={role} who={name(w.volunteer_id)} act={act} available={walletSummary(data.commissions.filter(c => c.volunteer_id === w.volunteer_id), data.withdrawals.filter(x => x.volunteer_id === w.volunteer_id)).available} kyc={data.volunteers.find(v => v.id === w.volunteer_id)?.kyc_status ?? "pending"} />)}</ul>}
  </Panel>;
}

function WithdrawalRow({ w, role, who, act, available, kyc }: { w: VolunteerBundle["withdrawals"][number]; role: Role; who: string; act: ReturnType<typeof useAct>; available: number; kyc: string }) {
  const [note, setNote] = useState("");
  const open = w.status === "pending" || w.status === "processing";
  return <li className="rounded-lg border border-border p-3 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><span><span className="font-mono text-xs">{w.request_number}</span> · <strong>{who}</strong> · {rupees(w.amount)} → {w.payout_masked} · {fmtDate(w.requested_at)}</span><StatusPill tone={withdrawalTone(w.status)}>{w.status}</StatusPill></div>
    {w.escalated_at && <p className="mt-1 text-xs text-destructive">Escalated {fmtDate(w.escalated_at)}: {w.escalation_note || "no note"}</p>}
    {w.status === "paid" && <p className="mt-1 text-xs text-muted-foreground">Transaction ID {w.transaction_id} · paid {fmtDate(w.paid_at)}</p>}
    {w.status === "rejected" && <p className="mt-1 text-xs text-muted-foreground">Reason: {w.rejection_reason}</p>}
    {open && role === "admin" && <p className="mt-3 text-xs text-muted-foreground">KYC {kyc} · balance after this request {rupees(available)}. Accounts verifies this withdrawal and a different Finance person pays it with UTR and proof in the <a href="/finance#f-withdrawals" className="font-semibold text-primary underline-offset-4 hover:underline">Accounts &amp; Finance dashboard</a>.</p>}
    {open && role === "employee" && !w.escalated_at && <div className="mt-3 flex flex-wrap gap-2"><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Why escalate? (optional)" maxLength={300} className="max-w-sm" aria-label="Escalation note" /><Button size="sm" variant="outline" onClick={() => void act(() => rpc("volunteer_escalate_withdrawal", { _id: w.id, _note: note }), "Escalated to admin.")}>Escalate to admin</Button></div>}
  </li>;
}

function BulkMessage({ volunteers, act }: { volunteers: Volunteer[]; act: ReturnType<typeof useAct> }) {
  const [to, setTo] = useState<string[]>([]); const [kind, setKind] = useState<"message" | "announcement">("message"); const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const all = to.length === volunteers.length && volunteers.length > 0;
  return <Panel title="Send a message or announcement">
    <form className="grid gap-3" onSubmit={async e => { e.preventDefault(); if (!to.length || !title.trim()) { toast.error("Choose volunteers and write a title."); return; } if (await act(() => rpc("volunteer_send_message", { _volunteers: to, _kind: kind, _title: title, _body: body }), `Sent to ${to.length} volunteer(s).`)) { setTitle(""); setBody(""); } }}>
      <div className="flex flex-wrap items-center gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={all} onChange={e => setTo(e.target.checked ? volunteers.map(v => v.id) : [])} />All volunteers ({volunteers.length})</label><select value={kind} onChange={e => setKind(e.target.value as "message" | "announcement")} className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground" aria-label="Type"><option value="message">Message</option><option value="announcement">Announcement</option></select></div>
      {!all && <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">{volunteers.map(v => <label key={v.id} className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs"><input type="checkbox" checked={to.includes(v.id)} onChange={e => setTo(e.target.checked ? [...to, v.id] : to.filter(x => x !== v.id))} />{v.full_name}</label>)}</div>}
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" maxLength={150} aria-label="Title" />
      <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message" maxLength={2000} rows={3} aria-label="Message" />
      <Button type="submit" className="justify-self-start">Send</Button>
      <p className="text-xs text-muted-foreground">Messages appear in each volunteer's notification centre. WhatsApp, SMS and email sending are not connected yet.</p>
    </form>
  </Panel>;
}

function CommissionCalculator({ data }: { data: VolunteerBundle }) {
  const [fee, setFee] = useState("249"); const [pct, setPct] = useState(String(Math.min(data.settings.max_percent, MAX_COMMISSION_PERCENT))); const [flat, setFlat] = useState("0"); const [forms, setForms] = useState("10");
  const per = commissionFor(Number(fee) || 0, Number(pct) || 0, Number(flat) || 0, data.settings.max_percent);
  return <Panel title="Commission calculator">
    <div className="grid gap-3 sm:grid-cols-4">{([["Form fee (₹)", fee, setFee], [`Percent (max ${data.settings.max_percent}%)`, pct, setPct], ["Flat amount per form (₹)", flat, setFlat], ["Verified forms", forms, setForms]] as const).map(([l, val, setter]) => <div key={l} className="grid gap-1.5"><Label className="text-xs">{l}</Label><Input inputMode="decimal" value={val} onChange={e => setter(e.target.value.replace(/[^0-9.]/g, ""))} aria-label={l} /></div>)}</div>
    <p className="mt-3 text-sm text-foreground">Per form: <strong>{rupees(per)}</strong> · For {Number(forms) || 0} forms: <strong>{rupees(per * (Number(forms) || 0))}</strong></p>
    <p className="mt-1 text-xs text-muted-foreground">Percent above {data.settings.max_percent}% is not paid. Current rates: {data.rates.map(r => `${r.label} ${r.percent}%${r.flat_amount ? ` + ${rupees(r.flat_amount)}` : ""}${r.active ? "" : " (off)"}`).join(" · ")}. Only an admin can change rates.</p>
  </Panel>;
}

function CommissionSettings({ data, act }: { data: VolunteerBundle; act: ReturnType<typeof useAct> }) {
  const [s, setS] = useState({ max: String(data.settings.max_percent), min: String(data.settings.min_withdrawal), note: data.settings.payout_note });
  const [rates, setRates] = useState(data.rates.map(r => ({ ...r, percent: String(r.percent), flat_amount: String(r.flat_amount) })));
  return <div className="grid gap-5 lg:grid-cols-2">
    <Panel title="Programme settings"><form className="grid gap-3" onSubmit={e => { e.preventDefault(); const max = Number(s.max), min = Number(s.min); if (!(max >= 0 && max <= MAX_COMMISSION_PERCENT)) { toast.error(`Maximum must be 0 to ${MAX_COMMISSION_PERCENT}%.`); return; } if (!(min >= MIN_WITHDRAWAL_FLOOR)) { toast.error(`Minimum withdrawal cannot be below ₹${MIN_WITHDRAWAL_FLOOR}.`); return; } void act(() => must(vdb.rpc("critical_change_propose", { _kind: "payout_rules", _target: "true", _payload: { max_percent: max, min_withdrawal: Math.round(min), payout_note: s.note }, _summary: `Payout rules: max ${max}%, minimum ₹${Math.round(min)}` })), "Sent for a second admin's approval (Admin → Change approvals)."); }}>
      <div className="grid gap-1.5"><Label htmlFor="cs-max">Maximum commission % (up to {MAX_COMMISSION_PERCENT})</Label><Input id="cs-max" inputMode="decimal" value={s.max} onChange={e => setS({ ...s, max: e.target.value })} /></div>
      <div className="grid gap-1.5"><Label htmlFor="cs-min">Minimum withdrawal (₹) — never below {rupees(MIN_WITHDRAWAL_FLOOR)}</Label><Input id="cs-min" inputMode="numeric" min={MIN_WITHDRAWAL_FLOOR} value={s.min} onChange={e => setS({ ...s, min: e.target.value })} /></div>
      <div className="grid gap-1.5"><Label htmlFor="cs-note">Note shown on the wallet (e.g. payout time)</Label><Input id="cs-note" value={s.note} maxLength={300} onChange={e => setS({ ...s, note: e.target.value })} /></div>
      <Button type="submit" className="justify-self-start">Propose change</Button><p className="text-xs text-muted-foreground">Payout rules change only after a second admin approves.</p>
    </form></Panel>
    <Panel title="Commission per form"><div className="space-y-3">{rates.map((r, i) => <form key={r.form_key} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_90px_110px_auto]" onSubmit={e => { e.preventDefault(); const pct = Number(r.percent), flat = Number(r.flat_amount); if (!(pct >= 0 && pct <= MAX_COMMISSION_PERCENT) || !(flat >= 0)) { toast.error(`Percent 0–${MAX_COMMISSION_PERCENT}, flat amount 0 or more.`); return; } void act(() => must(vdb.rpc("critical_change_propose", { _kind: "form_commission", _target: r.form_key, _payload: { percent: pct, flat_amount: flat, active: r.active }, _summary: `${r.label}: ${pct}% + ₹${flat}${r.active ? "" : " (off)"}` })), `${r.label}: sent for a second admin's approval.`); }}>
      <div><p className="text-sm font-semibold text-foreground">{r.label}</p><label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={r.active} onChange={e => setRates(rates.map((x, j) => j === i ? { ...x, active: e.target.checked } : x))} />Pay commission for this form</label></div>
      <div className="grid gap-1"><Label className="text-xs">Percent</Label><Input inputMode="decimal" value={r.percent} onChange={e => setRates(rates.map((x, j) => j === i ? { ...x, percent: e.target.value } : x))} aria-label={`${r.label} percent`} /></div>
      <div className="grid gap-1"><Label className="text-xs">Flat ₹</Label><Input inputMode="decimal" value={r.flat_amount} onChange={e => setRates(rates.map((x, j) => j === i ? { ...x, flat_amount: e.target.value } : x))} aria-label={`${r.label} flat amount`} /></div>
      <Button type="submit" size="sm" variant="outline" className="self-end">Save</Button>
    </form>)}</div><p className="mt-2 text-xs text-muted-foreground">Rate changes need a second admin's approval (Admin → Change approvals) and apply to forms referred after that.</p></Panel>
  </div>;
}
