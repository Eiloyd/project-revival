import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { BriefcaseBusiness, ClipboardCheck, Link2, LogOut } from "lucide-react";
import { Approvals } from "@/components/work/requests";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { TeamWorkspace, teamSections } from "@/components/volunteers/team-workspace";
import { DashboardGate, DashboardShell } from "@/components/dashboard/shell";
import { isActiveEmployee } from "@/lib/volunteers/data";

export const Route = createFileRoute("/my-volunteers")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "My Volunteers | RILOYD employee workspace" },
    { name: "description", content: "RILOYD employees create volunteers and track their referrals, commission and withdrawals." },
    { property: "og:title", content: "My Volunteers | RILOYD employee workspace" },
    { property: "og:description", content: "Private RILOYD workspace for managing volunteers and their referrals." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: MyVolunteersPage,
});

function MyVolunteersPage() {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState(false);
  const [access, setAccess] = useState<"checking" | "yes" | "no" | string>("checking");
  useEffect(() => {
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
      supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); }).catch(() => setReady(true));
      return () => sub.subscription.unsubscribe();
    } catch { setReady(true); return undefined; }
  }, []);
  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) return; let live = true; setAccess("checking");
    isActiveEmployee(uid).then(ok => { if (live) setAccess(ok ? "yes" : "no"); }).catch((e: unknown) => { if (live) setAccess(e instanceof Error ? e.message : "Access could not be checked."); });
    return () => { live = false; };
  }, [uid]);
  const signOut = async () => { if (demo) { setDemo(false); return; } await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); };

  const [tab, setTab] = useState("overview");
  const ready2 = demo || (session && access === "yes");
  if (ready2) return <DashboardShell workspace="My Volunteers" groups={[{ title: "Volunteers", items: [...teamSections.map(s => ({ key: s.key, label: s.label, icon: s.icon })), { key: "v-requests", label: "Volunteer requests", icon: ClipboardCheck }] }]} active={tab} onSelect={setTab}
    user={{ name: demo ? "Demo employee" : session?.user.email ?? "", detail: demo ? "Demo preview" : "RILOYD employee" }} onSignOut={() => void signOut()} signOutLabel={demo ? "Exit demo" : "Sign out"}>
    {tab === "v-requests" ? (demo ? <p className="text-sm text-muted-foreground">Demo preview: requests load only for real accounts.</p> : <div className="grid gap-5"><Approvals uid={uid!} title="Waiting for me" /><Approvals uid={uid!} mode="team" title="All requests from my volunteers and team" /></div>)
      : <TeamWorkspace role="employee" demo={demo} uid={demo ? "demo" : uid!} tab={tab} onTab={setTab} />}
  </DashboardShell>;
  return <DashboardGate workspace="My Volunteers" title="Employee sign in" intro="Sign in with your RILOYD employee account (BDE, BDM, Sales or Support).">
    {!ready ? null
      : !session ? <AuthForm redirectPath="/my-volunteers" />
      : access === "checking" ? <p className="text-sm text-muted-foreground">Checking access…</p>
      : access === "no" ? <div className="dash-card p-5"><p className="text-sm">This account is not an active RILOYD employee. Ask the admin to give you BDE/BDM or CRM access.</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild><Link to="/login">Go to my dashboard</Link></Button><Button variant="outline" onClick={() => void signOut()}><LogOut size={14} />Sign out</Button></div></div>
      : <div className="dash-card p-5"><p role="alert" className="text-sm">{access}</p><Button className="mt-3" variant="outline" onClick={() => void signOut()}><LogOut size={14} />Sign out</Button></div>}
  </DashboardGate>;
}
