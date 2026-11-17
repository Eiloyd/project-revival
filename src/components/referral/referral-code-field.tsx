import { useEffect, useId, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Lock } from "lucide-react";
import { getReferralCoordinator } from "@/lib/education-support.functions";
import { useReferralCode } from "@/hooks/use-referral-code";
import { cleanReferralCode } from "@/lib/referral";

export type ReferralDetails = { code: string; name: string; mobile: string; email: string; type: string };

/**
 * Shared "Referral / Coordinator code" box for every public form (submits as `coordinatorCode`).
 * A code from a referral link is filled in and locked; a typed code is looked up and the coordinator details are shown.
 */
export function ReferralCodeField({ inputClassName = "", labelClassName = "", label = "Referral / Coordinator code", onDetails }: { inputClassName?: string; labelClassName?: string; label?: string; onDetails?: (d: ReferralDetails | null) => void }) {
  const linkCode = useReferralCode();
  const lookup = useServerFn(getReferralCoordinator);
  const id = useId();
  const [code, setCode] = useState("");
  const [details, setDetails] = useState<ReferralDetails | null>(null);
  const [state, setState] = useState<"idle" | "checking" | "missing">("idle");
  const asked = useRef("");
  const locked = Boolean(linkCode) && code === linkCode;

  const find = async (raw: string) => {
    const clean = cleanReferralCode(raw);
    if (!clean || asked.current === clean) return;
    asked.current = clean; setState("checking");
    try {
      const r = await lookup({ data: { code: clean } });
      if (asked.current !== clean) return;
      setDetails(r); setState(r ? "idle" : "missing"); onDetails?.(r);
    } catch { if (asked.current === clean) { setDetails(null); setState("idle"); } }
  };

  useEffect(() => { if (linkCode) { setCode(linkCode); void find(linkCode); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [linkCode]);

  return <div className="grid gap-2 sm:col-span-2">
    <label htmlFor={id} className={labelClassName || "text-sm font-semibold"}>{label} <span className="font-normal text-muted-foreground">(optional)</span></label>
    <div className="flex gap-2">
      <input id={id} name="coordinatorCode" value={code} readOnly={locked} maxLength={40} autoComplete="off" spellCheck={false}
        placeholder="e.g. BDE-1024 or volunteer code"
        className={`${inputClassName} min-w-0 flex-1 uppercase ${locked ? "cursor-not-allowed opacity-80" : ""}`}
        onChange={e => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""); setCode(v); if (details || state === "missing") { setDetails(null); setState("idle"); asked.current = ""; onDetails?.(null); } }}
        onBlur={() => void find(code)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void find(code); } }} />
      {!locked && <button type="button" onClick={() => void find(code)} disabled={!cleanReferralCode(code) || state === "checking"}
        className="shrink-0 rounded-md border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50">{state === "checking" ? "Checking…" : "Apply"}</button>}
    </div>
    {details && <div className="grid gap-1 rounded-md border border-border bg-muted/50 p-3 text-sm" aria-live="polite">
      <p className="flex items-center gap-2 font-semibold"><BadgeCheck className="size-4 text-primary" />Coordinator: {details.name || details.code}</p>
      <dl className="grid gap-x-4 gap-y-0.5 text-xs text-muted-foreground sm:grid-cols-2">
        <div><dt className="inline">Code: </dt><dd className="inline font-medium text-foreground">{details.code}</dd></div>
        {details.type && <div><dt className="inline">Type: </dt><dd className="inline font-medium text-foreground">{details.type}</dd></div>}
        {details.mobile && <div><dt className="inline">Mobile: </dt><dd className="inline font-medium text-foreground">{details.mobile}</dd></div>}
        {details.email && <div><dt className="inline">Email: </dt><dd className="inline font-medium text-foreground break-all">{details.email}</dd></div>}
      </dl>
      {locked && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="size-3" />Filled from your referral link — it can't be changed.</p>}
    </div>}
    {state === "missing" && <p className="text-xs text-muted-foreground">We couldn't find this code. Check it, or leave it blank.</p>}
  </div>;
}
