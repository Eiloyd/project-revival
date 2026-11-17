import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ChevronRight, Lightbulb, LogIn } from 'lucide-react';
import { articlesForTopic, findArticle, findTopic } from '@/lib/help/search';
import { HelpSearch, StillNeedHelp } from '@/components/help/help-ui';

export const Route = createFileRoute('/help/$slug')({
  staticData: { sitemap: true },
  loader: ({ params }) => { const article = findArticle(params.slug); if (!article) throw notFound(); return { article }; },
  head: ({ loaderData }) => {
    const a = loaderData?.article; const title = a ? `${a.title} | RILOYD Help Centre` : 'Help article | RILOYD Help Centre';
    const desc = a?.summary ?? 'Step-by-step help for the RILOYD portal.';
    return { meta: [{ title }, { name: 'description', content: desc }, { property: 'og:title', content: title }, { property: 'og:description', content: desc }, { property: 'og:type', content: 'article' }, { name: 'twitter:card', content: 'summary' }] };
  },
  notFoundComponent: () => <main className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="text-3xl font-black uppercase">Answer not found</h1><p className="mt-3 text-sm text-soft">This help page has moved or never existed.</p><Link to="/help" className="mt-6 inline-flex font-bold text-primary">Back to the Help Centre</Link></main>,
  component: HelpArticlePage,
});

function HelpArticlePage() {
  const { article: a } = Route.useLoaderData();
  const topic = findTopic(a.topic)!;
  const more = articlesForTopic(a.topic).filter(x => x.slug !== a.slug);
  const related = (a.related ?? []).map(findArticle).filter(x => !!x);
  return <main className="min-h-screen bg-background text-foreground">
    <div className="border-b border-border"><div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-5 py-5 sm:px-6 md:flex-row md:items-center lg:px-8">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-xs font-semibold text-soft">
        <Link to="/help" className="hover:text-primary">Help Centre</Link><ChevronRight className="size-3.5" />
        <Link to="/help" search={{ topic: topic.key }} className="hover:text-primary">{topic.title}</Link><ChevronRight className="size-3.5" /><span className="truncate text-foreground">{a.title}</span>
      </nav>
      <div className="md:w-96"><HelpSearch size="sm" /></div>
    </div></div>

    <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_300px] lg:px-8">
      <article className="min-w-0">
        <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight">{a.title}</h1>
        <p className="mt-3 text-base text-soft">{a.summary}</p>
        <ol className="mt-8 space-y-4">{a.steps.map((s, n) => <li key={n} className="help-step flex gap-4 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-card-foreground sm:text-[15px]">{s}</li>)}</ol>
        {a.tips?.length ? <div className="mt-6 flex gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-foreground"><Lightbulb className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div className="space-y-1">{a.tips.map(t => <p key={t}>{t}</p>)}</div></div> : null}
        {topic.key !== 'start' && topic.key !== 'tickets' && topic.key !== 'account' && <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-soft"><LogIn className="size-4" aria-hidden="true" />Ready to try it? <Link to="/login" className="font-bold text-primary underline-offset-4 hover:underline">Sign in</Link> and press Help in the top bar to replay the guided tour.</p>}
        {related.length > 0 && <section className="mt-10"><h2 className="text-sm font-bold uppercase tracking-wider text-soft">Related answers</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">{related.map(r => <li key={r.slug}><Link to="/help/$slug" params={{ slug: r.slug }} className="help-card block p-4 text-sm font-semibold">{r.title}<span className="mt-1 block text-xs font-normal text-soft">{r.summary}</span></Link></li>)}</ul></section>}
      </article>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-xs font-bold uppercase tracking-wider text-soft">More in {topic.title}</p>
        <ul className="mt-3 border-l border-border">{more.map(m => <li key={m.slug}><Link to="/help/$slug" params={{ slug: m.slug }} className="-ml-px block border-l-2 border-transparent py-2 pl-4 text-sm text-soft hover:border-primary hover:text-foreground">{m.title}</Link></li>)}</ul>
        {!more.length && <p className="mt-3 text-sm text-soft">This is the only article in this topic.</p>}
      </aside>
    </div>
    <div className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-6 lg:px-8"><StillNeedHelp /></div>
  </main>;
}
