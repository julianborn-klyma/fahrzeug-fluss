import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useJobAppointments = (jobId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['job-appointments', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_appointments')
        .select('*, appointment_types(*, appointment_type_fields(*), appointment_type_documents(*, document_types(*)))')
        .eq('job_id', jobId!)
        .order('created_at');
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        appointment_type: d.appointment_types ? {
          ...d.appointment_types,
          fields: (d.appointment_types.appointment_type_fields || []).sort((a: any, b: any) => a.display_order - b.display_order),
          required_documents: d.appointment_types.appointment_type_documents || [],
        } : undefined,
      }));
    },
  });

  const createJobAppointment = useMutation({
    mutationFn: async (input: { job_id: string; appointment_type_id: string }) => {
      const { data, error } = await supabase.from('job_appointments').insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-appointments'] }),
  });

  const updateJobAppointment = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; start_date?: string | null; end_date?: string | null; status?: string; notes?: string; field_values?: any }) => {
      const { error } = await supabase.from('job_appointments').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-appointments'] }),
  });

  const deleteJobAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('job_appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-appointments'] }),
  });

  const createDefaultAppointments = async (jobId: string, orderTypeId: string) => {
    const { data: types } = await supabase
      .from('appointment_types')
      .select('id')
      .eq('order_type_id', orderTypeId)
      .eq('is_active', true)
      .order('display_order');
    if (!types || types.length === 0) return;
    const inserts = types.map((t: any) => ({ job_id: jobId, appointment_type_id: t.id }));
    await supabase.from('job_appointments').insert(inserts as any);
    queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
  };

  return {
    appointments: query.data || [],
    loading: query.isLoading,
    createJobAppointment,
    updateJobAppointment,
    deleteJobAppointment,
    createDefaultAppointments,
  };
};
