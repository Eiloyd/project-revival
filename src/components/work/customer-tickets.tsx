import { SupportDashboard } from '@/components/support/support-dashboard';

/** Shared customer support inbox, also available to existing dashboard consumers. */
export function CustomerTickets({ uid }: { uid: string }) {
  return <SupportDashboard uid={uid} section="s-inbox" />;
}
