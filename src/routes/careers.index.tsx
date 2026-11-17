import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, GraduationCap, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { countReferralVisit, kindLabel, lookupReferral, modeLabel, openJobs, typeLabel, type PublicJob, type Referral } from "@/components/careers/shared";

export const Route = createFileRoute("/careers/")({
  staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>): { ref?: string } => (typeof s["ref"] === "string" && s["ref"].trim() ? { ref: s["ref"].trim().slice(0, 40) } : {}),
  head: () => ({ meta: [{ title: "Careers at RILOYD | Current Openings & Apply Online" }, { name: "description", content: "Browse current openings at RILOYD by department, location and work mode, apply online and track your application in the candidate portal." }, { property: "og:title", content: "Careers at RILOYD — Join our team" }, { property: "og:description", content: "Current openings, how our hiring works, and online applications with status tracking." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Careers,
});

const steps = ["Apply online for the job", "HR screens your application", "Shortlisting and, where needed, an assessment", "Interview rounds", "Selection and offer letter", "Accept the offer, verify documents and join"];
const faqs = [
  ["How do I know where my application is?", "Sign in to the Candidate portal with the email you applied with to see every stage, interview, assessment and offer. You can also check by Application ID and mobile number below."],
  ["Can I apply for more than one job?", "Yes. Each job you apply for gets its own Application ID and is tracked separately."],
  ["I have a referral or coordinator link. Do I need to type the code?", "No. Opening the link fills the referral details automatically and locks them. They cannot be changed on the form."],
  ["When should I upload my resume?", "You can attach it while applying if you are signed in, or upload it later from the Candidate portal."],
];

function Careers() {
  const { ref } = Route.useSearch();
  const [jobs, setJobs] = useState<PublicJob[] | null>(null); const [err, setErr] = useState("");
  const [f, setF] = useState({ q: "", department: "", location: "", mode: "", type: "", qualification: "" });
  const [refInfo, setRefInfo] = useState<Referral | null>(null);
  const [status, setStatus] = useState("");
  useEffect(() => { openJobs().then(setJobs).catch(e => { setErr(e instanceof Error ? e.message : "Could not load jobs"); setJobs([]); }); }, []);
  useEffect(() => { if (!ref) return; countReferralVisit(ref); lookupReferral(ref).then(setRefInfo).catch(() => setRefInfo({ valid: false, reason: "Referral code could not be checked." })); }, [ref]);
  const list = jobs ?? [];
  const opts = (k: keyof PublicJob) => [...new Set(list.map(j => String(j[k] ?? "")).filter(Boolean))].sort();
  const shown = useMemo(() => list.filter(j => {
    const q = f.q.trim().toLowerCase();
    return (!q || [j.title, j.designation, j.skills, j.description].some(x => x.toLowerCase().includes(q)))
      && (!f.department || j.department === f.department) && (!f.location || j.location === f.location) && (!f.mode || j.work_mode === f.mode) && (!f.type || j.employment_type === f.type)
      && (!f.qualification || j.qualification.toLowerCase().includes(f.qualification.toLowerCase()));
  }), [list, f]);
  async function check(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const d = new FormData(e.currentTarget);
    const { data } = await supabase.rpc("careers_status", { _ref: String(d.get("ref")), _phone: String(d.get("phone")) });
    const r = (data as { job_title: string; stage_label: string; interview_at: string | null }[] | null)?.[0];
    setStatus(r ? `${r.job_title ?? "Application"}: ${r.stage_label}${r.interview_at ? ` · next interview ${new Date(r.interview_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : ""}` : "No application found for these details.");
  }
  const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm";
  return <main className="mx-auto max-w-6xl space-y-12 px-4 py-12">
    <header className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wide text-primary">Careers</p><h1 className="mt-1 text-3xl font-bold md:text-4xl">Join our team</h1>
      <p className="mt-3 text-muted-foreground">Current openings across departments. Apply online, then follow every step of your application in the Candidate portal.</p>
      <div className="mt-5 flex flex-wrap gap-2"><Button asChild><a href="#openings">See openings</a></Button><Button asChild variant="outline"><Link to="/candidate-portal">Candidate login</Link></Button><Button asChild variant="outline"><Link to="/institute-portal">Institute / consultancy login</Link></Button></div></header>
    {refInfo && <p role="status" className={`rounded-lg border p-3 text-sm ${refInfo.valid ? "border-primary/40 bg-accent text-accent-foreground" : "border-destructive/40 bg-destructive/5 text-destructive"}`}>{refInfo.valid ? <>You were referred by <b>{refInfo.name}</b> ({kindLabel[refInfo.kind ?? ""] ?? "Referral"}{refInfo.institute ? ` · ${refInfo.institute}` : ""}). This will be attached to your application automatically.</> : refInfo.reason}</p>}
    <section id="openings" className="space-y-4">
      <h2 className="text-2xl font-bold">Current openings</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <label className="relative lg:col-span-2"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search jobs" placeholder="Job role or skill" className="pl-9" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} /></label>
        <select aria-label="Department" className={sel} value={f.department} onChange={e => setF({ ...f, department: e.target.value })}><option value="">All departments</option>{opts("department").map(o => <option key={o}>{o}</option>)}</select>
        <select aria-label="Location" className={sel} value={f.location} onChange={e => setF({ ...f, location: e.target.value })}><option value="">All locations</option>{opts("location").map(o => <option key={o}>{o}</option>)}</select>
        <select aria-label="Work mode" className={sel} value={f.mode} onChange={e => setF({ ...f, mode: e.target.value })}><option value="">Any work mode</option>{Object.entries(modeLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select aria-label="Employment type" className={sel} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="">Any type</option>{Object.entries(typeLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <Input aria-label="Qualification" placeholder="Qualification" value={f.qualification} onChange={e => setF({ ...f, qualification: e.target.value })} />
      </div>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {jobs === null ? <p className="text-muted-foreground">Loading…</p> : shown.length === 0 ? <p className="text-muted-foreground">{list.length ? "No jobs match these filters." : "No openings right now. Please check back soon."}</p> : shown.map(j => (
          <article key={j.id} className="flex flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground">
            <div><p className="text-xs font-semibold text-muted-foreground">{j.job_code} · {j.department}</p><h3 className="text-xl font-semibold">{j.title}</h3></div>
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{j.location || "—"}</span><span className="inline-flex items-center gap-1"><BriefcaseBusiness className="size-3.5" />{typeLabel[j.employment_type] ?? j.employment_type} · {modeLabel[j.work_mode] ?? j.work_mode}</span>{j.qualification && <span className="inline-flex items-center gap-1"><GraduationCap className="size-3.5" />{j.qualification}</span>}</p>
            <p className="line-clamp-3 text-sm">{j.description}</p>
            <p className="text-xs text-muted-foreground">{[j.experience_required && `Experience: ${j.experience_required}`, j.salary_range, `${j.openings} vacanc${j.openings === 1 ? "y" : "ies"}`, j.apply_end && `Apply by ${new Date(`${j.apply_end}T00:00:00`).toLocaleDateString("en-IN")}`].filter(Boolean).join(" · ")}</p>
            <div className="mt-auto"><Button asChild><Link to="/careers/$code" params={{ code: j.job_code }} search={ref ? { ref } : {}}>View details & apply</Link></Button></div>
          </article>))}
      </div>
    </section>
    <section className="grid gap-8 md:grid-cols-2">
      <div><h2 className="text-2xl font-bold">How our hiring process works</h2><ol className="mt-4 grid gap-3">{steps.map((s, i) => <li key={s} className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span><span className="pt-0.5">{s}</span></li>)}</ol>
        <p className="mt-3 text-sm text-muted-foreground">Each job shows its own selection process. You see only the steps that apply to your application.</p></div>
      <div><h2 className="text-2xl font-bold">Frequently asked questions</h2><div className="mt-4 grid gap-2">{faqs.map(([q, a]) => <details key={q} className="rounded-lg border bg-card p-4 text-card-foreground"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm text-muted-foreground">{a}</p></details>)}</div></div>
    </section>
    <form onSubmit={check} className="grid gap-3 rounded-xl border bg-card p-5 text-card-foreground md:grid-cols-3">
      <h2 className="text-xl font-semibold md:col-span-3">Check application status</h2>
      <Input name="ref" placeholder="Application ID (RC…)" required /><Input name="phone" placeholder="Mobile used" required inputMode="tel" /><Button>Check</Button>
      {status && <p className="text-sm md:col-span-3" role="status">{status}</p>}
    </form>
  </main>;
}
