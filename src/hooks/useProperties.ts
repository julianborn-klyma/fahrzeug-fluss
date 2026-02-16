import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Property } from '@/types/montage';

export interface CreatePropertyInput {
  client_id: string;
  name?: string;
  street_address: string;
  city: string;
  postal_code: string;
  property_type?: string;
  notes?: string;
}

export const useProperties = (clientId?: string) => {
  const queryClient = useQueryClient();

  const propertiesQuery = useQuery({
    queryKey: ['properties', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createProperty = useMutation({
    mutationFn: async (input: CreatePropertyInput) => {
      const { data, error } = await supabase
        .from('properties')
        .insert({
          client_id: input.client_id,
          name: input.name || `${input.street_address}, ${input.postal_code} ${input.city}`,
          street_address: input.street_address,
          city: input.city,
          postal_code: input.postal_code,
          property_type: input.property_type || '',
          notes: input.notes || '',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] }),
  });

  return { properties: propertiesQuery.data || [], loading: propertiesQuery.isLoading, createProperty };
};
