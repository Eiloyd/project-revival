import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboards, type DashboardKey } from '@/lib/dashboards';
import { dashboardGuides } from '@/lib/help/content';
import type { ShellGroup } from './shell';

type Step = { title: string; body: string; target?: string; list?: { label: string; text: string }[] };
type Box = { top: number; left: number; width: number; height: number };

const visible = (el: Element | null): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth;
};

/** Builds the tour for one dashboard from its guide text and the menu items this person actually has. */
function buildSteps(dash: DashboardKey, groups: ShellGroup[], wide: boolean): Step[] {
  const guide = dashboardGuides[dash];
  const labels = new Map(groups.flatMap(g => g.items).map(i => [i.key, i.label]));
  const places = guide.places.filter(p => labels.has(p.key)).map(p => ({ key: p.key, label: labels.get(p.key)!, text: p.text }));
  const steps: Step[] = [{ title: `Welcome to your ${dashboards[dash].label}`, body: `${guide.intro} This quick tour shows you where everything is. It takes under a minute.` }];
  if (wide) {
    steps.push({ title: 'Your menu', body: 'Every section of this dashboard is in this menu. Numbers beside an item show how many things are waiting there.', target: '[data-tour="menu"]' });
    for (const p of places) steps.push({ title: p.label, body: p.text, target: `[data-tour-item="${p.key}"]` });
  } else {
    steps.push({ title: 'Your menu', body: 'Tap this button — or swipe in from the left edge — to open the menu with every section.', target: '[data-tour="menu-button"]', ...(places.length ? { list: places } : {}) });
  }
  steps.push(
    { title: 'Alerts', body: 'The bell shows new notifications. Urgent tickets and new leads also ring and pop up. Use "Sound off" inside it to mute.', target: '[data-tour="bell"] button' },
    { title: 'Theme', body: 'Switch between Light, Dark and Eye comfort. Your choice is saved on this device.', target: '[data-tour="theme"]' },
    { title: 'Switch dashboards', body: 'You can open more than one dashboard. Switch here any time.', target: '[data-tour="switch"]' },
    { title: 'Help is always here', body: 'Press Help to replay this tour, read step-by-step answers for this dashboard, or learn how to raise a ticket or request.', target: '[data-tour="help"]' },
    { title: 'You are ready', body: `${guide.firstThing} Need anything later? Press Help in the top bar.` },
  );
  return steps;
}

/** Spotlight walkthrough shown on a person's first visit to a dashboard; can be replayed from the Help menu. */
export function GuideTour({ dash, groups, onClose }: { dash: DashboardKey; groups: ShellGroup[]; onClose: () => void }) {
  const [wide] = useState(() => window.innerWidth >= 1024);
  // Steps whose target is not on screen (e.g. no bell for this account) are dropped once, when the tour opens.
  const pick = useCallback(() => buildSteps(dash, groups, wide).filter(s => !s.target || visible(document.querySelector(s.target))), [dash, groups, wide]);
  const [steps, setSteps] = useState(pick);
  const [i, setI] = useState(0);
  // Top-bar buttons such as the bell can appear a moment after the page; look again while the welcome card is showing.
  useEffect(() => { if (i !== 0) return; const t = window.setTimeout(() => setSteps(pick()), 900); return () => window.clearTimeout(t); }, [i, pick]);
  const [box, setBox] = useState<Box | null>(null);
  const next = useRef<HTMLButtonElement>(null);
  const step = steps[Math.min(i, steps.length - 1)]!;
  const last = i >= steps.length - 1;

  const measure = useCallback(() => {
    const el = step.target ? document.querySelector(step.target) : null;
    if (!visible(el)) { setBox(null); return; }
    const r = el.getBoundingClientRect(); const pad = 6;
    setBox({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
  }, [step.target]);

  useLayoutEffect(() => {
    const el = step.target ? document.querySelector(step.target) : null;
    if (el && step.target !== '[data-tour="menu"]') el.scrollIntoView({ block: 'nearest' });
    measure();
  }, [measure, step.target]);
  useEffect(() => {
    window.addEventListener('resize', measure); window.addEventListener('scroll', measure, true);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [measure]);
  useEffect(() => { next.current?.focus(); }, [i]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setI(n => Math.min(n + 1, steps.length - 1));
      else if (e.key === 'ArrowLeft') setI(n => Math.max(n - 1, 0));
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [onClose, steps.length]);

  // Card sits beside the menu, below top-bar buttons, or centred when nothing is highlighted.
  const W = Math.min(360, window.innerWidth - 24);
  let style: React.CSSProperties;
  if (!box || !wide) style = box && !wide ? { left: 12, right: 12, bottom: 16 } : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: W };
  else if (box.left + box.width < 320) style = { left: box.left + box.width + 14, top: Math.max(12, Math.min(box.top, window.innerHeight - 280)), width: W };
  else style = { top: box.top + box.height + 12, left: Math.max(12, Math.min(box.left + box.width - W, window.innerWidth - W - 12)), width: W };

  return <div className="guide-tour fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="guide-title">
    {box ? <div aria-hidden="true" className="guide-spot" style={box} /> : <div aria-hidden="true" className="guide-shade" />}
    <div key={i} className="guide-card dash-card fixed p-5 shadow-2xl" style={style}>
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary"><Sparkles className="size-3.5" aria-hidden="true" />Guide · {i + 1} of {steps.length}</p>
        <button type="button" onClick={onClose} aria-label="Close the guide" className="-m-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button>
      </div>
      <h2 id="guide-title" className="mt-2 text-lg font-semibold leading-snug">{step.title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
      {step.list && <ul className="mt-3 max-h-48 space-y-1.5 overflow-y-auto text-sm">{step.list.map(p => <li key={p.label}><b className="font-semibold text-foreground">{p.label}</b> — <span className="text-muted-foreground">{p.text}</span></li>)}</ul>}
      <div className="mt-4 flex items-center gap-1" aria-hidden="true">{steps.map((_, n) => <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-5 bg-primary' : 'w-1.5 bg-border'}`} />)}</div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>Skip</Button>
        <div className="flex gap-2">
          {i > 0 && <Button variant="outline" size="sm" onClick={() => setI(i - 1)}><ArrowLeft className="size-4" />Back</Button>}
          <Button ref={next} size="sm" onClick={() => (last ? onClose() : setI(i + 1))}>{last ? 'Finish' : <>Next<ArrowRight className="size-4" /></>}</Button>
        </div>
      </div>
    </div>
  </div>;
}
