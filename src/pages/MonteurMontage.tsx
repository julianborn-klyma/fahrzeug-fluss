import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAssignedJobs } from '@/hooks/useJobs';
import { useMonteurAppointments } from '@/hooks/useTradeAppointments';
import MonteurBottomNav from '@/components/MonteurBottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { JOB_STATUS_LABELS } from '@/types/montage';
import {
  format, addDays, subDays, isToday, isSameDay, startOfDay,
} from 'date-fns';
import { de } from 'date-fns/locale';

const MonteurMontage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: jobs, isLoading } = useAssignedJobs(user?.id);
  const { data: appointments } = useMonteurAppointments(user?.id);

  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  const dayAppointments = (appointments || []).filter((a) => {
    const start = startOfDay(new Date(a.start_date));
    const end = a.end_date ? startOfDay(new Date(a.end_date)) : start;
    return selectedDate >= start && selectedDate <= end;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Briefcase className="h-5 w-5" /> Meine Montage
        </h1>
      </header>

      {/* Date navigator – always visible */}
      <div className="border-b bg-card px-4 py-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSelectedDate((d) => subDays(d, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {format(selectedDate, 'EEEE, dd.MM.yyyy', { locale: de })}
          </span>
          {!isToday(selectedDate) && (
            <Button
              variant="link"
              size="sm"
              className="text-xs h-auto p-0 ml-1 text-primary"
              onClick={() => setSelectedDate(startOfDay(new Date()))}
            >
              Heute
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Day appointments */}
            {dayAppointments.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {dayAppointments.length} {dayAppointments.length === 1 ? 'Termin' : 'Termine'}
                </h3>
                {dayAppointments.map((a) => (
                  <Card
                    key={a.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/montage/job/${a.job_id}`)}
                  >
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {(a as any).job?.title || 'Auftrag'}
                        </p>
                        <Badge variant="outline" className="shrink-0">{a.trade}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(a.start_date), 'HH:mm', { locale: de })}
                        {a.end_date && ` – ${format(new Date(a.end_date), 'HH:mm', { locale: de })}`}
                      </p>
                      {(a as any).job?.properties && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {(a as any).job.properties.city}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Keine Termine an diesem Tag.
              </div>
            )}

            {/* Assigned jobs section (below calendar) */}
            {jobs && jobs.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Meine Aufträge
                </h3>
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
