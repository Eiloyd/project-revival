import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Headset, LifeBuoy, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { customerTicketSchema, ticketCategories, ticketLookupSchema } from "@/lib/submission-schemas";
import { checkCustomerTicket, rateCustomerTicket, submitCustomerTicket } from "@/lib/enquiries.functions";

const field = "min-h-12 w-full rounded-md border border-border bg-surface px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";
const statusText: Record<string, string> = { open: "Received — waiting for our support team", in_progress: "In progress — our team is working on it", waiting_customer: "Waiting for your reply — please check your email or phone", resolved: "Resolved", closed: "Closed" };

/** Contact page: clients and customers raise a support ticket (goes to the Support Desk) or check its status. */
export function SupportTicketSection() {
  const submit = useServerFn(submitCustomerTicket); const check = useServerFn(checkCustomerTicket); const rate = useServerFn(rateCustomerTicket);
  const [lookupKey, setLookupKey] = useState<{ ticketCode: string; email: string } | null>(null); const [stars, setStars] = useState(0); const [rateNote, setRateNote] = useState(""); const [rateMsg, setRateMsg] = useState("");
  const [tab, setTab] = useState<"new" | "status">("new");
  const [errors, setErrors] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(""); const [failure, setFailure] = useState("");
  const [status, setStatus] = useState<{ ticketCode: string; status: string; subject: string; updatedAt: string; rated: boolean } | null>(null);

  function issues(e: { issues: { path: PropertyKey[]; message: string }[] }) { const n: Record<string, string> = {}; for (const i of e.issues) { const k = String(i.path[0]); if (!n[k]) n[k] = i.message; } setErrors(n); }
  async function raise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const el = event.currentTarget; setFailure("");
    const parsed = customerTicketSchema.safeParse(Object.fromEntries(new FormData(el).entries()));
    if (!parsed.success) { issues(parsed.error); return; }
    setErrors({}); setBusy(true);
    try { const r = await submit({ data: parsed.data }); el.reset(); setCreated(r.ticketCode); } catch (e) { setFailure(e instanceof Error ? e.message : "Your ticket could not be created. Please try again."); } finally { setBusy(false); }
  }
  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFailure(""); setStatus(null);
    const parsed = ticketLookupSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget).entries()));
    if (!parsed.success) { issues(parsed.error); return; }
    setErrors({}); setBusy(true);
    try { setStatus(await check({ data: parsed.data })); setLookupKey(parsed.data); setStars(0); setRateNote(""); setRateMsg(""); } catch (e) { setFailure(e instanceof Error ? e.message : "Status could not be checked."); } finally { setBusy(false); }
  }
  async function sendRating() {
    if (!lookupKey || !stars) return; setBusy(true); setRateMsg("");
    try { await rate({ data: { ...lookupKey, rating: stars, comment: rateNote } }); setStatus(s => s ? { ...s, rated: true } : s); setRateMsg("Thank you for your feedback."); } catch (e) { setRateMsg(e instanceof Error ? e.message : "Rating could not be saved."); } finally { setBusy(false); }
  }
  const err = (k: string) => errors[k] ? <p className="mt-1 text-xs font-medium text-destructive">{errors[k]}</p> : null;
  const tabCls = (on: boolean) => `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary"}`;

  return <section id="support-ticket" className="scroll-mt-6 border-b border-border px-5 py-12 sm:px-6 lg:px-12">
    <div className="mx-auto grid max-w-[1380px] gap-10 lg:grid-cols-[.8fr_1.2fr]">
      <div>
        <p className="section-label">Customer support</p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-none sm:text-4xl">Raise a <span className="text-primary">support ticket.</span></h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-soft">Already working with RILOYD, or facing a problem with a payment, registration or service? Raise a ticket — it goes straight to our Support Desk and you get a ticket number to track it.</p>
        <ul className="mt-6 space-y-3 text-sm">{["Get a ticket number instantly", "Our Support team picks it up and keeps you updated", "Check the status anytime with your ticket number and email"].map(t => <li key={t} className="flex items-center gap-3"><LifeBuoy size={16} className="shrink-0 text-primary" aria-hidden="true" />{t}</li>)}</ul>
      </div>
      <div>
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Support ticket">
          <button type="button" role="tab" aria-selected={tab === "new"} className={tabCls(tab === "new")} onClick={() => { setTab("new"); setErrors({}); setFailure(""); }}><Headset size={14} />New ticket</button>
          <button type="button" role="tab" aria-selected={tab === "status"} className={tabCls(tab === "status")} onClick={() => { setTab("status"); setErrors({}); setFailure(""); }}><Search size={14} />Check status</button>
        </div>
        {tab === "new" ? created ? <div role="status" className="rounded-xl border border-primary bg-surface p-6"><h3 className="text-xl font-bold">Ticket created</h3><p className="mt-2 text-sm text-soft">Your ticket number is <b className="text-foreground">{created}</b>. Please keep it — you can check the status here with this number and your email.</p><Button variant="outline" className="mt-4 rounded-full" onClick={() => setCreated("")}>Raise another ticket</Button></div>
          : <form onSubmit={raise} noValidate className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold">Full name *<input name="name" className={`${field} mt-1`} maxLength={100} autoComplete="name" />{err("name")}</label>
            <label className="text-xs font-semibold">Email *<input name="email" type="email" className={`${field} mt-1`} maxLength={255} autoComplete="email" />{err("email")}</label>
            <label className="text-xs font-semibold">Phone *<input name="phone" type="tel" className={`${field} mt-1`} maxLength={20} autoComplete="tel" />{err("phone")}</label>
            <label className="text-xs font-semibold">Customer ID / acknowledgement no. (optional)<input name="reference" className={`${field} mt-1`} maxLength={60} /></label>
            <label className="text-xs font-semibold">Category *<select name="category" defaultValue="" className={`${field} mt-1`}><option value="" disabled>Choose…</option>{ticketCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>{err("category")}</label>
            <label className="text-xs font-semibold">Priority<select name="priority" defaultValue="normal" className={`${field} mt-1`}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
            <label className="text-xs font-semibold sm:col-span-2">Subject *<input name="subject" className={`${field} mt-1`} maxLength={150} />{err("subject")}</label>
            <label className="text-xs font-semibold sm:col-span-2">Describe the problem *<textarea name="description" className={`${field} mt-1 min-h-28 resize-y py-3`} maxLength={2000} />{err("description")}</label>
            {failure && <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2">{failure}</p>}
            <div className="sm:col-span-2"><Button type="submit" size="lg" disabled={busy} className="h-12 rounded-full px-8 font-bold">{busy ? "Sending…" : "Create ticket"} <ArrowRight /></Button></div>
          </form>
        : <form onSubmit={lookup} noValidate className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold">Ticket number *<input name="ticketCode" className={`${field} mt-1 uppercase`} placeholder="TKT-261116-00001" maxLength={20} />{err("ticketCode")}</label>
            <label className="text-xs font-semibold">Email used *<input name="email" type="email" className={`${field} mt-1`} maxLength={255} />{err("email")}</label>
            {failure && <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2">{failure}</p>}
            <div className="sm:col-span-2"><Button type="submit" size="lg" variant="outline" disabled={busy} className="h-12 rounded-full border-primary px-8 font-bold">{busy ? "Checking…" : "Check status"}</Button></div>
            {status && <div role="status" className="rounded-xl border border-border bg-surface p-5 sm:col-span-2"><p className="font-mono text-xs text-soft">{status.ticketCode}</p><p className="mt-1 font-bold">{status.subject}</p><p className="mt-2 text-sm"><b className="text-primary">{statusText[status.status] ?? status.status}</b></p><p className="mt-1 text-xs text-soft">Last update: {new Date(status.updatedAt).toLocaleString("en-IN")}</p>
              {["resolved", "closed"].includes(status.status) && (status.rated ? <p className="mt-3 text-sm text-soft">{rateMsg || "Thank you — you have rated this ticket."}</p> : <div className="mt-4 border-t border-border pt-4"><p className="text-sm font-semibold">How did we do?</p><div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setStars(n)}><Star size={26} className={n <= stars ? "fill-primary text-primary" : "text-soft"} /></button>)}</div><textarea value={rateNote} onChange={e => setRateNote(e.target.value)} maxLength={500} placeholder="Anything we could do better? (optional)" className={`${field} mt-3 min-h-20 resize-y py-3`} /><Button type="button" className="mt-3 rounded-full" disabled={!stars || busy} onClick={() => void sendRating()}>Submit rating</Button>{rateMsg && <p role="status" className="mt-2 text-sm">{rateMsg}</p>}</div>)}
            </div>}
          </form>}
      </div>
    </div>
  </section>;
}
