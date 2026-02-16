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
      // Get appointments where user is assigned
      const { data: assignments, error: aErr } = await supabase
        .from('appointment_assignments')
        .select('appointment_id')
        .eq('person_id', userId!);
      if (aErr) throw aErr;
      if (!assignments?.length) return [];

      const ids = assignments.map(a => a.appointment_id);
      const { data, error } = await supabase
        .from('trade_appointments')
        .select('*, jobs(*)')
        .in('id', ids)
        .order('start_date');
      if (error) throw error;
      return (data || []).map((d: any) => ({ ...d, job: d.jobs || undefined }));
    },
  });
};
