import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ReferralLinks } from '@/components/referral-links';
import { KpiCard } from '@/components/dashboard/shell';
import { Button } from '@/components/ui/button';
import { getEducationStaffLeads, verifyEducationReferral } from '@/lib/education-staff.functions';
import { paymentStatusLabels } from '@/lib/education-support/rules';

export type StaffReferrals = Awaited<ReturnType<typeof getEducationStaffLeads>>;
type Lead = StaffReferrals['rows'][number];

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

/** BDE/BDM referred students and referral links — shown on /staff and inside the Employee CRM. */
export function StaffReferralsContent({ d, tab }: { d: StaffReferrals; tab: string }) {
  const done = d.rows.filter(r => r.form_status === 'completed').length;
  const verified = d.rows.filter(r => r.employee_verified_at).length;
  return <>
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
  </>;
}

/** Referrals inside the Employee CRM, so BDE/BDM don't need to switch dashboards. */
export function CrmReferralsPanel({ tab }: { tab: 'referrals' | 'links' }) {
  const getLeads = useServerFn(getEducationStaffLeads);
  const query = useQuery({ queryKey: ['staff-referrals'], queryFn: () => getLeads(), retry: false });
  if (query.isPending) return <p className="dash-card p-6 text-sm text-muted-foreground">Loading referrals…</p>;
  if (!query.data) return <p className="dash-card p-6 text-sm text-muted-foreground">Referral access is not switched on for your account yet. The admin turns it on from Admin → BDE &amp; BDM access (new BDE/BDM employees get it automatically).</p>;
  return <div className="space-y-4"><p className="text-sm text-muted-foreground">Your referral code: <b className="font-mono text-foreground">{query.data.code}</b></p><StaffReferralsContent d={query.data} tab={tab} /></div>;
}
