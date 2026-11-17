import { useQuery } from '@tanstack/react-query';
import { Medal, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { podium } from '@/lib/crm/leaderboard';

const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const medal = ['var(--dash-warning)', 'var(--muted-foreground)', 'var(--primary)'];

/** Monthly sales leaderboard: top three on a podium, then the rest. Ranked by verified collection, then won deals. */
export function SalesLeaderboard({ me }: { me: string }) {
  const month = new Date().toISOString().slice(0, 7);
  const q = useQuery({ queryKey: ['crm-leaderboard', month], queryFn: async () => { const { data, error } = await supabase.rpc('crm_leaderboard', { _month: `${month}-01` }); if (error) throw error; return data; } });
  const rows = (q.data ?? []).map(r => ({ ...r, verified: Number(r.verified) }));
  const { top, rest } = podium(rows);
  return <section className="dash-card p-4 sm:p-5">
    <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="flex items-center gap-2 text-base font-semibold"><Trophy className="size-4 text-primary" />Sales leaderboard</h3><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date())} · verified collection, then won deals</p></div>
    {q.isPending ? <p className="py-6 text-sm text-muted-foreground">Loading…</p> : q.error ? <p className="py-6 text-sm text-destructive">{q.error.message}</p> : !top.length ? <p className="py-6 text-center text-sm text-muted-foreground">No sales team members yet.</p> : <>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">{top.map(r => <li key={r.user_id} className={`relative rounded-xl border p-4 text-center ${r.user_id === me ? 'border-primary' : 'border-border'} ${r.rank === 1 ? 'sm:order-2 sm:-mt-2' : r.rank === 2 ? 'sm:order-1 sm:mt-3' : 'sm:order-3 sm:mt-5'}`}>
        <Medal className="mx-auto size-8" style={{ color: medal[r.rank - 1] ?? 'var(--muted-foreground)' }} aria-hidden="true" />
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{r.rank === 1 ? 'Gold · #1' : r.rank === 2 ? 'Silver · #2' : 'Bronze · #3'}</p>
        <p className="mt-1 truncate font-semibold">{r.full_name}{r.user_id === me && ' (you)'}</p><p className="text-xs text-muted-foreground">{r.role}</p>
        <p className="mt-2 text-lg font-bold tabular-nums">{money(r.verified)}</p><p className="text-xs text-muted-foreground tabular-nums">{r.won_deals} won deal{r.won_deals === 1 ? '' : 's'}</p></li>)}</ol>
      {rest.length > 0 && <ol className="mt-4 divide-y divide-border text-sm">{rest.map(r => <li key={r.user_id} className={`flex items-center justify-between gap-3 py-2 ${r.user_id === me ? 'font-semibold' : ''}`}><span className="flex items-center gap-3"><span className="w-6 text-right tabular-nums text-muted-foreground">#{r.rank}</span>{r.full_name}<span className="text-xs text-muted-foreground">{r.role}</span></span><span className="tabular-nums">{money(r.verified)} · {r.won_deals}</span></li>)}</ol>}
    </>}
  </section>;
}
