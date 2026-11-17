import { createFileRoute } from '@tanstack/react-router';
import { BadgeCheck, BarChart3, BookOpen, Building2, ClipboardCheck, FileSpreadsheet, HandCoins, Landmark, LayoutDashboard, PiggyBank, Scale, Users } from 'lucide-react';
import { Advances, Payroll } from '@/components/hr/hrms';
import { DepartmentPage } from '@/components/work/department-page';
import { FinanceManpowerInvoices } from '@/components/ventures/manpower';
import { FinanceDesk } from '@/components/finance/finance-desk';

export const Route = createFileRoute('/finance')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'Accounts & Finance | RILOYD workspace' }, { name: 'description', content: 'RILOYD Accounts & Finance: payments, volunteer withdrawals, bank reconciliation, budgets and reports.' },
    { property: 'og:title', content: 'Accounts & Finance | RILOYD workspace' }, { property: 'og:description', content: 'Private Accounts & Finance workspace for RILOYD.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: () => <DepartmentPage dash="finance" workspace="Accounts & Finance" first="f-overview" intro="Accounts and Finance staff sign in with their work email."
    groups={[
      { title: 'Overview', items: [{ key: 'f-overview', label: 'Financial overview', icon: LayoutDashboard }, { key: 'f-approvals', label: 'Approvals & payments', icon: ClipboardCheck }, { key: 'f-withdrawals', label: 'Volunteer payments', icon: HandCoins }] },
      { title: 'Accounts', items: [{ key: 'f-collections', label: 'Sales collections', icon: BadgeCheck }, { key: 'f-manpower', label: 'Manpower invoices', icon: Users }, { key: 'f-register', label: 'Transaction register', icon: BookOpen }, { key: 'f-reconcile', label: 'Bank reconciliation', icon: Scale }, { key: 'f-dues', label: 'Receivables & payables', icon: FileSpreadsheet }, { key: 'f-vendors', label: 'Vendors & parties', icon: Users }] },
      { title: 'Payroll', items: [{ key: 'f-payroll', label: 'Payroll & salary payments', icon: Landmark }, { key: 'f-advances', label: 'Salary advances', icon: HandCoins }] },
      { title: 'Finance', items: [{ key: 'f-accounts', label: 'Bank & cash', icon: Landmark }, { key: 'f-budgets', label: 'Budgets', icon: PiggyBank }, { key: 'f-zoho', label: 'Zoho invoices', icon: Building2 }, { key: 'f-reports', label: 'Reports & MIS', icon: BarChart3 }] },
    ]}
    render={(s, uid) => s === 'f-payroll' ? <Payroll /> : s === 'f-advances' ? <Advances /> : s === 'f-manpower' ? <FinanceManpowerInvoices /> : <FinanceDesk section={s} uid={uid} />} />,
});
