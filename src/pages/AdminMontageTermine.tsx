import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAllAppointments } from '@/hooks/useAllAppointments';
import { useAppointmentTypes } from '@/hooks/useAppointmentTypes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Search, ArrowUpDown, Filter, MapPin, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

type SortField = 'start_date' | 'status' | 'job_number' | 'appointment_type';
type SortDir = 'asc' | 'desc';

import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_ORDER, type AppointmentStatus } from '@/types/montage';

const STATUS_LABELS: Record<AppointmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  neu: { label: 'Neu', variant: 'outline' },
  in_planung: { label: 'In Planung', variant: 'secondary' },
  vorbereitet: { label: 'Vorbereitet', variant: 'secondary' },
  in_umsetzung: { label: 'In Umsetzung', variant: 'secondary' },
  review: { label: 'Review', variant: 'secondary' },
  abgenommen: { label: 'Abgenommen', variant: 'default' },
};

const TERMINE_GROUP_OPTIONS: GroupByOption[] = ['none', 'kw_start', 'month_start', 'kw_end', 'month_end', 'trade'];

const AdminMontageTermine = () => {
  const { appointments, loading } = useAllAppointments();
  const { appointmentTypes } = useAppointmentTypes();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPlanner, setFilterPlanner] = useState<string>('all');
  const [filterMonteur, setFilterMonteur] = useState<string>('all');
  const [filterKW, setFilterKW] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('start_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');

  // Fetch profiles for planner/monteur filter
  const { data: allProfiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, name').order('name');
      return data || [];
    },
  });

  // Fetch appointment assignments for monteur filter
  const { data: allAssignments } = useQuery({
    queryKey: ['all-job-appointment-assignments'],
    queryFn: async () => {
      const { data } = await supabase.from('job_appointment_assignments').select('job_appointment_id, person_id');
      return data || [];
    },
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // Derive available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    appointments.forEach((a: any) => {
      if (a.start_date) years.add(new Date(a.start_date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [appointments]);

  const filtered = useMemo(() => {
    let result = [...appointments];

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((a: any) => {
        const jobTitle = a.jobs?.title || '';
        const jobNumber = a.jobs?.job_number || '';
        const atName = a.appointment_types?.name || '';
        const propName = a.jobs?.properties?.name || '';
        const propCity = a.jobs?.properties?.city || '';
        const clientName = a.jobs?.clients?.company_name || '';
        return [jobTitle, jobNumber, atName, propName, propCity, clientName].some(v => v.toLowerCase().includes(s));
      });
    }

    if (filterStatus !== 'all') result = result.filter((a: any) => a.status === filterStatus);
    if (filterType !== 'all') result = result.filter((a: any) => a.appointment_type_id === filterType);

    if (filterPlanner !== 'all') {
      result = result.filter((a: any) => a.jobs?.planner_id === filterPlanner);
    }

    if (filterMonteur !== 'all') {
      const apptIdsForMonteur = new Set((allAssignments || []).filter(x => x.person_id === filterMonteur).map(x => x.job_appointment_id));
      result = result.filter((a: any) => apptIdsForMonteur.has(a.id));
    }

    if (filterKW !== 'all') {
      const kw = parseInt(filterKW);
      result = result.filter((a: any) => getCalendarWeek(a.start_date) === kw);
    }

    if (filterMonth !== 'all') {
      const m = parseInt(filterMonth);
      result = result.filter((a: any) => getCalendarMonth(a.start_date) === m);
    }

    if (filterYear !== 'all') {
      const y = parseInt(filterYear);
      result = result.filter((a: any) => getCalendarYear(a.start_date) === y);
    }

    result.sort((a: any, b: any) => {
      let cmp = 0;
      switch (sortField) {
        case 'start_date': cmp = (a.start_date || '').localeCompare(b.start_date || ''); break;
        case 'status': cmp = (a.status || '').localeCompare(b.status || ''); break;
        case 'job_number': cmp = (a.jobs?.job_number || '').localeCompare(b.jobs?.job_number || ''); break;
        case 'appointment_type': cmp = (a.appointment_types?.name || '').localeCompare(b.appointment_types?.name || ''); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [appointments, search, filterStatus, filterType, filterPlanner, filterMonteur, filterKW, filterMonth, filterYear, sortField, sortDir, allAssignments]);

  const grouped = useMemo(() =>
    groupItems(filtered, groupBy, (item: any) => getGroupKey(groupBy, item)),
  [filtered, groupBy]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Termine</h2>
        <Badge variant="secondary">{filtered.length} Termin{filtered.length !== 1 ? 'e' : ''}</Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Suche nach Auftrag, Kunde, Objekt…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Filters row 1 */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Terminart" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Terminarten</SelectItem>
            {appointmentTypes.map((at: any) => <SelectItem key={at.id} value={at.id}>{at.name}</SelectItem>)}
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

      {/* Filters row 2: date filters + grouping */}
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
            {TERMINE_GROUP_OPTIONS.map(o => <SelectItem key={o} value={o}>{GROUP_BY_LABELS[o]}</SelectItem>)}
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
          <Button key={field} variant={sortField === field ? 'default' : 'outline'} size="sm" className="gap-1" onClick={() => toggleSort(field)}>
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
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.key || 'all'}>
              {group.key && (
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs font-semibold">{group.key}</Badge>
                  <span className="text-xs text-muted-foreground">{group.items.length} Termin{group.items.length !== 1 ? 'e' : ''}</span>
                </div>
              )}
              <div className="space-y-2">
                {group.items.map((appt: any) => {
                  const statusInfo = STATUS_LABELS[appt.status] || { label: appt.status, variant: 'outline' as const };
                  const job = appt.jobs;
                  const atName = appt.appointment_types?.name || '—';
                  const propName = job?.properties?.name;
                  const propAddr = job?.properties ? `${job.properties.street_address || ''}, ${job.properties.city || ''}`.replace(/^, |, $/g, '') : '';
                  const clientName = job?.clients?.company_name
                    || (job?.clients?.contacts ? `${job.clients.contacts.first_name} ${job.clients.contacts.last_name}` : '');

                  return (
                    <Card key={appt.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => job && navigate(`/admin/montage/job/${job.id || appt.job_id}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{atName}</span>
                              <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                              {appt.appointment_types?.is_internal && <Badge variant="default" className="text-xs">Intern</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {job && <span className="font-medium text-foreground">{job.job_number ? `#${job.job_number}` : ''} {job.title}</span>}
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
                            ) : <span className="text-xs text-muted-foreground">Kein Datum</span>}
                            {appt.start_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(new Date(appt.start_date), 'HH:mm', { locale: de })}
                                  {appt.end_date && ` – ${format(new Date(appt.end_date), 'HH:mm', { locale: de })}`}
                                </span>
                              </div>
                            )}
                            {appt.end_date && appt.start_date && format(new Date(appt.start_date), 'yyyy-MM-dd') !== format(new Date(appt.end_date), 'yyyy-MM-dd') && (
                              <div className="text-xs text-muted-foreground">bis {format(new Date(appt.end_date), 'dd.MM.yyyy', { locale: de })}</div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMontageTermine;
