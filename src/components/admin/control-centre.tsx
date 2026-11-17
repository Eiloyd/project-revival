import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { CheckCircle2, Plug, RefreshCw, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { integrationCatalog, missingFields, type IntegrationDef } from '@/lib/integrations/catalog';
import { integrationAction, saveIntegration } from '@/lib/integrations.functions';
import { proposeIncentivePlan } from '@/lib/crm.functions';
import { readSlabs, type IncentiveSlab } from '@/lib/crm/incentives';
import { dateTime, money, stepLabels } from '@/lib/requests';
import { downloadCsv } from '@/lib/finance';
import { Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { Approvals } from '@/components/work/requests';
import { useMyDashboards } from '@/hooks/use-my-dashboards';

const deptLabels: Record<string, string> = { hr: 'HR', support: 'Support', accounts: 'Accounts', finance: 'Finance', research: 'Lead Research' };

/** Admin → Departments & access: who is HR / Support / Accounts / Finance / Lead Research, approval routes, SLA and leave policy. */
export function DepartmentsAdmin() {
  const qc = useQueryClient(); const [err, setErr] = useState<unknown>(null); const [msg, setMsg] = useState('');
  const staff = useQuery({ queryKey: ['admin-dept-staff'], queryFn: async () => { const { data, error } = await supabase.rpc('admin_department_staff'); if (error) throw error; return data; } });
  const [v, setV] = useState({ email: '', department: 'hr', level: 'executive', limit: '' });
  const set = async (email: string, department: string, active: boolean, level: string, limit: string) => {
    setErr(null); setMsg('');
    const { error } = await supabase.rpc('admin_set_department_staff', { _email: email, _department: department, _active: active, _level: level, ...(limit ? { _limit: Number(limit) } : {}) });
    if (error) setErr(error); else { setMsg(active ? `${email} now has ${deptLabels[department]} access.` : 'Access removed.'); void qc.invalidateQueries({ queryKey: ['admin-dept-staff'] }); }
  };
  return <div className="grid gap-5">
    <Panel title="Department access">
      <p className="mb-3 text-sm text-muted-foreground">The person must already have an account (they sign up at the employee login). Until a department has someone, its approvals come to the admins.</p>
      <form className="grid gap-3 sm:grid-cols-5" onSubmit={e => { e.preventDefault(); void set(v.email, v.department, true, v.level, v.limit); }}>
        <Field label="Email"><input type="email" required className={inputCls} value={v.email} onChange={e => setV({ ...v, email: e.target.value })} /></Field>
        <Field label="Department"><select className={inputCls} value={v.department} onChange={e => setV({ ...v, department: e.target.value })}>{Object.entries(deptLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Level"><select className={inputCls} value={v.level} onChange={e => setV({ ...v, level: e.target.value })}><option value="executive">Executive</option><option value="manager">Manager</option></select></Field>
        <Field label="Payment approval limit (₹)" hint="Finance managers only; blank = no limit"><input type="number" min="0" className={inputCls} value={v.limit} onChange={e => setV({ ...v, limit: e.target.value })} /></Field>
        <div className="self-end"><Button>Give access</Button></div>
      </form>
      {msg && <p className="mt-2 text-sm text-[var(--dash-success)]">{msg}</p>}<ErrorNote error={err} />
      <div className="mt-4">{staff.isPending ? <Loading /> : !staff.data?.length ? <Empty>No department staff yet.</Empty> :
        <Table head={['Person', 'Department', 'Level', 'Limit', 'Status', '']}>{staff.data.map(s => <tr key={s.user_id + s.department}>
          <Td className="font-medium">{s.full_name}<span className="block text-xs text-muted-foreground">{s.email}</span></Td><Td>{deptLabels[s.department]}</Td><Td className="capitalize">{s.level}</Td><Td>{s.approval_limit == null ? '—' : money(s.approval_limit)}</Td>
          <Td><Pill tone={s.active ? 'success' : 'muted'}>{s.active ? 'Active' : 'Removed'}</Pill></Td>
          <Td><Button size="sm" variant="ghost" onClick={() => void set(s.email, s.department, !s.active, s.level, s.approval_limit == null ? '' : String(s.approval_limit))}>{s.active ? 'Remove' : 'Restore'}</Button></Td></tr>)}</Table>}</div>
    </Panel>
    <RoutesAdmin /><LeavePolicyAdmin />
  </div>;
}

function RoutesAdmin() {
  const qc = useQueryClient(); const [err, setErr] = useState<unknown>(null);
  const q = useQuery({ queryKey: ['admin-routes'], queryFn: async () => { const { data, error } = await supabase.from('request_routes').select('*').order('sort_order'); if (error) throw error; return data; } });
  const save = async (type: string, patch: Record<string, unknown>) => { setErr(null); const { data: u } = await supabase.auth.getUser(); const { error } = await supabase.from('request_routes').update({ ...patch, updated_at: new Date().toISOString(), updated_by: u.user?.id ?? null }).eq('type', type); if (error) setErr(error); else { void qc.invalidateQueries({ queryKey: ['admin-routes'] }); void qc.invalidateQueries({ queryKey: ['request-routes'] }); } };
  const parse = (s: string) => s.split(/[>,→]/).map(x => x.trim().toLowerCase()).filter(Boolean);
  return <Panel title="Approval routes & SLA">
    <p className="mb-3 text-xs text-muted-foreground">Steps (in order): {Object.keys(stepLabels).join(', ')}. "Without manager" is used for people who have no reporting manager (e.g. BDM). Requests waiting longer than the hours are escalated.</p><ErrorNote error={err} />
    {q.isPending ? <Loading /> : <Table head={['Request type', 'Steps', 'Without manager', 'Hours', 'On']}>{q.data!.map(r => <tr key={r.type}>
      <Td className="font-medium">{r.label}<span className="block text-xs text-muted-foreground">{r.category} · {r.audience}</span></Td>
      <Td><input aria-label={`${r.label} steps`} className={`${inputCls} h-8 text-xs`} defaultValue={r.steps.join(' > ')} onBlur={e => { const s = parse(e.target.value); if (s.join() !== r.steps.join()) void save(r.type, { steps: s }); }} /></Td>
      <Td><input aria-label={`${r.label} steps without manager`} className={`${inputCls} h-8 text-xs`} defaultValue={r.steps_no_manager.join(' > ')} onBlur={e => { const s = parse(e.target.value); if (s.join() !== r.steps_no_manager.join()) void save(r.type, { steps_no_manager: s }); }} /></Td>
      <Td><input aria-label={`${r.label} hours`} type="number" min={1} max={720} className={`${inputCls} h-8 w-20 text-xs`} defaultValue={r.sla_hours} onBlur={e => { const n = Number(e.target.value); if (n !== r.sla_hours) void save(r.type, { sla_hours: n }); }} /></Td>
      <Td><input type="checkbox" aria-label={`${r.label} active`} checked={r.active} onChange={e => void save(r.type, { active: e.target.checked })} /></Td></tr>)}</Table>}
  </Panel>;
}

function LeavePolicyAdmin() {
  const qc = useQueryClient(); const [err, setErr] = useState<unknown>(null);
  const q = useQuery({ queryKey: ['admin-leave'], queryFn: async () => (await supabase.from('leave_policies').select('*').order('sort_order')).data ?? [] });
  return <Panel title="Leave per year"><ErrorNote error={err} />{q.isPending ? <Loading /> : <div className="grid gap-3 sm:grid-cols-4">{q.data!.map(l => <Field key={l.leave_type} label={l.label}>
    <input type="number" min={0} max={366} step={0.5} className={inputCls} defaultValue={Number(l.days_per_year)} onBlur={async e => { const n = Number(e.target.value); if (n === Number(l.days_per_year)) return; const { error } = await supabase.from('leave_policies').update({ days_per_year: n, updated_at: new Date().toISOString() }).eq('leave_type', l.leave_type); if (error) setErr(error); else void qc.invalidateQueries({ queryKey: ['admin-leave'] }); }} /></Field>)}</div>}</Panel>;
}

const statusTone = { connected: 'success', error: 'danger', disconnected: 'muted' } as const;

/** Admin → Integration Centre: every external service is connected, tested, enabled or disconnected here only. */
export function IntegrationsAdmin() {
  const qc = useQueryClient(); const act = useServerFn(integrationAction); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null); const [editing, setEditing] = useState<IntegrationDef | null>(null); const [busy, setBusy] = useState('');
  const status = useQuery({ queryKey: ['admin-integrations'], queryFn: async () => { const { data, error } = await supabase.rpc('admin_integration_status'); if (error) throw error; return data; } });
  const logs = useQuery({ queryKey: ['admin-integration-logs'], queryFn: async () => (await supabase.from('integration_sync_logs').select('*').order('created_at', { ascending: false }).limit(60)).data ?? [] });
  const google = useQuery({ queryKey: ['admin-google-status'], queryFn: async () => (await supabase.from('google_copy_settings').select('*').maybeSingle()).data });
  const run = async (provider: IntegrationDef['provider'], action: 'test' | 'sync' | 'enable' | 'disable' | 'disconnect') => {
    if (action === 'disconnect' && !window.confirm('Disconnect and delete the saved keys?')) return;
    setBusy(provider + action); setMsg(null);
    try { const r = await act({ data: { provider, action } }); setMsg({ ok: r.ok, text: r.message }); } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' }); }
    setBusy(''); void qc.invalidateQueries({ queryKey: ['admin-integrations'] }); void qc.invalidateQueries({ queryKey: ['admin-integration-logs'] });
  };
  const lastGoogle = (logs.data ?? []).find(l => l.provider === 'google_sheets');
  return <div className="grid gap-5">
    <p className="text-sm text-muted-foreground">All integrations are managed only here. Saved keys are encrypted on the server and never shown again; leave a key field empty to keep the saved one. Every change is recorded in Change history, and failures alert all admins.</p>
    {msg && <p className={`rounded-md px-3 py-2 text-sm ${msg.ok ? 'bg-[color-mix(in_oklab,var(--dash-success)_10%,transparent)] text-[var(--dash-success)]' : 'bg-destructive/5 text-destructive'}`}>{msg.text}</p>}
    <div className="grid gap-4 lg:grid-cols-2">
      {integrationCatalog.map(def => { const s = status.data?.find(x => x.provider === def.provider); const st = !s ? 'Not connected' : !s.enabled ? 'Disabled' : s.status === 'connected' ? 'Connected' : s.status === 'error' ? 'Connection failed' : 'Not connected';
        return <section key={def.provider} className="dash-card grid gap-3 p-5">
          <div className="flex items-start justify-between gap-2"><div><p className="flex items-center gap-2 font-semibold"><Plug className="size-4 text-primary" />{def.name}</p><p className="text-xs text-muted-foreground">{def.category}</p></div>
            <Pill tone={st === 'Connected' ? 'success' : st === 'Connection failed' ? 'danger' : 'muted'}>{st}</Pill></div>
          <p className="text-sm">{def.description}</p>
          <dl className="grid grid-cols-2 gap-1 text-xs"><dt className="text-muted-foreground">Last tested</dt><dd>{dateTime(s?.last_tested_at ?? null)}</dd>{def.canSync && <><dt className="text-muted-foreground">Last sync</dt><dd>{dateTime(s?.last_sync_at ?? null)}</dd></>}<dt className="text-muted-foreground">Keys saved</dt><dd>{s?.has_secret ? 'Yes' : 'No'}</dd></dl>
          {s?.last_error && <p className="rounded bg-destructive/5 p-2 text-xs text-destructive">{s.last_error}</p>}
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => setEditing(def)}>Configure</Button>
            {s && <><Button size="sm" variant="outline" disabled={!!busy} onClick={() => void run(def.provider, 'test')}>Test connection</Button>
              {def.canSync && <Button size="sm" variant="outline" disabled={!!busy} onClick={() => void run(def.provider, 'sync')}><RefreshCw className="size-3.5" />Sync now</Button>}
              <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => void run(def.provider, s.enabled ? 'disable' : 'enable')}>{s.enabled ? 'Disable' : 'Enable'}</Button>
              <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => void run(def.provider, 'disconnect')}>Disconnect</Button></>}</div>
          <p className="text-xs text-muted-foreground">Outside setup: {def.external.join(' ')}</p>
        </section>; })}
      <section className="dash-card grid gap-3 p-5">
        <div className="flex items-start justify-between gap-2"><div><p className="flex items-center gap-2 font-semibold"><Plug className="size-4 text-primary" />Google Sheets & Drive</p><p className="text-xs text-muted-foreground">Data copy</p></div>
          <Pill tone={lastGoogle && !lastGoogle.ok ? 'danger' : google.data ? 'success' : 'muted'}>{lastGoogle && !lastGoogle.ok ? 'Connection failed' : google.data ? 'Set up' : 'Setup required'}</Pill></div>
        <p className="text-sm">Copies every form, lead and payment to the chosen Google Sheet and documents to Drive. Choose the Sheet and folder in Admin → Google Sheet & Drive.</p>
        {lastGoogle && !lastGoogle.ok && <p className="rounded bg-destructive/5 p-2 text-xs text-destructive">{lastGoogle.message} · {dateTime(lastGoogle.created_at)}</p>}
        <p className="text-xs text-muted-foreground">Outside setup: the Google account itself is linked once through Lovable's connection card (Google sign-in cannot be done inside this page).</p>
        <div><Button size="sm" variant="outline" asChild><a href="#google">Open Google Sheet & Drive settings</a></Button></div>
      </section>
      <section className="dash-card grid gap-3 p-5">
        <div className="flex items-start justify-between gap-2"><div><p className="flex items-center gap-2 font-semibold"><Plug className="size-4 text-primary" />Payment links & checkout</p><p className="text-xs text-muted-foreground">Payments</p></div><Pill tone="success">Built in</Pill></div>
        <p className="text-sm">Payment links and Zoho Checkout embeds for every paid form. Changes need a second admin's approval (Change approvals).</p>
        <div><Button size="sm" variant="outline" asChild><a href="#payment-links">Open Fees & payment</a></Button></div>
      </section>
      <section className="dash-card grid gap-3 p-5">
        <div className="flex items-start justify-between gap-2"><div><p className="flex items-center gap-2 font-semibold"><Plug className="size-4 text-primary" />AI assistant</p><p className="text-xs text-muted-foreground">AI</p></div><Pill tone="success">Built in</Pill></div>
        <p className="text-sm">The AI checks on the website use Lovable AI, which needs no keys here.</p>
      </section>
    </div>
    <Panel title="Integration logs">{logs.isPending ? <Loading /> : !logs.data!.length ? <Empty>No activity yet.</Empty> :
      <Table head={['When', 'Integration', 'Action', 'Result']}>{logs.data!.map(l => <tr key={l.id}><Td>{dateTime(l.created_at)}</Td><Td>{l.provider.replace('_', ' ')}</Td><Td>{l.action}</Td><Td>{l.ok ? <span className="inline-flex items-center gap-1 text-[var(--dash-success)]"><CheckCircle2 className="size-3.5" />OK</span> : <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="size-3.5" />Failed</span>} <span className="text-xs text-muted-foreground">{l.message}</span></Td></tr>)}</Table>}</Panel>
    <ChangeHistory areas={['Integrations', 'Google Sheet & Drive', 'Payment configuration']} title="Integration change history" />
    {editing && <ConfigureDialog def={editing} saved={status.data?.find(x => x.provider === editing.provider)} onClose={() => setEditing(null)} onSaved={r => { setEditing(null); setMsg({ ok: r.ok, text: r.ok ? `Saved. ${r.message}` : `Saved, but the test failed: ${r.message}` }); void qc.invalidateQueries({ queryKey: ['admin-integrations'] }); void qc.invalidateQueries({ queryKey: ['admin-integration-logs'] }); }} />}
  </div>;
}

function ConfigureDialog({ def, saved, onClose, onSaved }: { def: IntegrationDef; saved?: { config: unknown; has_secret: boolean } | undefined; onClose: () => void; onSaved: (r: { ok: boolean; message: string }) => void }) {
  const save = useServerFn(saveIntegration);
  const [config, setConfig] = useState<Record<string, string>>(() => ({ ...Object.fromEntries(def.fields.filter(f => !f.secret).map(f => [f.key, f.options?.[0]?.value ?? ''])), ...((saved?.config ?? {}) as Record<string, string>) }));
  const [secrets, setSecrets] = useState<Record<string, string>>({}); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const missing = missingFields(def, config, Boolean(saved?.has_secret), secrets);
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="dash-shell max-h-[92vh] max-w-lg overflow-y-auto"><DialogHeader><DialogTitle>Configure {def.name}</DialogTitle></DialogHeader>
    <form className="grid gap-3" onSubmit={async e => { e.preventDefault(); setBusy(true); setErr(''); try { onSaved(await save({ data: { provider: def.provider, config, secrets } })); } catch (x) { setErr(x instanceof Error ? x.message : 'Saving failed'); } setBusy(false); }}>
      {def.fields.map(f => <Field key={f.key} label={f.label} hint={f.secret && saved?.has_secret ? 'A key is saved. Leave empty to keep it.' : undefined}>
        {f.options ? <select className={inputCls} value={config[f.key] ?? ''} onChange={e => setConfig({ ...config, [f.key]: e.target.value })}>{f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          : f.secret ? <input type="password" autoComplete="off" className={inputCls} value={secrets[f.key] ?? ''} placeholder={saved?.has_secret ? '•••••••• (saved)' : f.placeholder} onChange={e => setSecrets({ ...secrets, [f.key]: e.target.value })} />
          : <input className={inputCls} value={config[f.key] ?? ''} placeholder={f.placeholder} onChange={e => setConfig({ ...config, [f.key]: e.target.value })} />}</Field>)}
      <p className="text-xs text-muted-foreground">{def.external.join(' ')}</p>
      {missing.length > 0 && <p className="text-xs text-[var(--dash-warning)]">Still needed: {missing.join(', ')}</p>}
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy || missing.length > 0}>{busy ? 'Saving & testing…' : 'Save & test'}</Button></div>
    </form></DialogContent></Dialog>;
}

/** Admin → Change history: who changed which setting, when, and what changed (keys appear only as "changed"). */
export function ChangeHistory({ areas, title = 'Change history' }: { areas?: string[]; title?: string }) {
  const q = useQuery({ queryKey: ['settings-history', areas?.join()], queryFn: async () => { let s = supabase.from('settings_change_log').select('*').order('created_at', { ascending: false }).limit(300); if (areas) s = s.in('area', areas); const { data, error } = await s; if (error) throw error; return data; } });
  return <Panel title={title} actions={q.data?.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv('change-history.csv', q.data!.map(c => ({ when: c.created_at, area: c.area, item: c.item, action: c.action, by: c.actor_name, changes: JSON.stringify(c.changes) })))}>Download CSV</Button> : undefined}>
    {q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !q.data!.length ? <Empty>No changes recorded yet.</Empty> :
      <Table head={['When', 'Setting', 'By', 'What changed']}>{q.data!.map(c => <tr key={c.id}><Td className="whitespace-nowrap">{dateTime(c.created_at)}</Td><Td>{c.area}<span className="block text-xs text-muted-foreground">{c.item} · {c.action}</span></Td><Td>{c.actor_name}</Td>
        <Td className="text-xs">{Object.entries(c.changes as Record<string, unknown>).map(([k, v]) => <span key={k} className="block"><strong>{k.replace(/_/g, ' ')}</strong>: {typeof v === 'string' ? v : `${String((v as { from?: string }).from ?? '') || '—'} → ${String((v as { to?: string }).to ?? '') || '—'}`}</span>)}</Td></tr>)}</Table>}
  </Panel>;
}

/** Admin → Change approvals: critical changes proposed by one admin and approved by another. */
export function CriticalApprovals() {
  const qc = useQueryClient(); const [err, setErr] = useState<unknown>(null); const [uid, setUid] = useState<string | null>(null);
  void supabase.auth.getUser().then(({ data }) => { if (data.user && data.user.id !== uid) setUid(data.user.id); });
  const q = useQuery({ queryKey: ['critical-changes'], queryFn: async () => { const { data, error } = await supabase.from('critical_changes').select('*').order('requested_at', { ascending: false }).limit(200); if (error) throw error; return data; } });
  const decide = async (id: string, approve: boolean) => { const note = approve ? '' : window.prompt('Reason (optional)') ?? ''; setErr(null); const { error } = await supabase.rpc('critical_change_decide', { _id: id, _approve: approve, _note: note }); if (error) setErr(error); void qc.invalidateQueries({ queryKey: ['critical-changes'] }); };
  const kind = { payment_option: 'Payment configuration', payout_rules: 'Payout rules', form_commission: 'Commission per form', volunteer_rate: 'Volunteer commission rate', incentive_plan: 'BDE / BDM incentive plan' } as const;
  const show = (o: unknown) => Object.entries((o ?? {}) as Record<string, unknown>).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v === null || v === '' ? '—' : Array.isArray(v) ? (v.length ? v.map(x => { const s = x as { min?: number; rate?: number; bonus?: number }; return `${s.min}%+ → ${s.rate}%${s.bonus ? ` + ₹${s.bonus}` : ''}`; }).join(', ') : 'none') : String(v).slice(0, 80)}`).join(' · ');
  return <Panel title="Change approvals">
    <p className="mb-3 text-sm text-muted-foreground">Payment configuration, commission rates, BDE/BDM incentive plans and payout rules change only after a second admin approves. If you are the only admin, you can confirm your own change 12 hours after proposing it.</p><ErrorNote error={err} />
    {q.isPending ? <Loading /> : !q.data!.length ? <Empty>No changes proposed yet.</Empty> : <Table head={['Change', 'Now', 'Proposed', 'Status', '']}>{q.data!.map(c => <tr key={c.id}>
      <Td><span className="font-mono text-xs">{c.code}</span><span className="block font-medium">{kind[c.kind as keyof typeof kind]}</span><span className="block text-xs text-muted-foreground">{c.target.length > 20 ? '' : c.target} {c.summary} · {dateTime(c.requested_at)}</span></Td>
      <Td className="max-w-[220px] text-xs">{show(c.current)}</Td><Td className="max-w-[220px] text-xs font-medium">{show(c.payload)}</Td>
      <Td><Pill tone={c.status === 'applied' ? 'success' : c.status === 'pending' ? 'warning' : 'muted'}>{c.status}</Pill>{c.note && <span className="block text-xs text-muted-foreground">{c.note}</span>}</Td>
      <Td>{c.status === 'pending' && <div className="flex flex-wrap gap-1"><Button size="sm" onClick={() => void decide(c.id, true)}>{c.requested_by === uid ? 'Confirm' : 'Approve'}</Button><Button size="sm" variant="ghost" onClick={() => void decide(c.id, false)}>{c.requested_by === uid ? 'Withdraw' : 'Reject'}</Button></div>}</Td></tr>)}</Table>}
  </Panel>;
}

/** Admin → Global settings: values used across several parts of the website. */
export function GlobalSettingsAdmin() {
  const qc = useQueryClient(); const [err, setErr] = useState<unknown>(null); const [saved, setSaved] = useState('');
  const q = useQuery({ queryKey: ['global-settings-admin'], queryFn: async () => { const { data, error } = await supabase.from('global_settings').select('*').order('category'); if (error) throw error; return data; } });
  const save = async (key: string, value: unknown) => { setErr(null); setSaved(''); const { data: u } = await supabase.auth.getUser(); const { error } = await supabase.from('global_settings').update({ value: value as never, updated_by: u.user?.id ?? null, updated_at: new Date().toISOString() }).eq('key', key); if (error) setErr(error); else { setSaved('Saved.'); void qc.invalidateQueries({ queryKey: ['global-settings'] }); void qc.invalidateQueries({ queryKey: ['global-settings-admin'] }); } };
  const groups = Object.entries((q.data ?? []).reduce<Record<string, NonNullable<typeof q.data>>>((a, s) => ({ ...a, [s.category]: [...(a[s.category] ?? []), s] }), {}));
  return <div className="grid gap-5"><p className="text-sm text-muted-foreground">One place for settings that several parts of the site use. Changes take effect straight away and are recorded in Change history.</p>
    {saved && <p className="text-sm text-[var(--dash-success)]">{saved}</p>}<ErrorNote error={err} />
    {q.isPending ? <Loading /> : groups.map(([cat, list]) => <Panel key={cat} title={cat}><div className="grid gap-4 sm:grid-cols-2">{list.map(s => <Field key={s.key} label={s.label} hint={s.description}>
      {typeof s.value === 'boolean' ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked={s.value} onChange={e => void save(s.key, e.target.checked)} />{s.value ? 'On' : 'Off'}</label>
        : typeof s.value === 'number' ? <input type="number" className={inputCls} defaultValue={s.value} onBlur={e => { const n = Number(e.target.value); if (n !== s.value && Number.isFinite(n)) void save(s.key, n); }} />
        : <input className={inputCls} defaultValue={String(s.value ?? '')} onBlur={e => { if (e.target.value.trim() !== s.value) void save(s.key, e.target.value.trim()); }} />}</Field>)}</div></Panel>)}
  </div>;
}

export function AuditLogAdmin() {
  const q = useQuery({ queryKey: ['audit-log'], queryFn: async () => { const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(500); if (error) throw error; return data; } });
  return <div className="grid gap-5"><Panel title="Audit log" actions={q.data?.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv('audit-log.csv', q.data!.map(a => ({ when: a.created_at, action: a.action, entity: a.entity, ref: a.entity_id, details: JSON.stringify(a.details) })))}>Download CSV</Button> : undefined}>
    {q.isPending ? <Loading /> : !q.data?.length ? <Empty>Nothing recorded yet.</Empty> : <Table head={['When', 'Action', 'Record', 'Details']}>{q.data.map(a => <tr key={a.id}><Td className="whitespace-nowrap">{dateTime(a.created_at)}</Td><Td>{a.action}</Td><Td className="font-mono text-xs">{a.entity_id}</Td><Td className="text-xs text-muted-foreground">{JSON.stringify(a.details)}</Td></tr>)}</Table>}</Panel>
    <ChangeHistory /></div>;
}

export function AllRequestsAdmin() {
  const { uid } = useMyDashboards();
  if (!uid) return <Loading />;
  return <div className="grid gap-5"><Approvals uid={uid} title="Waiting for an admin" /><Approvals uid={uid} mode="all" title="All requests (every department)" /></div>;
}

/** Admin → Incentive plans: slabs for BDE and BDM, applied after a second admin approves (critical change). */
export function IncentivePlansAdmin() {
  const qc = useQueryClient(); const propose = useServerFn(proposeIncentivePlan);
  const [err, setErr] = useState<unknown>(null); const [msg, setMsg] = useState('');
  const q = useQuery({ queryKey: ['incentive-plans'], queryFn: async () => { const { data, error } = await supabase.from('crm_incentive_plans').select('*').order('role'); if (error) throw error; return data; } });
  return <div className="grid gap-5">
    <p className="text-sm text-muted-foreground">BDE and BDM incentives are calculated automatically from <b className="text-foreground">verified collections</b> against each person's monthly revenue target (BDM: whole team). Each slab says: from this % of target reached, pay this % of verified revenue plus an optional fixed bonus. The highest slab reached applies. A change applies after a second admin approves it in Change approvals.</p>
    {msg && <p className="text-sm text-[var(--dash-success)]">{msg}</p>}<ErrorNote error={err} />
    {q.isPending ? <Loading /> : (q.data ?? []).map(p => <PlanEditor key={p.role + p.updated_at} role={p.role as 'BDE' | 'BDM'} active={p.active} slabs={readSlabs(p.slabs)} onSave={async (active, slabs) => {
      setErr(null); setMsg('');
      try { const r = await propose({ data: { role: p.role as 'BDE' | 'BDM', active, slabs } }); setMsg(`Change ${r.code} proposed — a second admin must approve it in Change approvals.`); void qc.invalidateQueries({ queryKey: ['critical-changes'] }); } catch (e) { setErr(e); }
    }} />)}
  </div>;
}

function PlanEditor({ role, active, slabs, onSave }: { role: 'BDE' | 'BDM'; active: boolean; slabs: IncentiveSlab[]; onSave: (active: boolean, slabs: IncentiveSlab[]) => Promise<void> }) {
  const [on, setOn] = useState(active); const [rows, setRows] = useState<IncentiveSlab[]>(slabs.length ? slabs : [{ min: 50, rate: 0, bonus: 0 }]); const [busy, setBusy] = useState(false);
  const set = (i: number, k: keyof IncentiveSlab, v: string) => setRows(r => r.map((x, j) => j === i ? { ...x, [k]: Math.max(0, Number(v) || 0) } : x));
  return <Panel title={`${role} incentive plan`}>
    <label className="mb-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} />Plan is active {role === 'BDM' ? '(calculated on the BDM’s whole team)' : '(calculated on the BDE’s own collections)'}</label>
    <Table head={['From % of target', 'Incentive % of verified revenue', 'Fixed bonus (₹)', '']}>{rows.map((r, i) => <tr key={i}>
      <Td><input type="number" min={0} max={1000} aria-label="From % of target" className={inputCls} value={r.min} onChange={e => set(i, 'min', e.target.value)} /></Td>
      <Td><input type="number" min={0} max={100} step="0.1" aria-label="Incentive %" className={inputCls} value={r.rate} onChange={e => set(i, 'rate', e.target.value)} /></Td>
      <Td><input type="number" min={0} step="1" aria-label="Fixed bonus" className={inputCls} value={r.bonus} onChange={e => set(i, 'bonus', e.target.value)} /></Td>
      <Td><Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</Button></Td></tr>)}</Table>
    <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={rows.length >= 10} onClick={() => setRows([...rows, { min: (rows.at(-1)?.min ?? 0) + 25, rate: 0, bonus: 0 }])}>Add slab</Button>
      <Button size="sm" disabled={busy} onClick={() => { setBusy(true); void onSave(on, rows).finally(() => setBusy(false)); }}>{busy ? 'Sending…' : 'Propose change'}</Button></div>
  </Panel>;
}
