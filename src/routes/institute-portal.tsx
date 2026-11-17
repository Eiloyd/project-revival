import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Link2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AuthForm } from '@/components/auth-form';
import { DashboardGate, DashboardShell } from '@/components/dashboard/shell';
import { useMyDashboards } from '@/hooks/use-my-dashboards';
import { BulkCandidateUpload, NinetyDayTracking } from '@/components/hr/institutes';
import { Button } from '@/components/ui/button';
import { Empty, ErrorNote, Loading, Panel, Pill } from '@/components/work/common';
import { referralUrl } from '@/lib/hr/hiring';

export const Route = createFileRoute('/institute-portal')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'Institute portal | RILOYD careers' }, { name: 'description', content: 'For partner colleges and placement consultancies: upload candidates in bulk and track their first 90 days at RILOYD.' },
    { property: 'og:title', content: 'Institute portal | RILOYD' }, { property: 'og:description', content: 'Partner portal for RILOYD campus and consultancy hiring.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: InstitutePortal,
});

const items = [{ key: 'tracking', label: 'My candidates & 90 days', icon: GraduationCap }, { key: 'upload', label: 'Bulk upload', icon: Upload }, { key: 'links', label: 'My referral links', icon: Link2 }];

function InstitutePortal() {
  const { uid, email, dashboards, loading } = useMyDashboards(); const qc = useQueryClient();
  const [section, setSection] = useState(() => (typeof window !== 'undefined' && window.location.hash.slice(1)) || 'tracking');
  const inst = useQuery({ queryKey: ['my-institute', uid], enabled: Boolean(uid && dashboards?.includes('institute')), queryFn: async () => { const { data, error } = await supabase.from('hr_institutes').select('name').maybeSingle(); if (error) throw error; return data; } });
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); };
  if (uid && dashboards?.includes('institute')) {
    const select = (k: string) => { setSection(k); window.history.replaceState(null, '', `#${k}`); };
    return <DashboardShell workspace="Institute portal" groups={[{ items }]} active={section} onSelect={select} user={{ name: email, detail: inst.data?.name ?? 'Partner institute' }} onSignOut={() => void signOut()}>
      {section === 'links' ? <InstituteLinks /> : section === 'upload' ? <BulkCandidateUpload partner /> : <NinetyDayTracking partner />}
    </DashboardShell>;
  }
  return <DashboardGate workspace="Institute portal" title={uid ? 'No institute access yet' : 'Partner institute sign in'} intro="For colleges and placement consultancies that send candidates to RILOYD.">
    {uid === undefined || loading ? <p className="text-sm text-muted-foreground">Checking access…</p> : !uid ? <AuthForm redirectPath="/institute-portal" />
      : <div className="dash-card p-5 text-sm">This account is not linked to an institute yet. Share the email you signed up with ({email}) with RILOYD HR; they give access from HR → Institutes & 90-day tracking.</div>}
  </DashboardGate>;
}

/** Referral links HR created for this institute: share them so applications are attributed automatically. */
function InstituteLinks() {
  const q = useQuery({ queryKey: ['institute-links'], queryFn: async () => { const { data, error } = await supabase.from('hr_referral_links').select('id,code,job_id,active,expires_at,clicks').order('created_at', { ascending: false }); if (error) throw error; return data; } });
  const jobs = useQuery({ queryKey: ['institute-jobs'], queryFn: async () => { const { data } = await supabase.rpc('careers_open_jobs'); return (data ?? []) as { id: string; job_code: string; title: string }[]; } });
  const [copied, setCopied] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  return <Panel title="My referral links">
    <p className="mb-3 text-sm text-muted-foreground">Share these links with your students or candidates. Applications through them are linked to your institute automatically and appear in your candidate list.</p>
    {q.isPending ? <Loading /> : q.error ? <ErrorNote error={q.error} /> : !q.data?.length ? <Empty>No referral links yet. Ask RILOYD HR to create one for your institute.</Empty> :
      <ul className="grid gap-2 text-sm">{q.data.map(l => { const j = jobs.data?.find(x => x.id === l.job_id); const url = referralUrl(window.location.origin, j?.job_code ?? null, l.code); const live = l.active && (!l.expires_at || l.expires_at >= today) && (!l.job_id || !!j);
        return <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"><span><b className="font-mono">{l.code}</b> · {j ? `${j.job_code} ${j.title}` : l.job_id ? 'Job closed' : 'All jobs'} · {l.clicks} visits {live ? <Pill tone="success">Active</Pill> : <Pill>Inactive</Pill>}</span>
          {live && <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(url).then(() => setCopied(l.id))}>{copied === l.id ? 'Copied' : 'Copy link'}</Button>}</li>; })}</ul>}
  </Panel>;
}
