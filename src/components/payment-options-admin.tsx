import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { paymentOptionsQuery } from "@/lib/payment-options-query";
import { savePaymentOption } from "@/lib/payment-options.functions";
import { defaultFees, isZohoCheckoutUrl, normalizePaymentLink, paymentOptionKeys, type PaymentOption, type PaymentOptionKey } from "@/lib/payment-options";

const inputClass = "mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

function OptionRow({ option }: { option: PaymentOption }) {
  const key = option.key as PaymentOptionKey;
  const [link, setLinkRaw] = useState(option.payment_link ?? "");
  const [amount, setAmount] = useState(option.amount ? String(option.amount) : "");
  const [embedCode, setEmbedCode] = useState(option.embed_code ?? "");
  // Pasting the Zoho embed code into the link box keeps just its page address.
  const setLink = (v: string) => setLinkRaw(normalizePaymentLink(v) ?? v);
  const save = useServerFn(savePaymentOption);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => {
      const fee = amount.trim() === "" ? null : Number(amount);
      if (fee !== null && (!Number.isInteger(fee) || fee < 1 || fee > 1_000_000)) throw new Error("Enter the fee in whole rupees (1 – 10,00,000), or leave it empty for the default.");
      return save({ data: { key, paymentLink: link, amount: fee, embedCode } });
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: paymentOptionsQuery.queryKey }); toast.success(`${option.label}: change sent for a second admin's approval (Admin → Change approvals).`); },
    onError: e => toast.error(e.message),
  });
  return <form className="grid gap-3 border-t border-border py-4" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
    <div className="grid gap-3 md:grid-cols-[1fr_10rem_2.4fr] md:items-end">
      <p className="text-sm font-semibold">{option.label}</p>
      <label className="text-xs font-semibold">Fee (₹)<input className={inputClass} inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder={`Default ${defaultFees[key]}`} />
        <span className="mt-1 block font-normal text-muted-foreground">Empty = ₹{defaultFees[key]}</span></label>
      <label className="text-xs font-semibold">Payment page link or Zoho Checkout embed code<input className={inputClass} value={link} onChange={e => setLink(e.target.value)} placeholder='https://zohosecurepay.in/checkout/… or <iframe src="…">' />
        {isZohoCheckoutUrl(link) && <span className="mt-1 block font-normal text-muted-foreground">Zoho Checkout page: shown inside the scholarship form.</span>}</label>
    </div>
    <label className="text-xs font-semibold">Any payment embed code (optional — Razorpay, PayU, Instamojo, Cashfree, Zoho…)
      <textarea className="mt-1 min-h-20 w-full rounded-md border border-input bg-background p-2 font-mono text-xs" value={embedCode} onChange={e => setEmbedCode(e.target.value)} placeholder='<form><script src="https://checkout.razorpay.com/v1/payment-button.js" data-payment_button_id="pl_…" async></script></form>' />
      <span className="mt-1 block font-normal text-muted-foreground">When filled, this code is shown on the form instead of the link. It runs in a closed box, so it cannot read the website or visitors&apos; details.</span></label>
    <div><Button type="submit" variant="outline" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save"}</Button></div>
  </form>;
}

export function PaymentOptionsAdmin() {
  const query = useQuery(paymentOptionsQuery);
  const groups = new Map<string, PaymentOption[]>();
  for (const o of (query.data ?? []).filter(o => (paymentOptionKeys as readonly string[]).includes(o.key))) groups.set(o.programme, [...(groups.get(o.programme) ?? []), o]);
  return <section>
    <h2 className="text-xl font-bold">Fees &amp; payment</h2>
    <p className="mt-2 text-sm text-muted-foreground">Set each fee and paste its payment link or any payment embed code. Leave the fee empty to keep the default amount; leave link and code empty to hide the payment button. In Zoho, set each page&apos;s Thank You redirect to https://www.riloyd.in/payment-complete so the payment ID comes back to the form. Changes show on the website straight away.</p>
    {query.isPending && <p className="mt-4 text-sm">Loading…</p>}
    {query.error && <p className="mt-4 text-sm text-destructive">{query.error.message}</p>}
    {[...groups.entries()].map(([programme, options]) => <div key={programme} className="mt-6"><h3 className="font-bold">{programme}</h3>{options.map(o => <OptionRow key={`${o.key}:${o.payment_link}:${o.amount}:${o.embed_code}`} option={o} />)}</div>)}
  </section>;
}
