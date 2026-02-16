import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { useJobDocuments } from '@/hooks/useJobDocuments';
import { useJobChecklists } from '@/hooks/useJobChecklists';
import { useJobAppointments } from '@/hooks/useJobAppointments';
import { useOrderTypes } from '@/hooks/useOrderTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, FileText, CheckSquare, Calendar, Plus, CheckCircle2, XCircle, Download, Trash2, Upload } from 'lucide-react';
import AppointmentCard from '@/components/montage/AppointmentCard';
import { Label } from '@/components/ui/label';
import { JOB_STATUS_LABELS, TRADE_LABELS, type TradeType } from '@/types/montage';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AdminJobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, loading } = useJobs();
  const { documents, uploadDocument, deleteDocument, getDownloadUrl } = useJobDocuments(id);
  const { checklists } = useJobChecklists(id);
  const { appointments, createJobAppointment } = useJobAppointments(id);
  const { orderTypes } = useOrderTypes();

  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [selectedAppTypeId, setSelectedAppTypeId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reqFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocTypeId, setUploadingDocTypeId] = useState<string | null>(null);

  const job = jobs.find((j) => j.id === id);

  // Get all available appointment types for the job's order type
  const jobOrderType = orderTypes.find(ot => ot.id === job?.order_type_id);
  const availableAppTypes = jobOrderType?.appointment_types?.filter((at: any) => at.is_active !== false) || [];
  // Also get all order types' appointment types for manual add
  const allAppTypes = orderTypes.flatMap(ot => (ot.appointment_types || []).filter((at: any) => at.is_active !== false));

  // Collect required documents across all appointment types
  const requiredDocs: { docTypeName: string; docTypeId: string; appointmentName: string; uploaded: boolean }[] = [];
  for (const appt of appointments) {
    const reqDocs = appt.appointment_type?.required_documents || [];
    for (const rd of reqDocs) {
      const dt = (rd as any).document_types || rd.document_type;
      const docTypeId = rd.document_type_id;
      const uploaded = documents.some(d => d.document_type_id === docTypeId);
      requiredDocs.push({
        docTypeName: dt?.name || 'Unbekannt',
        docTypeId,
        appointmentName: appt.appointment_type?.name || '',
        uploaded,
      });
    }
  }

  const handleAddAppointment = async () => {
    if (!selectedAppTypeId || !id) return;
    try {
      await createJobAppointment.mutateAsync({ job_id: id, appointment_type_id: selectedAppTypeId });
      setShowAddAppointment(false);
      setSelectedAppTypeId('');
      toast.success('Termin hinzugefügt.');
    } catch { toast.error('Fehler.'); }
  };

  const handleFileUpload = async (file: File, documentTypeId?: string) => {
    if (!id) return;
    try {
      await uploadDocument.mutateAsync({ jobId: id, file, documentTypeId });
      toast.success('Dokument hochgeladen.');
    } catch { toast.error('Fehler beim Hochladen.'); }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getDownloadUrl(filePath);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.target = '_blank';
      a.click();
    } else {
      toast.error('Download-Link konnte nicht erstellt werden.');
    }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    if (!confirm('Dokument wirklich löschen?')) return;
    try {
      await deleteDocument.mutateAsync({ id: docId, filePath });
      toast.success('Dokument gelöscht.');
    } catch { toast.error('Fehler beim Löschen.'); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate('/admin/montage')} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <p className="text-center text-muted-foreground">Auftrag nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/montage')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold">{job.title || 'Ohne Titel'}</h2>
          <p className="text-sm text-muted-foreground">{job.job_number}</p>
          {job.order_type && <Badge variant="secondary" className="mt-1">{job.order_type.name}</Badge>}
        </div>
        <Badge>{JOB_STATUS_LABELS[job.status]}</Badge>
      </div>

      {job.property && (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {job.property.street_address}, {job.property.postal_code} {job.property.city}
        </p>
      )}

      {job.description && <p className="text-sm">{job.description}</p>}

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" /> Termine ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" /> Dokumente ({documents.length})
            {requiredDocs.length > 0 && (
              <Badge variant={requiredDocs.every(d => d.uploaded) ? 'default' : 'destructive'} className="ml-1 text-xs">
                {requiredDocs.filter(d => d.uploaded).length}/{requiredDocs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="checklists" className="gap-2">
            <CheckSquare className="h-4 w-4" /> Checklisten ({checklists.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <div className="space-y-2">
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Keine Termine angelegt.</p>
            ) : (
              appointments.map((a) => (
                <AppointmentCard key={a.id} appointment={a} />
              ))
            )}
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowAddAppointment(true)}>
              <Plus className="h-4 w-4" /> Termin hinzufügen
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }}
          />
          <input
            type="file"
            ref={reqFileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && uploadingDocTypeId) handleFileUpload(file, uploadingDocTypeId);
              e.target.value = '';
              setUploadingDocTypeId(null);
            }}
          />

          {requiredDocs.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-semibold">Erforderliche Dokumente</h4>
              {requiredDocs.map((rd, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {rd.uploaded ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span>{rd.docTypeName}</span>
                    <span className="text-xs text-muted-foreground">({rd.appointmentName})</span>
                  </div>
                  {!rd.uploaded && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 h-7 text-xs"
                      disabled={uploadDocument.isPending}
                      onClick={() => {
                        setUploadingDocTypeId(rd.docTypeId);
                        reqFileInputRef.current?.click();
                      }}
                    >
                      <Upload className="h-3 w-3" /> Hochladen
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {documents.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{d.file_name}</span>
                    {d.document_type && <Badge variant="secondary" className="text-xs">{d.document_type.name}</Badge>}
                    {d.trade && <Badge variant="outline" className="text-xs">{d.trade}</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(d.file_path, d.file_name)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(d.id, d.file_path)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 mt-3"
            disabled={uploadDocument.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="h-4 w-4" /> {uploadDocument.isPending ? 'Wird hochgeladen…' : 'Dokument hochladen'}
          </Button>
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

      {/* Add Appointment Dialog */}
      <Dialog open={showAddAppointment} onOpenChange={setShowAddAppointment}>
        <DialogContent>
          <DialogHeader><DialogTitle>Termin hinzufügen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Terminart</Label>
              <Select value={selectedAppTypeId} onValueChange={setSelectedAppTypeId}>
                <SelectTrigger><SelectValue placeholder="Terminart wählen…" /></SelectTrigger>
                <SelectContent>
                  {allAppTypes.map((at: any) => (
                    <SelectItem key={at.id} value={at.id}>
                      {at.name} {at.trade ? `(${TRADE_LABELS[at.trade as TradeType] || at.trade})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddAppointment} disabled={!selectedAppTypeId} className="w-full">Hinzufügen</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobDetail;
