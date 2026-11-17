import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, MessageSquare, Paperclip, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { dateTime, money, shortDate, stepLabel } from '@/lib/requests';
import { areaCls, errMsg, ErrorNote, Field, inputCls, Loading, Pill, StatusPill } from './common';

type Req = { id: string; code: string; type: string; title: string; description: string; applicant_id: string; applicant_name: string; applicant_role: string; status: string; steps: string[]; step_index: number; current_step: string | null; from_date: string | null; to_date: string | null; days: number | null; amount: number | null; details: Record<string, unknown>; priority: string; resolution: string; transaction_ref: string; due_at: string | null; escalated_at: string | null; created_at: string };
type Ev = { id: string; actor_name: string; action: string; note: string; step: string | null; created_at: string };
type Att = { id: string; file_name: string; file_path: string; file_size: number; created_at: string };

const actionLabel: Record<string, string> = { submitted: 'Submitted', forwarded: 'Approved & forwarded', approved: 'Approved', rejected: 'Rejected', resolved: 'Resolved', paid: 'Paid', comment: 'Comment', cancelled: 'Cancelled', escalated: 'Escalated' };

export function RequestDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  return <Dialog open={Boolean(id)} onOpenChange={o => { if (!o) onClose(); }}>
    <DialogContent className="dash-shell max-h-[92vh] max-w-2xl overflow-y-auto">{id && <RequestDetail id={id} onDone={onClose} />}</DialogContent>
  </Dialog>;
}

function RequestDetail({ id, onDone }: { id: string; onDone: () => void }) {
  const qc = useQueryClient();
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null)); }, []);
  const q = useQuery({ queryKey: ['request', id], queryFn: async () => {
    const [r, e, a, act, rt, accts] = await Promise.all([
      supabase.from('requests').select('*').eq('id', id).maybeSingle(),
      supabase.from('request_events').select('id,actor_name,action,note,step,created_at').eq('request_id', id).order('created_at'),
      supabase.from('request_attachments').select('id,file_name,file_path,file_size,created_at').eq('request_id', id).order('created_at'),
      supabase.rpc('request_can_act', { _id: id }),
      supabase.from('request_routes').select('type,label,kind'),
      supabase.from('fin_accounts').select('id,name,account_last4').eq('active', true),
    ]);
    if (r.error) throw r.error; if (!r.data) throw new Error('This request was not found or you cannot open it.');
    const route = (rt.data ?? []).find(x => x.type === r.data!.type);
    return { r: r.data as unknown as Req, events: (e.data ?? []) as Ev[], files: (a.data ?? []) as Att[], canAct: Boolean(act.data), kind: route?.kind ?? 'general', label: route?.label ?? r.data.type, accounts: accts.data ?? [] };
  } });
  const [note, setNote] = useState(''); const [utr, setUtr] = useState(''); const [account, setAccount] = useState('');
  const [busy, setBusy] = useState(''); const [err, setErr] = useState<unknown>(null);
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['request', id] }); void qc.invalidateQueries({ queryKey: ['requests'] }); void qc.invalidateQueries({ queryKey: ['notifications'] }); };
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorNote error={q.error} />;
  const { r, events, files, canAct, kind, label, accounts } = q.data;
  const mine = uid === r.applicant_id;
  const canPay = kind === 'money' && r.status === 'approved' && !mine && Number(r.amount) > 0;
  const canCancel = mine && (r.status === 'pending' || (r.status === 'approved' && ['leave', 'wfh', 'volunteer_absence'].includes(r.type) && r.from_date! > new Date().toISOString().slice(0, 10)));

  async function run(key: string, fn: () => Promise<{ error: unknown }>) {
    setBusy(key); setErr(null);
    try { const { error } = await fn(); if (error) throw error; setNote(''); refresh(); } catch (e) { setErr(e); } finally { setBusy(''); }
  }
  async function upload(file: File, isProof = false): Promise<string | null> {
    if (file.size > 10 * 1024 * 1024) { setErr(new Error('Files must be 10 MB or smaller.')); return null; }
    const path = `${id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_').slice(-80)}`;
    const up = await supabase.storage.from('request-files').upload(path, file, { upsert: false });
    if (up.error) { setErr(up.error); return null; }
    const ins = await supabase.from('request_attachments').insert({ request_id: id, file_path: path, file_name: (isProof ? 'Payment proof - ' : '') + file.name, file_size: file.size });
    if (ins.error) { setErr(ins.error); return null; }
    refresh(); return path;
  }
  async function open(path: string) {
    const { data, error } = await supabase.storage.from('request-files').createSignedUrl(path, 120);
    if (error) setErr(error); else window.open(data.signedUrl, '_blank', 'noopener');
  }
  async function pay(file: File | undefined) {
    if (!file) { setErr(new Error('Attach the payment proof (screenshot or PDF).')); return; }
    if (!utr.trim()) { setErr(new Error('Enter the UTR / transaction reference.')); return; }
    setBusy('paid'); setErr(null);
    const path = await upload(file, true);
    if (!path) { setBusy(''); return; }
    const { error } = await supabase.rpc('request_act', { _id: id, _action: 'paid', _note: note, _ref: utr.trim(), _proof_path: path, ...(account ? { _account_id: account } : {}) });
    setBusy(''); if (error) setErr(error); else { setUtr(''); refresh(); }
  }
  const approveLabel = kind === 'ticket' ? 'Resolve' : r.step_index + 1 < r.steps.length ? `Approve → ${stepLabel(r.steps[r.step_index + 1])}` : 'Approve';

  return <div className="grid gap-5">
    <DialogHeader><DialogTitle className="flex flex-wrap items-center gap-2 text-left"><span className="font-mono text-sm text-muted-foreground">{r.code}</span>{r.title}</DialogTitle></DialogHeader>
    <div className="flex flex-wrap items-center gap-2 text-xs"><StatusPill status={r.status} /><Pill tone="info">{label}</Pill>{r.priority !== 'normal' && <Pill tone={r.priority === 'urgent' || r.priority === 'high' ? 'danger' : 'muted'}>{r.priority}</Pill>}{r.escalated_at && r.status === 'pending' && <Pill tone="danger">Escalated</Pill>}</div>
    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
      <div><dt className="text-xs text-muted-foreground">From</dt><dd className="font-medium">{r.applicant_name} <span className="text-xs text-muted-foreground">({r.applicant_role})</span></dd></div>
      <div><dt className="text-xs text-muted-foreground">Sent</dt><dd>{dateTime(r.created_at)}</dd></div>
      {r.status === 'pending' && <div><dt className="text-xs text-muted-foreground">Waiting with</dt><dd className="font-medium">{stepLabel(r.current_step)}{r.due_at && <span className="block text-xs text-muted-foreground">due {dateTime(r.due_at)}</span>}</dd></div>}
      {r.from_date && <div><dt className="text-xs text-muted-foreground">Dates</dt><dd>{shortDate(r.from_date)}{r.to_date && r.to_date !== r.from_date ? ` – ${shortDate(r.to_date)}` : ''}{r.days != null && <span className="text-muted-foreground"> · {r.days} day(s)</span>}</dd></div>}
      {r.amount != null && <div><dt className="text-xs text-muted-foreground">Amount</dt><dd className="font-semibold">{money(r.amount)}</dd></div>}
      {Object.entries(r.details).filter(([k, v]) => k !== 'client_key' && v !== '' && v != null).map(([k, v]) => <div key={k}><dt className="text-xs capitalize text-muted-foreground">{k.replace(/_/g, ' ')}</dt><dd>{String(v)}</dd></div>)}
      {r.transaction_ref && <div><dt className="text-xs text-muted-foreground">UTR</dt><dd className="font-mono">{r.transaction_ref}</dd></div>}
    </dl>
    {r.description && <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">{r.description}</p>}

    <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approval route</p>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs">{r.steps.map((s, i) => <li key={i} className={`rounded-full border px-2.5 py-1 ${i < r.step_index || (i === r.step_index && r.status !== 'pending' && r.status !== 'cancelled' && r.status !== 'rejected') ? 'border-[var(--dash-success)] text-[var(--dash-success)]' : i === r.step_index && r.status === 'pending' ? 'border-primary font-semibold text-primary' : 'border-border text-muted-foreground'}`}>{i + 1}. {stepLabel(s)}</li>)}
        {kind === 'money' && <li className={`rounded-full border px-2.5 py-1 ${r.status === 'paid' ? 'border-[var(--dash-success)] text-[var(--dash-success)]' : 'border-border text-muted-foreground'}`}>Payment</li>}</ol></div>

    <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</p>
      <ol className="relative ml-2 border-l border-border">{events.map(e => <li key={e.id} className="mb-3 ml-4"><span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-primary" />
        <p className="text-sm"><strong>{actionLabel[e.action] ?? e.action}</strong>{e.step && <span className="text-muted-foreground"> · {stepLabel(e.step)}</span>} <span className="text-muted-foreground">by {e.actor_name || 'System'}</span></p>
        <p className="text-xs text-muted-foreground">{dateTime(e.created_at)}</p>{e.note && <p className="mt-1 whitespace-pre-wrap text-sm">{e.note}</p>}</li>)}</ol></div>

    <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attachments</p>
      {files.length ? <ul className="grid gap-1">{files.map(f => <li key={f.id}><button type="button" onClick={() => void open(f.file_path)} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><Download className="size-3.5" />{f.file_name} <span className="text-xs text-muted-foreground">({Math.ceil(f.file_size / 1024)} KB)</span></button></li>)}</ul> : <p className="text-sm text-muted-foreground">No files yet.</p>}
      {r.status !== 'cancelled' && <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary"><Paperclip className="size-4" />Attach a file<input type="file" className="sr-only" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void upload(f); }} /></label>}
    </div>

    <ErrorNote error={err} />
    <Field label={canAct ? 'Note (needed when rejecting)' : 'Comment'}><textarea className={areaCls} value={note} onChange={e => setNote(e.target.value)} maxLength={2000} /></Field>
    <div className="flex flex-wrap gap-2">
      {canAct && !mine && <>
        <Button disabled={!!busy} onClick={() => void run('approve', async () => supabase.rpc('request_act', { _id: id, _action: 'approve', _note: note }))}><CheckCircle2 className="size-4" />{approveLabel}</Button>
        <Button disabled={!!busy} variant="outline" onClick={() => void run('reject', async () => supabase.rpc('request_act', { _id: id, _action: 'reject', _note: note }))}><XCircle className="size-4" />Reject</Button>
      </>}
      <Button disabled={!!busy || !note.trim()} variant="ghost" onClick={() => void run('comment', async () => supabase.rpc('request_comment', { _id: id, _note: note }))}><MessageSquare className="size-4" />Add comment</Button>
      {canCancel && <Button disabled={!!busy} variant="ghost" onClick={() => void run('cancel', async () => supabase.rpc('request_cancel', { _id: id, _note: note }))}>Cancel request</Button>}
    </div>
    {canPay && <div className="grid gap-3 rounded-lg border border-border p-4">
      <p className="text-sm font-semibold">Record payment of {money(r.amount)}</p>
      <p className="text-xs text-muted-foreground">Maker-checker: the person who verified or approved this cannot pay it. UTR and proof are required.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="UTR / transaction reference"><input className={inputCls} value={utr} onChange={e => setUtr(e.target.value)} maxLength={80} /></Field>
        {accounts.length > 0 && <Field label="Paid from"><select className={inputCls} value={account} onChange={e => setAccount(e.target.value)}><option value="">Choose account</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.account_last4 ? ` ••${a.account_last4}` : ''}</option>)}</select></Field>}
      </div>
      <label className="inline-flex"><span className="sr-only">Payment proof</span><input type="file" accept="image/*,application/pdf" disabled={!!busy} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; void pay(f); }} className="text-sm" /></label>
      <p className="text-xs text-muted-foreground">Choosing the proof file records the payment.</p>
    </div>}
    {busy && <p className="text-xs text-muted-foreground">Saving…</p>}
    <div className="flex justify-end"><Button variant="outline" onClick={onDone}>Close</Button></div>
  </div>;
}
export { errMsg };
