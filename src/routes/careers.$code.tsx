import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { countReferralVisit, kindLabel, lookupReferral, modeLabel, openJobs, typeLabel, type PublicJob, type Referral } from "@/components/careers/shared";

export const Route = createFileRoute("/careers/$code")({
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>): { ref?: string } => (typeof s["ref"] === "string" && s["ref"].trim() ? { ref: s["ref"].trim().slice(0, 40) } : {}),
  head: ({ params }) => ({ meta: [{ title: `Job ${params.code} | Careers at RILOYD` }, { name: "description", content: `Details, eligibility and online application for RILOYD job ${params.code}.` }, { property: "og:title", content: `RILOYD job opening ${params.code}` }, { property: "og:description", content: "See the role, eligibility and selection process, and apply online." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: JobPage,
});

const blank = { full_name: "", email: "", phone: "", dob: "", gender: "", current_address: "", permanent_address: "", city: "", state: "", pincode: "", qualification: "", course: "", specialisation: "", university: "", passing_year: "", score: "", is_fresher: "true", experience_years: "", current_org: "", current_designation: "", current_ctc: "", expected_ctc: "", notice_period: "", skills: "", languages: "", why_join: "", availability: "", additional: "" };
type Form = typeof blank;
const labels: Partial<Record<keyof Form, string>> = { full_name: "Full name", email: "Email", phone: "Mobile", dob: "Date of birth", gender: "Gender", current_address: "Current address", permanent_address: "Permanent address", city: "City", state: "State", pincode: "PIN code", qualification: "Highest qualification", course: "Course", specialisation: "Specialisation", university: "University / institute", passing_year: "Passing year", score: "Percentage / CGPA", experience_years: "Total experience (years)", current_org: "Current organisation", current_designation: "Current designation", current_ctc: "Current salary (₹/month)", expected_ctc: "Expected salary (₹/month)", notice_period: "Notice period", skills: "Skills", languages: "Languages", why_join: "Why do you want to join RILOYD?", availability: "Availability for interview", additional: "Additional information" };

function Block({ title, children }: { title: string; children: ReactNode }) { return <section className="grid gap-3"><h3 className="text-lg font-semibold">{title}</h3><div className="grid gap-3 sm:grid-cols-2">{children}</div></section>; }
function F({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) { return <label className={`grid gap-1.5 text-sm ${wide ? "sm:col-span-2" : ""}`}><span className="font-medium">{label}</span>{children}</label>; }

function JobPage() {
  const { code } = Route.useParams(); const { ref } = Route.useSearch();
  const [job, setJob] = useState<PublicJob | null | undefined>(undefined);
  const [refInfo, setRefInfo] = useState<Referral | null>(null); const [manualCode, setManualCode] = useState("");
  const [f, setF] = useState<Form>(blank); const [step, setStep] = useState<"form" | "preview" | "done">("form");
  const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(""); const [result, setResult] = useState<{ ref: string; referral: string | null; warning: string | null } | null>(null);
  const [session, setSession] = useState<Session | null>(null); const [file, setFile] = useState<File | null>(null);
  useEffect(() => { openJobs().then(list => setJob(list.find(j => j.job_code.toUpperCase() === code.toUpperCase()) ?? null)).catch(() => setJob(null)); }, [code]);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (data.session?.user.email) setF(v => ({ ...v, email: v.email || data.session!.user.email! })); }).catch(() => undefined); }, []);
  useEffect(() => { if (!ref || !job) return; countReferralVisit(ref); lookupReferral(ref, job.id).then(setRefInfo).catch(() => setRefInfo({ valid: false, reason: "Referral code could not be checked." })); }, [ref, job]);
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const refCode = refInfo?.valid ? refInfo.code ?? "" : "";

  const toPreview = (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    if (f.full_name.trim().length < 2) return setMsg("Enter your full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return setMsg("Enter a valid email.");
    if (f.phone.replace(/\D/g, "").length < 10) return setMsg("Enter a 10-digit mobile number.");
    if (!f.qualification.trim()) return setMsg("Enter your highest qualification.");
    if (f.is_fresher === "false" && !f.experience_years) return setMsg("Enter your total experience.");
    if (file && file.size > 5 * 1024 * 1024) return setMsg("Resume must be 5 MB or smaller.");
    if (file && !/\.(pdf|docx?)$/i.test(file.name)) return setMsg("Upload the resume as PDF or Word.");
    setStep("preview"); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = async () => {
    if (!job) return; if (!confirm) { setMsg("Please confirm that the details are correct."); return; }
    setBusy(true); setMsg("");
    try {
      let resume_path: string | undefined;
      if (file && session) { resume_path = `candidate/${session.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_").slice(-80)}`; const { error } = await supabase.storage.from("hr-resumes").upload(resume_path, file); if (error) throw error; }
      const { data, error } = await supabase.rpc("careers_apply", { _job: job.id, _d: { ...f, is_fresher: f.is_fresher === "true", confirm: true, ...(resume_path ? { resume_path } : {}) }, _ref: refCode || ref || "" });
      if (error) throw error;
      setResult(data as { ref: string; referral: string | null; warning: string | null }); setStep("done"); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not submit. Please try again."); }
    setBusy(false);
  };

  if (job === undefined) return <main className="mx-auto max-w-4xl px-4 py-12"><p className="text-muted-foreground">Loading…</p></main>;
  if (!job) return <main className="mx-auto max-w-4xl space-y-4 px-4 py-12"><h1 className="text-2xl font-bold">This job is not open</h1><p className="text-muted-foreground">It may have closed or the link is wrong.</p><Button asChild><Link to="/careers" search={ref ? { ref } : {}}>See current openings</Link></Button></main>;
  const facts: [string, string][] = ([["Department", job.department], ["Designation", job.designation], ["Location", job.location], ["Employment type", typeLabel[job.employment_type] ?? job.employment_type], ["Work mode", modeLabel[job.work_mode] ?? job.work_mode], ["Vacancies", String(job.openings)], ["Experience", job.experience_required], ["Qualification", job.qualification], ["Salary / CTC", job.salary_range], ["Working days", job.working_days], ["Working hours", job.working_hours], ["Apply by", job.apply_end ? new Date(`${job.apply_end}T00:00:00`).toLocaleDateString("en-IN") : ""]] as [string, string][]).filter(([, v]) => v);
  return <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
    <Link to="/careers" search={ref ? { ref } : {}} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />All openings</Link>
    <header><p className="text-sm font-semibold text-primary">{job.job_code}</p><h1 className="text-3xl font-bold">{job.title}</h1></header>
    {step !== "done" && <>
      <dl className="grid gap-x-6 gap-y-2 rounded-xl border bg-card p-5 text-sm text-card-foreground sm:grid-cols-2">{facts.map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-border py-1 last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl>
      {[["About the job", job.description], ["Roles & responsibilities", job.responsibilities], ["Required skills", job.skills], ["Selection process", job.selection_process], ["Documents required", job.required_docs]].filter(([, v]) => v).map(([t, v]) => <section key={t}><h2 className="text-xl font-semibold">{t}</h2><p className="mt-2 whitespace-pre-line text-sm">{v}</p></section>)}
    </>}

    {step === "done" && result ? <section className="space-y-3 rounded-xl border border-primary/40 bg-accent p-6 text-accent-foreground">
      <h2 className="text-2xl font-bold">Application submitted</h2>
      <p>Your Application ID is <b className="font-mono">{result.ref}</b>. Save it to check your status.</p>
      {result.referral && <p>Referral recorded: {result.referral}.</p>}{result.warning && <p className="text-destructive">{result.warning} Your application was saved without a referral.</p>}
      <p className="text-sm">Track every step — screening, interviews, assessments and offer — in the Candidate portal. Sign in (or create an account) with <b>{f.email}</b>.</p>
      <div className="flex flex-wrap gap-2"><Button asChild><Link to="/candidate-portal">Open candidate portal</Link></Button><Button asChild variant="outline"><Link to="/careers">More openings</Link></Button></div>
    </section> : <section className="space-y-6 rounded-xl border bg-card p-5 text-card-foreground sm:p-6" id="apply">
      <h2 className="text-2xl font-bold">{step === "preview" ? "Check your application" : "Apply now"}</h2>
      {(ref || refCode) && <div className="rounded-lg border bg-muted/40 p-3 text-sm">
        <p className="flex items-center gap-1 font-semibold"><Lock className="size-3.5" />Referral details (filled automatically, cannot be edited)</p>
        {refInfo === null ? <p className="text-muted-foreground">Checking…</p> : refInfo.valid ? <dl className="mt-1 grid grid-cols-[8rem_1fr] gap-1"><dt className="text-muted-foreground">Referral code</dt><dd className="font-mono">{refInfo.code}</dd><dt className="text-muted-foreground">Referred by</dt><dd>{refInfo.name}</dd><dt className="text-muted-foreground">Type</dt><dd>{kindLabel[refInfo.kind ?? ""] ?? "Referral"}</dd>{refInfo.institute && <><dt className="text-muted-foreground">Institute</dt><dd>{refInfo.institute}</dd></>}<dt className="text-muted-foreground">Job</dt><dd>{job.job_code}</dd></dl> : <p className="text-destructive">{refInfo.reason} You can still apply; no referral will be linked.</p>}
      </div>}
      {!ref && !refCode && step === "form" && <details className="text-sm"><summary className="cursor-pointer font-medium">Have a referral or coordinator code?</summary><div className="mt-2 flex gap-2"><Input aria-label="Referral code" placeholder="e.g. INST-1001" value={manualCode} onChange={e => setManualCode(e.target.value)} /><Button type="button" variant="outline" onClick={() => void lookupReferral(manualCode, job.id).then(setRefInfo).catch(() => setRefInfo({ valid: false, reason: "Could not check the code." }))}>Check code</Button></div>{refInfo && !refInfo.valid && <p className="mt-1 text-destructive">{refInfo.reason}</p>}</details>}

      {step === "form" ? <form onSubmit={toPreview} className="space-y-6" noValidate>
        <Block title="A. Personal details">
          <F label="Full name *"><Input value={f.full_name} onChange={set("full_name")} autoComplete="name" /></F>
          <F label="Email *"><Input type="email" value={f.email} onChange={set("email")} autoComplete="email" /></F>
          <F label="Mobile *"><Input inputMode="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" /></F>
          <F label="Date of birth"><Input type="date" value={f.dob} onChange={set("dob")} /></F>
          <F label="Gender (optional)"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={f.gender} onChange={set("gender")}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option></select></F>
          <F label="City"><Input value={f.city} onChange={set("city")} /></F>
          <F label="State"><Input value={f.state} onChange={set("state")} /></F>
          <F label="PIN code"><Input inputMode="numeric" maxLength={6} value={f.pincode} onChange={set("pincode")} /></F>
          <F label="Current address" wide><Textarea rows={2} value={f.current_address} onChange={set("current_address")} /></F>
          <F label="Permanent address" wide><Textarea rows={2} value={f.permanent_address} onChange={set("permanent_address")} /></F>
        </Block>
        <Block title="B. Education">
          <F label="Highest qualification *"><Input value={f.qualification} onChange={set("qualification")} /></F>
          <F label="Course"><Input value={f.course} onChange={set("course")} /></F>
          <F label="Specialisation"><Input value={f.specialisation} onChange={set("specialisation")} /></F>
          <F label="University / institute"><Input value={f.university} onChange={set("university")} /></F>
          <F label="Passing year"><Input type="number" min={1960} max={2040} value={f.passing_year} onChange={set("passing_year")} /></F>
          <F label="Percentage / CGPA"><Input value={f.score} onChange={set("score")} /></F>
        </Block>
        <Block title="C. Experience">
          <F label="I am"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={f.is_fresher} onChange={set("is_fresher")}><option value="true">A fresher</option><option value="false">Experienced</option></select></F>
          {f.is_fresher === "false" && <><F label="Total experience (years) *"><Input type="number" min={0} max={60} step={0.5} value={f.experience_years} onChange={set("experience_years")} /></F>
            <F label="Current organisation"><Input value={f.current_org} onChange={set("current_org")} /></F><F label="Current designation"><Input value={f.current_designation} onChange={set("current_designation")} /></F>
            <F label="Current salary (₹/month)"><Input type="number" min={0} value={f.current_ctc} onChange={set("current_ctc")} /></F><F label="Notice period"><Input value={f.notice_period} onChange={set("notice_period")} /></F></>}
          <F label="Expected salary (₹/month)"><Input type="number" min={0} value={f.expected_ctc} onChange={set("expected_ctc")} /></F>
          <F label="Languages"><Input value={f.languages} onChange={set("languages")} /></F>
          <F label="Skills" wide><Textarea rows={2} value={f.skills} onChange={set("skills")} /></F>
        </Block>
        <Block title="D. Documents">
          {session ? <F label="Resume / CV (PDF or Word, max 5 MB)" wide><input type="file" accept=".pdf,.doc,.docx" className="text-sm" onChange={e => setFile(e.target.files?.[0] ?? null)} /></F>
            : <p className="text-sm text-muted-foreground sm:col-span-2">Upload your resume, photo and certificates from the <Link to="/candidate-portal" className="text-primary underline">Candidate portal</Link> after applying (sign in with the same email). Signed-in candidates can attach the resume here.</p>}
        </Block>
        <Block title="E. Additional information">
          <F label="Why do you want to join RILOYD?" wide><Textarea rows={3} value={f.why_join} onChange={set("why_join")} /></F>
          <F label="Availability for interview"><Input placeholder="e.g. Weekdays after 2 pm" value={f.availability} onChange={set("availability")} /></F>
          <F label="Anything else (portfolio / LinkedIn)"><Input value={f.additional} onChange={set("additional")} /></F>
        </Block>
        {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
        <Button type="submit" size="lg">Preview application</Button>
      </form> : <div className="space-y-4">
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{(Object.keys(labels) as (keyof Form)[]).filter(k => f[k] && !(f.is_fresher === "true" && ["current_org", "current_designation", "current_ctc", "notice_period", "experience_years"].includes(k))).map(k => <div key={k} className="flex justify-between gap-3 border-b border-border py-1"><dt className="text-muted-foreground">{labels[k]}</dt><dd className="text-right">{f[k]}</dd></div>)}
          <div className="flex justify-between gap-3 border-b border-border py-1"><dt className="text-muted-foreground">Status</dt><dd>{f.is_fresher === "true" ? "Fresher" : "Experienced"}</dd></div>{file && <div className="flex justify-between gap-3 border-b border-border py-1"><dt className="text-muted-foreground">Resume</dt><dd>{file.name}</dd></div>}</dl>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={confirm} onChange={e => setConfirm(e.target.checked)} />I confirm that the details above are correct and complete.</label>
        {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setStep("form")} disabled={busy}>Edit details</Button><Button onClick={() => void submit()} disabled={busy || !confirm}>{busy ? "Submitting…" : "Submit application"}</Button></div>
      </div>}
    </section>}
  </main>;
}
