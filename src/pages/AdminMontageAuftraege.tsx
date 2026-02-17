import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useJobs } from '@/hooks/useJobs';
import { useAllAppointments } from '@/hooks/useAllAppointments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, MapPin, ChevronDown, ChevronRight, Calendar, CheckCircle2, Circle, AlertTriangle, ListChecks, Filter, Layers } from 'lucide-react';
import { JOB_STATUS_LABELS, JOB_STATUS_ORDER } from '@/types/montage';
import type { JobStatus } from '@/types/montage';
import CreateJobWizard from '@/components/montage/CreateJobWizard';
import { validateVorbereitetRequirements } from '@/components/montage/JobStatusTimeline';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  type GroupByOption,
  GROUP_BY_LABELS,
  getCalendarWeek,
  getCalendarMonth,
  getCalendarYear,
  getGroupKey,
  groupItems,
  generateKWOptions,
  MONTH_OPTIONS,
} from '@/lib/dateGrouping';

const statusColor: Record<JobStatus, string> = {
  neu: 'bg-muted text-muted-foreground',
  in_planung: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  vorbereitet: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  in_umsetzung: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  nacharbeiten: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  abgeschlossen: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const STATUSES_REQUIRING_VALIDATION: JobStatus[] = ['vorbereitet', 'in_umsetzung', 'nacharbeiten', 'abgeschlossen'];
const JOB_GROUP_OPTIONS: GroupByOption[] = ['none', 'kw_start', 'month_start', 'kw_end', 'month_end'];

const AdminMontageAuftraege = () => {
  const { jobs, loading } = useJobs();
  const { appointments: allAppointments } = useAllAppointments();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [filterPlanner, setFilterPlanner] = useState<string>('all');
  const [filterMonteur, setFilterMonteur] = useState<string>('all');
  const [filterKW, setFilterKW] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');

  const { data: allDocuments } = useQuery({
    queryKey: ['all-job-documents'],
    queryFn: async () => {
      const { data } = await supabase.from('job_documents').select('id, job_id, document_type_id');
      return data || [];
    },
  });

  const { data: allProfiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, name').order('name');
      return data || [];
    },
  });

  const getJobAppointments = (jobId: string) => allAppointments.filter((a: any) => a.job_id === jobId);
  const getJobDocuments = (jobId: string) => (allDocuments || []).filter((d: any) => d.job_id === jobId);

  const isJobWarning = (job: { id: string; status: JobStatus }) => {
    if (!STATUSES_REQUIRING_VALIDATION.includes(job.status)) return false;
    const appts = getJobAppointments(job.id);
    const docs = getJobDocuments(job.id);
    const validation = validateVorbereitetRequirements(appts, docs);
    return !validation.valid;
  };

  // Derive available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allAppointments.forEach((a: any) => {
      if (a.start_date) years.add(new Date(a.start_date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allAppointments]);

  // Get earliest start_date for a job (for grouping/filtering)
  const getJobStartDate = (jobId: string): string | null => {
    const appts = getJobAppointments(jobId).filter((a: any) => a.start_date);
    if (appts.length === 0) return null;
    return appts.sort((a: any, b: any) => a.start_date.localeCompare(b.start_date))[0].start_date;
  };

  const getJobEndDate = (jobId: string): string | null => {
    const appts = getJobAppointments(jobId).filter((a: any) => a.end_date);
    if (appts.length === 0) return null;
    return appts.sort((a: any, b: any) => b.end_date.localeCompare(a.end_date))[0].end_date;
  };

  const filtered = useMemo(() => {
    let result = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.job_number.toLowerCase().includes(search.toLowerCase()) ||
        (j.property?.city || '').toLowerCase().includes(search.toLowerCase())
    );

    if (filterStatus !== 'all') result = result.filter(j => j.status === filterStatus);
    if (filterPlanner !== 'all') result = result.filter(j => j.planner_id === filterPlanner);

    if (filterMonteur !== 'all') {
      result = result.filter(j => (j.assigned_to || []).includes(filterMonteur));
    }

    if (filterKW !== 'all') {
      const kw = parseInt(filterKW);
      result = result.filter(j => getCalendarWeek(getJobStartDate(j.id)) === kw);
    }
    if (filterMonth !== 'all') {
      const m = parseInt(filterMonth);
      result = result.filter(j => getCalendarMonth(getJobStartDate(j.id)) === m);
    }
    if (filterYear !== 'all') {
      const y = parseInt(filterYear);
      result = result.filter(j => getCalendarYear(getJobStartDate(j.id)) === y);
    }

    return result;
  }, [jobs, search, filterStatus, filterPlanner, filterMonteur, filterKW, filterMonth, filterYear, allAppointments]);

  const grouped = useMemo(() =>
    groupItems(filtered, groupBy, (job) => getGroupKey(groupBy, {
      start_date: getJobStartDate(job.id),
      end_date: getJobEndDate(job.id),
    })),
  [filtered, groupBy, allAppointments]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Aufträge</h2>
        <Button size="sm" className="gap-2" onClick={() => setWizardOpen(true)}>
          <Plus className="h-4 w-4" /> Neuer Auftrag
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Suchen nach Titel, Nummer, Ort…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {JOB_STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{JOB_STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterPlanner} onValueChange={setFilterPlanner}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Planer" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Planer</SelectItem>
            {(allProfiles || []).map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{p.name || p.user_id}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterMonteur} onValueChange={setFilterMonteur}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Monteur" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Monteure</SelectItem>
            {(allProfiles || []).map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{p.name || p.user_id}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Jahr" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Jahre</SelectItem>
            {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Monat" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Monate</SelectItem>
            {MONTH_OPTIONS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterKW} onValueChange={setFilterKW}>
          <SelectTrigger className="w-[110px]"><SelectValue placeholder="KW" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle KW</SelectItem>
            {generateKWOptions(new Date().getFullYear()).map(kw => <SelectItem key={kw.value} value={kw.value}>{kw.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
          <SelectTrigger className="w-[180px]"><Layers className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Gruppierung" /></SelectTrigger>
          <SelectContent>
            {JOB_GROUP_OPTIONS.map(o => <SelectItem key={o} value={o}>{GROUP_BY_LABELS[o]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Keine Aufträge gefunden.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.key || 'all'}>
              {group.key && (
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs font-semibold">{group.key}</Badge>
                  <span className="text-xs text-muted-foreground">{group.items.length} Auftrag{group.items.length !== 1 ? '̈e' : ''}</span>
                </div>
              )}
              <div className="space-y-2">
                {group.items.map((job) => {
                  const isExpanded = expandedJobId === job.id;
                  const jobAppts = getJobAppointments(job.id);
                  const hasWarning = isJobWarning(job);
                  return (
                    <Card key={job.id} className={cn("transition-colors", hasWarning && "border-destructive/50")}>
                      <CardContent className="p-0">
                        <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpandedJobId(isExpanded ? null : job.id)}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{job.title || 'Ohne Titel'}</p>
                                <p className="text-xs text-muted-foreground">{job.job_number}</p>
                                {job.property && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {job.property.street_address}, {job.property.postal_code} {job.property.city}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {hasWarning && <AlertTriangle className="h-4 w-4 text-destructive" />}
                              {jobAppts.length > 0 && <span className="text-xs text-muted-foreground">{jobAppts.length} Termine</span>}
                              <Badge variant="secondary" className={statusColor[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                            </div>
                          </div>
                          {job.trades.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap ml-6">
                              {job.trades.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                            </div>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="border-t px-4 pb-4 pt-3 space-y-3 bg-muted/10">
                            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                              {JOB_STATUS_ORDER.map((s, i) => {
                                const currentIdx = JOB_STATUS_ORDER.indexOf(job.status);
                                const isDone = i < currentIdx;
                                const isCurrent = i === currentIdx;
                                return (
                                  <div key={s} className="flex items-center gap-1">
                                    {i > 0 && <div className={cn("h-0.5 w-3", isDone || isCurrent ? "bg-primary" : "bg-border")} />}
                                    <div className={cn(
                                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs whitespace-nowrap",
                                      isCurrent ? "bg-primary text-primary-foreground font-semibold" : isDone ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                      {isDone ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                      {JOB_STATUS_LABELS[s]}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {jobAppts.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Keine Termine vorhanden.</p>
                            ) : (
                              <div className="space-y-2">
                                {jobAppts.map((appt: any) => {
                                  const apptName = appt.appointment_types?.name || appt.appointment_type?.name || 'Termin';
                                  const apptStatus = appt.status || 'offen';
                                  const checklists = appt.checklists || [];
                                  const allSteps = checklists.flatMap((cl: any) => (cl.steps || []).filter((s: any) => s.step_type !== 'group'));
                                  const completedSteps = allSteps.filter((s: any) => s.is_completed);
                                  const totalProgress = allSteps.length > 0 ? Math.round((completedSteps.length / allSteps.length) * 100) : 0;
                                  const groups: { name: string; done: number; total: number }[] = [];
                                  for (const cl of checklists) {
                                    const steps = cl.steps || [];
                                    const groupSteps = steps.filter((s: any) => s.step_type === 'group');
                                    if (groupSteps.length > 0) {
                                      for (const g of groupSteps) {
                                        const children = steps.filter((s: any) => s.parent_step_id === g.id && s.step_type !== 'group');
                                        groups.push({ name: g.title, done: children.filter((c: any) => c.is_completed).length, total: children.length });
                                      }
                                    } else if (allSteps.length > 0) {
                                      const clSteps = steps.filter((s: any) => s.step_type !== 'group');
                                      groups.push({ name: cl.name || 'Checkliste', done: clSteps.filter((s: any) => s.is_completed).length, total: clSteps.length });
                                    }
                                  }
                                  return (
                                    <div key={appt.id} className="bg-background rounded-md border overflow-hidden">
                                      <div className="flex items-center justify-between p-2">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-sm">{apptName}</span>
                                          {appt.start_date && <span className="text-xs text-muted-foreground">{new Date(appt.start_date).toLocaleDateString('de-DE')}</span>}
                                        </div>
                                        <Badge variant="outline" className="text-xs capitalize">{apptStatus}</Badge>
                                      </div>
                                      {allSteps.length > 0 && (
                                        <div className="px-2 pb-2 space-y-1.5">
                                          <div className="flex items-center gap-2">
                                            <ListChecks className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <Progress value={totalProgress} className="h-2 flex-1" />
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">{completedSteps.length}/{allSteps.length}</span>
                                          </div>
                                          {groups.length > 1 && (
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 pl-5.5">
                                              {groups.map((g, gi) => {
                                                const pct = g.total > 0 ? Math.round((g.done / g.total) * 100) : 0;
                                                return (
                                                  <div key={gi} className="flex items-center gap-1.5">
                                                    <span className="text-[11px] text-muted-foreground truncate flex-1">{g.name}</span>
                                                    <Progress value={pct} className="h-1.5 w-12 shrink-0" />
                                                    <span className="text-[10px] text-muted-foreground">{g.done}/{g.total}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <Button size="sm" variant="outline" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/admin/montage/job/${job.id}`); }}>
                              Auftrag öffnen
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <CreateJobWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
};

export default AdminMontageAuftraege;
