import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ErrorNote, Field, inputCls, Loading, Panel } from './common';

const days = [['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun']] as const;

/** Volunteer sets when they are available; their coordinator sees it. */
export function VolunteerAvailability({ volunteerId }: { volunteerId: string }) {
  const qc = useQueryClient(); const [err, setErr] = useState<unknown>(null); const [saved, setSaved] = useState(false);
  const q = useQuery({ queryKey: ['vol-availability', volunteerId], queryFn: async () => (await supabase.from('volunteer_availability').select('*').eq('volunteer_id', volunteerId).maybeSingle()).data });
  const [v, setV] = useState({ status: 'available', days: [] as string[], hours: '', note: '' });
  useEffect(() => { if (q.data) setV({ status: q.data.status, days: q.data.days, hours: q.data.hours, note: q.data.note }); }, [q.data]);
  if (q.isPending) return <Loading />;
  return <Panel title="My availability">
    <form className="grid gap-4" onSubmit={async e => { e.preventDefault(); setErr(null); setSaved(false); const { error } = await supabase.rpc('volunteer_set_availability', { _status: v.status, _days: v.days, _hours: v.hours, _note: v.note }); if (error) setErr(error); else { setSaved(true); void qc.invalidateQueries({ queryKey: ['vol-availability', volunteerId] }); } }}>
      <Field label="Status"><select className={inputCls} value={v.status} onChange={e => setV({ ...v, status: e.target.value })}><option value="available">Available</option><option value="busy">Busy</option><option value="unavailable">Not available</option></select></Field>
      <fieldset className="grid gap-2"><legend className="text-sm font-medium">Days I can work</legend><div className="flex flex-wrap gap-3">{days.map(([k, l]) => <label key={k} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={v.days.includes(k)} onChange={e => setV({ ...v, days: e.target.checked ? [...v.days, k] : v.days.filter(d => d !== k) })} />{l}</label>)}</div></fieldset>
      <Field label="Hours"><input className={inputCls} value={v.hours} maxLength={80} placeholder="e.g. 4 pm – 8 pm" onChange={e => setV({ ...v, hours: e.target.value })} /></Field>
      <Field label="Note for my coordinator"><input className={inputCls} value={v.note} maxLength={500} onChange={e => setV({ ...v, note: e.target.value })} /></Field>
      <ErrorNote error={err} />{saved && <p className="text-sm text-[var(--dash-success)]">Saved.</p>}
      <Button className="justify-self-start">Save availability</Button>
    </form>
  </Panel>;
}
