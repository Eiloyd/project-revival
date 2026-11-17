import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { loadTicketMessages, rpc, type VTicket } from "@/lib/volunteers/data";
import { ticketCategories } from "@/lib/volunteers/rules";
import { fmtDate, StatusPill } from "./shared";

const catLabel = (k: string) => ticketCategories.find(c => c.key === k)?.label ?? k;

/** One support ticket with its conversation. `viewer` decides which actions appear; the database checks them again. */
export function TicketThread({ ticket, viewer, demo, who }: { ticket: VTicket; viewer: "volunteer" | "employee" | "admin"; demo: boolean; who?: string }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const messages = useQuery({ queryKey: ["volunteer-ticket", ticket.id], enabled: open && !demo, queryFn: () => loadTicketMessages(ticket.id) });
  const act = async (fn: () => Promise<unknown>, done: string) => {
    if (demo) { toast.info("Demo preview: nothing is saved."); return; }
    setBusy(true);
    try { await fn(); toast.success(done); setReply(""); await qc.invalidateQueries({ queryKey: ["volunteer-bundle"] }); await qc.invalidateQueries({ queryKey: ["volunteer-ticket", ticket.id] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save."); } finally { setBusy(false); }
  };
  const tone = ticket.status === "resolved" ? "good" : ticket.status === "answered" ? "muted" : "warn";
  return <li className="rounded-lg border border-border">
    <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left">
      <span className="min-w-0"><span className="block text-sm font-semibold text-foreground">{ticket.ticket_number} · {ticket.subject}</span><span className="text-xs text-muted-foreground">{catLabel(ticket.category)}{who ? ` · ${who}` : ""} · updated {fmtDate(ticket.updated_at)}{ticket.escalated ? " · escalated to admin" : ""}</span></span>
      <StatusPill tone={tone}>{ticket.status}</StatusPill>
    </button>
    {open && <div className="space-y-3 border-t border-border p-3">
      {demo ? <p className="text-xs text-muted-foreground">Demo preview: messages load from the live database.</p>
        : messages.isPending ? <p className="text-xs text-muted-foreground">Loading…</p>
        : messages.error ? <p role="alert" className="text-xs text-destructive">{messages.error.message}</p>
        : <ol className="space-y-2">{messages.data.map(m => <li key={m.id} className={`rounded-lg p-2.5 text-sm ${m.author_role === "volunteer" ? "bg-surface" : "bg-accent text-accent-foreground"}`}><p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{m.author_role === "volunteer" ? "Volunteer" : m.author_role === "admin" ? "RILOYD admin" : "Employee"} · {fmtDate(m.created_at)}</p><p className="mt-1 whitespace-pre-wrap">{m.body}</p></li>)}</ol>}
      <Textarea value={reply} onChange={e => setReply(e.target.value)} maxLength={3000} rows={3} placeholder="Write a reply" aria-label="Reply" />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy || !reply.trim()} onClick={() => act(() => rpc("volunteer_reply_ticket", { _ticket: ticket.id, _body: reply }), "Reply sent.")}>Send reply</Button>
        {viewer === "volunteer" && ticket.status === "resolved" && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => rpc("volunteer_set_ticket_status", { _ticket: ticket.id, _status: "reopened" }), "Ticket reopened.")}>Reopen</Button>}
        {viewer !== "volunteer" && ticket.status !== "resolved" && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => rpc("volunteer_set_ticket_status", { _ticket: ticket.id, _status: "resolved" }), "Marked resolved.")}>Mark resolved</Button>}
        {viewer === "employee" && !ticket.escalated && <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => rpc("volunteer_set_ticket_status", { _ticket: ticket.id, _status: "escalated" }), "Escalated to admin.")}>Escalate to admin</Button>}
      </div>
    </div>}
  </li>;
}
