import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BadgeCheck, BadgeIndianRupee, CalendarClock, Check, FileCheck2, GraduationCap, HandHeart, IdCard, LineChart, MapPin, ShieldCheck, Sparkles, Trophy, UsersRound, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { volunteerApplicationSchema } from "@/lib/submission-schemas";
import { submitVolunteerApplication } from "@/lib/enquiries.functions";
import { ReferralCodeField } from "@/components/referral/referral-code-field";
import heroImage from "@/assets/become-volunteer-hero.webp";
import sessionImage from "@/assets/vol-session.webp";
import familyImage from "@/assets/vol-family.webp";
import { eligibilityCriteria, eligibilityProblems, VOLUNTEER_MIN_AGE } from "@/lib/volunteers/eligibility";

export const Route = createFileRoute("/become-a-volunteer")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Become a RILOYD Volunteer | Stipend up to ₹8,000/month" },
      { name: "description", content: "Join the RILOYD volunteer programme: help students and families reach scholarships and programmes, earn a stipend of up to ₹8,000 a month plus incentives. See eligibility, documents, earnings and the code of conduct." },
      { property: "og:title", content: "Become a RILOYD Volunteer" },
      { property: "og:description", content: "Stipend up to ₹8,000 per month plus incentives. Apply online and work with a RILOYD coordinator near you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/become-a-volunteer" }],
  }),
  component: BecomeVolunteerPage,
});

const benefits = [
  { icon: BadgeIndianRupee, title: "Stipend up to ₹8,000 / month", text: "A monthly stipend of up to ₹8,000 for active volunteers." },
  { icon: Trophy, title: "Incentives on top", text: "Earn incentives for every successful referral, in addition to your stipend." },
  { icon: LineChart, title: "Your own dashboard", text: "Track referrals, earnings and withdrawals in your private volunteer dashboard." },
  { icon: GraduationCap, title: "Learn real skills", text: "Communication, outreach and teamwork guided by an experienced RILOYD coordinator." },
  { icon: CalendarClock, title: "Flexible hours", text: "Choose hours that fit around your studies or work." },
  { icon: ShieldCheck, title: "Transparent payouts", text: "Earnings are verified by our Accounts team and paid with a transaction reference." },
];
const roles = [
  "Tell students and families about RILOYD scholarships and programmes",
  "Help applicants complete registrations correctly",
  "Share your personal referral link in your school, college and community",
  "Join awareness drives, seminars and local events",
];
const steps = [
  { title: "Apply online", text: "Fill in the short form on this page." },
  { title: "Talk to a coordinator", text: "A RILOYD employee calls you and explains the work and stipend." },
  { title: "Get registered", text: "Your coordinator registers you as a volunteer with your email." },
  { title: "Open your dashboard", text: "Create your account at Volunteer Login with the same email and start." },
];
const documents = [
  "Aadhaar card (for identity and address)",
  "PAN card (for payouts)",
  "Bank passbook / cancelled cheque or UPI ID in your own name",
  "One recent passport-size photo (for your volunteer ID)",
  "Latest marksheet or college ID (12th pass or above)",
];
const earningSteps = [
  { icon: UsersRound, title: "You refer", text: "A student or family registers through your personal referral link or code." },
  { icon: FileCheck2, title: "We verify", text: "RILOYD checks the application and the payment. You can follow every stage in your dashboard." },
  { icon: BadgeCheck, title: "Incentive credited", text: "Once the application is verified, your incentive is credited to your volunteer wallet." },
  { icon: Wallet, title: "You withdraw", text: "After your KYC is verified, request a withdrawal. Accounts verifies it and Finance pays with a transaction reference." },
];
const support = [
  { icon: GraduationCap, title: "Orientation & training", text: "Your coordinator explains every programme, the forms and how to talk to students and parents." },
  { icon: IdCard, title: "Verified volunteer identity", text: "Active volunteers are listed on our Our Team page, so anyone can verify you with your volunteer ID." },
  { icon: LineChart, title: "Private dashboard", text: "Referral link, application tracking, earnings, KYC, withdrawals and support tickets in one place." },
  { icon: Trophy, title: "Certificate & recognition", text: "Active volunteers can request a volunteering certificate from their coordinator." },
];
const dos = [
  "Always share your own referral link or code",
  "Explain programmes honestly, exactly as written on the website",
  "Tell families that all fees are paid online to RILOYD only",
  "Keep every student's and parent's details private",
  "Show your volunteer ID when you meet people",
];
const donts = [
  "Never collect cash or fees in your own name",
  "Never promise selection, a scholarship or a job",
  "Never share anyone's documents or phone number",
  "Never use another volunteer's link or code",
  "Never charge anyone for helping them fill a form",
];
const faqs = [
  ["Who can become a volunteer?", `Anyone aged ${VOLUNTEER_MIN_AGE} or above who has passed 12th class, has a smartphone and a bank account in their own name — students, graduates, working professionals, teachers and homemakers.`],
  ["Can I volunteer alongside my studies or job?", "Yes. You choose your weekly hours, and most volunteers work part-time from their own city."],
  ["When can I withdraw my earnings?", "After your KYC is verified and your wallet has at least the minimum withdrawal amount shown in your dashboard."],
  ["What if I break the code of conduct?", "Your volunteer account can be paused or closed, and incentives linked to the misuse are not paid."],
  ["How much can I earn?", "Volunteers receive a stipend of up to ₹8,000 per month plus incentives. Your coordinator explains the exact amount when you join."],
  ["How are payments made?", "Earnings appear in your volunteer dashboard. You request a withdrawal there; our Accounts team verifies it and Finance pays it with a transaction reference."],
  ["Do I need to pay anything to join?", "No. Joining the RILOYD volunteer programme is free."],
  ["Is registration the same as selection?", "No. Applying only starts the process. A coordinator talks to you, checks your eligibility and documents, and only then registers you as a volunteer."],
];
const occupations = volunteerApplicationSchema.shape.occupation.options;
const hours = volunteerApplicationSchema.shape.hours.options;
const field = "min-h-12 w-full rounded-md border border-border bg-surface px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";

function BecomeVolunteerPage() {
  const save = useServerFn(submitVolunteerApplication);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState("");
  const [failure, setFailure] = useState("");
  const [check, setCheck] = useState({ age: "", twelfthPass: false, ownBankAccount: false, smartphone: false, acceptsConduct: false });
  const [checked, setChecked] = useState(false);
  const [agree, setAgree] = useState(false);
  const problems = eligibilityProblems({ ...check, age: check.age === "" ? null : Number(check.age) });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const el = event.currentTarget;
    const values = Object.fromEntries(new FormData(el).entries());
    const parsed = volunteerApplicationSchema.safeParse(values);
    if (!parsed.success || !agree) {
      const next: Record<string, string> = {};
      if (!parsed.success) for (const issue of parsed.error.issues) { const k = String(issue.path[0]); if (!next[k]) next[k] = issue.message; }
      if (!agree) next["agree"] = "Please confirm that you meet the eligibility criteria.";
      setErrors(next); return;
    }
    setErrors({}); setFailure(""); setSending(true);
    try { const saved = await save({ data: parsed.data }); el.reset(); setAgree(false); setDone(saved.ackNumber); }
    catch (e) { setFailure(e instanceof Error ? e.message : "Your application could not be sent. Please try again."); }
    finally { setSending(false); }
  }
  const err = (k: string) => errors[k] ? <p className="mt-1 text-xs font-medium text-destructive">{errors[k]}</p> : null;

  return <main className="min-h-screen overflow-hidden bg-background text-foreground">
    <section className="relative border-b border-border">
      <img src={heroImage} alt="RILOYD volunteers working together" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover object-[70%_center]" fetchPriority="high" decoding="async" />
      <div className="hero-shade absolute inset-0" />
      <div className="relative z-10 mx-auto flex min-h-[520px] max-w-[1380px] items-center px-5 py-14 sm:px-6 lg:px-12">
        <div className="max-w-xl">
          <p className="eyebrow text-[10px] font-bold uppercase">Volunteer programme</p>
          <h1 className="mt-4 text-[clamp(2.4rem,5vw,4.5rem)] font-black uppercase leading-[.92]">Become our <span className="text-primary">volunteer.</span></h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-soft sm:text-base">Help students and families reach scholarships and growth programmes — and grow with us while you do it.</p>
          <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-xl border border-primary/60 bg-background/70 px-5 py-4 backdrop-blur">
            <BadgeIndianRupee className="text-primary" size={30} aria-hidden="true" />
            <div><p className="text-2xl font-black leading-none">Up to ₹8,000<span className="text-sm font-bold text-soft"> / month</span></p><p className="mt-1 text-xs font-semibold text-soft">Stipend + incentives</p></div>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-7 font-bold"><a href="#apply">Apply now <ArrowRight /></a></Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-primary px-7 font-bold"><a href="#eligibility">Check eligibility</a></Button>
            <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-5 font-bold"><Link to="/volunteer">Volunteer Login</Link></Button>
          </div>
        </div>
      </div>
    </section>

    <section className="border-b border-border bg-surface">
      <div className="mx-auto grid max-w-[1380px] grid-cols-2 gap-px bg-border lg:grid-cols-4">
        {[["Up to ₹8,000", "Monthly stipend"], ["Incentives", "On every verified referral"], [`${VOLUNTEER_MIN_AGE}+ years`, "Minimum age to join"], ["Free", "No joining fee, ever"]].map(([a, b]) => <div key={b} className="bg-surface px-5 py-5 sm:px-6 lg:px-12"><p className="text-xl font-black text-primary sm:text-2xl">{a}</p><p className="mt-1 text-xs font-semibold text-soft">{b}</p></div>)}
      </div>
    </section>

    <section className="border-b border-border">
      <div className="mx-auto grid max-w-[1380px] items-center gap-10 px-5 py-12 sm:px-6 lg:grid-cols-2 lg:px-12">
        <div>
          <p className="section-label">About the programme</p>
          <h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">Who is a <span className="text-primary">RILOYD volunteer?</span></h2>
          <p className="mt-5 text-sm leading-relaxed text-soft sm:text-base">A RILOYD volunteer is a trusted local guide. You tell students and families in your area about RILOYD scholarships, education support and growth programmes, help them apply correctly, and stay with them until their application is verified.</p>
          <p className="mt-3 text-sm leading-relaxed text-soft sm:text-base">You work part-time from your own city with a RILOYD coordinator, earn a monthly stipend plus incentives, and build real skills in communication, outreach and teamwork.</p>
        </div>
        <img src={sessionImage} alt="A RILOYD volunteer leading an awareness session for college students" width={960} height={624} loading="lazy" decoding="async" className="aspect-[3/2] w-full rounded-xl border border-border object-cover" />
      </div>
    </section>

    <section id="eligibility" className="scroll-mt-6 border-b border-border px-5 py-12 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1380px]">
        <p className="section-label">Eligibility criteria</p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">Can you <span className="text-primary">join?</span></h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-soft">You must meet every point below. Your coordinator checks them, and your documents, before you are registered as a volunteer.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{eligibilityCriteria.map((c, i) => <article key={c.title} className="rounded-xl border border-border bg-surface p-5"><span className="text-xs font-black text-primary">{String(i + 1).padStart(2, "0")}</span><h3 className="mt-2 text-base font-bold">{c.title}</h3><p className="mt-1.5 text-sm leading-relaxed text-soft">{c.text}</p></article>)}</div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-5 sm:p-6">
            <h3 className="text-lg font-bold">Documents you will need</h3>
            <ul className="mt-4 space-y-2.5">{documents.map(d => <li key={d} className="flex gap-3 text-sm leading-relaxed"><FileCheck2 size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />{d}</li>)}</ul>
            <p className="mt-4 text-xs leading-relaxed text-soft">You do not upload these on this page. Your coordinator asks for them, and you complete KYC securely inside your volunteer dashboard.</p>
          </div>
          <div className="rounded-xl border border-primary/50 bg-surface p-5 sm:p-6">
            <h3 className="text-lg font-bold">Quick eligibility check</h3>
            <p className="mt-1 text-xs text-soft">Answer five questions. Nothing is saved.</p>
            <div className="mt-4 grid gap-3">
              <label className="text-xs font-semibold">Your age<input type="number" min={10} max={100} inputMode="numeric" value={check.age} onChange={e => { setCheck({ ...check, age: e.target.value }); setChecked(false); }} className={`${field} mt-1 max-w-[10rem]`} /></label>
              {([["twelfthPass", "I have passed 12th class"], ["ownBankAccount", "I have a bank account in my own name"], ["smartphone", "I have a smartphone with internet"], ["acceptsConduct", "I accept the volunteer code of conduct"]] as const).map(([k, label]) => <label key={k} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={check[k]} onChange={e => { setCheck({ ...check, [k]: e.target.checked }); setChecked(false); }} className="h-4 w-4 accent-primary" />{label}</label>)}
              <div><Button type="button" variant="outline" className="rounded-full border-primary font-bold" onClick={() => setChecked(true)}>Check my eligibility</Button></div>
              {checked && (problems.length === 0
                ? <p role="status" className="rounded-lg border border-primary bg-background p-3 text-sm font-semibold">You meet the basic criteria. <a href="#apply" className="text-primary underline-offset-4 hover:underline">Apply now</a> — your coordinator will confirm your documents.</p>
                : <div role="status" className="rounded-lg border border-destructive/60 bg-background p-3 text-sm"><p className="font-semibold">Not eligible yet:</p><ul className="mt-1 list-disc pl-5 text-soft">{problems.map(p => <li key={p}>{p}</li>)}</ul></div>)}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="border-b border-border px-5 py-12 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1380px]">
        <p className="section-label">Why volunteer with RILOYD</p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">Earn, learn and <span className="text-primary">make a difference.</span></h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{benefits.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-xl border border-border bg-surface p-5"><span className="grid h-10 w-10 place-items-center rounded-full border border-primary text-primary"><Icon size={18} aria-hidden="true" /></span><h3 className="mt-4 text-base font-bold">{title}</h3><p className="mt-1.5 text-sm leading-relaxed text-soft">{text}</p></article>)}</div>
      </div>
    </section>

    <section className="border-b border-border">
      <div className="mx-auto grid max-w-[1380px] gap-10 px-5 py-12 sm:px-6 lg:grid-cols-2 lg:px-12">
        <div><p className="section-label">What you will do</p><ul className="mt-6 space-y-3">{roles.map(r => <li key={r} className="flex gap-3 text-sm leading-relaxed"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={12} /></span>{r}</li>)}</ul>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">{[{ i: UsersRound, t: "Community" }, { i: HandHeart, t: "Impact" }, { i: Sparkles, t: "Growth" }].map(({ i: I, t }) => <div key={t} className="rounded-lg border border-border p-3"><I className="mx-auto text-primary" size={20} aria-hidden="true" /><p className="mt-1.5 text-xs font-bold">{t}</p></div>)}</div>
        </div>
        <div><p className="section-label">How it works</p><ol className="mt-6 space-y-4">{steps.map((s, i) => <li key={s.title} className="flex gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">{i + 1}</span><div><h3 className="font-bold">{s.title}</h3><p className="mt-0.5 text-sm text-soft">{s.text}</p></div></li>)}</ol></div>
      </div>
    </section>

    <section className="border-b border-border bg-surface px-5 py-12 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1380px]">
        <p className="section-label">How earnings work</p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">Clear, tracked and <span className="text-primary">verified.</span></h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{earningSteps.map(({ icon: Icon, title, text }, i) => <li key={title} className="rounded-xl border border-border bg-background p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-full border border-primary text-primary"><Icon size={18} aria-hidden="true" /></span><span className="text-2xl font-black text-border">{i + 1}</span></div><h3 className="mt-4 font-bold">{title}</h3><p className="mt-1.5 text-sm leading-relaxed text-soft">{text}</p></li>)}</ol>
        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-soft">The stipend amount depends on your activity and is confirmed by your coordinator when you join. Incentives are paid only for applications that RILOYD verifies; a registration alone is not a verified application.</p>
      </div>
    </section>

    <section className="border-b border-border">
      <div className="mx-auto grid max-w-[1380px] items-center gap-10 px-5 py-12 sm:px-6 lg:grid-cols-2 lg:px-12">
        <img src={familyImage} alt="A RILOYD volunteer helping a parent and student apply on a phone" width={960} height={624} loading="lazy" decoding="async" className="order-last aspect-[3/2] w-full rounded-xl border border-border object-cover lg:order-first" />
        <div>
          <p className="section-label">Training & support</p>
          <h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">You are <span className="text-primary">never alone.</span></h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">{support.map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Icon size={16} aria-hidden="true" /></span><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-soft">{text}</p></div></div>)}</div>
        </div>
      </div>
    </section>

    <section id="code-of-conduct" className="scroll-mt-6 border-b border-border px-5 py-12 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1380px]">
        <p className="section-label">Code of conduct</p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">Trust comes <span className="text-primary">first.</span></h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-5 sm:p-6"><h3 className="text-lg font-bold">Always</h3><ul className="mt-4 space-y-2.5">{dos.map(d => <li key={d} className="flex gap-3 text-sm leading-relaxed"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={12} aria-hidden="true" /></span>{d}</li>)}</ul></div>
          <div className="rounded-xl border border-destructive/50 p-5 sm:p-6"><h3 className="text-lg font-bold">Never</h3><ul className="mt-4 space-y-2.5">{donts.map(d => <li key={d} className="flex gap-3 text-sm leading-relaxed"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-destructive text-destructive-foreground"><X size={12} aria-hidden="true" /></span>{d}</li>)}</ul></div>
        </div>
      </div>
    </section>

    <section id="apply" className="scroll-mt-6 border-b border-border px-5 py-12 sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1380px] gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div><p className="section-label">Apply now</p><h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">Start your <span className="text-primary">journey.</span></h2><p className="mt-4 max-w-md text-sm leading-relaxed text-soft">Send your details and a RILOYD coordinator will contact you. Already a volunteer? <Link to="/volunteer" className="font-bold text-primary underline-offset-4 hover:underline">Sign in here</Link>.</p><p className="mt-5 flex items-center gap-2 text-xs text-soft"><MapPin size={14} className="text-primary" aria-hidden="true" /> Head office: Gwalior, Madhya Pradesh</p></div>
        {done ? <div role="status" className="rounded-xl border border-primary bg-surface p-6"><h3 className="text-xl font-bold">Application received</h3><p className="mt-2 text-sm text-soft">Thank you! Your acknowledgement number is <b className="text-foreground">{done}</b>. Our coordinator will contact you soon.</p><Button variant="outline" className="mt-4 rounded-full" onClick={() => setDone("")}>Send another application</Button></div>
        : <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold sm:col-span-2">Full name *<input name="name" className={`${field} mt-1`} maxLength={100} autoComplete="name" aria-invalid={Boolean(errors["name"])} />{err("name")}</label>
          <label className="text-xs font-semibold">Email *<input name="email" type="email" className={`${field} mt-1`} maxLength={255} autoComplete="email" aria-invalid={Boolean(errors["email"])} />{err("email")}</label>
          <label className="text-xs font-semibold">Mobile number *<input name="phone" type="tel" className={`${field} mt-1`} maxLength={20} autoComplete="tel" aria-invalid={Boolean(errors["phone"])} />{err("phone")}</label>
          <label className="text-xs font-semibold">City / district *<input name="city" className={`${field} mt-1`} maxLength={80} aria-invalid={Boolean(errors["city"])} />{err("city")}</label>
          <label className="text-xs font-semibold">What do you do now? *<select name="occupation" defaultValue="" className={`${field} mt-1`}><option value="" disabled>Choose…</option>{occupations.map(o => <option key={o}>{o}</option>)}</select>{err("occupation")}</label>
          <label className="text-xs font-semibold">Hours per week *<select name="hours" defaultValue="" className={`${field} mt-1`}><option value="" disabled>Choose…</option>{hours.map(o => <option key={o}>{o}</option>)}</select>{err("hours")}</label>
          <ReferralCodeField inputClassName={field} labelClassName="text-xs font-semibold" />
          <label className="text-xs font-semibold sm:col-span-2">Tell us about yourself (optional)<textarea name="message" className={`${field} mt-1 min-h-24 resize-y py-3`} maxLength={800} /></label>
          <label className="flex items-start gap-3 text-xs leading-relaxed sm:col-span-2"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" aria-invalid={Boolean(errors["agree"])} /><span>I am {VOLUNTEER_MIN_AGE} or older and meet the <a href="#eligibility" className="font-bold text-primary underline-offset-4 hover:underline">eligibility criteria</a>, and I accept the <a href="#code-of-conduct" className="font-bold text-primary underline-offset-4 hover:underline">code of conduct</a>. *</span></label>
          {err("agree")}
          {failure && <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2">{failure}</p>}
          <div className="sm:col-span-2"><Button type="submit" size="lg" disabled={sending} className="h-12 rounded-full px-8 font-bold">{sending ? "Sending…" : "Apply as volunteer"} <ArrowRight /></Button></div>
        </form>}
      </div>
    </section>

    <section className="px-5 py-12 sm:px-6 lg:px-12"><div className="mx-auto max-w-[1380px]"><p className="section-label">Questions</p><div className="mt-6 grid gap-4 md:grid-cols-2">{faqs.map(([q, a]) => <article key={q} className="rounded-xl border border-border p-5"><h3 className="font-bold">{q}</h3><p className="mt-2 text-sm leading-relaxed text-soft">{a}</p></article>)}</div></div></section>
  </main>;
}
