import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { helpArticles, helpTopics, type HelpTopicKey } from '@/lib/help/content';
import { articlesForTopic, findTopic, isHelpTopic } from '@/lib/help/search';
import { HelpSearch, StillNeedHelp, topicIcons } from '@/components/help/help-ui';

const popular = ['getting-started', 'raise-ticket', 'new-request', 'forgot-password', 'apply-leave', 'record-collection', 'volunteer-withdraw', 'no-dashboard'];

export const Route = createFileRoute('/help/')({
  validateSearch: (s: Record<string, unknown>): { topic?: HelpTopicKey } => (isHelpTopic(s['topic']) ? { topic: s['topic'] } : {}),
  head: () => ({ meta: [
    { title: 'Help Centre | RILOYD portal' },
    { name: 'description', content: 'Step-by-step answers for every RILOYD dashboard: signing in, raising tickets and requests, leave, collections, withdrawals, HR, finance and more.' },
    { property: 'og:title', content: 'Help Centre | RILOYD portal' },
    { property: 'og:description', content: 'Search answers for every RILOYD dashboard and learn how to raise a ticket or request.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: HelpHome,
});

function HelpHome() {
  const { topic } = Route.useSearch();
  const t = topic ? findTopic(topic) : undefined;
  return <main className="min-h-screen bg-background text-foreground">
    <section className="border-b border-border">
      <div className="mx-auto max-w-3xl px-5 pb-14 pt-12 text-center sm:px-6 sm:pt-16">
        <p className="eyebrow text-[10px] font-bold uppercase text-soft">RILOYD Help Centre</p>
        <h1 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] font-black uppercase leading-[.95]">How can we <span className="text-primary">help you?</span></h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-soft sm:text-base">Answers for every dashboard and portal — where things are, what each feature does, and how to raise a ticket or request.</p>
        <div className="mx-auto mt-8 max-w-2xl text-left"><HelpSearch autoFocus /></div>
      </div>
    </section>

    <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-6 lg:px-8">
      {t ? <TopicView topic={t.key} /> : <>
        <p className="section-label">Browse by topic</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{helpTopics.map(x => { const Icon = topicIcons[x.key]; const n = articlesForTopic(x.key).length; return <Link key={x.key} to="/help" search={{ topic: x.key }} className="help-card group flex items-start gap-4 p-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary"><Icon className="size-5" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><span className="flex items-center gap-1 text-sm font-bold">{x.title}<ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></span>
            <span className="mt-1 block text-sm text-soft">{x.blurb}</span><span className="mt-2 block text-xs text-muted-foreground">{n} article{n === 1 ? '' : 's'}</span></span>
        </Link>; })}</div>

        <p className="section-label mt-14">Popular questions</p>
        <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">{popular.map(slug => helpArticles.find(a => a.slug === slug)).filter(a => !!a).map(a => <li key={a.slug} className="border-b border-border">
          <Link to="/help/$slug" params={{ slug: a.slug }} className="group flex items-center justify-between gap-3 py-4 text-sm font-semibold hover:text-primary">{a.title}<ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" /></Link>
        </li>)}</ul>
      </>}
      <StillNeedHelp />
    </div>
  </main>;
}

function TopicView({ topic }: { topic: HelpTopicKey }) {
  const t = findTopic(topic)!; const Icon = topicIcons[topic]; const list = articlesForTopic(topic);
  return <section>
    <Link to="/help" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-soft hover:text-primary"><ArrowLeft className="size-3.5" />All topics</Link>
    <div className="mt-5 flex items-center gap-4"><span className="grid size-12 place-items-center rounded-xl bg-accent text-primary"><Icon className="size-6" aria-hidden="true" /></span>
      <div><h2 className="text-2xl font-black uppercase leading-none sm:text-3xl">{t.title}</h2><p className="mt-1.5 text-sm text-soft">{t.blurb}</p></div></div>
    <ul className="mt-8 grid gap-3 md:grid-cols-2">{list.map(a => <li key={a.slug}><Link to="/help/$slug" params={{ slug: a.slug }} className="help-card group flex h-full flex-col p-5">
      <span className="text-sm font-bold">{a.title}</span><span className="mt-1 flex-1 text-sm text-soft">{a.summary}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">Read answer <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
    </Link></li>)}</ul>
  </section>;
}
