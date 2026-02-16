import { useState, useMemo } from 'react';
import { useAllAppointments } from '@/hooks/useAllAppointments';
import { useAppointmentTypes } from '@/hooks/useAppointmentTypes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Search, ArrowUpDown, Filter, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

type SortField = 'start_date' | 'status' | 'job_number' | 'appointment_type';
type SortDir = 'asc' | 'desc';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  offen: { label: 'Offen', variant: 'outline' },
  geplant: { label: 'Geplant', variant: 'secondary' },
  abgeschlossen: { label: 'Abgeschlossen', variant: 'default' },
  abgesagt: { label: 'Abgesagt', variant: 'destructive' },
};

const AdminMontageTermine = () => {
  const { appointments, loading } = useAllAppointments();
  const { appointmentTypes } = useAppointmentTypes();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('start_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let result = [...appointments];

    // Search
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((a: any) => {
        const jobTitle = a.jobs?.title || '';
        const jobNumber = a.jobs?.job_number || '';
        const atName = a.appointment_types?.name || '';
        const propName = a.jobs?.properties?.name || '';
        const propCity = a.jobs?.properties?.city || '';
        const clientName = a.jobs?.clients?.company_name || '';
        const contactName = a.jobs?.clients?.contacts
          ? `${a.jobs.clients.contacts.first_name} ${a.jobs.clients.contacts.last_name}`
          : '';
        return [jobTitle, jobNumber, atName, propName, propCity, clientName, contactName]
          .some(v => v.toLowerCase().includes(s));
      });
    }

    // Filter status
    if (filterStatus !== 'all') {
      result = result.filter((a: any) => a.status === filterStatus);
    }

    // Filter type
    if (filterType !== 'all') {
      result = result.filter((a: any) => a.appointment_type_id === filterType);
    }

    // Sort
    result.sort((a: any, b: any) => {
      let cmp = 0;
      switch (sortField) {
        case 'start_date': {
          const da = a.start_date || '';
          const db = b.start_date || '';
          cmp = da.localeCompare(db);
          break;
        }
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '');
          break;
        case 'job_number':
          cmp = (a.jobs?.job_number || '').localeCompare(b.jobs?.job_number || '');
          break;
        case 'appointment_type':
          cmp = (a.appointment_types?.name || '').localeCompare(b.appointment_types?.name || '');
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [appointments, search, filterStatus, filterType, sortField, sortDir]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Termine</h2>
        <Badge variant="secondary">{filtered.length} Termin{filtered.length !== 1 ? 'e' : ''}</Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Auftrag, Kunde, Objekt…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Terminart" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Terminarten</SelectItem>
            {appointmentTypes.map((at: any) => (
              <SelectItem key={at.id} value={at.id}>{at.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort buttons */}
      <div className="flex flex-wrap gap-2">
        {([
          { field: 'start_date' as SortField, label: 'Datum' },
          { field: 'status' as SortField, label: 'Status' },
          { field: 'job_number' as SortField, label: 'Auftrag' },
          { field: 'appointment_type' as SortField, label: 'Terminart' },
        ]).map(({ field, label }) => (
          <Button
            key={field}
            variant={sortField === field ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
            onClick={() => toggleSort(field)}
          >
            <ArrowUpDown className="h-3 w-3" />
            {label}
            {sortField === field && (sortDir === 'asc' ? ' ↑' : ' ↓')}
          </Button>
        ))}
      </div>

      {/* Appointment list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
          <Calendar className="h-10 w-10" />
          <p>Keine Termine gefunden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((appt: any) => {
            const statusInfo = STATUS_LABELS[appt.status] || { label: appt.status, variant: 'outline' as const };
            const job = appt.jobs;
            const atName = appt.appointment_types?.name || '—';
            const propName = job?.properties?.name;
            const propAddr = job?.properties ? `${job.properties.street_address || ''}, ${job.properties.city || ''}`.replace(/^, |, $/g, '') : '';
            const clientName = job?.clients?.company_name
              || (job?.clients?.contacts ? `${job.clients.contacts.first_name} ${job.clients.contacts.last_name}` : '');

            return (
              <Card
                key={appt.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => job && navigate(`/admin/montage/job/${job.id || appt.job_id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{atName}</span>
                        <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                        {appt.appointment_types?.is_internal && (
                          <Badge variant="default" className="text-xs">Intern</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {job && (
                          <span className="font-medium text-foreground">
                            {job.job_number ? `#${job.job_number}` : ''} {job.title}
                          </span>
                        )}
                        {clientName && <span>{clientName}</span>}
                      </div>

                      {(propName || propAddr) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {propName && <span className="font-medium">{propName}</span>}
                          {propAddr && <span>{propAddr}</span>}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      {appt.start_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{format(new Date(appt.start_date), 'dd.MM.yyyy', { locale: de })}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Kein Datum</span>
                      )}
                      {appt.start_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(appt.start_date), 'HH:mm', { locale: de })}
                            {appt.end_date && ` – ${format(new Date(appt.end_date), 'HH:mm', { locale: de })}`}
                          </span>
                        </div>
                      )}
                      {appt.end_date && appt.start_date && (
                        (() => {
                          const sd = new Date(appt.start_date);
                          const ed = new Date(appt.end_date);
                          if (format(sd, 'yyyy-MM-dd') !== format(ed, 'yyyy-MM-dd')) {
                            return (
                              <div className="text-xs text-muted-foreground">
                                bis {format(ed, 'dd.MM.yyyy', { locale: de })}
                              </div>
                            );
                          }
                          return null;
                        })()
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminMontageTermine;
