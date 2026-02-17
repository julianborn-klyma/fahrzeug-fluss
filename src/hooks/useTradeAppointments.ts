import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TradeAppointment } from '@/types/montage';

export const useTradeAppointments = (jobId?: string) => {
  return useQuery({
    queryKey: ['trade-appointments', jobId],
    enabled: !!jobId,
    queryFn: async (): Promise<TradeAppointment[]> => {
      const { data, error } = await supabase
        .from('trade_appointments')
        .select('*')
        .eq('job_id', jobId!)
        .order('start_date');
      if (error) throw error;
      return data || [];
    },
  });
};

export const useMonteurAppointments = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['monteur-appointments', userId],
    enabled: !!userId,
    queryFn: async (): Promise<TradeAppointment[]> => {
      // Get job_appointment_assignments for this user
      const { data: assigns, error: aErr } = await supabase
        .from('job_appointment_assignments')
        .select('job_appointment_id')
        .eq('person_id', userId!);
      if (aErr) throw aErr;
      if (!assigns?.length) return [];

      const ids = assigns.map(a => a.job_appointment_id);

      // Get job_appointments that are visible to monteur (status >= vorbereitet & monteur_visible)
      const { data, error } = await supabase
        .from('job_appointments')
        .select('*, appointment_types(name, trade), jobs(*, properties(*))')
        .in('id', ids)
        .in('status', ['vorbereitet', 'in_umsetzung', 'review', 'abgenommen'])
        .eq('monteur_visible', true)
        .not('start_date', 'is', null)
        .order('start_date');
      if (error) throw error;

      return (data || []).map((d: any) => ({
        id: d.id,
        job_id: d.job_id,
        start_date: d.start_date,
        end_date: d.end_date,
        trade: d.appointment_types?.trade || '',
        notes: d.notes,
        created_at: d.created_at,
        status: d.status,
        job: d.jobs || undefined,
      }));
    },
  });
};
