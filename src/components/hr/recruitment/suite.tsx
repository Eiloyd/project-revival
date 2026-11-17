import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { inr, must, useAction } from '@/components/hr/hrms';
import { downloadCsv } from '@/lib/finance';
import { allowedJobStatuses, averageDaysToHire, employmentTypes, funnel, furthestStage, isActive, jobStatusLabels, jobUrl, pct, referralKinds, referralUrl, roundLabels, sourceLabels, stageLabels, workModes, type JobStatus } from '@/lib/hr/hiring';
import { Applications, CandidateProfile } from './candidates';
import { fmtDate, fmtDateTime, useAssessments, useCands, useEvents, useInstitutes, useJobs, useLinks, usePayouts, usePeople, useRecruitRole, useRounds, type Cand, type Job } from './data';

type Tab = 'dash' | 'jobs' | 'apps' | 'rounds' | 'refs' | 'reports';
const tabs: [Tab, string][] = [['dash', 'Dashboard'], ['jobs', 'Jobs'], ['apps', 'Applications'], ['rounds', 'Interviews'], ['refs', 'Referrals & commission'], ['reports', 'Reports']];
const lbl = (m: Record<string, string>, v: string) => m[v] ?? v.replace(/_/g, ' ');
const jobTone = (s: string) => (s === 'open' ? 'success' : s === 'pending_approval' ? 'warning' : s === 'on_hold' ? 'info' : 'muted') as 'success' | 'warning' | 'info' | 'muted';

/** Career & Recruitment: used by HR (daily operations) and Admin (monitoring and control). */
export function RecruitmentSuite({ admin = false }: { admin?: boolean }) {
  const [tab, setTab] = useState<Tab>(() => (typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('rtab') as Tab)) || 'dash');
  return <div className="grid gap-4">
    <p className="text-sm text-muted-foreground">{admin ? 'Admin view: monitor and control every job, application, institute and referral partner. HR runs the daily hiring here too.' : 'Jobs, applications, interviews, assessments, offers, referral partners and reports in one place.'}</p>
    <div className="flex flex-wrap gap-1 border-b border-border" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? 'border-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{l}</button>)}</div>
    {tab === 'dash' ? <RecruitDashboard go={setTab} /> : tab === 'jobs' ? <JobsPanel /> : tab === 'apps' ? <Applications /> : tab === 'rounds' ? <InterviewsPanel /> : tab === 'refs' ? <ReferralsPanel /> : <RecruitReports />}
  </div>;
}

function Stat({ t, v, hint }: { t: string; v: number | string; hint?: string }) { return <div className="dash-card p-3"><p className="text-xs text-muted-foreground">{t}</p><p className="mt-1 text-2xl font-bold tabular-nums">{v}</p>{hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}</div>; }

function RecruitDashboard({ go }: { go: (t: Tab) => void }) {
  const jobs = useJobs(); const cands = useCands(); const rounds = useRounds(); const assess = useAssessments(); const ev = useEvents();
  if (jobs.isPending || cands.isPending) return <Loading />;
  const C = cands.data ?? []; const R = rounds.data ?? []; const A = assess.data ?? [];
  const reached = (c: Cand) => furthestStage((ev.data ?? []).filter(e => e.candidate_id === c.id), c.stage);
  const f = funnel(C.map(c => ({ stage: c.stage, offer_status: c.offer_status, reached: reached(c) })));
  const week = Date.now() - 7 * 86_400_000; const soon = Date.now() + 7 * 86_400_000;
  const upcoming = R.filter(r => r.status === 'scheduled' && new Date(r.scheduled_at).getTime() >= Date.now() - 3_600_000 && new Date(r.scheduled_at).getTime() <= soon).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const name = (id: string) => C.find(c => c.id === id)?.full_name ?? '—';
  const waitingJobs = (jobs.data ?? []).filter(j => j.status === 'pending_approval');
  const toEvaluate = A.filter(a => a.status === 'submitted');
  const feedbackDue = R.filter(r => r.status === 'scheduled' && new Date(r.scheduled_at).getTime() < Date.now() - 3_600_000);
  return <div className="grid gap-4">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Stat t="Open jobs (not closed)" v={(jobs.data ?? []).filter(j => ['draft', 'pending_approval', 'open', 'on_hold'].includes(j.status)).length} /><Stat t="Published jobs" v={(jobs.data ?? []).filter(j => j.status === 'open').length} />
      <Stat t="Total applications" v={C.length} /><Stat t="New (last 7 days)" v={C.filter(c => new Date(c.created_at).getTime() >= week).length} />
      <Stat t="Pending screening" v={C.filter(c => c.stage === 'applied' || c.stage === 'screening').length} /><Stat t="Shortlisted" v={C.filter(c => c.stage === 'shortlisted').length} />
      <Stat t="Assessment pending" v={A.filter(a => a.status === 'assigned' || a.status === 'submitted').length} /><Stat t="Interviews scheduled" v={R.filter(r => r.status === 'scheduled').length} />
      <Stat t="Interviews completed" v={R.filter(r => r.status === 'completed').length} /><Stat t="Selected" v={C.filter(c => c.stage === 'selected').length} />
      <Stat t="Rejected" v={C.filter(c => c.stage === 'rejected').length} /><Stat t="Offers released" v={C.filter(c => c.offer_status !== 'none').length} />
      <Stat t="Offers accepted" v={C.filter(c => c.offer_status === 'accepted').length} /><Stat t="Joining pending" v={C.filter(c => c.stage === 'offered' && c.offer_status === 'accepted').length} />
      <Stat t="Joined" v={f.joined} hint={`Conversion ${pct(f.joined, f.applications)}% of applications`} />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Interviews in the next 7 days" actions={<Button size="sm" variant="outline" onClick={() => go('rounds')}>All interviews</Button>}>{!upcoming.length ? <Empty>None scheduled.</Empty> : <ul className="grid gap-1 text-sm">{upcoming.map(r => <li key={r.id} className="flex justify-between gap-2 border-b border-border py-1"><span><b>{name(r.candidate_id)}</b> · {lbl(roundLabels, r.round_type)}</span><span className="text-muted-foreground">{fmtDateTime(r.scheduled_at)}</span></li>)}</ul>}</Panel>
      <Panel title="Waiting for action">
        <ul className="grid gap-2 text-sm">
          <li className="flex justify-between"><button type="button" className="underline-offset-2 hover:underline" onClick={() => go('jobs')}>Jobs waiting for approval to publish</button><b>{waitingJobs.length}</b></li>
          <li className="flex justify-between"><button type="button" className="underline-offset-2 hover:underline" onClick={() => go('apps')}>Assessments submitted, not evaluated</button><b>{toEvaluate.length}</b></li>
          <li className="flex justify-between"><button type="button" className="underline-offset-2 hover:underline" onClick={() => go('rounds')}>Interviews past their time without feedback</button><b>{feedbackDue.length}</b></li>
          <li className="flex justify-between"><button type="button" className="underline-offset-2 hover:underline" onClick={() => go('apps')}>Offers waiting for the candidate's answer</button><b>{C.filter(c => c.stage === 'offered' && c.offer_status === 'released').length}</b></li>
          <li className="flex justify-between"><button type="button" className="underline-offset-2 hover:underline" onClick={() => go('apps')}>Referral conflicts to review</button><b>{C.filter(c => c.referral_conflict && isActive(c.stage)).length}</b></li>
        </ul>
      </Panel>
    </div>
  </div>;
}

const blankJob = { id: '', title: '', department: '', designation: '', location: '', employment_type: 'full_time', work_mode: 'office', openings: '1', salary_range: '', show_salary: true, description: '', responsibilities: '', qualification: '', skills: '', experience_required: '', working_days: '', working_hours: '', reporting_manager: '', apply_start: '', apply_end: '', selection_process: '', required_docs: '', visibility: 'public', recruiter_id: '', status: 'draft' };
function JobsPanel() {
  const a = useAction(); const jobs = useJobs(); const cands = useCands(); const role = useRecruitRole(); const people = usePeople();
  const [f, setF] = useState(blankJob); const [show, setShow] = useState(false);
  const set = (k: keyof typeof blankJob) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const r = role.data ?? { admin: false, hrManager: false };
  const save = (status: string) => a.run(async () => {
    if (f.title.trim().length < 2) throw new Error('Enter the job title.'); if (!f.department.trim()) throw new Error('Enter the department.');
    if (f.apply_start && f.apply_end && f.apply_end < f.apply_start) throw new Error('The last date must be after the start date.');
    const { id: _id, ...rest } = f;
    const row = { ...rest, title: f.title.trim(), openings: Math.max(1, Number(f.openings) || 1), apply_start: f.apply_start || null, apply_end: f.apply_end || null, recruiter_id: f.recruiter_id || null, status };
    must(f.id ? await supabase.from('hr_job_openings').update(row as never).eq('id', f.id) : await supabase.from('hr_job_openings').insert(row as never));
    setF(blankJob); setShow(false);
  }, status === 'open' ? 'Job published on the career page.' : status === 'pending_approval' ? 'Sent to Admin / HR manager for approval.' : 'Job saved.');
  const edit = (j: Job) => { setShow(true); setF({ ...blankJob, ...Object.fromEntries(Object.entries(j).map(([k, v]) => [k, v ?? ''])), openings: String(j.openings), show_salary: j.show_salary, id: j.id } as typeof blankJob); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const setStatus = (j: Job, s: string) => a.run(async () => must(await supabase.from('hr_job_openings').update({ status: s }).eq('id', j.id)), `Status: ${lbl(jobStatusLabels, s)}.`);
  const copy = (t: string) => a.run(async () => { await navigator.clipboard.writeText(t); }, 'Link copied.');
  return <div className="grid gap-4">
    <Panel title={f.id ? 'Edit job' : 'Create a job'} actions={<Button size="sm" variant="outline" onClick={() => { setShow(v => !v); if (show) setF(blankJob); }}>{show ? 'Close' : 'New job'}</Button>}>
      {!show ? <p className="text-sm text-muted-foreground">HR and Admin can create and edit jobs. {r.hrManager ? 'You can publish jobs directly.' : 'Your jobs go to Admin / HR manager for approval before they appear on the career page.'}</p> : <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Job title"><input className={inputCls} value={f.title} onChange={set('title')} /></Field>
          <Field label="Department"><input className={inputCls} value={f.department} onChange={set('department')} /></Field>
          <Field label="Designation"><input className={inputCls} value={f.designation} onChange={set('designation')} /></Field>
          <Field label="Vacancies"><input type="number" min="1" max="500" className={inputCls} value={f.openings} onChange={set('openings')} /></Field>
          <Field label="Employment type"><select className={inputCls} value={f.employment_type} onChange={set('employment_type')}>{Object.entries(employmentTypes).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Work mode"><select className={inputCls} value={f.work_mode} onChange={set('work_mode')}>{Object.entries(workModes).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Location"><input className={inputCls} value={f.location} onChange={set('location')} /></Field>
          <Field label="Salary / CTC range"><input className={inputCls} placeholder="e.g. ₹18,000–25,000 / month" value={f.salary_range} onChange={set('salary_range')} /></Field>
          <Field label="Qualification required"><input className={inputCls} value={f.qualification} onChange={set('qualification')} /></Field>
          <Field label="Experience required"><input className={inputCls} placeholder="e.g. 0–2 years" value={f.experience_required} onChange={set('experience_required')} /></Field>
          <Field label="Working days"><input className={inputCls} placeholder="e.g. Mon–Sat" value={f.working_days} onChange={set('working_days')} /></Field>
          <Field label="Working hours"><input className={inputCls} placeholder="e.g. 10:00–18:30" value={f.working_hours} onChange={set('working_hours')} /></Field>
          <Field label="Reporting manager"><input className={inputCls} value={f.reporting_manager} onChange={set('reporting_manager')} /></Field>
          <Field label="Application start date"><input type="date" className={inputCls} value={f.apply_start} onChange={set('apply_start')} /></Field>
          <Field label="Application last date"><input type="date" className={inputCls} value={f.apply_end} onChange={set('apply_end')} /></Field>
          <Field label="Assigned recruiter"><select className={inputCls} value={f.recruiter_id} onChange={set('recruiter_id')}><option value="">None</option>{people.data?.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}</select></Field>
          <Field label="Visibility"><select className={inputCls} value={f.visibility} onChange={set('visibility')}><option value="public">Public career page</option><option value="internal">Internal only (referrals, institutes)</option></select></Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={f.show_salary} onChange={e => setF({ ...f, show_salary: e.target.checked })} />Show salary on career page</label>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <Field label="Job description"><textarea className={areaCls} value={f.description} onChange={set('description')} /></Field>
          <Field label="Roles & responsibilities"><textarea className={areaCls} value={f.responsibilities} onChange={set('responsibilities')} /></Field>
          <Field label="Required skills"><textarea className={areaCls} value={f.skills} onChange={set('skills')} /></Field>
          <Field label="Selection process" hint="Shown to candidates, e.g. Screening → Aptitude test → HR round → Final interview"><textarea className={areaCls} value={f.selection_process} onChange={set('selection_process')} /></Field>
          <Field label="Documents required"><textarea className={areaCls} value={f.required_docs} onChange={set('required_docs')} /></Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" disabled={a.busy} onClick={() => void save(f.id ? f.status : 'draft')}>{f.id ? 'Save changes' : 'Save as draft'}</Button>
          {!r.hrManager && <Button disabled={a.busy} onClick={() => void save('pending_approval')}>Send for approval</Button>}
          {r.hrManager && <Button disabled={a.busy} onClick={() => void save('open')}>Save & publish</Button>}
        </div></>}
      <a.Status />
    </Panel>
    <Panel title={`Jobs (${jobs.data?.length ?? 0})`} actions={jobs.data?.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv('jobs.csv', jobs.data!.map(j => ({ code: j.job_code, title: j.title, department: j.department, location: j.location, vacancies: j.openings, status: lbl(jobStatusLabels, j.status), last_date: j.apply_end ?? '', applications: (cands.data ?? []).filter(c => c.job_id === j.id).length, joined: (cands.data ?? []).filter(c => c.job_id === j.id && c.stage === 'hired').length })))}>Export CSV</Button> : undefined}>
      <ErrorNote error={jobs.error} />{jobs.isPending ? <Loading /> : !jobs.data?.length ? <Empty>No jobs yet. Create the first one above.</Empty> :
        <Table head={['Job', 'Department', 'Vacancies', 'Applications', 'Joined', 'Last date', 'Status', '']}>{jobs.data.map(j => { const cs = (cands.data ?? []).filter(c => c.job_id === j.id); const opts = allowedJobStatuses(j.status as JobStatus, r); return <tr key={j.id} className="border-b border-border">
          <Td><b>{j.title}</b><div className="text-xs text-muted-foreground">{j.job_code} · {j.location || '—'} · {lbl(employmentTypes, j.employment_type)} · {lbl(workModes, j.work_mode)}{j.visibility === 'internal' && ' · internal'}</div></Td>
          <Td>{j.department}</Td><Td>{j.openings}</Td><Td>{cs.length}</Td><Td>{cs.filter(c => c.stage === 'hired').length}</Td><Td>{fmtDate(j.apply_end)}</Td>
          <Td><Pill tone={jobTone(j.status)}>{lbl(jobStatusLabels, j.status)}</Pill></Td>
          <Td><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" onClick={() => edit(j)}>Edit</Button>
            {j.status === 'pending_approval' && r.hrManager && <Button size="sm" onClick={() => void setStatus(j, 'open')}>Approve & publish</Button>}
            <select aria-label={`Status of ${j.title}`} className={`${inputCls} h-8 w-36`} value={j.status} onChange={e => void setStatus(j, e.target.value)}>{opts.map(s => <option key={s} value={s}>{lbl(jobStatusLabels, s)}</option>)}</select>
            <Button size="sm" variant="ghost" onClick={() => void copy(jobUrl(window.location.origin, j.job_code))}>Copy job link</Button></div></Td></tr>; })}</Table>}
    </Panel>
  </div>;
}

function InterviewsPanel() {
  const rounds = useRounds(); const cands = useCands(); const jobs = useJobs(); const [f, setF] = useState('upcoming'); const [open, setOpen] = useState<string | null>(null);
  const now = Date.now();
  const list = (rounds.data ?? []).filter(r => f === 'all' || (f === 'upcoming' ? r.status === 'scheduled' && new Date(r.scheduled_at).getTime() >= now - 3_600_000 : f === 'overdue' ? r.status === 'scheduled' && new Date(r.scheduled_at).getTime() < now - 3_600_000 : r.status === f)).sort((a, b) => f === 'upcoming' ? a.scheduled_at.localeCompare(b.scheduled_at) : b.scheduled_at.localeCompare(a.scheduled_at));
  const cand = (id: string) => cands.data?.find(c => c.id === id);
  const cur = cands.data?.find(c => c.id === open);
  return <Panel title="Interview schedule" actions={<select aria-label="Show" className={`${inputCls} w-48`} value={f} onChange={e => setF(e.target.value)}><option value="upcoming">Upcoming</option><option value="overdue">Past time, feedback pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="all">All</option></select>}>
    {rounds.isPending ? <Loading /> : !list.length ? <Empty>No interviews here. Schedule rounds from a candidate's profile.</Empty> :
      <Table head={['When', 'Candidate', 'Round', 'Interviewer', 'Mode / place', 'Status', 'Score', '']}>{list.map(r => <tr key={r.id} className="border-b border-border"><Td className="whitespace-nowrap">{fmtDateTime(r.scheduled_at)}</Td><Td>{cand(r.candidate_id)?.full_name ?? '—'}</Td><Td>{lbl(roundLabels, r.round_type)}</Td><Td>{r.interviewer_name || '—'}</Td><Td className="text-xs">{r.mode.replace('_', ' ')}{r.location_or_link && ` · ${r.location_or_link}`}</Td><Td><Pill tone={r.status === 'completed' ? 'success' : r.status === 'scheduled' ? 'info' : 'muted'}>{r.status.replace('_', ' ')}</Pill></Td><Td>{r.score ?? '—'}</Td><Td><Button size="sm" variant="outline" onClick={() => setOpen(r.candidate_id)}>Open</Button></Td></tr>)}</Table>}
    {cur && <CandidateProfile c={cur} job={jobs.data?.find(j => j.id === cur.job_id)} all={cands.data ?? []} jobs={jobs.data ?? []} onClose={() => setOpen(null)} />}
  </Panel>;
}

function ReferralsPanel() {
  const a = useAction(); const links = useLinks(); const jobs = useJobs(); const inst = useInstitutes(); const cands = useCands(); const payouts = usePayouts(); const role = useRecruitRole();
  const blank = { kind: 'institute', job_id: '', institute_id: '', owner_name: '', owner_contact: '', commission_amount: '0', expires_at: '' };
  const [v, setV] = useState(blank);
  const job = (id: string | null) => jobs.data?.find(j => j.id === id);
  const stats = (id: string) => { const cs = (cands.data ?? []).filter(c => c.referral_link_id === id); return { apps: cs.length, short: cs.filter(c => ['shortlisted', 'assessment', 'interview', 'selected', 'offered', 'hired'].includes(c.stage)).length, sel: cs.filter(c => ['selected', 'offered', 'hired'].includes(c.stage)).length, joined: cs.filter(c => c.stage === 'hired').length }; };
  const pay = (id: string) => (payouts.data ?? []).filter(p => p.link_id === id);
  const copy = (t: string) => a.run(async () => { await navigator.clipboard.writeText(t); }, 'Link copied.');
  const expired = (d: string | null) => !!d && d < new Date().toISOString().slice(0, 10);
  return <div className="grid gap-4">
    <Panel title="Create a referral link">
      <p className="mb-3 text-sm text-muted-foreground">Each link carries a unique code. Applications that come through it are attributed on the server and the applicant cannot change it. Leave the job empty for a link that works on every job.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Type"><select className={inputCls} value={v.kind} onChange={e => setV({ ...v, kind: e.target.value })}>{Object.entries(referralKinds).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Job (optional)"><select className={inputCls} value={v.job_id} onChange={e => setV({ ...v, job_id: e.target.value })}><option value="">All jobs</option>{jobs.data?.filter(j => ['open', 'on_hold', 'draft', 'pending_approval'].includes(j.status)).map(j => <option key={j.id} value={j.id}>{j.job_code} · {j.title}</option>)}</select></Field>
        {v.kind === 'institute' && <Field label="Institute"><select className={inputCls} value={v.institute_id} onChange={e => { const i = inst.data?.find(x => x.id === e.target.value); setV({ ...v, institute_id: e.target.value, owner_name: i?.name ?? v.owner_name }); }}><option value="">Choose…</option>{inst.data?.filter(i => i.active).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field>}
        <Field label={v.kind === 'institute' ? 'Name shown on the form' : 'Partner / coordinator name'}><input className={inputCls} value={v.owner_name} onChange={e => setV({ ...v, owner_name: e.target.value })} /></Field>
        <Field label="Contact (internal only)"><input className={inputCls} value={v.owner_contact} onChange={e => setV({ ...v, owner_contact: e.target.value })} /></Field>
        <Field label="Commission per joined candidate (₹)"><input type="number" min="0" className={inputCls} value={v.commission_amount} onChange={e => setV({ ...v, commission_amount: e.target.value })} /></Field>
        <Field label="Expires on (optional)"><input type="date" className={inputCls} value={v.expires_at} onChange={e => setV({ ...v, expires_at: e.target.value })} /></Field>
      </div>
      <Button className="mt-3" disabled={a.busy} onClick={() => void a.run(async () => {
        if (v.owner_name.trim().length < 2) throw new Error('Enter the partner name.'); if (v.kind === 'institute' && !v.institute_id) throw new Error('Choose the institute.');
        must(await supabase.from('hr_referral_links').insert({ kind: v.kind, job_id: v.job_id || null, institute_id: v.kind === 'institute' ? v.institute_id : null, owner_name: v.owner_name.trim(), owner_contact: v.owner_contact.trim(), commission_amount: Math.max(0, Number(v.commission_amount) || 0), expires_at: v.expires_at || null, code: 'pending' }));
        setV(blank);
      }, 'Referral link created.')}>Create link</Button><a.Status />
    </Panel>
    <Panel title={`Referral links (${links.data?.length ?? 0})`} actions={links.data?.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv('referral-links.csv', links.data!.map(l => { const s = stats(l.id); return { code: l.code, type: lbl(referralKinds, l.kind), partner: l.owner_name, job: job(l.job_id)?.job_code ?? 'All jobs', clicks: l.clicks, applications: s.apps, shortlisted: s.short, selected: s.sel, joined: s.joined, commission_paid: pay(l.id).filter(p => p.status === 'paid').reduce((t, p) => t + Number(p.amount), 0), status: !l.active ? 'Inactive' : expired(l.expires_at) ? 'Expired' : 'Active' }; }))}>Export CSV</Button> : undefined}>
      {links.isPending ? <Loading /> : !links.data?.length ? <Empty>No referral links yet.</Empty> :
        <Table head={['Code / partner', 'Job', 'Clicks', 'Applied', 'Shortlisted', 'Selected', 'Joined', 'Commission', 'Status', '']}>{links.data.map(l => { const s = stats(l.id); const j = job(l.job_id); const p = pay(l.id); return <tr key={l.id} className="border-b border-border">
          <Td><b className="font-mono text-xs">{l.code}</b><div>{l.owner_name}</div><div className="text-xs text-muted-foreground">{lbl(referralKinds, l.kind)}{l.commission_amount > 0 && ` · ${inr(l.commission_amount)} per joining`}</div></Td>
          <Td>{j ? `${j.job_code} · ${j.title}` : 'All jobs'}</Td><Td>{l.clicks}</Td><Td>{s.apps}</Td><Td>{s.short}</Td><Td>{s.sel}</Td><Td>{s.joined}</Td>
          <Td className="text-xs">Due {inr(p.filter(x => x.status === 'due' || x.status === 'approved').reduce((t, x) => t + Number(x.amount), 0))}<br />Paid {inr(p.filter(x => x.status === 'paid').reduce((t, x) => t + Number(x.amount), 0))}</Td>
          <Td><Pill tone={!l.active ? 'muted' : expired(l.expires_at) ? 'warning' : 'success'}>{!l.active ? 'Inactive' : expired(l.expires_at) ? 'Expired' : 'Active'}</Pill></Td>
          <Td><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" onClick={() => void copy(referralUrl(window.location.origin, j?.job_code ?? null, l.code))}>Copy link</Button><Button size="sm" variant="ghost" onClick={() => void a.run(async () => must(await supabase.from('hr_referral_links').update({ active: !l.active }).eq('id', l.id)), l.active ? 'Link deactivated.' : 'Link activated.')}>{l.active ? 'Deactivate' : 'Activate'}</Button></div></Td></tr>; })}</Table>}
    </Panel>
    <Panel title="Referral commissions">
      <p className="mb-3 text-sm text-muted-foreground">A commission is created automatically when a candidate who came through a paid referral link joins. Admin, Finance or an HR manager marks it paid with the payment reference.</p>
      {payouts.isPending ? <Loading /> : !payouts.data?.length ? <Empty>No commissions yet.</Empty> :
        <Table head={['Candidate', 'Partner', 'Amount', 'Status', 'Reference', '']}>{payouts.data.map(p => { const c = cands.data?.find(x => x.id === p.candidate_id); const l = links.data?.find(x => x.id === p.link_id); return <tr key={p.id} className="border-b border-border">
          <Td>{c?.full_name ?? '—'}<div className="text-xs text-muted-foreground">joined {fmtDate(c?.joining_date)}</div></Td><Td>{l ? `${l.owner_name} · ${l.code}` : '—'}</Td><Td>{inr(p.amount)}</Td>
          <Td><Pill tone={p.status === 'paid' ? 'success' : p.status === 'cancelled' ? 'muted' : 'warning'}>{p.status}</Pill></Td><Td className="text-xs">{p.paid_reference || '—'}</Td>
          <Td><div className="flex flex-wrap gap-1">{p.status === 'due' && <Button size="sm" variant="outline" onClick={() => void a.run(async () => must(await supabase.from('hr_referral_payouts').update({ status: 'approved' }).eq('id', p.id)), 'Approved for payment.')}>Approve</Button>}
            {(p.status === 'due' || p.status === 'approved') && (role.data?.hrManager) && <Button size="sm" onClick={() => { const ref = window.prompt('Payment reference (UTR / transaction ID)'); if (ref) void a.run(async () => must(await supabase.from('hr_referral_payouts').update({ status: 'paid', paid_reference: ref.trim() }).eq('id', p.id)), 'Marked paid.'); }}>Mark paid</Button>}
            {(p.status === 'due' || p.status === 'approved') && <Button size="sm" variant="ghost" onClick={() => { const n = window.prompt('Reason for cancelling'); if (n) void a.run(async () => must(await supabase.from('hr_referral_payouts').update({ status: 'cancelled', note: n.trim() }).eq('id', p.id)), 'Cancelled.'); }}>Cancel</Button>}</div></Td></tr>; })}</Table>}
      <a.Status />
    </Panel>
  </div>;
}

function RecruitReports() {
  const jobs = useJobs(); const cands = useCands(); const ev = useEvents(); const inst = useInstitutes(); const links = useLinks(); const people = usePeople();
  const today = new Date().toISOString().slice(0, 10); const start = new Date(Date.now() - 89 * 86_400_000).toISOString().slice(0, 10);
  const [range, setRange] = useState({ from: start, to: today });
  if (cands.isPending || jobs.isPending || ev.isPending) return <Loading />;
  const E = ev.data ?? [];
  const C = (cands.data ?? []).filter(c => c.created_at.slice(0, 10) >= range.from && c.created_at.slice(0, 10) <= range.to);
  const reached = (c: Cand) => furthestStage(E.filter(e => e.candidate_id === c.id), c.stage);
  const hiredAt = (c: Cand) => E.find(e => e.candidate_id === c.id && e.to_stage === 'hired')?.created_at ?? null;
  const fAll = funnel(C.map(c => ({ stage: c.stage, offer_status: c.offer_status, reached: reached(c) })));
  const group = (key: (c: Cand) => string) => { const m = new Map<string, Cand[]>(); for (const c of C) { const k = key(c) || '—'; m.set(k, [...(m.get(k) ?? []), c]); } return [...m.entries()].map(([k, list]) => ({ k, ...funnel(list.map(c => ({ stage: c.stage, offer_status: c.offer_status, reached: reached(c) }))) })).sort((a, b) => b.applications - a.applications); };
  const job = (id: string | null) => jobs.data?.find(j => j.id === id);
  const tables: { title: string; file: string; rows: ReturnType<typeof group> }[] = [
    { title: 'Job-wise', file: 'report-jobs.csv', rows: group(c => job(c.job_id) ? `${job(c.job_id)!.job_code} · ${job(c.job_id)!.title}` : 'General pool') },
    { title: 'Department-wise', file: 'report-departments.csv', rows: group(c => job(c.job_id)?.department ?? '') },
    { title: 'Application source', file: 'report-sources.csv', rows: group(c => lbl(sourceLabels, c.source)) },
    { title: 'Recruiter performance', file: 'report-recruiters.csv', rows: group(c => people.data?.find(p => p.user_id === c.assigned_recruiter)?.full_name ?? 'Unassigned') },
    { title: 'Institute-wise', file: 'report-institutes.csv', rows: group(c => inst.data?.find(i => i.id === c.institute_id)?.name ?? '').filter(r => r.k !== '—') },
    { title: 'Referral / coordinator-wise', file: 'report-referrals.csv', rows: group(c => c.referral_code ? `${c.referral_name} · ${c.referral_code}` : '').filter(r => r.k !== '—') },
  ];
  const reasons = Object.entries(C.filter(c => c.stage === 'rejected').reduce<Record<string, number>>((m, c) => { const r = c.rejection_reason.trim() || 'No reason recorded'; m[r] = (m[r] ?? 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const pending = C.filter(c => (c.stage === 'applied' || c.stage === 'screening') && Date.now() - new Date(c.updated_at).getTime() > 7 * 86_400_000);
  const inactive = (links.data ?? []).filter(l => !l.active || (l.expires_at && l.expires_at < today));
  const days = averageDaysToHire(C.map(c => ({ created_at: c.created_at, hired_at: hiredAt(c) })));
  const head = ['Group', 'Applications', 'Shortlisted', 'Interviewed', 'Selected', 'Offers', 'Accepted', 'Joined', 'Selection %', 'Joining %'];
  return <div className="grid gap-4">
    <Panel title="Report period" actions={<><input type="date" aria-label="From" className={`${inputCls} w-40`} value={range.from} max={range.to} onChange={e => setRange({ ...range, from: e.target.value })} /><input type="date" aria-label="To" className={`${inputCls} w-40`} value={range.to} min={range.from} onChange={e => setRange({ ...range, to: e.target.value })} /></>}>
      <p className="text-sm text-muted-foreground">Applications received between these dates and how far they got.</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Stat t="Applications" v={fAll.applications} /><Stat t="Screening conversion" v={`${pct(fAll.shortlisted, fAll.applications)}%`} /><Stat t="Interview conversion" v={`${pct(fAll.interviewed, fAll.shortlisted)}%`} />
        <Stat t="Selection ratio" v={`${pct(fAll.selected, fAll.interviewed)}%`} /><Stat t="Offer acceptance" v={`${pct(fAll.accepted, fAll.offered)}%`} /><Stat t="Joining ratio" v={`${pct(fAll.joined, fAll.offered)}%`} />
        <Stat t="Average days to hire" v={days ?? '—'} /><Stat t="Pending > 7 days" v={pending.length} /><Stat t="Rejected" v={fAll.rejected} />
      </div>
    </Panel>
    {tables.map(t => <Panel key={t.title} title={t.title} actions={t.rows.length ? <Button size="sm" variant="outline" onClick={() => downloadCsv(t.file, t.rows.map(r => ({ group: r.k, applications: r.applications, shortlisted: r.shortlisted, interviewed: r.interviewed, selected: r.selected, offers: r.offered, accepted: r.accepted, joined: r.joined, selection_pct: pct(r.selected, r.applications), joining_pct: pct(r.joined, r.applications) })))}>Export CSV</Button> : undefined}>
      {!t.rows.length ? <Empty>No data in this period.</Empty> : <Table head={head}>{t.rows.map(r => <tr key={r.k} className="border-b border-border"><Td className="font-medium">{r.k}</Td><Td>{r.applications}</Td><Td>{r.shortlisted}</Td><Td>{r.interviewed}</Td><Td>{r.selected}</Td><Td>{r.offered}</Td><Td>{r.accepted}</Td><Td>{r.joined}</Td><Td>{pct(r.selected, r.applications)}%</Td><Td>{pct(r.joined, r.applications)}%</Td></tr>)}</Table>}
    </Panel>)}
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Rejection reasons">{!reasons.length ? <Empty>No rejections in this period.</Empty> : <ul className="grid gap-1 text-sm">{reasons.map(([r, n]) => <li key={r} className="flex justify-between border-b border-border py-1"><span>{r}</span><b>{n}</b></li>)}</ul>}</Panel>
      <Panel title="Pending applications (no action for 7+ days)">{!pending.length ? <Empty>Nothing pending.</Empty> : <ul className="grid gap-1 text-sm">{pending.map(c => <li key={c.id} className="flex justify-between border-b border-border py-1"><span>{c.full_name} · {job(c.job_id)?.title ?? 'General pool'}</span><span className="text-muted-foreground">{lbl(stageLabels, c.stage)} since {fmtDate(c.updated_at)}</span></li>)}</ul>}</Panel>
      <Panel title="Inactive or expired referral links">{!inactive.length ? <Empty>All links are active.</Empty> : <ul className="grid gap-1 text-sm">{inactive.map(l => <li key={l.id} className="flex justify-between border-b border-border py-1"><span>{l.code} · {l.owner_name}</span><span className="text-muted-foreground">{!l.active ? 'Inactive' : `Expired ${fmtDate(l.expires_at)}`}</span></li>)}</ul>}</Panel>
    </div>
  </div>;
}
