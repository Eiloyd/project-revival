import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { TargetGauge } from '@/components/dashboard/target-gauge';
import { idCardsPdf, inr } from '@/components/hr/hrms';
import { todayIST } from '@/lib/requests';
import { Empty, ErrorNote, inputCls, Loading, Panel } from './common';

/** Employee self-service: download your own portrait ID card and see your own monthly target meters. */
export function MyCardAndTarget() {
  const [month, setMonth] = useState(todayIST().slice(0, 7)); const [busy, setBusy] = useState(false); const [err, setErr] = useState<unknown>(null);
  const card = useQuery({ queryKey: ['my-id-card'], queryFn: async () => { const { data, error } = await supabase.rpc('my_id_card'); if (error) throw error; return data?.[0] ?? null; } });
  const target = useQuery({ queryKey: ['my-target', month], queryFn: async () => { const { data, error } = await supabase.rpc('my_target_progress', { _month: `${month}-01` }); if (error) throw error; return data?.[0] ?? null; } });
  const c = card.data; const t = target.data;
  const download = async () => { if (!c) return; setBusy(true); setErr(null); try {
    await idCardsPdf([{ id: c.employee_id, employee_id: c.employee_id, full_name: c.full_name, photo_url: c.photo_url, designation: c.designation, department: c.department, status: 'active', card_status: 'active', card_reprints: 0, joining_date: c.joining_date, valid_until: c.valid_until }], c.card_color, c.card_footer);
  } catch (e) { setErr(e); } finally { setBusy(false); } };
  return <div className="grid gap-5">
    <Panel title="My ID card" actions={c ? <Button disabled={busy} onClick={() => void download()}><Download className="size-4" />{busy ? 'Preparing…' : 'Download my ID card'}</Button> : undefined}>
      {card.isPending ? <Loading /> : card.error ? <ErrorNote error={card.error} /> : !c ? <Empty>HR has not issued your ID card yet. It appears here as soon as HR adds you to the employee list.</Empty> :
        <div className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><BadgeCheck className="size-6" /></span>
          <dl className="grid flex-1 gap-2 text-sm sm:grid-cols-4">{([['Name', c.full_name], ['Employee ID', c.employee_id], ['Designation', c.designation || '—'], ['Valid until', c.valid_until ?? 'While employed']] as const).map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl></div>}
      <ErrorNote error={err} />
      <p className="mt-3 text-xs text-muted-foreground">Portrait card with RILOYD logo, your photo and a QR code that anyone can scan to verify you on the Team page.</p>
    </Panel>
    <Panel title="My target" actions={<input type="month" aria-label="Month" className={`${inputCls} w-40`} value={month} onChange={e => setMonth(e.target.value)} />}>
      {target.isPending ? <Loading /> : target.error ? <ErrorNote error={target.error} /> : !t?.has_target ? <Empty>No target set for this month. HR sets your first target; later changes are made by Admin.</Empty> :
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <TargetGauge title="Verified collection" achieved={Number(t.verified_collection)} target={Number(t.revenue_target)} format={n => inr(n)} caption="Only payments checked by Accounts" />
          <TargetGauge title="Won deals" achieved={t.won_deals} target={t.wins_target} caption={`Won value ${inr(Number(t.won_value))}`} />
          <TargetGauge title="Calls" achieved={t.calls} target={t.calls_target} caption="Logged call activities" />
        </div>}
    </Panel>
  </div>;
}
