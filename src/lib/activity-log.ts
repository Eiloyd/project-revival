import { supabase } from '@/integrations/supabase/client';

export type ActivityEvent = 'login' | 'logout' | 'tab_change' | 'browser_tab_hidden' | 'browser_tab_visible';

/** Saves one sign-in / sign-out / tab-change entry for the signed-in person (RLS: own rows only). Never throws. */
export async function logActivity(event: ActivityEvent, extra: { dashboard?: string; section?: string } = {}) {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user; if (!user) return;
    await supabase.from('user_activity_logs').insert({
      user_id: user.id, email: (user.email ?? '').slice(0, 254), event,
      dashboard: (extra.dashboard ?? '').slice(0, 60), section: (extra.section ?? '').slice(0, 120),
      path: `${window.location.pathname}${window.location.hash}`.slice(0, 200), user_agent: navigator.userAgent.slice(0, 300),
    });
  } catch { /* logging must never block the person */ }
}

export const activityLabels: Record<ActivityEvent, string> = { login: 'Signed in', logout: 'Signed out', tab_change: 'Opened section', browser_tab_hidden: 'Left browser tab', browser_tab_visible: 'Came back to tab' };
