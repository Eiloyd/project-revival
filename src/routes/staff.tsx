import { ReferralLinks } from '@/components/referral-links';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { BriefcaseBusiness, GraduationCap, HeartHandshake, Link2, ShieldCheck, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardGate, DashboardShell, KpiCard } from '@/components/dashboard/shell';
import { toast } from 'sonner';
import { getEducationStaffLeads, verifyEducationReferral } from '@/lib/education-staff.functions';
import { paymentStatusLabels } from '@/lib/education-support/rules';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/staff')({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: 'BDE & BDM referrals | RILOYD' }, { name: 'description', content: 'Private RILOYD staff referral workspace.' }, { property: 'og:title', content: 'BDE & BDM referrals | RILOYD' }, { property: 'og:description', content: 'Private RILOYD staff referral workspace.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' }] }),
  component: StaffPage,
});

type Lead = Awaited<ReturnType<typeof getEducationStaffLeads>>['rows'][number];

function VerifyRow({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const verify = useServerFn(verifyEducationReferral);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => verify({ data: { ackNumber: lead.ack_number, note } }),
    onSuccess: async () => { setOpen(false); await qc.invalidateQueries({ queryKey: ['staff-referrals'] }); toast.success('Marked as verified by employee.'); },
    onError: e => toast.error(e.message),
  });
  if (lead.employee_verified_at) return <span className="text-xs font-semibold text-primary">Verified {new Date(lead.employee_verified_at).toLocaleDateString('en-IN')}</span>;
  if (lead.form_status !== 'completed') return <span className="text-xs text-muted-foreground">Form not finished</span>;
  if (!open) return <Button size="sm" variant="outline" onClick={() => setOpen(true)}><ShieldCheck />Verify</Button>;
  return <form className="flex min-w-56 flex-col gap-2" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
    <label className="text-xs font-semibold">What did you check?<input value={note} maxLength={300} onChange={e => setNote(e.target.value)} className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm font-normal" placeholder="e.g. Spoke to parent, school confirmed" /></label>
    <div className="flex gap-2"><Button size="sm" type="submit" disabled={mutation.isPending}>Mark verified</Button><Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
  </form>;
}

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
  const done = d.rows.filter(r => r.form_status === 'completed').length;
  const verified = d.rows.filter(r => r.employee_verified_at).length;
  return <DashboardShell workspace="BDE / BDM" groups={[{ title: 'Referrals', items: [{ key: 'referrals', label: 'Referred students', icon: GraduationCap, badge: d.rows.length }, { key: 'links', label: 'My referral links', icon: Link2 }] }]} active={tab} onSelect={setTab}
    user={{ name: d.designation, detail: `Code ${d.code}` }} onSignOut={() => void signOut()}>
    {tab === 'links' ? <div className="dash-card p-4 sm:p-6"><h2 className="text-base font-semibold">Your referral links</h2><ReferralLinks code={d.code} /><p className="mt-3 text-sm text-muted-foreground">Students who open this link get your details filled in as their coordinator. You can mark completed registrations as verified after checking them; payment confirmation and approval are done by the admin.</p></div>
      : <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3"><KpiCard label="Students referred" value={d.rows.length} icon={Users} /><KpiCard label="Forms completed" value={done} icon={GraduationCap} tone="success" /><KpiCard label="Verified by you" value={verified} note={done - verified > 0 ? `${done - verified} waiting for your check` : undefined} icon={ShieldCheck} tone="warning" /></div>
        <div className="dash-card overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-border bg-surface">{<tr>{['Acknowledgement', 'Student', 'Parents / DOB', 'Class / course', 'Place', 'Referral', 'Payment', 'Approval', 'Verify'].map(h => <th key={h} className="px-3 py-3 text-[10px] font-bold uppercase text-muted-foreground">{h}</th>)}</tr>}</thead>
          <tbody>{d.rows.map(r => <tr key={r.ack_number} className="border-t border-border align-top">
            <td className="p-3 font-mono text-xs">{r.ack_number}</td>
            <td className="p-3 font-medium">{r.student_name}</td>
            <td className="p-3 text-xs">{r.father_name || '—'} / {r.mother_name || '—'}<br />{r.date_of_birth}</td>
            <td className="p-3 text-xs">{r.current_class ? `Class ${r.current_class}` : r.course_name || '—'}<br />{r.institution_name || ''}</td>
            <td className="p-3 text-xs">{r.district}, {r.state}</td>
            <td className="p-3 text-xs">{r.coordinator_code}</td>
            <td className="p-3 text-xs">{paymentStatusLabels[r.payment_status as keyof typeof paymentStatusLabels] ?? r.payment_status}</td>
            <td className="p-3 text-xs">{r.approval_status}</td>
            <td className="p-3"><VerifyRow lead={r} /></td>
          </tr>)}</tbody></table>
          {!d.rows.length && <p className="p-5 text-sm text-muted-foreground">No referrals yet. Share your referral links to get started.</p>}</div>
      </div>}
  </DashboardShell>;
}
