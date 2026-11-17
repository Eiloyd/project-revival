import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AuthForm } from '@/components/auth-form';
import { Button } from '@/components/ui/button';
import { DashboardGate, DashboardShell, type ShellGroup } from '@/components/dashboard/shell';
import { useMyDashboards } from '@/hooks/use-my-dashboards';
import { dashboards, type DashboardKey } from '@/lib/dashboards';
import { isWorkKey, workItems, WorkView } from './work-sections';

/** Shared frame for HR, Support, Accounts & Finance, Lead Research and My Work: access comes from `my_dashboards()`. */
export function DepartmentPage({ dash, workspace, groups, first, render, intro }: { dash: DashboardKey; workspace: string; groups: ShellGroup[]; first: string; render: (section: string, uid: string) => ReactNode; intro: string }) {
  const { uid, email, dashboards: mine, loading } = useMyDashboards();
  const qc = useQueryClient();
  const [section, setSection] = useState(() => (typeof window !== 'undefined' && window.location.hash.slice(1)) || first);
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); };
  const select = (k: string) => { setSection(k); window.history.replaceState(null, '', `#${k}`); };
  if (uid && mine?.includes(dash)) {
    // Only staff accounts get the shared My work menu; jury members and other outside roles see their own sections only.
    const staff = !!mine?.includes('work');
    const all: ShellGroup[] = staff ? [...groups, { title: 'My work', items: workItems() }] : groups;
    return <DashboardShell workspace={workspace} groups={all} active={section} onSelect={select} user={{ name: email, detail: dashboards[dash].label }} onSignOut={() => void signOut()}>
      {isWorkKey(section) && staff ? <WorkView k={section} uid={uid} /> : render(isWorkKey(section) ? first : section, uid)}
    </DashboardShell>;
  }
  return <DashboardGate workspace={workspace} title={uid ? 'No access' : 'Sign in'} intro={intro}>
    {uid === undefined || loading ? <p className="text-sm text-muted-foreground">Checking access…</p>
      : !uid ? <AuthForm redirectPath={dashboards[dash].path} />
      : <div className="dash-card p-5"><p className="text-sm">This account does not have {dashboards[dash].label} access. The Admin gives department access from Admin → Departments & access.</p>
          <div className="mt-4 flex flex-wrap gap-2"><Button asChild><Link to="/login">Go to my dashboard</Link></Button><Button variant="outline" onClick={() => void signOut()}><LogOut className="size-4" />Sign out</Button></div></div>}
  </DashboardGate>;
}
