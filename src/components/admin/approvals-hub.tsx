import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Item = { key: string; label: string; hint: string; href: string; count: number | null };

async function count(table: string, col: string, values: string[]) {
  const { count: c, error } = await (supabase.from(table as never) as any).select("id", { count: "exact", head: true }).in(col, values);
  return error ? null : (c ?? 0);
}

/** One screen showing everything waiting for a decision, with a link to where it is decided. */
export function ApprovalsHub() {
  const q = useQuery({
    queryKey: ["admin-approvals-hub"],
    queryFn: async (): Promise<{ items: Item[]; byType: Record<string, number> }> => {
      const [req, crit, exits, slips, refunds, wd, jobs, payouts, assess, list] = await Promise.all([
        count("requests", "status", ["pending"]),
        count("critical_changes", "status", ["pending"]),
        count("hr_exits", "status", ["initiated", "notice", "clearance"]),
        count("hr_payslips", "status", ["draft", "approved"]),
        count("customer_tickets", "finance_status", ["sent", "approved"]),
        count("volunteer_withdrawals", "status", ["pending", "processing"]),
        count("hr_job_openings", "status", ["pending_approval"]),
        count("hr_referral_payouts", "status", ["due", "approved"]),
        count("hr_assessments", "status", ["submitted"]),
        supabase.from("requests").select("type").eq("status", "pending").limit(1000),
      ]);
      const byType: Record<string, number> = {};
      for (const r of (list.data ?? []) as { type: string }[]) byType[r.type] = (byType[r.type] ?? 0) + 1;
      return {
        byType,
        items: [
          { key: "req", label: "Requests (leave, advance, expense, others)", hint: "Waiting for a manager, HR or admin", href: "#all-requests", count: req },
          { key: "crit", label: "Settings & payout changes", hint: "Need a second admin", href: "#approvals", count: crit },
          { key: "exit", label: "Resignations / Full & Final", hint: "Exit not settled yet", href: "/hr", count: exits },
          { key: "slip", label: "Payslips", hint: "Draft (HR approval) or approved (Accounts to pay)", href: "/finance", count: slips },
          { key: "ref", label: "Customer refunds", hint: "Sent to Finance or approved, not paid", href: "/finance", count: refunds },
          { key: "wd", label: "Volunteer withdrawals", hint: "Pending or processing", href: "#volunteers", count: wd },
          { key: "jobs", label: "Jobs waiting to be published", hint: "Sent by HR for approval", href: "#recruitment", count: jobs },
          { key: "payouts", label: "Referral commissions", hint: "Due or approved, not paid", href: "#recruitment", count: payouts },
          { key: "assess", label: "Candidate assessments", hint: "Submitted, waiting for evaluation", href: "#recruitment", count: assess },
        ],
      };
    },
  });
  if (q.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (q.error) return <p role="alert" className="text-sm text-destructive">Could not load approvals.</p>;
  const total = q.data.items.reduce((s, i) => s + (i.count ?? 0), 0);
  return <div className="space-y-6">
    <p className="text-sm text-muted-foreground"><span className="text-2xl font-bold text-foreground tabular-nums">{total}</span> {total === 1 ? 'item is' : 'items are'} waiting for a decision.</p>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {q.data.items.map(i => <a key={i.key} href={i.href} className="dash-card flex items-center justify-between gap-3 p-4 hover:border-primary/50">
        <span><span className="block text-sm font-bold">{i.label}</span><span className="block text-xs text-muted-foreground">{i.hint}</span></span>
        <span className="text-2xl font-bold tabular-nums">{i.count ?? "—"}</span>
      </a>)}
    </div>
    {Object.keys(q.data.byType).length > 0 && <div className="dash-card p-4"><h3 className="text-sm font-bold">Pending requests by type</h3>
      <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">{Object.entries(q.data.byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => <li key={t} className="flex justify-between border-b border-border py-1"><span className="capitalize">{t.replace(/_/g, " ")}</span><span className="tabular-nums font-semibold">{n}</span></li>)}</ul></div>}
  </div>;
}

const roles = ["Admin", "HR", "BDM", "BDE", "Finance", "Support", "Research", "Employee"] as const;
type Level = "Full" | "Edit" | "Edit*" | "Own" | "Team" | "View" | "—";
const matrix: { module: string; access: Level[] }[] = [
  { module: "Employee master", access: ["Full", "Edit", "Team", "—", "View", "—", "—", "Own"] },
  { module: "Salary structure & payroll", access: ["Full", "Edit", "—", "—", "Edit", "—", "—", "Own"] },
  { module: "Targets (initial)", access: ["Full", "Edit", "View", "Own", "—", "—", "—", "Own"] },
  { module: "Targets (revise after joining)", access: ["Full", "—", "—", "—", "—", "—", "—", "—"] },
  { module: "Leave approval", access: ["Full", "Edit", "Team", "—", "—", "—", "—", "Own"] },
  { module: "Attendance & roster", access: ["Full", "Edit", "Team", "Own", "—", "—", "—", "Own"] },
  { module: "Letters & ID cards", access: ["Full", "Edit", "—", "Own", "—", "View", "—", "Own"] },
  { module: "Jobs (create / edit)", access: ["Full", "Edit", "—", "—", "—", "—", "—", "—"] },
  { module: "Jobs (publish)", access: ["Full", "Edit*", "—", "—", "—", "—", "—", "—"] },
  { module: "Jobs (cancel / archive)", access: ["Full", "—", "—", "—", "—", "—", "—", "—"] },
  { module: "Applications & interviews", access: ["Full", "Edit", "—", "—", "—", "—", "Own", "Own"] },
  { module: "Referral links & commission", access: ["Full", "Edit", "—", "—", "Edit", "—", "—", "—"] },
  { module: "CRM leads & collections", access: ["Full", "—", "Team", "Own", "Edit", "—", "—", "—"] },
  { module: "Finance & refunds", access: ["Full", "—", "—", "—", "Edit", "View", "—", "—"] },
  { module: "Customer tickets", access: ["Full", "—", "—", "—", "View", "Edit", "—", "—"] },
  { module: "Ventures / funding stages", access: ["Full", "—", "View", "View", "—", "—", "—", "—"] },
  { module: "Integrations & API keys", access: ["Full", "—", "—", "—", "—", "—", "—", "—"] },
];

/** Read-only view of who can do what; the rules themselves are enforced by the database. */
export function PermissionsMatrix() {
  return <div className="space-y-3">
    <p className="text-xs text-muted-foreground">Full = everything · Edit = create/change · Team = own team only · Own = own records only · View = read only · Edit* = HR managers only. Employee "Own" on interviews = rounds they are the interviewer for. These rules are enforced by the system; change a person's department in "Departments & access".</p>
    <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[720px] text-left text-sm">
      <thead className="bg-surface text-xs text-muted-foreground"><tr><th className="px-3 py-2">Module</th>{roles.map(r => <th key={r} className="px-3 py-2">{r}</th>)}</tr></thead>
      <tbody>{matrix.map(m => <tr key={m.module} className="border-t border-border"><td className="px-3 py-2 font-semibold">{m.module}</td>{m.access.map((a, i) => <td key={i} className={`px-3 py-2 ${a === "—" ? "text-muted-foreground" : ""}`}>{a}</td>)}</tr>)}</tbody>
    </table></div>
  </div>;
}
