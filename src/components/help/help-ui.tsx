import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, BriefcaseBusiness, Building2, ClipboardList, GraduationCap, HandHeart, Headset, HeartHandshake, KeyRound, Landmark, Link2, Rocket, Search, SearchCheck, ShieldCheck, Sparkles, TicketPlus, Users, UsersRound, type LucideIcon } from 'lucide-react';
import type { HelpTopicKey } from '@/lib/help/content';
import { findTopic, searchHelp } from '@/lib/help/search';

export const topicIcons: Record<HelpTopicKey, LucideIcon> = {
  start: Sparkles, account: KeyRound, tickets: TicketPlus, work: ClipboardList, crm: BriefcaseBusiness, staff: Link2, 'my-volunteers': HeartHandshake, volunteer: HandHeart,
  hr: Users, support: Headset, finance: Landmark, research: SearchCheck, ventures: Rocket, manpower: UsersRound, admin: ShieldCheck, portal: Building2, candidate: BriefcaseBusiness, institute: GraduationCap,
};

/** Search box with live answers as you type (keyboard: ↑ ↓ Enter, Esc to clear). */
export function HelpSearch({ initial = '', autoFocus = false, size = 'lg' }: { initial?: string; autoFocus?: boolean; size?: 'lg' | 'sm' }) {
  const [q, setQ] = useState(initial);
  const [focus, setFocus] = useState(false);
  const [hi, setHi] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchHelp(q, 8), [q]);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  useEffect(() => { setHi(0); }, [q]);
  useEffect(() => { if (autoFocus && window.matchMedia('(min-width: 1024px)').matches) input.current?.focus(); }, [autoFocus]);
  const show = focus && q.trim().length > 0;
  return <div className="relative w-full" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocus(false); }}>
    <label className={`help-search flex items-center gap-3 ${size === 'lg' ? 'h-14 px-5 sm:h-16 sm:px-6' : 'h-11 px-4'}`}>
      <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input ref={input} type="search" value={q} onChange={e => setQ(e.target.value)} onFocus={() => setFocus(true)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, results.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
          else if (e.key === 'Enter' && results[hi]) { e.preventDefault(); links.current[hi]?.click(); }
          else if (e.key === 'Escape') setQ('');
        }}
        placeholder="Describe your question — e.g. raise a ticket, apply leave, withdraw" aria-label="Search help"
        role="combobox" aria-expanded={show} aria-controls="help-results" aria-autocomplete="list"
        className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground ${size === 'lg' ? 'text-base sm:text-lg' : 'text-sm'}`} />
    </label>
    {show && <div id="help-results" role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
      {results.length ? <ul className="max-h-[60vh] overflow-y-auto py-2">{results.map((a, n) => { const t = findTopic(a.topic); return <li key={a.slug}>
        <Link ref={el => { links.current[n] = el; }} to="/help/$slug" params={{ slug: a.slug }} role="option" aria-selected={n === hi} onMouseEnter={() => setHi(n)}
          className={`flex items-start gap-3 px-4 py-3 ${n === hi ? 'bg-muted' : ''}`}>
          <Search className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0"><span className="block text-sm font-semibold">{a.title}</span><span className="block truncate text-xs text-muted-foreground">{t?.title} · {a.summary}</span></span>
        </Link></li>; })}</ul>
        : <p className="px-5 py-4 text-sm text-muted-foreground">No answer matches "{q}". Try simpler words, or <Link to="/help/$slug" params={{ slug: 'raise-ticket' }} className="font-semibold text-primary underline-offset-4 hover:underline">raise a ticket</Link>.</p>}
    </div>}
  </div>;
}

/** "Still need help?" — the three ways to reach a person. */
export function StillNeedHelp() {
  const items = [
    { to: '/help/$slug' as const, params: { slug: 'raise-ticket' }, title: 'Employees: raise a ticket', text: 'My work → Support & HR help → New request, in any dashboard.' },
    { to: '/help/$slug' as const, params: { slug: 'volunteer-ticket' }, title: 'Volunteers: raise a ticket', text: 'Volunteer dashboard → Help → Raise a ticket.' },
    { to: '/help/$slug' as const, params: { slug: 'public-ticket' }, title: 'Customers & students', text: 'Raise a support ticket from the Contact page — no login needed.' },
  ];
  return <section className="mt-14 rounded-2xl border border-border bg-surface p-6 sm:p-8">
    <p className="section-label">Still need help?</p>
    <h2 className="mt-3 text-2xl font-black uppercase leading-none sm:text-3xl">Talk to our <span className="text-primary">team</span></h2>
    <div className="mt-6 grid gap-3 md:grid-cols-3">{items.map(i => <Link key={i.title} to={i.to} params={i.params} className="help-card group flex flex-col p-5">
      <span className="text-sm font-bold">{i.title}</span><span className="mt-1 flex-1 text-sm text-soft">{i.text}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">See how <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
    </Link>)}</div>
  </section>;
}
