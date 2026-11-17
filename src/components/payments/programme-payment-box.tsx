import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { paymentOptionsQuery } from "@/lib/payment-options-query";
import { CheckCircle2, CreditCard, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentOptionButton } from "@/components/payment-option-button";
import { useFees } from "@/hooks/use-fees";
import { PAYMENT_RETURN_KEY, readPaymentMessage, readStoredPaymentId } from "@/lib/payment-options";
import { expectedAmountPaise, programmePaymentInfo, programmePaymentSchema, type ProgrammePaymentKey } from "@/lib/programme-payments/rules";
import { submitProgrammePayment } from "@/lib/programme-payments/payments.functions";

type Payer = { name?: string; email?: string; phone?: string };

/**
 * Step 1: pay through the admin's embed code / payment link (Admin → Fees & payment).
 * Step 2: send the transaction ID so the team can match and verify the payment (Admin → Programme payments).
 */
export function ProgrammePaymentBox({ options, value, onChange, applicationCode, payer, id }: {
  options: { key: ProgrammePaymentKey; label: string }[];
  value?: ProgrammePaymentKey; onChange?: (key: ProgrammePaymentKey) => void;
  applicationCode?: string | undefined; payer?: Payer | undefined; id?: string | undefined;
}) {
  const [own, setOwn] = useState<ProgrammePaymentKey>(options[0]!.key);
  const key = value ?? own;
  const choose = (k: ProgrammePaymentKey) => { setOwn(k); onChange?.(k); };
  const fees = useFees();
  const total = expectedAmountPaise(key, fees(key)) / 100;
  const label = options.find(o => o.key === key)?.label ?? programmePaymentInfo[key].label;
  const [form, setForm] = useState({ name: payer?.name ?? "", email: payer?.email ?? "", phone: payer?.phone ?? "", reference: "" });
  const [state, setState] = useState<{ busy: boolean; error?: string; done?: string }>({ busy: false });
  const save = useServerFn(submitProgrammePayment);
  const optionsQuery = useQuery(paymentOptionsQuery);
  const configured = optionsQuery.data?.find(o => o.key === key);
  const notSetUp = optionsQuery.isSuccess && !configured?.payment_link && !configured?.embed_code?.trim();

  // Payment ID handed back by the payment return page (inside the frame or another tab) fills the box.
  useEffect(() => {
    const pick = (v: string | null) => { if (v) setForm(f => f.reference ? f : { ...f, reference: v }); };
    try { pick(readStoredPaymentId(localStorage.getItem(PAYMENT_RETURN_KEY))); } catch { /* storage blocked */ }
    const onMessage = (e: MessageEvent) => { if (e.origin === window.location.origin) pick(readPaymentMessage(e.data)); };
    const onStorage = (e: StorageEvent) => { if (e.key === PAYMENT_RETURN_KEY) pick(readStoredPaymentId(e.newValue)); };
    window.addEventListener("message", onMessage); window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("message", onMessage); window.removeEventListener("storage", onStorage); };
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const parsed = programmePaymentSchema.safeParse({ key, ...form, applicationCode: applicationCode || undefined });
    if (!parsed.success) { setState({ busy: false, error: parsed.error.issues[0]?.message ?? "Please check the details." }); return; }
    setState({ busy: true });
    try {
      await save({ data: parsed.data });
      try { localStorage.removeItem(PAYMENT_RETURN_KEY); } catch { /* ignore */ }
      setState({ busy: false, done: parsed.data.reference });
    } catch (err) { setState({ busy: false, error: err instanceof Error ? err.message : "Please try again." }); }
  }

  return <div id={id} className="scroll-mt-24 rounded-xl border border-border bg-background p-4 sm:p-5">
    {options.length > 1 && <div role="radiogroup" aria-label="What are you paying for?" className="mb-4 flex flex-wrap gap-2">{options.map(o =>
      <button key={o.key} type="button" role="radio" aria-checked={o.key === key} disabled={!!state.done} onClick={() => choose(o.key)}
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${o.key === key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/60"}`}>{o.label}</button>)}</div>}
    <p className="flex items-center gap-2 text-sm font-bold"><CreditCard className="size-4 text-primary" aria-hidden="true" />Step 1 · Pay {label}: ₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{programmePaymentInfo[key].gstPercent ? ` (incl. ${programmePaymentInfo[key].gstPercent}% GST)` : ""}</p>
    {notSetUp ? <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground">Online payment for this fee is being set up. Email <a className="font-semibold underline" href="mailto:info@riloyd.in">info@riloyd.in</a> for payment details, then send your transaction ID below.</p> : null}
    <div className="mt-3"><PaymentOptionButton key={key} optionKey={key} label={`Pay ${label}`} embed prefill={{ name: form.name, email: form.email, mobile: form.phone }} /></div>
    <div className="mt-5 border-t border-border pt-4">
      <p className="flex items-center gap-2 text-sm font-bold"><ReceiptText className="size-4 text-primary" aria-hidden="true" />Step 2 · Send your transaction ID</p>
      {state.done ? <div role="status" className="mt-3 flex gap-3 rounded-lg bg-primary/10 p-4 text-sm">
        <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div><p className="font-semibold">Transaction ID <span className="select-all font-mono">{state.done}</span> received.</p><p className="mt-1 text-muted-foreground">Our team will match it with the payment and confirm by email. Keep your payment receipt.</p></div>
      </div> : <form onSubmit={e => void send(e)} className="mt-3 grid gap-3 sm:grid-cols-2">
        {!payer?.name && <div className="space-y-1"><Label htmlFor={`${key}-pay-name`}>Payer name</Label><Input id={`${key}-pay-name`} value={form.name} maxLength={100} autoComplete="name" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>}
        {!payer?.email && <div className="space-y-1"><Label htmlFor={`${key}-pay-email`}>Email</Label><Input id={`${key}-pay-email`} type="email" value={form.email} maxLength={254} autoComplete="email" onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>}
        {!payer?.phone && <div className="space-y-1"><Label htmlFor={`${key}-pay-phone`}>Mobile number</Label><Input id={`${key}-pay-phone`} type="tel" value={form.phone} maxLength={15} autoComplete="tel" onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required /></div>}
        <div className="space-y-1"><Label htmlFor={`${key}-pay-ref`}>Transaction / payment ID</Label><Input id={`${key}-pay-ref`} value={form.reference} maxLength={60} placeholder="pay_XXXXXXXXXXXX or UTR" onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} required /></div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3"><Button type="submit" disabled={state.busy || form.reference.trim().length < 6}>{state.busy ? "Sending…" : "Send transaction ID"}</Button>
          <span className="text-xs text-muted-foreground">Find it in the payment receipt email/SMS{applicationCode ? <> · Reference <b>{applicationCode}</b> is attached</> : null}.</span></div>
        {state.error && <p role="alert" className="sm:col-span-2 text-sm font-semibold text-destructive">{state.error}</p>}
      </form>}
    </div>
  </div>;
}
