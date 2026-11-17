import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { isGstin } from '@/lib/ops/rules';

const stages = { new: 'New', visit_planned: 'Visit planned', visited: 'Factory visited', onboarded: 'Onboarded', dropped: 'Dropped' } as const;
const kyc = { pending: 'Pending', submitted: 'Submitted', verified: 'Verified', rejected: 'Rejected' } as const;
type Row = { id?: string; company: string; contact_name: string; phone: string; gstin: string; factory_address: string; products: string; machinery: string; capacity: string; certifications: string; kyc_status: keyof typeof kyc; stage: keyof typeof stages; notes: string };
const blank: Row = { company: '', contact_name: '', phone: '', gstin: '', factory_address: '', products: '', machinery: '', capacity: '', certifications: '', kyc_status: 'pending', stage: 'new', notes: '' };

/** Manufacturer onboarding, kept separate from customer leads. Visible to the owner, their BDM and admin. */
export function ManufacturersPanel() {
  const qc = useQueryClient(); const [edit, setEdit] = useState<Row | null>(null); const [error, setError] = useState<unknown>(null); const [busy, setBusy] = useState(false);
  const list = useQuery({ queryKey: ['crm-manufacturers'], queryFn: async () => { const { data, error } = await supabase.from('crm_manufacturers').select('*').order('updated_at', { ascending: false }); if (error) throw error; return data as (Row & { id: string; updated_at: string })[]; } });
  async function save() {
    if (!edit) return; setBusy(true); setError(null);
    try {
      if (edit.company.trim().length < 2) throw new Error('Enter the company name.');
      const gstin = edit.gstin.trim().toUpperCase(); if (!isGstin(gstin)) throw new Error('GSTIN should look like 27AAPFU0939F1ZV (15 characters).');
      const { id, ...rest } = { ...edit, gstin }; const r = id ? await supabase.from('crm_manufacturers').update(rest).eq('id', id) : await supabase.from('crm_manufacturers').insert(rest);
      if (r.error) throw r.error; setEdit(null); await qc.invalidateQueries({ queryKey: ['crm-manufacturers'] });
    } catch (e) { setError(e); } finally { setBusy(false); }
  }
  const f = (k: keyof Row, label: string, area = false) => <Field label={label}>{area ? <textarea className={areaCls} value={edit![k] as string} onChange={e => setEdit({ ...edit!, [k]: e.target.value })} /> : <input className={inputCls} value={edit![k] as string} onChange={e => setEdit({ ...edit!, [k]: e.target.value })} />}</Field>;
  return <Panel title="Manufacturer onboarding" actions={!edit ? <Button size="sm" onClick={() => setEdit({ ...blank })}>Add manufacturer</Button> : undefined}>
    <p className="mb-3 text-sm text-muted-foreground">Factories and suppliers you are onboarding — kept apart from customer leads.</p>
    {edit && <div className="mb-5 grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2">
      {f('company', 'Company *')}{f('contact_name', 'Contact person')}{f('phone', 'Phone')}{f('gstin', 'GSTIN')}
      {f('factory_address', 'Factory address', true)}{f('products', 'Products made', true)}{f('machinery', 'Machinery list', true)}{f('capacity', 'Production capacity (e.g. 5,000 units/month)')}{f('certifications', 'ISO / other certifications')}
      <Field label="KYC documents"><select className={inputCls} value={edit.kyc_status} onChange={e => setEdit({ ...edit, kyc_status: e.target.value as Row['kyc_status'] })}>{Object.entries(kyc).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label="Stage"><select className={inputCls} value={edit.stage} onChange={e => setEdit({ ...edit, stage: e.target.value as Row['stage'] })}>{Object.entries(stages).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      {f('notes', 'Notes', true)}
      <div className="flex gap-2 sm:col-span-2"><Button disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save'}</Button><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button></div>
      <div className="sm:col-span-2"><ErrorNote error={error} /></div></div>}
    {list.isPending ? <Loading /> : list.error ? <ErrorNote error={list.error} /> : !list.data?.length ? <Empty>No manufacturers yet.</Empty> :
      <Table head={['Company', 'GSTIN', 'Capacity', 'Certifications', 'KYC', 'Stage', '']}>{list.data.map(m => <tr key={m.id} className="border-b border-border">
        <Td className="font-medium">{m.company}<div className="text-xs text-muted-foreground">{m.contact_name} {m.phone}</div></Td><Td className="text-xs">{m.gstin || '—'}</Td><Td>{m.capacity || '—'}</Td><Td>{m.certifications || '—'}</Td>
        <Td><Pill tone={m.kyc_status === 'verified' ? 'success' : m.kyc_status === 'rejected' ? 'danger' : 'warning'}>{kyc[m.kyc_status]}</Pill></Td><Td>{stages[m.stage]}</Td>
        <Td><Button size="sm" variant="outline" onClick={() => setEdit({ ...blank, ...m })}>Edit</Button></Td></tr>)}</Table>}
  </Panel>;
}
