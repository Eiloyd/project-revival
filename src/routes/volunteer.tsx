import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { VolunteerDashboard, volunteerSections } from "@/components/volunteers/volunteer-dashboard";
import { DashboardGate, DashboardShell } from "@/components/dashboard/shell";
import { rpc } from "@/lib/volunteers/data";

export const Route = createFileRoute("/volunteer")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Volunteer dashboard | RILOYD" },
    { name: "description", content: "RILOYD volunteers track referred students, commission, withdrawals and support tickets." },
    { property: "og:title", content: "Volunteer dashboard | RILOYD" },
    { property: "og:description", content: "Private RILOYD volunteer workspace for referrals, earnings and payouts." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: VolunteerPage,
});

function VolunteerPage() {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState(false);
  const [claim, setClaim] = useState<{ state: "idle" | "checking" | "ok" | "error"; message?: string }>({ state: "idle" });
  useEffect(() => {
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
      supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); }).catch(() => setReady(true));
      return () => sub.subscription.unsubscribe();
    } catch { setReady(true); return undefined; }
  }, []);
  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) { setClaim({ state: "idle" }); return; }
    let live = true; setClaim({ state: "checking" });
    rpc<string>("volunteer_claim_account").then(() => { if (live) setClaim({ state: "ok" }); }).catch((e: unknown) => { if (live) setClaim({ state: "error", message: e instanceof Error ? e.message : "Your volunteer account could not be opened." }); });
    return () => { live = false; };
  }, [uid]);
  const signOut = async () => { if (demo) { setDemo(false); return; } await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); };

  const [tab, setTab] = useState("overview");
  if (demo || (session && claim.state === "ok")) return <DashboardShell workspace="Volunteer" groups={[{ title: "My dashboard", items: volunteerSections.map(s => ({ key: s.key, label: s.label, icon: s.icon })) }]} active={tab} onSelect={setTab}
    user={{ name: demo ? "Demo volunteer" : session?.user.email ?? "", detail: "RILOYD volunteer" }} onSignOut={() => void signOut()} signOutLabel={demo ? "Exit demo" : "Sign out"}>
    <VolunteerDashboard demo={demo} onSignOut={() => void signOut()} tab={tab} onTab={setTab} />
  </DashboardShell>;
  return <DashboardGate workspace="Volunteer programme" title="Volunteer sign in" intro={!session ? <>First time here? Choose <strong>Create account</strong> and use the same email your RILOYD employee registered for you. Confirm the email, then sign in — your dashboard opens automatically.</> : undefined}>
    {!ready ? null
      : !session ? <AuthForm redirectPath="/volunteer" />
      : claim.state === "error" ? <div className="dash-card p-5"><p role="alert" className="text-sm">{claim.message}</p><p className="mt-2 text-sm text-muted-foreground">Signed in as {session.user.email}. Employees: your own dashboard opens from the employee login.</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild><Link to="/login">Go to my dashboard</Link></Button><Button variant="outline" onClick={() => void signOut()}>Sign out</Button></div></div>
      : <p className="text-sm text-muted-foreground">Opening your volunteer account…</p>}
  </DashboardGate>;
}
