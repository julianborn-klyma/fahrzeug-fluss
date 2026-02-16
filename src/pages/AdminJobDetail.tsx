import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { useJobs } from '@/hooks/useJobs';
import { useJobDocuments } from '@/hooks/useJobDocuments';
import { useJobChecklists } from '@/hooks/useJobChecklists';
import { useTradeAppointments } from '@/hooks/useTradeAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, FileText, CheckSquare, Calendar } from 'lucide-react';
import { JOB_STATUS_LABELS } from '@/types/montage';

const AdminJobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, loading } = useJobs();
  const { documents } = useJobDocuments(id);
  const { checklists } = useJobChecklists(id);
  const { data: appointments } = useTradeAppointments(id);

  const job = jobs.find((j) => j.id === id);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!job) {
    return (
      <AdminLayout>
        <div className="p-4">
          <Button variant="ghost" onClick={() => navigate('/admin/montage')} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Button>
          <p className="text-center text-muted-foreground">Auftrag nicht gefunden.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/montage')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{job.title || 'Ohne Titel'}</h2>
            <p className="text-sm text-muted-foreground">{job.job_number}</p>
          </div>
          <Badge>{JOB_STATUS_LABELS[job.status]}</Badge>
        </div>

        {job.property && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {job.property.street_address}, {job.property.postal_code} {job.property.city}
          </p>
        )}

        {job.description && (
          <p className="text-sm">{job.description}</p>
        )}

        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="h-4 w-4" /> Termine ({appointments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" /> Dokumente ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="checklists" className="gap-2">
              <CheckSquare className="h-4 w-4" /> Checklisten ({checklists.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            {(appointments?.length || 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Keine Termine geplant.</p>
            ) : (
              <div className="space-y-2">
                {appointments!.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <Badge variant="outline">{a.trade}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(a.start_date).toLocaleDateString('de-DE')} – {new Date(a.end_date).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      {a.notes && <p className="text-xs mt-1">{a.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Keine Dokumente vorhanden.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((d) => (
                  <Card key={d.id}>
                    <CardContent className="p-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{d.file_name}</span>
                      {d.trade && <Badge variant="outline" className="text-xs">{d.trade}</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="checklists">
            {checklists.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Keine Checklisten vorhanden.</p>
            ) : (
              <div className="space-y-2">
                {checklists.map((cl) => {
                  const total = cl.steps?.length || 0;
                  const done = cl.steps?.filter((s) => s.is_completed).length || 0;
                  return (
                    <Card key={cl.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{cl.name}</span>
                          <span className="text-xs text-muted-foreground">{done}/{total}</span>
                        </div>
                        {cl.trade && <Badge variant="outline" className="text-xs mt-1">{cl.trade}</Badge>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminJobDetail;
