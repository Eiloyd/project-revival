import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Headset, LayoutDashboard, ShoppingBag, UserRound, UsersRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AuthForm } from '@/components/auth-form';
import { DashboardGate, DashboardShell } from '@/components/dashboard/shell';
import { useMyDashboards } from '@/hooks/use-my-dashboards';
import { PortalDocuments, PortalHome, PortalManpower, PortalProfile, PortalServices, PortalSupport, RegisterCompany } from '@/components/ventures/portal';

export const Route = createFileRoute('/client-portal')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'Client portal | RILOYD Startups & Businesses' }, { name: 'description', content: 'Track your funding stages, upload documents, request RILOYD services, post manpower requirements and get support.' },
    { property: 'og:title', content: 'Client portal | RILOYD' }, { property: 'og:description', content: 'Startup and business portal for RILOYD clients.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: ClientPortal,
});

const items = [
  { key: 'home', label: 'Funding progress', icon: LayoutDashboard }, { key: 'docs', label: 'Documents', icon: FileText },
  { key: 'services', label: 'Services', icon: ShoppingBag }, { key: 'manpower', label: 'Manpower', icon: UsersRound },
  { key: 'support', label: 'Support', icon: Headset }, { key: 'profile', label: 'Company profile', icon: UserRound },
];

function ClientPortal() {
  const { uid, email, dashboards, loading, refetch } = useMyDashboards(); const qc = useQueryClient();
  const [section, setSection] = useState(() => (typeof window !== 'undefined' && window.location.hash.slice(1)) || 'home');
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); };
  if (uid && dashboards?.includes('portal')) {
    const select = (k: string) => { setSection(k); window.history.replaceState(null, '', `#${k}`); };
    return <DashboardShell workspace="Client portal" groups={[{ items }]} active={section} onSelect={select} user={{ name: email, detail: 'Startup / business' }} onSignOut={() => void signOut()}>
      {section === 'docs' ? <PortalDocuments uid={uid} /> : section === 'services' ? <PortalServices uid={uid} /> : section === 'manpower' ? <PortalManpower uid={uid} /> : section === 'support' ? <PortalSupport uid={uid} /> : section === 'profile' ? <PortalProfile uid={uid} /> : <PortalHome uid={uid} />}
    </DashboardShell>;
  }
  return <DashboardGate workspace="Client portal" title={uid ? 'Register your company' : 'Startup & business portal'} intro="Sign in or create an account to apply for funding, track every stage, upload documents and request RILOYD services.">
    {uid === undefined || loading ? <p className="text-sm text-muted-foreground">Checking…</p> : !uid ? <AuthForm redirectPath="/client-portal" /> : <RegisterCompany uid={uid} onDone={() => void refetch()} />}
  </DashboardGate>;
}
