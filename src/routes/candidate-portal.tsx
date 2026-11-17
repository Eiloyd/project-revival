import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, FileText, Inbox, ListChecks, UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AuthForm } from '@/components/auth-form';
import { Button } from '@/components/ui/button';
import { DashboardGate, DashboardShell } from '@/components/dashboard/shell';
import { useMyDashboards } from '@/hooks/use-my-dashboards';
import { areaCls, Empty, ErrorNote, Field, inputCls, Loading, Panel, Pill } from '@/components/work/common';
import { assessmentKinds, roundLabels } from '@/lib/hr/hiring';

export const Route = createFileRoute('/candidate-portal')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'Candidate portal | RILOYD careers' }, { name: 'description', content: 'Track your RILOYD job applications: stage timeline, interviews, assessments, HR messages, documents and offer.' },
    { property: 'og:title', content: 'Candidate portal | RILOYD' }, { property: 'og:description', content: 'Follow your RILOYD application from submission to joining.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: CandidatePortal,
});

type App = { id: string; ref: string; job_title: string; job_code: string | null; department: string | null; location: string | null; stage: string; stage_label: string; applied_at: string; has_resume: boolean; offer_status: string; offered_ctc: number | null; joining_date: string | null; probation_months: number | null; designation: string | null; referral: string | null;
  profile: { full_name: string; phone: string; city: string; qualification: string; university: string; skills: string; experience_years: number | null; dob: string | null; current_address: string };
  timeline: { stage: string; label: string; at: string }[]; rounds: { id: string; type: string; at: string; mode: string; where: string; status: string; feedback: string }[];
  assessments: { id: string; kind: string; title: string; instructions: string; link: string; due_at: string | null; status: string; submitted_at: string | null; marks: number | null; max_marks: number | null; result: string | null }[];
  messages: { id: string; sender: string; kind: string; body: string; has_file: boolean; at: string }[] };

const items = [{ key: 'apps', label: 'My applications', icon: ListChecks }, { key: 'schedule', label: 'Interviews & assessments', icon: CalendarClock }, { key: 'messages', label: 'Messages & documents', icon: Inbox }, { key: 'offer', label: 'Offer & joining', icon: FileText }, { key: 'profile', label: 'My profile', icon: UserRound }];
const dt = (d: string | null) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const closed = ['rejected', 'withdrawn', 'offer_declined'];
const tone = (s: string) => (s === 'hired' ? 'success' : closed.includes(s) ? 'danger' : s === 'offered' || s === 'selected' ? 'info' : 'warning') as 'success' | 'danger' | 'info' | 'warning';

async function upload(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Files must be 5 MB or smaller.');
  if (!/\.(pdf|docx?|png|jpe?g)$/i.test(file.name)) throw new Error('Upload a PDF, Word file or image.');
  const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error('Please sign in again.');
  const path = `candidate/${u.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, '_').slice(-80)}`;
  const { error } = await supabase.storage.from('hr-resumes').upload(path, file, { contentType: file.type || undefined }); if (error) throw error; return path;
}

function useAct() {
  const qc = useQueryClient(); const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [notice, setNotice] = useState('');
  const run = async (fn: () => Promise<unknown>, msg: string) => { setBusy(true); setError(null); setNotice(''); try { await fn(); setNotice(msg); await qc.invalidateQueries({ queryKey: ['candidate-apps'] }); } catch (e) { setError(e); } finally { setBusy(false); } };
  return { busy, run, Status: () => <><ErrorNote error={error} />{notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}</> };
}

function CandidatePortal() {
  const { uid, email, dashboards, loading } = useMyDashboards(); const qc = useQueryClient();
  const [section, setSection] = useState(() => (typeof window !== 'undefined' && window.location.hash.slice(1)) || 'apps');
  const ok = Boolean(uid && dashboards?.includes('candidate'));
  const apps = useQuery({ queryKey: ['candidate-apps', uid], enabled: ok, queryFn: async () => { const { data, error } = await supabase.rpc('candidate_my_applications'); if (error) throw error; return (data ?? []) as unknown as App[]; } });
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); };
  if (ok) {
    const select = (k: string) => { setSection(k); window.history.replaceState(null, '', `#${k}`); };
    const list = apps.data ?? [];
    return <DashboardShell workspace="Candidate portal" groups={[{ items }]} active={section} onSelect={select} user={{ name: email, detail: list[0]?.profile.full_name ?? 'Candidate' }} onSignOut={() => void signOut()}>
      {apps.isPending ? <Loading /> : apps.error ? <ErrorNote error={apps.error} /> : !list.length ? <Empty>No applications yet. <Link to="/careers" className="text-primary underline">See openings</Link></Empty>
        : section === 'schedule' ? <Schedule list={list} /> : section === 'messages' ? <Messages list={list} /> : section === 'offer' ? <Offers list={list} /> : section === 'profile' ? <Profile list={list} /> : <Applications list={list} />}
    </DashboardShell>;
  }
  return <DashboardGate workspace="Candidate portal" title={uid ? 'No applications found' : 'Candidate sign in'} intro="Sign in, or create an account, with the email you used on your job application.">
    {uid === undefined || loading ? <p className="text-sm text-muted-foreground">Checking…</p> : !uid ? <AuthForm redirectPath="/candidate-portal" />
      : <div className="dash-card grid gap-3 p-5 text-sm"><p>We could not find an application for <b>{email}</b>. Apply for a job with this email, or sign in with the email you applied with. If you just created this account, confirm your email first.</p>
        <div className="flex flex-wrap gap-2"><Button asChild><Link to="/careers">See openings</Link></Button><Button variant="outline" onClick={() => void signOut()}>Sign out</Button></div></div>}
  </DashboardGate>;
}

function Applications({ list }: { list: App[] }) {
  const a = useAct();
  return <div className="grid gap-4">{list.map(x => {
    const completion = Math.round(([x.profile.full_name, x.profile.phone, x.profile.city, x.profile.qualification, x.profile.university, x.profile.skills, x.profile.dob, x.profile.current_address].filter(Boolean).length + (x.has_resume ? 2 : 0)) / 10 * 100);
    return <Panel key={x.id} title={<>{x.job_title} <span className="text-sm font-normal text-muted-foreground">· {x.ref}</span></>} actions={<Pill tone={tone(x.stage)}>{x.stage_label}</Pill>}>
      <p className="text-sm text-muted-foreground">{[x.job_code, x.department, x.location].filter(Boolean).join(' · ')} · applied {dt(x.applied_at)}{x.referral && ` · referred by ${x.referral}`}</p>
      <div className="mt-3"><p className="text-xs text-muted-foreground">Profile completion {completion}%{!x.has_resume && ' — upload your resume below'}</p><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${completion}%` }} /></div></div>
      <ol className="mt-4 grid gap-2 border-l-2 border-border pl-4">{x.timeline.map((t, i) => <li key={i} className="relative text-sm"><span className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full bg-primary" /><b>{t.label}</b> <span className="text-muted-foreground">· {dt(t.at)}</span></li>)}</ol>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <Field label={x.has_resume ? 'Replace resume' : 'Upload resume (PDF/Word, 5 MB)'}><input type="file" accept=".pdf,.doc,.docx" className="text-sm" onChange={e => { const f = e.target.files?.[0]; if (f) void a.run(async () => { const p = await upload(f); const { error } = await supabase.rpc('candidate_set_resume', { _candidate: x.id, _path: p }); if (error) throw error; }, 'Resume uploaded.'); }} /></Field>
        {!closed.includes(x.stage) && x.stage !== 'hired' && <Button size="sm" variant="ghost" disabled={a.busy} onClick={() => { if (window.confirm('Withdraw this application? This cannot be undone.')) void a.run(async () => { const { error } = await supabase.rpc('candidate_withdraw', { _candidate: x.id }); if (error) throw error; }, 'Application withdrawn.'); }}>Withdraw application</Button>}
      </div><a.Status />
    </Panel>; })}</div>;
}

function Schedule({ list }: { list: App[] }) {
  const rounds = list.flatMap(x => x.rounds.map(r => ({ ...r, job: x.job_title })));
  const tests = list.flatMap(x => x.assessments.map(s => ({ ...s, job: x.job_title })));
  return <div className="grid gap-4">
    <Panel title="Interviews">{!rounds.length ? <Empty>No interviews yet.</Empty> : <ul className="grid gap-2 text-sm">{rounds.map(r => <li key={r.id} className="rounded-md border border-border p-3"><div className="flex flex-wrap justify-between gap-2"><b>{roundLabels[r.type as keyof typeof roundLabels] ?? r.type} · {r.job}</b><Pill tone={r.status === 'completed' ? 'success' : r.status === 'scheduled' ? 'info' : 'muted'}>{r.status.replace('_', ' ')}</Pill></div>
      <p className="text-muted-foreground">{dt(r.at)} · {r.mode.replace('_', ' ')}{r.where && <> · {/^https?:\/\//.test(r.where) ? <a href={r.where} target="_blank" rel="noopener noreferrer" className="text-primary underline">Join link</a> : r.where}</>}</p>{r.feedback && <p className="mt-1">Feedback: {r.feedback}</p>}</li>)}</ul>}</Panel>
    <Panel title="Assessments">{!tests.length ? <Empty>No assessments yet.</Empty> : <div className="grid gap-3">{tests.map(t => <AssessmentItem key={t.id} t={t} />)}</div>}</Panel>
  </div>;
}
function AssessmentItem({ t }: { t: App['assessments'][number] & { job: string } }) {
  const a = useAct(); const [note, setNote] = useState(''); const [file, setFile] = useState<File | null>(null);
  return <div className="rounded-md border border-border p-3 text-sm">
    <div className="flex flex-wrap justify-between gap-2"><b>{t.title} · {t.job}</b><Pill tone={t.status === 'evaluated' ? 'success' : t.status === 'submitted' ? 'info' : 'warning'}>{t.status}</Pill></div>
    <p className="text-muted-foreground">{assessmentKinds[t.kind as keyof typeof assessmentKinds] ?? t.kind} · due {dt(t.due_at)}</p>
    {t.instructions && <p className="mt-1 whitespace-pre-wrap">{t.instructions}</p>}
    {t.link && <a href={t.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-primary underline">Open the test</a>}
    {t.marks !== null && <p className="mt-1">Score: <b>{t.marks}/{t.max_marks}</b>{t.result && t.result !== 'pending' && ` · ${t.result === 'pass' ? 'Passed' : 'Not passed'}`}</p>}
    {t.status === 'assigned' && <div className="mt-2 grid gap-2"><Field label="Your answer / note for HR"><textarea className={areaCls} value={note} onChange={e => setNote(e.target.value)} /></Field>
      <Field label="Attach a file (optional, 5 MB)"><input type="file" className="text-sm" onChange={e => setFile(e.target.files?.[0] ?? null)} /></Field>
      <div><Button size="sm" disabled={a.busy || (!note.trim() && !file)} onClick={() => void a.run(async () => { const p = file ? await upload(file) : null; const { error } = await supabase.rpc('candidate_submit_assessment', { _assessment: t.id, _note: note.trim(), ...(p ? { _file_path: p } : {}) }); if (error) throw error; }, 'Submitted to HR.')}>Submit</Button></div></div>}
    <a.Status />
  </div>;
}

function Messages({ list }: { list: App[] }) {
  return <div className="grid gap-4">{list.map(x => <Thread key={x.id} x={x} />)}</div>;
}
function Thread({ x }: { x: App }) {
  const a = useAct(); const [body, setBody] = useState(''); const [file, setFile] = useState<File | null>(null);
  const pending = x.messages.filter(m => m.kind === 'document_request').length;
  return <Panel title={`${x.job_title} · ${x.ref}`} actions={pending ? <Pill tone="warning">{pending} document request{pending > 1 ? 's' : ''}</Pill> : undefined}>
    {!x.messages.length ? <Empty>No messages yet. HR will write here.</Empty> : <ul className="grid gap-2 text-sm">{x.messages.map(m => <li key={m.id} className={`max-w-[85%] rounded-md border border-border p-2 ${m.sender === 'candidate' ? 'justify-self-end bg-muted/50' : ''}`}><p className="text-xs text-muted-foreground">{m.sender === 'hr' ? 'RILOYD HR' : 'You'} · {dt(m.at)}{m.kind === 'document_request' && ' · document requested'}{m.has_file && ' · file attached'}</p><p className="whitespace-pre-wrap">{m.body}</p></li>)}</ul>}
    <div className="mt-3 grid gap-2"><textarea aria-label="Reply" className={areaCls} placeholder="Reply to HR" value={body} onChange={e => setBody(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2"><input type="file" aria-label="Attach document" className="text-sm" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <Button size="sm" disabled={a.busy || (!body.trim() && !file)} onClick={() => void a.run(async () => { const p = file ? await upload(file) : null; const { error } = await supabase.rpc('candidate_send_message', { _candidate: x.id, _body: body.trim() || (file ? `Document: ${file.name}` : ''), ...(p ? { _file_path: p } : {}) }); if (error) throw error; setBody(''); setFile(null); }, 'Sent to HR.')}>Send</Button></div></div>
    <a.Status />
  </Panel>;
}

function Offers({ list }: { list: App[] }) {
  const offers = list.filter(x => x.offer_status !== 'none');
  return !offers.length ? <Panel title="Offer & joining"><Empty>No offer yet. You will be notified here when HR releases one.</Empty></Panel> : <div className="grid gap-4">{offers.map(x => <OfferCard key={x.id} x={x} />)}</div>;
}
function OfferCard({ x }: { x: App }) {
  const a = useAct(); const [note, setNote] = useState('');
  return <Panel title={`Offer · ${x.job_title}`} actions={<Pill tone={x.offer_status === 'accepted' ? 'success' : x.offer_status === 'declined' ? 'danger' : 'info'}>{x.offer_status === 'released' ? 'Waiting for your answer' : x.offer_status}</Pill>}>
    <dl className="grid grid-cols-[10rem_1fr] gap-1 text-sm"><dt className="text-muted-foreground">Designation</dt><dd>{x.designation ?? '—'}</dd><dt className="text-muted-foreground">Department</dt><dd>{x.department ?? '—'}</dd>
      <dt className="text-muted-foreground">Monthly salary</dt><dd>{x.offered_ctc === null ? '—' : `₹${Number(x.offered_ctc).toLocaleString('en-IN')}`}</dd><dt className="text-muted-foreground">Joining date</dt><dd>{x.joining_date ? new Date(`${x.joining_date}T00:00:00`).toLocaleDateString('en-IN') : '—'}</dd>
      {x.probation_months !== null && <><dt className="text-muted-foreground">Probation</dt><dd>{x.probation_months} months</dd></>}</dl>
    <p className="mt-2 text-xs text-muted-foreground">HR shares the signed offer letter and joining instructions in Messages.</p>
    {x.offer_status === 'released' && x.stage === 'offered' && <div className="mt-3 grid gap-2"><Field label="Note for HR (optional)"><input className={inputCls} value={note} onChange={e => setNote(e.target.value)} /></Field>
      <div className="flex flex-wrap gap-2"><Button disabled={a.busy} onClick={() => void a.run(async () => { const { error } = await supabase.rpc('candidate_respond_offer', { _candidate: x.id, _accept: true, _note: note }); if (error) throw error; }, 'Offer accepted. HR will share joining instructions.')}>Accept offer</Button>
        <Button variant="outline" disabled={a.busy} onClick={() => { if (window.confirm('Decline this offer?')) void a.run(async () => { const { error } = await supabase.rpc('candidate_respond_offer', { _candidate: x.id, _accept: false, _note: note }); if (error) throw error; }, 'Offer declined.'); }}>Decline</Button></div></div>}
    <a.Status />
  </Panel>;
}

function Profile({ list }: { list: App[] }) {
  const p = list[0]!.profile;
  return <Panel title="My profile"><dl className="grid grid-cols-[10rem_1fr] gap-1 text-sm">{([['Name', p.full_name], ['Mobile', p.phone], ['City', p.city], ['Date of birth', p.dob ? new Date(`${p.dob}T00:00:00`).toLocaleDateString('en-IN') : ''], ['Address', p.current_address], ['Qualification', p.qualification], ['University', p.university], ['Experience', p.experience_years === null ? '' : `${p.experience_years} years`], ['Skills', p.skills]] as [string, string][]).map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd>{v || '—'}</dd></div>)}</dl>
    <p className="mt-3 text-xs text-muted-foreground">These are the details from your latest application. To correct something, send HR a message.</p></Panel>;
}
