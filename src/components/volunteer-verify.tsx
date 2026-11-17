import { useEffect, useState } from "react";
import { BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initials } from "@/lib/people-config";

type Card = Database["public"]["Functions"]["verify_volunteer"]["Returns"][number];

export function VolunteerVerify({ initialId = "", prefillKey = 0 }: { initialId?: string; prefillKey?: number }) {
  const [volunteerId, setVolunteerId] = useState(initialId);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVolunteerId(initialId);
    setCode("");
    setCard(null);
    setError(null);
  }, [initialId, prefillKey]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCard(null);
    setError(null);
    const id = volunteerId.trim();
    const securityCode = code.trim();
    if (id.length < 2) { setError("Enter the Volunteer ID"); return; }
    if (securityCode.length < 6) { setError("Enter the Volunteer Code (at least 6 characters)"); return; }
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("verify_volunteer", {
        _volunteer_id: id,
        _code: securityCode,
      });
      if (rpcError) {
        setError(rpcError.message.includes("too_many_attempts")
          ? "Too many failed attempts. Please try again after 15 minutes."
          : "Verification is unavailable right now. Please try again.");
        return;
      }
      const row = data?.[0];
      if (!row) {
        setError("No match found. Both the Volunteer ID and Volunteer Code must be correct.");
        return;
      }
      setCard(row);
    } catch {
      setError("Verification is unavailable right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const active = card?.status === "active";

  return <section id="verify-volunteer" className="min-w-0 scroll-mt-24 rounded-xl border border-border bg-card p-5 text-card-foreground sm:p-7">
    <p className="eyebrow text-[10px] font-bold uppercase">Volunteer verification</p>
    <h2 className="mt-4 text-3xl font-black uppercase leading-[1.02] sm:text-4xl">Verify a Riloyd volunteer.</h2>
    <p className="mt-4 text-sm leading-relaxed">Ask the person for their Volunteer ID and Volunteer Code. Details are shown only when both match. Only ID-card information is displayed — never personal information.</p>
    <form onSubmit={onSubmit} className="mt-7 grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="vol-id">Volunteer ID</Label>
        <Input id="vol-id" value={volunteerId} onChange={e => setVolunteerId(e.target.value)} maxLength={64} autoComplete="off" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="vol-code">Volunteer Code</Label>
        <Input id="vol-code" type="password" value={code} onChange={e => setCode(e.target.value)} placeholder="Security code" maxLength={64} autoComplete="off" />
      </div>
      <Button type="submit" disabled={loading} className="w-fit rounded-full px-7 font-bold">
        <ShieldCheck size={16} /> {loading ? "Checking…" : "Verify Volunteer"}
      </Button>
    </form>
    <div className="mt-7 min-w-0" aria-live="polite">
      {error && <div className="flex items-start gap-3 border border-destructive/50 p-5 text-sm">
        <ShieldAlert className="shrink-0 text-destructive" size={20} />{error}
      </div>}
      {card && <article className="overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-xl">
        <div className="bg-primary px-5 py-3 text-xs font-black uppercase tracking-wider text-primary-foreground">Riloyd · Volunteer ID Card</div>
        <div className="flex items-start gap-4 p-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-surface text-xl font-black">{initials(card.full_name)}</span>
          <div className="min-w-0 break-words text-sm [overflow-wrap:anywhere]">
            <h3 className="text-lg font-black">{card.full_name}</h3>
            <p className="text-primary">RILOYD Volunteer Network</p>
            <dl className="mt-3 space-y-2">
              <div><dt className="text-xs text-muted-foreground">Volunteer ID</dt><dd className="font-bold">{card.volunteer_id}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Location</dt><dd>{card.location || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Member since</dt><dd>{card.member_since ? card.member_since.slice(0, 10) : "—"}</dd></div>
            </dl>
          </div>
        </div>
        <div className={`flex items-center gap-2 border-t border-border px-5 py-3 text-sm font-bold ${active ? "text-primary" : "text-destructive"}`}>
          {active ? <BadgeCheck size={18} /> : <ShieldAlert size={18} />}
          {active ? "Active" : "Not active"}
        </div>
      </article>}
      {!error && !card && <p className="text-sm">Verification result will appear here.</p>}
    </div>
  </section>;
}
