import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Calendar, Clock, ChevronDown, ChevronRight, Users, AlertCircle, CheckCircle2,
  CheckSquare, Plus, Eye, Trash2, X, Maximize2,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TRADE_LABELS, type TradeType } from '@/types/montage';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import ChecklistDetailDialog from './ChecklistDetailDialog';
import AppointmentStatusTimeline from './AppointmentStatusTimeline';

interface AppointmentCardProps {
  appointment: any;
  jobId?: string;
  /** All documents uploaded for this job (used for completeness check) */
  jobDocuments?: any[];
}

import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_ORDER, type AppointmentStatus } from '@/types/montage';

const STATUS_VARIANTS: Record<AppointmentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  neu: 'outline',
  in_planung: 'secondary',
  vorbereitet: 'secondary',
  in_umsetzung: 'secondary',
  review: 'secondary',
  abgenommen: 'default',
};

const AppointmentCard = ({ appointment: a, jobId, jobDocuments = [] }: AppointmentCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [viewChecklistId, setViewChecklistId] = useState<string | null>(null);
  const [showAddMonteur, setShowAddMonteur] = useState(false);
  const [selectedMonteurId, setSelectedMonteurId] = useState('');
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

  // Check if appointment has missing required documents or no checklists
  const reqDocs = a.appointment_type?.required_documents || [];
  const hasMissingDocs = reqDocs.some((rd: any) => !jobDocuments.some((d: any) => d.document_type_id === rd.document_type_id));
  const hasMissingChecklists = checklists.length === 0;
  const requiredFieldsMissing = fields.some((f: any) => f.is_required && !fieldValues[f.id]?.toString().trim());
  const isIncomplete = hasMissingDocs || hasMissingChecklists || requiredFieldsMissing;

  // Intern/Extern: override per appointment or fallback to type default
  const isInternal = a.is_internal !== null && a.is_internal !== undefined
    ? a.is_internal
    : (a.appointment_type?.is_internal ?? false);

  const toggleInternal = async (val: boolean) => {
    try {
      await supabase.from('job_appointments').update({ is_internal: val } as any).eq('id', a.id);
      queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
      toast.success(val ? 'Auf Intern gesetzt.' : 'Auf Extern gesetzt.');
    } catch { toast.error('Fehler.'); }
  };

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

  const { data: monteurProfiles } = useQuery({
    queryKey: ['monteur-profiles-for-assignment'],
    enabled: showAddMonteur,
    queryFn: async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'monteur' as any);
      if (!roles?.length) return [];
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds)
        .order('name');
      return profiles || [];
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
  const checklistPercent = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

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

  const handleAddMonteur = async () => {
    if (!selectedMonteurId) return;
    const profile = (monteurProfiles || []).find((p: any) => p.user_id === selectedMonteurId);
    try {
      await supabase.from('job_appointment_assignments').insert({
        job_appointment_id: a.id,
        person_id: selectedMonteurId,
        person_name: profile?.name || '',
      } as any);
      queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
      setSelectedMonteurId('');
      setShowAddMonteur(false);
      toast.success('Monteur zugeordnet.');
    } catch { toast.error('Fehler.'); }
  };

  const handleRemoveMonteur = async (assignmentId: string) => {
    try {
      await supabase.from('job_appointment_assignments').delete().eq('id', assignmentId);
      queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
      toast.success('Zuordnung entfernt.');
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
        .sort((x: any, y: any) => x.order_index - y.order_index);

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

        if (insertedSteps) {
          const templateToJobMap: Record<string, string> = {};
          for (const step of insertedSteps) {
            if ((step as any).template_step_id) {
              templateToJobMap[(step as any).template_step_id] = step.id;
            }
          }
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

  // ── Helper: Checklist group progress ──
  const getChecklistGroupProgress = (cl: any) => {
    const groupSteps = (cl.steps || []).filter((s: any) => s.step_type === 'group');
    return groupSteps.map((g: any) => {
      const children = (cl.steps || []).filter((s: any) => s.parent_step_id === g.id);
      const gDone = children.filter((c: any) => c.is_completed).length;
      const gTotal = children.length;
      return { id: g.id, title: g.title, done: gDone, total: gTotal, percent: gTotal > 0 ? Math.round((gDone / gTotal) * 100) : 0 };
    });
  };

  // ══════════════════════════════════════════
  // LEVEL 1: Collapsed row
  // ══════════════════════════════════════════
  const CollapsedRow = (
    <div className="flex items-center gap-3 py-2.5 px-3 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setExpanded(!expanded)}>
      <div className="shrink-0">
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>

      {/* Name */}
      <span className="text-sm font-medium truncate min-w-[120px]">{a.appointment_type?.name || 'Termin'}</span>

      {/* Badges: Trade / Intern */}
      <div className="flex items-center gap-1 shrink-0">
        {isInternal ? (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Intern</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Extern</Badge>
        )}
        {a.appointment_type?.trade && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {TRADE_LABELS[a.appointment_type.trade as TradeType] || a.appointment_type.trade}
          </Badge>
        )}
      </div>

      {/* Date */}
      <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Calendar className="h-3 w-3" />
        {hasDateSet ? (
          <span>
            {format(new Date(a.start_date), 'dd.MM.yy', { locale: de })}
            {' '}
            {format(new Date(a.start_date), 'HH:mm')}–{format(new Date(a.end_date), 'HH:mm')}
          </span>
        ) : (
          <span className="italic">—</span>
        )}
      </div>

      {/* Monteure */}
      {assignments.length > 0 && (
        <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Users className="h-3 w-3" />
          <span className="truncate max-w-[150px]">{assignments.map((ass: any) => ass.person_name || '?').join(', ')}</span>
        </div>
      )}

      {/* Checklist progress */}
      {totalSteps > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 ml-auto">
          <CheckSquare className="h-3 w-3 text-muted-foreground" />
          <Progress value={checklistPercent} className="h-1.5 w-16" />
          <span className="text-[10px] text-muted-foreground font-medium">{doneSteps}/{totalSteps}</span>
        </div>
      )}

      {/* Incomplete warning */}
      {isIncomplete && (
        <div className="flex items-center gap-1 text-destructive shrink-0" title="Termin unvollständig">
          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-destructive">
            <AlertCircle className="h-3 w-3 text-destructive-foreground" />
          </span>
          <span className="text-[10px] font-medium hidden lg:inline">Unvollständig</span>
        </div>
      )}

      {/* Status */}
      <Badge variant={STATUS_VARIANTS[(a.status as AppointmentStatus)] || 'outline'} className="text-[10px] shrink-0 ml-auto sm:ml-0">
        {APPOINTMENT_STATUS_LABELS[(a.status as AppointmentStatus)] || a.status}
      </Badge>

      {/* Detail button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  // ══════════════════════════════════════════
  // LEVEL 2: Expanded split view
  // ══════════════════════════════════════════
  const ExpandedView = (
    <div className="border-t bg-muted/20 px-3 py-3 space-y-3">
      {/* Appointment Status Timeline */}
      <AppointmentStatusTimeline
        appointment={a}
        documents={jobDocuments || []}
        onStatusChange={async (newStatus) => {
          try {
            await supabase.from('job_appointments').update({ status: newStatus } as any).eq('id', a.id);
            queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
            queryClient.invalidateQueries({ queryKey: ['all-job-appointments'] });
            toast.success(`Termin-Status: ${APPOINTMENT_STATUS_LABELS[newStatus]}`);
          } catch { toast.error('Fehler.'); }
        }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: Date & Monteure */}
        <div className="space-y-3">
          {/* Date */}
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Zeitraum
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Start</Label>
                <div className="flex gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("flex-1 justify-start text-left text-xs h-7", !startDate && "text-muted-foreground")}>
                        {startDate ? format(startDate, 'dd.MM.yy', { locale: de }) : '—'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-7 text-xs w-20" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Ende</Label>
                <div className="flex gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("flex-1 justify-start text-left text-xs h-7", !endDate && "text-muted-foreground")}>
                        {endDate ? format(endDate, 'dd.MM.yy', { locale: de }) : '—'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-7 text-xs w-20" />
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" className="mt-1.5 h-6 text-[10px]" onClick={(e) => { e.stopPropagation(); saveDate(); }} disabled={!startDate || !endDate}>
              Speichern
            </Button>
          </div>

          <Separator />

          {/* Monteure */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users className="h-3 w-3" /> Monteure
              </h4>
              <Button variant="ghost" size="sm" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={(e) => { e.stopPropagation(); setShowAddMonteur(true); }}>
                <Plus className="h-2.5 w-2.5" /> Zuweisen
              </Button>
            </div>
            {assignments.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">Keine Monteure</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {assignments.map((ass: any) => (
                  <Badge key={ass.id} variant="secondary" className="text-[10px] gap-0.5 pr-0.5 h-5">
                    {ass.person_name || '?'}
                    <button className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5" onClick={(e) => { e.stopPropagation(); handleRemoveMonteur(ass.id); }}>
                      <X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Checklists with group progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <CheckSquare className="h-3 w-3" /> Checklisten
            </h4>
            <Button variant="ghost" size="sm" className="h-5 text-[10px] gap-0.5 px-1.5" onClick={(e) => { e.stopPropagation(); setShowAddChecklist(true); }}>
              <Plus className="h-2.5 w-2.5" /> Hinzufügen
            </Button>
          </div>

          {checklists.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">Keine Checklisten</p>
          ) : (
            <div className="space-y-2">
              {checklists.map((cl: any) => {
                const clTotal = cl.steps?.length || 0;
                const clDone = cl.steps?.filter((s: any) => s.is_completed)?.length || 0;
                const clPercent = clTotal > 0 ? Math.round((clDone / clTotal) * 100) : 0;
                const groups = getChecklistGroupProgress(cl);

                return (
                  <div key={cl.id} className="rounded border bg-background p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{cl.name}</span>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground">{clDone}/{clTotal}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); setViewChecklistId(cl.id); }}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-5 w-5 text-destructive"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Checkliste wirklich löschen?')) return;
                            try {
                              await supabase.from('job_checklists').delete().eq('id', cl.id);
                              queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
                              toast.success('Gelöscht.');
                            } catch { toast.error('Fehler.'); }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Progress value={clPercent} className="h-1 flex-1" />
                      <span className="text-[10px] text-muted-foreground">{clPercent}%</span>
                    </div>
                    {groups.length > 0 && (
                      <div className="space-y-0.5 pt-0.5">
                        {groups.map(g => (
                          <div key={g.id} className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-muted-foreground truncate flex-1">{g.title}</span>
                            <Progress value={g.percent} className="h-0.5 w-12" />
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
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // LEVEL 3: Detail Modal
  // ══════════════════════════════════════════
  const DetailModal = (
    <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {a.appointment_type?.name || 'Termin'}
            {a.appointment_type?.trade && (
              <Badge variant="outline" className="text-xs">{TRADE_LABELS[a.appointment_type.trade as TradeType] || a.appointment_type.trade}</Badge>
            )}
            <Badge variant={STATUS_VARIANTS[(a.status as AppointmentStatus)] || 'outline'} className="text-xs ml-auto">{APPOINTMENT_STATUS_LABELS[(a.status as AppointmentStatus)] || a.status}</Badge>
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Label className="text-xs text-muted-foreground">Extern</Label>
            <Switch checked={isInternal} onCheckedChange={toggleInternal} />
            <Label className="text-xs text-muted-foreground">Intern</Label>
          </div>
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
                      <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs">Endzeit</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8 text-xs" />
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
                        <span className="flex items-center gap-1 text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Alle Pflichtfelder ausgefüllt
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" /> {requiredFields.length - filledRequired.length} offen
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">Keine Felder definiert.</p>
              )}
            </section>

            {/* Notes */}
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
                                queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
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
  );

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        {CollapsedRow}
        {expanded && ExpandedView}
      </div>

      {DetailModal}

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
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.name || p.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddMonteur} disabled={!selectedMonteurId} className="w-full">
              Zuweisen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist Detail Dialog */}
      <ChecklistDetailDialog
        checklistId={viewChecklistId}
        open={!!viewChecklistId}
        onOpenChange={(o) => { if (!o) setViewChecklistId(null); }}
      />
    </>
  );
};

export default AppointmentCard;
