import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { JobDocument } from '@/types/montage';

export const useJobDocuments = (jobId: string | undefined) => {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['job-documents', jobId],
    enabled: !!jobId,
    queryFn: async (): Promise<JobDocument[]> => {
      const { data, error } = await supabase
        .from('job_documents')
        .select('*, document_types(*)')
        .eq('job_id', jobId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        document_type: d.document_types || undefined,
      }));
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ jobId, file, trade, documentTypeId }: { jobId: string; file: File; trade?: string; documentTypeId?: string }) => {
      const filePath = `${jobId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('job-documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('job_documents').insert({
        job_id: jobId,
        file_name: file.name,
        file_path: filePath,
        trade: trade as any,
        document_type_id: documentTypeId || null,
      } as any);
      if (insertError) throw insertError;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-documents', jobId] }),
  });

  const deleteDocument = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      await supabase.storage.from('job-documents').remove([filePath]);
      const { error } = await supabase.from('job_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-documents', jobId] }),
  });

  const getDownloadUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from('job-documents').createSignedUrl(filePath, 3600);
    return data?.signedUrl;
  };

  return { documents: documentsQuery.data || [], loading: documentsQuery.isLoading, uploadDocument, deleteDocument, getDownloadUrl };
};
