import { createFileRoute } from '@tanstack/react-router';
import { DepartmentPage } from '@/components/work/department-page';

export const Route = createFileRoute('/work')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'My Work | RILOYD workspace' }, { name: 'description', content: 'Your leave, attendance, requests and meetings at RILOYD.' },
    { property: 'og:title', content: 'My Work | RILOYD workspace' }, { property: 'og:description', content: 'Private employee workspace for RILOYD.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: () => <DepartmentPage dash="work" workspace="My Work" first="w-requests" intro="Sign in with your work email." groups={[]} render={() => null} />,
});
