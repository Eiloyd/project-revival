import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/work/common";
import { decideProgrammePayment, listProgrammePayments } from "@/lib/programme-payments/payments.functions";
import { canDecide, programmePaymentInfo, programmePaymentKeys, programmePaymentStatusLabel, type ProgrammePaymentKey } from "@/lib/programme-payments/rules";

const filters = [["reference_submitted", "Waiting for check"], ["paid", "Verified"], ["failed", "Rejected"], ["all", "All"]] as const;
const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const what = (kind: string | null) => (programmePaymentKeys as readonly string[]).includes(kind ?? "") ? `${programmePaymentInfo[kind as ProgrammePaymentKey].programme} · ${programmePaymentInfo[kind as ProgrammePaymentKey].label}` : kind ?? "—";

/** Transaction IDs sent from the Young Innovators, Prototype Funding and Funding Programme forms. */
export function ProgrammePaymentsAdmin() {
  const [status, setStatus] = useState<(typeof filters)[number][0]>("reference_submitted");
  const list = useServerFn(listProgrammePayments);
  const decide = useServerFn(decideProgrammePayment);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["programme-payments", status], queryFn: () => list({ data: { status } }) });
  const mutation = useMutation({
    mutationFn: (v: { id: string; decision: "paid" | "failed" }) => decide({ data: v }),
    onSuccess: async (_r, v) => { toast.success(v.decision === "paid" ? "Payment marked as verified." : "Payment rejected."); await qc.invalidateQueries({ queryKey: ["programme-payments"] }); },
    onError: e => toast.error(e.message),
  });
  return <section>
    <h2 className="text-xl font-bold">Programme payments</h2>
    <p className="mt-2 text-sm text-muted-foreground">Transaction IDs sent after paying on the Young Innovators, Prototype Funding and Funding Programme forms. Match each ID with your payment gateway or bank statement, then verify or reject it. The payment code shown on each form is set in Fees &amp; payment.</p>
    <div className="mt-4 flex flex-wrap gap-2">{filters.map(([k, l]) => <Button key={k} size="sm" variant={status === k ? "default" : "outline"} onClick={() => setStatus(k)}>{l}</Button>)}</div>
    <div className="mt-4">
      {query.isPending && <p className="text-sm">Loading…</p>}
      {query.error && <p className="text-sm text-destructive">{query.error.message}</p>}
      {query.data?.setupMissing && <p className="rounded-md border border-border bg-muted p-4 text-sm">Payment records are not set up in the database yet. Run <code>database/update-2026-11-18-programme-payments.sql</code> in Supabase.</p>}
      {query.data && !query.data.setupMissing && (query.data.rows.length === 0 ? <p className="text-sm text-muted-foreground">Nothing here.</p> :
        <Table head={["Sent on", "For", "Payer", "Transaction ID", "Expected", "Status", ""]} exportName="programme-payments">
          {query.data.rows.map(r => <tr key={r.id} className="border-b border-border align-top">
            <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
            <td className="py-2 pr-3">{what(r.application_kind)}{r.provider_payment_id && <span className="block text-xs text-muted-foreground">Ref {r.provider_payment_id}</span>}</td>
            <td className="py-2 pr-3">{r.payer_name}<span className="block text-xs text-muted-foreground">{r.payer_email} · {r.payer_phone}</span></td>
            <td className="py-2 pr-3 font-mono text-xs select-all">{r.provider_reference}</td>
            <td className="py-2 pr-3 whitespace-nowrap">{inr(r.amount_paise)}</td>
            <td className="py-2 pr-3">{programmePaymentStatusLabel[r.status] ?? r.status}</td>
            <td className="py-2 whitespace-nowrap">{canDecide(r.status) && <span className="flex gap-2">
              <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: r.id, decision: "paid" })}>Verify</Button>
              <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => { if (window.confirm("Reject this transaction ID? The payer can send a corrected one.")) mutation.mutate({ id: r.id, decision: "failed" }); }}>Reject</Button>
            </span>}</td>
          </tr>)}
        </Table>)}
    </div>
  </section>;
}
