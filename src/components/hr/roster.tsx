import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill } from '@/components/work/common';
import { addDays, defaultWeek, weekDays, weekStart } from '@/lib/hr/roster';
import { todayIST } from '@/lib/requests';
import { must, useAction, useMasters } from '@/components/hr/hrms';

type Shift = { code: string; name: string; start_time: string | null; end_time: string | null; is_off: boolean; active: boolean; sort_order: number };
type Slot = { user_id: string; day: string; shift_code: string; note: string };
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
const time = (t: string | null) => (t ? t.slice(0, 5) : '');
export const shiftText = (s: Shift | undefined) => (!s ? '—' : s.is_off ? s.name : `${s.name} ${time(s.start_time)}–${time(s.end_time)}`);
function useShifts() { return useQuery({ queryKey: ['hrms', 'shifts'], queryFn: async () => must(await supabase.from('hr_shifts').select('*').order('sort_order')) as Shift[] }); }

/** HR weekly roster planner: shift per employee per day, defaults, copy last week, and shift types. */
export function RosterPlanner() {
  const a = useAction(); const masters = useMasters(); const shifts = useShifts();
  const [start, setStart] = useState(weekStart(todayIST())); const days = useMemo(() => weekDays(start), [start]);
  const roster = useQuery({ queryKey: ['hrms', 'roster', start], queryFn: async () => must(await supabase.from('hr_roster').select('user_id,day,shift_code,note').gte('day', days[0]!).lte('day', days[6]!)) as Slot[] });
  const people = (masters.data ?? []).filter(m => m.status !== 'exited');
  const cell = (u: string, d: string) => roster.data?.find(r => r.user_id === u && r.day === d)?.shift_code ?? '';
  const save = (rows: { user_id: string; day: string; shift_code: string }[], msg: string) => a.run(async () => {
    if (!rows.length) throw new Error('Nothing to save.'); must(await supabase.from('hr_roster').upsert(rows.map(r => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: 'user_id,day' })); }, msg);
  const fillDefault = (code: string) => save(people.flatMap(p => Object.entries(defaultWeek(start, code)).filter(([d]) => !cell(p.user_id, d)).map(([day, shift_code]) => ({ user_id: p.user_id, day, shift_code }))), 'Empty days filled (Sunday = week off).');
  const copyLast = () => a.run(async () => {
    const prev = must(await supabase.from('hr_roster').select('user_id,day,shift_code').gte('day', addDays(days[0]!, -7)).lte('day', addDays(days[6]!, -7))) as Slot[];
    if (!prev.length) throw new Error('Last week has no roster to copy.');
    must(await supabase.from('hr_roster').upsert(prev.map(r => ({ user_id: r.user_id, day: addDays(r.day, 7), shift_code: r.shift_code, updated_at: new Date().toISOString() })), { onConflict: 'user_id,day' }));
  }, 'Copied last week’s roster.');
  const active = (shifts.data ?? []).filter(s => s.active);
  return <div className="grid gap-5">
    <Panel title="Weekly shift roster" actions={<>
      <Button variant="outline" size="sm" onClick={() => setStart(addDays(start, -7))}>← Previous</Button>
      <input aria-label="Week of" type="date" className={`${inputCls} w-40`} value={start} onChange={e => e.target.value && setStart(weekStart(e.target.value))} />
      <Button variant="outline" size="sm" onClick={() => setStart(addDays(start, 7))}>Next →</Button></>}>
      <div className="mb-3 flex flex-wrap gap-2">
        {active.filter(s => !s.is_off).map(s => <Button key={s.code} size="sm" variant="outline" disabled={a.busy || !people.length} onClick={() => void fillDefault(s.code)}>Fill empty days with {s.name}</Button>)}
        <Button size="sm" variant="outline" disabled={a.busy} onClick={() => void copyLast()}>Copy last week</Button></div>
      <a.Status /><ErrorNote error={roster.error ?? masters.error} />
      {roster.isPending || masters.isPending ? <Loading /> : !people.length ? <Empty>Add employees under Employee master first.</Empty> :
        <div className="-mx-4 overflow-x-auto sm:mx-0"><table className="w-full min-w-[860px] text-sm"><thead><tr className="border-b border-border text-left text-[11px] uppercase text-muted-foreground"><th className="px-2 py-2">Employee</th>{days.map(d => <th key={d} className="px-2 py-2">{dayLabel(d)}</th>)}</tr></thead>
          <tbody>{people.map(p => <tr key={p.user_id} className="border-b border-border"><td className="px-2 py-2"><b>{p.full_name}</b><div className="text-xs text-muted-foreground">{p.employee_code}</div></td>
            {days.map(d => <td key={d} className="px-1 py-1.5"><select aria-label={`${p.full_name} ${d}`} className={`${inputCls} h-8 px-1 text-xs`} value={cell(p.user_id, d)} disabled={a.busy}
              onChange={e => e.target.value ? void save([{ user_id: p.user_id, day: d, shift_code: e.target.value }], 'Saved.') : void a.run(async () => must(await supabase.from('hr_roster').delete().eq('user_id', p.user_id).eq('day', d)), 'Cleared.')}>
              <option value="">—</option>{active.map(s => <option key={s.code} value={s.code}>{s.code} · {s.name}</option>)}</select></td>)}</tr>)}</tbody></table></div>}
      <p className="mt-2 text-xs text-muted-foreground">Employees see their own shifts under My HR; reporting managers see their team’s.</p>
    </Panel>
    <ShiftTypes shifts={shifts.data ?? []} />
  </div>;
}

function ShiftTypes({ shifts }: { shifts: Shift[] }) {
  const a = useAction(); const blank = { code: '', name: '', start_time: '', end_time: '', is_off: false };
  const [f, setF] = useState(blank); const editing = shifts.some(s => s.code === f.code);
  return <Panel title="Shift types">
    <div className="grid gap-3 sm:grid-cols-5 sm:items-end">
      <Field label="Code (A-Z, 0-9)"><input className={inputCls} maxLength={6} value={f.code} onChange={e => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} /></Field>
      <Field label="Name"><input className={inputCls} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Starts"><input type="time" className={inputCls} disabled={f.is_off} value={f.start_time} onChange={e => setF({ ...f, start_time: e.target.value })} /></Field>
      <Field label="Ends"><input type="time" className={inputCls} disabled={f.is_off} value={f.end_time} onChange={e => setF({ ...f, end_time: e.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_off} onChange={e => setF({ ...f, is_off: e.target.checked })} />Off day (week off / holiday)</label>
    </div>
    <div className="mt-3 flex gap-2"><Button disabled={a.busy} onClick={() => void a.run(async () => { if (!f.code || !f.name.trim()) throw new Error('Enter a code and name.'); if (!f.is_off && (!f.start_time || !f.end_time)) throw new Error('Enter start and end time.');
      const row = { name: f.name.trim(), is_off: f.is_off, start_time: f.is_off ? null : f.start_time, end_time: f.is_off ? null : f.end_time };
      must(editing ? await supabase.from('hr_shifts').update(row).eq('code', f.code) : await supabase.from('hr_shifts').insert({ ...row, code: f.code, sort_order: shifts.length })); setF(blank); }, 'Shift saved.')}>{editing ? 'Update shift' : 'Add shift'}</Button>
      {f.code && <Button variant="outline" onClick={() => setF(blank)}>Clear</Button>}</div><a.Status />
    <ul className="mt-4 grid gap-2 text-sm">{shifts.map(s => <li key={s.code} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2"><span><b>{s.code}</b> · {shiftText(s)} {!s.active && <Pill tone="danger">off</Pill>}</span>
      <span className="flex gap-1"><Button size="sm" variant="outline" onClick={() => setF({ code: s.code, name: s.name, start_time: time(s.start_time), end_time: time(s.end_time), is_off: s.is_off })}>Edit</Button>
        <Button size="sm" variant="outline" onClick={() => void a.run(async () => must(await supabase.from('hr_shifts').update({ active: !s.active }).eq('code', s.code)))}>{s.active ? 'Turn off' : 'Turn on'}</Button></span></li>)}</ul>
  </Panel>;
}

/** Employee self-service: this week's and next week's shifts. */
export function MyRoster({ uid }: { uid: string }) {
  const shifts = useShifts(); const start = weekStart(todayIST()); const days = [...weekDays(start), ...weekDays(addDays(start, 7))];
  const q = useQuery({ queryKey: ['hrms', 'my-roster', uid, start], queryFn: async () => must(await supabase.from('hr_roster').select('day,shift_code,note').eq('user_id', uid).gte('day', days[0]!).lte('day', days[13]!)) as Omit<Slot, 'user_id'>[] });
  return <Panel title="My shifts (this week and next)">{q.isPending ? <Loading /> : !q.data?.length ? <Empty>HR has not published your roster yet.</Empty> :
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{days.map(d => { const r = q.data!.find(x => x.day === d); const s = shifts.data?.find(x => x.code === r?.shift_code);
      return <div key={d} className={`rounded-md border p-2 text-xs ${d === todayIST() ? 'border-primary' : 'border-border'}`}><p className="font-semibold">{dayLabel(d)}</p><p className="text-muted-foreground">{r ? shiftText(s) : '—'}</p></div>; })}</div>}</Panel>;
}
