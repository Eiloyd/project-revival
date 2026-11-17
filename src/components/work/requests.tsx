import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { leaveDays, leaveTypes, money, requestFields, shortDate, stepLabel, todayIST, type Audience, type RequestRoute } from '@/lib/requests';
import { downloadCsv } from '@/lib/finance';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, StatusPill, Table, Td } from './common';
import { RequestDetailDialog } from './request-detail';

export type ReqRow = { id: string; code: string; type: string; title: string; applicant_name: string; applicant_role: string; status: string; current_step: string | null; from_date: string | null; to_date: string | null; days: number | null; amount: number | null; due_at: string | null; escalated_at: string | null; created_at: string; priority: string };

export function useRoutes() {
  return useQuery({ queryKey: ['request-routes'], staleTime: 300_000, queryFn: async () => {
    const { data, error } = await supabase.from('request_routes').select('*').eq('active', true).order('sort_order');
    if (error) throw error; return data as unknown as RequestRoute[];
  } });
}

function RequestTable({ rows, routes, onOpen, showApplicant }: { rows: ReqRow[]; routes: RequestRoute[]; onOpen: (id: string) => void; showApplicant?: boolean }) {
  const label = (t: string) => routes.find(r => r.type === t)?.label ?? t;
  return <Table head={['Request', ...(showApplicant ? ['From'] : []), 'Type', 'Dates / amount', 'Status', '']}>
    {rows.map(r => <tr key={r.id} className="hover:bg-muted/40">
      <Td><button type="button" onClick={() => onOpen(r.id)} className="text-left"><span className="block font-mono text-xs text-muted-foreground">{r.code}</span><span className="font-medium text-foreground hover:text-primary">{r.title}</span></button></Td>
      {showApplicant && <Td>{r.applicant_name}<span className="block text-xs text-muted-foreground">{r.applicant_role}</span></Td>}
      <Td>{label(r.type)}</Td>
      <Td>{r.from_date ? `${shortDate(r.from_date)}${r.to_date && r.to_date !== r.from_date ? ` – ${shortDate(r.to_date)}` : ''}` : r.amount != null ? money(r.amount) : '—'}</Td>
      <Td><div className="flex flex-wrap items-center gap-1"><StatusPill status={r.status} />{r.status === 'pending' && <span className="text-xs text-muted-foreground">with {stepLabel(r.current_step)}</span>}{r.escalated_at && r.status === 'pending' && <Pill tone="danger">Escalated</Pill>}</div></Td>
      <Td><Button size="sm" variant="ghost" onClick={() => onOpen(r.id)}>Open</Button></Td>
    </tr>)}
  </Table>;
}

/** The signed-in person's own requests plus "New request". `types` limits the choice (e.g. only leave). */
export function MyRequests({ uid, audience, types, title = 'My requests', presetType }: { uid: string; audience: Audience; types?: string[] | undefined; title?: string; presetType?: string | undefined }) {
  const routes = useRoutes(); const [open, setOpen] = useState<string | null>(null); const [creating, setCreating] = useState(false);
  const q = useQuery({ queryKey: ['requests', 'mine', uid, types?.join(',')], queryFn: async () => {
    let s = supabase.from('requests').select('*').eq('applicant_id', uid).order('created_at', { ascending: false }).limit(200);
    if (types?.length) s = s.in('type', types);
    const { data, error } = await s; if (error) throw error; return data as unknown as ReqRow[];
  } });
  return <Panel title={title} actions={<Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4" />New request</Button>}>
    {q.isPending || routes.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !q.data!.length ? <Empty>No requests yet.</Empty> : <RequestTable rows={q.data!} routes={routes.data ?? []} onOpen={setOpen} />}
    <RequestDetailDialog id={open} onClose={() => setOpen(null)} />
    <NewRequestDialog open={creating} onClose={() => setCreating(false)} audience={audience} types={types} presetType={presetType} onCreated={id => { setCreating(false); setOpen(id); }} />
  </Panel>;
}

export function NewRequestDialog({ open, onClose, audience, types, presetType, onCreated }: { open: boolean; onClose: () => void; audience: Audience; types?: string[] | undefined; presetType?: string | undefined; onCreated: (id: string) => void }) {
  const routes = useRoutes(); const qc = useQueryClient();
  const options = useMemo(() => (routes.data ?? []).filter(r => (r.audience === 'all' || r.audience === audience) && (!types?.length || types.includes(r.type))), [routes.data, audience, types]);
  const [type, setType] = useState(presetType ?? ''); const route = options.find(o => o.type === (type || options[0]?.type));
  const f = requestFields(route?.kind ?? 'general', route?.type ?? '');
  const [v, setV] = useState({ title: '', description: '', from: todayIST(), to: todayIST(), amount: '', leave_type: 'casual', half_day: false, status: 'present', payee_name: '', reference: '', category: '', priority: 'normal' });
  const [key] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<unknown>(null);
  const set = (k: keyof typeof v, val: string | boolean) => setV(s => ({ ...s, [k]: val }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!route) return; setBusy(true); setErr(null);
    const details: Record<string, unknown> = { client_key: key };
    if (f.leaveType) { details['leave_type'] = v.leave_type; details['half_day'] = v.half_day; }
    if (f.correction) details['status'] = v.status;
    if (f.payee) details['payee_name'] = v.payee_name;
    if (f.reference && v.reference) details['reference'] = v.reference;
    if (f.category && v.category) details['category'] = v.category;
    const { data, error } = await supabase.rpc('request_submit', { _type: route.type, _title: v.title || route.label, _description: v.description, _details: details as never,
      ...(f.dates ? { _from: v.from, _to: f.range ? v.to : v.from } : {}), ...(f.amount && v.amount ? { _amount: Number(v.amount) } : {}), _priority: v.priority });
    setBusy(false);
    if (error) { setErr(error); return; }
    void qc.invalidateQueries({ queryKey: ['requests'] }); void qc.invalidateQueries({ queryKey: ['leave-summary'] });
    onCreated((data as { id: string }).id);
  }
  return <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
    <DialogContent className="dash-shell max-h-[92vh] max-w-lg overflow-y-auto">
      <DialogHeader><DialogTitle>New request</DialogTitle></DialogHeader>
      <form onSubmit={e => void submit(e)} className="grid gap-4">
        <Field label="Request type"><select className={inputCls} value={route?.type ?? ''} onChange={e => setType(e.target.value)}>{options.map(o => <option key={o.type} value={o.type}>{o.label}</option>)}</select></Field>
        {route && <p className="-mt-2 text-xs text-muted-foreground">Goes to: {route.steps.map(stepLabel).join(' → ')}{route.kind === 'money' ? ' → Payment' : ''} · reply expected within {route.sla_hours} h</p>}
        <Field label="Title"><input className={inputCls} value={v.title} onChange={e => set('title', e.target.value)} placeholder={route?.label} maxLength={150} /></Field>
        {f.leaveType && <div className="grid gap-3 sm:grid-cols-2"><Field label="Leave type"><select className={inputCls} value={v.leave_type} onChange={e => set('leave_type', e.target.value)}>{leaveTypes.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}</select></Field>
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={v.half_day} onChange={e => set('half_day', e.target.checked)} />Half day</label></div>}
        {f.dates && <div className="grid gap-3 sm:grid-cols-2"><Field label={f.range ? 'From' : 'Date'}><input type="date" className={inputCls} value={v.from} onChange={e => set('from', e.target.value)} required /></Field>
          {f.range && <Field label="To"><input type="date" className={inputCls} value={v.to} min={v.from} onChange={e => set('to', e.target.value)} required /></Field>}</div>}
        {f.range && <p className="-mt-2 text-xs text-muted-foreground">{leaveDays(v.from, v.to, v.half_day)} working day(s) (Sundays not counted)</p>}
        {f.correction && <Field label="Correct status"><select className={inputCls} value={v.status} onChange={e => set('status', e.target.value)}><option value="present">Present</option><option value="half_day">Half day</option><option value="wfh">Work from home</option></select></Field>}
        {f.payee && <Field label="Pay to (vendor / person)"><input className={inputCls} value={v.payee_name} onChange={e => set('payee_name', e.target.value)} required /></Field>}
        {f.amount && <div className="grid gap-3 sm:grid-cols-2"><Field label="Amount (₹)"><input type="number" min="0" step="0.01" className={inputCls} value={v.amount} onChange={e => set('amount', e.target.value)} required={route?.type !== 'commission_dispute'} /></Field>
          <Field label="Category"><input className={inputCls} value={v.category} onChange={e => set('category', e.target.value)} placeholder="Travel, Marketing…" /></Field></div>}
        {f.reference && <Field label="Bill / invoice number" hint="Used to stop the same bill being claimed twice."><input className={inputCls} value={v.reference} onChange={e => set('reference', e.target.value)} /></Field>}
        <Field label="Details"><textarea className={areaCls} value={v.description} onChange={e => set('description', e.target.value)} maxLength={3000} /></Field>
        <Field label="Priority"><select className={inputCls} value={v.priority} onChange={e => set('priority', e.target.value)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></Field>
        <p className="text-xs text-muted-foreground">You can attach bills or documents after sending, from the request page.</p>
        <ErrorNote error={err} />
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy || !route}>{busy ? 'Sending…' : 'Send request'}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}

/** Approvals waiting for me; optional team or department history tabs. */
export function Approvals({ uid, mode = 'queue', dept, title }: { uid: string; mode?: 'queue' | 'team' | 'dept' | 'all'; dept?: string; title?: string }) {
  const routes = useRoutes(); const [open, setOpen] = useState<string | null>(null); const [status, setStatus] = useState('');
  const q = useQuery({ queryKey: ['requests', mode, dept, uid, status], queryFn: async () => {
    const r = mode === 'queue' ? await supabase.rpc('my_approval_queue') : mode === 'team' ? await supabase.rpc('team_requests')
      : await supabase.rpc('department_requests', { _dept: mode === 'all' ? 'all' : dept!, ...(status ? { _status: status } : {}) });
    if (r.error) throw r.error; return (r.data ?? []) as unknown as ReqRow[];
  } });
  const rows = (q.data ?? []).filter(r => !status || r.status === status);
  return <Panel title={title ?? (mode === 'queue' ? 'Waiting for my approval' : mode === 'team' ? 'Team requests' : 'All requests')}
    actions={<>{mode !== 'queue' && <select aria-label="Filter by status" className={`${inputCls} w-auto`} value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{['pending', 'approved', 'rejected', 'resolved', 'paid', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}</select>}
      {rows.length > 0 && <Button size="sm" variant="outline" onClick={() => downloadCsv(`requests-${mode}.csv`, rows.map(r => ({ code: r.code, type: r.type, title: r.title, from: r.applicant_name, role: r.applicant_role, status: r.status, waiting_with: r.current_step ?? '', from_date: r.from_date ?? '', to_date: r.to_date ?? '', days: r.days ?? '', amount: r.amount ?? '', sent: r.created_at })))}>Download CSV</Button>}</>}>
    {q.isPending || routes.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !rows.length ? <Empty>{mode === 'queue' ? 'Nothing is waiting for you.' : 'No requests.'}</Empty> : <RequestTable rows={rows} routes={routes.data ?? []} onOpen={setOpen} showApplicant />}
    <RequestDetailDialog id={open} onClose={() => setOpen(null)} />
  </Panel>;
}
