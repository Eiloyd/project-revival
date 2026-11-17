import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Eye, Moon, Sun, ClipboardList, Headset, Landmark, SearchCheck, Users, BriefcaseBusiness, ChevronRight, HandHeart, HeartHandshake, LayoutGrid, Link2, LogOut, Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck, X, Rocket, Building2, GraduationCap, type LucideIcon, UsersRound } from 'lucide-react';
import { useMyDashboards } from '@/hooks/use-my-dashboards';
import { NotificationBell } from '@/components/work/notification-bell';
import { dashboardForPath, dashboards, type DashboardKey } from '@/lib/dashboards';
import { DASH_THEME_KEY, dashThemeLabels, nextDashTheme, readDashTheme, type DashTheme } from '@/lib/dash-theme';
import { logActivity } from '@/lib/activity-log';
import { dashboardKeyForPath, guideSeenKey } from '@/lib/help/search';
import { HelpMenu } from '@/components/help/help-menu';
import { GuideTour } from './guide-tour';
import { AccountSecurity, TwoStepChallenge, useNeedsTwoStep } from './two-step';
import { FirstPasswordChange, useMustChangePassword } from './first-password';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthMethods } from '@/hooks/use-auth-methods';
import logo from '@/assets/local/riloyd-logo.png.optimized.nav.webp';
import darkLogo from '@/assets/local/riloyd-logo-dark.png.optimized.nav.webp';

export type ShellItem = { key: string; label: string; icon: LucideIcon; badge?: number | string };
export type ShellGroup = { title?: string; items: ShellItem[] };
export const dashboardIcons: Record<DashboardKey, LucideIcon> = { candidate: BriefcaseBusiness, institute: GraduationCap, admin: ShieldCheck, crm: BriefcaseBusiness, staff: Link2, 'my-volunteers': HeartHandshake, hr: Users, support: Headset, finance: Landmark, research: SearchCheck, work: ClipboardList, volunteer: HandHeart, ventures: Rocket, manpower: UsersRound, portal: Building2 };

const WIDTH = 272; // phone drawer width in px
const EDGE = 44; // a swipe must start this close to the left edge to open the menu (wide enough to begin clear of the phone's own back gesture)

type ShellProps = {
  workspace: string; groups: ShellGroup[]; active: string; onSelect: (key: string) => void;
  user?: { name: string; detail?: string }; onSignOut?: () => void; signOutLabel?: string; actions?: ReactNode; title?: string | undefined; subtitle?: string | undefined; children: ReactNode;
};

/** Shared employee/admin workspace frame. Accounts with an authenticator app must enter its code before any dashboard opens. */
export function DashboardShell(props: ShellProps) {
  const twoStep = useNeedsTwoStep(true);
  const firstPassword = useMustChangePassword();
  if (twoStep.state === 'checking' || firstPassword.state === 'checking') return <DashboardGate workspace={props.workspace} title="Checking your sign-in"><p className="text-sm text-muted-foreground">One moment…</p></DashboardGate>;
  if (twoStep.state === 'needed') return <DashboardGate workspace={props.workspace} title="Enter your 2-step code"><TwoStepChallenge onDone={twoStep.done} /></DashboardGate>;
  if (firstPassword.state === 'needed') return <DashboardGate workspace={props.workspace} title="Set your own password"><FirstPasswordChange onDone={firstPassword.done} /></DashboardGate>;
  return <ShellFrame {...props} />;
}

/** Dark left menu (collapses on computers, swipes in/out on phones) + sticky top bar. */
function ShellFrame({ workspace, groups, active, onSelect, user, onSignOut, signOutLabel = 'Sign out', actions, title, subtitle, children }: ShellProps) {
  const [securityOpen, setSecurityOpen] = useState(false);
  const authMethods = useAuthMethods();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const current = groups.flatMap(g => g.items).find(i => i.key === active);
  // Only the dashboards this account may open are offered (decided by the database); none are shown in sample previews.
  const here = useRouterState({ select: s => dashboardForPath(s.location.pathname) });
  const dashKey = useRouterState({ select: s => dashboardKeyForPath(s.location.pathname) });
  const me = useMyDashboards(); const mine = me.dashboards ?? [];
  const switchable = mine.length > 1;
  const content = useRef<HTMLDivElement>(null);

  // First-login guide: opens once per person on each dashboard, and again on request from Help.
  const [tour, setTour] = useState(false);
  useEffect(() => {
    if (!me.uid || !dashKey || !me.dashboards || window.localStorage.getItem(guideSeenKey(dashKey, me.uid))) return;
    const t = window.setTimeout(() => setTour(true), 900); return () => window.clearTimeout(t);
  }, [me.uid, me.dashboards, dashKey]);
  const closeTour = () => { if (me.uid && dashKey) window.localStorage.setItem(guideSeenKey(dashKey, me.uid), '1'); setTour(false); };

  // Soft fade when moving between sections (no remount, so section state and alerts are kept).
  const firstPaint = useRef(true);
  useEffect(() => {
    if (firstPaint.current) { firstPaint.current = false; return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    content.current?.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }, [active]);

  // Activity log: every section (tab) opened, and leaving/returning to the browser tab (at most once a minute each way).
  const label = current?.label ?? active;
  useEffect(() => { if (me.uid) void logActivity('tab_change', { dashboard: workspace, section: label }); }, [me.uid, workspace, label]);
  useEffect(() => {
    if (!me.uid) return;
    const last: Record<string, number> = {};
    const onVis = () => { const ev = document.visibilityState === 'hidden' ? 'browser_tab_hidden' : 'browser_tab_visible'; if (Date.now() - (last[ev] ?? 0) < 60_000) return; last[ev] = Date.now(); void logActivity(ev, { dashboard: workspace, section: label }); };
    document.addEventListener('visibilitychange', onVis); return () => document.removeEventListener('visibilitychange', onVis);
  }, [me.uid, workspace, label]);
  const signOut = onSignOut ? async () => { await logActivity('logout', { dashboard: workspace, section: label }); onSignOut(); } : undefined;

  useEffect(() => { setCollapsed(window.localStorage.getItem('riloyd-dash-collapsed') === '1'); }, []);
  const toggleCollapsed = () => setCollapsed(c => { window.localStorage.setItem('riloyd-dash-collapsed', c ? '0' : '1'); return !c; });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', key); };
  }, [open]);

  // Swipe right from the left edge opens the menu; swipe left closes it. The panel follows the finger.
  useEffect(() => {
    let start: { x: number; y: number; t: number } | null = null; let mode: 'open' | 'close' | null = null; let dx = 0; let locked: boolean | null = null;
    const paint = (offset: number) => {
      const p = panel.current; const s = shade.current; if (!p || !s) return;
      p.style.transition = 'none'; p.style.transform = `translateX(${offset}px)`;
      s.style.transition = 'none'; s.style.opacity = String(Math.max(0, Math.min(1, 1 + offset / WIDTH))); s.style.pointerEvents = 'none';
    };
    const clear = () => { for (const el of [panel.current, shade.current]) if (el) { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; el.style.pointerEvents = ''; } };
    const down = (e: TouchEvent) => {
      if (window.innerWidth >= 1024 || e.touches.length !== 1) return;
      const t = e.touches[0]!; start = { x: t.clientX, y: t.clientY, t: Date.now() }; dx = 0; locked = null;
      mode = open ? 'close' : t.clientX <= EDGE ? 'open' : null;
    };
    const move = (e: TouchEvent) => {
      if (!start || !mode) return;
      const t = e.touches[0]!; dx = t.clientX - start.x; const dy = t.clientY - start.y;
      if (locked === null && Math.abs(dx) + Math.abs(dy) > 8) locked = Math.abs(dx) > Math.abs(dy);
      if (!locked) return;
      paint(mode === 'open' ? Math.min(0, -WIDTH + dx) : Math.min(0, dx));
    };
    const up = () => {
      if (!start || !mode) { start = null; return; }
      const fast = Math.abs(dx) / Math.max(1, Date.now() - start.t) > 0.5;
      const next = locked ? (mode === 'open' ? dx > WIDTH / 3 || (fast && dx > 0) : !(dx < -WIDTH / 3 || (fast && dx < 0))) : open;
      clear(); setOpen(next); start = null; mode = null;
    };
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up); window.addEventListener('touchcancel', up);
    return () => { window.removeEventListener('touchstart', down); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); window.removeEventListener('touchcancel', up); };
  }, [open]);

  const hide = collapsed ? 'lg:sr-only' : '';
  const initials = (user?.name ?? '?').replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(s => s[0]!.toUpperCase()).join('') || '?';
  const navButton = (i: ShellItem) => <button key={i.key} type="button" data-tour-item={i.key} title={collapsed ? i.label : undefined} aria-current={active === i.key ? 'page' : undefined}
    onClick={() => { onSelect(i.key); setOpen(false); window.scrollTo({ top: 0 }); }}
    className={`dash-nav-item ${active === i.key ? 'dash-nav-active' : ''} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
    <i.icon className="size-[18px] shrink-0" aria-hidden="true" /><span className={`min-w-0 flex-1 truncate text-left ${hide}`}>{i.label}</span>
    {i.badge !== undefined && i.badge !== 0 && <span className={`dash-nav-badge ${collapsed ? 'lg:absolute lg:right-1.5 lg:top-1' : ''}`}>{i.badge}</span>}
  </button>;

  return <div className="dash-shell admin-workspace min-h-screen bg-background text-foreground">
    <div ref={shade} aria-hidden="true" onClick={() => setOpen(false)} className={`fixed inset-0 z-40 bg-foreground/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
    <aside ref={panel} data-tour="menu" aria-label={`${workspace} menu`} className={`dash-side fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col transition-[transform,width] duration-300 ease-out lg:translate-x-0 ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'}`}>
      <div className={`flex h-16 shrink-0 items-center gap-2 border-b border-[var(--dash-side-line)] px-4 ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
        <img src={logo} alt="RILOYD" width={480} height={240} className={`h-9 w-auto ${collapsed ? 'lg:h-7' : ''}`} />
        <span className={`ml-auto rounded-md border border-[var(--dash-side-line)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--dash-side-muted)] ${hide}`}>{workspace}</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="ml-1 rounded-md p-1.5 text-[var(--dash-side-muted)] hover:text-[var(--dash-side-fg)] lg:hidden"><X className="size-5" /></button>
      </div>
      <nav className="dash-side-scroll flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g, gi) => <div key={g.title ?? gi} className="mb-4 last:mb-0">
          {g.title && <p className={`px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--dash-side-muted)] ${collapsed ? 'lg:hidden' : ''}`}>{g.title}</p>}
          {collapsed && gi > 0 && <div className="mx-3 mb-2 hidden h-px bg-[var(--dash-side-line)] lg:block" />}
          <div className="space-y-0.5">{g.items.map(navButton)}</div>
        </div>)}
        {switchable && <div className="mt-4 border-t border-[var(--dash-side-line)] pt-4">
          <p className={`px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--dash-side-muted)] ${collapsed ? 'lg:hidden' : ''}`}>My dashboards</p>
          <div className="space-y-0.5">{mine.map(k => { const Icon = dashboardIcons[k]; const d = dashboards[k]; return <Link key={k} to={d.path} title={collapsed ? d.label : undefined} aria-current={k === here ? 'page' : undefined} onClick={() => setOpen(false)} className={`dash-nav-item ${k === here ? 'dash-nav-active' : ''} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}><Icon className="size-[18px] shrink-0" aria-hidden="true" /><span className={`min-w-0 flex-1 truncate ${hide}`}>{d.label}</span></Link>; })}</div>
        </div>}
      </nav>
      <div className="shrink-0 border-t border-[var(--dash-side-line)] p-3">
        {user && <div className={`flex items-center gap-3 rounded-lg px-2 py-2 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`} title={collapsed ? user.name : undefined}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--dash-side-active)] text-xs font-bold text-[var(--dash-side-active-fg)]">{initials}</span>
          <span className={`min-w-0 ${hide}`}><span className="block truncate text-sm font-semibold text-[var(--dash-side-fg)]">{user.name}</span>{user.detail && <span className="block truncate text-xs text-[var(--dash-side-muted)]">{user.detail}</span>}</span>
        </div>}
        {signOut && <button type="button" onClick={() => setSecurityOpen(true)} title={collapsed ? 'Account security' : undefined} className={`dash-nav-item mt-1 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}><ShieldCheck className="size-[18px] shrink-0" /><span className={hide}>Account security</span></button>}
        {signOut && <Dialog open={securityOpen} onOpenChange={setSecurityOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Account security</DialogTitle></DialogHeader><AccountSecurity allowTwoStep={authMethods.settings.auth_mfa} /></DialogContent></Dialog>}
        {signOut && <button type="button" onClick={() => void signOut()} title={collapsed ? signOutLabel : undefined} className={`dash-nav-item mt-1 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}><LogOut className="size-[18px] shrink-0" /><span className={hide}>{signOutLabel}</span></button>}
      </div>
    </aside>

    <div className={`min-w-0 transition-[padding] duration-300 ease-out ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
      <header className="dash-topbar sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6 lg:px-8">
        <button type="button" data-tour="menu-button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="-ml-1 rounded-md p-2 text-foreground hover:bg-muted lg:hidden"><Menu className="size-5" /></button>
        <button type="button" onClick={toggleCollapsed} aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} className="-ml-2 hidden rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:inline-flex">{collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}</button>
        <div className="min-w-0 flex-1">
          <p className="hidden items-center gap-1 text-[11px] font-medium text-muted-foreground sm:flex">RILOYD<ChevronRight className="size-3" />{workspace}{current && <><ChevronRight className="size-3" />{current.label}</>}</p>
          <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">{title ?? current?.label ?? workspace}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2"><HelpMenu dash={dashKey} onTour={() => setTour(true)} /><DashThemeToggle />{actions}{me.uid && mine.length > 0 && <span data-tour="bell" className="contents"><NotificationBell uid={me.uid} onSection={k => { const all = groups.flatMap(g => g.items); const hit = all.find(i => i.key === k || i.key === `w-${k}`); if (hit) onSelect(hit.key); }} /></span>}{switchable && <Link to="/login" data-tour="switch" title="Switch dashboard" aria-label="Switch dashboard" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-2.5 text-sm font-medium text-foreground hover:bg-muted"><LayoutGrid className="size-4" /><span className="hidden md:inline">Dashboards</span></Link>}</div>
      </header>
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {subtitle && <p className="-mt-1 mb-5 text-sm text-muted-foreground">{subtitle}</p>}
        <div ref={content}>{children}</div>
      </main>
    </div>
    {tour && dashKey && <GuideTour dash={dashKey} groups={groups} onClose={closeTour} />}
  </div>;
}

/** Sign-in / access screens for the workspaces: same palette, centred card, no menu. */
export function DashboardGate({ workspace, title, intro, children }: { workspace: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return <main className="dash-shell admin-workspace grid min-h-screen bg-background text-foreground lg:grid-cols-[1.05fr_1fr]">
    <section className="dash-side relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
      <img src={logo} alt="RILOYD" width={480} height={240} className="h-24 w-auto self-start" />
      <div className="relative z-10 max-w-md"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--dash-side-muted)]">{workspace}</p><h2 className="mt-3 text-4xl font-semibold leading-tight text-[var(--dash-side-fg)]">Our business.<br />Our performance.<br />One workspace.</h2></div>
      <p className="relative z-10 text-xs text-[var(--dash-side-muted)]">Secure sign-in · private workspace</p>
      <div aria-hidden="true" className="dash-gate-art absolute inset-0" />
    </section>
    <section className="flex min-w-0 items-start justify-center px-4 py-6 sm:items-center sm:px-10 sm:py-12">
      <div className="w-full min-w-0 max-w-md">
        <div className="flex items-center justify-between gap-3"><span className="lg:hidden"><img src={darkLogo} alt="RILOYD" width={480} height={240} className="dash-logo-on-light h-12 w-auto sm:h-20" /><img src={logo} alt="" aria-hidden="true" width={480} height={240} className="dash-logo-on-dark h-12 w-auto sm:h-20" /></span><span className="ml-auto"><DashThemeToggle /></span></div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:mt-6 lg:mt-0">{workspace}</p>
        <h1 className="mt-2 text-xl font-semibold sm:text-3xl">{title}</h1>
        {intro && <div className="mt-2 text-sm text-muted-foreground">{intro}</div>}
        <div className="mt-4 sm:mt-6">{children}</div>
      </div>
    </section>
  </main>;
}

/** KPI card used on dashboard overviews. */
export function KpiCard({ label, value, note, icon: Icon, tone = 'default' }: { label: string; value: ReactNode; note?: ReactNode; icon?: LucideIcon; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const color = tone === 'success' ? 'var(--dash-success)' : tone === 'warning' ? 'var(--dash-warning)' : tone === 'danger' ? 'var(--dash-danger)' : 'var(--primary)';
  return <article className="dash-card p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3"><p className="text-xs font-medium text-muted-foreground">{label}</p>{Icon && <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ color, background: `color-mix(in oklab, ${color} 10%, transparent)` }}><Icon className="size-4" /></span>}</div>
    <p className="mt-2 text-2xl font-bold tabular-nums sm:text-[28px]">{value}</p>
    {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
  </article>;
}

/** Light → Dark → Eye comfort, saved on this device and applied to every workspace. */
export function DashThemeToggle() {
  const [theme, setTheme] = useState<DashTheme>('light');
  useEffect(() => { setTheme(readDashTheme(window.localStorage.getItem(DASH_THEME_KEY))); }, []);
  useEffect(() => {
    const r = document.documentElement;
    if (theme === 'light') delete r.dataset['dashTheme']; else r.dataset['dashTheme'] = theme;
  }, [theme]);
  const next = nextDashTheme(theme);
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Eye;
  return <button type="button" data-tour="theme" onClick={() => { window.localStorage.setItem(DASH_THEME_KEY, next); setTheme(next); }}
    aria-label={`Theme: ${dashThemeLabels[theme]}. Switch to ${dashThemeLabels[next]}`} title={`Theme: ${dashThemeLabels[theme]} — switch to ${dashThemeLabels[next]}`}
    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground hover:bg-muted">
    <Icon className="size-4" aria-hidden="true" /><span className="hidden sm:inline">{dashThemeLabels[theme]}</span>
  </button>;
}
