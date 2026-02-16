import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAllAppointments = () => {
  const query = useQuery({
    queryKey: ['all-job-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_appointments')
        .select('*, appointment_types(name, is_internal), jobs(job_number, title, property_id, client_id, properties(name, street_address, city), clients(company_name, contact_id, contacts(first_name, last_name)))')
        .order('start_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
  });

  return {
    appointments: query.data || [],
    loading: query.isLoading,
  };
};
