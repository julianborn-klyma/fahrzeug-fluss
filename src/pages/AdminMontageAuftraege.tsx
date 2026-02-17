import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '@/hooks/useJobs';
import { useAllAppointments } from '@/hooks/useAllAppointments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, MapPin, ChevronDown, ChevronRight, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { JOB_STATUS_LABELS, JOB_STATUS_ORDER } from '@/types/montage';
import type { JobStatus } from '@/types/montage';
import CreateJobWizard from '@/components/montage/CreateJobWizard';
import { cn } from '@/lib/utils';

const statusColor: Record<JobStatus, string> = {
  neu: 'bg-muted text-muted-foreground',
  in_planung: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  vorbereitet: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  in_umsetzung: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  nacharbeiten: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  abgeschlossen: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const AdminMontageAuftraege = () => {
  const { jobs, loading } = useJobs();
  const { appointments: allAppointments } = useAllAppointments();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.job_number.toLowerCase().includes(search.toLowerCase()) ||
      (j.property?.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const getJobAppointments = (jobId: string) =>
    allAppointments.filter((a: any) => a.job_id === jobId);

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
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Keine Aufträge gefunden.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => {
            const isExpanded = expandedJobId === job.id;
            const jobAppts = getJobAppointments(job.id);
            return (
              <Card key={job.id} className="transition-colors">
                <CardContent className="p-0">
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  >
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
                      <div className="flex items-center gap-2 shrink-0">
                        {jobAppts.length > 0 && (
                          <span className="text-xs text-muted-foreground">{jobAppts.length} Termine</span>
                        )}
                        <Badge variant="secondary" className={statusColor[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                      </div>
                    </div>
                    {job.trades.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap ml-6">
                        {job.trades.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-3 bg-muted/10">
                      {/* Mini status timeline */}
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

                      {/* Appointments list */}
                      {jobAppts.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Keine Termine vorhanden.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {jobAppts.map((appt: any) => {
                            const apptName = appt.appointment_types?.name || 'Termin';
                            const apptStatus = appt.status || 'offen';
                            return (
                              <div key={appt.id} className="flex items-center justify-between text-sm bg-background rounded-md p-2 border">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm">{apptName}</span>
                                  {appt.start_date && (
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(appt.start_date).toLocaleDateString('de-DE')}
                                    </span>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs capitalize">{apptStatus}</Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/montage/job/${job.id}`); }}
                      >
                        Auftrag öffnen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <CreateJobWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
};

export default AdminMontageAuftraege;
