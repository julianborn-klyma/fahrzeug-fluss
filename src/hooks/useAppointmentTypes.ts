import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAppointmentTypes = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['appointment-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const createAppointmentType = useMutation({
    mutationFn: async (input: { name: string; is_internal?: boolean; description?: string }) => {
      const { data, error } = await supabase.from('appointment_types').insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
      queryClient.invalidateQueries({ queryKey: ['order-types'] });
    },
  });

  const updateAppointmentType = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; is_internal?: boolean; is_active?: boolean; description?: string }) => {
      const { error } = await supabase.from('appointment_types').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
      queryClient.invalidateQueries({ queryKey: ['order-types'] });
    },
  });

  const deleteAppointmentType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointment_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
      queryClient.invalidateQueries({ queryKey: ['order-types'] });
    },
  });

  return { appointmentTypes: query.data || [], loading: query.isLoading, createAppointmentType, updateAppointmentType, deleteAppointmentType };
};

export const useAppointmentTypeFields = (appointmentTypeId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['appointment-type-fields', appointmentTypeId],
    enabled: !!appointmentTypeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_type_fields')
        .select('*')
        .eq('appointment_type_id', appointmentTypeId!)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const upsertField = useMutation({
    mutationFn: async (input: any) => {
      const { data, error } = await supabase.from('appointment_type_fields').upsert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointment-type-fields'] }),
  });

  const deleteField = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointment_type_fields').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointment-type-fields'] }),
  });

  return { fields: query.data || [], loading: query.isLoading, upsertField, deleteField };
};

export const useAppointmentTypeDocuments = (appointmentTypeId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['appointment-type-documents', appointmentTypeId],
    enabled: !!appointmentTypeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_type_documents')
        .select('*, document_types(*)')
        .eq('appointment_type_id', appointmentTypeId!);
      if (error) throw error;
      return data || [];
    },
  });

  const addDocument = useMutation({
    mutationFn: async (input: { appointment_type_id: string; document_type_id: string }) => {
      const { data, error } = await supabase.from('appointment_type_documents').insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointment-type-documents'] }),
  });

  const removeDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointment_type_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointment-type-documents'] }),
  });

  return { documents: query.data || [], loading: query.isLoading, addDocument, removeDocument };
};

export const useDocumentTypes = () => {
  return useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_types').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });
};
