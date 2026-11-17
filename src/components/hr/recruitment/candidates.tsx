import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill, Table, Td } from '@/components/work/common';
import { inr, letterPdf, must, useAction } from '@/components/hr/hrms';
import { fillTemplate } from '@/lib/hr/payroll';
import { downloadCsv } from '@/lib/finance';
import { allStages, assessmentKinds, isActive, isClosed, nextStage, recommendationLabels, roundLabels, samePerson, sourceLabels, stageCounts, stageLabels, type Stage } from '@/lib/hr/hiring';
import { fmtDate, fmtDateTime, openHrFile, toLocalInput, useAssessments, useCands, useEvents, useInstitutes, useJobs, useMessages, usePeople, useRounds, type Cand, type Job } from './data';

const label = (m: Record<string, string>, v: string) => m[v] ?? v.replace(/_/g, ' ');
export const stageTone = (s: string) => (s === 'hired' ? 'success' : s === 'offered' || s === 'selected' ? 'info' : isClosed(s) ? 'danger' : s === 'on_hold' || s === 'waitlisted' ? 'muted' : 'warning') as 'success' | 'info' | 'danger' | 'warning' | 'muted';
const num = (v: string) => (v === '' ? null : Number(v));

/** HR/Admin: every application with search, filters, export and the full candidate profile. */
export function Applications() {
  const jobs = useJobs(); const cands = useCands(); const people = usePeople(); const inst = useInstitutes();
  const [f, setF] = useState({ q: '', job: '', stage: 'active', source: '', priority: '', recruiter: '', conflict: false });
  const [open, setOpen] = useState<string | null>(null); const [adding, setAdding] = useState(false);
  const job = (id: string | null) => jobs.data?.find(j => j.id === id);
  const all = cands.data ?? [];
  const list = all.filter(c => {
    const q = f.q.trim().toLowerCase();
    return (!q || [c.full_name, c.email, c.phone, c.application_ref ?? '', c.city].some(x => x.toLowerCase().includes(q)))
      && (!f.job || c.job_id === f.job) && (!f.source || c.source === f.source) && (!f.priority || c.priority === f.priority)
      && (!f.recruiter || c.assigned_recruiter === f.recruiter) && (!f.conflict || c.referral_conflict)
      && (f.stage === 'all' || (f.stage === 'active' ? isActive(c.stage) : c.stage === f.stage));
  });
  const counts = stageCounts(all.filter(c => !f.job || c.job_id === f.job));
  const who = (id: string | null) => people.data?.find(p => p.user_id === id)?.full_name ?? '—';
  const exportCsv = () => downloadCsv('applications.csv', list.map(c => ({ application_id: c.application_ref ?? '', name: c.full_name, email: c.email, phone: c.phone, job: job(c.job_id)?.title ?? 'General pool', job_code: job(c.job_id)?.job_code ?? '', department: job(c.job_id)?.department ?? '', qualification: c.qualification, experience_years: c.experience_years ?? '', source: label(sourceLabels, c.source), referral: c.referral_name, institute: inst.data?.find(i => i.id === c.institute_id)?.name ?? '', applied_on: c.created_at.slice(0, 10), stage: label(stageLabels, c.stage), recruiter: who(c.assigned_recruiter), priority: c.priority })));
  const cur = all.find(c => c.id === open);
  return <div className="grid gap-5">
    <Panel title={`Applications (${list.length})`} actions={<><Button size="sm" variant="outline" disabled={!list.length} onClick={exportCsv}>Export CSV</Button><Button size="sm" onClick={() => setAdding(v => !v)}>{adding ? 'Close' : 'Add candidate'}</Button></>}>
      {adding && <AddCandidate jobs={jobs.data ?? []} onDone={() => setAdding(false)} />}
      <div className="mb-3 flex flex-wrap gap-2">{allStages.map(s => <button key={s} type="button" onClick={() => setF({ ...f, stage: s })} className={`rounded-md border px-3 py-1.5 text-left text-xs hover:bg-muted ${f.stage === s ? 'border-primary' : 'border-border'}`}><span className="block text-lg font-semibold tabular-nums">{counts[s]}</span>{stageLabels[s]}</button>)}</div>
      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input aria-label="Search" placeholder="Search name, email, mobile, application ID" className={inputCls} value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
        <select aria-label="Job" className={inputCls} value={f.job} onChange={e => setF({ ...f, job: e.target.value })}><option value="">All jobs</option>{jobs.data?.map(j => <option key={j.id} value={j.id}>{j.job_code} · {j.title}</option>)}</select>
        <select aria-label="Stage" className={inputCls} value={f.stage} onChange={e => setF({ ...f, stage: e.target.value })}><option value="active">In progress</option><option value="all">All stages</option>{allStages.map(s => <option key={s} value={s}>{stageLabels[s]}</option>)}</select>
        <select aria-label="Source" className={inputCls} value={f.source} onChange={e => setF({ ...f, source: e.target.value })}><option value="">All sources</option>{Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select aria-label="Priority" className={inputCls} value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}><option value="">Any priority</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select>
        <select aria-label="Recruiter" className={inputCls} value={f.recruiter} onChange={e => setF({ ...f, recruiter: e.target.value })}><option value="">Any recruiter</option>{people.data?.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}</select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.conflict} onChange={e => setF({ ...f, conflict: e.target.checked })} />Referral conflicts only</label>
      </div>
      <ErrorNote error={cands.error} />
      {cands.isPending ? <Loading /> : !list.length ? <Empty>No applications match these filters.</Empty> :
        <Table head={['Candidate', 'Job', 'Qualification / exp.', 'Source', 'Applied', 'Stage', 'Recruiter', '']}>{list.map(c => { const j = job(c.job_id); return <tr key={c.id} className="border-b border-border">
          <Td><b>{c.full_name}</b>{c.priority === 'high' && <> <Pill tone="danger">High</Pill></>}<div className="text-xs text-muted-foreground">{c.application_ref ?? 'Added by HR'}</div></Td>
          <Td>{j ? <>{j.title}<div className="text-xs text-muted-foreground">{j.job_code} · {j.department}</div></> : 'General pool'}</Td>
          <Td>{c.qualification || '—'}<div className="text-xs text-muted-foreground">{c.experience_years === null ? '' : `${c.experience_years} yrs`}</div></Td>
          <Td>{label(sourceLabels, c.source)}{c.referral_name && <div className="text-xs text-muted-foreground">{c.referral_name}</div>}{c.referral_conflict && <Pill tone="warning">Referral conflict</Pill>}</Td>
          <Td>{fmtDate(c.created_at)}</Td><Td><Pill tone={stageTone(c.stage)}>{label(stageLabels, c.stage)}</Pill></Td><Td>{who(c.assigned_recruiter)}</Td>
          <Td><Button size="sm" variant="outline" onClick={() => setOpen(c.id)}>Open</Button></Td></tr>; })}</Table>}
    </Panel>
    {cur && <CandidateProfile c={cur} job={job(cur.job_id)} all={all} jobs={jobs.data ?? []} onClose={() => setOpen(null)} />}
  </div>;
}

function AddCandidate({ jobs, onDone }: { jobs: Job[]; onDone: () => void }) {
  const a = useAction();
  const blank = { job_id: '', full_name: '', email: '', phone: '', city: '', source: 'direct', source_detail: '', qualification: '', experience_years: '', expected_ctc: '', notes: '' };
  const [v, setV] = useState(blank); const [file, setFile] = useState<File | null>(null);
  const set = (key: keyof typeof blank) => (e: { target: { value: string } }) => setV({ ...v, [key]: e.target.value });
  return <div className="mb-4 rounded-md border border-border p-3">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Job"><select className={inputCls} value={v.job_id} onChange={set('job_id')}><option value="">General pool</option>{jobs.filter(j => j.status === 'open').map(j => <option key={j.id} value={j.id}>{j.job_code} · {j.title}</option>)}</select></Field>
      <Field label="Full name"><input className={inputCls} value={v.full_name} onChange={set('full_name')} /></Field>
      <Field label="Email"><input type="email" className={inputCls} value={v.email} onChange={set('email')} /></Field>
      <Field label="Mobile"><input inputMode="tel" className={inputCls} value={v.phone} onChange={set('phone')} /></Field>
      <Field label="City"><input className={inputCls} value={v.city} onChange={set('city')} /></Field>
      <Field label="Source"><select className={inputCls} value={v.source} onChange={set('source')}>{Object.entries(sourceLabels).filter(([k]) => k !== 'career_page').map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      <Field label="Source detail"><input className={inputCls} value={v.source_detail} onChange={set('source_detail')} /></Field>
      <Field label="Qualification"><input className={inputCls} value={v.qualification} onChange={set('qualification')} /></Field>
      <Field label="Experience (years)"><input type="number" min="0" className={inputCls} value={v.experience_years} onChange={set('experience_years')} /></Field>
      <Field label="Expected salary (₹/month)"><input type="number" min="0" className={inputCls} value={v.expected_ctc} onChange={set('expected_ctc')} /></Field>
      <Field label="Resume (max 5 MB)"><input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="text-sm" onChange={e => setFile(e.target.files?.[0] ?? null)} /></Field>
    </div>
    <Field label="Notes"><textarea className={areaCls} value={v.notes} onChange={set('notes')} /></Field>
    <Button className="mt-2" size="sm" disabled={a.busy} onClick={() => void a.run(async () => {
      if (v.full_name.trim().length < 2) throw new Error('Enter the candidate name.');
      let resume_path: string | null = null;
      if (file) { if (file.size > 5 * 1024 * 1024) throw new Error('Resume must be 5 MB or smaller.'); resume_path = `hr/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, '_').slice(-80)}`; must(await supabase.storage.from('hr-resumes').upload(resume_path, file)); }
      must(await supabase.from('hr_candidates').insert({ ...v, full_name: v.full_name.trim(), job_id: v.job_id || null, experience_years: num(v.experience_years), expected_ctc: num(v.expected_ctc), resume_path }));
      onDone();
    }, 'Candidate added at Applied.')}>Save candidate</Button><a.Status />
  </div>;
}

type Tab = 'profile' | 'rounds' | 'assess' | 'messages' | 'offer' | 'history';
/** Full candidate profile: actions for every hiring stage, interviews, assessments, messages, offer and history. */
export function CandidateProfile({ c, job, all, jobs, onClose }: { c: Cand; job: Job | undefined; all: Cand[]; jobs: Job[]; onClose: () => void }) {
  const a = useAction(); const people = usePeople(); const [tab, setTab] = useState<Tab>('profile');
  const upd = (patch: Partial<Cand>, msg: string) => a.run(async () => must(await supabase.from('hr_candidates').update(patch as never).eq('id', c.id)), msg);
  const linked = all.filter(x => x.id !== c.id && samePerson(x, c));
  const nx = nextStage(c.stage as Stage);
  const reject = () => { const r = window.prompt('Reason for rejection (kept internal)'); if (r === null) return; if (r.trim().length < 3) { window.alert('Please enter a reason.'); return; } void upd({ stage: 'rejected', rejection_reason: r.trim() }, 'Candidate rejected.'); };
  const tabs: [Tab, string][] = [['profile', 'Profile'], ['rounds', 'Interviews'], ['assess', 'Assessments'], ['messages', 'Messages & documents'], ['offer', 'Offer & joining'], ['history', 'History & notes']];
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="dash-shell max-h-[92vh] max-w-4xl overflow-y-auto">
    <DialogHeader><DialogTitle>{c.full_name} <span className="text-sm font-normal text-muted-foreground">· {c.application_ref ?? 'Added by HR'} · {job ? `${job.job_code} ${job.title}` : 'General pool'}</span></DialogTitle></DialogHeader>
    <div className="flex flex-wrap items-center gap-2"><Pill tone={stageTone(c.stage)}>{label(stageLabels, c.stage)}</Pill>{c.offer_status !== 'none' && !(c.stage === 'offered' && c.offer_status === 'released') && <Pill tone={c.offer_status === 'accepted' ? 'success' : c.offer_status === 'declined' ? 'danger' : 'info'}>Offer {c.offer_status}</Pill>}{c.referral_conflict && <Pill tone="warning">Referral conflict</Pill>}
      <select aria-label="Priority" className={`${inputCls} h-8 w-28`} value={c.priority} onChange={e => void upd({ priority: e.target.value }, 'Priority saved.')}><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select>
      <select aria-label="Recruiter" className={`${inputCls} h-8 w-44`} value={c.assigned_recruiter ?? ''} onChange={e => void upd({ assigned_recruiter: e.target.value || null }, 'Recruiter assigned.')}><option value="">No recruiter</option>{people.data?.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}</select></div>
    <div className="flex flex-wrap gap-1">
      {nx && nx !== 'hired' && nx !== 'offered' && <Button size="sm" disabled={a.busy} onClick={() => void upd({ stage: nx }, `Moved to ${stageLabels[nx]}.`)}>Move to {stageLabels[nx]}</Button>}
      {isActive(c.stage) && c.stage !== 'shortlisted' && (['applied', 'screening', 'on_hold', 'waitlisted'] as string[]).includes(c.stage) && <Button size="sm" variant="outline" disabled={a.busy} onClick={() => void upd({ stage: 'shortlisted' }, 'Shortlisted.')}>Shortlist</Button>}
      {isActive(c.stage) && c.stage !== 'selected' && c.stage !== 'offered' && <Button size="sm" variant="outline" disabled={a.busy} onClick={() => void upd({ stage: 'selected' }, 'Selected.')}>Select</Button>}
      {isActive(c.stage) && c.stage !== 'on_hold' && <Button size="sm" variant="outline" disabled={a.busy} onClick={() => void upd({ stage: 'on_hold' }, 'On hold.')}>Hold</Button>}
      {isActive(c.stage) && c.stage !== 'waitlisted' && c.stage !== 'offered' && <Button size="sm" variant="outline" disabled={a.busy} onClick={() => void upd({ stage: 'waitlisted' }, 'Waitlisted.')}>Waitlist</Button>}
      {isActive(c.stage) && <Button size="sm" variant="outline" onClick={() => setTab('messages')}>Request more info</Button>}
      {isActive(c.stage) && <Button size="sm" variant="outline" className="text-destructive" disabled={a.busy} onClick={reject}>Reject</Button>}
      {(c.stage === 'selected' || c.stage === 'offered') && <Button size="sm" variant="outline" onClick={() => setTab('offer')}>Offer & joining</Button>}
      {isClosed(c.stage) && <Button size="sm" variant="outline" disabled={a.busy} onClick={() => void upd({ stage: 'screening' }, 'Reopened at Screening.')}>Reopen</Button>}
    </div>
    <a.Status />
    <div className="flex flex-wrap gap-1 border-b border-border">{tabs.map(([k, l]) => <button key={k} type="button" onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? 'border-primary font-semibold' : 'border-transparent text-muted-foreground'}`}>{l}</button>)}</div>
    {tab === 'profile' && <ProfileTab c={c} linked={linked} jobs={jobs} />}
    {tab === 'rounds' && <RoundsTab c={c} />}
    {tab === 'assess' && <AssessTab c={c} />}
    {tab === 'messages' && <MessagesTab c={c} />}
    {tab === 'offer' && <OfferTab c={c} job={job} />}
    {tab === 'history' && <HistoryTab c={c} />}
  </DialogContent></Dialog>;
}

function Row({ k, v }: { k: string; v: ReactNode }) { return <><dt className="text-muted-foreground">{k}</dt><dd className="min-w-0 break-words">{v || '—'}</dd></>; }
function ProfileTab({ c, linked, jobs }: { c: Cand; linked: Cand[]; jobs: Job[] }) {
  const a = useAction(); const inst = useInstitutes();
  return <div className="grid gap-4 text-sm">
    <div className="grid gap-4 md:grid-cols-2">
      <section><h3 className="mb-2 font-semibold">Personal</h3><dl className="grid grid-cols-[9rem_1fr] gap-1"><Row k="Email" v={c.email} /><Row k="Mobile" v={c.phone} /><Row k="Date of birth" v={c.dob ? fmtDate(c.dob) : ''} /><Row k="Gender" v={c.gender} /><Row k="Current address" v={c.current_address} /><Row k="Permanent address" v={c.permanent_address} /><Row k="City / state / PIN" v={[c.city, c.state, c.pincode].filter(Boolean).join(', ')} /></dl></section>
      <section><h3 className="mb-2 font-semibold">Education</h3><dl className="grid grid-cols-[9rem_1fr] gap-1"><Row k="Qualification" v={c.qualification} /><Row k="Course" v={[c.course, c.specialisation].filter(Boolean).join(' · ')} /><Row k="University" v={c.university} /><Row k="Passing year" v={c.passing_year} /><Row k="% / CGPA" v={c.score} /></dl></section>
      <section><h3 className="mb-2 font-semibold">Experience</h3><dl className="grid grid-cols-[9rem_1fr] gap-1"><Row k="Status" v={c.is_fresher ? 'Fresher' : 'Experienced'} /><Row k="Experience" v={c.experience_years === null ? '' : `${c.experience_years} years`} /><Row k="Current company" v={[c.current_org, c.current_designation].filter(Boolean).join(' · ')} /><Row k="Current / expected" v={`${inr(c.current_ctc)} / ${inr(c.expected_ctc)}`} /><Row k="Notice period" v={c.notice_period} /><Row k="Skills" v={c.skills} /><Row k="Languages" v={c.languages} /></dl></section>
      <section><h3 className="mb-2 font-semibold">Source & referral</h3><dl className="grid grid-cols-[9rem_1fr] gap-1"><Row k="Source" v={label(sourceLabels, c.source)} /><Row k="Referral (locked)" v={c.referral_code ? `${c.referral_name} · ${c.referral_code}` : c.source_detail} /><Row k="Institute" v={inst.data?.find(i => i.id === c.institute_id)?.name} /><Row k="Availability" v={c.availability} /><Row k="Portal login" v={c.candidate_user_id ? 'Linked' : 'Not signed in yet'} /></dl>
        {c.referral_conflict && <p className="mt-2 rounded bg-[color-mix(in_oklab,var(--dash-warning)_12%,transparent)] p-2 text-xs">This person applied earlier through a different referral source. The original attribution is kept; Admin can correct it if needed.</p>}</section>
    </div>
    {c.why_join && <section><h3 className="mb-1 font-semibold">Why RILOYD</h3><p className="whitespace-pre-wrap">{c.why_join}</p></section>}
    <div className="flex flex-wrap gap-2">{c.resume_path ? <Button size="sm" variant="outline" onClick={() => void a.run(() => openHrFile(c.resume_path!), 'Resume opened.')}>Open resume</Button> : <span className="text-muted-foreground">No resume uploaded yet. Ask the candidate from Messages.</span>}</div>
    <section><h3 className="mb-1 font-semibold">Other applications by the same person ({linked.length})</h3>{!linked.length ? <p className="text-muted-foreground">None — matched by email and mobile.</p> :
      <ul className="grid gap-1">{linked.map(l => <li key={l.id}>{jobs.find(j => j.id === l.job_id)?.title ?? 'General pool'} · {l.application_ref ?? '—'} · {fmtDate(l.created_at)} · <Pill tone={stageTone(l.stage)}>{label(stageLabels, l.stage)}</Pill>{l.referral_name && ` · via ${l.referral_name}`}</li>)}</ul>}</section>
    <a.Status />
  </div>;
}

function RoundsTab({ c }: { c: Cand }) {
  const a = useAction(); const rounds = useRounds(); const people = usePeople();
  const mine = (rounds.data ?? []).filter(r => r.candidate_id === c.id).sort((x, y) => x.scheduled_at.localeCompare(y.scheduled_at));
  const blank = { round_type: 'hr', scheduled_at: '', mode: 'in_person', location_or_link: '', interviewer_user_id: '' };
  const [v, setV] = useState(blank);
  return <div className="grid gap-3 text-sm">
    {rounds.isPending ? <Loading /> : !mine.length ? <Empty>No interview rounds yet.</Empty> : mine.map(r => <RoundCard key={r.id} r={r} />)}
    <div className="rounded-md border border-border p-3"><p className="mb-2 font-semibold">Schedule a round</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Round"><select className={inputCls} value={v.round_type} onChange={e => setV({ ...v, round_type: e.target.value })}>{Object.entries(roundLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Date & time"><input type="datetime-local" className={inputCls} value={v.scheduled_at} onChange={e => setV({ ...v, scheduled_at: e.target.value })} /></Field>
        <Field label="Mode"><select className={inputCls} value={v.mode} onChange={e => setV({ ...v, mode: e.target.value })}><option value="in_person">In person</option><option value="video">Video call</option><option value="phone">Phone</option></select></Field>
        <Field label="Meeting link / location"><input className={inputCls} value={v.location_or_link} onChange={e => setV({ ...v, location_or_link: e.target.value })} /></Field>
        <Field label="Interviewer"><select className={inputCls} value={v.interviewer_user_id} onChange={e => setV({ ...v, interviewer_user_id: e.target.value })}><option value="">Choose…</option>{people.data?.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name} · {p.department}</option>)}</select></Field>
      </div>
      <Button size="sm" className="mt-2" disabled={a.busy} onClick={() => void a.run(async () => {
        if (!v.scheduled_at) throw new Error('Choose the date and time.');
        const p = people.data?.find(x => x.user_id === v.interviewer_user_id);
        must(await supabase.from('hr_interview_rounds').insert({ candidate_id: c.id, round_type: v.round_type, scheduled_at: new Date(v.scheduled_at).toISOString(), mode: v.mode, location_or_link: v.location_or_link.trim(), interviewer_user_id: v.interviewer_user_id || null, interviewer_name: p?.full_name ?? '' }));
        if (!(['interview', 'selected', 'offered', 'hired'] as string[]).includes(c.stage)) must(await supabase.from('hr_candidates').update({ stage: 'interview' }).eq('id', c.id));
        setV(blank);
      }, 'Round scheduled. The candidate sees it on their portal.')}>Schedule</Button><a.Status /></div>
  </div>;
}

export function RoundCard({ r, interviewer = false }: { r: { id: string; round_type: string; scheduled_at: string; mode: string; location_or_link: string; interviewer_name?: string; status: string; score: number | null; recommendation: string; internal_feedback: string; candidate_feedback?: string }; interviewer?: boolean }) {
  const a = useAction();
  const [v, setV] = useState({ scheduled_at: toLocalInput(r.scheduled_at), status: r.status, score: r.score === null ? '' : String(r.score), recommendation: r.recommendation, internal_feedback: r.internal_feedback, candidate_feedback: r.candidate_feedback ?? '' });
  return <div className="rounded-md border border-border p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><b>{label(roundLabels, r.round_type)}</b><Pill tone={r.status === 'completed' ? 'success' : r.status === 'scheduled' ? 'info' : 'muted'}>{r.status.replace('_', ' ')}</Pill></div>
    <p className="text-xs text-muted-foreground">{fmtDateTime(r.scheduled_at)} · {r.mode.replace('_', ' ')}{r.location_or_link && ` · ${r.location_or_link}`}{r.interviewer_name && ` · ${r.interviewer_name}`}</p>
    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {!interviewer && <Field label="Reschedule"><input type="datetime-local" className={inputCls} value={v.scheduled_at} onChange={e => setV({ ...v, scheduled_at: e.target.value })} /></Field>}
      <Field label="Status"><select className={inputCls} value={v.status} onChange={e => setV({ ...v, status: e.target.value })}><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="no_show">No show</option>{!interviewer && <option value="cancelled">Cancelled</option>}</select></Field>
      <Field label="Score (1–10)"><input type="number" min="1" max="10" className={inputCls} value={v.score} onChange={e => setV({ ...v, score: e.target.value })} /></Field>
      <Field label="Recommendation"><select className={inputCls} value={v.recommendation} onChange={e => setV({ ...v, recommendation: e.target.value })}><option value="">—</option>{Object.entries(recommendationLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
    </div>
    <Field label="Interview notes (internal, never shown to the candidate)"><textarea className={areaCls} value={v.internal_feedback} onChange={e => setV({ ...v, internal_feedback: e.target.value })} /></Field>
    {!interviewer && <Field label="Feedback the candidate can see (optional)"><input className={inputCls} value={v.candidate_feedback} onChange={e => setV({ ...v, candidate_feedback: e.target.value })} /></Field>}
    <Button size="sm" className="mt-2" disabled={a.busy} onClick={() => void a.run(async () => {
      const s = v.score === '' ? null : Math.round(Number(v.score)); if (s !== null && !(s >= 1 && s <= 10)) throw new Error('Score must be 1 to 10.');
      const patch: Record<string, unknown> = { status: v.status, score: s, recommendation: v.recommendation, internal_feedback: v.internal_feedback };
      if (!interviewer) { patch['candidate_feedback'] = v.candidate_feedback; if (v.scheduled_at) patch['scheduled_at'] = new Date(v.scheduled_at).toISOString(); }
      must(await supabase.from('hr_interview_rounds').update(patch as never).eq('id', r.id));
    }, 'Round saved.')}>Save round</Button><a.Status />
  </div>;
}

function AssessTab({ c }: { c: Cand }) {
  const a = useAction(); const list = useAssessments();
  const mine = (list.data ?? []).filter(x => x.candidate_id === c.id);
  const blank = { kind: 'online', title: '', instructions: '', link: '', due_at: '', max_marks: '100' };
  const [v, setV] = useState(blank);
  return <div className="grid gap-3 text-sm">
    {list.isPending ? <Loading /> : !mine.length ? <Empty>No assessments yet.</Empty> : mine.map(x => <AssessmentCard key={x.id} x={x} />)}
    <div className="rounded-md border border-border p-3"><p className="mb-2 font-semibold">Assign an assessment</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Type"><select className={inputCls} value={v.kind} onChange={e => setV({ ...v, kind: e.target.value })}>{Object.entries(assessmentKinds).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Title"><input className={inputCls} value={v.title} onChange={e => setV({ ...v, title: e.target.value })} /></Field>
        <Field label="Test link (https://, optional)"><input className={inputCls} value={v.link} onChange={e => setV({ ...v, link: e.target.value })} /></Field>
        <Field label="Due by"><input type="datetime-local" className={inputCls} value={v.due_at} onChange={e => setV({ ...v, due_at: e.target.value })} /></Field>
        <Field label="Maximum marks"><input type="number" min="1" className={inputCls} value={v.max_marks} onChange={e => setV({ ...v, max_marks: e.target.value })} /></Field>
      </div>
      <Field label="Instructions for the candidate"><textarea className={areaCls} value={v.instructions} onChange={e => setV({ ...v, instructions: e.target.value })} /></Field>
      <Button size="sm" className="mt-2" disabled={a.busy} onClick={() => void a.run(async () => {
        if (v.title.trim().length < 2) throw new Error('Enter a title.'); if (v.link && !/^https:\/\//i.test(v.link)) throw new Error('The link must start with https://');
        must(await supabase.from('hr_assessments').insert({ candidate_id: c.id, kind: v.kind, title: v.title.trim(), instructions: v.instructions, link: v.link.trim(), due_at: v.due_at ? new Date(v.due_at).toISOString() : null, max_marks: Number(v.max_marks) || 100 }));
        if ((['applied', 'screening', 'shortlisted'] as string[]).includes(c.stage)) must(await supabase.from('hr_candidates').update({ stage: 'assessment' }).eq('id', c.id));
        setV(blank);
      }, 'Assessment assigned. The candidate sees it on their portal.')}>Assign</Button><a.Status /></div>
  </div>;
}

function AssessmentCard({ x }: { x: ReturnType<typeof useAssessments>['data'] extends (infer T)[] | undefined ? T : never }) {
  const a = useAction(); const [v, setV] = useState({ marks: x.marks === null ? '' : String(x.marks), result: x.result, share_score: x.share_score, evaluator_notes: x.evaluator_notes });
  return <div className="rounded-md border border-border p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><b>{x.title}</b><span className="flex gap-1"><Pill>{label(assessmentKinds, x.kind)}</Pill><Pill tone={x.status === 'evaluated' ? 'success' : x.status === 'submitted' ? 'warning' : 'info'}>{x.status}</Pill></span></div>
    <p className="text-xs text-muted-foreground">Due {fmtDateTime(x.due_at)}{x.submitted_at && ` · submitted ${fmtDateTime(x.submitted_at)}`}</p>
    {x.submission_note && <p className="mt-1 whitespace-pre-wrap">Candidate: {x.submission_note}</p>}
    {x.submission_path && <Button size="sm" variant="outline" className="mt-1" onClick={() => void a.run(() => openHrFile(x.submission_path!), 'Opened.')}>Open submitted file</Button>}
    <div className="mt-2 grid gap-2 sm:grid-cols-3">
      <Field label={`Marks (out of ${x.max_marks})`}><input type="number" min="0" max={x.max_marks} className={inputCls} value={v.marks} onChange={e => setV({ ...v, marks: e.target.value })} /></Field>
      <Field label="Result"><select className={inputCls} value={v.result} onChange={e => setV({ ...v, result: e.target.value })}><option value="pending">Pending</option><option value="pass">Pass</option><option value="fail">Fail</option></select></Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={v.share_score} onChange={e => setV({ ...v, share_score: e.target.checked })} />Show score & result to candidate</label>
    </div>
    <Field label="Evaluator notes (internal)"><textarea className={areaCls} value={v.evaluator_notes} onChange={e => setV({ ...v, evaluator_notes: e.target.value })} /></Field>
    <div className="mt-2 flex gap-2"><Button size="sm" disabled={a.busy} onClick={() => void a.run(async () => { const m = v.marks === '' ? null : Number(v.marks); if (m !== null && (m < 0 || m > x.max_marks)) throw new Error(`Marks must be 0 to ${x.max_marks}.`); must(await supabase.from('hr_assessments').update({ marks: m, result: v.result, share_score: v.share_score, evaluator_notes: v.evaluator_notes }).eq('id', x.id)); }, 'Evaluation saved.')}>Save evaluation</Button>
      {x.status !== 'cancelled' && x.status !== 'evaluated' && <Button size="sm" variant="ghost" onClick={() => void a.run(async () => must(await supabase.from('hr_assessments').update({ status: 'cancelled' }).eq('id', x.id)), 'Cancelled.')}>Cancel</Button>}</div><a.Status />
  </div>;
}

function MessagesTab({ c }: { c: Cand }) {
  const a = useAction(); const msgs = useMessages(c.id); const [body, setBody] = useState(''); const [kind, setKind] = useState('message');
  return <div className="grid gap-3 text-sm">
    {!c.candidate_user_id && <p className="rounded bg-muted p-2 text-xs">The candidate has not signed in to the candidate portal yet. They will see these messages after signing in with {c.email || 'their application email'}.</p>}
    {msgs.isPending ? <Loading /> : !msgs.data?.length ? <Empty>No messages yet.</Empty> : <ul className="grid gap-2">{msgs.data.map(m => <li key={m.id} className={`max-w-[85%] rounded-md border border-border p-2 ${m.sender === 'hr' ? 'justify-self-end bg-muted/50' : ''}`}>
      <p className="text-xs text-muted-foreground">{m.sender === 'hr' ? 'HR' : c.full_name} · {fmtDateTime(m.created_at)}{m.kind === 'document_request' && ' · document request'}</p><p className="whitespace-pre-wrap">{m.body}</p>
      {m.file_path && <Button size="sm" variant="outline" className="mt-1" onClick={() => void a.run(() => openHrFile(m.file_path!), 'Opened.')}>Open document</Button>}</li>)}</ul>}
    <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]"><select aria-label="Type" className={inputCls} value={kind} onChange={e => setKind(e.target.value)}><option value="message">Message</option><option value="document_request">Request a document / more info</option></select>
      <input aria-label="Message" className={inputCls} placeholder={kind === 'message' ? 'Write to the candidate' : 'e.g. Please upload your graduation marksheet'} value={body} onChange={e => setBody(e.target.value)} />
      <Button size="sm" disabled={a.busy || !body.trim()} onClick={() => void a.run(async () => { const { data: u } = await supabase.auth.getUser(); must(await supabase.from('hr_candidate_messages').insert({ candidate_id: c.id, sender: 'hr', kind, body: body.trim(), sender_id: u.user!.id })); setBody(''); }, 'Sent.')}>Send</Button></div><a.Status />
  </div>;
}

function OfferTab({ c, job }: { c: Cand; job: Job | undefined }) {
  const a = useAction(); const people = usePeople();
  const [v, setV] = useState({ offered_ctc: c.offered_ctc === null ? '' : String(c.offered_ctc), joining_date: c.joining_date ?? '', probation_months: c.probation_months === null ? '' : String(c.probation_months), employee_user_id: c.employee_user_id ?? '' });
  const save = (extra: Partial<Cand>, msg: string) => a.run(async () => must(await supabase.from('hr_candidates').update({ offered_ctc: num(v.offered_ctc), joining_date: v.joining_date || null, probation_months: num(v.probation_months), ...(c.stage === 'hired' || extra.stage === 'hired' ? { employee_user_id: v.employee_user_id || null } : {}), ...extra } as never).eq('id', c.id)), msg);
  const letter = async (kind: 'offer' | 'appointment') => {
    const { data } = await supabase.from('hr_letter_templates').select('body').eq('kind', kind).eq('active', true).limit(1).maybeSingle();
    if (!data) throw new Error(`Add an active ${kind} letter template under Letters & templates.`);
    await letterPdf(`${kind === 'offer' ? 'Offer' : 'Appointment'}-${c.full_name}`, fillTemplate(data.body, { name: c.full_name, designation: job?.designation || job?.title, department: job?.department, joining_date: v.joining_date ? fmtDate(v.joining_date) : undefined, gross: v.offered_ctc ? Number(v.offered_ctc).toLocaleString('en-IN') : undefined, probation: v.probation_months, reporting_manager: job?.reporting_manager, date: new Date().toLocaleDateString('en-IN') }));
  };
  return <div className="grid gap-3 text-sm">
    <div className="grid gap-2 sm:grid-cols-3">
      <Field label="Offered salary (₹/month)"><input type="number" min="0" className={inputCls} value={v.offered_ctc} onChange={e => setV({ ...v, offered_ctc: e.target.value })} /></Field>
      <Field label="Joining date"><input type="date" className={inputCls} value={v.joining_date} onChange={e => setV({ ...v, joining_date: e.target.value })} /></Field>
      <Field label="Probation (months)"><input type="number" min="0" max="24" className={inputCls} value={v.probation_months} onChange={e => setV({ ...v, probation_months: e.target.value })} /></Field>
    </div>
    <p className="text-muted-foreground">Offer: <b>{c.offer_status}</b>{c.offer_responded_at && ` on ${fmtDateTime(c.offer_responded_at)}`}{c.offer_note && ` — “${c.offer_note}”`}</p>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={a.busy} onClick={() => void save({}, 'Saved.')}>Save details</Button>
      {(c.stage === 'selected' || (isActive(c.stage) && c.stage !== 'offered')) && <Button size="sm" disabled={a.busy} onClick={() => { if (!v.offered_ctc || !v.joining_date) { window.alert('Enter the offered salary and joining date first.'); return; } void save({ stage: 'offered', offer_status: 'released' }, 'Offer released. The candidate can accept or decline on their portal.'); }}>Release offer</Button>}
      {(c.stage === 'offered' || c.stage === 'hired') && <Button size="sm" variant="outline" onClick={() => void a.run(() => letter('offer'), 'Offer letter downloaded.')}>Offer letter PDF</Button>}
      {c.stage === 'hired' && <Button size="sm" variant="outline" onClick={() => void a.run(() => letter('appointment'), 'Appointment letter downloaded.')}>Appointment letter PDF</Button>}
    </div>
    {(c.stage === 'offered' || c.stage === 'hired') && <div className="rounded-md border border-border p-3"><p className="mb-2 font-semibold">Joining & employee record</p>
      <p className="mb-2 text-xs text-muted-foreground">After joining, link the employee account from the Employee master (create it there first if needed). This starts attendance, ID card, probation and the institute's 90-day tracking — no duplicate employee is created.</p>
      <Field label="Employee account"><select className={inputCls} value={v.employee_user_id} onChange={e => setV({ ...v, employee_user_id: e.target.value })}><option value="">Not linked yet</option>{people.data?.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name} · {p.employee_code}</option>)}</select></Field>
      {c.stage === 'offered' && <Button size="sm" className="mt-2" disabled={a.busy} onClick={() => { if (c.offer_status !== 'accepted' && !window.confirm('The candidate has not accepted the offer on the portal. Mark as joined anyway?')) return; if (!v.joining_date) { window.alert('Enter the joining date.'); return; } void save({ stage: 'hired' }, 'Marked as joined.'); }}>Mark as joined</Button>}
      {c.stage === 'hired' && <Button size="sm" className="mt-2" disabled={a.busy} onClick={() => void save({}, 'Employee link saved.')}>Save employee link</Button>}</div>}
    <a.Status />
  </div>;
}

function HistoryTab({ c }: { c: Cand }) {
  const a = useAction(); const ev = useEvents(); const [notes, setNotes] = useState(c.notes);
  const mine = (ev.data ?? []).filter(e => e.candidate_id === c.id);
  return <div className="grid gap-3 text-sm">
    <Field label="Internal HR notes (never shown to the candidate)"><textarea className={areaCls} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
    <div><Button size="sm" disabled={a.busy} onClick={() => void a.run(async () => must(await supabase.from('hr_candidates').update({ notes }).eq('id', c.id)), 'Notes saved.')}>Save notes</Button></div>
    {c.rejection_reason && <p>Rejection reason: {c.rejection_reason}</p>}
    <ul className="grid gap-1 text-xs">{mine.map(h => <li key={h.id}>{fmtDateTime(h.created_at)} · {h.from_stage ? `${label(stageLabels, h.from_stage)} → ` : 'Added at '}{label(stageLabels, h.to_stage)} · {h.actor_name}</li>)}</ul><a.Status />
  </div>;
}

/** Any employee: interview rounds assigned to them, with feedback. */
export function MyInterviews() {
  const q = useQuery({ queryKey: ['hrms', 'rec', 'my-rounds'], queryFn: async () => must(await supabase.rpc('interviewer_my_rounds')) as { id: string; candidate_name: string; job_title: string; round_type: string; scheduled_at: string; mode: string; location_or_link: string; status: string; score: number | null; recommendation: string; internal_feedback: string; qualification: string; experience_years: number | null; skills: string }[] });
  return <Panel title="My interviews">{q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !q.data?.length ? <Empty>No interviews assigned to you.</Empty> :
    <div className="grid gap-3">{q.data.map(r => <div key={r.id} className="grid gap-1"><p className="text-sm"><b>{r.candidate_name}</b> · {r.job_title} · {r.qualification || '—'}{r.experience_years !== null && ` · ${r.experience_years} yrs`}{r.skills && ` · ${r.skills}`}</p><RoundCard r={r} interviewer /></div>)}</div>}</Panel>;
}
