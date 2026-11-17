import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/shell';
import { dateTime, shortDate, todayIST } from '@/lib/requests';
import { downloadCsv } from '@/lib/finance';
import { Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from './common';
import { MyRequests } from './requests';

const statusTone = { present: 'success', wfh: 'info', leave: 'warning', half_day: 'warning', absent: 'danger', holiday: 'muted' } as const;
const time = (v: string | null) => (v ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');

export function LeaveBalance({ uid }: { uid: string }) {
  const q = useQuery({ queryKey: ['leave-summary', uid], queryFn: async () => { const { data, error } = await supabase.rpc('leave_summary'); if (error) throw error; return data; } });
  if (q.isPending) return <Loading />; if (q.error) return <ErrorNote error={q.error} />;
  return <div className="grid gap-3 sm:grid-cols-3">{q.data!.filter(l => l.leave_type !== 'unpaid').map(l => <KpiCard key={l.leave_type} label={l.label} value={`${Number(l.available)} / ${Number(l.allowed)}`} note={`${Number(l.used)} used · ${Number(l.pending)} pending approval`} tone={Number(l.available) <= 2 ? 'warning' : 'default'} />)}</div>;
}

export function LeavePanel({ uid }: { uid: string }) {
  return <div className="grid gap-5"><LeaveBalance uid={uid} /><MyRequests uid={uid} audience="employee" types={['leave', 'wfh', 'permission']} title="Leave, WFH & permissions" presetType="leave" /></div>;
}

export function AttendancePanel({ uid }: { uid: string }) {
  const qc = useQueryClient(); const [err, setErr] = useState<unknown>(null); const [busy, setBusy] = useState(false);
  const month = todayIST().slice(0, 7);
  const q = useQuery({ queryKey: ['attendance', uid, month], queryFn: async () => {
    const { data, error } = await supabase.from('attendance_records').select('*').eq('user_id', uid).gte('day', `${month}-01`).order('day', { ascending: false });
    if (error) throw error; return data;
  } });
  const today = q.data?.find(r => r.day === todayIST());
  const mark = async (a: 'in' | 'out') => { setBusy(true); setErr(null); const { error } = await supabase.rpc('attendance_mark', { _action: a }); setBusy(false); if (error) setErr(error); else void qc.invalidateQueries({ queryKey: ['attendance', uid] }); };
  const count = (s: string) => (q.data ?? []).filter(r => r.status === s).length;
  return <div className="grid gap-5">
    <Panel title="Today" actions={<><Button disabled={busy || Boolean(today?.check_in) || today?.status === 'leave'} onClick={() => void mark('in')}><LogIn className="size-4" />Check in</Button><Button variant="outline" disabled={busy || !today?.check_in || Boolean(today?.check_out)} onClick={() => void mark('out')}><LogOut className="size-4" />Check out</Button></>}>
      <p className="text-sm">{today ? <>Status <Pill tone={statusTone[today.status as keyof typeof statusTone] ?? 'muted'}>{today.status.replace('_', ' ')}</Pill> · in {time(today.check_in)} · out {time(today.check_out)}</> : 'Not checked in yet today.'}</p>
      <ErrorNote error={err} />
    </Panel>
    <div className="grid gap-3 sm:grid-cols-4"><KpiCard label="Present" value={count('present')} note="this month" /><KpiCard label="Work from home" value={count('wfh')} /><KpiCard label="Leave" value={count('leave') + count('half_day') / 2} /><KpiCard label="Absent" value={count('absent')} tone={count('absent') ? 'danger' : 'default'} /></div>
    <Panel title="This month">{q.isPending ? <Loading /> : !q.data!.length ? <Empty>No attendance yet this month.</Empty> :
      <Table head={['Date', 'Status', 'Check in', 'Check out', 'Note']}>{q.data!.map(r => <tr key={r.day}><Td>{shortDate(r.day)}</Td><Td><Pill tone={statusTone[r.status as keyof typeof statusTone] ?? 'muted'}>{r.status.replace('_', ' ')}</Pill></Td><Td>{time(r.check_in)}</Td><Td>{time(r.check_out)}</Td><Td className="text-xs text-muted-foreground">{r.note}</Td></tr>)}</Table>}</Panel>
    <MyRequests uid={uid} audience="employee" types={['attendance_correction']} title="Attendance corrections" presetType="attendance_correction" />
  </div>;
}

/** Team (for managers) or everyone (for HR/Admin) — decided by the database. */
export function TeamAttendance() {
  const [from, setFrom] = useState(`${todayIST().slice(0, 7)}-01`); const [to, setTo] = useState(todayIST());
  const q = useQuery({ queryKey: ['team-attendance', from, to], queryFn: async () => { const { data, error } = await supabase.rpc('team_attendance', { _from: from, _to: to }); if (error) throw error; return data; } });
  return <Panel title="Team attendance" actions={<>
    <Field label="From"><input type="date" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} /></Field>
    <Field label="To"><input type="date" className={inputCls} value={to} onChange={e => setTo(e.target.value)} /></Field>
    {q.data?.length ? <Button size="sm" variant="outline" className="self-end" onClick={() => downloadCsv('attendance.csv', q.data!.map(r => ({ name: r.full_name, date: r.day, status: r.status, check_in: r.check_in ?? '', check_out: r.check_out ?? '' })))}>Download CSV</Button> : null}</>}>
    {q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !q.data!.length ? <Empty>No attendance in these dates (up to 62 days at a time).</Empty> :
      <Table head={['Name', 'Date', 'Status', 'In', 'Out']}>{q.data!.map(r => <tr key={`${r.user_id}${r.day}`}><Td className="font-medium">{r.full_name}</Td><Td>{shortDate(r.day)}</Td><Td><Pill tone={statusTone[r.status as keyof typeof statusTone] ?? 'muted'}>{r.status.replace('_', ' ')}</Pill></Td><Td>{time(r.check_in)}</Td><Td>{time(r.check_out)}</Td></tr>)}</Table>}
  </Panel>;
}

export function PeopleList({ title = 'Team' }: { title?: string }) {
  const q = useQuery({ queryKey: ['work-people'], queryFn: async () => { const { data, error } = await supabase.rpc('work_people'); if (error) throw error; return data; } });
  return <Panel title={title} actions={q.data?.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv('employees.csv', q.data!.map(p => ({ name: p.full_name, role: p.role, department: p.department, manager: p.manager_name, email: p.email, phone: p.phone, joined: p.joining_date ?? '' })))}>Download CSV</Button> : undefined}>
    {q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !q.data!.length ? <Empty>No people to show.</Empty> :
      <Table head={['Name', 'Role', 'Department', 'Reports to', 'Contact', 'Joined']}>{q.data!.map(p => <tr key={p.user_id}><Td className="font-medium">{p.full_name}</Td><Td>{p.role}</Td><Td>{p.department}</Td><Td>{p.manager_name || '—'}</Td><Td className="text-xs">{p.email}{p.phone && <span className="block">{p.phone}</span>}</Td><Td>{shortDate(p.joining_date)}</Td></tr>)}</Table>}
  </Panel>;
}
export { dateTime };
