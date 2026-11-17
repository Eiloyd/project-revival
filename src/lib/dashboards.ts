/** Every private dashboard on the site, in the order they are offered after sign-in. Access is decided by the database (`my_dashboards`). */
export const dashboardKeys = ['admin', 'crm', 'staff', 'my-volunteers', 'hr', 'support', 'finance', 'research', 'ventures', 'manpower', 'work', 'volunteer', 'portal', 'institute', 'candidate'] as const;
export type DashboardKey = (typeof dashboardKeys)[number];
export type DashboardPath = '/admin' | '/crm' | '/staff' | '/my-volunteers' | '/hr' | '/support-desk' | '/finance' | '/research' | '/ventures' | '/manpower' | '/work' | '/volunteer' | '/client-portal' | '/institute-portal' | '/candidate-portal';

export const dashboards: Record<DashboardKey, { path: DashboardPath; label: string; description: string }> = {
  admin: { path: '/admin', label: 'Admin panel', description: 'Website, people, fees, departments, integrations and setup.' },
  crm: { path: '/crm', label: 'Employee CRM', description: 'Leads, customers, follow-ups, targets and My Work.' },
  staff: { path: '/staff', label: 'BDE / BDM referrals', description: 'Students referred through your code and their checks.' },
  'my-volunteers': { path: '/my-volunteers', label: 'My Volunteers', description: 'Volunteers you created, their referrals, payouts and requests.' },
  hr: { path: '/hr', label: 'HR dashboard', description: 'Leave, attendance, documents, resignations and employees.' },
  support: { path: '/support-desk', label: 'Support desk', description: 'Technical and support tickets from employees and volunteers.' },
  finance: { path: '/finance', label: 'Accounts & Finance', description: 'Payments, withdrawals, bank reconciliation, budgets and reports.' },
  research: { path: '/research', label: 'Lead Research', description: 'Lead requests from every department, lead bank and delivery.' },
  ventures: { path: '/ventures', label: 'Startups & Funding desk', description: 'Startups, businesses, funding stages and jury rounds.' },
  manpower: { path: '/manpower', label: 'Manpower services desk', description: 'Manpower clients, requirements, candidates, placements, timesheets, invoices and delays.' },
  work: { path: '/work', label: 'My Work', description: 'Your leave, attendance, requests and meetings.' },
  volunteer: { path: '/volunteer', label: 'Volunteer dashboard', description: 'Your referrals, earnings, withdrawals and requests.' },
  portal: { path: '/client-portal', label: 'Client portal', description: 'Your company, funding progress, documents, services and support.' },
  candidate: { path: '/candidate-portal', label: 'Candidate portal', description: 'Your job applications, interviews, assessments, messages and offer.' },
  institute: { path: '/institute-portal', label: 'Institute portal', description: 'Upload candidates in bulk and track their first 90 days after joining.' },
};

/** Paths that use the dashboard frame (no public header/footer). */
export const workspacePaths = ['/login', '/crm/sales', ...dashboardKeys.map(k => dashboards[k].path)] as readonly string[];

/** Keeps only known dashboards, once each, in the standard order. */
export function parseDashboards(value: unknown): DashboardKey[] {
  const list = Array.isArray(value) ? value : [];
  return dashboardKeys.filter(k => list.includes(k));
}

/** Every staff dashboard. Admin can open all of them, so nothing in the company is hidden from Admin. */
export const adminDashboardKeys: DashboardKey[] = ['admin', 'crm', 'staff', 'my-volunteers', 'hr', 'support', 'finance', 'research', 'ventures', 'manpower', 'work'];
export function withAdminAccess(list: DashboardKey[]): DashboardKey[] {
  if (!list.includes('admin')) return list;
  return dashboardKeys.filter(k => list.includes(k) || adminDashboardKeys.includes(k));
}

export type LoginRoute = { kind: 'none' } | { kind: 'go'; to: DashboardPath } | { kind: 'choose'; options: DashboardKey[] };

/** One dashboard opens straight away; several are offered as a choice; none means access has not been given yet. */
export function routeAfterLogin(list: DashboardKey[]): LoginRoute {
  if (list.length === 0) return { kind: 'none' };
  if (list.length === 1) return { kind: 'go', to: dashboards[list[0]!].path };
  return { kind: 'choose', options: list };
}

/** Which dashboard a page path belongs to (used to mark the current one in the switcher). */
export function dashboardForPath(pathname: string): DashboardKey | null {
  const clean = pathname.replace(/\/$/, '');
  return dashboardKeys.find(k => dashboards[k].path === clean) ?? null;
}
