import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { appStatusLabels, categories, categoryDocs, categoryLabels, docStatusLabels, juryBlock, kinds, manpowerStatusLabels, orderStatusLabels, orderedStages, roundScore, stageProgress, type Category } from '@/lib/ventures/rules';
import { date, inr, must, openDoc, useAct, useApps, useBdes, useClients, useDocs, useEvals, useHistory, useManpower, useOrders, useServices, useStages, useTickets, type App, type Client } from './data';

const label = <T extends Record<string, string>>(m: T, k: string) => (m as Record<string, string>)[k] ?? k;
function Status({ a }: { a: ReturnType<typeof useAct> }) { return <><ErrorNote error={a.error} />{a.notice && <p role="status" className="text-sm text-muted-foreground">{a.notice}</p>}</>; }
const toneFor = (s: string) => (['funded', 'approved', 'delivered', 'deployed', 'resolved', 'active'].includes(s) ? 'success' : ['rejected', 'cancelled', 'changes_requested'].includes(s) ? 'danger' : ['on_hold', 'requested', 'open', 'replacement'].includes(s) ? 'warning' : 'info') as 'success' | 'danger' | 'warning' | 'info';
function Bar({ value }: { value: number }) { return <div className="h-1.5 w-full rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${value}%` }} /></div>; }

/** Overview counts by category and stage. */
export function VenturesOverview() {
  const clients = useClients(); const apps = useApps(); const stages = useStages(); const mp = useManpower(); const orders = useOrders(); const tickets = useTickets();
  if (clients.isPending || apps.isPending || stages.isPending) return <Loading />;
  const list = apps.data ?? []; const st = orderedStages(stages.data ?? []);
  const stat = (t: string, v: number | string) => <div className="dash-card p-4"><p className="text-xs text-muted-foreground">{t}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>;
  return <div className="grid gap-5">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stat('Clients', clients.data?.length ?? 0)}{stat('Funding files in progress', list.filter(a => a.status === 'active').length)}
      {stat('Open manpower roles', (mp.data ?? []).filter(m => !['deployed', 'closed'].includes(m.status)).reduce((t, m) => t + m.headcount - m.filled, 0))}
      {stat('Open service requests / tickets', `${(orders.data ?? []).filter(o => o.status === 'requested').length} / ${(tickets.data ?? []).filter(t => t.status !== 'resolved').length}`)}
    </div>
    <Panel title="Funding files by stage and category">
      <Table head={['Stage', ...categories.map(c => categoryLabels[c]), 'Total']}>
        {st.map(s => { const here = list.filter(a => a.stage_id === s.id && a.status === 'active'); return <tr key={s.id}><Td>{s.name}{s.jury_round && <> <Pill tone="warning">Mandatory</Pill></>}</Td>{categories.map(c => <Td key={c}>{here.filter(a => a.category === c).length || ''}</Td>)}<Td className="font-semibold">{here.length}</Td></tr>; })}
      </Table>
    </Panel>
  </div>;
}

/** Clients (startups, businesses, manpower clients): add, edit, assign BDE (admin). */
export function VentureClients({ isAdmin }: { isAdmin: boolean }) {
  const clients = useClients(); const bdes = useBdes(); const a = useAct();
  const blank = { id: '', kind: 'startup', category: 'idea', name: '', sector: '', founder_name: '', email: '', phone: '', city: '', website: '', cin: '', gst: '', pitch: '', assigned_bde: '', status: 'onboarding', internal_notes: '' };
  const [f, setF] = useState(blank); const [filter, setFilter] = useState(''); const [kind, setKind] = useState('');
  const set = (k: keyof typeof blank) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const bdeName = (id: string | null) => bdes.data?.find(b => b.user_id === id)?.name ?? (id ? 'Assigned' : '—');
  const list = (clients.data ?? []).filter(c => (!filter || c.category === filter) && (!kind || c.kind === kind));
  const save = () => a.run(async () => {
    if (f.name.trim().length < 2) throw new Error('Enter the company name.');
    const row = { kind: f.kind, category: f.category, name: f.name.trim(), sector: f.sector, founder_name: f.founder_name, email: f.email, phone: f.phone, city: f.city, website: f.website, cin: f.cin, gst: f.gst, pitch: f.pitch, status: f.status, internal_notes: f.internal_notes, ...(isAdmin ? { assigned_bde: f.assigned_bde || null } : {}) };
    if (f.id) must(await supabase.from('venture_clients').update(row).eq('id', f.id));
    else { const { data: u } = await supabase.auth.getUser(); must(await supabase.from('venture_clients').insert({ ...row, assigned_bde: isAdmin ? (f.assigned_bde || null) : u.user?.id ?? null })); }
    setF(blank);
  }, 'Client saved.');
  const edit = (c: Client) => setF({ id: c.id, kind: c.kind, category: c.category, name: c.name, sector: c.sector, founder_name: c.founder_name, email: c.email, phone: c.phone, city: c.city, website: c.website, cin: c.cin, gst: c.gst, pitch: c.pitch, assigned_bde: c.assigned_bde ?? '', status: c.status, internal_notes: c.internal_notes });
  return <div className="grid gap-5">
    <Panel title={f.id ? 'Edit client' : 'Onboard a startup / business'}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Type"><select className={inputCls} value={f.kind} onChange={set('kind')}>{Object.entries(kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Category"><select className={inputCls} value={f.category} onChange={set('category')}>{categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}</select></Field>
        <Field label="Company / startup name"><input className={inputCls} value={f.name} onChange={set('name')} /></Field>
        <Field label="Sector"><input className={inputCls} value={f.sector} onChange={set('sector')} /></Field>
        <Field label="Founder / contact person"><input className={inputCls} value={f.founder_name} onChange={set('founder_name')} /></Field>
        <Field label="Email"><input className={inputCls} type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone"><input className={inputCls} value={f.phone} onChange={set('phone')} /></Field>
        <Field label="City"><input className={inputCls} value={f.city} onChange={set('city')} /></Field>
        <Field label="Website"><input className={inputCls} value={f.website} onChange={set('website')} /></Field>
        <Field label="CIN / LLPIN"><input className={inputCls} value={f.cin} onChange={set('cin')} /></Field>
        <Field label="GST"><input className={inputCls} value={f.gst} onChange={set('gst')} /></Field>
        <Field label="Status"><select className={inputCls} value={f.status} onChange={set('status')}>{['onboarding', 'active', 'inactive'].map(s => <option key={s}>{s}</option>)}</select></Field>
        {isAdmin && <Field label="Assigned BDE / BDM"><select className={inputCls} value={f.assigned_bde} onChange={set('assigned_bde')}><option value="">Not assigned</option>{bdes.data?.map(b => <option key={b.user_id} value={b.user_id}>{b.name} ({b.role})</option>)}</select></Field>}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Idea / pitch summary"><textarea className={areaCls} value={f.pitch} onChange={set('pitch')} /></Field><Field label="Internal notes (not shown to client)"><textarea className={areaCls} value={f.internal_notes} onChange={set('internal_notes')} /></Field></div>
      <div className="mt-3 flex gap-2"><Button disabled={a.busy} onClick={() => void save()}>{f.id ? 'Update' : 'Add client'}</Button>{f.id && <Button variant="outline" onClick={() => setF(blank)}>Cancel</Button>}</div>
      <Status a={a} />
    </Panel>
    <Panel title={`Clients (${list.length})`} actions={<><select className={inputCls} value={kind} onChange={e => setKind(e.target.value)}><option value="">All types</option>{Object.entries(kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><select className={inputCls} value={filter} onChange={e => setFilter(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}</select></>}>
      {clients.isPending ? <Loading /> : !list.length ? <Empty>No clients yet.</Empty> :
        <Table head={['Company', 'Type / category', 'Contact', 'BDE', 'Status', '']}>{list.map(c => <tr key={c.id}><Td><b>{c.name}</b><div className="text-xs text-muted-foreground">{c.sector} {c.city}</div></Td><Td>{label(kinds, c.kind)}<div className="text-xs">{label(categoryLabels, c.category)}</div></Td><Td>{c.founder_name}<div className="text-xs text-muted-foreground">{c.email} {c.phone}</div></Td><Td>{bdeName(c.assigned_bde)}</Td><Td><Pill tone={toneFor(c.status)}>{c.status}</Pill>{c.owner_user_id && <div className="text-xs text-muted-foreground">Portal login</div>}</Td><Td><Button size="sm" variant="outline" onClick={() => edit(c)}>Edit</Button></Td></tr>)}</Table>}
    </Panel>
  </div>;
}

/** Funding pipeline: board by stage, category filter; admin moves files; BDE monitors. */
export function FundingPipeline({ isAdmin, canJury, canOpen = true }: { isAdmin: boolean; canJury: boolean; canOpen?: boolean }) {
  const apps = useApps(); const stages = useStages(); const clients = useClients(); const evals = useEvals(); const a = useAct();
  const [cat, setCat] = useState(''); const [open, setOpen] = useState<string | null>(null);
  const [newApp, setNewApp] = useState({ client_id: '', funding_ask: '', funding_type: 'equity', use_of_funds: '' });
  const st = orderedStages(stages.data ?? []);
  const name = (id: string) => clients.data?.find(c => c.id === id)?.name ?? '—';
  const list = (apps.data ?? []).filter(x => !cat || x.category === cat);
  if (apps.isPending || stages.isPending) return <Loading />;
  const cur = list.find(x => x.id === open);
  return <div className="grid gap-5">
    <Panel title="Funding pipeline" actions={<select className={inputCls} value={cat} onChange={e => setCat(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}</select>}>
      <p className="mb-3 text-xs text-muted-foreground">Jury Scanning Round 1 and Round 2 are mandatory for every file. {isAdmin ? 'Only Admin moves files between stages.' : 'You can monitor your assigned startups here; Admin moves the stages.'}</p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {st.map(s => { const here = list.filter(x => x.stage_id === s.id); return <div key={s.id} className="w-60 shrink-0 rounded-lg border border-border bg-muted/30 p-2">
          <p className="px-1 text-xs font-semibold">{s.name} <span className="text-muted-foreground">({here.length})</span></p>
          {s.jury_round && <p className="px-1 text-[11px] text-muted-foreground">Mandatory jury round</p>}
          <div className="mt-2 grid gap-2">{here.map(x => <button key={x.id} onClick={() => setOpen(x.id)} className={`dash-card p-2 text-left text-sm ${open === x.id ? 'ring-2 ring-primary' : ''}`}><b className="block truncate">{name(x.client_id)}</b><span className="text-xs text-muted-foreground">{label(categoryLabels, x.category)} · {inr(x.funding_ask)}</span><div className="mt-1"><Pill tone={toneFor(x.status)}>{label(appStatusLabels, x.status)}</Pill></div></button>)}</div>
        </div>; })}
      </div>
    </Panel>
    {cur && <FileDetail app={cur} clientName={name(cur.client_id)} isAdmin={isAdmin} canJury={canJury} />}
    {canOpen && (isAdmin || (clients.data ?? []).length > 0) && <Panel title="Open a funding file for a client">
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Client"><select className={inputCls} value={newApp.client_id} onChange={e => setNewApp({ ...newApp, client_id: e.target.value })}><option value="">Select</option>{clients.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Funding ask (₹)"><input className={inputCls} type="number" value={newApp.funding_ask} onChange={e => setNewApp({ ...newApp, funding_ask: e.target.value })} /></Field>
        <Field label="Type"><select className={inputCls} value={newApp.funding_type} onChange={e => setNewApp({ ...newApp, funding_type: e.target.value })}>{['equity', 'grant', 'debt', 'convertible'].map(t => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Use of funds"><input className={inputCls} value={newApp.use_of_funds} onChange={e => setNewApp({ ...newApp, use_of_funds: e.target.value })} /></Field>
      </div>
      <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => { if (!newApp.client_id) throw new Error('Select a client.'); must(await supabase.from('funding_applications').insert({ client_id: newApp.client_id, funding_ask: newApp.funding_ask ? Number(newApp.funding_ask) : null, funding_type: newApp.funding_type, use_of_funds: newApp.use_of_funds })); setNewApp({ client_id: '', funding_ask: '', funding_type: 'equity', use_of_funds: '' }); }, 'Funding file opened at the first stage.')}>Open file</Button>
      <Status a={a} />
    </Panel>}
    {evals.isError && null}
  </div>;
}

function FileDetail({ app, clientName, isAdmin, canJury }: { app: App; clientName: string; isAdmin: boolean; canJury: boolean }) {
  const stages = useStages(); const evals = useEvals(); const hist = useHistory(); const docs = useDocs(); const a = useAct();
  const st = orderedStages(stages.data ?? []);
  const mine = (evals.data ?? []).filter(e => e.application_id === app.id);
  const [move, setMove] = useState({ stage: app.stage_id ?? '', status: app.status, note: '', next_action: app.next_action });
  const [docType, setDocType] = useState('');
  const target = st.find(s => s.id === move.stage);
  const block = move.status === 'funded' ? juryBlock(st, mine, 'funded') : target ? juryBlock(st, mine, target) : null;
  const stageName = (id: string | null) => st.find(s => s.id === id)?.name ?? (stages.data?.find(s => s.id === id)?.name ?? '—');
  const fileDocs = (docs.data ?? []).filter(d => d.client_id === app.client_id);
  return <Panel title={`${clientName} — funding file`} actions={<Pill tone={toneFor(app.status)}>{label(appStatusLabels, app.status)}</Pill>}>
    <div className="grid gap-1 text-sm"><p>Stage: <b>{stageName(app.stage_id)}</b> · Category: {label(categoryLabels, app.category)} · Ask: {inr(app.funding_ask)} ({app.funding_type})</p><Bar value={stageProgress(st, app.stage_id, app.status)} />{app.use_of_funds && <p className="text-muted-foreground">Use of funds: {app.use_of_funds}</p>}</div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="grid gap-2"><h3 className="text-sm font-semibold">Jury rounds</h3>
        {[1, 2].map(r => { const sc = roundScore(mine, r); const cleared = mine.some(e => e.round === r && e.decision === 'cleared'); return <div key={r} className="rounded-md border border-border p-2 text-sm"><b>Round {r}</b> {cleared ? <Pill tone="success">Cleared</Pill> : <Pill tone="warning">Pending</Pill>} <span className="text-muted-foreground">{sc.count} juror(s){sc.average != null && ` · avg ${sc.average}/40`}</span>
          {mine.filter(e => e.round === r).map(e => <p key={e.id} className="mt-1 text-xs">{label({ cleared: 'Cleared', revise: 'Revise', rejected: 'Rejected' }, e.decision)} — {e.innovation + e.market + e.team + e.feasibility}/40 {e.remarks && `· ${e.remarks}`}</p>)}</div>; })}
        {canJury && <JuryForm appId={app.id} />}
      </div>
      <div className="grid content-start gap-2"><h3 className="text-sm font-semibold">Stage history</h3>
        {(hist.data ?? []).filter(h => h.application_id === app.id).map(h => <p key={h.id} className="text-xs"><span className="text-muted-foreground">{date(h.created_at)}</span> → {stageName(h.to_stage)} <Pill tone={toneFor(h.status ?? '')}>{label(appStatusLabels, h.status ?? '')}</Pill> {h.note}</p>)}
      </div>
    </div>
    {isAdmin && <div className="mt-4 rounded-md border border-border p-3"><h3 className="mb-2 text-sm font-semibold">Move file (Admin)</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Stage"><select className={inputCls} value={move.stage} onChange={e => setMove({ ...move, stage: e.target.value })}>{st.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Status"><select className={inputCls} value={move.status} onChange={e => setMove({ ...move, status: e.target.value })}>{Object.entries(appStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Note (shown in history)"><input className={inputCls} value={move.note} onChange={e => setMove({ ...move, note: e.target.value })} /></Field>
      </div>
      <Field label="Next action for the startup (shown on their portal)"><input className={inputCls} value={move.next_action} onChange={e => setMove({ ...move, next_action: e.target.value })} /></Field>
      {block && <p className="mt-2 text-sm text-destructive">Jury Round {block} must be cleared first — it is mandatory.</p>}
      <Button className="mt-3" disabled={a.busy || !!block} onClick={() => void a.run(async () => { must(await supabase.rpc('funding_move', { _app: app.id, _stage: move.stage, _status: move.status, _note: move.note })); must(await supabase.from('funding_applications').update({ next_action: move.next_action }).eq('id', app.id)); }, 'File updated.')}>Save</Button>
    </div>}
    <div className="mt-4"><h3 className="mb-2 text-sm font-semibold">Documents</h3>
      {fileDocs.length === 0 ? <p className="text-sm text-muted-foreground">No documents yet.</p> : <DocTable docs={fileDocs} canReview />}
      <div className="mt-2 flex flex-wrap items-end gap-2"><Field label="Request a document"><select className={inputCls} value={docType} onChange={e => setDocType(e.target.value)}><option value="">Select</option>{(categoryDocs[app.category as Category] ?? categoryDocs.other).map(d => <option key={d}>{d}</option>)}<option>Other</option></select></Field>
        <Button variant="outline" disabled={a.busy || !docType} onClick={() => void a.run(async () => { const { data: u } = await supabase.auth.getUser(); must(await supabase.from('venture_documents').insert({ client_id: app.client_id, application_id: app.id, doc_type: docType, requested_by: u.user?.id ?? null })); setDocType(''); }, 'Document requested — the client sees it on their portal.')}>Request</Button></div>
    </div>
    <Status a={a} />
  </Panel>;
}

export function DocTable({ docs, canReview }: { docs: ReturnType<typeof useDocs>['data'] & {}; canReview?: boolean }) {
  const a = useAct(); const [note, setNote] = useState<Record<string, string>>({});
  return <><Table head={['Document', 'Status', 'File', ...(canReview ? ['Review'] : [])]}>{docs.map(d => <tr key={d.id}><Td>{d.doc_type}{d.review_note && <div className="text-xs text-muted-foreground">{d.review_note}</div>}</Td><Td><Pill tone={toneFor(d.status)}>{label(docStatusLabels, d.status)}</Pill></Td>
    <Td>{d.file_path ? <Button size="sm" variant="outline" onClick={() => void a.run(() => openDoc(d.file_path!), '')}>Open</Button> : '—'}</Td>
    {canReview && <Td>{d.file_path && <div className="flex flex-wrap gap-1"><input className={inputCls} placeholder="Note" value={note[d.id] ?? ''} onChange={e => setNote({ ...note, [d.id]: e.target.value })} /><Button size="sm" onClick={() => void a.run(async () => must(await supabase.from('venture_documents').update({ status: 'approved', review_note: note[d.id] ?? '' }).eq('id', d.id)), 'Approved.')}>Approve</Button><Button size="sm" variant="outline" onClick={() => void a.run(async () => must(await supabase.from('venture_documents').update({ status: 'changes_requested', review_note: note[d.id] || 'Please upload a corrected file.' }).eq('id', d.id)), 'Changes requested.')}>Changes</Button></div>}</Td>}
  </tr>)}</Table><Status a={a} /></>;
}

function JuryForm({ appId }: { appId: string }) {
  const a = useAct(); const [f, setF] = useState({ round: '1', innovation: '7', market: '7', team: '7', feasibility: '7', decision: 'cleared', remarks: '', public_remarks: '' });
  const n = (k: 'innovation' | 'market' | 'team' | 'feasibility') => <Field label={`${k[0]!.toUpperCase()}${k.slice(1)} (1–10)`}><input type="number" min="1" max="10" className={inputCls} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></Field>;
  return <div className="rounded-md border border-border p-2"><p className="mb-2 text-sm font-semibold">My jury scorecard</p>
    <div className="grid grid-cols-2 gap-2"><Field label="Round"><select className={inputCls} value={f.round} onChange={e => setF({ ...f, round: e.target.value })}><option value="1">Round 1</option><option value="2">Round 2</option></select></Field>
      <Field label="Decision"><select className={inputCls} value={f.decision} onChange={e => setF({ ...f, decision: e.target.value })}><option value="cleared">Cleared</option><option value="revise">Revise</option><option value="rejected">Rejected</option></select></Field>{n('innovation')}{n('market')}{n('team')}{n('feasibility')}</div>
    <Field label="Internal remarks"><textarea className={areaCls} value={f.remarks} onChange={e => setF({ ...f, remarks: e.target.value })} /></Field>
    <Field label="Feedback for the startup (optional, visible to them)"><textarea className={areaCls} value={f.public_remarks} onChange={e => setF({ ...f, public_remarks: e.target.value })} /></Field>
    <Button size="sm" className="mt-2" disabled={a.busy} onClick={() => void a.run(async () => {
      const sc = (k: string) => { const v = Math.round(Number(k)); if (!(v >= 1 && v <= 10)) throw new Error('Scores must be 1–10.'); return v; };
      const { data: u } = await supabase.auth.getUser();
      must(await supabase.from('jury_evaluations').upsert({ application_id: appId, round: Number(f.round), juror_id: u.user!.id, innovation: sc(f.innovation), market: sc(f.market), team: sc(f.team), feasibility: sc(f.feasibility), decision: f.decision, remarks: f.remarks, public_remarks: f.public_remarks }, { onConflict: 'application_id,round,juror_id' }));
    }, 'Scorecard saved.')}>Save scorecard</Button><Status a={a} /></div>;
}

/** Admin: add, rename, reorder or switch off stages. Jury rounds stay. Also manage jurors. */
export function StageManager() {
  const stages = useStages(); const a = useAct(); const [nw, setNw] = useState({ name: '', description: '', required_docs: '' });
  const list = stages.data ?? [];
  const swap = (i: number, j: number) => a.run(async () => { const x = list[i]!, y = list[j]!; must(await supabase.from('funding_stages').update({ position: y.position }).eq('id', x.id)); must(await supabase.from('funding_stages').update({ position: x.position }).eq('id', y.id)); }, 'Order changed.');
  return <div className="grid gap-5"><Panel title="Funding stages">
    <p className="mb-3 text-xs text-muted-foreground">Add, rename, reorder or switch off stages. Jury Scanning Round 1 and Round 2 are mandatory for all and cannot be switched off or removed.</p>
    {stages.isPending ? <Loading /> : <div className="grid gap-2">{list.map((s, i) => <StageRow key={s.id} s={s} up={i > 0 ? () => void swap(i, i - 1) : undefined} down={i < list.length - 1 ? () => void swap(i, i + 1) : undefined} />)}</div>}
    <div className="mt-4 grid gap-2 sm:grid-cols-3"><Field label="New stage name"><input className={inputCls} value={nw.name} onChange={e => setNw({ ...nw, name: e.target.value })} /></Field><Field label="Description"><input className={inputCls} value={nw.description} onChange={e => setNw({ ...nw, description: e.target.value })} /></Field><Field label="Documents needed"><input className={inputCls} value={nw.required_docs} onChange={e => setNw({ ...nw, required_docs: e.target.value })} /></Field></div>
    <Button className="mt-2" disabled={a.busy} onClick={() => void a.run(async () => { if (nw.name.trim().length < 2) throw new Error('Enter a stage name.'); must(await supabase.from('funding_stages').insert({ ...nw, name: nw.name.trim(), position: Math.max(0, ...list.map(s => s.position)) + 10 })); setNw({ name: '', description: '', required_docs: '' }); }, 'Stage added at the end — move it up to place it.')}>Add stage</Button>
    <Status a={a} /></Panel><Jurors /><ServiceCatalog /></div>;
}
function StageRow({ s, up, down }: { s: ReturnType<typeof useStages>['data'] extends (infer T)[] | undefined ? T : never; up: (() => void) | undefined; down: (() => void) | undefined }) {
  const a = useAct(); const [f, setF] = useState({ name: s.name, description: s.description, required_docs: s.required_docs });
  return <div className="rounded-md border border-border p-2"><div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
    <input className={inputCls} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /><input className={inputCls} placeholder="Description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /><input className={inputCls} placeholder="Documents" value={f.required_docs} onChange={e => setF({ ...f, required_docs: e.target.value })} />
    <div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" disabled={!up} onClick={up}>↑</Button><Button size="sm" variant="outline" disabled={!down} onClick={down}>↓</Button>
      <Button size="sm" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.from('funding_stages').update(f).eq('id', s.id)))}>Save</Button>
      {!s.jury_round && <Button size="sm" variant="outline" onClick={() => void a.run(async () => must(await supabase.from('funding_stages').update({ active: !s.active }).eq('id', s.id)), s.active ? 'Switched off.' : 'Switched on.')}>{s.active ? 'Switch off' : 'Switch on'}</Button>}
      {!s.jury_round && <Button size="sm" variant="outline" onClick={() => void a.run(async () => must(await supabase.from('funding_stages').delete().eq('id', s.id)), 'Removed.')}>Remove</Button>}</div></div>
    <p className="mt-1 text-xs text-muted-foreground">{s.jury_round ? `Mandatory jury round ${s.jury_round}` : s.active ? 'Active' : 'Switched off'}</p><Status a={a} /></div>;
}
function Jurors() {
  const a = useAct(); const bdes = useBdes(); const [uid, setUid] = useState(''); const [nm, setNm] = useState('');
  const [list, setList] = useState<{ user_id: string; name: string; active: boolean }[] | null>(null);
  const load = async () => setList(must(await supabase.from('venture_jurors').select('user_id, name, active').order('name')) as { user_id: string; name: string; active: boolean }[]);
  useEffect(() => { void load(); }, []);
  return <Panel title="Jury members">
    <p className="mb-2 text-xs text-muted-foreground">Admins can always score. Add employees who sit on the jury panel.</p>
    {list?.map(j => <div key={j.user_id} className="flex items-center justify-between border-b border-border py-1 text-sm"><span>{j.name || j.user_id.slice(0, 8)} {!j.active && <Pill>Off</Pill>}</span><Button size="sm" variant="outline" onClick={() => void a.run(async () => { must(await supabase.from('venture_jurors').update({ active: !j.active }).eq('user_id', j.user_id)); await load(); })}>{j.active ? 'Remove from panel' : 'Add back'}</Button></div>)}
    <div className="mt-2 flex flex-wrap items-end gap-2"><Field label="Employee"><select className={inputCls} value={uid} onChange={e => { setUid(e.target.value); setNm(bdes.data?.find(b => b.user_id === e.target.value)?.name ?? ''); }}><option value="">Select</option>{bdes.data?.map(b => <option key={b.user_id} value={b.user_id}>{b.name}</option>)}</select></Field>
      <Button disabled={!uid || a.busy} onClick={() => void a.run(async () => { must(await supabase.from('venture_jurors').upsert({ user_id: uid, name: nm, active: true })); setUid(''); await load(); }, 'Juror added.')}>Add juror</Button></div><Status a={a} /></Panel>;
}
function ServiceCatalog() {
  const s = useServices(); const a = useAct(); const [f, setF] = useState({ name: '', pillar: 'startup', description: '', price_note: '' });
  return <Panel title="Service catalogue (shown on client portal)">
    {s.data?.map(x => <div key={x.id} className="flex items-center justify-between border-b border-border py-1 text-sm"><span><b>{x.name}</b> <span className="text-muted-foreground">{x.pillar} {x.price_note}</span></span><Button size="sm" variant="outline" onClick={() => void a.run(async () => must(await supabase.from('venture_services').update({ active: !x.active }).eq('id', x.id)))}>{x.active ? 'Hide' : 'Show'}</Button></div>)}
    <div className="mt-2 grid gap-2 sm:grid-cols-4"><input className={inputCls} placeholder="Service name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /><select className={inputCls} value={f.pillar} onChange={e => setF({ ...f, pillar: e.target.value })}>{['startup', 'manpower', 'funding', 'business'].map(p => <option key={p}>{p}</option>)}</select><input className={inputCls} placeholder="Description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /><input className={inputCls} placeholder="Price note (optional)" value={f.price_note} onChange={e => setF({ ...f, price_note: e.target.value })} /></div>
    <Button className="mt-2" disabled={a.busy || f.name.trim().length < 2} onClick={() => void a.run(async () => { must(await supabase.from('venture_services').insert({ ...f, position: (s.data?.length ?? 0) * 10 + 10 })); setF({ name: '', pillar: 'startup', description: '', price_note: '' }); })}>Add service</Button><Status a={a} /></Panel>;
}

/** Service orders (cross-sell/upsell), manpower requirements and client tickets. */
export function ServiceOrders() {
  const o = useOrders(); const s = useServices(); const c = useClients(); const a = useAct(); const [edit, setEdit] = useState<Record<string, { status: string; amount: string; progress_note: string }>>({});
  const nm = (id: string) => c.data?.find(x => x.id === id)?.name ?? '—';
  return <Panel title="Service requests & active services">{o.isPending ? <Loading /> : !o.data?.length ? <Empty>No service requests yet.</Empty> :
    <Table head={['Client', 'Service', 'Client note', 'Status / amount / progress', '']}>{o.data.map(x => { const e = edit[x.id] ?? { status: x.status, amount: x.amount?.toString() ?? '', progress_note: x.progress_note }; return <tr key={x.id}><Td>{nm(x.client_id)}<div className="text-xs text-muted-foreground">{date(x.created_at)}</div></Td><Td>{s.data?.find(y => y.id === x.service_id)?.name ?? '—'}</Td><Td className="max-w-56 text-xs">{x.client_note}</Td>
      <Td><div className="grid gap-1"><select className={inputCls} value={e.status} onChange={ev => setEdit({ ...edit, [x.id]: { ...e, status: ev.target.value } })}>{Object.entries(orderStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><input className={inputCls} type="number" placeholder="Amount ₹" value={e.amount} onChange={ev => setEdit({ ...edit, [x.id]: { ...e, amount: ev.target.value } })} /><input className={inputCls} placeholder="Progress note for client" value={e.progress_note} onChange={ev => setEdit({ ...edit, [x.id]: { ...e, progress_note: ev.target.value } })} /></div></Td>
      <Td><Button size="sm" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.from('venture_orders').update({ status: e.status, amount: e.amount ? Number(e.amount) : null, progress_note: e.progress_note }).eq('id', x.id)))}>Save</Button></Td></tr>; })}</Table>}<Status a={a} /></Panel>;
}
export function ManpowerDesk() {
  const m = useManpower(); const c = useClients(); const a = useAct(); const [edit, setEdit] = useState<Record<string, { status: string; filled: string; update_note: string }>>({});
  const nm = (id: string) => c.data?.find(x => x.id === id)?.name ?? '—';
  return <Panel title="Manpower requirements (sales → fulfilment → deployment)">{m.isPending ? <Loading /> : !m.data?.length ? <Empty>No manpower requirements yet.</Empty> :
    <Table head={['Client', 'Role', 'Details', 'Progress', '']}>{m.data.map(x => { const e = edit[x.id] ?? { status: x.status, filled: String(x.filled), update_note: x.update_note }; return <tr key={x.id}><Td>{nm(x.client_id)}</Td><Td><b>{x.role_title}</b><div className="text-xs">{x.filled}/{x.headcount} filled</div></Td><Td className="text-xs">{[x.experience, x.shift, x.budget, x.location].filter(Boolean).join(' · ')}<div className="text-muted-foreground">{x.description}</div></Td>
      <Td><div className="grid gap-1"><select className={inputCls} value={e.status} onChange={ev => setEdit({ ...edit, [x.id]: { ...e, status: ev.target.value } })}>{Object.entries(manpowerStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><input className={inputCls} type="number" min="0" max={x.headcount} value={e.filled} onChange={ev => setEdit({ ...edit, [x.id]: { ...e, filled: ev.target.value } })} /><input className={inputCls} placeholder="Update for client" value={e.update_note} onChange={ev => setEdit({ ...edit, [x.id]: { ...e, update_note: ev.target.value } })} /></div></Td>
      <Td><Button size="sm" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.from('manpower_requirements').update({ status: e.status, filled: Math.min(x.headcount, Math.max(0, Number(e.filled) || 0)), update_note: e.update_note }).eq('id', x.id)))}>Save</Button></Td></tr>; })}</Table>}<Status a={a} /></Panel>;
}
export function ClientTickets() {
  const t = useTickets(); const c = useClients(); const a = useAct(); const [reply, setReply] = useState<Record<string, string>>({});
  const nm = (id: string) => c.data?.find(x => x.id === id)?.name ?? '—';
  return <Panel title="Client support tickets">{t.isPending ? <Loading /> : !t.data?.length ? <Empty>No tickets.</Empty> : <div className="grid gap-3">{t.data.map(x => <div key={x.id} className="rounded-md border border-border p-3 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><b>{x.subject}</b><Pill tone={toneFor(x.status)}>{x.status.replace('_', ' ')}</Pill></div><p className="text-xs text-muted-foreground">{nm(x.client_id)} · {x.topic} · {date(x.created_at)}</p><p className="mt-1 whitespace-pre-wrap">{x.body}</p>
    <textarea className={`${areaCls} mt-2`} placeholder="Reply to client" value={reply[x.id] ?? x.reply} onChange={e => setReply({ ...reply, [x.id]: e.target.value })} />
    <div className="mt-2 flex gap-2"><Button size="sm" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.from('venture_tickets').update({ reply: reply[x.id] ?? x.reply, status: 'in_progress' }).eq('id', x.id)))}>Reply</Button><Button size="sm" variant="outline" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.from('venture_tickets').update({ reply: reply[x.id] ?? x.reply, status: 'resolved' }).eq('id', x.id)))}>Resolve</Button></div></div>)}</div>}<Status a={a} /></Panel>;
}
