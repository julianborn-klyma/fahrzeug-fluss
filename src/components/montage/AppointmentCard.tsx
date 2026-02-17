import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, ChevronDown, ChevronRight, Users, AlertCircle, CheckCircle2, CheckSquare, Plus, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TRADE_LABELS, type TradeType } from '@/types/montage';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import ChecklistDetailDialog from './ChecklistDetailDialog';

interface AppointmentCardProps {
  appointment: any;
  jobId?: string;
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  offen: 'outline',
  geplant: 'secondary',
  abgeschlossen: 'default',
  abgesagt: 'destructive',
};

const AppointmentCard = ({ appointment: a, jobId }: AppointmentCardProps) => {
  const [open, setOpen] = useState(false);
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [viewChecklist, setViewChecklist] = useState<any>(null);
  const queryClient = useQueryClient();

  // Date picker state
  const [startDate, setStartDate] = useState<Date | undefined>(a.start_date ? new Date(a.start_date) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(a.end_date ? new Date(a.end_date) : undefined);
  const [startTime, setStartTime] = useState(a.start_date ? format(new Date(a.start_date), 'HH:mm') : '08:00');
  const [endTime, setEndTime] = useState(a.end_date ? format(new Date(a.end_date), 'HH:mm') : '16:00');

  const fields = a.appointment_type?.fields || [];
  const fieldValues = a.field_values || {};
  const assignments = a.assignments || [];
  const checklists: any[] = a.checklists || [];

  const { data: checklistTemplates } = useQuery({
    queryKey: ['checklist-templates-for-add'],
    enabled: showAddChecklist,
    queryFn: async () => {
      const { data } = await supabase
        .from('checklist_templates')
        .select('*, checklist_template_steps(*)')
        .order('name');
      return data || [];
    },
  });

  const requiredFields = fields.filter((f: any) => f.is_required);
  const filledRequired = requiredFields.filter((f: any) => {
    const val = fieldValues[f.id];
    return val !== undefined && val !== null && val !== '';
  });
  const isFieldsComplete = requiredFields.length === 0 || filledRequired.length === requiredFields.length;
  const hasDateSet = !!a.start_date && !!a.end_date;

  const totalSteps = checklists.reduce((sum: number, cl: any) => sum + (cl.steps?.length || 0), 0);
  const doneSteps = checklists.reduce((sum: number, cl: any) => sum + (cl.steps?.filter((s: any) => s.is_completed)?.length || 0), 0);

  const saveDate = async () => {
    if (!startDate || !endDate) return;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const sd = new Date(startDate);
    sd.setHours(sh, sm, 0, 0);
    const ed = new Date(endDate);
    ed.setHours(eh, em, 0, 0);
    try {
      await supabase.from('job_appointments').update({
        start_date: sd.toISOString(),
        end_date: ed.toISOString(),
      } as any).eq('id', a.id);
      queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
      toast.success('Datum gespeichert.');
    } catch { toast.error('Fehler.'); }
  };

  const handleAddChecklist = async () => {
    if (!selectedTemplateId || !jobId) return;
    const template = (checklistTemplates || []).find((t: any) => t.id === selectedTemplateId);
    if (!template) return;
    try {
      const { data: cl, error } = await supabase
        .from('job_checklists')
        .insert({
          job_id: jobId,
          appointment_id: a.id,
          template_id: template.id,
          name: template.name,
          trade: template.trade,
        } as any)
        .select()
        .single();
      if (error) throw error;
      
      const templateSteps = (template.checklist_template_steps || [])
        .sort((a: any, b: any) => a.order_index - b.order_index);
      
      // First pass: insert all steps without parent_step_id
      const stepsToInsert = templateSteps.map((s: any) => ({
        checklist_id: cl.id,
        template_step_id: s.id,
        title: s.title,
        step_type: s.step_type,
        order_index: s.order_index,
        is_required: s.is_required,
      }));
      
      if (stepsToInsert.length > 0) {
        const { data: insertedSteps } = await supabase
          .from('job_checklist_steps')
          .insert(stepsToInsert as any)
          .select();
        
        // Second pass: update parent_step_id mapping
        if (insertedSteps) {
          const templateToJobMap: Record<string, string> = {};
          for (const step of insertedSteps) {
            if ((step as any).template_step_id) {
              templateToJobMap[(step as any).template_step_id] = step.id;
            }
          }
          
          // Update children with correct parent_step_id
          for (const ts of templateSteps) {
            if (ts.parent_step_id && templateToJobMap[ts.parent_step_id] && templateToJobMap[ts.id]) {
              await supabase.from('job_checklist_steps')
                .update({ parent_step_id: templateToJobMap[ts.parent_step_id] } as any)
                .eq('id', templateToJobMap[ts.id]);
            }
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
      setShowAddChecklist(false);
      setSelectedTemplateId('');
      toast.success('Checkliste hinzugefügt.');
    } catch {
      toast.error('Fehler beim Hinzufügen.');
    }
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardContent className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="mt-0.5">
                    {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{a.appointment_type?.name || 'Termin'}</span>
                      {a.appointment_type?.trade && (
                        <Badge variant="outline" className="text-xs">
                          {TRADE_LABELS[a.appointment_type.trade as TradeType] || a.appointment_type.trade}
                        </Badge>
                      )}
                      {a.appointment_type?.is_internal && (
                        <Badge variant="default" className="text-xs bg-amber-500 hover:bg-amber-600">Intern</Badge>
                      )}
                      {checklists.length > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <CheckSquare className="h-3 w-3" /> {doneSteps}/{totalSteps}
                        </Badge>
                      )}
                    </div>

                    {hasDateSet ? (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(a.start_date), 'dd.MM.yyyy', { locale: de })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(a.start_date), 'HH:mm', { locale: de })}
                          {a.end_date && ` – ${format(new Date(a.end_date), 'HH:mm', { locale: de })}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Kein Datum gesetzt</span>
                    )}

                    {assignments.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{assignments.map((ass: any) => ass.person_name || 'Unbenannt').join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {requiredFields.length > 0 && (
                    isFieldsComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )
                  )}
                  <Badge variant={STATUS_VARIANTS[a.status] || 'outline'} className="text-xs">
                    {a.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
              {/* Date Picker */}
              <div className="border-b pb-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Datum & Uhrzeit
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                        <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs">Startzeit</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-8 text-xs" />
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
                        <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs">Endzeit</Label>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <Button size="sm" className="mt-2 h-7 text-xs" onClick={(e) => { e.stopPropagation(); saveDate(); }} disabled={!startDate || !endDate}>
                  Datum speichern
                </Button>
              </div>

              {/* Fields */}
              {fields.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Felder</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {fields.map((f: any) => {
                      const val = fieldValues[f.id];
                      const isEmpty = val === undefined || val === null || val === '';
                      return (
                        <div key={f.id} className="text-sm">
                          <span className="text-muted-foreground">
                            {f.label}
                            {f.is_required && <span className="text-destructive ml-0.5">*</span>}
                          </span>
                          <p className={`font-medium ${isEmpty ? 'text-muted-foreground/50 italic' : ''}`}>
                            {isEmpty ? '—' : String(val)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Keine Felder definiert.</p>
              )}

              {requiredFields.length > 0 && (
                <div className="flex items-center gap-2 text-xs pt-1 border-t">
                  {isFieldsComplete ? (
                    <span className="flex items-center gap-1 text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Alle Pflichtfelder ausgefüllt
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" /> {requiredFields.length - filledRequired.length} Pflichtfeld{requiredFields.length - filledRequired.length !== 1 ? 'er' : ''} offen
                    </span>
                  )}
                </div>
              )}

              {/* Checklists */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                    <CheckSquare className="h-3.5 w-3.5" /> Checklisten
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1"
                    onClick={(e) => { e.stopPropagation(); setShowAddChecklist(true); }}
                  >
                    <Plus className="h-3 w-3" /> Hinzufügen
                  </Button>
                </div>

                {checklists.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Keine Checklisten zugeordnet.</p>
                ) : (
                  <div className="space-y-2">
                    {checklists.map((cl: any) => {
                      const clTotal = cl.steps?.length || 0;
                      const clDone = cl.steps?.filter((s: any) => s.is_completed)?.length || 0;
                      const clPercent = clTotal > 0 ? Math.round((clDone / clTotal) * 100) : 0;

                      // Group-level progress
                      const groupSteps = (cl.steps || []).filter((s: any) => s.step_type === 'group');
                      const nonGroupSteps = (cl.steps || []).filter((s: any) => s.step_type !== 'group' && !s.parent_step_id);

                      return (
                        <div key={cl.id} className="rounded-md border bg-background p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{cl.name}</span>
                              {cl.trade && <Badge variant="outline" className="text-xs">{cl.trade}</Badge>}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground font-medium">{clDone}/{clTotal}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); setViewChecklist(cl); }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm('Checkliste wirklich löschen?')) return;
                                  try {
                                    await supabase.from('job_checklists').delete().eq('id', cl.id);
                                    queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
                                    toast.success('Checkliste gelöscht.');
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

                          {/* Group-level progress */}
                          {groupSteps.length > 0 && (
                            <div className="space-y-1 mt-1">
                              {groupSteps.map((g: any) => {
                                const children = (cl.steps || []).filter((s: any) => s.parent_step_id === g.id);
                                const gDone = children.filter((c: any) => c.is_completed).length;
                                const gTotal = children.length;
                                const gPercent = gTotal > 0 ? Math.round((gDone / gTotal) * 100) : 0;
                                return (
                                  <div key={g.id} className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground truncate flex-1">{g.title}</span>
                                    <Progress value={gPercent} className="h-1 w-16" />
                                    <span className="text-muted-foreground">{gDone}/{gTotal}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {a.notes && (
                <div className="text-xs border-t pt-2">
                  <span className="text-muted-foreground font-semibold uppercase">Notizen</span>
                  <p className="mt-1">{a.notes}</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Add Checklist Dialog */}
      <Dialog open={showAddChecklist} onOpenChange={setShowAddChecklist}>
        <DialogContent>
          <DialogHeader><DialogTitle>Checkliste hinzufügen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger><SelectValue placeholder="Vorlage wählen…" /></SelectTrigger>
              <SelectContent>
                {(checklistTemplates || []).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} {t.trade ? `(${t.trade})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddChecklist} disabled={!selectedTemplateId} className="w-full">
              Hinzufügen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist Detail Dialog */}
      <ChecklistDetailDialog
        checklist={viewChecklist}
        open={!!viewChecklist}
        onOpenChange={(o) => { if (!o) setViewChecklist(null); }}
      />
    </>
  );
};

export default AppointmentCard;
