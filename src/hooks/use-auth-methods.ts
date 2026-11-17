import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { readAuthSettings } from '@/lib/auth/methods';

/** Sign-in switches from Admin → Sign-in & security. Defaults apply while loading or when nothing is saved yet. */
export function useAuthMethods() {
  const q = useQuery({ queryKey: ['auth-methods'], staleTime: 60_000, retry: false, queryFn: async () => {
    const { data, error } = await supabase.from('global_settings').select('key,value').eq('is_public', true).like('key', 'auth\\_%');
    if (error) throw error; return Object.fromEntries((data ?? []).map(r => [r.key, r.value])) as Record<string, unknown>;
  } });
  return { settings: readAuthSettings(q.data), loading: q.isPending, refetch: q.refetch };
}
