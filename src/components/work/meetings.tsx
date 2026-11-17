import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { dateTime } from '@/lib/requests';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill } from './common';

/** Meetings I organise or am invited to. Volunteers can see and answer; only employees schedule. */
export function MeetingsPanel({ uid, canSchedule = true }: { uid: string; canSchedule?: boolean }) {
  const qc = useQueryClient(); const [creating, setCreating] = useState(false); const [err, setErr] = useState<unknown>(null);
  const q = useQuery({ queryKey: ['meetings', uid], queryFn: async () => {
    const { data, error } = await supabase.from('meetings').select('*, meeting_attendees(user_id,response)').order('starts_at', { ascending: false }).limit(100);
    if (error) throw error; return data;
  } });
  const act = async (id: string, args: { _status?: string; _response?: string; _minutes?: string }) => { setErr(null); const { error } = await supabase.rpc('meeting_update', { _id: id, ...args }); if (error) setErr(error); else void qc.invalidateQueries({ queryKey: ['meetings', uid] }); };
  return <Panel title="Meetings" actions={canSchedule ? <Button size="sm" onClick={() => setCreating(true)}><CalendarPlus className="size-4" />Schedule meeting</Button> : undefined}>
    <ErrorNote error={err} />
    {q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !q.data!.length ? <Empty>No meetings yet.</Empty> :
      <ul className="grid gap-3">{q.data!.map(m => { const me = m.meeting_attendees.find(a => a.user_id === uid); const mine = m.organizer_id === uid; return <li key={m.id} className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{m.title}</p><p className="text-xs text-muted-foreground">{dateTime(m.starts_at)} · {m.duration_min} min{m.location && ` · ${m.location}`}</p></div>
          <Pill tone={m.status === 'cancelled' ? 'danger' : m.status === 'done' ? 'success' : 'info'}>{m.status}</Pill></div>
        {m.agenda && <p className="mt-2 whitespace-pre-wrap text-sm">{m.agenda}</p>}
        {m.minutes && <p className="mt-2 whitespace-pre-wrap rounded bg-muted/50 p-2 text-sm"><strong>Minutes / feedback:</strong> {m.minutes}</p>}
        <p className="mt-2 text-xs text-muted-foreground">{m.meeting_attendees.length} invited · {m.meeting_attendees.filter(a => a.response === 'accepted').length} accepted</p>
        {m.status === 'scheduled' && <div className="mt-3 flex flex-wrap gap-2">
          {me && !mine && <><Button size="sm" variant={me.response === 'accepted' ? 'default' : 'outline'} onClick={() => void act(m.id, { _response: 'accepted' })}>Accept</Button><Button size="sm" variant="outline" onClick={() => void act(m.id, { _response: 'declined' })}>Decline</Button></>}
          {mine && <><Button size="sm" variant="outline" onClick={() => { const t = window.prompt('Minutes / feedback for this meeting'); if (t !== null) void act(m.id, { _status: 'done', _minutes: t }); }}>Mark done</Button><Button size="sm" variant="ghost" onClick={() => void act(m.id, { _status: 'cancelled' })}>Cancel</Button></>}
        </div>}
      </li>; })}</ul>}
    {creating && <NewMeeting onClose={() => setCreating(false)} onDone={() => { setCreating(false); void qc.invalidateQueries({ queryKey: ['meetings', uid] }); }} />}
  </Panel>;
}

function NewMeeting({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const people = useQuery({ queryKey: ['work-contacts'], queryFn: async () => { const { data, error } = await supabase.rpc('work_contacts'); if (error) throw error; return data; } });
  const [v, setV] = useState({ title: '', agenda: '', when: '', duration: '30', location: '' }); const [picked, setPicked] = useState<string[]>([]);
  const [err, setErr] = useState<unknown>(null); const [busy, setBusy] = useState(false); const [filter, setFilter] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const { error } = await supabase.rpc('meeting_create', { _title: v.title, _agenda: v.agenda, _starts: new Date(v.when).toISOString(), _duration: Number(v.duration), _location: v.location, _attendees: picked });
    setBusy(false); if (error) setErr(error); else onDone();
  }
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="dash-shell max-h-[92vh] max-w-lg overflow-y-auto">
    <DialogHeader><DialogTitle>Schedule a meeting</DialogTitle></DialogHeader>
    <form onSubmit={e => void submit(e)} className="grid gap-4">
      <Field label="Title"><input className={inputCls} required minLength={3} value={v.title} onChange={e => setV({ ...v, title: e.target.value })} /></Field>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Date & time"><input type="datetime-local" className={inputCls} required value={v.when} onChange={e => setV({ ...v, when: e.target.value })} /></Field>
        <Field label="Minutes"><input type="number" min={5} max={480} className={inputCls} value={v.duration} onChange={e => setV({ ...v, duration: e.target.value })} /></Field></div>
      <Field label="Place or meeting link"><input className={inputCls} value={v.location} onChange={e => setV({ ...v, location: e.target.value })} /></Field>
      <Field label="Agenda"><textarea className={areaCls} value={v.agenda} onChange={e => setV({ ...v, agenda: e.target.value })} /></Field>
      <Field label={`Invite (${picked.length})`}><input className={inputCls} placeholder="Search names" value={filter} onChange={e => setFilter(e.target.value)} /></Field>
      <div className="max-h-48 overflow-y-auto rounded-md border border-border p-2">{people.isPending ? <Loading /> : (people.data ?? []).filter(p => p.full_name.toLowerCase().includes(filter.toLowerCase())).map(p => <label key={p.user_id} className="flex items-center gap-2 px-1 py-1 text-sm"><input type="checkbox" checked={picked.includes(p.user_id)} onChange={e => setPicked(s => e.target.checked ? [...s, p.user_id] : s.filter(x => x !== p.user_id))} />{p.full_name}<span className="text-xs text-muted-foreground">{p.kind}</span></label>)}</div>
      <ErrorNote error={err} />
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy || !picked.length}>{busy ? 'Saving…' : 'Schedule'}</Button></div>
    </form>
  </DialogContent></Dialog>;
}
