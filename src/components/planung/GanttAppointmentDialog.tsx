import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar, Users, CheckSquare, Plus, Eye, Trash2, X, ExternalLink,
  AlertCircle, CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TRADE_LABELS, type TradeType } from '@/types/montage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ChecklistDetailDialog from '@/components/montage/ChecklistDetailDialog';

interface Props {
  appointmentId: string | null;
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from '@/types/montage';

const STATUS_VARIANTS: Record<AppointmentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  neu: 'outline',
  in_planung: 'secondary',
  vorbereitet: 'secondary',
  in_umsetzung: 'secondary',
  review: 'secondary',
  abgenommen: 'default',
};

const GanttAppointmentDialog = ({ appointmentId, jobId, open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddMonteur, setShowAddMonteur] = useState(false);
  const [selectedMonteurId, setSelectedMonteurId] = useState('');
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [viewChecklistId, setViewChecklistId] = useState<string | null>(null);

  // Fetch full appointment data
  const { data: appointment, isLoading } = useQuery({
    queryKey: ['gantt-appointment-detail', appointmentId],
    enabled: !!appointmentId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_appointments')
        .select('*, appointment_types(*, appointment_type_fields(*), appointment_type_documents(document_type_id)), jobs(title, job_number)')
        .eq('id', appointmentId!)
        .single();
      if (error) throw error;

      // Fetch assignments, checklists & job documents
      const [assignRes, checkRes, docRes] = await Promise.all([
        supabase.from('job_appointment_assignments').select('*').eq('job_appointment_id', appointmentId!),
        supabase.from('job_checklists').select('*, job_checklist_steps(*)').eq('appointment_id', appointmentId!).order('created_at'),
        supabase.from('job_documents').select('id, document_type_id').eq('job_id', data.job_id),
      ]);

      const reqDocs = data.appointment_types?.appointment_type_documents || [];
      const jobDocs = docRes.data || [];
      const apptChecklists = (checkRes.data || []).map((cl: any) => ({
        ...cl,
        steps: ((cl as any).job_checklist_steps || []).sort((a: any, b: any) => a.order_index - b.order_index),
      }));
      const apptFields = (data.appointment_types?.appointment_type_fields || []).sort((a: any, b: any) => a.display_order - b.display_order);
      const fv = (data.field_values as any) || {};
      const hasMissingDocs = reqDocs.some((rd: any) => !jobDocs.some((d: any) => d.document_type_id === rd.document_type_id));
      const hasMissingChecklists = apptChecklists.length === 0;
      const hasMissingFields = apptFields.some((f: any) => f.is_required && !fv[f.id]?.toString().trim());

      return {
        ...data,
        assignments: assignRes.data || [],
        checklists: apptChecklists,
        appointment_type: data.appointment_types ? {
          ...data.appointment_types,
          fields: apptFields,
          required_documents: reqDocs,
        } : undefined,
        isIncomplete: hasMissingDocs || hasMissingChecklists || hasMissingFields,
      };
    },
  });

  const a = appointment;

  // Date state
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');

  useEffect(() => {
    if (a) {
      setStartDate(a.start_date ? new Date(a.start_date) : undefined);
      setEndDate(a.end_date ? new Date(a.end_date) : undefined);
      setStartTime(a.start_date ? format(new Date(a.start_date), 'HH:mm') : '08:00');
      setEndTime(a.end_date ? format(new Date(a.end_date), 'HH:mm') : '16:00');
    }
  }, [a]);

  const { data: monteurProfiles } = useQuery({
    queryKey: ['monteur-profiles-for-assignment'],
    enabled: showAddMonteur,
    queryFn: async () => {
      const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'monteur' as any);
      if (!roles?.length) return [];
      const { data: profiles } = await supabase.from('profiles').select('user_id, name, email').in('user_id', roles.map(r => r.user_id)).order('name');
      return profiles || [];
    },
  });

  const { data: checklistTemplates } = useQuery({
    queryKey: ['checklist-templates-for-add'],
    enabled: showAddChecklist,
    queryFn: async () => {
      const { data } = await supabase.from('checklist_templates').select('*, checklist_template_steps(*)').order('name');
      return data || [];
    },
  });

  if (!a) return null;

  const fields = a.appointment_type?.fields || [];
  const fieldValues = a.field_values || {};
  const assignments = a.assignments || [];
  const checklists: any[] = a.checklists || [];
  const isInternal = a.is_internal !== null && a.is_internal !== undefined ? a.is_internal : (a.appointment_type?.is_internal ?? false);

  const requiredFields = fields.filter((f: any) => f.is_required);
  const filledRequired = requiredFields.filter((f: any) => {
    const val = fieldValues[f.id];
    return val !== undefined && val !== null && val !== '';
  });
  const isFieldsComplete = requiredFields.length === 0 || filledRequired.length === requiredFields.length;

  const totalSteps = checklists.reduce((sum: number, cl: any) => sum + (cl.steps?.length || 0), 0);
  const doneSteps = checklists.reduce((sum: number, cl: any) => sum + (cl.steps?.filter((s: any) => s.is_completed)?.length || 0), 0);
  const checklistPercent = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['gantt-appointment-detail'] });
    queryClient.invalidateQueries({ queryKey: ['planung-scheduled'] });
    queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
  };

  const toggleInternal = async (val: boolean) => {
    try {
      await supabase.from('job_appointments').update({ is_internal: val } as any).eq('id', a.id);
      invalidate();
      toast.success(val ? 'Auf Intern gesetzt.' : 'Auf Extern gesetzt.');
    } catch { toast.error('Fehler.'); }
  };

  const saveDate = async () => {
    if (!startDate || !endDate) return;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const sd = new Date(startDate); sd.setHours(sh, sm, 0, 0);
    const ed = new Date(endDate); ed.setHours(eh, em, 0, 0);
    try {
      await supabase.from('job_appointments').update({ start_date: sd.toISOString(), end_date: ed.toISOString() } as any).eq('id', a.id);
      invalidate();
      toast.success('Datum gespeichert.');
    } catch { toast.error('Fehler.'); }
  };

  const handleAddMonteur = async () => {
    if (!selectedMonteurId) return;
    const profile = (monteurProfiles || []).find((p: any) => p.user_id === selectedMonteurId);
    try {
      await supabase.from('job_appointment_assignments').insert({ job_appointment_id: a.id, person_id: selectedMonteurId, person_name: profile?.name || '' } as any);
      invalidate();
      setSelectedMonteurId('');
      setShowAddMonteur(false);
      toast.success('Monteur zugeordnet.');
    } catch { toast.error('Fehler.'); }
  };

  const handleRemoveMonteur = async (assignmentId: string) => {
    try {
      await supabase.from('job_appointment_assignments').delete().eq('id', assignmentId);
      invalidate();
      toast.success('Zuordnung entfernt.');
    } catch { toast.error('Fehler.'); }
  };

  const handleAddChecklist = async () => {
    if (!selectedTemplateId || !jobId) return;
    const template = (checklistTemplates || []).find((t: any) => t.id === selectedTemplateId);
    if (!template) return;
    try {
      const { data: cl, error } = await supabase.from('job_checklists').insert({
        job_id: jobId, appointment_id: a.id, template_id: template.id, name: template.name, trade: template.trade,
      } as any).select().single();
      if (error) throw error;

      const templateSteps = (template.checklist_template_steps || []).sort((x: any, y: any) => x.order_index - y.order_index);
      const stepsToInsert = templateSteps.map((s: any) => ({
        checklist_id: cl.id, template_step_id: s.id, title: s.title, step_type: s.step_type, order_index: s.order_index, is_required: s.is_required,
      }));
      if (stepsToInsert.length > 0) {
        await supabase.from('job_checklist_steps').insert(stepsToInsert as any);
      }
      invalidate();
      setShowAddChecklist(false);
      setSelectedTemplateId('');
      toast.success('Checkliste hinzugefügt.');
    } catch { toast.error('Fehler.'); }
  };

  const getChecklistGroupProgress = (cl: any) => {
    const groupSteps = (cl.steps || []).filter((s: any) => s.step_type === 'group');
    return groupSteps.map((g: any) => {
      const children = (cl.steps || []).filter((s: any) => s.parent_step_id === g.id);
      const gDone = children.filter((c: any) => c.is_completed).length;
      const gTotal = children.length;
      return { id: g.id, title: g.title, done: gDone, total: gTotal, percent: gTotal > 0 ? Math.round((gDone / gTotal) * 100) : 0 };
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              {a.appointment_type?.name || 'Termin'}
              {a.appointment_type?.trade && (
                <Badge variant="outline" className="text-xs">{TRADE_LABELS[a.appointment_type.trade as TradeType] || a.appointment_type.trade}</Badge>
              )}
              <Badge variant={STATUS_VARIANTS[(a.status as AppointmentStatus)] || 'outline'} className="text-xs ml-auto">{APPOINTMENT_STATUS_LABELS[(a.status as AppointmentStatus)] || a.status}</Badge>
              {a.isIncomplete && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertCircle className="h-3 w-3" /> Unvollständig
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <Label className="text-xs text-muted-foreground">Extern</Label>
              <Switch checked={isInternal} onCheckedChange={toggleInternal} />
              <Label className="text-xs text-muted-foreground">Intern</Label>
            </div>
            {/* Job info + navigate button */}
            {(a as any).jobs && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {(a as any).jobs.title} (#{(a as any).jobs.job_number})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/admin/montage/job/${jobId}`);
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Zum Auftrag
                </Button>
              </div>
            )}
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="checklists" className="flex-1">
                Checklisten
                {totalSteps > 0 && (
                  <Badge variant={checklistPercent === 100 ? 'default' : 'secondary'} className="ml-1.5 text-[10px] px-1.5 py-0">
                    {doneSteps}/{totalSteps}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-3">
              {/* Date & Time */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Datum & Uhrzeit
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Startdatum</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left text-xs h-8", !startDate && "text-muted-foreground")}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {startDate ? format(startDate, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs">Startzeit</Label>
                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Enddatum</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left text-xs h-8", !endDate && "text-muted-foreground")}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {endDate ? format(endDate, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs">Endzeit</Label>
                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <Button size="sm" className="mt-2 h-7 text-xs" onClick={saveDate} disabled={!startDate || !endDate}>
                  Datum speichern
                </Button>
              </section>

              <Separator />

              {/* Monteure */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Zugewiesene Monteure
                  </h4>
                  <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowAddMonteur(true)}>
                    <Plus className="h-3 w-3" /> Zuweisen
                  </Button>
                </div>
                {assignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Keine Monteure zugeordnet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {assignments.map((ass: any) => (
                      <Badge key={ass.id} variant="secondary" className="gap-1 pr-1">
                        {ass.person_name || '?'}
                        <button className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5" onClick={() => handleRemoveMonteur(ass.id)}>
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </section>

              <Separator />

              {/* Fields */}
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Felder</h4>
                {fields.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {fields.map((f: any) => {
                        const val = fieldValues[f.id];
                        const isEmpty = val === undefined || val === null || val === '';
                        return (
                          <div key={f.id} className="text-sm">
                            <span className="text-muted-foreground text-xs">
                              {f.label}
                              {f.is_required && <span className="text-destructive ml-0.5">*</span>}
                            </span>
                            <p className={cn("font-medium text-sm", isEmpty && "text-muted-foreground/50 italic")}>
                              {isEmpty ? '—' : String(val)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    {requiredFields.length > 0 && (
                      <div className="flex items-center gap-2 text-xs mt-2">
                        {isFieldsComplete ? (
                          <span className="flex items-center gap-1 text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> Alle Pflichtfelder ausgefüllt</span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3.5 w-3.5" /> {requiredFields.length - filledRequired.length} offen</span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Keine Felder definiert.</p>
                )}
              </section>

              {a.notes && (
                <>
                  <Separator />
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notizen</h4>
                    <p className="text-sm">{a.notes}</p>
                  </section>
                </>
              )}
            </TabsContent>

            <TabsContent value="checklists" className="space-y-4 mt-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <CheckSquare className="h-3.5 w-3.5" /> Checklisten
                </h4>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowAddChecklist(true)}>
                  <Plus className="h-3 w-3" /> Hinzufügen
                </Button>
              </div>

              {checklists.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Keine Checklisten zugeordnet.</p>
              ) : (
                <div className="space-y-2">
                  {checklists.map((cl: any) => {
                    const clTotal = cl.steps?.length || 0;
                    const clDone = cl.steps?.filter((s: any) => s.is_completed)?.length || 0;
                    const clPercent = clTotal > 0 ? Math.round((clDone / clTotal) * 100) : 0;
                    const groups = getChecklistGroupProgress(cl);
                    return (
                      <div key={cl.id} className="rounded-md border bg-muted/30 p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{cl.name}</span>
                            {cl.trade && <Badge variant="outline" className="text-xs">{cl.trade}</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground font-medium">{clDone}/{clTotal}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewChecklistId(cl.id)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                              onClick={async () => {
                                if (!confirm('Checkliste wirklich löschen?')) return;
                                try {
                                  await supabase.from('job_checklists').delete().eq('id', cl.id);
                                  invalidate();
                                  toast.success('Gelöscht.');
                                } catch { toast.error('Fehler.'); }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={clPercent} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">{clPercent}%</span>
                        </div>
                        {groups.length > 0 && (
                          <div className="space-y-0.5 mt-1">
                            {groups.map(g => (
                              <div key={g.id} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground truncate flex-1">{g.title}</span>
                                <Progress value={g.percent} className="h-1 w-16" />
                                <span className="text-muted-foreground">{g.done}/{g.total}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add Monteur Dialog */}
      <Dialog open={showAddMonteur} onOpenChange={setShowAddMonteur}>
        <DialogContent>
          <DialogHeader><DialogTitle>Monteur zuweisen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={selectedMonteurId} onValueChange={setSelectedMonteurId}>
              <SelectTrigger><SelectValue placeholder="Monteur wählen…" /></SelectTrigger>
              <SelectContent>
                {(monteurProfiles || [])
                  .filter((p: any) => !assignments.some((ass: any) => ass.person_id === p.user_id))
                  .map((p: any) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.name || p.email}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddMonteur} disabled={!selectedMonteurId} className="w-full">Zuweisen</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Checklist Dialog */}
      <Dialog open={showAddChecklist} onOpenChange={setShowAddChecklist}>
        <DialogContent>
          <DialogHeader><DialogTitle>Checkliste hinzufügen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger><SelectValue placeholder="Vorlage wählen…" /></SelectTrigger>
              <SelectContent>
                {(checklistTemplates || []).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} {t.trade ? `(${t.trade})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddChecklist} disabled={!selectedTemplateId} className="w-full">Hinzufügen</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist Detail */}
      <ChecklistDetailDialog checklistId={viewChecklistId} open={!!viewChecklistId} onOpenChange={o => { if (!o) setViewChecklistId(null); }} />
    </>
  );
};

export default GanttAppointmentDialog;
