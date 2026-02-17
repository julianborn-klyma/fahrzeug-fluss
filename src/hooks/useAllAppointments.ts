import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAllAppointments = () => {
  const query = useQuery({
    queryKey: ['all-job-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_appointments')
        .select('*, appointment_types(name, is_internal, appointment_type_fields(*), appointment_type_documents(*, document_types(*))), jobs(job_number, title, property_id, client_id, properties(name, street_address, city), clients(company_name, contact_id, contacts(first_name, last_name)))')
        .order('start_date', { ascending: true, nullsFirst: false });
      if (error) throw error;

      // Fetch checklists for all appointments
      const ids = (data || []).map((d: any) => d.id);
      let checklistsMap: Record<string, any[]> = {};
      if (ids.length > 0) {
        const { data: checklists } = await supabase
          .from('job_checklists')
          .select('id, appointment_id')
          .in('appointment_id', ids);
        for (const cl of (checklists || [])) {
          const apptId = cl.appointment_id;
          if (apptId) {
            if (!checklistsMap[apptId]) checklistsMap[apptId] = [];
            checklistsMap[apptId].push(cl);
          }
        }
      }

      return (data || []).map((d: any) => ({
        ...d,
        checklists: checklistsMap[d.id] || [],
        appointment_type: d.appointment_types ? {
          ...d.appointment_types,
          fields: (d.appointment_types.appointment_type_fields || []).sort((a: any, b: any) => a.display_order - b.display_order),
          required_documents: d.appointment_types.appointment_type_documents || [],
        } : undefined,
      }));
    },
  });

  return {
    appointments: query.data || [],
    loading: query.isLoading,
  };
};
