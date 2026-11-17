import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/shell';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { VIEW_AS_MIN_REASON } from '@/lib/ops/rules';

type UserRow = { user_id: string; email: string; full_name: string };
type Snapshot = { email: string | null; last_sign_in: string | null; roles: string[]; activity: { action?: string; event?: string; path?: string; created_at: string }[]; letters: { title: string; issued_at: string }[] };
const dt = (d: string | null | undefined) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/** Read-only "view as user": needs a written reason, every look is logged and shown to all admins. */
export function ViewAsUser() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ['admin-user-directory'], queryFn: async () => { const { data, error } = await supabase.rpc('admin_user_directory'); if (error) throw error; return data as unknown as UserRow[]; } });
  const log = useQuery({ queryKey: ['admin-view-as-log'], queryFn: async () => { const { data, error } = await supabase.from('admin_view_as_log').select('*').order('created_at', { ascending: false }).limit(50); if (error) throw error; return data; } });
  const [target, setTarget] = useState(''); const [reason, setReason] = useState(''); const [snap, setSnap] = useState<Snapshot | null>(null); const [error, setError] = useState<unknown>(null); const [busy, setBusy] = useState(false);
  const email = (id: string) => users.data?.find(u => u.user_id === id)?.email ?? id.slice(0, 8);
  async function open() {
    setBusy(true); setError(null); setSnap(null);
    try {
      if (!target) throw new Error('Choose a user.');
      if (reason.trim().length < VIEW_AS_MIN_REASON) throw new Error(`Write a reason (at least ${VIEW_AS_MIN_REASON} characters).`);
      const { data, error } = await supabase.rpc('admin_view_as', { _target: target, _reason: reason.trim() }); if (error) throw error;
      setSnap(data as unknown as Snapshot); setReason(''); await qc.invalidateQueries({ queryKey: ['admin-view-as-log'] });
    } catch (e) { setError(e); } finally { setBusy(false); }
  }
  return <div className="grid gap-5">
    <Panel title="View as user (read-only)">
      <p className="mb-3 text-sm text-muted-foreground">See a person's access, recent activity and letters to help them with a problem. Nothing can be changed from here. Every view is saved with your reason and is visible to all admins.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="User"><select className={inputCls} value={target} onChange={e => setTarget(e.target.value)}><option value="">Choose…</option>{users.data?.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name ? `${u.full_name} · ` : ''}{u.email}</option>)}</select></Field>
        <Field label="Reason (required)"><textarea className={areaCls} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Employee says the leave page shows nothing — ticket TKT-…" /></Field>
      </div>
      <div className="mt-3"><Button disabled={busy} onClick={() => void open()}>{busy ? 'Opening…' : 'View read-only'}</Button></div>
      <div className="mt-3"><ErrorNote error={error} /></div>
      {snap && <div className="mt-4 grid gap-4 rounded-md border border-border p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm"><Pill tone="warning">Read-only view</Pill><b>{snap.email}</b> · last sign-in {dt(snap.last_sign_in)} · roles: {snap.roles.length ? snap.roles.join(', ') : 'none'}</div>
        <div><h4 className="mb-1 text-sm font-semibold">Recent activity</h4>{!snap.activity.length ? <Empty>No activity recorded.</Empty> : <ul className="grid gap-1 text-sm">{snap.activity.map((a, i) => <li key={i} className="border-b border-border pb-1">{dt(a.created_at)} · {a.action ?? a.event ?? ''} {a.path ?? ''}</li>)}</ul>}</div>
        <div><h4 className="mb-1 text-sm font-semibold">HR letters</h4>{!snap.letters.length ? <Empty>No letters.</Empty> : <ul className="text-sm">{snap.letters.map((l, i) => <li key={i}>{l.title} · {dt(l.issued_at)}</li>)}</ul>}</div>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => setSnap(null)}>Close view</Button>
      </div>}
    </Panel>
    <Panel title="View-as audit log">{log.isPending ? <Loading /> : log.error ? <ErrorNote error={log.error} /> : !log.data?.length ? <Empty>No views yet.</Empty> :
      <Table head={['When', 'Admin', 'Viewed user', 'Reason']}>{log.data.map(l => <tr key={l.id} className="border-b border-border"><Td>{dt(l.created_at)}</Td><Td>{email(l.admin_id)}</Td><Td>{email(l.target_id)}</Td><Td>{l.reason}</Td></tr>)}</Table>}</Panel>
  </div>;
}

type Auto = { queued: number; failing: number; oldest: string | null; errors: { id: number; source_table: string; kind: string; attempts: number; last_error: string; queued_at: string }[] };
/** Background jobs: Google Sheet copy queue health, failures with retry, and the integration run history. */
export function AutomationCentre() {
  const qc = useQueryClient(); const [msg, setMsg] = useState(''); const [error, setError] = useState<unknown>(null);
  const st = useQuery({ queryKey: ['admin-automation'], queryFn: async () => { const { data, error } = await supabase.rpc('admin_automation_status'); if (error) throw error; return data as unknown as Auto; } });
  const runs = useQuery({ queryKey: ['admin-integration-runs'], queryFn: async () => { const { data, error } = await supabase.from('integration_sync_logs').select('*').order('created_at', { ascending: false }).limit(60); if (error) throw error; return data; } });
  async function retry() { setError(null); setMsg(''); const { data, error } = await supabase.rpc('admin_retry_sheet_copies'); if (error) return setError(error); setMsg(`${data ?? 0} failed copies queued again — the next scheduled run will retry them.`); await qc.invalidateQueries({ queryKey: ['admin-automation'] }); }
  const jobs = [
    { name: 'Google Sheet & Drive copy', when: 'Every few minutes', what: 'Copies website forms, CRM leads and payments to the Google Sheet.' },
    { name: 'Scholarship sheet sync', when: 'Every few minutes', what: 'Copies back any scholarship form saved only to the sheet.' },
    { name: 'Request escalations', when: 'Hourly', what: 'Moves overdue requests to the next approver.' },
  ];
  return <div className="grid gap-5">
    {st.error ? <ErrorNote error={st.error} /> : <div className="grid gap-3 sm:grid-cols-3">
      <KpiCard label="Waiting to copy" value={st.data?.queued ?? '…'} />
      <KpiCard label="Failed copies" value={st.data?.failing ?? '…'} />
      <KpiCard label="Oldest waiting since" value={st.data?.oldest ? dt(st.data.oldest) : 'Nothing waiting'} />
    </div>}
    <Panel title="Scheduled jobs"><Table head={['Job', 'Runs', 'What it does']}>{jobs.map(j => <tr key={j.name} className="border-b border-border"><Td className="font-medium">{j.name}</Td><Td>{j.when}</Td><Td>{j.what}</Td></tr>)}</Table>
      <p className="mt-2 text-xs text-muted-foreground">Schedules start once the site is published.</p></Panel>
    <Panel title="Failed copies" actions={st.data?.failing ? <Button size="sm" onClick={() => void retry()}>Retry all</Button> : undefined}>
      {msg && <p className="mb-2 text-sm text-primary">{msg}</p>}<ErrorNote error={error} />
      {st.isPending ? <Loading /> : !st.data?.errors.length ? <Empty>No failures.</Empty> :
        <Table head={['Queued', 'Record', 'Tries', 'Error']}>{st.data.errors.map(e => <tr key={e.id} className="border-b border-border"><Td>{dt(e.queued_at)}</Td><Td>{e.source_table} · {e.kind}</Td><Td>{e.attempts}</Td><Td className="max-w-md text-xs text-destructive">{e.last_error}</Td></tr>)}</Table>}
    </Panel>
    <Panel title="Integration run history">{runs.isPending ? <Loading /> : !runs.data?.length ? <Empty>No runs recorded yet.</Empty> :
      <Table head={['When', 'Service', 'Action', 'Result', 'Items', 'Message']}>{runs.data.map(r => <tr key={r.id} className="border-b border-border"><Td>{dt(r.created_at)}</Td><Td>{r.provider}</Td><Td>{r.action}</Td><Td><Pill tone={r.ok ? 'success' : 'danger'}>{r.ok ? 'OK' : 'Failed'}</Pill></Td><Td>{r.items ?? ''}</Td><Td className="max-w-sm text-xs">{r.message}</Td></tr>)}</Table>}</Panel>
  </div>;
}
