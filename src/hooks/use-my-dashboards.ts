import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseDashboards } from '@/lib/dashboards';

/** The dashboards the signed-in account may open, as decided by the database. `uid` is undefined while the session loads, null when signed out. */
export function useMyDashboards() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState('');
  useEffect(() => {
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setUid(s?.user.id ?? null); setEmail(s?.user.email ?? ''); });
      supabase.auth.getSession().then(({ data }) => { setUid(data.session?.user.id ?? null); setEmail(data.session?.user.email ?? ''); }).catch(() => setUid(null));
      return () => sub.subscription.unsubscribe();
    } catch { setUid(null); return undefined; }
  }, []);
  const query = useQuery({
    queryKey: ['my-dashboards', uid],
    enabled: Boolean(uid),
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_dashboards');
      if (error) throw new Error('Your dashboards could not be checked. Please try again.');
      return parseDashboards(data);
    },
  });
  return { uid, email, dashboards: uid ? query.data : undefined, loading: uid === undefined || (Boolean(uid) && query.isPending), error: query.error, refetch: query.refetch };
}
