import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Bell, BellRing, CheckCheck, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { dateTime } from '@/lib/requests';
import { RequestDetailDialog } from './request-detail';

type N = { id: string; kind: string; title: string; body: string; link: string; read_at: string | null; created_at: string };
const dot: Record<string, string> = { action: 'var(--primary)', alert: 'var(--dash-danger)', error: 'var(--dash-danger)', warning: 'var(--dash-warning)', success: 'var(--dash-success)', info: 'var(--muted-foreground)' };

const SOUND_KEY = 'riloyd-alert-sound';
/** Short two-tone beep made in the browser (no sound file). Browsers allow it once the person has clicked on the page. */
function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; if (!Ctx) return;
    const ctx = new Ctx(); const g = ctx.createGain(); g.connect(ctx.destination); g.gain.value = 0.15;
    [880, 1175].forEach((f, i) => { const o = ctx.createOscillator(); o.frequency.value = f; o.connect(g); o.start(ctx.currentTime + i * 0.22); o.stop(ctx.currentTime + i * 0.22 + 0.18); });
    setTimeout(() => void ctx.close(), 1000);
  } catch { /* sound is optional */ }
}

/** Top-bar bell: the signed-in person's own notifications (RLS), with read / read all and opening the related request. */
export function NotificationBell({ uid, onSection }: { uid: string; onSection?: (key: string) => void }) {
  const qc = useQueryClient(); const navigate = useNavigate();
  const [open, setOpen] = useState(false); const [req, setReq] = useState<string | null>(null);
  const [sound, setSound] = useState(true); const seen = useRef<Set<string> | null>(null);
  useEffect(() => { setSound(localStorage.getItem(SOUND_KEY) !== 'off'); }, []);
  const toggleSound = () => { const next = !sound; setSound(next); localStorage.setItem(SOUND_KEY, next ? 'on' : 'off'); if (next) beep(); };
  const q = useQuery({ queryKey: ['notifications', uid], refetchInterval: 30_000, queryFn: async () => {
    const { data, error } = await supabase.from('notifications').select('id,kind,title,body,link,read_at,created_at').order('created_at', { ascending: false }).limit(40);
    if (error) throw error; return data as N[];
  } });
  const list = q.data ?? []; const unread = list.filter(n => !n.read_at).length;
  // Urgent alerts: ring + pop-up for new unread "alert" items that arrive while the page is open (not on first load).
  useEffect(() => {
    if (!q.data) return;
    if (!seen.current) { seen.current = new Set(q.data.map(n => n.id)); return; }
    const fresh = q.data.filter(n => !seen.current!.has(n.id)); fresh.forEach(n => seen.current!.add(n.id));
    const urgent = fresh.filter(n => !n.read_at && (n.kind === 'alert' || n.kind === 'error'));
    if (!urgent.length) return;
    if (localStorage.getItem(SOUND_KEY) !== 'off') beep();
    urgent.slice(0, 3).forEach(n => toast.warning(n.title, { description: n.body || undefined, duration: 15_000, action: { label: 'Open', onClick: () => click(n) } }));
  }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const mark = async (id?: string) => { await supabase.rpc('notifications_mark_read', id ? { _id: id } : {}); void qc.invalidateQueries({ queryKey: ['notifications', uid] }); };
  const click = (n: N) => {
    void mark(n.id); setOpen(false);
    if (n.link.startsWith('request:')) setReq(n.link.slice(8));
    else if (n.link.startsWith('/')) { const [path, hash] = n.link.split('#'); void navigate({ to: path as '/', ...(hash ? { hash } : {}) }); }
    else if (n.link && onSection) onSection(n.link);
  };
  return <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted">
        {list.some(n => !n.read_at && n.kind === 'alert') ? <BellRing className="size-4 text-[var(--dash-danger)]" /> : <Bell className="size-4" />}{unread > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-bold leading-4 text-primary-foreground">{unread > 9 ? '9+' : unread}</span>}
      </button></PopoverTrigger>
      <PopoverContent align="end" className="dash-shell w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3"><p className="text-sm font-semibold">Notifications</p><div className="flex items-center gap-3"><button type="button" onClick={toggleSound} aria-pressed={sound} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground" title="Sound for urgent tickets and new leads">{sound ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}{sound ? 'Sound on' : 'Sound off'}</button>{unread > 0 && <button type="button" onClick={() => void mark()} className="inline-flex items-center gap-1 text-xs font-medium text-primary"><CheckCheck className="size-3.5" />Mark all read</button>}</div></div>
        <ul className="max-h-[60vh] overflow-y-auto">{list.length === 0 ? <li className="px-4 py-8 text-center text-sm text-muted-foreground">{q.isPending ? 'Loading…' : 'No notifications yet.'}</li>
          : list.map(n => <li key={n.id}><button type="button" onClick={() => click(n)} className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-muted ${n.read_at ? 'opacity-70' : ''}`}>
            <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: n.read_at ? 'transparent' : dot[n.kind] ?? dot['info'] }} />
            <span className="min-w-0"><span className="block text-sm font-medium">{n.title}</span>{n.body && <span className="block text-xs text-muted-foreground">{n.body}</span>}<span className="mt-0.5 block text-[11px] text-muted-foreground">{dateTime(n.created_at)}</span></span>
          </button></li>)}</ul>
      </PopoverContent>
    </Popover>
    <RequestDetailDialog id={req} onClose={() => setReq(null)} />
  </>;
}
