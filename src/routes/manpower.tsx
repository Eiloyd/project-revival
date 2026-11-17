import { createFileRoute } from '@tanstack/react-router';
import { UsersRound } from 'lucide-react';
import { DepartmentPage } from '@/components/work/department-page';
import { ManpowerSuite } from '@/components/ventures/manpower';

export const Route = createFileRoute('/manpower')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'Manpower services desk | RILOYD workspace' }, { name: 'description', content: 'RILOYD desk for manpower clients, requirements, candidates, placements, timesheets, invoices and delay tracking.' },
    { property: 'og:title', content: 'Manpower services desk | RILOYD workspace' }, { property: 'og:description', content: 'Private RILOYD workspace for manpower supply and services.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: ManpowerPage,
});

function ManpowerPage() {
  return <DashboardPageInner />;
}
function DashboardPageInner() {
  return <DepartmentPage dash="manpower" workspace="Manpower services" first="m-desk" intro="Admin, BDE/BDM and manpower desk staff sign in with their work email."
    groups={[{ title: 'Manpower services', items: [{ key: 'm-desk', label: 'Manpower supply', icon: UsersRound }] }]}
    render={() => <ManpowerSuite />} />;
}
