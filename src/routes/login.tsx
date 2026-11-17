import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AuthForm } from '@/components/auth-form';
import { Button } from '@/components/ui/button';
import { DashboardGate, dashboardIcons } from '@/components/dashboard/shell';
import { useMyDashboards } from '@/hooks/use-my-dashboards';
import { dashboards, routeAfterLogin } from '@/lib/dashboards';

export const Route = createFileRoute('/login')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'Employee login | RILOYD workspace' },
    { name: 'description', content: 'One sign-in for RILOYD employees, admins and volunteers — your email opens the dashboard you have access to.' },
    { property: 'og:title', content: 'Employee login | RILOYD workspace' },
    { property: 'og:description', content: 'Sign in with your email and RILOYD opens your own dashboard automatically.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: LoginPage,
});

function LoginPage() {
  const { uid, email, dashboards: mine, loading, error, refetch } = useMyDashboards();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const next = mine ? routeAfterLogin(mine) : null;
  useEffect(() => { if (next?.kind === 'go') void navigate({ to: next.to, replace: true }); }, [next?.kind, next?.kind === 'go' ? next.to : '', navigate]);
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); };
  const signedInAs = <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">Signed in as <strong className="text-foreground">{email}</strong><Button variant="ghost" size="sm" onClick={() => void signOut()}><LogOut className="size-3.5" />Sign out</Button></p>;

  const title = !uid ? 'Sign in' : next?.kind === 'choose' ? 'Choose a dashboard' : next?.kind === 'none' ? 'No dashboard yet' : 'Opening your dashboard';
  const intro = !uid ? 'Use your work email. Your dashboard opens automatically — if you have more than one, you can choose.'
    : next?.kind === 'choose' ? 'Your account can open these dashboards. You can switch any time from the menu.' : undefined;

  return <DashboardGate workspace="Employee login" title={title} intro={intro}>
    {uid === undefined ? null
      : !uid ? <><AuthForm redirectPath="/login" /><p className="mt-4 text-center text-xs text-muted-foreground">Trouble signing in? <Link to="/help/$slug" params={{ slug: 'sign-in' }} className="font-semibold text-primary underline-offset-4 hover:underline">Read the sign-in help</Link> · <Link to="/help" className="font-semibold text-primary underline-offset-4 hover:underline">Help Centre</Link></p></>
      : error ? <div className="dash-card p-5"><p role="alert" className="text-sm">{error.message}</p><div className="mt-4 flex gap-2"><Button onClick={() => void refetch()}>Try again</Button><Button variant="outline" onClick={() => void signOut()}><LogOut className="size-4" />Sign out</Button></div></div>
      : loading || !next || next.kind === 'go' ? <p className="text-sm text-muted-foreground">Finding your dashboard…</p>
      : next.kind === 'none' ? <div className="dash-card p-5">
          <p className="text-sm">This account does not have access to any dashboard yet. Ask your admin to give you CRM, BDE/BDM or volunteer access — then sign in again.</p>
          <p className="mt-2 text-sm text-muted-foreground">A startup or business? <Link to="/client-portal" className="font-semibold text-primary underline-offset-4 hover:underline">Open the client portal</Link></p>
          <p className="mt-2 text-sm text-muted-foreground">Setting up the website for the first time as the owner? <Link to="/admin" className="font-semibold text-primary underline-offset-4 hover:underline">Open admin setup</Link></p>
          {signedInAs}
        </div>
      : <>
          <ul className="grid gap-3">{next.options.map(k => { const d = dashboards[k]; const Icon = dashboardIcons[k]; return <li key={k}>
            <Link to={d.path} className="dash-card group flex items-center gap-4 p-4 transition-colors hover:border-primary/50">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><Icon className="size-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{d.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{d.description}</span></span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link></li>; })}</ul>
          {signedInAs}
        </>}
  </DashboardGate>;
}
