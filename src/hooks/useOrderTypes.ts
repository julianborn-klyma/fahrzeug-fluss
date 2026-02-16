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
      const { data, error } = await supabase
        .from('order_types')
        .select('*, appointment_types(*)')
        .order('display_order');
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        appointment_types: (d.appointment_types || []).sort((a: any, b: any) => a.display_order - b.display_order),
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

  return { orderTypes: query.data || [], loading: query.isLoading, createOrderType, updateOrderType, deleteOrderType };
};
