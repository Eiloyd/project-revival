import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
export type Ticket = Database['public']['Tables']['customer_tickets']['Row'];
export type TicketPatch = Pick<Database['public']['Tables']['customer_tickets']['Update'], 'assigned_to' | 'status' | 'priority' | 'request_type' | 'category' | 'resolution' | 'private_notes' | 'escalation_level'>;
export const channels = { website: 'Website', email: 'Email', phone: 'Phone', whatsapp: 'WhatsApp', chat: 'Chat', walk_in: 'Walk-in', social: 'Social' };
export const statuses = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
export const label = (value: string) => value.replaceAll('_', ' ');
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  return now;
}
export function useSupport(uid: string) {
  const qc = useQueryClient();
  const tickets = useQuery({ queryKey: ['customer-tickets', uid], queryFn: async () => {
    const rows: Ticket[] = [];
    // Fetch every visible page so workload and SLA totals are not silently capped at 500.
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.from('customer_tickets').select('*').order('created_at', { ascending: false }).order('id').range(offset, offset + 499);
      if (error) throw error;
      rows.push(...data); if (data.length < 500) return rows;
    }
  }, refetchInterval: 60_000 });
  const team = useQuery({ queryKey: ['support-team', uid], queryFn: async () => { const { data, error } = await supabase.rpc('support_team'); if (error) throw error; return data; } });
  const manager = useQuery({ queryKey: ['support-manager', uid], queryFn: async () => { const { data, error } = await supabase.rpc('support_is_manager'); if (error) throw error; return data; } });
  const refresh = async () => { await Promise.all([qc.invalidateQueries({ queryKey: ['customer-tickets'] }), qc.invalidateQueries({ queryKey: ['ticket-history'] })]); };
  const save = async (id: string, patch: TicketPatch) => { const { error } = await supabase.from('customer_tickets').update(patch).eq('id', id); if (error) throw error; await refresh(); };
  return { tickets, team, manager, refresh, save };
}
export type SupportData = ReturnType<typeof useSupport>;
