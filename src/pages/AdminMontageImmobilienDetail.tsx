import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, User, Plus } from 'lucide-react';
import { JOB_STATUS_LABELS } from '@/types/montage';
import type { JobStatus } from '@/types/montage';
import { useState } from 'react';
import CreateJobWizard from '@/components/montage/CreateJobWizard';

const statusColor: Record<JobStatus, string> = {
  neu: 'bg-muted text-muted-foreground',
  ausfuehrung: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  nacharbeiten: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  abgeschlossen: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const AdminMontageImmobilienDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, client:clients(id, company_name, contact_id, contact:contacts(first_name, last_name))')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { jobs } = useJobs();
  const propertyJobs = jobs.filter((j) => j.property_id === id);

  if (isLoading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!property) return <div className="p-4"><p className="text-muted-foreground">Immobilie nicht gefunden.</p></div>;

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/montage/immobilien')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {property.street_address}, {property.postal_code} {property.city}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {property.property_type && <p className="text-muted-foreground">Typ: {property.property_type}</p>}
          {property.old_heating && <p className="text-muted-foreground">Alte Heizung: {property.old_heating}</p>}
          {(property as any).client && (
            <p className="flex items-center gap-2 cursor-pointer hover:text-primary" onClick={() => navigate(`/admin/montage/kunden/${(property as any).client.id}`)}>
              <User className="h-4 w-4 text-muted-foreground" />
              {(property as any).client.contact?.first_name} {(property as any).client.contact?.last_name}
              {(property as any).client.company_name ? ` · ${(property as any).client.company_name}` : ''}
            </p>
          )}
          {property.notes && <p className="text-muted-foreground">{property.notes}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Aufträge</h3>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setWizardOpen(true)}>
          <Plus className="h-4 w-4" /> Neuer Auftrag
        </Button>
      </div>

      {propertyJobs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Keine Aufträge für diese Immobilie.</p>
      ) : (
        <div className="space-y-2">
          {propertyJobs.map((j) => (
            <Card key={j.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/admin/montage/job/${j.id}`)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{j.title || 'Ohne Titel'}</p>
                  <p className="text-xs text-muted-foreground">{j.job_number}</p>
                </div>
                <Badge variant="secondary" className={statusColor[j.status]}>{JOB_STATUS_LABELS[j.status]}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateJobWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        preselectedClient={(property as any).client || undefined}
        preselectedProperty={property as any}
      />
    </div>
  );
};

export default AdminMontageImmobilienDetail;
