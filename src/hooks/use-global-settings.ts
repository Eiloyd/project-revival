import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Public Global settings (Admin → Global settings), with built-in fallbacks while loading or offline. */
export const contactDefaults = { contact_info_email: 'info@riloyd.in', contact_business_email: 'business@riloyd.in', contact_careers_email: 'careers@riloyd.in', contact_idea_email: 'idea@riloyd.in' } as const;
export function useGlobalSettings() {
  const q = useQuery({ queryKey: ['global-settings'], staleTime: 300_000, retry: false, queryFn: async () => {
    const { data, error } = await supabase.from('global_settings').select('key,value').eq('is_public', true);
    if (error) throw error; return Object.fromEntries((data ?? []).map(r => [r.key, r.value])) as Record<string, unknown>;
  } });
  const get = (k: keyof typeof contactDefaults) => { const v = q.data?.[k]; return typeof v === 'string' && v.includes('@') ? v : contactDefaults[k]; };
  return { get };
}
