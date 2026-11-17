import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Plus, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/shell';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { dateTime } from '@/lib/requests';
import { csatByOwner, csatSummary } from '@/lib/support/csat';
import { useSupport } from './data';

const categories = { sop: 'SOP', troubleshooting: 'Troubleshooting', template: 'Reply template', policy: 'Policy' } as const;
type Cat = keyof typeof categories;
type Draft = { id?: string; title: string; category: Cat; body: string; tags: string; status: 'draft' | 'published' | 'archived' };
const blank: Draft = { title: '', category: 'sop', body: '', tags: '', status: 'draft' };

/** Searchable SOPs, troubleshooting guides and reply templates. Executives read published ones; managers write. */
export function KnowledgeBase({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const manager = useQuery({ queryKey: ['support-manager', uid], queryFn: async () => { const { data, error } = await supabase.rpc('support_is_manager'); if (error) throw error; return data === true; } });
  const list = useQuery({ queryKey: ['support-kb'], queryFn: async () => { const { data, error } = await supabase.from('support_kb_articles').select('*').order('updated_at', { ascending: false }); if (error) throw error; return data; } });
  const [q, setQ] = useState(''); const [cat, setCat] = useState<'all' | Cat>('all'); const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null); const [error, setError] = useState<unknown>(null); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState('');
  const isManager = manager.data === true;
  const needle = q.trim().toLowerCase();
  const rows = (list.data ?? []).filter(a => (cat === 'all' || a.category === cat) && (isManager || a.status === 'published') && `${a.title} ${a.body} ${a.tags}`.toLowerCase().includes(needle));
  async function save() {
    if (!draft) return; setBusy(true); setError(null);
    try {
      if (draft.title.trim().length < 3) throw new Error('Enter a title (at least 3 characters).');
      if (draft.body.trim().length < 10) throw new Error('Write the guide or template (at least 10 characters).');
      const payload = { title: draft.title.trim(), category: draft.category, body: draft.body.trim(), tags: draft.tags.trim(), status: draft.status };
      const { error } = draft.id ? await supabase.from('support_kb_articles').update(payload).eq('id', draft.id) : await supabase.from('support_kb_articles').insert(payload);
      if (error) throw error; setDraft(null); await qc.invalidateQueries({ queryKey: ['support-kb'] });
    } catch (e) { setError(e); } finally { setBusy(false); }
  }
  async function copy(id: string, text: string) { try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(''), 2000); } catch { setCopied(''); } }
  return <Panel title="Knowledge base & SOPs" actions={isManager && !draft ? <Button size="sm" onClick={() => setDraft({ ...blank })}><Plus className="size-4" />New guide</Button> : undefined}>
    <p className="mb-4 text-sm text-muted-foreground">Standard procedures, troubleshooting steps and approved reply templates. {isManager ? 'Only published guides are visible to executives.' : 'Only guides published by the Support Manager are shown.'}</p>
    {draft && <div className="mb-5 grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2">
      <Field label="Title"><input className={inputCls} value={draft.title} maxLength={200} onChange={e => setDraft({ ...draft, title: e.target.value })} /></Field>
      <Field label="Type"><select className={inputCls} value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as Cat })}>{Object.entries(categories).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></Field>
      <div className="sm:col-span-2"><Field label="Guide / template text"><textarea className={`${areaCls} min-h-40`} value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} /></Field></div>
      <Field label="Search words (comma separated)"><input className={inputCls} value={draft.tags} onChange={e => setDraft({ ...draft, tags: e.target.value })} /></Field>
      <Field label="Status"><select className={inputCls} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Draft['status'] })}><option value="draft">Draft (managers only)</option><option value="published">Published (whole team)</option><option value="archived">Archived</option></select></Field>
      <div className="flex gap-2 sm:col-span-2"><Button disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save'}</Button><Button variant="outline" onClick={() => { setDraft(null); setError(null); }}>Cancel</Button></div>
    </div>}
    <ErrorNote error={error ?? list.error} />
    <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]"><Field label="Search"><input className={inputCls} value={q} placeholder="Refund, payment failed, login…" onChange={e => setQ(e.target.value)} /></Field>
      <Field label="Type"><select className={inputCls} value={cat} onChange={e => setCat(e.target.value as 'all' | Cat)}><option value="all">All types</option>{Object.entries(categories).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></Field></div>
    {list.isPending ? <Loading /> : !rows.length ? <Empty>{list.data?.length ? 'No guide matches your search.' : 'No guides yet.'}</Empty> : <ul className="grid gap-3">{rows.map(a => <li key={a.id} className="dash-card p-4">
      <div className="flex flex-wrap items-center gap-2"><button className="text-left font-semibold text-primary underline-offset-2 hover:underline" onClick={() => setOpen(open === a.id ? null : a.id)}>{a.title}</button><Pill>{categories[a.category as Cat] ?? a.category}</Pill>{isManager && <Pill tone={a.status === 'published' ? 'success' : 'muted'}>{a.status}</Pill>}<span className="text-xs text-muted-foreground">v{a.version} · {dateTime(a.updated_at)}</span></div>
      {open === a.id && <><p className="mt-3 whitespace-pre-wrap text-sm">{a.body}</p><div className="mt-3 flex flex-wrap gap-2">{a.category === 'template' && <Button size="sm" variant="outline" onClick={() => void copy(a.id, a.body)}><Copy className="size-4" />{copied === a.id ? 'Copied' : 'Copy reply'}</Button>}{isManager && <Button size="sm" variant="outline" onClick={() => setDraft({ id: a.id, title: a.title, category: a.category as Cat, body: a.body, tags: a.tags, status: a.status as Draft['status'] })}>Edit</Button>}</div></>}
    </li>)}</ul>}
  </Panel>;
}

/** Customer ratings given after resolution, overall and per executive. */
export function CsatReport({ uid }: { uid: string }) {
  const data = useSupport(uid); const tickets = data.tickets.data ?? []; const team = data.team.data ?? [];
  const s = csatSummary(tickets); const per = csatByOwner(tickets);
  const recent = tickets.filter(t => t.csat_rating !== null).sort((a, b) => (b.csat_at ?? '').localeCompare(a.csat_at ?? '')).slice(0, 50);
  const resolved = tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;
  const name = (id: string | null) => team.find(m => m.user_id === id)?.full_name ?? 'Unassigned';
  if (data.tickets.isPending) return <Loading />;
  return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <KpiCard label="CSAT (4–5 stars)" value={s.csat === null ? '—' : `${s.csat}%`} icon={Star} />
    <KpiCard label="Average rating" value={s.average === null ? '—' : s.average.toFixed(1)} icon={Star} />
    <KpiCard label="Ratings received" value={s.count} icon={Star} />
    <KpiCard label="Response rate" value={resolved ? `${Math.round((s.count / resolved) * 100)}%` : '—'} icon={Star} />
  </div>
  <Panel title="Ratings by executive"><p className="mb-3 text-xs text-muted-foreground">Customers rate a ticket once, after it is resolved, from the Contact page status check. Staff cannot edit ratings.</p>{!per.length ? <Empty>No ratings yet.</Empty> : <Table head={['Executive', 'Ratings', 'Average', 'CSAT']}>{per.map(p => <tr key={p.owner}><Td>{name(p.owner)}</Td><Td>{p.count}</Td><Td>{p.average?.toFixed(1)}</Td><Td>{p.csat}%</Td></tr>)}</Table>}</Panel>
  <Panel title="Recent feedback">{!recent.length ? <Empty>No feedback yet.</Empty> : <Table head={['Ticket', 'Stars', 'Comment', 'Owner', 'When']}>{recent.map(t => <tr key={t.id}><Td className="font-mono text-xs">{t.ticket_code}</Td><Td>{'★'.repeat(t.csat_rating ?? 0)}</Td><Td>{t.csat_comment ?? '—'}</Td><Td>{name(t.assigned_to)}</Td><Td>{t.csat_at ? dateTime(t.csat_at) : ''}</Td></tr>)}</Table>}</Panel></>;
}
