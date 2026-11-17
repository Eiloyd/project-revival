import { useState } from 'react';
import { AlertTriangle, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { areaCls, ErrorNote, Field, inputCls, Panel } from '@/components/work/common';
import { ticketCategories } from '@/lib/submission-schemas';
import { requestTypes } from '@/lib/support/ticket-triage';
import { channels, label } from './data';
/** Open or recent tickets (last 24 hours) from the same customer phone or email, so agents can avoid duplicates. */
async function findDuplicates(email: string, phone: string) {
  const digits = phone.replace(/\D/g, '').slice(-10); const mail = email.trim().toLowerCase();
  if (digits.length < 10 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return [];
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const ors = [digits.length === 10 && `phone.ilike.%${digits}`, mail && /^[^@\s,()]+@[^@\s,()]+$/.test(mail) && `email.ilike.${mail}`].filter(Boolean).join(',');
  const { data, error } = await supabase.from('customer_tickets').select('id,ticket_code,subject,status,created_at').or(ors).or(`created_at.gte.${since},status.in.(open,in_progress,waiting_customer)`).order('created_at', { ascending: false }).limit(5);
  if (error) throw error; return data;
}

export function LogTicket({ onCreated }: { onCreated: () => Promise<void> }) {
  const [dupes, setDupes] = useState<{ id: string; ticket_code: string; subject: string; status: string; created_at: string }[]>([]);
  const check = (form: HTMLFormElement | null) => { if (!form) return; const v = new FormData(form); void findDuplicates(String(v.get('email') ?? ''), String(v.get('phone') ?? '')).then(setDupes).catch(() => setDupes([])); };
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [notice, setNotice] = useState('');
  return <Panel title="Log a call / email / WhatsApp"><p className="mb-4 text-sm text-muted-foreground">Log incoming messages from any offline channel. The ticket is assigned to you and receives the priority-based SLA.</p>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const values = new FormData(form); const text = (key: string) => String(values.get(key) ?? '').trim();
      setBusy(true); setError(null); setNotice('');
      void (async () => { try { const { data, error } = await supabase.rpc('support_log_ticket', { _channel: text('channel'), _request_type: text('request_type'), _full_name: text('full_name'), _email: text('email'), _phone: text('phone'), _subject: text('subject'), _description: text('description'), _priority: text('priority'), _category: text('category'), _reference: text('reference') }); if (error) throw error; form.reset(); setDupes([]); setNotice(`Ticket ${data.ticket_code} created and assigned to you.`); await onCreated(); } catch (e) { setError(e); } finally { setBusy(false); } })();
    }}>
      <Field label="Channel"><select name="channel" className={inputCls} defaultValue="phone">{Object.entries(channels).filter(([value]) => value !== 'website').map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></Field>
      <Field label="Request type"><select name="request_type" className={inputCls}>{requestTypes.map(v => <option key={v}>{v}</option>)}</select></Field>
      <Field label="Customer name"><input required name="full_name" className={inputCls} minLength={2} maxLength={100} /></Field><Field label="Email (if available)"><input name="email" type="email" className={inputCls} maxLength={255} onBlur={e => check(e.currentTarget.form)} /></Field>
      <Field label="Phone (if available)"><input name="phone" type="tel" className={inputCls} maxLength={30} onBlur={e => check(e.currentTarget.form)} /></Field><Field label="Customer reference"><input name="reference" className={inputCls} maxLength={60} /></Field>
      {dupes.length > 0 && <div role="alert" className="sm:col-span-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"><p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="size-4" />Possible duplicate: this customer already has {dupes.length} open or recent ticket{dupes.length === 1 ? '' : 's'}</p>
        <ul className="mt-1 grid gap-0.5 text-xs">{dupes.map(d => <li key={d.id}><b>{d.ticket_code}</b> · {d.subject} · {label(d.status)} · {new Date(d.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</li>)}</ul>
        <p className="mt-1 text-xs text-muted-foreground">Add a note to the existing ticket instead, or create a new one if this is a different problem.</p></div>}
      <Field label="Priority"><select name="priority" className={inputCls}>{['normal', 'high', 'urgent'].map(v => <option key={v}>{label(v)}</option>)}</select></Field>
      <Field label="Category"><select name="category" className={inputCls} defaultValue="other">{ticketCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></Field>
      <div className="sm:col-span-2 grid gap-4"><Field label="Subject"><input required name="subject" minLength={5} maxLength={150} className={inputCls} /></Field><Field label="Description"><textarea required name="description" minLength={15} maxLength={2000} className={areaCls} /></Field><ErrorNote error={error} />{notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}<Button disabled={busy} type="submit"><Phone className="size-4" />{busy ? 'Creating…' : 'Create ticket'}</Button></div>
    </form>
  </Panel>;
}
