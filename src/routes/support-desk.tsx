import { createFileRoute } from '@tanstack/react-router';
import { ClipboardCheck, FileText, Headset, LayoutDashboard, Phone, Timer, Banknote, Users, Sparkles, Siren, BookOpen, Star } from 'lucide-react';
import { CsatReport, KnowledgeBase } from '@/components/support/knowledge-base';
import { SupportDashboard } from '@/components/support/support-dashboard';
import { DepartmentPage } from '@/components/work/department-page';
import { Approvals } from '@/components/work/requests';

export const Route = createFileRoute('/support-desk')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'Support desk | RILOYD workspace' }, { name: 'description', content: 'RILOYD support desk: customer tickets from the website plus technical and support tickets from employees and volunteers.' },
    { property: 'og:title', content: 'Support desk | RILOYD workspace' }, { property: 'og:description', content: 'Private support workspace for RILOYD.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: () => <DepartmentPage dash="support" workspace="Support" first="s-overview" intro="Support staff sign in with their work email."
    groups={[
      { title: 'Support manager', items: [{ key: 's-overview', label: 'Overview', icon: LayoutDashboard }, { key: 's-sla', label: 'SLA & escalations', icon: Timer }, { key: 's-incidents', label: 'Incident board', icon: Siren }, { key: 's-refunds', label: 'Cancellations & refunds', icon: Banknote }, { key: 's-team', label: 'Team performance', icon: Users }, { key: 's-csat', label: 'Customer ratings', icon: Star }] },
      { title: 'Support', items: [{ key: 's-inbox', label: 'Unified inbox', icon: Headset }, { key: 's-log', label: 'Log a call / email / WhatsApp', icon: Phone }, { key: 's-ai', label: 'AI ticket helper', icon: Sparkles }, { key: 's-kb', label: 'Knowledge base & SOPs', icon: BookOpen }, { key: 's-queue', label: 'Team tickets', icon: ClipboardCheck }, { key: 's-all', label: 'All internal tickets', icon: FileText }] },
    ]}
    render={(s, uid) => s === 's-kb' ? <KnowledgeBase uid={uid} /> : s === 's-csat' ? <CsatReport uid={uid} /> : s === 's-all' ? <Approvals uid={uid} mode="dept" dept="support" title="All tickets" /> : s === 's-queue' ? <Approvals uid={uid} title="Tickets waiting for Support" /> : <SupportDashboard uid={uid} section={s === 's-customers' ? 's-inbox' : s} />} />,
});
