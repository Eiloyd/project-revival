import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { adminAccountAction, adminBlockedAccounts } from '@/lib/accounts/logins.functions';
import { generateTemporaryPassword } from '@/lib/accounts/logins';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Empty, ErrorNote, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { downloadCsv } from '@/lib/finance';
import { pct } from '@/lib/hr/hiring';
import { periodRange, teamRollup, type Period, type SalesPerson } from '@/lib/admin-reports';

type Report = {
  sales: { leads: number; won: number; won_value: number; verified: number; unverified: number; people: SalesPerson[] };
  support: { opened: number; resolved: number; overdue: number; open_now: number; avg_first_response_hours: number | null };
  hr: { requests: Record<string, number>; pending_now: number; applications: number; hires: number; open_jobs: number; jobs_waiting_approval: number };
  finance: { verified_collections: number; refunds_paid: number; manpower_paid: number; manpower_unpaid: number };
  ventures: { new_clients: number; files_opened: number; funded: number; active_files: number };
  research: { requests: number; delivered: number; open_now: number };
};
const inr = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const periods: [Period, string][] = [['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['last_month', 'Last month'], ['quarter', 'This quarter'], ['year', 'This financial year'], ['custom', 'Custom']];

function Card({ title, rows, href }: { title: string; rows: [string, string | number][]; href?: string }) {
  return <section className="dash-card p-4"><div className="flex items-center justify-between"><h3 className="font-semibold">{title}</h3>{href && <a href={href} className="text-xs text-primary hover:underline">Open</a>}</div>
    <dl className="mt-2 grid gap-1 text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-2 border-b border-border py-1 last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>)}</dl></section>;
}

/** Admin → Reports & analytics: every department for a chosen period, with sales targets rolled up by team. */
export function AdminPeriodReports() {
  const [period, setPeriod] = useState<Period>('month'); const [custom, setCustom] = useState(periodRange('month'));
  const range = period === 'custom' ? custom : periodRange(period);
  const q = useQuery({ queryKey: ['admin-period-report', range.from, range.to], queryFn: async () => { const { data, error } = await supabase.rpc('admin_period_report', { _from: range.from, _to: range.to }); if (error) throw error; return data as unknown as Report; } });
  const r = q.data; const teams = r ? teamRollup(r.sales.people) : [];
  return <div className="grid gap-5">
    <Panel title="Period" actions={<><select aria-label="Period" className={`${inputCls} w-44`} value={period} onChange={e => setPeriod(e.target.value as Period)}>{periods.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      {period === 'custom' && <><input type="date" aria-label="From" className={`${inputCls} w-40`} value={custom.from} max={custom.to} onChange={e => setCustom({ ...custom, from: e.target.value })} /><input type="date" aria-label="To" className={`${inputCls} w-40`} value={custom.to} min={custom.from} onChange={e => setCustom({ ...custom, to: e.target.value })} /></>}</>}>
      <p className="text-sm text-muted-foreground">{new Date(`${range.from}T00:00:00`).toLocaleDateString('en-IN')} to {new Date(`${range.to}T00:00:00`).toLocaleDateString('en-IN')} (India time). Figures marked "now" are the current position, not limited to the period.</p>
    </Panel>
    {q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : r && <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Sales (BDE / BDM)" href="/crm" rows={[['New leads', r.sales.leads], ['Deals won', r.sales.won], ['Value won', inr(r.sales.won_value)], ['Verified collections', inr(r.sales.verified)], ['Waiting for verification', inr(r.sales.unverified)]]} />
        <Card title="Customer support" href="/support-desk" rows={[['Tickets opened', r.support.opened], ['Resolved', r.support.resolved], ['Past SLA', r.support.overdue], ['Open now', r.support.open_now], ['Avg first response', r.support.avg_first_response_hours === null ? '—' : `${r.support.avg_first_response_hours} h`]]} />
        <Card title="HR & requests" href="/hr" rows={[['Requests raised', Object.values(r.hr.requests).reduce((a, b) => a + b, 0)], ['Approved', r.hr.requests['approved'] ?? 0], ['Rejected', r.hr.requests['rejected'] ?? 0], ['Pending now', r.hr.pending_now], ['Job applications', r.hr.applications], ['Hired', r.hr.hires], ['Published jobs now', r.hr.open_jobs], ['Jobs waiting approval', r.hr.jobs_waiting_approval]]} />
        <Card title="Accounts & finance" href="/finance" rows={[['Verified collections', inr(r.finance.verified_collections)], ['Refunds paid', inr(r.finance.refunds_paid)], ['Manpower invoices paid', inr(r.finance.manpower_paid)], ['Manpower unpaid now', inr(r.finance.manpower_unpaid)]]} />
        <Card title="Startups & funding" href="/ventures" rows={[['New clients', r.ventures.new_clients], ['Funding files opened', r.ventures.files_opened], ['Funded', r.ventures.funded], ['Active files now', r.ventures.active_files]]} />
        <Card title="Lead research" href="/research" rows={[['Requests received', r.research.requests], ['Delivered', r.research.delivered], ['Open now', r.research.open_now]]} />
      </div>
      <Panel title="Targets by team (verified collections vs revenue target)" actions={teams.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv(`team-targets-${range.from}-${range.to}.csv`, teams.flatMap(t => [{ team: t.name, person: 'TEAM TOTAL', role: 'BDM', target: t.target, collected: t.collected, achieved_pct: pct(t.collected, t.target), leads: t.leads, won: t.won }, ...t.members.map(m => ({ team: t.name, person: m.name, role: m.role, target: m.target, collected: m.collected, achieved_pct: pct(m.collected, m.target), leads: m.leads, won: m.won }))]))}>Download CSV</Button> : undefined}>
        {!teams.length ? <Empty>No active BDE / BDM yet.</Empty> : <Table head={['Team / person', 'Role', 'Target', 'Verified', 'Achieved', 'Leads', 'Won']}>{teams.flatMap(t => [
          <tr key={t.id} className="border-b border-border bg-muted/40"><Td className="font-semibold">{t.name}</Td><Td>Team</Td><Td>{inr(t.target)}</Td><Td>{inr(t.collected)}</Td><Td><Achieved v={pct(t.collected, t.target)} has={t.target > 0} /></Td><Td>{t.leads}</Td><Td>{t.won}</Td></tr>,
          ...t.members.map(m => <tr key={`${t.id}-${m.user_id}`} className="border-b border-border"><Td className="pl-6">{m.name}</Td><Td>{m.role}</Td><Td>{inr(m.target)}</Td><Td>{inr(m.collected)}</Td><Td><Achieved v={pct(m.collected, m.target)} has={m.target > 0} /></Td><Td>{m.leads}</Td><Td>{m.won}</Td></tr>)])}</Table>}
      </Panel>
    </>}
  </div>;
}
function Achieved({ v, has }: { v: number; has: boolean }) {
  if (!has) return <span className="text-muted-foreground">No target</span>;
  return <div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded-full bg-muted"><div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, v)}%`, background: v >= 100 ? 'var(--dash-success)' : v >= 60 ? 'var(--primary)' : 'var(--dash-warning)' }} /></div><span className="tabular-nums">{v}%</span></div>;
}

type UserRow = { user_id: string; email: string; full_name: string; employee_code: string; created_at: string; last_sign_in_at: string | null; confirmed: boolean; access: string[] };
/** Admin → Users & access: every account, its dashboards and roles. */
export function UsersDirectory() {
  const q = useQuery({ queryKey: ['admin-user-directory'], queryFn: async () => { const { data, error } = await supabase.rpc('admin_user_directory'); if (error) throw error; return data as UserRow[]; } });
  const [f, setF] = useState(''); const [only, setOnly] = useState('');
  const qc = useQueryClient(); const act = useServerFn(adminAccountAction); const blockedFn = useServerFn(adminBlockedAccounts);
  const blocked = useQuery({ queryKey: ['admin-blocked-accounts'], queryFn: () => blockedFn(), retry: false });
  const [busy, setBusy] = useState(''); const [shown, setShown] = useState<{ email: string; password: string } | null>(null);
  const run = async (u: UserRow, action: 'verify' | 'reset' | 'deactivate' | 'reactivate') => {
    if (action === 'deactivate' && !confirm(`Block ${u.email} from signing in to every dashboard?`)) return;
    const password = action === 'reset' ? generateTemporaryPassword() : undefined;
    if (action === 'reset' && !confirm(`Give ${u.email} a new temporary password? Their current password stops working and they must choose a new one at next sign-in.`)) return;
    setBusy(u.user_id + action);
    try {
      await act({ data: { userId: u.user_id, action, ...(password ? { password } : {}) } });
      if (password) setShown({ email: u.email, password });
      toast.success(action === 'verify' ? 'Email marked as verified.' : action === 'reset' ? 'Temporary password set.' : action === 'deactivate' ? 'Account blocked.' : 'Account unblocked.');
      await Promise.all([qc.invalidateQueries({ queryKey: ['admin-user-directory'] }), qc.invalidateQueries({ queryKey: ['admin-blocked-accounts'] })]);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update the account.'); } finally { setBusy(''); }
  };
  const list = (q.data ?? []).filter(u => (!f || [u.email, u.full_name, u.employee_code].some(x => x.toLowerCase().includes(f.toLowerCase()))) && (!only || (only === 'none' ? !u.access.length : u.access.some(a => a.toLowerCase().includes(only)))));
  const dt = (d: string | null) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never';
  return <Panel title={`Users & access (${list.length})`} actions={<><input aria-label="Search users" placeholder="Search email, name, code" className={`${inputCls} w-56`} value={f} onChange={e => setF(e.target.value)} />
    <select aria-label="Access" className={`${inputCls} w-44`} value={only} onChange={e => setOnly(e.target.value)}><option value="">All accounts</option><option value="admin">Admin</option><option value="crm">CRM (BDE/BDM)</option><option value="hr">HR</option><option value="support">Support</option><option value="finance">Finance</option><option value="accounts">Accounts</option><option value="research">Research</option><option value="jury">Jury</option><option value="institute">Institute</option><option value="client">Client portal</option><option value="volunteer">Volunteer</option><option value="candidate">Candidate</option><option value="none">No access yet</option></select>
    {q.data?.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv('users-access.csv', list.map(u => ({ email: u.email, name: u.full_name, employee_code: u.employee_code, access: u.access.join('; '), email_confirmed: u.confirmed ? 'yes' : 'no', signed_up: u.created_at, last_sign_in: u.last_sign_in_at ?? '' })))}>Download CSV</Button> : null}</>}>
    {shown && <div role="status" className="mb-3 rounded-md border border-border bg-muted/50 p-3 text-sm">Temporary password for <b>{shown.email}</b>: <code className="font-mono text-foreground">{shown.password}</code>
      <span className="ml-2 inline-flex gap-2"><Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(shown.password).then(() => toast.success('Copied. Share it privately.'))}>Copy</Button><Button size="sm" variant="ghost" onClick={() => setShown(null)}>Hide</Button></span>
      <span className="mt-1 block text-xs text-muted-foreground">Shown once. They must set their own password at next sign-in.</span></div>}
    <p className="mb-3 text-sm text-muted-foreground">Verify an email, give a new temporary password or block sign-in from here. Give or remove access in Departments & access (HR, Support, Accounts, Finance, Research), BDE / BDM (CRM), Volunteers, Ventures → Stages, jury & services (jury), HR → Institutes (partner logins).</p>
    {q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !list.length ? <Empty>No accounts match.</Empty> :
      <Table head={['Account', 'Access', 'Email confirmed', 'Signed up', 'Last sign-in', 'Actions']}>{list.map(u => <tr key={u.user_id} className="border-b border-border"><Td><b>{u.full_name || u.email}</b><div className="text-xs text-muted-foreground">{u.email}{u.employee_code && ` · ${u.employee_code}`}</div></Td>
        <Td><div className="flex flex-wrap gap-1">{u.access.length ? u.access.map(a => <Pill key={a} tone={a === 'Admin' ? 'danger' : 'info'}>{a}</Pill>) : <span className="text-xs text-muted-foreground">No dashboard yet</span>}</div></Td>
        <Td>{u.confirmed ? <Pill tone="success">Yes</Pill> : <Pill tone="warning">No</Pill>}</Td><Td className="whitespace-nowrap">{dt(u.created_at)}</Td><Td className="whitespace-nowrap">{dt(u.last_sign_in_at)}</Td>
        <Td><div className="flex flex-wrap gap-1">
          {blocked.data?.includes(u.user_id) && <Pill tone="danger">Blocked</Pill>}
          {!u.confirmed && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => void run(u, 'verify')}>Verify email</Button>}
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => void run(u, 'reset')}>Reset password</Button>
          {blocked.data?.includes(u.user_id) ? <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => void run(u, 'reactivate')}>Unblock</Button>
            : <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => void run(u, 'deactivate')}>Block</Button>}
        </div></Td></tr>)}</Table>}
  </Panel>;
}
