// Reward & recognition schemes, fixed incentives and the monthly fixed-incentive settlement.
// Writes go through database rules (database/update-2026-11-17-sales-pay-volunteer-rewards.sql):
// the scheme table's RLS + guard trigger decide who may launch what, and incentives change only
// through the volunteer_set_incentive / volunteer_settle_fixed_incentives functions.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Award, CalendarRange, Pause, Play, Square, Target, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REWARDS_SETUP_MESSAGE, rpc, vdb, type Volunteer, type VolunteerBundle } from "@/lib/volunteers/data";
import { fixedIncentiveProgress, incentiveProblem, rewardTypeLabels, schemeCriteriaLabels, schemeProgress, schemeState, volunteerRevenue, type IncentiveMode, type RewardScheme, type SchemeCriteria } from "@/lib/volunteers/rules";
import { fmtDate, Panel, rupees, Stat, StatusPill } from "./shared";

const istToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const monthStart = (d: string) => `${d.slice(0, 7)}-01`;
const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground";
const fmtProgress = (c: SchemeCriteria, n: number) => c === "revenue" ? rupees(n) : `${n} form${n === 1 ? "" : "s"}`;
const audienceLabel = { all: "All volunteers", team: "Volunteers of the BDM's team", own: "The BDE's own volunteers" } as const;

function Meter({ percent }: { percent: number }) {
  return <div className="reward-meter" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} /></div>;
}

export function SchemeBanner({ s, progress, today, footer }: { s: RewardScheme; progress?: ReturnType<typeof schemeProgress> | undefined; today: string; footer?: React.ReactNode }) {
  const state = schemeState(s, today);
  return <article className="reward-banner p-4" data-tone={s.banner_tone}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Trophy size={14} />{rewardTypeLabels[s.reward_type] ?? "Reward"}{s.badge && <span className="reward-badge"><Award size={12} />{s.badge}</span>}</p>
        <h4 className="mt-1 text-lg font-bold text-foreground">{s.title}</h4>
        <p className="text-sm font-semibold text-foreground">{s.reward}{s.reward_amount > 0 && !s.reward.includes("₹") ? ` · ${rupees(s.reward_amount)}` : ""}</p></div>
      <StatusPill tone={state === "live" ? "good" : state === "upcoming" ? "warn" : "muted"}>{state === "live" ? "Live" : state === "upcoming" ? "Starts soon" : state === "paused" ? "Paused" : "Finished"}</StatusPill>
    </div>
    {s.description && <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>}
    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Target size={12} />Goal: {fmtProgress(s.criteria, s.criteria_target)} ({schemeCriteriaLabels[s.criteria]})</span><span className="flex items-center gap-1"><CalendarRange size={12} />{fmtDate(s.starts_on)} – {fmtDate(s.ends_on)}</span></p>
    {progress && <div className="mt-3 space-y-1.5"><Meter percent={progress.percent} /><p className="text-sm text-foreground">{progress.qualified ? <strong>🎉 You qualified! The team will contact you about your reward.</strong> : <>{fmtProgress(s.criteria, progress.done)} of {fmtProgress(s.criteria, progress.target)} · <strong>{fmtProgress(s.criteria, progress.remaining)}</strong> to go</>}</p></div>}
    {footer}
  </article>;
}

/** Volunteer dashboard: their live schemes with progress and, if set, their fixed incentive target. */
export function VolunteerRewards({ data, me, compact = false }: { data: VolunteerBundle; me: Volunteer; compact?: boolean }) {
  const today = istToday();
  const refs = data.referrals.filter(r => r.volunteer_id === me.id);
  const rows = data.commissions.filter(c => c.volunteer_id === me.id);
  const schemes = (data.schemes ?? []).filter(s => ["live", "upcoming"].includes(schemeState(s, today)));
  const shown = compact ? schemes.filter(s => schemeState(s, today) === "live").slice(0, 2) : schemes;
  const fixed = me.incentive_mode === "fixed" ? fixedIncentiveProgress(volunteerRevenue(rows, monthStart(today), today), me.revenue_target ?? 0, me.fixed_incentive ?? 0) : null;
  if (compact && !shown.length && !fixed) return null;
  return <div className="space-y-4">
    {fixed && <Panel title="My fixed incentive this month">
      <div className="grid gap-3 sm:grid-cols-3"><Stat label="Fixed incentive" value={rupees(fixed.fixed)} note="Paid when the target is reached" /><Stat label="Revenue this month" value={rupees(fixed.revenue)} note={`Target ${rupees(fixed.target)}`} /><Stat label="Still needed" value={rupees(fixed.remaining)} note={fixed.earned ? "Target reached 🎉" : `${fixed.percent}% done`} /></div>
      <div className="mt-3"><Meter percent={fixed.percent} /></div>
      <p className="mt-2 text-xs text-muted-foreground">Revenue = fees of your referred forms that are verified and paid this month. While a fixed incentive is on, per-form commission is 0%. The incentive is credited to your wallet after the month ends.</p>
    </Panel>}
    {data.schemes === null ? (!compact && <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{REWARDS_SETUP_MESSAGE}</p>)
      : shown.length ? <section className="space-y-3">{compact && <h3 className="text-sm font-bold text-foreground">Reward & recognition schemes</h3>}<div className="grid gap-3 lg:grid-cols-2">{shown.map(s => <SchemeBanner key={s.id} s={s} today={today} progress={schemeProgress(s, refs, rows)} />)}</div></section>
      : !compact && <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">No reward scheme is running for you right now. Your employee or RILOYD will announce the next one here.</p>}
  </div>;
}

const emptyScheme = { title: "", description: "", reward_type: "cash" as keyof typeof rewardTypeLabels, reward: "", reward_amount: "", criteria: "verified_forms" as SchemeCriteria, criteria_target: "", starts_on: "", ends_on: "", badge: "", banner_tone: "gold" as RewardScheme["banner_tone"] };

/** Employee / Admin: launch and manage schemes, and see who is qualifying. */
export function SchemeManager({ data, role, demo, uid }: { data: VolunteerBundle; role: "employee" | "admin"; demo: boolean; uid: string }) {
  const qc = useQueryClient(); const today = istToday();
  const [f, setF] = useState({ ...emptyScheme, starts_on: today, ends_on: today.slice(0, 8) + String(new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate()).padStart(2, "0") });
  const [busy, setBusy] = useState(false); const [open, setOpen] = useState<string | null>(null);
  if (data.schemes === null) return <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{REWARDS_SETUP_MESSAGE}</p>;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(f.criteria_target), amount = Number(f.reward_amount || 0);
    if (f.title.trim().length < 3) { toast.error("Give the scheme a title (3+ characters)."); return; }
    if (!f.reward.trim()) { toast.error("Describe the reward or prize."); return; }
    if (!(target > 0)) { toast.error("Enter the qualification target."); return; }
    if (!f.starts_on || !f.ends_on || f.ends_on < f.starts_on) { toast.error("The end date must be on or after the start date."); return; }
    if (demo) { toast.info("Demo preview: nothing is saved."); return; }
    setBusy(true);
    const { error } = await vdb.from("volunteer_reward_schemes").insert({ title: f.title.trim(), description: f.description.trim(), reward_type: f.reward_type, reward: f.reward.trim(), reward_amount: amount, criteria: f.criteria, criteria_target: target, starts_on: f.starts_on, ends_on: f.ends_on, badge: f.badge.trim(), banner_tone: f.banner_tone, created_by: uid });
    setBusy(false);
    if (error) { toast.error(/row-level security|Only Admin, BDM or BDE/i.test(error.message) ? "Only Admin, BDM or BDE accounts can launch reward schemes." : error.message); return; }
    toast.success("Scheme launched. Your volunteers were notified."); setF({ ...emptyScheme, starts_on: f.starts_on, ends_on: f.ends_on });
    await qc.invalidateQueries({ queryKey: ["volunteer-bundle"] });
  };
  const setStatus = async (s: RewardScheme, status: RewardScheme["status"]) => {
    if (demo) { toast.info("Demo preview: nothing is saved."); return; }
    const { error } = await vdb.from("volunteer_reward_schemes").update({ status }).eq("id", s.id);
    if (error) toast.error(error.message); else { toast.success(status === "active" ? "Scheme resumed." : status === "paused" ? "Scheme paused." : "Scheme ended."); await qc.invalidateQueries({ queryKey: ["volunteer-bundle"] }); }
  };
  const standings = (s: RewardScheme) => data.volunteers.filter(v => v.status === "active").map(v => ({ v, p: schemeProgress(s, data.referrals.filter(r => r.volunteer_id === v.id), data.commissions.filter(c => c.volunteer_id === v.id)) })).sort((a, b) => b.p.done - a.p.done);
  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <div className="grid gap-1.5"><Label htmlFor={`rs-${k}`}>{label}</Label><Input id={`rs-${k}`} value={f[k]} onChange={set(k)} {...props} /></div>;
  return <div className="space-y-5">
    <Panel title="Launch a reward scheme">
      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={save}>
        {field("title", "Scheme title *", { maxLength: 120, placeholder: "e.g. Diwali Dhamaka — 20 verified forms" })}
        <div className="grid gap-1.5"><Label htmlFor="rs-type">Reward type</Label><select id="rs-type" className={sel} value={f.reward_type} onChange={set("reward_type")}>{Object.entries(rewardTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        {field("reward", "Reward / prize *", { maxLength: 200, placeholder: "e.g. ₹2,000 bonus + certificate" })}
        {field("reward_amount", "Reward value (₹, optional)", { inputMode: "decimal" })}
        <div className="grid gap-1.5"><Label htmlFor="rs-crit">Qualify by</Label><select id="rs-crit" className={sel} value={f.criteria} onChange={set("criteria")}>{Object.entries(schemeCriteriaLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        {field("criteria_target", f.criteria === "revenue" ? "Revenue to reach (₹) *" : "Number of forms *", { inputMode: "decimal" })}
        {field("starts_on", "Starts on *", { type: "date" })}{field("ends_on", "Ends on *", { type: "date" })}
        {field("badge", "Badge text (optional)", { maxLength: 40, placeholder: "e.g. Star Volunteer" })}
        <div className="grid gap-1.5"><Label htmlFor="rs-tone">Banner colour</Label><select id="rs-tone" className={sel} value={f.banner_tone} onChange={set("banner_tone")}><option value="gold">Gold</option><option value="green">Green</option><option value="blue">Blue</option><option value="red">Red</option></select></div>
        <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="rs-desc">Description & rules</Label><Textarea id="rs-desc" rows={2} maxLength={1000} value={f.description} onChange={set("description")} placeholder="Who can qualify, how winners are chosen, when the reward is given." /></div>
        <div className="flex items-end"><Button type="submit" disabled={busy}>{busy ? "Launching…" : "Launch scheme"}</Button></div>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">{role === "admin" ? "As admin your scheme reaches all volunteers." : "A BDE's scheme reaches their own volunteers; a BDM's reaches every volunteer of their team."} Progress counts only inside the scheme dates: verified forms and forms submitted by referral date, revenue by the date the form was verified and paid.</p>
    </Panel>
    <Panel title={`Schemes (${data.schemes.length})`}>
      {!data.schemes.length ? <p className="text-sm text-muted-foreground">No schemes yet.</p> : <div className="grid gap-3 lg:grid-cols-2">{data.schemes.map(s => {
        const st = standings(s); const qualified = st.filter(x => x.p.qualified).length; const mine = s.created_by === uid || role === "admin";
        return <SchemeBanner key={s.id} s={s} today={today} footer={<div className="mt-3 space-y-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">{audienceLabel[s.audience]} · {qualified} of {st.length} of your volunteers qualified{s.created_by === uid ? " · created by you" : ""}</p>
          <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? "Hide standings" : "Standings"}</Button>
            {mine && s.status === "active" && <Button size="sm" variant="outline" onClick={() => void setStatus(s, "paused")}><Pause size={14} />Pause</Button>}
            {mine && s.status === "paused" && <Button size="sm" variant="outline" onClick={() => void setStatus(s, "active")}><Play size={14} />Resume</Button>}
            {mine && s.status !== "ended" && <Button size="sm" variant="outline" onClick={() => { if (confirm(`End "${s.title}" now?`)) void setStatus(s, "ended"); }}><Square size={14} />End</Button>}</div>
          {open === s.id && <ol className="max-h-56 space-y-1 overflow-y-auto text-sm">{st.map((x, i) => <li key={x.v.id} className="flex items-center justify-between gap-2"><span>{i + 1}. {x.v.full_name}</span><span className="tabular-nums text-muted-foreground">{fmtProgress(s.criteria, x.p.done)} · {x.p.percent}%{x.p.qualified ? " ✓" : ""}</span></li>)}</ol>}
        </div>} />;
      })}</div>}
    </Panel>
  </div>;
}

/** Profile dialog: commission (default) or a fixed incentive that always comes with a revenue target. */
export function IncentiveSetter({ v, demo }: { v: Volunteer; demo: boolean }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<IncentiveMode>(v.incentive_mode ?? "commission");
  const [fixed, setFixed] = useState(v.fixed_incentive ? String(v.fixed_incentive) : ""); const [target, setTarget] = useState(v.revenue_target ? String(v.revenue_target) : "");
  const [busy, setBusy] = useState(false);
  if (v.incentive_mode === undefined && !demo) return <Panel title="Incentive type"><p className="text-sm text-muted-foreground">{REWARDS_SETUP_MESSAGE}</p></Panel>;
  const save = async () => {
    const p = incentiveProblem(mode, Number(fixed), Number(target)); if (p) { toast.error(p); return; }
    if (demo) { toast.info("Demo preview: nothing is saved."); return; }
    setBusy(true);
    try { await rpc("volunteer_set_incentive", { _volunteer: v.id, _mode: mode, _fixed: Number(fixed) || 0, _target: Number(target) || 0 }); toast.success(mode === "fixed" ? "Fixed incentive and revenue target saved." : "Back to commission per form."); await qc.invalidateQueries({ queryKey: ["volunteer-bundle"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save."); } finally { setBusy(false); }
  };
  return <Panel title="Incentive type">
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
      <div className="grid gap-1.5"><Label htmlFor={`im-${v.id}`} className="text-xs">Incentive</Label><select id={`im-${v.id}`} className={sel} value={mode} onChange={e => setMode(e.target.value as IncentiveMode)}><option value="commission">Commission per form (no target)</option><option value="fixed">Fixed incentive + revenue target</option></select></div>
      <div className="grid gap-1.5"><Label htmlFor={`if-${v.id}`} className="text-xs">Fixed incentive (₹/month)</Label><Input id={`if-${v.id}`} inputMode="decimal" disabled={mode !== "fixed"} value={fixed} onChange={e => setFixed(e.target.value.replace(/[^0-9.]/g, ""))} /></div>
      <div className="grid gap-1.5"><Label htmlFor={`it-${v.id}`} className="text-xs">Mandatory revenue target (₹/month)</Label><Input id={`it-${v.id}`} inputMode="decimal" disabled={mode !== "fixed"} value={target} onChange={e => setTarget(e.target.value.replace(/[^0-9.]/g, ""))} /></div>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => void save()}>Save</Button>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">Only an admin, or the BDM over this volunteer's employee, can set a fixed incentive. It is credited after the month ends if the revenue target is reached; per-form commission is 0% while it is on.</p>
  </Panel>;
}

/** Admin: credit last month's fixed incentives to every volunteer who reached their target. */
export function SettleFixedIncentives({ demo }: { demo: boolean }) {
  const qc = useQueryClient(); const today = istToday();
  const last = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 2, 1); const lastMonth = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(lastMonth); const [busy, setBusy] = useState(false);
  const run = async () => {
    if (demo) { toast.info("Demo preview: nothing is saved."); return; }
    setBusy(true);
    try { const n = await rpc<number>("volunteer_settle_fixed_incentives", { _month: `${month}-01` }); toast.success(n ? `${n} fixed incentive${n === 1 ? "" : "s"} credited to wallets.` : "No new fixed incentive to credit for that month."); await qc.invalidateQueries({ queryKey: ["volunteer-bundle"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not credit."); } finally { setBusy(false); }
  };
  return <Panel title="Fixed incentives">
    <div className="flex flex-wrap items-end gap-3"><div className="grid gap-1.5"><Label htmlFor="settle-month" className="text-xs">Finished month</Label><Input id="settle-month" type="month" max={lastMonth} value={month} onChange={e => setMonth(e.target.value || lastMonth)} /></div><Button size="sm" disabled={busy} onClick={() => void run()}>{busy ? "Crediting…" : "Credit fixed incentives"}</Button></div>
    <p className="mt-2 text-xs text-muted-foreground">Credits each fixed-incentive volunteer who reached their revenue target in that month, once only. Running it again never pays twice.</p>
  </Panel>;
}
