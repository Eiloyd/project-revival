import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { dateTime } from "@/lib/requests";
import { explainError, sourceLabels, type Source } from "@/lib/site-analytics/rules";
import { Empty, ErrorNote, inputCls, Loading, Panel, Pill, Table, Td } from "@/components/work/common";
import { KpiCard } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";

const ranges = { "1": "Today (24 h)", "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" } as const;
type Range = keyof typeof ranges;

function top<T>(rows: T[], key: (r: T) => string | null | undefined, n = 10) {
  const m = new Map<string, number>();
  for (const r of rows) { const k = key(r) || "—"; m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}
function Bars({ items, total, label = (k: string) => k }: { items: [string, number][]; total: number; label?: (k: string) => string }) {
  if (!items.length) return <Empty>No data yet.</Empty>;
  return <ul className="grid gap-2">{items.map(([k, v]) => <li key={k} className="grid gap-1 text-sm">
    <div className="flex justify-between gap-3"><span className="truncate">{label(k)}</span><span className="tabular-nums text-muted-foreground">{v} · {total ? Math.round((v / total) * 100) : 0}%</span></div>
    <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${total ? (v / total) * 100 : 0}%` }} /></div>
  </li>)}</ul>;
}

/** Admin → Website analytics: visits, sources, pages explored, devices, and browser errors explained in plain words. */
export function WebsiteAnalyticsAdmin() {
  const [range, setRange] = useState<Range>("7");
  const [showResolved, setShowResolved] = useState(false);
  const qc = useQueryClient();
  const since = useMemo(() => new Date(Date.now() - Number(range) * 86_400_000).toISOString(), [range]);
  const views = useQuery({ queryKey: ["site-views", range], queryFn: async () => {
    const { data, error } = await supabase.from("site_page_views").select("session_id,path,source,referrer_host,device,browser,os,country,load_ms,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(10000);
    if (error) throw error; return data ?? [];
  } });
  const errors = useQuery({ queryKey: ["site-errors", range], queryFn: async () => {
    const { data, error } = await supabase.from("site_errors").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(2000);
    if (error) throw error; return data ?? [];
  } });
  const v = views.data ?? [];
  const sessions = useMemo(() => {
    const m = new Map<string, typeof v>();
    for (const r of v) { const a = m.get(r.session_id) ?? []; a.push(r); m.set(r.session_id, a); }
    return m;
  }, [v]);
  const visits = sessions.size;
  const bounce = visits ? Math.round(([...sessions.values()].filter(s => s.length === 1).length / visits) * 100) : 0;
  const firstViews = [...sessions.values()].map(s => s[s.length - 1]!);
  const loads = v.map(r => r.load_ms).filter((n): n is number => typeof n === "number" && n > 0);
  const avgLoad = loads.length ? (loads.reduce((a, b) => a + b, 0) / loads.length / 1000).toFixed(1) : "—";
  const days = top(v, r => r.created_at.slice(0, 10), 90).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDay = Math.max(1, ...days.map(d => d[1]));

  const errGroups = useMemo(() => {
    const m = new Map<string, { key: string; kind: string; message: string; count: number; pages: Set<string>; last: string; ids: number[]; resolved: boolean }>();
    for (const e of errors.data ?? []) {
      if (!showResolved && e.resolved) continue;
      const key = `${e.kind}|${e.message.slice(0, 160)}`;
      const g = m.get(key) ?? { key, kind: e.kind, message: e.message, count: 0, pages: new Set<string>(), last: e.created_at, ids: [], resolved: e.resolved };
      g.count++; g.pages.add(e.path); g.ids.push(e.id); if (e.created_at > g.last) g.last = e.created_at; g.resolved = g.resolved && e.resolved;
      m.set(key, g);
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [errors.data, showResolved]);
  const openErrors = (errors.data ?? []).filter(e => !e.resolved).length;

  async function markFixed(ids: number[]) {
    const { error } = await supabase.from("site_errors").update({ resolved: true }).in("id", ids);
    if (!error) void qc.invalidateQueries({ queryKey: ["site-errors"] });
  }

  return <div className="grid gap-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Counted from the live website without cookies; no names, phone numbers or IP addresses are stored. Your own visits count too.</p>
      <select aria-label="Period" className={`${inputCls} w-auto`} value={range} onChange={e => setRange(e.target.value as Range)}>{(Object.keys(ranges) as Range[]).map(k => <option key={k} value={k}>{ranges[k]}</option>)}</select>
    </div>
    <ErrorNote error={views.error ?? errors.error} />
    {views.isPending ? <Loading /> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Visits" value={visits} note="One visit = one browser session" />
        <KpiCard label="Pages viewed" value={v.length} note={visits ? `${(v.length / visits).toFixed(1)} per visit` : undefined} />
        <KpiCard label="Left after 1 page" value={`${bounce}%`} tone={bounce > 70 ? "warning" : "default"} />
        <KpiCard label="Avg. load time" value={avgLoad === "—" ? "—" : `${avgLoad}s`} tone={Number(avgLoad) > 4 ? "warning" : "success"} />
        <KpiCard label="Open errors" value={openErrors} tone={openErrors ? "danger" : "success"} />
      </div>
      <Panel title="Visits per day">
        {!days.length ? <Empty>No visits yet. Visits are counted once the website is opened.</Empty> : <div className="flex h-40 items-end gap-1">{days.map(([d, n]) => <div key={d} className="flex flex-1 flex-col items-center gap-1" title={`${d}: ${n} page views`}>
          <div className="w-full rounded-t bg-primary" style={{ height: `${(n / maxDay) * 100}%`, minHeight: 2 }} /><span className="text-[10px] text-muted-foreground">{d.slice(8)}</span></div>)}</div>}
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Where visitors came from"><Bars items={top(firstViews, r => r.source)} total={visits} label={k => sourceLabels[k as Source] ?? k} /></Panel>
        <Panel title="Most explored pages"><Bars items={top(v, r => r.path, 12)} total={v.length} /></Panel>
        <Panel title="First page opened (landing)"><Bars items={top(firstViews, r => r.path, 8)} total={visits} /></Panel>
        <Panel title="Referring websites"><Bars items={top(firstViews.filter(r => r.referrer_host), r => r.referrer_host, 8)} total={visits} /></Panel>
        <Panel title="Devices"><Bars items={top(firstViews, r => r.device)} total={visits} /></Panel>
        <Panel title="Browser · system"><Bars items={top(firstViews, r => `${r.browser} · ${r.os}`, 8)} total={visits} /></Panel>
        <Panel title="Countries"><Bars items={top(firstViews, r => r.country, 8)} total={visits} /></Panel>
        <Panel title="Recent visitor journeys">
          {!visits ? <Empty>No visits yet.</Empty> : <ul className="grid gap-2 text-xs">{[...sessions.values()].slice(0, 12).map((s, i) => <li key={i} className="rounded-md border border-border p-2">
            <span className="text-muted-foreground">{dateTime(s[s.length - 1]!.created_at)} · {sourceLabels[s[s.length - 1]!.source as Source] ?? s[0]!.source} · {s[0]!.device}</span>
            <p className="mt-1 break-words">{[...s].reverse().map(r => r.path).join(" → ")}</p></li>)}</ul>}
        </Panel>
      </div>
    </>}
    <Panel title="Website errors — what, why and how to fix" actions={<label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />Show fixed</label>}>
      {errors.isPending ? <Loading /> : !errGroups.length ? <Empty>No errors in this period. 🎉</Empty> : <Table head={["Problem", "Why it happened", "What to do", "Times · pages", ""]} exportName="website-errors">{errGroups.map(g => { const h = explainError(g.kind, g.message); return <tr key={g.key}>
        <Td className="max-w-64"><div className="flex items-center gap-2"><Pill tone={h.severity === "high" ? "danger" : h.severity === "medium" ? "warning" : "muted"}>{h.severity}</Pill><span className="font-medium">{h.title}</span></div><p className="mt-1 break-words font-mono text-[11px] text-muted-foreground">{g.message}</p></Td>
        <Td className="max-w-56 text-xs">{h.why}</Td><Td className="max-w-56 text-xs">{h.fix}</Td>
        <Td className="text-xs"><b>{g.count}×</b> · last {dateTime(g.last)}<p className="text-muted-foreground">{[...g.pages].slice(0, 4).join(", ")}</p></Td>
        <Td>{!g.resolved && <Button size="sm" variant="outline" onClick={() => void markFixed(g.ids)}>Mark fixed</Button>}</Td>
      </tr>; })}</Table>}
    </Panel>
  </div>;
}
