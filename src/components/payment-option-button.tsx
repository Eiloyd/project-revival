import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { paymentOptionsQuery } from "@/lib/payment-options-query";
import { isZohoCheckoutUrl, parsePaymentEmbed, zohoPrefillUrl, type PaymentOptionKey, type ZohoPrefill } from "@/lib/payment-options";

type Prefill = ZohoPrefill;

/**
 * Shows the admin-configured payment page for one fee. With `embed`, a Zoho Checkout page opens inside
 * the page (pre-filled with `prefill`); other links open in a new tab.
 * `fallbackLink` keeps payment possible when saved options cannot be loaded or have no link yet.
 */
export function PaymentOptionButton({ optionKey, label, fallbackLink, className, embed, prefill }: { optionKey: PaymentOptionKey; label: string; fallbackLink?: string; className?: string; embed?: boolean; prefill?: Prefill }) {
  const query = useQuery(paymentOptionsQuery);
  const option = query.data?.find(o => o.key === optionKey);
  const saved = query.isSuccess ? option?.payment_link ?? fallbackLink ?? null : query.isError ? fallbackLink ?? null : null;
  if (query.isPending) return <p className="text-xs opacity-70">Loading payment options…</p>;
  const embedCode = parsePaymentEmbed(option?.embed_code);
  if (embedCode) return <EmbeddedPayment embed={embedCode} label={label} />;
  if (!saved) return null;
  const zoho = isZohoCheckoutUrl(saved);
  const link = zoho && prefill ? zohoPrefillUrl(saved, prefill) : saved;
  const button = <a href={link} target="_blank" rel="noopener noreferrer" className={className ?? "inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90"}>{label}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>;
  if (!(embed && zoho)) return <div className="flex flex-wrap items-center gap-3">{button}</div>;
  return <div className="space-y-3">
    <iframe title={label} src={link} allow="payment" loading="lazy" className="h-[480px] w-full rounded-xl border-0 bg-background" />
    <p className="text-xs opacity-80">Payment page not showing? <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Open it in a new tab</a>.</p>
  </div>;
}

/** Admin-pasted embed code. Script codes run in a sandboxed frame without access to this website or its visitors' sessions. */
function EmbeddedPayment({ embed, label }: { embed: NonNullable<ReturnType<typeof parsePaymentEmbed>>; label: string }) {
  if (embed.kind === "iframe") return <div className="space-y-3">
    <iframe title={label} src={embed.src} allow="payment" loading="lazy" className="h-[480px] w-full rounded-xl border-0 bg-background" />
    <p className="text-xs opacity-80">Payment page not showing? <a href={embed.src} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Open it in a new tab</a>.</p>
  </div>;
  const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>body{margin:0;padding:12px;font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:flex-start}</style></head><body>${embed.html}</body></html>`;
  return <iframe title={label} srcDoc={doc} allow="payment" sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" loading="lazy" className="h-[480px] w-full rounded-xl border-0 bg-background" />;
}
