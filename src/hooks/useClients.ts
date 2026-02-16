import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Client, Contact } from '@/types/montage';

export interface CreateClientInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  client_type?: string;
  billing_street?: string;
  billing_city?: string;
  billing_postal_code?: string;
  notes?: string;
}

export const useClients = () => {
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, contacts(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        contact: d.contacts || undefined,
      }));
    },
  });

  const createClient = useMutation({
    mutationFn: async (input: CreateClientInput) => {
      // 1. Create contact
      const { data: contact, error: contactErr } = await supabase
        .from('contacts')
        .insert({
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email || '',
          phone: input.phone || '',
        })
        .select()
        .single();
      if (contactErr) throw contactErr;

      // 2. Create client linked to contact
      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .insert({
          contact_id: contact.id,
          company_name: input.company_name || '',
          client_type: input.client_type || 'private',
          billing_street: input.billing_street || '',
          billing_city: input.billing_city || '',
          billing_postal_code: input.billing_postal_code || '',
          notes: input.notes || '',
        })
        .select('*, contacts(*)')
        .single();
      if (clientErr) throw clientErr;
      return client;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  return { clients: clientsQuery.data || [], loading: clientsQuery.isLoading, createClient };
};
