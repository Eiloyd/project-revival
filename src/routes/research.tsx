import { createFileRoute } from '@tanstack/react-router';
import { Briefcase, Database, LayoutDashboard, ListChecks, Milestone, Star } from 'lucide-react';
import { ResearchMilestones } from '@/components/research/milestones';
import { CandidateSourcing } from '@/components/hr/hiring';
import { DepartmentPage } from '@/components/work/department-page';
import { ResearchDesk } from '@/components/research/research';

export const Route = createFileRoute('/research')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'Lead Research | RILOYD workspace' }, { name: 'description', content: 'RILOYD Lead Research & Intelligence: lead requests from every department, lead bank, verification and delivery.' },
    { property: 'og:title', content: 'Lead Research | RILOYD workspace' }, { property: 'og:description', content: 'Central lead research department for RILOYD.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: () => <DepartmentPage dash="research" workspace="Lead Research" first="r-overview" intro="Lead Research staff sign in with their work email."
    groups={[{ title: 'Lead Research', items: [{ key: 'r-overview', label: 'Overview', icon: LayoutDashboard }, { key: 'r-requests', label: 'All requests', icon: ListChecks }, { key: 'r-bank', label: 'Lead bank', icon: Database }, { key: 'r-milestones', label: 'Project milestones', icon: Milestone }, { key: 'r-feedback', label: 'Department feedback', icon: Star }] }, { title: 'HR', items: [{ key: 'r-hiring', label: 'Candidate sourcing', icon: Briefcase }] }]}
    render={s => s === 'r-hiring' ? <CandidateSourcing /> : s === 'r-milestones' ? <ResearchMilestones /> : <ResearchDesk section={s} />} />,
});
