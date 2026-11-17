import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { todayIST } from '@/lib/requests';
import { must, useAction } from '@/components/hr/hrms';

type Holiday = { day: string; name: string; kind: string };
const kinds: Record<string, string> = { public: 'Public holiday', optional: 'Optional holiday', company: 'Company holiday' };
const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
function useHolidays(year: string) {
  return useQuery({ queryKey: ['hrms', 'holidays', year], queryFn: async () => must(await supabase.from('hr_holidays').select('day,name,kind').gte('day', `${year}-01-01`).lte('day', `${year}-12-31`).order('day')) as Holiday[] });
}

/** HR: central holiday calendar for everyone. */
export function HolidayAdmin() {
  const a = useAction(); const [year, setYear] = useState(todayIST().slice(0, 4)); const q = useHolidays(year);
  const [f, setF] = useState({ day: '', name: '', kind: 'public' });
  return <div className="grid gap-5">
    <Panel title="Add holiday">
      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-end">
        <Field label="Date"><input type="date" className={inputCls} value={f.day} onChange={e => setF({ ...f, day: e.target.value })} /></Field>
        <Field label="Holiday name"><input className={inputCls} maxLength={80} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="e.g. Diwali" /></Field>
        <Field label="Type"><select className={inputCls} value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}>{Object.entries(kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Button disabled={a.busy} onClick={() => void a.run(async () => { if (!f.day || f.name.trim().length < 2) throw new Error('Choose a date and enter the holiday name.');
          must(await supabase.from('hr_holidays').upsert({ day: f.day, name: f.name.trim(), kind: f.kind })); setF({ day: '', name: '', kind: 'public' }); }, 'Holiday saved. Everyone sees it under My Work → Holiday calendar.')}>Save</Button>
      </div><a.Status />
    </Panel>
    <HolidayList year={year} onYear={setYear} q={q} onRemove={h => void a.run(async () => { if (!confirm(`Remove ${h.name}?`)) return; must(await supabase.from('hr_holidays').delete().eq('day', h.day)); }, 'Holiday removed.')} />
  </div>;
}

/** Everyone with a work dashboard: this year's holidays. */
export function HolidayCalendar() {
  const [year, setYear] = useState(todayIST().slice(0, 4)); const q = useHolidays(year);
  return <HolidayList year={year} onYear={setYear} q={q} />;
}

function HolidayList({ year, onYear, q, onRemove }: { year: string; onYear: (y: string) => void; q: ReturnType<typeof useHolidays>; onRemove?: (h: Holiday) => void }) {
  const today = todayIST(); const next = q.data?.find(h => h.day >= today);
  return <Panel title={`Holiday calendar ${year}`} actions={<select aria-label="Year" className={`${inputCls} w-28`} value={year} onChange={e => onYear(e.target.value)}>{[-1, 0, 1].map(d => String(Number(today.slice(0, 4)) + d)).map(y => <option key={y}>{y}</option>)}</select>}>
    {next && <p className="mb-3 text-sm">Next holiday: <b>{next.name}</b> · {fmt(next.day)}</p>}
    <ErrorNote error={q.error} />{q.isPending ? <Loading /> : !q.data?.length ? <Empty>No holidays added for {year} yet.</Empty> :
      <Table head={['Date', 'Holiday', 'Type', ...(onRemove ? [''] : [])]}>{q.data.map(h => <tr key={h.day} className={h.day < today ? 'opacity-60' : ''}><Td>{fmt(h.day)}</Td><Td className="font-medium">{h.name}</Td><Td><Pill tone={h.kind === 'public' ? 'info' : 'muted'}>{kinds[h.kind] ?? h.kind}</Pill></Td>
        {onRemove && <Td><Button size="sm" variant="outline" onClick={() => onRemove(h)}>Remove</Button></Td>}</tr>)}</Table>}
  </Panel>;
}
