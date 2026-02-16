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
    // Get appointment types via junction table
    const { data: junctions } = await supabase
      .from('order_type_appointment_types')
      .select('appointment_type_id, appointment_types(is_active)')
      .eq('order_type_id', orderTypeId)
      .order('display_order');
    if (!junctions || junctions.length === 0) return;
    const activeTypes = junctions.filter((j: any) => j.appointment_types?.is_active !== false);
    const inserts = activeTypes.map((j: any) => ({ job_id: jobId, appointment_type_id: j.appointment_type_id }));
    if (inserts.length === 0) return;
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
