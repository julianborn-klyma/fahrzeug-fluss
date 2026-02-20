import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import PlanungMap, { type MapMarker, type DistanceLine, haversineKm } from '@/components/planung/PlanungMap';
import GanttConfirmDialog, { type BarChangeRequest } from '@/components/planung/GanttConfirmDialog';
import GanttAppointmentDialog from '@/components/planung/GanttAppointmentDialog';
import VehicleStatusDialog from '@/components/planung/VehicleStatusDialog';

const AdminMontagePlanung = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showWeekends, setShowWeekends] = useState(true);
  const [rightPanel, setRightPanel] = useState<RightPanel>('sidebar');
  const [activeDrag, setActiveDrag] = useState<any>(null);
  const [visibleTeamIds, setVisibleTeamIds] = useState<string[] | null>(null);
  const [barChangeReq, setBarChangeReq] = useState<BarChangeRequest | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<{ appointmentId: string; jobId: string } | null>(null);
  const [distanceAppointmentId, setDistanceAppointmentId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

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

  const { data: teamsData } = useQuery({
    queryKey: ['planung-teams'],
    queryFn: async () => {
      const [teamsRes, profilesRes, vehicleAssignRes, vehiclesRes] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('profiles').select('user_id, name, team_id, address_lat, address_lng, address_city').order('name'),
        supabase.from('user_vehicle_assignments').select('user_id, vehicle_id'),
        supabase.from('vehicles').select('id, license_plate, owner_id, vehicle_status, replacement_plate'),
      ]);
      const teams = teamsRes.data || [];
      const profiles = profilesRes.data || [];
      const vAssigns = vehicleAssignRes.data || [];
      const vehiclesMap = new Map((vehiclesRes.data || []).map((v: any) => [v.id, v]));

      // For each profile, find their vehicle (owner first, then assignment)
      const getMemberVehicle = (userId: string) => {
        // First check if they own a vehicle
        for (const [, v] of vehiclesMap) {
          if ((v as any).owner_id === userId) return v as any;
        }
        // Otherwise check assignments
        const assign = vAssigns.find(a => a.user_id === userId);
        if (assign) return vehiclesMap.get(assign.vehicle_id) as any;
        return null;
      };

      const mapMember = (p: any) => {
        const v = getMemberVehicle(p.user_id);
        return {
          user_id: p.user_id,
          name: p.name || '',
          license_plate: v?.license_plate || undefined,
          vehicle_status: v?.vehicle_status || undefined,
          replacement_plate: v?.replacement_plate || undefined,
          vehicle_id: v?.id || undefined,
        };
      };

      const ganttTeams: GanttTeam[] = teams.map(t => ({
        id: t.id,
        name: t.name,
        members: profiles.filter(p => p.team_id === t.id).map(mapMember),
      }));

      const unassigned = profiles.filter(p => !p.team_id);
      if (unassigned.length > 0) {
        ganttTeams.push({
          id: '__unassigned',
          name: 'Ohne Team',
          members: unassigned.map(mapMember),
        });
      }

      return ganttTeams;
    },
  });

  const { data: scheduledAppointments } = useQuery({
    queryKey: ['planung-scheduled', dateRange.from, dateRange.to],
    enabled: !!dateRange.from,
    queryFn: async () => {
      const { data: appts } = await supabase
        .from('job_appointments')
        .select('id, start_date, end_date, status, appointment_type_id, job_id, field_values, appointment_types(name, trade, appointment_type_fields(*), appointment_type_documents(document_type_id)), jobs(title, job_number)')
        .not('start_date', 'is', null)
        .lte('start_date', dateRange.to + 'T23:59:59')
        .or(`end_date.gte.${dateRange.from}T00:00:00,end_date.is.null`)
        .in('status', ['neu', 'in_planung', 'vorbereitet', 'in_umsetzung', 'review', 'abgenommen']);

      if (!appts?.length) return [];

      const ids = appts.map(a => a.id);
      const jobIds = [...new Set(appts.map(a => a.job_id))];

      const [assignRes, checkRes, docRes, checkStepsRes] = await Promise.all([
        supabase.from('job_appointment_assignments').select('*').in('job_appointment_id', ids),
        supabase.from('job_checklists').select('id, appointment_id').in('appointment_id', ids),
        supabase.from('job_documents').select('id, job_id, document_type_id').in('job_id', jobIds),
        supabase.from('job_checklists').select('id, appointment_id, name, job_checklist_steps(id, is_completed, parent_step_id, step_type, title)').in('appointment_id', ids),
      ]);

      const assignments = assignRes.data || [];
      const checklistsByAppt: Record<string, number> = {};
      for (const cl of (checkRes.data || [])) {
        const apptId = (cl as any).appointment_id;
        if (apptId) checklistsByAppt[apptId] = (checklistsByAppt[apptId] || 0) + 1;
      }

      // Build checklist group progress per appointment
      const checklistGroupsByAppt: Record<string, { title: string; done: number; total: number }[]> = {};
      for (const cl of (checkStepsRes.data || [])) {
        const apptId = (cl as any).appointment_id;
        if (!apptId) continue;
        const steps = ((cl as any).job_checklist_steps || []);
        const groupSteps = steps.filter((s: any) => s.step_type === 'group');
        for (const g of groupSteps) {
          const children = steps.filter((s: any) => s.parent_step_id === g.id);
          if (children.length === 0) continue;
          const done = children.filter((c: any) => c.is_completed).length;
          if (!checklistGroupsByAppt[apptId]) checklistGroupsByAppt[apptId] = [];
          checklistGroupsByAppt[apptId].push({ title: g.title, done, total: children.length });
        }
      }
      const docsByJob: Record<string, any[]> = {};
      for (const d of (docRes.data || [])) {
        if (!docsByJob[d.job_id]) docsByJob[d.job_id] = [];
        docsByJob[d.job_id].push(d);
      }

      const bars: GanttBar[] = [];
      for (const appt of appts) {
        const apptAssignments = assignments.filter(a => a.job_appointment_id === appt.id);
        if (apptAssignments.length === 0) continue;

        // Check completeness
        const reqDocs = (appt.appointment_types as any)?.appointment_type_documents || [];
        const jobDocs = docsByJob[appt.job_id] || [];
        const hasMissingDocs = reqDocs.some((rd: any) => !jobDocs.some((d: any) => d.document_type_id === rd.document_type_id));
        const hasNoChecklists = !checklistsByAppt[appt.id];
        const apptFields = ((appt.appointment_types as any)?.appointment_type_fields || []);
        const fv = (appt.field_values as any) || {};
        const hasMissingFields = apptFields.some((f: any) => f.is_required && !fv[f.id]?.toString().trim());
        const isIncomplete = hasMissingDocs || hasNoChecklists || hasMissingFields;

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
            isIncomplete,
            status: appt.status,
            checklistGroups: checklistGroupsByAppt[appt.id] || [],
          });
        }
      }
      return bars;
    },
  });

  const { data: unplannedAppointments } = useQuery({
    queryKey: ['planung-unplanned'],
    queryFn: async () => {
      const { data } = await supabase
        .from('job_appointments')
        .select('id, status, start_date, appointment_type_id, job_id, appointment_types(name, trade), jobs(title, job_number, status, client_id, clients(company_name, contact_id, contacts(first_name, last_name)))')
        .or('start_date.is.null')
        .neq('status', 'neu')
        .neq('status', 'abgenommen')
        .order('created_at');

      if (!data) return [];

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
          job_status: d.status || 'in_planung',
          has_assignments: assignedSet.has(d.id),
        };
      });

      return items;
    },
  });

  // ---- DND HANDLERS (sidebar → gantt) ----

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
      await supabase
        .from('job_appointments')
        .update({ start_date: dateStr + 'T08:00:00', status: 'in_planung' } as any)
        .eq('id', appointmentData.id);

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

  // ---- BAR CHANGE (move/resize confirmation) ----

  const handleBarChange = useCallback((req: BarChangeRequest) => {
    setBarChangeReq(req);
  }, []);

  const handleConfirmBarChange = useCallback(async (req: BarChangeRequest) => {
    setBarChangeReq(null);
    try {
      // Update appointment dates for ALL assigned monteurs
      await supabase
        .from('job_appointments')
        .update({
          start_date: req.newStartDate,
          end_date: req.newEndDate,
        } as any)
        .eq('id', req.appointmentId);

      // If moved to a different person, update the assignment
      if (req.newPersonId && req.oldPersonId) {
        await supabase
          .from('job_appointment_assignments')
          .update({
            person_id: req.newPersonId,
            person_name: req.newPersonName || '',
          } as any)
          .eq('job_appointment_id', req.appointmentId)
          .eq('person_id', req.oldPersonId);
      }

      toast.success('Termin aktualisiert.');
      queryClient.invalidateQueries({ queryKey: ['planung-scheduled'] });
    } catch (err) {
      toast.error('Fehler beim Aktualisieren.');
      console.error(err);
    }
  }, [queryClient]);

  // Work day settings
  const { data: workDaySettings } = useQuery({
    queryKey: ['work-day-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('bonus_settings').select('work_day_start, work_day_end').limit(1).single();
      return data as { work_day_start: string; work_day_end: string } | null;
    },
  });

  // ---- MAP MARKERS & DISTANCE ----
  // Fetch all profiles for map (with coordinates)
  const { data: allProfiles } = useQuery({
    queryKey: ['profiles-with-coords'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, name, address_lat, address_lng, address_city');
      return data || [];
    },
  });

  // Fetch property coords for distance appointment
  const { data: distanceData } = useQuery({
    queryKey: ['distance-appointment', distanceAppointmentId],
    enabled: !!distanceAppointmentId,
    queryFn: async () => {
      const { data: appt } = await supabase
        .from('job_appointments')
        .select('id, job_id, jobs(property_id, properties(street_address, postal_code, city))')
        .eq('id', distanceAppointmentId!)
        .single();
      if (!appt) return null;

      // Get assigned monteurs
      const { data: assigns } = await supabase
        .from('job_appointment_assignments')
        .select('person_id, person_name')
        .eq('job_appointment_id', distanceAppointmentId!);

      const property = (appt as any).jobs?.properties;
      if (!property) return null;

      // Geocode property
      const q = encodeURIComponent([property.street_address, property.postal_code, property.city].filter(Boolean).join(', '));
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
        const geo = await res.json();
        if (!geo?.[0]) return null;
        return {
          lat: parseFloat(geo[0].lat),
          lng: parseFloat(geo[0].lon),
          label: [property.street_address, property.city].filter(Boolean).join(', '),
          monteurIds: (assigns || []).map((a: any) => a.person_id),
          monteurNames: (assigns || []).map((a: any) => a.person_name || '?'),
        };
      } catch { return null; }
    },
  });

  const mapMarkers = useMemo<MapMarker[]>(() => {
    const markers: MapMarker[] = [];
    // All monteurs with coords
    for (const p of (allProfiles || [])) {
      if ((p as any).address_lat && (p as any).address_lng) {
        markers.push({
          id: `monteur-${p.user_id}`,
          lat: (p as any).address_lat,
          lng: (p as any).address_lng,
          label: p.name || 'Monteur',
          type: 'monteur',
        });
      }
    }
    // Distance appointment location
    if (distanceData) {
      markers.push({
        id: `appt-${distanceAppointmentId}`,
        lat: distanceData.lat,
        lng: distanceData.lng,
        label: distanceData.label,
        type: 'appointment',
      });
    }
    return markers;
  }, [allProfiles, distanceData, distanceAppointmentId]);

  const distanceLines = useMemo<DistanceLine[]>(() => {
    if (!distanceData) return [];
    const lines: DistanceLine[] = [];
    for (let i = 0; i < distanceData.monteurIds.length; i++) {
      const profile = (allProfiles || []).find(p => p.user_id === distanceData.monteurIds[i]);
      if (profile && (profile as any).address_lat && (profile as any).address_lng) {
        const km = haversineKm(
          (profile as any).address_lat, (profile as any).address_lng,
          distanceData.lat, distanceData.lng
        );
        lines.push({
          from: [(profile as any).address_lat, (profile as any).address_lng],
          to: [distanceData.lat, distanceData.lng],
          label: profile.name || distanceData.monteurNames[i],
          distanceKm: km,
        });
      }
    }
    return lines;
  }, [distanceData, allProfiles]);

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
            onBarClick={(bar) => setSelectedAppointment({ appointmentId: bar.appointment_id, jobId: bar.job_id })}
            onBarChange={handleBarChange}
            onVehicleClick={(vid) => setSelectedVehicleId(vid)}
            workDayStart={workDaySettings?.work_day_start || '08:00'}
            workDayEnd={workDaySettings?.work_day_end || '17:00'}
          />

          {rightPanel === 'sidebar' ? (
            <AppointmentSidebar appointments={unplannedAppointments || []} />
          ) : (
            <PlanungMap markers={mapMarkers} distanceLines={distanceLines} />
          )}
        </div>
      </div>

      {/* Drag overlay for sidebar items */}
      <DragOverlay>
        {activeDrag && (
          <div className="bg-card border rounded-lg p-3 shadow-lg w-72 opacity-90">
            <p className="text-sm font-medium truncate">{activeDrag.client_name} – {activeDrag.job_title}</p>
            <p className="text-xs text-muted-foreground">{activeDrag.type_name} · #{activeDrag.job_number}</p>
          </div>
        )}
      </DragOverlay>

      {/* Confirmation dialog for bar move/resize */}
      <GanttConfirmDialog
        request={barChangeReq}
        onConfirm={handleConfirmBarChange}
        onCancel={() => setBarChangeReq(null)}
      />

      {/* Appointment detail dialog from Gantt click */}
      <GanttAppointmentDialog
        appointmentId={selectedAppointment?.appointmentId || null}
        jobId={selectedAppointment?.jobId || null}
        open={!!selectedAppointment}
        onOpenChange={(open) => { if (!open) setSelectedAppointment(null); }}
        onShowDistance={(id) => {
          setDistanceAppointmentId(id);
          setRightPanel('map');
        }}
      />

      {/* Vehicle status dialog */}
      <VehicleStatusDialog
        vehicleId={selectedVehicleId}
        open={!!selectedVehicleId}
        onOpenChange={(open) => { if (!open) setSelectedVehicleId(null); }}
        onUpdated={() => queryClient.invalidateQueries({ queryKey: ['planung-teams'] })}
      />
    </DndContext>
  );
};

export default AdminMontagePlanung;
