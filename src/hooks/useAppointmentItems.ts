import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppointmentItem {
  id: string;
  job_appointment_id: string;
  item_type: 'product' | 'package';
  item_id: string;
  quantity: number;
  vat_rate: number;
  override_vk: number | null;
  created_at: string;
}

export function useAppointmentItems(appointmentId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['appointment-items', appointmentId],
    enabled: !!appointmentId,
    queryFn: async (): Promise<AppointmentItem[]> => {
      const { data, error } = await supabase
        .from('job_appointment_items' as any)
        .select('*')
        .eq('job_appointment_id', appointmentId!);
      if (error) throw error;
      return (data || []) as any;
    },
  });

  const addItem = useMutation({
    mutationFn: async (item: { job_appointment_id: string; item_type: string; item_id: string; quantity?: number; vat_rate?: number }) => {
      const { error } = await supabase.from('job_appointment_items' as any).insert(item);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointment-items', appointmentId] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; quantity?: number; vat_rate?: number; override_vk?: number | null }) => {
      const { error } = await supabase.from('job_appointment_items' as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointment-items', appointmentId] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('job_appointment_items' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointment-items', appointmentId] }),
  });

  return { items: query.data || [], loading: query.isLoading, addItem, updateItem, deleteItem };
}
