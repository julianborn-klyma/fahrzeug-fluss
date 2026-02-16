import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAssignedJobs } from '@/hooks/useJobs';
import { useJobDocuments } from '@/hooks/useJobDocuments';
import { useJobChecklists } from '@/hooks/useJobChecklists';
import MonteurBottomNav from '@/components/MonteurBottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, FileText, CheckSquare, Download, Info } from 'lucide-react';
import { JOB_STATUS_LABELS } from '@/types/montage';
import { toast } from 'sonner';

const MonteurJobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: jobs, isLoading } = useAssignedJobs(user?.id);
  const { documents, getDownloadUrl } = useJobDocuments(id);
  const { checklists, updateStep } = useJobChecklists(id);

  const job = jobs?.find((j) => j.id === id);

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getDownloadUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Download nicht möglich.');
    }
  };

  const handleToggleStep = async (stepId: string, currentCompleted: boolean) => {
    try {
      await updateStep.mutateAsync({
        id: stepId,
        is_completed: !currentCompleted,
        completed_at: !currentCompleted ? new Date().toISOString() : null,
        completed_by: !currentCompleted ? user?.id || null : null,
      });
    } catch {
      toast.error('Fehler beim Aktualisieren.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <MonteurBottomNav active="montage" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-card px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/montage')} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
      </header>

      <div className="p-4 space-y-4">
        {!job ? (
          <p className="text-center text-muted-foreground py-12">Auftrag nicht gefunden.</p>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-bold">{job.title || 'Ohne Titel'}</h2>
              <p className="text-sm text-muted-foreground">{job.job_number}</p>
              <Badge variant="secondary" className="mt-1">{JOB_STATUS_LABELS[job.status]}</Badge>
            </div>

            {job.property && (
              <Card>
                <CardContent className="p-3">
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {job.property.street_address}, {job.property.postal_code} {job.property.city}
                  </p>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="info" className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="info" className="flex-1 gap-1">
                  <Info className="h-4 w-4" /> Info
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex-1 gap-1">
                  <FileText className="h-4 w-4" /> Dokumente
                </TabsTrigger>
                <TabsTrigger value="checklists" className="flex-1 gap-1">
                  <CheckSquare className="h-4 w-4" /> Checklisten
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                {job.description ? (
                  <p className="text-sm">{job.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Beschreibung.</p>
                )}
                {job.trades.length > 0 && (
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {job.trades.map((t) => (
                      <Badge key={t} variant="outline">{t}</Badge>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Dokumente vorhanden.</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((d) => (
                      <Card key={d.id}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">{d.file_name}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(d.file_path, d.file_name)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="checklists">
                {checklists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Checklisten vorhanden.</p>
                ) : (
                  <div className="space-y-4">
                    {checklists.map((cl) => (
                      <Card key={cl.id}>
                        <CardContent className="p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{cl.name}</span>
                            {cl.trade && <Badge variant="outline" className="text-xs">{cl.trade}</Badge>}
                          </div>
                          {cl.steps?.map((step) => (
                            <div key={step.id} className="flex items-start gap-2">
                              <Checkbox
                                checked={step.is_completed}
                                onCheckedChange={() => handleToggleStep(step.id, step.is_completed)}
                                className="mt-0.5"
                              />
                              <span className={`text-sm ${step.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                {step.title}
                                {step.is_required && <span className="text-destructive ml-1">*</span>}
                              </span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <MonteurBottomNav active="montage" />
    </div>
  );
};

export default MonteurJobDetail;
