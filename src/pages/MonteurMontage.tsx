import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAssignedJobs } from '@/hooks/useJobs';
import { useMonteurAppointments } from '@/hooks/useTradeAppointments';
import MonteurBottomNav from '@/components/MonteurBottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Briefcase } from 'lucide-react';
import { JOB_STATUS_LABELS } from '@/types/montage';
import { format, isThisWeek, addWeeks, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';

const MonteurMontage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: jobs, isLoading } = useAssignedJobs(user?.id);
  const { data: appointments } = useMonteurAppointments(user?.id);

  const now = new Date();
  const nextWeekStart = startOfWeek(addWeeks(now, 1), { locale: de });
  const nextWeekEnd = endOfWeek(addWeeks(now, 1), { locale: de });

  const grouped = {
    thisWeek: appointments?.filter((a) => isThisWeek(new Date(a.start_date), { locale: de })) || [],
    nextWeek: appointments?.filter((a) => isWithinInterval(new Date(a.start_date), { start: nextWeekStart, end: nextWeekEnd })) || [],
    later: appointments?.filter((a) => new Date(a.start_date) > nextWeekEnd) || [],
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-card px-4 py-3">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Briefcase className="h-5 w-5" /> Meine Montage
        </h1>
      </header>

      <div className="p-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Appointments section */}
            {[
              { label: 'Diese Woche', items: grouped.thisWeek },
              { label: 'Nächste Woche', items: grouped.nextWeek },
              { label: 'Später', items: grouped.later },
            ].map(({ label, items }) =>
              items.length > 0 ? (
                <div key={label}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">{label}</h3>
                  <div className="space-y-2">
                    {items.map((a) => (
                      <Card
                        key={a.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => navigate(`/montage/job/${a.job_id}`)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{(a as any).job?.title || 'Auftrag'}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(a.start_date), 'dd.MM.yyyy', { locale: de })}
                              </p>
                            </div>
                            <Badge variant="outline">{a.trade}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : null
            )}

            {/* Jobs without appointments */}
            {jobs && jobs.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Meine Aufträge</h3>
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <Card
                      key={job.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => navigate(`/montage/job/${job.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{job.title || 'Ohne Titel'}</p>
                            <p className="text-xs text-muted-foreground">{job.job_number}</p>
                            {job.property && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {job.property.city}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {JOB_STATUS_LABELS[job.status]}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {(!appointments || appointments.length === 0) && (!jobs || jobs.length === 0) && (
              <p className="text-center text-muted-foreground py-12">Keine Aufträge zugewiesen.</p>
            )}
          </>
        )}
      </div>

      <MonteurBottomNav active="montage" />
    </div>
  );
};

export default MonteurMontage;
