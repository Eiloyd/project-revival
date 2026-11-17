import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, ClipboardList } from 'lucide-react';
import { MyRequests } from '@/components/work/requests';
import { MeetingsPanel } from '@/components/work/meetings';
import { VolunteerAvailability } from '@/components/work/volunteer-work';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, FileText, HelpCircle, LayoutDashboard, LogOut, Settings, Trophy, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listVolunteerFiles, loadVolunteerBundle, rpc, uploadVolunteerFile, type VolunteerBundle, type Volunteer } from "@/lib/volunteers/data";
import { demoVolunteerBundle } from "@/lib/volunteers/demo";
import { applicationStage, badgeLevels, countSince, earnedBadges, monthlyCounts, referralStats, stageLabels, ticketCategories, walletSummary, withdrawalProblem, type Stage } from "@/lib/volunteers/rules";
import { paymentStatusLabels } from "@/lib/education-support/rules";
import { Bars, downloadCertificate, downloadIdCard, downloadReceipt, downloadStatement, fmtDate, kycTone, Panel, ReferralTools, rupees, StageBadge, Stat, StatusPill, withdrawalTone } from "./shared";
import { TicketThread } from "./tickets";
import { TargetGauge } from "../dashboard/target-gauge";

type Props = { demo: boolean; onSignOut: () => void; tab?: string | undefined; onTab?: ((t: string) => void) | undefined };
/** Sections of the volunteer dashboard, used by the left menu on the Volunteer page. */
export const volunteerSections = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "students", label: "My students", icon: Users },
  { key: "wallet", label: "Earnings & wallet", icon: Wallet },
  { key: "performance", label: "Performance", icon: Trophy },
  { key: "availability", label: "Availability", icon: CalendarCheck },
  { key: "requests", label: "Absence & requests", icon: ClipboardList },
  { key: "meetings", label: "Meetings & feedback", icon: CalendarDays },
  { key: "notices", label: "Notifications", icon: Bell },
  { key: "help", label: "Help", icon: HelpCircle },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

export function VolunteerDashboard({ demo, onSignOut, tab, onTab }: Props) {
  const bundle = useQuery({ queryKey: ["volunteer-bundle", demo ? "demo" : "self"], queryFn: async () => demo ? demoVolunteerBundle() : loadVolunteerBundle(), retry: false });
  useEffect(() => { if (!demo) void rpc("volunteer_touch_login").catch(() => undefined); }, [demo]);
  if (bundle.isPending) return <p className="mt-8 text-sm text-muted-foreground">Loading your dashboard…</p>;
  if (bundle.error) return <p role="alert" className="mt-8 rounded-xl border border-border bg-card p-5 text-sm">{bundle.error.message}</p>;
  const me = bundle.data.volunteers[0];
  if (!me) return <p className="mt-8 rounded-xl border border-border bg-card p-5 text-sm">Your volunteer record could not be found. Please contact the employee who registered you.</p>;
  return <Dashboard data={bundle.data} me={me} demo={demo} onSignOut={onSignOut} tab={tab} onTab={onTab} />;
}

function Dashboard({ data, me, demo, onSignOut, tab, onTab }: { data: VolunteerBundle; me: Volunteer; demo: boolean; onSignOut: () => void; tab?: string | undefined; onTab?: ((t: string) => void) | undefined }) {
  const qc = useQueryClient();
  const refs = data.referrals.filter(r => r.volunteer_id === me.id);
  const commissions = data.commissions.filter(c => c.volunteer_id === me.id);
  const withdrawals = data.withdrawals.filter(w => w.volunteer_id === me.id);
  const stats = referralStats(refs);
  const wallet = walletSummary(commissions, withdrawals);
  const monthly = monthlyCounts(refs.map(r => r.submitted_at));
  const unread = data.notices.filter(n => !n.read_at).length;
  const refresh = () => qc.invalidateQueries({ queryKey: ["volunteer-bundle"] });
  const guard = async (fn: () => Promise<unknown>, done: string) => {
    if (demo) { toast.info("Demo preview: nothing is saved."); return false; }
    try { await fn(); toast.success(done); await refresh(); return true; } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save."); return false; }
  };

  return <div className={`${tab === undefined ? "mt-6 " : ""}space-y-6`}>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div><p className="text-xs font-semibold text-muted-foreground">Welcome</p><h2 className="text-xl font-bold text-foreground">{me.full_name}</h2><p className="text-xs text-muted-foreground">{me.volunteer_code} · Referral code {me.referral_code} · KYC <StatusPill tone={kycTone(me.kyc_status)}>{me.kyc_status}</StatusPill></p></div>
      <div className="flex flex-wrap gap-2">{demo && <StatusPill tone="warn">Demo · sample data</StatusPill>}<Button variant="outline" size="sm" onClick={onSignOut}><LogOut size={14} />{demo ? "Exit demo" : "Sign out"}</Button></div>
    </div>
    <Tabs {...(tab !== undefined ? { value: tab, onValueChange: onTab ?? (() => undefined) } : { defaultValue: "overview" })}>
      {tab === undefined && <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted p-1">
        <TabsTrigger value="overview"><LayoutDashboard size={14} className="mr-1" />Overview</TabsTrigger>
        <TabsTrigger value="students"><Users size={14} className="mr-1" />My students</TabsTrigger>
        <TabsTrigger value="wallet"><Wallet size={14} className="mr-1" />Earnings & wallet</TabsTrigger>
        <TabsTrigger value="performance"><Trophy size={14} className="mr-1" />Performance</TabsTrigger>
        <TabsTrigger value="notices"><Bell size={14} className="mr-1" />Notifications{unread ? ` (${unread})` : ""}</TabsTrigger>
        <TabsTrigger value="help"><HelpCircle size={14} className="mr-1" />Help</TabsTrigger>
        <TabsTrigger value="documents"><FileText size={14} className="mr-1" />Documents</TabsTrigger>
        <TabsTrigger value="settings"><Settings size={14} className="mr-1" />Settings</TabsTrigger>
      </TabsList>}

      <TabsContent value="overview" className="mt-4 space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Total students referred" value={stats.referred} />
          <Stat label="Total forms submitted" value={stats.submitted} note={`${stats.incomplete} incomplete`} />
          <Stat label="Verified applications" value={stats.verified} />
          <Stat label="Pending verification" value={stats.pending} />
          <Stat label="Rejected applications" value={stats.rejected} />
          <Stat label="Total commission earned" value={rupees(wallet.lifetime)} note={`${rupees(wallet.pending)} pending`} />
          <Stat label="Available withdrawal balance" value={rupees(wallet.available)} />
          <Stat label="Pending withdrawal amount" value={rupees(wallet.reserved)} />
          <Stat label="Total amount withdrawn" value={rupees(wallet.withdrawn)} />
          <Stat label="This month" value={monthly.at(-1)?.count ?? 0} note="students referred" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Panel title="Share your referral link"><ReferralTools code={me.referral_code} /></Panel>
          <Panel title="Monthly performance"><Bars data={monthly} /></Panel>
        </div>
      </TabsContent>

      <TabsContent value="students" className="mt-4"><StudentsTab refs={refs} code={me.referral_code} /></TabsContent>

      <TabsContent value="wallet" className="mt-4 space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total lifetime earnings" value={rupees(wallet.lifetime)} />
          <Stat label="This month's earnings" value={rupees(wallet.thisMonth)} />
          <Stat label="Pending commission" value={rupees(wallet.pending)} note="Credited after payment is confirmed and the form is verified" />
          <Stat label="Approved commission" value={rupees(wallet.credited)} />
          <Stat label="Available balance" value={rupees(wallet.available)} note={`Minimum withdrawal ${rupees(data.settings.min_withdrawal)}`} />
          <Stat label="Reserved for withdrawal" value={rupees(wallet.reserved)} />
          <Stat label="Total withdrawn" value={rupees(wallet.withdrawn)} />
          <Stat label="Last withdrawal" value={wallet.lastWithdrawal ? rupees(wallet.lastWithdrawal.amount) : "—"} note={wallet.lastWithdrawal ? fmtDate(wallet.lastWithdrawal.date) : "No payout yet"} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <WithdrawForm me={me} available={wallet.available} minimum={data.settings.min_withdrawal} note={data.settings.payout_note} onSubmit={(amount, method) => guard(() => rpc("volunteer_request_withdrawal", { _amount: amount, _method: method }), "Withdrawal requested.")} />
          <PayoutForm me={me} onSave={(d) => guard(() => rpc("volunteer_set_payout", { _volunteer: me.id, _upi: d.upi, _holder: d.holder, _account: d.account, _ifsc: d.ifsc, _bank: d.bank }), "Payout details saved.")} />
        </div>
        <KycCard me={me} demo={demo} onDone={refresh} />
        <Panel title="Withdrawal requests & transactions">
          {withdrawals.length === 0 ? <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-2">Request</th><th>Date</th><th>Amount</th><th>To</th><th>Status</th><th>Details</th></tr></thead>
            <tbody>{withdrawals.map(w => <tr key={w.id} className="border-t border-border align-top"><td className="py-2 font-mono text-xs">{w.request_number}</td><td>{fmtDate(w.requested_at)}</td><td className="tabular-nums">{rupees(w.amount)}</td><td className="text-xs">{w.payout_masked}</td><td><StatusPill tone={withdrawalTone(w.status)}>{w.status}</StatusPill></td>
              <td className="text-xs">{w.status === "paid" ? <Button size="sm" variant="outline" onClick={() => void downloadReceipt(me, w)}>Receipt</Button> : w.status === "rejected" ? `Reason: ${w.rejection_reason}` : "Waiting for finance team"}</td></tr>)}</tbody></table></div>}
        </Panel>
        <Panel title="Commission history" action={<Button size="sm" variant="outline" onClick={() => void downloadStatement(me, commissions.map(c => ({ date: fmtDate(c.credited_at ?? c.created_at), text: `${c.application_code || "Form"} · ${c.form_key === "education" ? "Scholarship" : "Young Innovators"}`, amount: rupees(c.amount), status: c.status })))}>Download statement</Button>}>
          {commissions.length === 0 ? <p className="text-sm text-muted-foreground">No commission yet. It appears when a referred student submits a form.</p> : <ul className="divide-y divide-border text-sm">{commissions.slice(0, 50).map(c => <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><span className="font-mono text-xs">{c.application_code || "—"}</span> <span className="text-muted-foreground">· {fmtDate(c.created_at)} · {c.percent}% of {rupees(c.fee_amount)}{c.flat_amount ? ` + ${rupees(c.flat_amount)}` : ""}</span></span><span className="flex items-center gap-2"><span className="tabular-nums font-semibold">{rupees(c.amount)}</span><StatusPill tone={c.status === "credited" ? "good" : c.status === "reversed" ? "bad" : "warn"}>{c.status}</StatusPill></span></li>)}</ul>}
        </Panel>
      </TabsContent>

      <TabsContent value="availability" className="mt-4">{demo ? <p className="text-sm text-muted-foreground">Demo preview: availability is saved only for real accounts.</p> : <VolunteerAvailability volunteerId={me.id} />}</TabsContent>
      <TabsContent value="requests" className="mt-4">{demo || !me.user_id ? <p className="text-sm text-muted-foreground">Demo preview: requests are sent only from real accounts.</p> : <MyRequests uid={me.user_id} audience="volunteer" title="Absence, commission disputes, profile / KYC updates and meetings" presetType="volunteer_absence" />}</TabsContent>
      <TabsContent value="meetings" className="mt-4">{demo || !me.user_id ? <p className="text-sm text-muted-foreground">Demo preview.</p> : <MeetingsPanel uid={me.user_id} canSchedule={false} />}</TabsContent>
      <TabsContent value="performance" className="mt-4"><PerformanceTab refs={refs} target={me.monthly_target} /></TabsContent>

      <TabsContent value="notices" className="mt-4">
        <Panel title="Notification centre" action={unread > 0 && <Button size="sm" variant="outline" onClick={() => void guard(() => rpc("volunteer_mark_notices_read"), "Marked as read.")}>Mark all read</Button>}>
          {data.notices.length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p> : <ul className="space-y-2">{data.notices.map(n => <li key={n.id} className={`rounded-lg border p-3 text-sm ${n.read_at ? "border-border" : "border-primary/50 bg-accent/40"}`}><p className="font-semibold text-foreground">{n.title}</p>{n.body && <p className="mt-0.5 text-muted-foreground">{n.body}</p>}<p className="mt-1 text-[11px] text-muted-foreground">{n.kind} · {fmtDate(n.created_at)}</p></li>)}</ul>}
        </Panel>
      </TabsContent>

      <TabsContent value="help" className="mt-4 space-y-5"><HelpTab data={data} demo={demo} onOpen={(c, s, b) => guard(() => rpc("volunteer_open_ticket", { _category: c, _subject: s, _body: b }), "Ticket raised. We will reply here.")} /></TabsContent>

      <TabsContent value="documents" className="mt-4"><DocumentsTab me={me} refsTotal={refs.length} paid={withdrawals.filter(w => w.status === "paid")} minimum={data.settings.min_withdrawal} refsThisMonth={refs.filter(r => monthlyCounts([r.submitted_at], 1)[0]!.count > 0)} /></TabsContent>

      <TabsContent value="settings" className="mt-4"><SettingsTab me={me} demo={demo} onDeactivate={() => guard(() => rpc("volunteer_open_ticket", { _category: "general", _subject: "Account deactivation request", _body: "Please deactivate my volunteer account." }), "Deactivation request sent to the team.")} /></TabsContent>
    </Tabs>
  </div>;
}

function StudentsTab({ refs, code }: { refs: VolunteerBundle["referrals"]; code: string }) {
  const [filter, setFilter] = useState<Stage | "all">("all");
  const [q, setQ] = useState("");
  const rows = refs.filter(r => (filter === "all" || applicationStage(r) === filter) && (!q || `${r.student_name} ${r.application_code}`.toLowerCase().includes(q.toLowerCase())));
  const reminder = (name: string) => `https://wa.me/?text=${encodeURIComponent(`Namaste ${name}, aapka RILOYD Student Scholarship & Sponsorship form abhi adhoora hai. Ise yahan poora karein: ${typeof window === "undefined" ? "" : window.location.origin}/education-support?ref=${code}`)}`;
  return <Panel title={`Registered students (${refs.length})`}>
    <div className="mb-3 flex flex-wrap gap-2"><Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or application ID" className="max-w-xs" aria-label="Search students" />
      <select value={filter} onChange={e => setFilter(e.target.value as Stage | "all")} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground" aria-label="Filter by status"><option value="all">All statuses</option>{(Object.keys(stageLabels) as Stage[]).map(s => <option key={s} value={s}>{stageLabels[s]}</option>)}</select></div>
    {rows.length === 0 ? <p className="text-sm text-muted-foreground">No students yet. Share your referral link to get started.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-2">Application ID</th><th>Student</th><th>Form</th><th>Registered</th><th>Status</th><th>Payment</th><th>Commission</th><th></th></tr></thead>
      <tbody>{rows.map(r => <tr key={r.source_id} className="border-t border-border align-top"><td className="py-2 font-mono text-xs">{r.application_code || "—"}</td><td className="font-semibold">{r.student_name}</td><td className="text-xs">{r.form_key === "education" ? "Scholarship" : "Young Innovators"}</td><td className="text-xs">{fmtDate(r.submitted_at)}</td>
        <td><StageBadge referral={r} />{r.status_reason && <p className="mt-1 max-w-48 text-xs text-muted-foreground">{r.status_reason}</p>}</td>
        <td className="text-xs">{r.form_key === "education" ? paymentStatusLabels[r.payment_status as keyof typeof paymentStatusLabels] ?? r.payment_status : "—"}</td>
        <td className="text-xs">{r.commission_amount != null ? `${rupees(r.commission_amount)} · ${r.commission_status}` : "Not yet eligible"}</td>
        <td>{applicationStage(r) === "incomplete" && <Button asChild size="sm" variant="outline"><a href={reminder(r.student_name.split(" ")[0] ?? "")} target="_blank" rel="noreferrer">Send reminder</a></Button>}</td></tr>)}</tbody></table></div>}
    <p className="mt-3 text-xs text-muted-foreground">Contact, bank and Aadhaar details of students are hidden to protect their privacy. Reminders open WhatsApp with a ready message; choose the student's chat yourself.</p>
  </Panel>;
}

function WithdrawForm({ me, available, minimum, note, onSubmit }: { me: Volunteer; available: number; minimum: number; note: string; onSubmit: (amount: number, method: "upi" | "bank") => Promise<boolean> }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "bank">(me.payout_method ?? "upi");
  const [busy, setBusy] = useState(false);
  const hasMethod = method === "upi" ? me.payout_masked.includes("UPI") : me.payout_masked.includes("Bank");
  const problem = amount ? withdrawalProblem(Number(amount), available, minimum, me.kyc_status, hasMethod) : null;
  return <Panel title="Withdraw money">
    <form className="grid gap-3" onSubmit={async e => { e.preventDefault(); const p = withdrawalProblem(Number(amount), available, minimum, me.kyc_status, hasMethod); if (p) { toast.error(p); return; } setBusy(true); if (await onSubmit(Number(amount), method)) setAmount(""); setBusy(false); }}>
      <p className="text-sm text-muted-foreground">Available: <strong className="text-foreground">{rupees(available)}</strong> · Minimum: {rupees(minimum)} · KYC: {me.kyc_status}</p>
      <div className="grid gap-1.5"><Label htmlFor="wd-amount">Amount (₹)</Label><Input id="wd-amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder={String(minimum)} /></div>
      <fieldset className="flex gap-4 text-sm"><legend className="mb-1 text-sm font-medium">Pay to</legend><label className="flex items-center gap-2"><input type="radio" checked={method === "upi"} onChange={() => setMethod("upi")} />UPI</label><label className="flex items-center gap-2"><input type="radio" checked={method === "bank"} onChange={() => setMethod("bank")} />Bank account</label></fieldset>
      {problem && <p role="alert" className="text-xs text-destructive">{problem}</p>}
      <Button type="submit" disabled={busy || !amount || Boolean(problem)}>{busy ? "Sending…" : "Request withdrawal"}</Button>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </form>
  </Panel>;
}

function PayoutForm({ me, onSave }: { me: Volunteer; onSave: (d: { upi: string; holder: string; account: string; ifsc: string; bank: string }) => Promise<boolean> }) {
  const [d, setD] = useState({ upi: "", holder: "", account: "", ifsc: "", bank: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: e.target.value });
  return <Panel title="Add / update bank or UPI details">
    <form className="grid gap-3" onSubmit={async e => { e.preventDefault(); setBusy(true); if (await onSave(d)) setD({ upi: "", holder: "", account: "", ifsc: "", bank: "" }); setBusy(false); }}>
      <p className="text-sm text-muted-foreground">Saved now: <strong className="text-foreground">{me.payout_masked || "nothing yet"}</strong>. For safety, saved numbers are always shown partly hidden.</p>
      <div className="grid gap-1.5"><Label htmlFor="p-upi">UPI ID</Label><Input id="p-upi" value={d.upi} onChange={set("upi")} placeholder="name@bank" autoComplete="off" /></div>
      <div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-1.5"><Label htmlFor="p-holder">Account holder name</Label><Input id="p-holder" value={d.holder} onChange={set("holder")} autoComplete="off" /></div><div className="grid gap-1.5"><Label htmlFor="p-acc">Account number</Label><Input id="p-acc" inputMode="numeric" value={d.account} onChange={set("account")} autoComplete="off" /></div>
        <div className="grid gap-1.5"><Label htmlFor="p-ifsc">IFSC</Label><Input id="p-ifsc" value={d.ifsc} onChange={e => setD({ ...d, ifsc: e.target.value.toUpperCase() })} autoComplete="off" /></div><div className="grid gap-1.5"><Label htmlFor="p-bank">Bank name</Label><Input id="p-bank" value={d.bank} onChange={set("bank")} autoComplete="off" /></div></div>
      <Button type="submit" variant="outline" disabled={busy || (!d.upi && !d.account)}>{busy ? "Saving…" : "Save payout details"}</Button>
    </form>
  </Panel>;
}

function KycCard({ me, demo, onDone }: { me: Volunteer; demo: boolean; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const files = useQuery({ queryKey: ["volunteer-kyc-files", me.id], enabled: !demo, queryFn: () => listVolunteerFiles("volunteer-kyc", me.id) });
  const upload = async (file: File | undefined) => {
    if (!file) return; if (demo) { toast.info("Demo preview: nothing is uploaded."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("The file must be 5 MB or smaller."); return; }
    setBusy(true);
    try { await uploadVolunteerFile("volunteer-kyc", me.id, file); await rpc("volunteer_submit_kyc"); toast.success("KYC document uploaded. An admin will verify it."); await files.refetch(); onDone(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed."); } finally { setBusy(false); }
  };
  return <Panel title="KYC status">
    <div className="flex flex-wrap items-center gap-3 text-sm"><StatusPill tone={kycTone(me.kyc_status)}>{me.kyc_status}</StatusPill>{me.kyc_note && <span className="text-muted-foreground">{me.kyc_note}</span>}<span className="text-muted-foreground">{files.data ? `${files.data.length} document(s) uploaded` : ""}</span></div>
    {me.kyc_status !== "verified" && <div className="mt-3 grid max-w-md gap-1.5"><Label htmlFor="kyc-file">Upload Aadhaar / PAN (photo or PDF, up to 5 MB)</Label><Input id="kyc-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy} onChange={e => void upload(e.target.files?.[0])} /><p className="text-xs text-muted-foreground">Only you and RILOYD admins can open these documents. Withdrawals need verified KYC.</p></div>}
  </Panel>;
}

function PerformanceTab({ refs, target }: { refs: VolunteerBundle["referrals"]; target: number }) {
  const dates = refs.map(r => r.submitted_at);
  const verifiedDates = refs.filter(r => ["verified", "approved", "completed"].includes(applicationStage(r))).map(r => r.submitted_at);
  const stats = referralStats(refs);
  const month = monthlyCounts(verifiedDates, 1)[0]!.count;
  const badges = earnedBadges(stats.verified);
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Today" value={countSince(dates, 1)} note="referrals" /><Stat label="This week" value={countSince(dates, 7)} note="referrals" /><Stat label="Last 30 days" value={countSince(dates, 30)} note="referrals" /><Stat label="Conversion rate" value={`${stats.conversion}%`} note="referred → verified" />
    </div>
    <div className="max-w-sm"><TargetGauge title="Monthly target · verified forms" achieved={month} target={target} format={n => `${n} form${n === 1 ? "" : "s"}`} caption={target > 0 ? undefined : "Your employee has not set a monthly target yet."} /></div>
    <Panel title="Badges">
      <ul className="flex flex-wrap gap-2">{badgeLevels.map(b => <li key={b.name} className={`rounded-full border px-3 py-1 text-xs font-semibold ${badges.includes(b.name) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{b.name} · {b.min}+ verified</li>)}</ul>
    </Panel>
    <Panel title="Referrals per month"><Bars data={monthlyCounts(dates)} /></Panel>
  </div>;
}

const faqs = [
  ["When is commission credited?", "When the referred student's payment is confirmed and the form is verified. Until then it shows as pending."],
  ["How much commission do I get?", "Up to 10% of the form fee, plus any fixed amount RILOYD sets for that form. The exact amount is shown against each student."],
  ["What is the minimum withdrawal?", "The minimum is shown on the wallet page. Your KYC must be verified and your UPI or bank details added."],
  ["How long does a withdrawal take?", "The finance team processes requests in order. You get a notification when it is paid, with the transaction ID and a receipt."],
  ["Can I see students' phone numbers or documents?", "No. To protect students, only their name, application ID and status are shown."],
] as const;

function HelpTab({ data, demo, onOpen }: { data: VolunteerBundle; demo: boolean; onOpen: (category: string, subject: string, body: string) => Promise<boolean> }) {
  const [cat, setCat] = useState<string>(ticketCategories[0].key);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  return <>
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Raise a ticket">
        <form className="grid gap-3" onSubmit={async e => { e.preventDefault(); if (subject.trim().length < 3 || !body.trim()) { toast.error("Enter a subject and describe the problem."); return; } setBusy(true); if (await onOpen(cat, subject, body)) { setSubject(""); setBody(""); } setBusy(false); }}>
          <div className="grid gap-1.5"><Label htmlFor="t-cat">Category</Label><select id="t-cat" value={cat} onChange={e => setCat(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">{ticketCategories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
          <div className="grid gap-1.5"><Label htmlFor="t-sub">Subject</Label><Input id="t-sub" value={subject} maxLength={150} onChange={e => setSubject(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label htmlFor="t-body">Describe the problem</Label><Textarea id="t-body" value={body} maxLength={3000} rows={4} onChange={e => setBody(e.target.value)} /></div>
          <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Raise ticket"}</Button>
        </form>
      </Panel>
      <Panel title="Frequently asked questions"><dl className="space-y-3 text-sm">{faqs.map(([q, a]) => <div key={q}><dt className="font-semibold text-foreground">{q}</dt><dd className="mt-0.5 text-muted-foreground">{a}</dd></div>)}</dl></Panel>
    </div>
    <Panel title="My tickets">{data.tickets.length === 0 ? <p className="text-sm text-muted-foreground">No tickets yet.</p> : <ul className="space-y-2">{data.tickets.map(t => <TicketThread key={t.id} ticket={t} viewer="volunteer" demo={demo} />)}</ul>}</Panel>
  </>;
}

function DocumentsTab({ me, paid, minimum, refsThisMonth, refsTotal }: { me: Volunteer; paid: VolunteerBundle["withdrawals"]; minimum: number; refsThisMonth: VolunteerBundle["referrals"]; refsTotal: number }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return <div className="grid gap-5 lg:grid-cols-2">
    <Panel title="Download">
      <ul className="space-y-2 text-sm">
        <li className="flex items-center justify-between gap-2"><span>Volunteer ID card (with QR code)</span><Button size="sm" variant="outline" onClick={() => void downloadIdCard(me, origin)}>Download</Button></li>
        <li className="flex items-center justify-between gap-2"><span>Volunteer experience certificate{me.status !== "active" || me.kyc_status !== "verified" ? <span className="block text-xs text-muted-foreground">Available once your account is active and KYC is verified.</span> : null}</span><Button size="sm" variant="outline" disabled={me.status !== "active" || me.kyc_status !== "verified"} onClick={() => void downloadCertificate(me, origin, refsTotal)}>Download</Button></li>
        <li className="flex items-center justify-between gap-2"><span>Monthly performance report</span><Button size="sm" variant="outline" onClick={() => void downloadStatement(me, refsThisMonth.map(r => ({ date: fmtDate(r.submitted_at), text: `${r.application_code || "—"} · ${r.student_name}`, amount: r.commission_amount != null ? rupees(r.commission_amount) : "—", status: stageLabels[applicationStage(r)] })), "Monthly report")}>Download</Button></li>
        {paid.map(w => <li key={w.id} className="flex items-center justify-between gap-2"><span>Withdrawal receipt {w.request_number}</span><Button size="sm" variant="outline" onClick={() => void downloadReceipt(me, w)}>Download</Button></li>)}
      </ul>
    </Panel>
    <Panel title="Commission policy & guidelines">
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
        <li>Commission is at most 10% of the form fee, plus any fixed amount set by RILOYD for that form.</li>
        <li>Commission is credited only after the student's payment is confirmed and the form is verified. Failed payments are not paid.</li>
        <li>Minimum withdrawal is {rupees(minimum)}. Verified KYC and your own UPI or bank account are required.</li>
        <li>Never collect money, OTPs, Aadhaar or bank details from students. Students pay only on the official RILOYD form.</li>
        <li>Never promise selection or a scholarship amount. Misleading students leads to deactivation and loss of unpaid commission.</li>
      </ul>
      <div className="mt-3 flex flex-wrap gap-3 text-sm"><a className="font-semibold text-primary underline" href="/education-terms">Terms & Conditions</a><a className="font-semibold text-primary underline" href="/education-privacy">Privacy policy</a></div>
    </Panel>
  </div>;
}

function SettingsTab({ me, demo, onDeactivate }: { me: Volunteer; demo: boolean; onDeactivate: () => Promise<boolean> }) {
  const [current, setCurrent] = useState(""); const [next, setNext] = useState(""); const [busy, setBusy] = useState(false);
  const change = async () => {
    if (demo) { toast.info("Demo preview: nothing is saved."); return; }
    if (next.length < 8) { toast.error("The new password must be at least 8 characters."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: next, current_password: current } as unknown as { password: string });
    setBusy(false); if (error) toast.error(error.message); else { toast.success("Password changed."); setCurrent(""); setNext(""); }
  };
  const reset = async () => { if (demo) { toast.info("Demo preview: no email is sent."); return; } const { error } = await supabase.auth.resetPasswordForEmail(me.email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) toast.error(error.message); else toast.success("Password reset email sent."); };
  const logoutAll = async () => { if (demo) { toast.info("Demo preview."); return; } await supabase.auth.signOut({ scope: "global" }); };
  const facts = useMemo(() => [["Volunteer ID", me.volunteer_code], ["Email", me.email], ["Mobile", me.mobile], ["Activated", fmtDate(me.activated_at)], ["Last login", fmtDate(me.last_login_at)]], [me]);
  return <div className="grid gap-5 lg:grid-cols-2">
    <Panel title="Change password"><form className="grid gap-3" onSubmit={e => { e.preventDefault(); void change(); }}>
      <div className="grid gap-1.5"><Label htmlFor="s-cur">Current password</Label><Input id="s-cur" type="password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" /></div>
      <div className="grid gap-1.5"><Label htmlFor="s-new">New password</Label><Input id="s-new" type="password" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" /></div>
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>Change password</Button><Button type="button" variant="outline" onClick={() => void reset()}>Forgot password? Email me a link</Button></div>
    </form></Panel>
    <Panel title="Account & security">
      <dl className="space-y-1.5 text-sm">{facts.map(([k, v]) => <div key={k} className="grid grid-cols-[120px_1fr]"><dt className="text-muted-foreground">{k}</dt><dd className="break-all text-foreground">{v}</dd></div>)}</dl>
      <p className="mt-3 text-xs text-muted-foreground">Your profile details are kept by your employee. Ask them to correct any mistake. Your bank and KYC documents are visible only to you and RILOYD admins.</p>
      <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void logoutAll()}>Sign out on all devices</Button><Button variant="outline" size="sm" onClick={() => { if (confirm("Send a request to deactivate your volunteer account?")) void onDeactivate(); }}>Request account deactivation</Button></div>
    </Panel>
  </div>;
}
