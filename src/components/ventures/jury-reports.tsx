import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { downloadCsv } from '@/lib/finance';
import { appStatusLabels, averageDaysPerStage, categories, categoryLabels, juryTally, orderedStages, roundScore } from '@/lib/ventures/rules';
import { inr, must, useAct, useApps, useBdes, useClients, useDocs, useEvals, useHistory, useMpInvoices, useOrders, useStages, useTickets, type App, type Evaluation } from './data';
import { DocTable } from './desk';

const lbl = (m: Record<string, string>, k: string) => m[k] ?? k;
const total = (e: Evaluation) => e.innovation + e.market + e.team + e.feasibility;

/** Jury desk: files waiting for each mandatory round, my scorecards, and (Admin) the whole panel's scores. */
export function JuryDesk({ isAdmin, uid }: { isAdmin: boolean; uid: string }) {
  const apps = useApps(); const stages = useStages(); const clients = useClients(); const evals = useEvals();
  const [filter, setFilter] = useState<'waiting' | 'mine' | 'all'>('waiting'); const [open, setOpen] = useState<string | null>(null);
  const [jurors, setJurors] = useState<{ user_id: string; name: string }[]>([]);
  useEffect(() => { void supabase.from('venture_jurors').select('user_id,name').then(({ data }) => setJurors((data ?? []) as { user_id: string; name: string }[])); }, []);
  if (apps.isPending || stages.isPending || evals.isPending) return <Loading />;
  const st = orderedStages(stages.data ?? []); const E = evals.data ?? [];
  const juryStages = st.filter(s => s.jury_round != null);
  const roundOf = (a: App) => st.find(s => s.id === a.stage_id)?.jury_round ?? null;
  const mine = (a: App, r: number) => E.find(e => e.application_id === a.id && e.round === r && e.juror_id === uid);
  const active = (apps.data ?? []).filter(a => a.status === 'active' || a.status === 'on_hold');
  const list = active.filter(a => filter === 'all' ? true : filter === 'waiting' ? roundOf(a) != null : E.some(e => e.application_id === a.id && e.juror_id === uid));
  const pendingForMe = active.filter(a => { const r = roundOf(a); return r != null && !mine(a, r); }).length;
  const name = (id: string) => clients.data?.find(c => c.id === id)?.name ?? '—';
  const cur = list.find(a => a.id === open) ?? active.find(a => a.id === open);
  return <div className="grid gap-5">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="dash-card p-4"><p className="text-xs text-muted-foreground">Waiting for my scorecard</p><p className="mt-1 text-2xl font-bold">{pendingForMe}</p></div>
      {juryStages.map(s => <div key={s.id} className="dash-card p-4"><p className="text-xs text-muted-foreground">At {s.name}</p><p className="mt-1 text-2xl font-bold">{active.filter(a => a.stage_id === s.id).length}</p></div>)}
      <div className="dash-card p-4"><p className="text-xs text-muted-foreground">Scorecards I have given</p><p className="mt-1 text-2xl font-bold">{E.filter(e => e.juror_id === uid).length}</p></div>
    </div>
    <Panel title="Jury queue" actions={<select aria-label="Show" className={`${inputCls} w-52`} value={filter} onChange={e => setFilter(e.target.value as typeof filter)}><option value="waiting">Files at a jury round</option><option value="mine">Files I have scored</option><option value="all">All active files</option></select>}>
      <p className="mb-3 text-xs text-muted-foreground">Jury Round 1 and Round 2 are mandatory for every file. A file moves past a round only after it is cleared. Scores: innovation, market, team and feasibility, 1–10 each (out of 40).</p>
      {!list.length ? <Empty>No files here.</Empty> : <Table head={['Startup', 'Category / ask', 'Stage', 'Round 1', 'Round 2', 'My scorecard', '']}>{list.map(a => { const r = roundOf(a); return <tr key={a.id} className={`border-b border-border ${open === a.id ? 'bg-muted/40' : ''}`}>
        <Td className="font-medium">{name(a.client_id)}</Td><Td>{lbl(categoryLabels, a.category)}<div className="text-xs text-muted-foreground">{inr(a.funding_ask)}</div></Td>
        <Td>{st.find(s => s.id === a.stage_id)?.name ?? '—'}{r != null && <> <Pill tone="warning">Jury</Pill></>}</Td>
        {[1, 2].map(n => { const sc = roundScore(E.filter(e => e.application_id === a.id), n); const t = juryTally(E.filter(e => e.application_id === a.id), n); return <Td key={n} className="text-xs">{sc.count ? <>{sc.count} juror(s) · avg {sc.average}/40<br /><span className="text-[var(--dash-success)]">{t.cleared} cleared</span> · {t.revise} revise · <span className="text-destructive">{t.rejected} rejected</span></> : <span className="text-muted-foreground">Not scored</span>}</Td>; })}
        <Td>{r == null ? '—' : mine(a, r) ? <Pill tone="success">Given (R{r})</Pill> : <Pill tone="warning">Pending (R{r})</Pill>}</Td>
        <Td><Button size="sm" variant={open === a.id ? 'default' : 'outline'} onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? 'Close' : 'Review & score'}</Button></Td></tr>; })}</Table>}
    </Panel>
    {cur && <JuryFile app={cur} clientName={name(cur.client_id)} round={roundOf(cur) ?? 1} uid={uid} isAdmin={isAdmin} jurors={jurors} evals={E.filter(e => e.application_id === cur.id)} />}
  </div>;
}

function JuryFile({ app, clientName, round, uid, isAdmin, jurors, evals }: { app: App; clientName: string; round: number; uid: string; isAdmin: boolean; jurors: { user_id: string; name: string }[]; evals: Evaluation[] }) {
  const clients = useClients(); const docs = useDocs(); const a = useAct();
  const c = clients.data?.find(x => x.id === app.client_id);
  const [r, setR] = useState(String(round));
  const existing = evals.find(e => e.juror_id === uid && e.round === Number(r));
  const blank = { innovation: '7', market: '7', team: '7', feasibility: '7', decision: 'cleared', remarks: '', public_remarks: '' };
  const [f, setF] = useState(blank);
  useEffect(() => { setF(existing ? { innovation: String(existing.innovation), market: String(existing.market), team: String(existing.team), feasibility: String(existing.feasibility), decision: existing.decision, remarks: existing.remarks, public_remarks: existing.public_remarks } : blank); }, [existing?.id, r]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = (k: 'innovation' | 'market' | 'team' | 'feasibility', label: string) => <Field label={`${label} (1–10)`}><input type="number" min="1" max="10" className={inputCls} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></Field>;
  const fileDocs = (docs.data ?? []).filter(d => d.client_id === app.client_id && d.file_path);
  const jname = (id: string) => id === uid ? 'You' : jurors.find(j => j.user_id === id)?.name || 'Juror';
  return <Panel title={`${clientName} — jury review`} actions={<Pill tone="info">{lbl(appStatusLabels, app.status)}</Pill>}>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid content-start gap-2 text-sm">
        <h3 className="font-semibold">About the startup</h3>
        <dl className="grid grid-cols-[8rem_1fr] gap-1"><dt className="text-muted-foreground">Sector</dt><dd>{c?.sector || '—'}</dd><dt className="text-muted-foreground">Founder</dt><dd>{c?.founder_name || '—'}</dd><dt className="text-muted-foreground">Category</dt><dd>{lbl(categoryLabels, app.category)}</dd><dt className="text-muted-foreground">Funding ask</dt><dd>{inr(app.funding_ask)} ({app.funding_type})</dd><dt className="text-muted-foreground">Use of funds</dt><dd>{app.use_of_funds || '—'}</dd><dt className="text-muted-foreground">Team size</dt><dd>{c?.team_size ?? '—'}</dd><dt className="text-muted-foreground">Monthly revenue</dt><dd>{inr(c?.monthly_revenue ?? null)}</dd></dl>
        {c?.pitch && <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-2">{c.pitch}</p>}
        <h3 className="mt-2 font-semibold">Documents</h3>{fileDocs.length ? <DocTable docs={fileDocs} /> : <p className="text-muted-foreground">No documents uploaded yet.</p>}
      </div>
      <div className="grid content-start gap-2">
        <h3 className="text-sm font-semibold">{existing ? 'Update my scorecard' : 'My scorecard'}</h3>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Round"><select className={inputCls} value={r} onChange={e => setR(e.target.value)}><option value="1">Round 1</option><option value="2">Round 2</option></select></Field>
          <Field label="Decision"><select className={inputCls} value={f.decision} onChange={e => setF({ ...f, decision: e.target.value })}><option value="cleared">Cleared</option><option value="revise">Revise</option><option value="rejected">Rejected</option></select></Field>
          {n('innovation', 'Innovation')}{n('market', 'Market')}{n('team', 'Team')}{n('feasibility', 'Feasibility')}
        </div>
        <p className="text-sm">Total: <b>{['innovation', 'market', 'team', 'feasibility'].reduce((t, k) => t + (Number(f[k as 'team']) || 0), 0)}/40</b></p>
        <Field label="Internal remarks (jury and Admin only)"><textarea className={areaCls} value={f.remarks} onChange={e => setF({ ...f, remarks: e.target.value })} /></Field>
        <Field label="Feedback for the startup (optional, shown on their portal)"><textarea className={areaCls} value={f.public_remarks} onChange={e => setF({ ...f, public_remarks: e.target.value })} /></Field>
        <div><Button disabled={a.busy} onClick={() => void a.run(async () => {
          const sc = (v: string) => { const x = Math.round(Number(v)); if (!(x >= 1 && x <= 10)) throw new Error('Scores must be 1 to 10.'); return x; };
          must(await supabase.from('jury_evaluations').upsert({ application_id: app.id, round: Number(r), juror_id: uid, innovation: sc(f.innovation), market: sc(f.market), team: sc(f.team), feasibility: sc(f.feasibility), decision: f.decision, remarks: f.remarks, public_remarks: f.public_remarks }, { onConflict: 'application_id,round,juror_id' }));
        }, 'Scorecard saved.')}>{existing ? 'Update scorecard' : 'Save scorecard'}</Button></div>
        <ErrorNote error={a.error} />{a.notice && <p role="status" className="text-sm text-muted-foreground">{a.notice}</p>}
      </div>
    </div>
    <div className="mt-4"><h3 className="mb-2 text-sm font-semibold">{isAdmin ? 'Whole panel' : 'Panel scores'}</h3>
      {!evals.length ? <Empty>No scorecards yet.</Empty> : <Table head={['Round', 'Juror', 'Innovation', 'Market', 'Team', 'Feasibility', 'Total', 'Decision', 'Remarks']}>{[...evals].sort((x, y) => x.round - y.round).map(e => <tr key={e.id} className="border-b border-border"><Td>R{e.round}</Td><Td>{jname(e.juror_id)}</Td><Td>{e.innovation}</Td><Td>{e.market}</Td><Td>{e.team}</Td><Td>{e.feasibility}</Td><Td className="font-semibold">{total(e)}/40</Td><Td><Pill tone={e.decision === 'cleared' ? 'success' : e.decision === 'rejected' ? 'danger' : 'warning'}>{e.decision}</Pill></Td><Td className="max-w-56 text-xs">{e.remarks}</Td></tr>)}</Table>}
    </div>
  </Panel>;
}

/** Ventures reports for a date range: funding funnel, categories, stage time, BDE-wise, services, support and manpower billing. */
export function VenturesReports() {
  const apps = useApps(); const stages = useStages(); const clients = useClients(); const evals = useEvals(); const hist = useHistory(); const bdes = useBdes(); const orders = useOrders(); const tickets = useTickets(); const inv = useMpInvoices();
  const today = new Date().toISOString().slice(0, 10);
  const [range, setRange] = useState({ from: `${today.slice(0, 4)}-01-01`, to: today });
  if (apps.isPending || stages.isPending || clients.isPending || hist.isPending) return <Loading />;
  const inR = (d: string) => d.slice(0, 10) >= range.from && d.slice(0, 10) <= range.to;
  const A = (apps.data ?? []).filter(a => inR(a.created_at)); const H = hist.data ?? []; const E = evals.data ?? [];
  const fundedIds = new Set(H.filter(h => h.status === 'funded' && inR(h.created_at)).map(h => h.application_id));
  const funded = (apps.data ?? []).filter(a => fundedIds.has(a.id));
  const st = orderedStages(stages.data ?? []); const dwell = averageDaysPerStage(H.map(h => ({ application_id: h.application_id, to_stage: h.to_stage, created_at: h.created_at })));
  const avgScore = (ids: string[]) => { const l = E.filter(e => ids.includes(e.application_id)); return l.length ? Math.round(l.reduce((t, e) => t + total(e), 0) / l.length * 10) / 10 : null; };
  const cats = categories.map(c => { const l = A.filter(a => a.category === c); return { category: categoryLabels[c], files: l.length, active: l.filter(a => a.status === 'active').length, funded: l.filter(a => a.status === 'funded').length, rejected: l.filter(a => a.status === 'rejected').length, avg_jury: avgScore(l.map(a => a.id)) }; }).filter(r => r.files);
  const C = clients.data ?? [];
  const byBde = (bdes.data ?? []).map(b => { const mine = C.filter(c => c.assigned_bde === b.user_id); const ids = mine.map(c => c.id); const files = A.filter(a => ids.includes(a.client_id)); return { name: b.name, role: b.role, clients: mine.filter(c => inR(c.created_at)).length, files: files.length, funded: funded.filter(a => ids.includes(a.client_id)).length }; }).filter(r => r.clients || r.files || r.funded);
  const O = (orders.data ?? []).filter(o => inR(o.created_at)); const T = (tickets.data ?? []).filter(t => inR(t.created_at));
  const paid = (inv.data ?? []).filter(i => i.status === 'paid' && i.paid_at && inR(i.paid_at));
  const stat = (t: string, v: string | number) => <div className="dash-card p-3"><p className="text-xs text-muted-foreground">{t}</p><p className="mt-1 text-xl font-bold tabular-nums">{v}</p></div>;
  return <div className="grid gap-5">
    <Panel title="Report period" actions={<><input type="date" aria-label="From" className={`${inputCls} w-40`} value={range.from} max={range.to} onChange={e => setRange({ ...range, from: e.target.value })} /><input type="date" aria-label="To" className={`${inputCls} w-40`} value={range.to} min={range.from} onChange={e => setRange({ ...range, to: e.target.value })} /></>}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stat('New clients', C.filter(c => inR(c.created_at)).length)}{stat('Funding files opened', A.length)}{stat('Funded', funded.length)}{stat('Amount funded (ask)', inr(funded.reduce((t, a) => t + (a.funding_ask ?? 0), 0)))}
        {stat('Not selected', A.filter(a => a.status === 'rejected').length)}{stat('Average jury score', avgScore(A.map(a => a.id)) ?? '—')}
        {stat('Service requests', O.length)}{stat('Services delivered', O.filter(o => o.status === 'delivered').length)}{stat('Service value', inr(O.filter(o => o.status !== 'cancelled').reduce((t, o) => t + (o.amount ?? 0), 0)))}
        {stat('Client tickets', T.length)}{stat('Tickets resolved', T.filter(t => t.status === 'resolved').length)}{stat('Manpower invoices paid', inr(paid.reduce((t, i) => t + Number(i.total), 0)))}
      </div>
    </Panel>
    <Panel title="By category" actions={cats.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv('ventures-categories.csv', cats)}>Download CSV</Button> : undefined}>{!cats.length ? <Empty>No files in this period.</Empty> : <Table head={['Category', 'Files', 'In progress', 'Funded', 'Not selected', 'Avg jury score']}>{cats.map(r => <tr key={r.category} className="border-b border-border"><Td className="font-medium">{r.category}</Td><Td>{r.files}</Td><Td>{r.active}</Td><Td>{r.funded}</Td><Td>{r.rejected}</Td><Td>{r.avg_jury ?? '—'}</Td></tr>)}</Table>}</Panel>
    <Panel title="Funding stages: files now and average days spent" actions={<Button size="sm" variant="outline" onClick={() => downloadCsv('ventures-stages.csv', st.map(s => ({ stage: s.name, files_now: (apps.data ?? []).filter(a => a.stage_id === s.id && a.status === 'active').length, avg_days: dwell[s.id] ?? '' })))}>Download CSV</Button>}>
      <Table head={['Stage', 'Files now', 'Average days in stage']}>{st.map(s => <tr key={s.id} className="border-b border-border"><Td>{s.name}{s.jury_round && <> <Pill tone="warning">Mandatory jury</Pill></>}</Td><Td>{(apps.data ?? []).filter(a => a.stage_id === s.id && a.status === 'active').length}</Td><Td>{dwell[s.id] ?? '—'}</Td></tr>)}</Table></Panel>
    <Panel title="BDE / BDM performance" actions={byBde.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv('ventures-bde.csv', byBde)}>Download CSV</Button> : undefined}>{!byBde.length ? <Empty>No assigned clients in this period.</Empty> : <Table head={['Person', 'Role', 'New clients', 'Funding files', 'Funded']}>{byBde.map(r => <tr key={r.name + r.role} className="border-b border-border"><Td className="font-medium">{r.name}</Td><Td>{r.role}</Td><Td>{r.clients}</Td><Td>{r.files}</Td><Td>{r.funded}</Td></tr>)}</Table>}</Panel>
  </div>;
}
