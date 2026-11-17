import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { cleanReferralCode, referralForms, referralLink } from "@/lib/referral";

/** One copyable referral link per website form. With `editable`, the admin types any employee / coordinator code. */
export function ReferralLinks({ code: initialCode = "", editable = false }: { code?: string; editable?: boolean }) {
  const [origin, setOrigin] = useState("");
  const [code, setCode] = useState(initialCode);
  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => { setCode(initialCode); }, [initialCode]);
  const clean = cleanReferralCode(code);
  const copy = (text: string) => { void navigator.clipboard.writeText(text).then(() => toast.success("Referral link copied.")).catch(() => toast.error("Copy failed — select the link and copy it.")); };
  return <div className="min-w-0">
    {editable && <div className="grid max-w-sm gap-2"><Label htmlFor="referral-code">Employee / coordinator code</Label><Input id="referral-code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={40} placeholder="e.g. BDE-001" className="uppercase" />{code && !clean && <p role="alert" className="text-xs text-destructive">Use 2–40 letters, numbers or dashes.</p>}</div>}
    {clean ? <ul className="mt-4 divide-y divide-border rounded-md border border-border">
      {referralForms.map(f => { const link = referralLink(origin, f.path, clean); return <li key={f.key} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
        <span className="min-w-0"><span className="block font-semibold">{f.label}</span><code className="break-all text-xs text-muted-foreground">{link}</code></span>
        <span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => copy(link)}><Copy size={14} />Copy</Button><WhatsAppShareButton text={`${f.label} — RILOYD: ${link}`} /></span>
      </li>; })}
    </ul> : !editable ? null : <p className="mt-4 text-sm text-muted-foreground">Enter a code to create referral links for every form.</p>}
    {clean && <p className="mt-3 text-xs text-muted-foreground">Anyone who opens one of these links gets the code {clean} filled in on the form, and the lead goes to its employee in the CRM. The code is remembered while they move between pages in the same tab.</p>}
  </div>;
}

export function ReferralLinksAdmin() {
  return <section className="mt-8"><h2 className="text-xl font-extrabold">Referral links</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Create a link for any form with an employee or coordinator code. The code must belong to an active employee for the lead to be assigned automatically.</p><div className="mt-5"><ReferralLinks editable /></div></section>;
}
