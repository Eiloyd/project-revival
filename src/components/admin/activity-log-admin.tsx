import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { activityLabels, type ActivityEvent } from '@/lib/activity-log';
import { dateTime, todayIST } from '@/lib/requests';
import { Empty, ErrorNote, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { KpiCard } from '@/components/dashboard/shell';

const tone = { login: 'success', logout: 'muted', tab_change: 'info', browser_tab_hidden: 'warning', browser_tab_visible: 'info' } as const;

/** Admin: who signed in / out and which dashboard sections (tabs) they opened, newest first. */
export function ActivityLogAdmin() {
  const [day, setDay] = useState(todayIST()); const [event, setEvent] = useState(''); const [search, setSearch] = useState('');
  const q = useQuery({ queryKey: ['activity-log', day, event], queryFn: async () => {
    const from = new Date(`${day}T00:00:00+05:30`).toISOString(); const to = new Date(new Date(from).getTime() + 86_400_000).toISOString();
    let r = supabase.from('user_activity_logs').select('*').gte('created_at', from).lt('created_at', to).order('created_at', { ascending: false }).limit(1000);
    if (event) r = r.eq('event', event);
    const { data, error } = await r; if (error) throw error; return data ?? [];
  } });
  const rows = (q.data ?? []).filter(r => !search || `${r.email} ${r.dashboard} ${r.section}`.toLowerCase().includes(search.toLowerCase()));
  const people = new Set(rows.map(r => r.user_id)).size;
  return <div className="grid gap-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="People active" value={people} /><KpiCard label="Sign-ins" value={rows.filter(r => r.event === 'login').length} tone="success" />
      <KpiCard label="Sign-outs" value={rows.filter(r => r.event === 'logout').length} /><KpiCard label="Sections opened" value={rows.filter(r => r.event === 'tab_change').length} />
    </div>
    <Panel title="Login, logout & tab activity" actions={<>
      <input aria-label="Search" placeholder="Email, dashboard, section…" className={`${inputCls} w-52`} value={search} onChange={e => setSearch(e.target.value)} />
      <select aria-label="Event" className={`${inputCls} w-auto`} value={event} onChange={e => setEvent(e.target.value)}><option value="">All events</option>{(Object.keys(activityLabels) as ActivityEvent[]).map(k => <option key={k} value={k}>{activityLabels[k]}</option>)}</select>
      <input aria-label="Day" type="date" className={`${inputCls} w-auto`} value={day} onChange={e => setDay(e.target.value)} /></>}>
      <p className="mb-3 text-xs text-muted-foreground">Saved automatically from every dashboard. Times are India time. Up to 1,000 entries per day are shown.</p>
      <ErrorNote error={q.error} />
      {q.isPending ? <Loading /> : !rows.length ? <Empty>No activity for this day.</Empty> : <Table head={['Time', 'Person', 'Event', 'Dashboard · section', 'Device']}>{rows.map(r => <tr key={r.id}>
        <Td className="whitespace-nowrap text-xs">{dateTime(r.created_at)}</Td><Td className="text-xs">{r.email || r.user_id.slice(0, 8)}</Td>
        <Td><Pill tone={tone[r.event as ActivityEvent] ?? 'muted'}>{activityLabels[r.event as ActivityEvent] ?? r.event}</Pill></Td>
        <Td className="text-xs">{[r.dashboard, r.section].filter(Boolean).join(' · ') || '—'}</Td>
        <Td className="max-w-56 truncate text-xs text-muted-foreground" >{/Mobi|Android|iPhone/i.test(r.user_agent) ? 'Phone' : 'Computer'}</Td>
      </tr>)}</Table>}
    </Panel>
  </div>;
}
