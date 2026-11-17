import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { GraduationCap, Headphones, Search, BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkCustomerTicket } from "@/lib/enquiries.functions";

type Tab = "ticket" | "scholarship" | "job";
const tabs: { key: Tab; label: string; icon: typeof Search }[] = [
  { key: "ticket", label: "Support ticket", icon: Headphones },
  { key: "scholarship", label: "Scholarship form", icon: GraduationCap },
  { key: "job", label: "Job application", icon: BriefcaseBusiness },
];
const statusLabel: Record<string, string> = { open: "Received", in_progress: "Being worked on", waiting_customer: "Waiting for your reply", resolved: "Resolved", closed: "Closed" };

/** Home page status check without signing in; each check uses the existing secure lookup for that form. */
export function QuickStatusTracker() {
  const [tab, setTab] = useState<Tab>("ticket");
  const check = useServerFn(checkCustomerTicket);
  const [code, setCode] = useState(""); const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null); setErr(null);
    try { const r = await check({ data: { ticketCode: code, email } }); setMsg(`${r.ticketCode}: ${statusLabel[r.status] ?? r.status} — ${r.subject}`); }
    catch (x) { setErr(x instanceof Error && x.message.length < 120 ? x.message : "We couldn't find that ticket. Check the number and email."); }
    finally { setBusy(false); }
  }
  return <section id="track" aria-labelledby="track-title" className="border-b border-border bg-surface">
    <div className="mx-auto max-w-[1380px] px-5 py-12 sm:px-6 lg:px-12">
      <p className="eyebrow text-[10px] font-bold uppercase">No sign-in needed</p>
      <h2 id="track-title" className="mt-3 text-3xl font-black uppercase">Check your status</h2>
      <div role="tablist" className="mt-6 flex flex-wrap gap-2">
        {tabs.map(t => <Button key={t.key} role="tab" aria-selected={tab === t.key} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key)}><t.icon size={15} />{t.label}</Button>)}
      </div>
      <div className="mt-5 max-w-2xl rounded-md border border-border bg-background p-5">
        {tab === "ticket" && <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input aria-label="Ticket number" placeholder="TKT-261116-00001" value={code} onChange={e => setCode(e.target.value)} required />
          <Input aria-label="Email used" type="email" placeholder="Email used for the ticket" value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" disabled={busy}><Search size={15} />{busy ? "Checking…" : "Check"}</Button>
          {msg && <p role="status" className="text-sm font-semibold text-primary sm:col-span-3">{msg}</p>}
          {err && <p role="alert" className="text-sm text-destructive sm:col-span-3">{err}</p>}
        </form>}
        {tab === "scholarship" && <div className="text-sm text-muted-foreground"><p>Use your acknowledgement number (or Registration ID), date of birth and state to reopen your form and see its status.</p><Button asChild className="mt-4"><Link to="/education-support" hash="registration-form">Open my scholarship form</Link></Button></div>}
        {tab === "job" && <div className="text-sm text-muted-foreground"><p>Check by Application ID and mobile number on the careers page, or sign in to the candidate portal for interviews and offers.</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild><Link to="/careers">Check on careers page</Link></Button><Button asChild variant="outline"><Link to="/candidate-portal">Candidate portal</Link></Button></div></div>}
      </div>
    </div>
  </section>;
}
