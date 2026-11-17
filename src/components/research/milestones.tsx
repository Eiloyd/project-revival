import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Empty, ErrorNote, inputCls, Loading, Panel, Pill } from '@/components/work/common';
import { milestoneProgress, RESEARCH_STEPS } from '@/lib/ops/rules';

type Ms = { id: string; request_id: string; step: string; position: number; due_date: string | null; done_at: string | null; note: string };
/** Long research projects: Survey → Verification → Analysis → Final dossier, with due dates and progress. */
export function ResearchMilestones() {
  const qc = useQueryClient(); const [error, setError] = useState<unknown>(null);
  const reqs = useQuery({ queryKey: ['research-req-ms'], queryFn: async () => { const { data, error } = await supabase.from('research_requests').select('id,code,title,department,due_date,status').order('created_at', { ascending: false }).limit(100); if (error) throw error; return data; } });
  const ms = useQuery({ queryKey: ['research-milestones'], queryFn: async () => { const { data, error } = await supabase.from('research_milestones').select('*').order('position'); if (error) throw error; return data as Ms[]; } });
  const refresh = () => qc.invalidateQueries({ queryKey: ['research-milestones'] });
  async function run(p: PromiseLike<{ error: unknown }>) { setError(null); const { error } = await p; if (error) setError(error); else await refresh(); }
  const today = new Date().toISOString().slice(0, 10);
  return <Panel title="Project milestones">
    <p className="mb-3 text-sm text-muted-foreground">Track multi-stage research projects step by step. Overdue steps show in red.</p><ErrorNote error={error} />
    {reqs.isPending || ms.isPending ? <Loading /> : !reqs.data?.length ? <Empty>No research requests yet.</Empty> : <div className="grid gap-4">{reqs.data.map(r => {
      const mine = (ms.data ?? []).filter(m => m.request_id === r.id); const pct = milestoneProgress(mine);
      return <div key={r.id} className="rounded-md border border-border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><b>{r.code}</b> · {r.title} <span className="text-xs text-muted-foreground">{r.department}</span></div>
          {mine.length ? <Pill tone={pct === 100 ? 'success' : 'info'}>{pct}% done</Pill> : <Button size="sm" variant="outline" onClick={() => void run(supabase.from('research_milestones').insert(RESEARCH_STEPS.map((step, i) => ({ request_id: r.id, step, position: i }))))}>Start milestone plan</Button>}</div>
        {mine.length > 0 && <><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
          <ol className="mt-3 grid gap-2 sm:grid-cols-4">{mine.map(m => { const late = !m.done_at && m.due_date && m.due_date < today; return <li key={m.id} className={`rounded-md border p-2 text-sm ${late ? 'border-destructive' : 'border-border'}`}>
            <div className="flex items-center justify-between gap-1 font-medium">{m.step}{m.done_at ? <Pill tone="success">Done</Pill> : late ? <Pill tone="danger">Late</Pill> : null}</div>
            <input type="date" aria-label={`${m.step} due date`} className={`${inputCls} mt-2`} value={m.due_date ?? ''} onChange={e => void run(supabase.from('research_milestones').update({ due_date: e.target.value || null }).eq('id', m.id))} />
            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => void run(supabase.from('research_milestones').update({ done_at: m.done_at ? null : new Date().toISOString() }).eq('id', m.id))}>{m.done_at ? 'Reopen' : 'Mark done'}</Button>
          </li>; })}</ol></>}
      </div>; })}</div>}
  </Panel>;
}
