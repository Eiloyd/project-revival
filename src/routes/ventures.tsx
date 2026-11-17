import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Building2, Columns3, Gavel, Headset, LayoutDashboard, Settings2, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DepartmentPage } from '@/components/work/department-page';
import { useMyDashboards } from '@/hooks/use-my-dashboards';
import { JuryDesk, VenturesReports } from '@/components/ventures/jury-reports';
import { ClientTickets, FundingPipeline, ServiceOrders, StageManager, VentureClients, VenturesOverview } from '@/components/ventures/desk';

export const Route = createFileRoute('/ventures')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'Startups & Funding desk | RILOYD workspace' }, { name: 'description', content: 'RILOYD desk for startup and business onboarding, services and the funding pipeline with mandatory jury rounds.' },
    { property: 'og:title', content: 'Startups & Funding desk | RILOYD workspace' }, { property: 'og:description', content: 'Private RILOYD workspace for startups and business funding.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: VenturesPage,
});

const allItems = [
  { key: 'v-overview', label: 'Overview', icon: LayoutDashboard }, { key: 'v-clients', label: 'Startups & businesses', icon: Building2 },
  { key: 'v-funding', label: 'Funding pipeline', icon: Columns3 }, { key: 'v-jury', label: 'Jury desk', icon: Gavel }, { key: 'v-services', label: 'Service requests', icon: ShoppingBag },
  { key: 'v-tickets', label: 'Client support', icon: Headset }, { key: 'v-reports', label: 'Reports', icon: BarChart3 },
  { key: 'v-settings', label: 'Stages, jury & services', icon: Settings2 },
];
/** Jury-only members (not Admin/BDE/BDM/sales) work only on funding files and their scorecards. */
const juryOnlyKeys = ['v-jury', 'v-funding'];

function useIsDesk(uid: string | null | undefined) {
  return useQuery({ queryKey: ['ventures', 'is-desk', uid], enabled: !!uid, queryFn: async () => { const { data, error } = await supabase.rpc('venture_is_desk'); if (error) throw error; return !!data; } });
}

function Section({ s, uid }: { s: string; uid: string }) {
  const { dashboards } = useMyDashboards(); const isAdmin = !!dashboards?.includes('admin');
  const juror = useQuery({ queryKey: ['ventures', 'am-juror', uid], queryFn: async () => { const { data } = await supabase.from('venture_jurors').select('active').eq('user_id', uid).maybeSingle(); return !!data?.active; } });
  const desk = useIsDesk(uid);
  const canJury = isAdmin || !!juror.data;
  if (desk.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!desk.data && !juryOnlyKeys.includes(s)) return <JuryDesk isAdmin={false} uid={uid} />;
  return s === 'v-jury' ? <JuryDesk isAdmin={isAdmin} uid={uid} /> : s === 'v-reports' ? <VenturesReports /> : s === 'v-clients' ? <VentureClients isAdmin={isAdmin} /> : s === 'v-funding' ? <FundingPipeline isAdmin={isAdmin} canJury={canJury} canOpen={!!desk.data} />
    : s === 'v-services' ? <ServiceOrders /> : s === 'v-tickets' ? <ClientTickets />
    : s === 'v-settings' ? (isAdmin ? <StageManager /> : <p className="text-sm text-muted-foreground">Only Admin can change stages, jurors and services.</p>) : <VenturesOverview />;
}

function VenturesPage() {
  const { uid } = useMyDashboards(); const desk = useIsDesk(uid);
  const juryOnly = desk.data === false;
  return <DepartmentPage dash="ventures" workspace="Startups & Funding" first={juryOnly ? 'v-jury' : 'v-overview'} intro="Admin, BDE/BDM and jury members sign in with their work email."
    groups={[{ title: 'Startups & Funding', items: juryOnly ? allItems.filter(i => juryOnlyKeys.includes(i.key)) : allItems }]}
    render={(s, uid) => <Section s={s} uid={uid} />} />;
}
