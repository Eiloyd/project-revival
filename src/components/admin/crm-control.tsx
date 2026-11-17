import { Link } from '@tanstack/react-router';
import { ArrowRight, BarChart3, CheckSquare, Columns3, Headphones, Inbox, LayoutDashboard, Shuffle, Target, UserPlus, Users, Wallet, type LucideIcon } from 'lucide-react';
import { dashboardIcons } from '@/components/dashboard/shell';
import { adminDashboardKeys, dashboards } from '@/lib/dashboards';

/** CRM modules Admin controls company-wide. Each opens the Employee CRM on that section; as Admin you see every employee's records there. */
export const crmControlModules: { key: string; label: string; description: string; icon: LucideIcon }[] = [
  { key: 'overview', label: 'Overview', description: 'Total sales, active pipeline value, pending tasks and today\'s verified collections for the whole company.', icon: LayoutDashboard },
  { key: 'pipeline', label: 'Sales pipeline', description: 'Every deal by stage. Re-assign any deal to another BDE/BDM.', icon: Columns3 },
  { key: 'contacts', label: 'Customers', description: 'All customer records, contact history and order value.', icon: Users },
  { key: 'tasks', label: 'Tasks & follow-ups', description: 'Active follow-ups and overdue calls of the whole sales team.', icon: CheckSquare },
  { key: 'support', label: 'Support desk', description: 'Sales and customer support tickets with their resolution status.', icon: Headphones },
  { key: 'targets', label: 'Targets & reports', description: 'Target meters, daily sales reports and lead sources.', icon: Target },
  { key: 'team-compare', label: 'Team performance', description: 'Compare every BDE and BDM side by side.', icon: BarChart3 },
  { key: 'collections', label: 'Collections', description: 'Direct BDE vs volunteer-sourced collections, verified and pending.', icon: Wallet },
  { key: 'workload', label: 'Workload & reassign', description: 'Move leads between people in bulk, with a reason that is logged.', icon: Shuffle },
  { key: 'team', label: 'Employees', description: 'BDE/BDM directory, active status and reporting BDM. Add new employees with a login.', icon: UserPlus },
  { key: 'inbox', label: 'Website leads', description: 'Fresh leads from website forms; assign the unassigned ones.', icon: Inbox },
];

export function CrmControl() {
  return <div className="grid gap-6">
    <section className="dash-card p-4 sm:p-6">
      <h2 className="text-base font-semibold">CRM control — all modules</h2>
      <p className="mt-1 text-sm text-muted-foreground">As Admin nothing is hidden from you: every lead, customer, task, ticket, target and employee of every BDE/BDM. Open a module to search, export (Excel) or re-assign.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{crmControlModules.map(m => <li key={m.key}>
        <a href={`/crm#${m.key}`} className="group flex h-full items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/50">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><m.icon className="size-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{m.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{m.description}</span></span>
          <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
        </a></li>)}</ul>
    </section>
    <section className="dash-card p-4 sm:p-6">
      <h2 className="text-base font-semibold">Open any dashboard</h2>
      <p className="mt-1 text-sm text-muted-foreground">Admin can open every dashboard without signing out — also from the dashboard switcher at the top of the menu.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{adminDashboardKeys.filter(k => k !== 'admin').map(k => { const d = dashboards[k]; const Icon = dashboardIcons[k]; return <li key={k}>
        <Link to={d.path} className="group flex h-full items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/50">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary"><Icon className="size-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{d.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{d.description}</span></span>
        </Link></li>; })}</ul>
    </section>
  </div>;
}
