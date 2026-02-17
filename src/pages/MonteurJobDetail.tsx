import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAssignedJobs } from '@/hooks/useJobs';
import { useJobDocuments } from '@/hooks/useJobDocuments';
import { useJobChecklists } from '@/hooks/useJobChecklists';
import { useJobAppointments } from '@/hooks/useJobAppointments';
import MonteurBottomNav from '@/components/MonteurBottomNav';
import DocumentPreviewDialog from '@/components/montage/DocumentPreviewDialog';
import ChecklistStepDetailSheet from '@/components/montage/ChecklistStepDetailSheet';
import SignaturePadDialog from '@/components/montage/SignaturePadDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, MapPin, FileText, CheckSquare, Download, Info, Eye, ChevronDown, PenLine, Check, AlertCircle, FolderOpen, Camera, Type } from 'lucide-react';
import { JOB_STATUS_LABELS } from '@/types/montage';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const MonteurJobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: jobs, isLoading } = useAssignedJobs(user?.id);
  const { documents, getDownloadUrl } = useJobDocuments(id);
  const { checklists, updateStep } = useJobChecklists(id);
  const { appointments, updateJobAppointment } = useJobAppointments(id);
  const [previewDocIndex, setPreviewDocIndex] = useState<number | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ fileName: string; url: string | null } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureSaving, setSignatureSaving] = useState(false);
  const queryClient = useQueryClient();

  // Flat list of all documents for arrow navigation
  const allDocsList = documents;

  // Group documents by appointment type
  const groupedDocuments = useMemo(() => {
    // Build a map: document_type_id -> appointment_type_name
    const docTypeToApptType = new Map<string, string>();
    for (const appt of appointments) {
      const typeName = appt.appointment_type?.name || 'Termin';
      const reqDocs = appt.appointment_type?.required_documents || [];
      for (const rd of reqDocs) {
        if (rd.document_type_id) {
          docTypeToApptType.set(rd.document_type_id, typeName);
        }
      }
    }

    const groups = new Map<string, typeof documents>();
    for (const doc of documents) {
      const groupName = (doc.document_type_id && docTypeToApptType.get(doc.document_type_id)) || 'Sonstige';
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName)!.push(doc);
    }
    return Array.from(groups.entries()).map(([name, docs]) => ({ name, docs }));
  }, [documents, appointments]);

  const openPreview = useCallback(async (doc: typeof documents[0], index: number) => {
    setPreviewDocIndex(index);
    setPreviewLoading(true);
    setPreviewDoc({ fileName: doc.file_name, url: null });
    const url = await getDownloadUrl(doc.file_path);
    setPreviewDoc({ fileName: doc.file_name, url: url || null });
    setPreviewLoading(false);
  }, [getDownloadUrl]);

  const navigatePreview = useCallback(async (newIndex: number) => {
    if (newIndex < 0 || newIndex >= allDocsList.length) return;
    const doc = allDocsList[newIndex];
    setPreviewDocIndex(newIndex);
    setPreviewLoading(true);
    setPreviewDoc({ fileName: doc.file_name, url: null });
    const url = await getDownloadUrl(doc.file_path);
    setPreviewDoc({ fileName: doc.file_name, url: url || null });
    setPreviewLoading(false);
  }, [allDocsList, getDownloadUrl]);

  const job = jobs?.find((j) => j.id === id);

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getDownloadUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Download nicht möglich.');
    }
  };
  const handleSignatureSave = useCallback(async (blob: Blob) => {
    if (!id) return;
    setSignatureSaving(true);
    try {
      const filePath = `${id}/signature_${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('signatures').upload(filePath, blob);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(filePath);
      const signatureUrl = urlData?.publicUrl || filePath;

      // Update all non-abgenommen appointments with the signature and set to review
      const apptToUpdate = appointments.filter((a: any) => a.status !== 'abgenommen');
      for (const appt of apptToUpdate) {
        await updateJobAppointment.mutateAsync({
          id: appt.id,
          status: 'review',
          signature_url: signatureUrl,
        } as any);
      }

      // Update job status to review
      await supabase.from('jobs').update({ status: 'review' } as any).eq('id', id);

      toast.success('Auftrag abgeschlossen und zur Prüfung eingereicht.');
      setShowSignature(false);
      navigate('/montage');
    } catch (err: any) {
      toast.error('Fehler beim Speichern: ' + (err.message || 'Unbekannter Fehler'));
    } finally {
      setSignatureSaving(false);
    }
  }, [id, appointments, updateJobAppointment, navigate]);
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
                  <div className="space-y-3">
                    {groupedDocuments.map((group) => (
                      <Collapsible key={group.name} defaultOpen>
                        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1.5 px-1 hover:bg-muted/50 rounded-md transition-colors">
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [&[data-state=open]]:rotate-0 [&[data-state=closed]]:-rotate-90" />
                          <span className="text-sm font-medium">{group.name}</span>
                          <Badge variant="secondary" className="text-xs ml-auto">{group.docs.length}</Badge>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1.5 mt-1.5 pl-2">
                          {group.docs.map((d) => {
                            const globalIndex = allDocsList.findIndex((doc) => doc.id === d.id);
                            return (
                              <Card key={d.id}>
                                <CardContent className="p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm truncate">{d.file_name}</span>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" onClick={() => openPreview(d, globalIndex)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDownload(d.file_path, d.file_name)}>
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="checklists">
                {checklists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Checklisten vorhanden.</p>
                ) : (
                  <div className="space-y-4">
                    {checklists.map((cl) => {
                      const allSteps: any[] = cl.steps || [];
                      const nonGroupSteps = allSteps.filter((s: any) => s.step_type !== 'group');
                      const stepsDone = nonGroupSteps.filter((s: any) => s.is_completed);
                      const pct = nonGroupSteps.length > 0 ? Math.round((stepsDone.length / nonGroupSteps.length) * 100) : 0;
                      const topLevel = allSteps.filter((s: any) => !s.parent_step_id);
                      const childrenOf = (parentId: string) => allSteps.filter((s: any) => s.parent_step_id === parentId);

                      // Flat list of actionable steps for navigation
                      const flatSteps = nonGroupSteps;

                      const renderStepRow = (step: any) => {
                        const flatIdx = flatSteps.findIndex((s: any) => s.id === step.id);
                        const statusIcon = step.is_completed
                          ? <Check className="h-4 w-4 text-green-600 shrink-0" />
                          : step.is_required
                            ? <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                            : <div className="h-4 w-4 shrink-0" />;

                        const typeIcon = step.step_type === 'photo'
                          ? <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                          : step.step_type === 'text'
                            ? <Type className="h-3.5 w-3.5 text-muted-foreground" />
                            : null;

                        const photos = (step.photo_urls?.filter(Boolean) || []);

                        return (
                          <div
                            key={step.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-md border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setSelectedChecklistId(cl.id);
                              setSelectedStepIndex(flatIdx >= 0 ? flatIdx : 0);
                            }}
                          >
                            {statusIcon}
                            {photos.length > 0 ? (
                              <img src={photos[0]} alt="" className="h-8 w-8 rounded object-cover shrink-0 border" />
                            ) : typeIcon ? (
                              <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center shrink-0">{typeIcon}</div>
                            ) : null}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{step.title}</p>
                              <p className={`text-xs ${step.is_completed ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {step.is_completed ? 'Erledigt' : 'Zu erledigen'}
                              </p>
                            </div>
                          </div>
                        );
                      };

                      return (
                        <div key={cl.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{cl.name}</span>
                            {cl.trade && <Badge variant="outline" className="text-xs">{cl.trade}</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground">{stepsDone.length}/{nonGroupSteps.length}</span>
                          </div>
                          <div className="space-y-1.5">
                            {topLevel.map((step: any) => {
                              if (step.step_type === 'group') {
                                const children = childrenOf(step.id);
                                const groupNonGroup = children.filter((c: any) => c.step_type !== 'group');
                                const groupDone = groupNonGroup.filter((c: any) => c.is_completed).length;
                                return (
                                  <Collapsible key={step.id} defaultOpen>
                                    <div className="rounded-md border overflow-hidden">
                                      <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center justify-between p-2.5 bg-muted/50 hover:bg-muted/80 transition-colors">
                                          <div className="flex items-center gap-2">
                                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{step.title}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Progress value={groupNonGroup.length > 0 ? Math.round((groupDone / groupNonGroup.length) * 100) : 0} className="h-1.5 w-16" />
                                            <span className="text-xs text-muted-foreground">{groupDone}/{groupNonGroup.length}</span>
                                          </div>
                                        </div>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="p-2 space-y-1.5">
                                          {children.map((child: any) => renderStepRow(child))}
                                          {children.length === 0 && (
                                            <p className="text-xs text-muted-foreground py-1 px-2">Keine Schritte.</p>
                                          )}
                                        </div>
                                      </CollapsibleContent>
                                    </div>
                                  </Collapsible>
                                );
                              }
                              return renderStepRow(step);
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {job.status !== 'abgeschlossen' && (job.status as string) !== 'review' && (
              <Button
                className="w-full gap-2 mt-2"
                size="lg"
                onClick={() => setShowSignature(true)}
              >
                <PenLine className="h-4 w-4" /> Auftrag abschließen & Unterschreiben
              </Button>
            )}
          </>
        )}
      </div>

      <DocumentPreviewDialog
        open={!!previewDoc}
        onOpenChange={(o) => { if (!o) { setPreviewDoc(null); setPreviewDocIndex(null); } }}
        fileName={previewDoc?.fileName || ''}
        fileUrl={previewDoc?.url || null}
        loading={previewLoading}
        hasPrev={previewDocIndex !== null && previewDocIndex > 0}
        hasNext={previewDocIndex !== null && previewDocIndex < allDocsList.length - 1}
        onPrev={() => previewDocIndex !== null && navigatePreview(previewDocIndex - 1)}
        onNext={() => previewDocIndex !== null && navigatePreview(previewDocIndex + 1)}
      />

      {(() => {
        const selectedChecklist = checklists.find((cl: any) => cl.id === selectedChecklistId);
        const flatSteps = selectedChecklist
          ? (selectedChecklist.steps || []).filter((s: any) => s.step_type !== 'group')
          : [];
        const currentStep = selectedStepIndex !== null && flatSteps[selectedStepIndex] ? flatSteps[selectedStepIndex] : null;
        return (
          <ChecklistStepDetailSheet
            step={currentStep}
            open={selectedStepIndex !== null && !!selectedChecklistId}
            onOpenChange={(o) => { if (!o) { setSelectedStepIndex(null); setSelectedChecklistId(null); } }}
            allSteps={flatSteps}
            currentIndex={selectedStepIndex ?? 0}
            onNavigate={setSelectedStepIndex}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['job-checklists', id] })}
            checklistName={selectedChecklist?.name || ''}
          />
        );
      })()}

      <SignaturePadDialog
        open={showSignature}
        onOpenChange={setShowSignature}
        onSave={handleSignatureSave}
        saving={signatureSaving}
      />

      <MonteurBottomNav active="montage" />
    </div>
  );
};

export default MonteurJobDetail;
