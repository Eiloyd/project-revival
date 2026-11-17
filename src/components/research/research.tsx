import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Send, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KpiCard } from '@/components/dashboard/shell';
import { deliveryProgress, difficulties, isFresh, researchDueDate, type Difficulty } from '@/lib/research';
import { shortDate, todayIST } from '@/lib/requests';
import { downloadCsv } from '@/lib/finance';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';

type RR = { id: string; code: string; title: string; requester_name: string; department: string; criteria: string; industry: string; location: string; quantity: number; difficulty: string; due_date: string; status: string; created_at: string; requested_by: string };
const statusTone = { open: 'warning', in_progress: 'info', partial: 'info', delivered: 'success', cancelled: 'muted' } as const;
const leadCols = 'id,company,contact_name,designation,phone,email,website,industry,location,notes,verified_at';

function useRequestLeads(id: string | null) {
  return useQuery({ queryKey: ['research-leads', id], enabled: Boolean(id), queryFn: async () => {
    const { data, error } = await supabase.from('research_request_leads').select(`reused,delivered_at,research_leads(${leadCols})`).eq('request_id', id!);
    if (error) throw error; return data;
  } });
}

/** Any employee: ask Lead Research for leads, track partial delivery, download delivered leads and rate them. */
export function MyLeadRequests({ uid }: { uid: string }) {
  const qc = useQueryClient(); const [creating, setCreating] = useState(false); const [open, setOpen] = useState<RR | null>(null);
  const q = useQuery({ queryKey: ['research', 'mine', uid], queryFn: async () => { const { data, error } = await supabase.from('research_requests').select('*').eq('requested_by', uid).order('created_at', { ascending: false }); if (error) throw error; return data as RR[]; } });
  return <Panel title="Lead research requests" actions={<Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4" />Request leads</Button>}>
    <p className="mb-3 text-sm text-muted-foreground">The central Lead Research team finds and verifies leads for every department. Verified leads are delivered as they are ready — you do not have to wait for the full number.</p>
    {q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !q.data!.length ? <Empty>No lead requests yet.</Empty> : <RequestList rows={q.data!} onOpen={setOpen} />}
    {creating && <NewLeadRequest onClose={() => setCreating(false)} onDone={() => { setCreating(false); void qc.invalidateQueries({ queryKey: ['research'] }); }} />}
    {open && <RequesterDetail r={open} onClose={() => setOpen(null)} />}
  </Panel>;
}

function RequestList({ rows, onOpen }: { rows: RR[]; onOpen: (r: RR) => void }) {
  return <Table head={['Request', 'From', 'Leads', 'Difficulty', 'Due', 'Status']}>{rows.map(r => <tr key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpen(r)}>
    <Td><span className="block font-mono text-xs text-muted-foreground">{r.code}</span><span className="font-medium">{r.title}</span></Td><Td>{r.requester_name}<span className="block text-xs text-muted-foreground">{r.department}</span></Td>
    <Td>{r.quantity}</Td><Td className="capitalize">{r.difficulty}</Td><Td className={r.due_date < todayIST() && !['delivered', 'cancelled'].includes(r.status) ? 'font-semibold text-[var(--dash-danger)]' : ''}>{shortDate(r.due_date)}</Td>
    <Td><Pill tone={statusTone[r.status as keyof typeof statusTone] ?? 'muted'}>{r.status.replace('_', ' ')}</Pill></Td></tr>)}</Table>;
}

function NewLeadRequest({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [v, setV] = useState({ title: '', criteria: '', industry: '', location: '', quantity: '100', difficulty: 'medium' as Difficulty, department: 'Sales' });
  const [err, setErr] = useState<unknown>(null); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr(null);
    const { error } = await supabase.rpc('research_request_create', { _title: v.title, _criteria: v.criteria, _industry: v.industry, _location: v.location, _quantity: Number(v.quantity), _difficulty: v.difficulty, _department: v.department });
    setBusy(false); if (error) setErr(error); else onDone(); }
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="dash-shell max-h-[92vh] max-w-lg overflow-y-auto"><DialogHeader><DialogTitle>Request leads</DialogTitle></DialogHeader>
    <form onSubmit={e => void submit(e)} className="grid gap-4">
      <Field label="What do you need?"><input className={inputCls} required minLength={3} value={v.title} onChange={e => setV({ ...v, title: e.target.value })} placeholder="e.g. Schools in Patna with 500+ students" /></Field>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Industry"><input className={inputCls} value={v.industry} onChange={e => setV({ ...v, industry: e.target.value })} /></Field><Field label="Location"><input className={inputCls} value={v.location} onChange={e => setV({ ...v, location: e.target.value })} /></Field></div>
      <div className="grid gap-3 sm:grid-cols-3"><Field label="How many"><input type="number" min={1} max={10000} className={inputCls} value={v.quantity} onChange={e => setV({ ...v, quantity: e.target.value })} /></Field>
        <Field label="Difficulty"><select className={inputCls} value={v.difficulty} onChange={e => setV({ ...v, difficulty: e.target.value as Difficulty })}>{difficulties.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></Field>
        <Field label="Department"><input className={inputCls} value={v.department} onChange={e => setV({ ...v, department: e.target.value })} /></Field></div>
      <p className="-mt-2 text-xs text-muted-foreground">Expected by {shortDate(researchDueDate(todayIST(), v.difficulty))} ({difficulties.find(d => d.value === v.difficulty)!.days} working days for {v.difficulty}).</p>
      <Field label="Details for the researcher"><textarea className={areaCls} value={v.criteria} onChange={e => setV({ ...v, criteria: e.target.value })} /></Field>
      <ErrorNote error={err} /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy}>{busy ? 'Sending…' : 'Send request'}</Button></div>
    </form></DialogContent></Dialog>;
}

function RequesterDetail({ r, onClose }: { r: RR; onClose: () => void }) {
  const leads = useRequestLeads(r.id); const qc = useQueryClient();
  const fb = useQuery({ queryKey: ['research-fb', r.id], queryFn: async () => (await supabase.from('research_feedback').select('*').eq('request_id', r.id).maybeSingle()).data });
  const [rel, setRel] = useState(4); const [use, setUse] = useState(4); const [comment, setComment] = useState(''); const [err, setErr] = useState<unknown>(null);
  const rows = (leads.data ?? []).map(x => x.research_leads).filter(Boolean);
  const p = deliveryProgress(rows.length, r.quantity);
  const send = async () => { const { error } = await supabase.from('research_feedback').insert({ request_id: r.id, relevance: rel, usefulness: use, comment }); if (error) setErr(error); else void qc.invalidateQueries({ queryKey: ['research-fb', r.id] }); };
  const cancel = async () => { const { error } = await supabase.rpc('research_cancel', { _request: r.id }); if (error) setErr(error); else { void qc.invalidateQueries({ queryKey: ['research'] }); onClose(); } };
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="dash-shell max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{r.code} · {r.title}</DialogTitle></DialogHeader>
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3"><KpiCard label="Delivered" value={`${p.delivered} / ${r.quantity}`} note={`${p.pct}%`} /><KpiCard label="Still pending" value={p.pending} /><KpiCard label="Due" value={shortDate(r.due_date)} /></div>
      {rows.length > 0 && <div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => downloadCsv(`${r.code}-leads.csv`, rows.map(l => ({ company: l!.company, contact: l!.contact_name, designation: l!.designation, phone: l!.phone, email: l!.email, website: l!.website, industry: l!.industry, location: l!.location })))}>Download leads (CSV)</Button></div>}
      {leads.isPending ? <Loading /> : !rows.length ? <Empty>No leads delivered yet.</Empty> : <LeadTable rows={rows as Lead[]} />}
      {['partial', 'delivered'].includes(r.status) && (fb.data ? <p className="text-sm">Your feedback: relevance {fb.data.relevance}/5 · usefulness {fb.data.usefulness}/5 {fb.data.comment && `— ${fb.data.comment}`}</p> :
        <div className="grid gap-3 rounded-lg border border-border p-4"><p className="text-sm font-semibold">How useful were these leads?</p>
          <div className="flex flex-wrap gap-6"><Stars label="Relevance" value={rel} onChange={setRel} /><Stars label="Usefulness" value={use} onChange={setUse} /></div>
          <textarea className={areaCls} value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional comment" /><Button size="sm" className="justify-self-start" onClick={() => void send()}>Send feedback</Button></div>)}
      <ErrorNote error={err} />
      <div className="flex justify-between">{!['delivered', 'cancelled'].includes(r.status) ? <Button variant="ghost" onClick={() => void cancel()}>Cancel request</Button> : <span />}<Button variant="outline" onClick={onClose}>Close</Button></div>
    </div></DialogContent></Dialog>;
}

function Stars({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return <div className="text-sm"><p className="mb-1">{label}</p><div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" aria-label={`${label} ${n} of 5`} onClick={() => onChange(n)}><Star className={`size-5 ${n <= value ? 'fill-[var(--dash-warning)] text-[var(--dash-warning)]' : 'text-muted-foreground'}`} /></button>)}</div></div>;
}

type Lead = { id: string; company: string; contact_name: string; designation: string; phone: string; email: string; website: string; industry: string; location: string; notes: string; verified_at: string | null };
function LeadTable({ rows, onReverify }: { rows: Lead[]; onReverify?: (id: string, ok: boolean) => void }) {
  return <Table head={['Company', 'Contact', 'Phone / email', 'Industry · location', 'Verified', ...(onReverify ? [''] : [])]}>{rows.map(l => <tr key={l.id}>
    <Td className="font-medium">{l.company}{l.website && <span className="block text-xs text-muted-foreground">{l.website}</span>}</Td><Td>{l.contact_name}<span className="block text-xs text-muted-foreground">{l.designation}</span></Td>
    <Td className="text-xs">{l.phone}<span className="block">{l.email}</span></Td><Td className="text-xs">{l.industry}{l.location && ` · ${l.location}`}</Td>
    <Td>{l.verified_at ? <Pill tone={isFresh(l.verified_at) ? 'success' : 'warning'}>{isFresh(l.verified_at) ? shortDate(l.verified_at) : 'Re-verify'}</Pill> : <Pill tone="muted">Not verified</Pill>}</Td>
    {onReverify && <Td><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => onReverify(l.id, true)}>Still valid</Button><Button size="sm" variant="ghost" onClick={() => onReverify(l.id, false)}>Invalid</Button></div></Td>}
  </tr>)}</Table>;
}

/** Lead Research department desk: every department's requests, lead bank with freshness, reuse and partial delivery. */
export function ResearchDesk({ section }: { section: string }) {
  const qc = useQueryClient(); const [open, setOpen] = useState<RR | null>(null);
  const q = useQuery({ queryKey: ['research', 'all'], queryFn: async () => { const { data, error } = await supabase.from('research_requests').select('*').order('due_date'); if (error) throw error; return data as RR[]; } });
  const bank = useQuery({ queryKey: ['research-bank'], enabled: section === 'r-bank' || section === 'r-overview', queryFn: async () => { const { data, error } = await supabase.from('research_leads').select(leadCols).order('verified_at', { ascending: true, nullsFirst: true }).limit(1000); if (error) throw error; return data as Lead[]; } });
  const fb = useQuery({ queryKey: ['research-fb-all'], enabled: section === 'r-overview' || section === 'r-feedback', queryFn: async () => { const { data, error } = await supabase.from('research_feedback').select('*, research_requests(code,title,department)').order('created_at', { ascending: false }); if (error) throw error; return data; } });
  const reverify = async (id: string, ok: boolean) => { await supabase.rpc('research_reverify', { _lead: id, _still_valid: ok }); void qc.invalidateQueries({ queryKey: ['research-bank'] }); };
  const rows = q.data ?? []; const openRows = rows.filter(r => !['delivered', 'cancelled'].includes(r.status));
  if (section === 'r-overview') {
    const stale = (bank.data ?? []).filter(l => !isFresh(l.verified_at)).length; const avg = (k: 'relevance' | 'usefulness') => fb.data?.length ? (fb.data.reduce((s, f) => s + f[k], 0) / fb.data.length).toFixed(1) : '—';
    return <div className="grid gap-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Open requests" value={openRows.length} /><KpiCard label="Overdue" value={openRows.filter(r => r.due_date < todayIST()).length} tone="danger" />
      <KpiCard label="Leads needing re-verification" value={stale} tone={stale ? 'warning' : 'default'} note={`of ${bank.data?.length ?? 0} in the bank`} /><KpiCard label="Average feedback" value={`${avg('relevance')} / ${avg('usefulness')}`} note="relevance / usefulness" /></div>
      <Panel title="Open requests">{q.isPending ? <Loading /> : !openRows.length ? <Empty>No open requests.</Empty> : <RequestList rows={openRows} onOpen={setOpen} />}</Panel>
      {open && <DeskDetail r={open} onClose={() => setOpen(null)} />}</div>;
  }
  if (section === 'r-bank') return <Panel title="Lead bank" actions={bank.data?.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv('lead-bank.csv', bank.data!.map(l => ({ ...l })))}>Download CSV</Button> : undefined}>
    <p className="mb-3 text-sm text-muted-foreground">Leads verified more than 90 days ago are marked "Re-verify" and are not reused until checked again.</p>
    {bank.isPending ? <Loading /> : !bank.data!.length ? <Empty>The lead bank is empty.</Empty> : <LeadTable rows={bank.data!} onReverify={(id, ok) => void reverify(id, ok)} />}</Panel>;
  if (section === 'r-feedback') return <Panel title="Department feedback">{fb.isPending ? <Loading /> : !fb.data?.length ? <Empty>No feedback yet.</Empty> :
    <Table head={['Request', 'Department', 'Relevance', 'Usefulness', 'Comment']}>{fb.data.map(f => <tr key={f.id}><Td>{f.research_requests?.code} · {f.research_requests?.title}</Td><Td>{f.research_requests?.department}</Td><Td>{f.relevance}/5</Td><Td>{f.usefulness}/5</Td><Td>{f.comment}</Td></tr>)}</Table>}</Panel>;
  return <Panel title="All lead requests">{q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !rows.length ? <Empty>No requests yet.</Empty> : <RequestList rows={rows} onOpen={setOpen} />}{open && <DeskDetail r={open} onClose={() => setOpen(null)} />}</Panel>;
}

function DeskDetail({ r, onClose }: { r: RR; onClose: () => void }) {
  const qc = useQueryClient(); const leads = useRequestLeads(r.id);
  const blank = { company: '', contact_name: '', designation: '', phone: '', email: '', website: '', industry: r.industry, location: r.location, notes: '' };
  const [v, setV] = useState(blank); const [err, setErr] = useState<unknown>(null); const [msg, setMsg] = useState('');
  const all = leads.data ?? []; const delivered = all.filter(x => x.delivered_at).length; const ready = all.filter(x => !x.delivered_at && x.research_leads?.verified_at).length;
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['research-leads', r.id] }); void qc.invalidateQueries({ queryKey: ['research'] }); };
  const call = async (fn: () => PromiseLike<{ error: unknown; data?: unknown }>, ok: (d: unknown) => string) => { setErr(null); setMsg(''); const { error, data } = await fn(); if (error) setErr(error); else { setMsg(ok(data)); refresh(); } };
  const closed = ['delivered', 'cancelled'].includes(r.status);
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="dash-shell max-h-[92vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{r.code} · {r.title}</DialogTitle></DialogHeader>
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">{r.requester_name} ({r.department}) · {r.quantity} leads · {r.difficulty} · due {shortDate(r.due_date)}{r.industry && ` · ${r.industry}`}{r.location && ` · ${r.location}`}</p>
      {r.criteria && <p className="whitespace-pre-wrap rounded bg-muted/50 p-3 text-sm">{r.criteria}</p>}
      <div className="grid gap-3 sm:grid-cols-3"><KpiCard label="Delivered" value={`${delivered} / ${r.quantity}`} /><KpiCard label="Verified, ready to deliver" value={ready} /><KpiCard label="Collected" value={all.length} /></div>
      {!closed && <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void call(() => supabase.rpc('research_reuse_leads', { _request: r.id, _limit: r.quantity - all.length }), d => `${d as number} existing lead(s) reused from the bank.`)}><RefreshCw className="size-4" />Reuse matching leads from the bank</Button>
        <Button disabled={!ready} onClick={() => void call(() => supabase.rpc('research_deliver', { _request: r.id }), d => `${d as number} lead(s) delivered.`)}><Send className="size-4" />Deliver {ready} verified now</Button></div>}
      {msg && <p className="text-sm text-[var(--dash-success)]">{msg}</p>}<ErrorNote error={err} />
      {!closed && <form className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-3" onSubmit={e => { e.preventDefault(); void call(() => supabase.rpc('research_add_lead', { _request: r.id, _lead: v, _verified: true }), () => { setV(blank); return 'Lead added and verified.'; }); }}>
        <p className="text-sm font-semibold sm:col-span-3">Add a verified lead</p>
        {(['company', 'contact_name', 'designation', 'phone', 'email', 'website', 'industry', 'location', 'notes'] as const).map(k => <Field key={k} label={k.replace('_', ' ')}><input className={inputCls} required={k === 'company'} value={v[k]} onChange={e => setV({ ...v, [k]: e.target.value })} /></Field>)}
        <Button className="sm:col-span-3 sm:justify-self-start">Add lead</Button></form>}
      {leads.isPending ? <Loading /> : all.length ? <LeadTable rows={all.map(x => x.research_leads).filter(Boolean) as Lead[]} /> : <Empty>No leads collected yet.</Empty>}
      <div className="flex justify-end"><Button variant="outline" onClick={onClose}>Close</Button></div>
    </div></DialogContent></Dialog>;
}
