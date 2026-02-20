import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { useProperties } from '@/hooks/useProperties';
import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, MapPin, Mail, Phone, Building } from 'lucide-react';
import { JOB_STATUS_LABELS } from '@/types/montage';
import type { JobStatus } from '@/types/montage';
import CreatePropertyDialog from '@/components/montage/CreatePropertyDialog';
import CreateJobWizard from '@/components/montage/CreateJobWizard';

const statusColor: Record<JobStatus, string> = {
  neu: 'bg-muted text-muted-foreground',
  ausfuehrung: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  nacharbeiten: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  abgeschlossen: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const AdminMontageKundenDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClients();
  const client = clients.find((c) => c.id === id);
  const { properties, loading: propsLoading } = useProperties(id);
  const { jobs } = useJobs();
  const [propDialogOpen, setPropDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardProperty, setWizardProperty] = useState<any>(null);

  if (clientsLoading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!client) return <div className="p-4"><p className="text-muted-foreground">Kunde nicht gefunden.</p></div>;

  const contact = client.contact;

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/montage/kunden')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{contact?.first_name} {contact?.last_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {client.company_name && <p className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /> {client.company_name}</p>}
          {client.billing_street && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {client.billing_street}, {client.billing_postal_code} {client.billing_city}</p>}
          {contact?.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {contact.email}</p>}
          {contact?.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {contact.phone}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Immobilien (Einsatzorte)</h3>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setPropDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Neue Immobilie
        </Button>
      </div>

      {propsLoading ? (
        <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : properties.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Immobilien angelegt.</p>
      ) : (
        properties.map((prop) => {
          const propJobs = jobs.filter((j) => j.property_id === prop.id);
          return (
            <Card key={prop.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 cursor-pointer hover:text-primary" onClick={() => navigate(`/admin/montage/immobilien/${prop.id}`)}>
                  <MapPin className="h-4 w-4" />
                  {prop.street_address}, {prop.postal_code} {prop.city}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {propJobs.length > 0 ? propJobs.map((j) => (
                  <div key={j.id} className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded" onClick={() => navigate(`/admin/montage/job/${j.id}`)}>
                    <div>
                      <p className="text-sm font-medium">{j.title || 'Ohne Titel'}</p>
                      <p className="text-xs text-muted-foreground">{j.job_number}</p>
                    </div>
                    <Badge variant="secondary" className={statusColor[j.status]}>{JOB_STATUS_LABELS[j.status]}</Badge>
                  </div>
                )) : <p className="text-xs text-muted-foreground">Keine Aufträge</p>}
                <Button size="sm" variant="ghost" className="gap-2 w-full" onClick={() => { setWizardProperty(prop); setWizardOpen(true); }}>
                  <Plus className="h-3 w-3" /> Neuer Auftrag
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}

      <CreatePropertyDialog open={propDialogOpen} onOpenChange={setPropDialogOpen} client={client} />
      <CreateJobWizard open={wizardOpen} onOpenChange={setWizardOpen} preselectedClient={client} preselectedProperty={wizardProperty} />
    </div>
  );
};

export default AdminMontageKundenDetail;
