import { useEffect, useState } from 'react';
import { gaugeReading } from '@/lib/target-gauge';

const CX = 100, CY = 100, R = 78;
const point = (p: number, r = R) => { const a = Math.PI * (1 - p / 100); return [CX + r * Math.cos(a), CY - r * Math.sin(a)] as const; };
const arc = (from: number, to: number) => { const [x1, y1] = point(from); const [x2, y2] = point(to); return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`; };
const zoneVar = { red: 'var(--dash-danger)', yellow: 'var(--dash-warning)', green: 'var(--dash-success)' } as const;

/** Analog speedometer for one target. The needle eases to its value and stops at 100%. */
export function TargetGauge({ title, achieved, target, format = n => String(n), caption, onClick, compact = false }: {
  title: string; achieved: number; target: number; format?: (n: number) => string; caption?: string | undefined; onClick?: (() => void) | undefined; compact?: boolean;
}) {
  const r = gaugeReading(achieved, target);
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(r.needle)); return () => cancelAnimationFrame(t); }, [r.needle]);
  const Tag = onClick ? 'button' : 'div';
  return <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={`dash-card group flex w-full flex-col items-center text-center ${compact ? 'p-3' : 'p-4 sm:p-5'} ${onClick ? 'transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary' : ''}`}>
    <p className="w-full truncate text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
    <svg viewBox="0 0 200 118" className={`mt-1 w-full ${compact ? 'max-w-[170px]' : 'max-w-[230px]'}`} role="img" aria-label={r.set ? `${title}: ${r.percent}% of target` : `${title}: target not set`}>
      <path d={arc(0, 100)} fill="none" stroke="var(--border)" strokeWidth="16" />
      {r.set && <>
        <path d={arc(0.6, 24.4)} fill="none" stroke={zoneVar.red} strokeWidth="14" opacity={r.zone === 'red' ? 1 : 0.35} />
        <path d={arc(25.6, 74.4)} fill="none" stroke={zoneVar.yellow} strokeWidth="14" opacity={r.zone === 'yellow' ? 1 : 0.35} />
        <path d={arc(75.6, 99.4)} fill="none" stroke={zoneVar.green} strokeWidth="14" opacity={r.zone === 'green' ? 1 : 0.35} />
      </>}
      {Array.from({ length: 11 }, (_, i) => { const [x1, y1] = point(i * 10, R - 12); const [x2, y2] = point(i * 10, R - (i % 5 === 0 ? 20 : 16)); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--muted-foreground)" strokeWidth={i % 5 === 0 ? 1.6 : 1} opacity="0.7" />; })}
      <text x={point(0, R - 30)[0] + 4} y="112" fontSize="8" fill="var(--muted-foreground)">0</text>
      <text x={point(100, R - 30)[0] - 14} y="112" fontSize="8" fill="var(--muted-foreground)">100</text>
      <g style={{ transform: `rotate(${-90 + shown * 1.8}deg)`, transformOrigin: `${CX}px ${CY}px`, transition: 'transform 1.1s cubic-bezier(.34,1.3,.5,1)' }} opacity={r.set ? 1 : 0.35}>
        <path d={`M ${CX - 3.5} ${CY} L ${CX} ${CY - R + 14} L ${CX + 3.5} ${CY} Z`} fill="var(--foreground)" />
      </g>
      <circle cx={CX} cy={CY} r="8" fill="var(--foreground)" /><circle cx={CX} cy={CY} r="3" fill="var(--card)" />
    </svg>
    {r.set ? <>
      <p className={`${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} -mt-1 font-bold tabular-nums`} style={{ color: zoneVar[r.zone] }}>{r.percent}%{r.percent > 100 && <span className="ml-1 text-xs font-semibold">achieved</span>}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{format(achieved)} <span className="font-normal text-muted-foreground">/ {format(target)}</span></p>
      {!compact && <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">Remaining: {format(r.remaining)}</p>}
      <span className="mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ color: zoneVar[r.zone], background: `color-mix(in oklab, ${zoneVar[r.zone]} 12%, transparent)` }}>{r.status}</span>
    </> : <>
      <p className="-mt-1 text-lg font-bold text-muted-foreground">—</p>
      <p className="mt-1 text-xs text-muted-foreground">{format(achieved)} achieved · target not set</p>
    </>}
    {caption && <p className="mt-2 text-[11px] text-muted-foreground">{caption}</p>}
  </Tag>;
}
