import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrderTypeWithAppointments {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  appointment_types: any[];
}

export const useOrderTypes = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['order-types'],
    queryFn: async (): Promise<OrderTypeWithAppointments[]> => {
      // Fetch order types
      const { data: orderTypes, error: otError } = await supabase
        .from('order_types')
        .select('*')
        .order('display_order');
      if (otError) throw otError;

      // Fetch junction with appointment_types
      const { data: junctions, error: jError } = await supabase
        .from('order_type_appointment_types')
        .select('*, appointment_types(*)')
        .order('display_order');
      if (jError) throw jError;

      return (orderTypes || []).map((ot: any) => ({
        ...ot,
        appointment_types: (junctions || [])
          .filter((j: any) => j.order_type_id === ot.id && j.appointment_types)
          .map((j: any) => ({ ...j.appointment_types, junction_id: j.id, junction_display_order: j.display_order }))
          .sort((a: any, b: any) => a.junction_display_order - b.junction_display_order),
      }));
    },
  });

  const createOrderType = useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data, error } = await supabase.from('order_types').insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order-types'] }),
  });

  const updateOrderType = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; is_active?: boolean }) => {
      const { error } = await supabase.from('order_types').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order-types'] }),
  });

  const deleteOrderType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('order_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order-types'] }),
  });

  // Add appointment type to order type (junction)
  const addAppointmentTypeToOrder = useMutation({
    mutationFn: async (input: { order_type_id: string; appointment_type_id: string; display_order?: number }) => {
      const { data, error } = await supabase.from('order_type_appointment_types').insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order-types'] }),
  });

  // Remove appointment type from order type (junction)
  const removeAppointmentTypeFromOrder = useMutation({
    mutationFn: async (junctionId: string) => {
      const { error } = await supabase.from('order_type_appointment_types').delete().eq('id', junctionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order-types'] }),
  });

  return {
    orderTypes: query.data || [],
    loading: query.isLoading,
    createOrderType,
    updateOrderType,
    deleteOrderType,
    addAppointmentTypeToOrder,
    removeAppointmentTypeFromOrder,
  };
};
