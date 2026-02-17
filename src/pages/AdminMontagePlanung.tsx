import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import {
  startOfISOWeek, endOfISOWeek, addWeeks, subWeeks, addDays, addMonths, subMonths,
  eachDayOfInterval, format, startOfDay, startOfMonth, endOfMonth, isWeekend,
} from 'date-fns';
import { toast } from 'sonner';
import PlanungHeader, { type ViewMode, type RightPanel } from '@/components/planung/PlanungHeader';
import GanttChart, { type GanttTeam, type GanttBar } from '@/components/planung/GanttChart';
import AppointmentSidebar, { type SidebarAppointment } from '@/components/planung/AppointmentSidebar';
import PlanungMap, { type MapMarker } from '@/components/planung/PlanungMap';

const AdminMontagePlanung = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showWeekends, setShowWeekends] = useState(true);
  const [rightPanel, setRightPanel] = useState<RightPanel>('sidebar');
  const [activeDrag, setActiveDrag] = useState<any>(null);
  const [visibleTeamIds, setVisibleTeamIds] = useState<string[] | null>(null);

  // Calculate visible days
  const days = useMemo(() => {
    let start: Date, end: Date;
    if (viewMode === 'day') {
      start = startOfDay(currentDate);
      end = start;
    } else if (viewMode === 'week') {
      start = startOfISOWeek(currentDate);
      end = endOfISOWeek(currentDate);
    } else if (viewMode === 'r4w') {
      // Rolling 4 weeks: last week, this week, next 2 weeks (4 full ISO weeks)
      const thisWeekStart = startOfISOWeek(currentDate);
      start = subWeeks(thisWeekStart, 1);
      end = endOfISOWeek(addWeeks(thisWeekStart, 2));
    } else {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    }
    const allDays = eachDayOfInterval({ start, end });
    return showWeekends ? allDays : allDays.filter(d => !isWeekend(d));
  }, [currentDate, viewMode, showWeekends]);

  const dateRange = useMemo(() => {
    if (days.length === 0) return { from: '', to: '' };
    return {
      from: format(days[0], 'yyyy-MM-dd'),
      to: format(days[days.length - 1], 'yyyy-MM-dd'),
    };
  }, [days]);

  // Nav handlers
  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(d => addDays(d, -1));
    else if (viewMode === 'week') setCurrentDate(d => subWeeks(d, 1));
    else if (viewMode === 'r4w') setCurrentDate(d => subWeeks(d, 1));
    else setCurrentDate(d => subMonths(d, 1));
  };
  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(d => addDays(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => addWeeks(d, 1));
    else if (viewMode === 'r4w') setCurrentDate(d => addWeeks(d, 1));
    else setCurrentDate(d => addMonths(d, 1));
  };
  const handleToday = () => setCurrentDate(new Date());

  // ---- DATA FETCHING ----

  // Teams with members
  const { data: teamsData } = useQuery({
    queryKey: ['planung-teams'],
    queryFn: async () => {
      const [teamsRes, profilesRes] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('profiles').select('user_id, name, team_id').order('name'),
      ]);
      const teams = teamsRes.data || [];
      const profiles = profilesRes.data || [];

      const ganttTeams: GanttTeam[] = teams.map(t => ({
        id: t.id,
        name: t.name,
        members: profiles.filter(p => p.team_id === t.id).map(p => ({
          user_id: p.user_id,
          name: p.name || '',
        })),
      }));

      // Add unassigned members
      const unassigned = profiles.filter(p => !p.team_id);
      if (unassigned.length > 0) {
        ganttTeams.push({
          id: '__unassigned',
          name: 'Ohne Team',
          members: unassigned.map(p => ({ user_id: p.user_id, name: p.name || '' })),
        });
      }

      return ganttTeams;
    },
  });

  // Scheduled appointments (for gantt bars) within date range
  const { data: scheduledAppointments } = useQuery({
    queryKey: ['planung-scheduled', dateRange.from, dateRange.to],
    enabled: !!dateRange.from,
    queryFn: async () => {
      // Get appointments with start_date in range that have assignments
      const { data: appts } = await supabase
        .from('job_appointments')
        .select('id, start_date, end_date, status, appointment_type_id, job_id, appointment_types(name, trade), jobs(title, job_number)')
        .not('start_date', 'is', null)
        .gte('start_date', dateRange.from + 'T00:00:00')
        .lte('start_date', dateRange.to + 'T23:59:59')
        .in('status', ['geplant', 'offen', 'abgeschlossen']);

      if (!appts?.length) return [];

      const ids = appts.map(a => a.id);
      const { data: assignments } = await supabase
        .from('job_appointment_assignments')
        .select('*')
        .in('job_appointment_id', ids);

      const bars: GanttBar[] = [];
      for (const appt of appts) {
        const apptAssignments = (assignments || []).filter(a => a.job_appointment_id === appt.id);
        if (apptAssignments.length === 0) continue;
        for (const assign of apptAssignments) {
          bars.push({
            id: `${appt.id}-${assign.person_id}`,
            appointment_id: appt.id,
            person_id: assign.person_id,
            start_date: appt.start_date!,
            end_date: appt.end_date,
            type_name: (appt.appointment_types as any)?.name || '—',
            job_number: (appt.jobs as any)?.job_number || '',
            job_title: (appt.jobs as any)?.title || '',
            trade: (appt.appointment_types as any)?.trade || null,
            job_id: appt.job_id,
          });
        }
      }
      return bars;
    },
  });

  // Unplanned appointments (for sidebar)
  const { data: unplannedAppointments } = useQuery({
    queryKey: ['planung-unplanned'],
    queryFn: async () => {
      const { data } = await supabase
        .from('job_appointments')
        .select('id, status, start_date, appointment_type_id, job_id, appointment_types(name, trade), jobs(title, job_number, status, client_id, clients(company_name, contact_id, contacts(first_name, last_name)))')
        .or('start_date.is.null,status.eq.offen')
        .order('created_at');

      if (!data) return [];

      // Check which have assignments
      const ids = data.map(d => d.id);
      const { data: assigns } = ids.length > 0
        ? await supabase.from('job_appointment_assignments').select('job_appointment_id').in('job_appointment_id', ids)
        : { data: [] };
      const assignedSet = new Set((assigns || []).map(a => a.job_appointment_id));

      const items: SidebarAppointment[] = data.map((d: any) => {
        const client = d.jobs?.clients;
        const clientName = client?.company_name
          || (client?.contacts ? `${client.contacts.first_name} ${client.contacts.last_name}` : '');
        return {
          id: d.id,
          type_name: d.appointment_types?.name || '—',
          trade: d.appointment_types?.trade || null,
          job_id: d.job_id,
          job_number: d.jobs?.job_number || '',
          job_title: d.jobs?.title || '',
          client_name: clientName || 'Kein Kunde',
          job_status: d.jobs?.status || 'neu',
          has_assignments: assignedSet.has(d.id),
        };
      });

      return items;
    },
  });

  // ---- DND HANDLERS ----

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag(event.active.data.current?.appointment || null);
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const appointmentData = active.data.current?.appointment as SidebarAppointment | undefined;
    if (!appointmentData) return;

    const overId = over.id.toString();
    const parts = overId.split('|');
    if (parts.length < 3) return;

    const [personId, dateStr, personName] = parts;

    try {
      // Update appointment start_date and status
      await supabase
        .from('job_appointments')
        .update({ start_date: dateStr + 'T08:00:00', status: 'geplant' } as any)
        .eq('id', appointmentData.id);

      // Create assignment
      await supabase.from('job_appointment_assignments').insert({
        job_appointment_id: appointmentData.id,
        person_id: personId,
        person_name: personName,
      } as any);

      toast.success(`Termin "${appointmentData.type_name}" an ${personName} am ${dateStr} zugewiesen.`);
      queryClient.invalidateQueries({ queryKey: ['planung-scheduled'] });
      queryClient.invalidateQueries({ queryKey: ['planung-unplanned'] });
    } catch (err) {
      toast.error('Fehler beim Zuweisen des Termins.');
      console.error(err);
    }
  }, [queryClient]);

  // ---- MAP MARKERS ----
  const mapMarkers: MapMarker[] = []; // Will be populated when properties have coordinates

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <PlanungHeader
          currentDate={currentDate}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showWeekends={showWeekends}
          onToggleWeekends={() => setShowWeekends(p => !p)}
          rightPanel={rightPanel}
          onToggleRightPanel={() => setRightPanel(p => p === 'sidebar' ? 'map' : 'sidebar')}
          teams={(teamsData || []).map(t => ({ id: t.id, name: t.name }))}
          visibleTeamIds={visibleTeamIds || (teamsData || []).map(t => t.id)}
          onVisibleTeamIdsChange={setVisibleTeamIds}
        />

        <div className="flex flex-1 overflow-hidden">
          <GanttChart
            teams={(teamsData || []).filter(t => 
              !visibleTeamIds || visibleTeamIds.includes(t.id)
            )}
            days={days}
            bars={scheduledAppointments || []}
            onBarClick={(jobId) => navigate(`/admin/montage/job/${jobId}`)}
          />

          {rightPanel === 'sidebar' ? (
            <AppointmentSidebar appointments={unplannedAppointments || []} />
          ) : (
            <PlanungMap markers={mapMarkers} />
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDrag && (
          <div className="bg-card border rounded-lg p-3 shadow-lg w-72 opacity-90">
            <p className="text-sm font-medium truncate">{activeDrag.client_name} – {activeDrag.job_title}</p>
            <p className="text-xs text-muted-foreground">{activeDrag.type_name} · #{activeDrag.job_number}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default AdminMontagePlanung;
