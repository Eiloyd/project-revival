import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { BriefcaseBusiness, GraduationCap, HeartHandshake, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardGate, DashboardShell } from '@/components/dashboard/shell';
import { getEducationStaffLeads } from '@/lib/education-staff.functions';
import { Button } from '@/components/ui/button';
import { StaffReferralsContent } from '@/components/staff/referrals-panel';

export const Route = createFileRoute('/staff')({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: 'BDE & BDM referrals | RILOYD' }, { name: 'description', content: 'Private RILOYD staff referral workspace.' }, { property: 'og:title', content: 'BDE & BDM referrals | RILOYD' }, { property: 'og:description', content: 'Private RILOYD staff referral workspace.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' }] }),
  component: StaffPage,
});

function StaffPage() {
  const getLeads = useServerFn(getEducationStaffLeads);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['staff-referrals'], queryFn: () => getLeads(), retry: false });
  const [tab, setTab] = useState('referrals');
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await query.refetch(); };
  if (!query.data) return <DashboardGate workspace="BDE / BDM referrals" title="Staff referrals" intro="Sign in with your verified staff account. Your administrator must assign active BDE or BDM access.">
    {query.isPending ? <p className="text-sm text-muted-foreground">Checking access…</p>
      : <div className="dash-card p-5"><p className="text-sm">We could not open your referrals with this browser session.</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild><Link to="/login">Sign in / my dashboard</Link></Button><Button variant="outline" onClick={() => void query.refetch()}>Check again</Button></div></div>}
  </DashboardGate>;
  const d = query.data;
  return <DashboardShell workspace="BDE / BDM" groups={[{ title: 'Referrals', items: [{ key: 'referrals', label: 'Referred students', icon: GraduationCap, badge: d.rows.length }, { key: 'links', label: 'My referral links', icon: Link2 }] }]} active={tab} onSelect={setTab}
    user={{ name: d.designation, detail: `Code ${d.code}` }} onSignOut={() => void signOut()}>
    <StaffReferralsContent d={d} tab={tab} />
  </DashboardShell>;
}
