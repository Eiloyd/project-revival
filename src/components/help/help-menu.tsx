import { Link } from '@tanstack/react-router';
import { BookOpen, CircleHelp, ClipboardPlus, LifeBuoy, Sparkles, TicketPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { DashboardKey } from '@/lib/dashboards';
import { findTopic } from '@/lib/help/search';

/** Top-bar Help button in every dashboard: replay the tour or open the Help Centre (new tab, so work on screen is kept). */
export function HelpMenu({ dash, onTour }: { dash: DashboardKey | null; onTour: () => void }) {
  const topic = dash ? findTopic(dash) : undefined;
  const ext = { target: '_blank', rel: 'noopener' } as const;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" data-tour="help" aria-label="Help" title="Help" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground hover:bg-muted">
        <CircleHelp className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Help</span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-64">
      <DropdownMenuLabel className="text-xs text-muted-foreground">Help & guide</DropdownMenuLabel>
      {dash && <DropdownMenuItem onSelect={onTour}><Sparkles className="size-4" />Start the guided tour</DropdownMenuItem>}
      {topic && <DropdownMenuItem asChild><Link to="/help" search={{ topic: topic.key }} {...ext}><BookOpen className="size-4" />Help for {topic.title}</Link></DropdownMenuItem>}
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild><Link to="/help/$slug" params={{ slug: dash === 'volunteer' ? 'volunteer-ticket' : dash === 'portal' ? 'client-ticket' : 'raise-ticket' }} {...ext}><TicketPlus className="size-4" />How to raise a ticket</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link to="/help/$slug" params={{ slug: 'new-request' }} {...ext}><ClipboardPlus className="size-4" />Leave, expense & other requests</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link to="/help" {...ext}><LifeBuoy className="size-4" />Open the Help Centre</Link></DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
