import { useRef, type ReactNode, type RefObject } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { tableCellsToRows, toCsv } from '@/lib/share/whatsapp';
import { statusLabels, statusTone, type RequestStatus } from '@/lib/requests';

export const inputCls = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
export const areaCls = 'min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string | undefined }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}{hint && <span className="text-xs text-muted-foreground">{hint}</span>}</label>;
}

const tones = { warning: 'var(--dash-warning)', success: 'var(--dash-success)', danger: 'var(--dash-danger)', muted: 'var(--muted-foreground)', info: 'var(--primary)' } as const;
export function Pill({ tone = 'muted', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  const c = tones[tone];
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: c, background: `color-mix(in oklab, ${c} 12%, transparent)` }}>{children}</span>;
}
export const StatusPill = ({ status }: { status: string }) => <Pill tone={statusTone[status as RequestStatus] ?? 'muted'}>{statusLabels[status as RequestStatus] ?? status}</Pill>;

export function Panel({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode | undefined; children: ReactNode; className?: string }) {
  return <section className={`dash-card p-4 sm:p-5 ${className}`}>
    {(title || actions) && <div className="mb-4 flex flex-wrap items-center justify-between gap-2">{title && <h2 className="text-base font-semibold">{title}</h2>}{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>}
    {children}
  </section>;
}

export const Loading = () => <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading…</p>;
export const Empty = ({ children }: { children: ReactNode }) => <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
export const ErrorNote = ({ error }: { error: unknown }) => error ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{errMsg(error)}</p> : null;
export function errMsg(e: unknown): string {
  if (!e) return '';
  if (typeof e === 'object' && e && 'message' in e) return String((e as { message: unknown }).message);
  return String(e);
}
/** Downloads the table inside `target` as an Excel-friendly CSV (button columns skipped, formulas neutralised). */
export function downloadTableCsv(table: HTMLTableElement | null | undefined, name = 'riloyd-table') {
  if (!table) return;
  const head = Array.from(table.querySelectorAll('thead th')).map(th => (th as HTMLElement).innerText);
  const body = Array.from(table.querySelectorAll('tbody tr')).map(tr => Array.from(tr.children).map(td => (td as HTMLElement).innerText));
  const rows = tableCellsToRows(head, body); if (!rows.length) return;
  const blob = new Blob(['\ufeff' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${name.replace(/[^\w-]+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function TableCsvButton({ target, name }: { target: RefObject<HTMLElement | null>; name?: string | undefined }) {
  return <button type="button" onClick={() => downloadTableCsv(target.current?.querySelector('table'), name)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground" title="Download this table for Excel"><Download className="size-3.5" />Excel (CSV)</button>;
}
export function Table({ head, children, exportName }: { head: string[]; children: ReactNode; exportName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return <div ref={ref}><div className="-mt-1 mb-1 flex justify-end print:hidden"><TableCsvButton target={ref} name={exportName ?? (head.find(Boolean) || 'table')} /></div><div className="-mx-4 overflow-x-auto sm:mx-0"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b border-border text-left text-[11px] uppercase text-muted-foreground">{head.map(h => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-border">{children}</tbody></table></div></div>;
}
export const Td = ({ children, className = '' }: { children?: ReactNode; className?: string }) => <td className={`px-3 py-2.5 align-top ${className}`}>{children}</td>;
