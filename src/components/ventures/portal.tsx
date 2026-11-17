import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill } from '@/components/work/common';
import { appStatusLabels, categories, categoryDocs, categoryLabels, docStatusLabels, kinds, manpowerStatusLabels, orderStatusLabels, orderedStages, type Category } from '@/lib/ventures/rules';
import { ClientManpower } from './manpower';
import { date, inr, must, openDoc, uploadDoc, useAct, useApps, useClients, useDocs, useManpower, useOrders, useServices, useStages, useTickets, type Client } from './data';

function Status({ a }: { a: ReturnType<typeof useAct> }) { return <><ErrorNote error={a.error} />{a.notice && <p role="status" className="text-sm text-muted-foreground">{a.notice}</p>}</>; }
const lbl = (m: Record<string, string>, k: string) => m[k] ?? k;

/** First-time: the signed-in founder registers their company. */
export function RegisterCompany({ uid, onDone }: { uid: string; onDone?: () => void }) {
  const a = useAct();
  const [f, setF] = useState({ kind: 'startup', category: 'idea', name: '', sector: '', founder_name: '', email: '', phone: '', city: '', website: '', pitch: '' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return <Panel title="Register your startup / business">
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="I am a"><select className={inputCls} value={f.kind} onChange={set('kind')}>{Object.entries(kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label="Stage / category"><select className={inputCls} value={f.category} onChange={set('category')}>{categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}</select></Field>
      <Field label="Company / startup name"><input className={inputCls} value={f.name} onChange={set('name')} /></Field>
      <Field label="Sector / industry"><input className={inputCls} value={f.sector} onChange={set('sector')} /></Field>
      <Field label="Founder / contact name"><input className={inputCls} value={f.founder_name} onChange={set('founder_name')} /></Field>
      <Field label="Phone"><input className={inputCls} value={f.phone} onChange={set('phone')} /></Field>
      <Field label="Email"><input className={inputCls} type="email" value={f.email} onChange={set('email')} /></Field>
      <Field label="City"><input className={inputCls} value={f.city} onChange={set('city')} /></Field>
    </div>
    <Field label="Website (optional)"><input className={inputCls} value={f.website} onChange={set('website')} /></Field>
    <Field label="Your idea / business in a few lines"><textarea className={areaCls} value={f.pitch} onChange={set('pitch')} /></Field>
    <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => {
      if (f.name.trim().length < 2) throw new Error('Enter your company name.'); if (!/^[+\d][\d\s-]{7,}$/.test(f.phone.trim())) throw new Error('Enter a valid phone number.');
      must(await supabase.from('venture_clients').insert({ ...f, name: f.name.trim(), owner_user_id: uid })); onDone?.();
    }, 'Registered. Your portal is ready.')}>Register</Button><Status a={a} />
  </Panel>;
}

function useMine(uid: string) { const c = useClients(); return { ...c, mine: (c.data ?? []).find(x => x.owner_user_id === uid) as Client | undefined }; }

export function PortalHome({ uid }: { uid: string }) {
  const c = useMine(uid); const apps = useApps(); const stages = useStages(); const docs = useDocs(); const a = useAct();
  const [ask, setAsk] = useState({ funding_ask: '', funding_type: 'equity', use_of_funds: '' });
  if (c.isPending || apps.isPending || stages.isPending) return <Loading />;
  if (!c.mine) return <RegisterCompany uid={uid} />;
  const me = c.mine; const st = orderedStages(stages.data ?? []);
  const myApps = (apps.data ?? []).filter(x => x.client_id === me.id);
  const needed = (docs.data ?? []).filter(d => d.client_id === me.id && ['requested', 'changes_requested'].includes(d.status));
  return <div className="grid gap-5">
    <Panel title={me.name} actions={<Pill tone="info">{lbl(categoryLabels, me.category)}</Pill>}><p className="text-sm text-muted-foreground">{lbl(kinds, me.kind)} · {me.sector} · {me.city} · Status: {me.status}</p>
      {needed.length > 0 && <p className="mt-2 text-sm font-medium text-destructive">{needed.length} document(s) need your upload — see Documents.</p>}</Panel>
    {myApps.map(x => { const idx = st.findIndex(s => s.id === x.stage_id); return <Panel key={x.id} title={`Funding file · ${inr(x.funding_ask)} (${x.funding_type})`} actions={<Pill tone={x.status === 'funded' ? 'success' : x.status === 'rejected' ? 'danger' : 'info'}>{lbl(appStatusLabels, x.status)}</Pill>}>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{st.map((s, i) => { const done = x.status === 'funded' || i < idx; const now = i === idx && x.status !== 'funded';
        return <li key={s.id} className={`rounded-md border p-2 text-sm ${now ? 'border-primary bg-primary/5' : 'border-border'} ${done ? 'opacity-70' : ''}`}><span className="text-xs text-muted-foreground">Step {i + 1}{s.jury_round ? ' · mandatory' : ''}</span><p className="font-medium">{done ? '✓ ' : ''}{s.name}</p>{now && s.required_docs && <p className="text-xs text-muted-foreground">Needed: {s.required_docs}</p>}</li>; })}</ol>
      {x.next_action && <p className="mt-3 text-sm"><b>Next step:</b> {x.next_action}</p>}
      <Feedback app={x.id} />
    </Panel>; })}
    {!myApps.some(x => x.status === 'active') && <Panel title="Apply for funding">
      <p className="mb-2 text-sm text-muted-foreground">Every application goes through screening and two mandatory jury rounds before due diligence and investor matching.</p>
      <div className="grid gap-3 sm:grid-cols-3"><Field label="Funding needed (₹)"><input className={inputCls} type="number" value={ask.funding_ask} onChange={e => setAsk({ ...ask, funding_ask: e.target.value })} /></Field>
        <Field label="Type"><select className={inputCls} value={ask.funding_type} onChange={e => setAsk({ ...ask, funding_type: e.target.value })}>{['equity', 'grant', 'debt', 'convertible'].map(t => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Use of funds"><input className={inputCls} value={ask.use_of_funds} onChange={e => setAsk({ ...ask, use_of_funds: e.target.value })} /></Field></div>
      <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => {
        const amt = Number(ask.funding_ask); if (!(amt > 0)) throw new Error('Enter the funding amount.');
        const row = must(await supabase.from('funding_applications').insert({ client_id: me.id, funding_ask: amt, funding_type: ask.funding_type, use_of_funds: ask.use_of_funds }).select('id').single()) as { id: string };
        const docsFor = categoryDocs[me.category as Category] ?? categoryDocs.other;
        must(await supabase.from('venture_documents').insert(docsFor.map(d => ({ client_id: me.id, application_id: row.id, doc_type: d }))));
      }, 'Application submitted. Upload the listed documents under Documents.')}>Submit application</Button><Status a={a} />
    </Panel>}
  </div>;
}
function Feedback({ app }: { app: string }) {
  const q = useQuery({ queryKey: ['ventures', 'feedback', app], queryFn: async () => must(await supabase.rpc('funding_public_feedback', { _app: app })) as { round: number; decision: string; public_remarks: string; created_at: string }[] });
  if (!q.data?.length) return null;
  return <div className="mt-3 grid gap-1"><p className="text-sm font-semibold">Jury feedback</p>{q.data.map((f, i) => <p key={i} className="text-sm">Round {f.round}: {f.public_remarks}</p>)}</div>;
}

export function PortalDocuments({ uid }: { uid: string }) {
  const c = useMine(uid); const docs = useDocs(); const a = useAct(); const [extra, setExtra] = useState('');
  if (c.isPending || docs.isPending) return <Loading />; if (!c.mine) return <RegisterCompany uid={uid} />;
  const me = c.mine; const list = (docs.data ?? []).filter(d => d.client_id === me.id);
  const up = (id: string | null, type: string) => async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    await a.run(async () => { const path = await uploadDoc(me.id, file);
      if (id) must(await supabase.from('venture_documents').update({ file_path: path, file_name: file.name }).eq('id', id));
      else must(await supabase.from('venture_documents').insert({ client_id: me.id, doc_type: type || 'Other', file_path: path, file_name: file.name })); setExtra(''); }, 'Uploaded — our team will review it.'); };
  return <Panel title="Document vault">
    <p className="mb-3 text-xs text-muted-foreground">Files are private: only you, your assigned RILOYD team and Admin can open them. PDF, PowerPoint, Word, Excel or image, up to 20 MB.</p>
    {!list.length ? <Empty>No documents requested yet.</Empty> : <div className="grid gap-2">{list.map(d => <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
      <div><b>{d.doc_type}</b> <Pill tone={d.status === 'approved' ? 'success' : d.status === 'changes_requested' ? 'danger' : d.status === 'requested' ? 'warning' : 'info'}>{lbl(docStatusLabels, d.status)}</Pill>{d.review_note && <p className="text-xs text-muted-foreground">{d.review_note}</p>}{d.file_name && <p className="text-xs text-muted-foreground">{d.file_name}</p>}</div>
      <div className="flex gap-2">{d.file_path && <Button size="sm" variant="outline" onClick={() => void a.run(() => openDoc(d.file_path!), '')}>Open</Button>}{d.status !== 'approved' && <label className="inline-flex h-8 cursor-pointer items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">{d.file_path ? 'Replace' : 'Upload'}<input type="file" className="sr-only" onChange={e => void up(d.id, d.doc_type)(e)} /></label>}</div></div>)}</div>}
    <div className="mt-3 flex flex-wrap items-end gap-2"><Field label="Upload another document"><input className={inputCls} placeholder="e.g. Financial model" value={extra} onChange={e => setExtra(e.target.value)} /></Field><label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input px-3 text-sm">Choose file<input type="file" className="sr-only" onChange={e => void up(null, extra)(e)} /></label></div>
    <Status a={a} /></Panel>;
}

export function PortalServices({ uid }: { uid: string }) {
  const c = useMine(uid); const s = useServices(); const o = useOrders(); const a = useAct(); const [note, setNote] = useState<Record<string, string>>({});
  if (c.isPending || s.isPending) return <Loading />; if (!c.mine) return <RegisterCompany uid={uid} />;
  const me = c.mine; const mine = (o.data ?? []).filter(x => x.client_id === me.id);
  return <div className="grid gap-5"><Panel title="My services">{!mine.length ? <Empty>No services yet.</Empty> : <div className="grid gap-2">{mine.map(x => <div key={x.id} className="rounded-md border border-border p-2 text-sm"><b>{s.data?.find(y => y.id === x.service_id)?.name}</b> <Pill tone={x.status === 'delivered' ? 'success' : 'info'}>{lbl(orderStatusLabels, x.status)}</Pill> {x.amount != null && <span className="text-muted-foreground">{inr(x.amount)}</span>}{x.progress_note && <p className="text-xs">{x.progress_note}</p>}<p className="text-xs text-muted-foreground">{date(x.created_at)}</p></div>)}</div>}</Panel>
    <Panel title="RILOYD services you can add"><div className="grid gap-3 sm:grid-cols-2">{s.data?.filter(x => x.active).map(x => <div key={x.id} className="rounded-md border border-border p-3 text-sm"><b>{x.name}</b><p className="text-xs text-muted-foreground">{x.description}</p>{x.price_note && <p className="text-xs">{x.price_note}</p>}
      <input className={`${inputCls} mt-2`} placeholder="What do you need? (optional)" value={note[x.id] ?? ''} onChange={e => setNote({ ...note, [x.id]: e.target.value })} />
      <Button size="sm" className="mt-2" disabled={a.busy} onClick={() => void a.run(async () => { must(await supabase.from('venture_orders').insert({ client_id: me.id, service_id: x.id, client_note: note[x.id] ?? '' })); setNote({ ...note, [x.id]: '' }); }, 'Request sent — your RILOYD executive will contact you with a quote.')}>Request quote</Button></div>)}</div><Status a={a} /></Panel></div>;
}

export function PortalManpower({ uid }: { uid: string }) {
  const c = useMine(uid);
  if (c.isPending) return <Loading />; if (!c.mine) return <RegisterCompany uid={uid} />;
  return <ClientManpower client={c.mine} />;
}

export function PortalSupport({ uid }: { uid: string }) {
  const c = useMine(uid); const t = useTickets(); const a = useAct(); const [f, setF] = useState({ topic: 'general', subject: '', body: '' });
  if (c.isPending) return <Loading />; if (!c.mine) return <RegisterCompany uid={uid} />;
  const me = c.mine; const mine = (t.data ?? []).filter(x => x.client_id === me.id);
  return <div className="grid gap-5"><Panel title="Raise a support request"><div className="grid gap-3 sm:grid-cols-2"><Field label="About"><select className={inputCls} value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })}>{['general', 'funding', 'services', 'manpower', 'documents', 'billing'].map(x => <option key={x}>{x}</option>)}</select></Field><Field label="Subject"><input className={inputCls} value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} /></Field></div>
    <Field label="Details"><textarea className={areaCls} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} /></Field>
    <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => { if (f.subject.trim().length < 3) throw new Error('Enter a subject.'); must(await supabase.from('venture_tickets').insert({ ...f, client_id: me.id })); setF({ topic: 'general', subject: '', body: '' }); }, 'Request sent.')}>Send</Button><Status a={a} /></Panel>
    <Panel title="My requests">{!mine.length ? <Empty>No requests.</Empty> : <div className="grid gap-2">{mine.map(x => <div key={x.id} className="rounded-md border border-border p-2 text-sm"><b>{x.subject}</b> <Pill tone={x.status === 'resolved' ? 'success' : 'warning'}>{x.status.replace('_', ' ')}</Pill>{x.reply && <p className="mt-1 text-sm"><b>RILOYD:</b> {x.reply}</p>}</div>)}</div>}</Panel></div>;
}

export function PortalProfile({ uid }: { uid: string }) {
  const c = useMine(uid); const a = useAct(); const [f, setF] = useState<Partial<Client>>({});
  useEffect(() => { if (c.mine) setF(c.mine); }, [c.mine]);
  if (c.isPending) return <Loading />; if (!c.mine) return <RegisterCompany uid={uid} />;
  const set = (k: keyof Client) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const txt = (k: keyof Client, l: string) => <Field label={l}><input className={inputCls} value={String(f[k] ?? '')} onChange={set(k)} /></Field>;
  return <Panel title="Company profile"><div className="grid gap-3 sm:grid-cols-2">{txt('name', 'Company name')}{txt('sector', 'Sector')}{txt('founder_name', 'Founder / contact')}{txt('phone', 'Phone')}{txt('email', 'Email')}{txt('city', 'City')}{txt('website', 'Website')}{txt('cin', 'CIN / LLPIN')}{txt('gst', 'GST')}
    <Field label="Category"><select className={inputCls} value={f.category ?? 'idea'} onChange={set('category')}>{categories.map(x => <option key={x} value={x}>{categoryLabels[x]}</option>)}</select></Field></div>
    <Field label="Idea / pitch"><textarea className={areaCls} value={f.pitch ?? ''} onChange={set('pitch')} /></Field>
    <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.from('venture_clients').update({ name: f.name ?? '', sector: f.sector ?? '', founder_name: f.founder_name ?? '', phone: f.phone ?? '', email: f.email ?? '', city: f.city ?? '', website: f.website ?? '', cin: f.cin ?? '', gst: f.gst ?? '', category: f.category ?? 'idea', pitch: f.pitch ?? '' }).eq('id', c.mine!.id)))}>Save</Button><Status a={a} /></Panel>;
}
