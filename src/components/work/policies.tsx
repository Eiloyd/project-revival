import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from './common';
import { compliancePct, STARTER_POLICIES } from '@/lib/ops/rules';

type Policy = { id: string; title: string; body: string; version: number; active: boolean };
const usePolicies = () => useQuery({ queryKey: ['company-policies'], queryFn: async () => { const { data, error } = await supabase.from('company_policies').select('*').order('title'); if (error) throw error; return data as Policy[]; } });

/** Employee: read each active policy and sign it. A new version needs a new signature. */
export function MyPolicies({ uid }: { uid: string }) {
  const qc = useQueryClient(); const pol = usePolicies(); const [open, setOpen] = useState(''); const [error, setError] = useState<unknown>(null);
  const acks = useQuery({ queryKey: ['policy-acks', uid], queryFn: async () => { const { data, error } = await supabase.from('policy_acknowledgements').select('policy_id,version,acknowledged_at').eq('user_id', uid); if (error) throw error; return data; } });
  const signed = (p: Policy) => acks.data?.find(a => a.policy_id === p.id && a.version === p.version);
  async function sign(p: Policy) { setError(null); const { error } = await supabase.from('policy_acknowledgements').insert({ policy_id: p.id, version: p.version, user_id: uid }); if (error) return setError(error); await qc.invalidateQueries({ queryKey: ['policy-acks', uid] }); }
  const active = (pol.data ?? []).filter(p => p.active);
  return <Panel title="Company policies">
    <p className="mb-3 text-sm text-muted-foreground">Read each policy and confirm. {active.filter(p => !signed(p)).length ? `${active.filter(p => !signed(p)).length} still need your signature.` : 'You have signed all policies.'}</p>
    <ErrorNote error={error} />
    {pol.isPending ? <Loading /> : !active.length ? <Empty>No policies published yet.</Empty> : <ul className="grid gap-3">{active.map(p => { const s = signed(p); return <li key={p.id} className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" className="text-left font-medium underline-offset-2 hover:underline" onClick={() => setOpen(open === p.id ? '' : p.id)}>{p.title} <span className="text-xs text-muted-foreground">v{p.version}</span></button>
        {s ? <Pill tone="success">Signed {new Date(s.acknowledged_at).toLocaleDateString('en-IN')}</Pill> : <Pill tone="warning">Not signed</Pill>}</div>
      {open === p.id && <><p className="mt-2 whitespace-pre-wrap text-sm">{p.body}</p>{!s && <Button size="sm" className="mt-3" onClick={() => void sign(p)}>I have read and agree</Button>}</>}
    </li>; })}</ul>}
  </Panel>;
}

/** HR/Admin: publish policies (editing the text raises the version) and see who has signed. */
export function PolicyAdmin() {
  const qc = useQueryClient(); const pol = usePolicies(); const [edit, setEdit] = useState<Partial<Policy> | null>(null); const [error, setError] = useState<unknown>(null);
  const acks = useQuery({ queryKey: ['policy-acks-all'], queryFn: async () => { const { data, error } = await supabase.from('policy_acknowledgements').select('policy_id,version,user_id'); if (error) throw error; return data; } });
  const staff = useQuery({ queryKey: ['policy-staff'], queryFn: async () => { const { data, error } = await supabase.from('hr_employee_master').select('user_id,full_name'); if (error) throw error; return data as { user_id: string; full_name: string }[]; } });
  const active = (pol.data ?? []).filter(p => p.active);
  const signedAll = (u: string) => active.every(p => acks.data?.some(a => a.user_id === u && a.policy_id === p.id && a.version === p.version));
  const emps = staff.data ?? []; const full = emps.filter(e => signedAll(e.user_id)).length;
  const refresh = () => qc.invalidateQueries({ queryKey: ['company-policies'] });
  async function save() {
    if (!edit) return; setError(null);
    if (!edit.title?.trim() || (edit.body?.trim().length ?? 0) < 20) return setError(new Error('Title and policy text (at least 20 characters) are required.'));
    const old = pol.data?.find(p => p.id === edit.id);
    const r = edit.id ? await supabase.from('company_policies').update({ title: edit.title, body: edit.body ?? '', version: old && old.body !== edit.body ? old.version + 1 : old?.version ?? 1, updated_at: new Date().toISOString() }).eq('id', edit.id) : await supabase.from('company_policies').insert({ title: edit.title!, body: edit.body! });
    if (r.error) return setError(r.error); setEdit(null); await refresh();
  }
  const missing = STARTER_POLICIES.filter(t => !pol.data?.some(p => p.title === t));
  return <div className="grid gap-5">
    <Panel title={`Policy sign-off — ${compliancePct(emps.length, full)}% of employees fully signed`} actions={!edit ? <Button size="sm" onClick={() => setEdit({ title: '', body: '' })}>New policy</Button> : undefined}>
      {missing.length > 0 && !edit && <p className="mb-3 text-sm text-muted-foreground">Standard policies not created yet: {missing.join(', ')}. Click "New policy" and paste your approved text for each — we don't write policy text for you.</p>}
      {edit && <div className="mb-4 grid gap-3 rounded-md border border-border p-4"><Field label="Title"><input className={inputCls} list="starter-policies" value={edit.title ?? ''} onChange={e => setEdit({ ...edit, title: e.target.value })} /><datalist id="starter-policies">{STARTER_POLICIES.map(t => <option key={t} value={t} />)}</datalist></Field>
        <Field label="Policy text" hint="Changing the text of a published policy makes everyone sign again."><textarea className={`${areaCls} min-h-48`} value={edit.body ?? ''} onChange={e => setEdit({ ...edit, body: e.target.value })} /></Field>
        <div className="flex gap-2"><Button onClick={() => void save()}>Save & publish</Button><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button></div></div>}
      <ErrorNote error={error} />
      {pol.isPending ? <Loading /> : !pol.data?.length ? <Empty>No policies yet.</Empty> : <Table head={['Policy', 'Version', 'Signed', '']}>{pol.data.map(p => <tr key={p.id} className="border-b border-border"><Td className="font-medium">{p.title}{!p.active && <> <Pill tone="danger">off</Pill></>}</Td><Td>v{p.version}</Td>
        <Td>{acks.data?.filter(a => a.policy_id === p.id && a.version === p.version).length ?? 0} / {emps.length}</Td>
        <Td className="flex gap-1"><Button size="sm" variant="outline" onClick={() => setEdit(p)}>Edit</Button><Button size="sm" variant="outline" onClick={() => void supabase.from('company_policies').update({ active: !p.active }).eq('id', p.id).then(() => refresh())}>{p.active ? 'Turn off' : 'Turn on'}</Button></Td></tr>)}</Table>}
    </Panel>
    <Panel title="Employees who still need to sign">{!emps.length ? <Empty>No employees in the master yet.</Empty> : <ul className="grid gap-1 text-sm sm:grid-cols-2">{emps.filter(e => !signedAll(e.user_id)).map(e => <li key={e.user_id}>{e.full_name}</li>)}{full === emps.length && <li>Everyone has signed.</li>}</ul>}</Panel>
  </div>;
}
