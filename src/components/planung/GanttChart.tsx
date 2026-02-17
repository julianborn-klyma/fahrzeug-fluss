import { useState, useRef, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Users, User, AlertCircle } from 'lucide-react';
import { format, isToday, isWeekend, differenceInCalendarDays, startOfDay, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { BarChangeRequest } from './GanttConfirmDialog';

export interface GanttTeam {
  id: string;
  name: string;
  members: { user_id: string; name: string }[];
}

export interface GanttBar {
  id: string;
  appointment_id: string;
  person_id: string;
  start_date: string;
  end_date: string | null;
  type_name: string;
  job_number: string;
  job_title: string;
  trade: string | null;
  job_id: string;
  isIncomplete?: boolean;
}

interface Props {
  teams: GanttTeam[];
  days: Date[];
  bars: GanttBar[];
  onBarClick?: (bar: GanttBar) => void;
  onBarChange?: (req: BarChangeRequest) => void;
  workDayStart?: string;
  workDayEnd?: string;
}

const TRADE_CLASSES: Record<string, string> = {
  SHK: 'bg-trade-shk border-trade-shk-border text-trade-shk-text',
  Elektro: 'bg-trade-elektro border-trade-elektro-border text-trade-elektro-text',
  Fundament: 'bg-trade-fundament border-trade-fundament-border text-trade-fundament-text',
  Dach: 'bg-trade-dach border-trade-dach-border text-trade-dach-text',
  GaLa: 'bg-trade-gala border-trade-gala-border text-trade-gala-text',
};

const ROW_HEIGHT = 48; // h-12 = 48px
const BAR_FULL = 40;
const BAR_HALF = 18;
const BAR_GAP = 2;

const DroppableCell = ({ id, className }: { id: string; className?: string }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && 'bg-primary/20 ring-1 ring-primary/40')}
    />
  );
};

/** Group overlapping bars and assign lanes */
function assignLanes(bars: { startIdx: number; endIdx: number; bar: GanttBar }[]) {
  // Sort by start
  const sorted = [...bars].sort((a, b) => a.startIdx - b.startIdx || a.endIdx - b.endIdx);
  const lanes: { startIdx: number; endIdx: number; bar: GanttBar; lane: number }[] = [];
  const laneEnds: number[] = [];

  for (const item of sorted) {
    let placed = false;
    for (let l = 0; l < laneEnds.length; l++) {
      if (item.startIdx > laneEnds[l]) {
        laneEnds[l] = item.endIdx;
        lanes.push({ ...item, lane: l });
        placed = true;
        break;
      }
    }
    if (!placed) {
      laneEnds.push(item.endIdx);
      lanes.push({ ...item, lane: laneEnds.length - 1 });
    }
  }

  const maxLanes = laneEnds.length;
  return { lanes, maxLanes };
}

const GanttChart = ({ teams, days, bars, onBarClick, onBarChange, workDayStart = '08:00', workDayEnd = '17:00' }: Props) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const totalDays = days.length;
  const viewStart = days[0];

  // Drag state for move/resize
  const dragRef = useRef<{
    bar: GanttBar;
    mode: 'move' | 'resize-end';
    startX: number;
    origStartIdx: number;
    origEndIdx: number;
    rowEl: HTMLElement;
    personId: string;
    personName: string;
  } | null>(null);
  const wasDragged = useRef(false);
  const [dragPreview, setDragPreview] = useState<{
    barId: string;
    left: string;
    width: string;
  } | null>(null);

  const getPersonBars = (personId: string) => bars.filter(b => b.person_id === personId);

  // Parse work day hours
  const parseTime = (t: string) => { const [h, m] = t.split(':').map(Number); return h + m / 60; };
  const dayStartHour = parseTime(workDayStart);
  const dayEndHour = parseTime(workDayEnd);
  const dayHours = Math.max(1, dayEndHour - dayStartHour);

  const getBarIndices = useCallback((bar: GanttBar) => {
    const start = startOfDay(new Date(bar.start_date));
    const end = bar.end_date ? startOfDay(new Date(bar.end_date)) : start;
    const startIdx = Math.max(0, differenceInCalendarDays(start, viewStart));
    const endIdx = Math.min(totalDays - 1, differenceInCalendarDays(end, viewStart));
    if (endIdx < 0 || startIdx >= totalDays) return null;
    return { startIdx, endIdx };
  }, [viewStart, totalDays]);

  /** Get fractional position within a day based on time (0..1) */
  const getTimeFraction = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    const h = d.getHours() + d.getMinutes() / 60;
    return Math.max(0, Math.min(1, (h - dayStartHour) / dayHours));
  }, [dayStartHour, dayHours]);

  const idxToPosition = useCallback((startIdx: number, endIdx: number, startFrac = 0, endFrac = 1) => ({
    left: `${((startIdx + startFrac) / totalDays) * 100}%`,
    width: `${((endIdx - startIdx + endFrac - startFrac) / totalDays) * 100}%`,
  }), [totalDays]);

  // Get day width from a row element
  const getDayWidth = useCallback((rowEl: HTMLElement) => {
    const gridEl = rowEl;
    return gridEl.clientWidth / totalDays;
  }, [totalDays]);

  // Find which person row mouse is currently over
  const findPersonAtY = useCallback((clientY: number): { personId: string; personName: string } | null => {
    const rows = document.querySelectorAll('[data-person-row]');
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return {
          personId: row.getAttribute('data-person-id') || '',
          personName: row.getAttribute('data-person-name') || '',
        };
      }
    }
    return null;
  }, []);

  const handleBarMouseDown = useCallback((
    e: React.MouseEvent,
    bar: GanttBar,
    mode: 'move' | 'resize-end',
    rowEl: HTMLElement,
    personId: string,
    personName: string,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const indices = getBarIndices(bar);
    if (!indices) return;

    wasDragged.current = false;
    dragRef.current = {
      bar,
      mode,
      startX: e.clientX,
      origStartIdx: indices.startIdx,
      origEndIdx: indices.endIdx,
      rowEl,
      personId,
      personName,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dist = Math.abs(ev.clientX - dragRef.current.startX);
      if (dist > 3) wasDragged.current = true;
      const d = dragRef.current;
      const dayW = getDayWidth(d.rowEl);
      const deltaIdx = Math.round((ev.clientX - d.startX) / dayW);

      let newStart = d.origStartIdx;
      let newEnd = d.origEndIdx;

      if (d.mode === 'move') {
        newStart = Math.max(0, Math.min(totalDays - 1, d.origStartIdx + deltaIdx));
        const span = d.origEndIdx - d.origStartIdx;
        newEnd = Math.min(totalDays - 1, newStart + span);
        newStart = newEnd - span; // clamp start
      } else {
        newEnd = Math.max(newStart, Math.min(totalDays - 1, d.origEndIdx + deltaIdx));
      }

      setDragPreview({
        barId: d.bar.id,
        ...idxToPosition(newStart, newEnd),
      });
    };

    const handleMouseUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setDragPreview(null);

      if (!dragRef.current) return;
      const d = dragRef.current;
      const dayW = getDayWidth(d.rowEl);
      const deltaIdx = Math.round((ev.clientX - d.startX) / dayW);

      let newStartIdx = d.origStartIdx;
      let newEndIdx = d.origEndIdx;

      if (d.mode === 'move') {
        newStartIdx = Math.max(0, Math.min(totalDays - 1, d.origStartIdx + deltaIdx));
        const span = d.origEndIdx - d.origStartIdx;
        newEndIdx = Math.min(totalDays - 1, newStartIdx + span);
        newStartIdx = newEndIdx - span;
      } else {
        newEndIdx = Math.max(newStartIdx, Math.min(totalDays - 1, d.origEndIdx + deltaIdx));
      }

      // Check if moved to different person
      const targetPerson = findPersonAtY(ev.clientY);

      const hasChanged = newStartIdx !== d.origStartIdx || newEndIdx !== d.origEndIdx ||
        (targetPerson && targetPerson.personId !== d.personId);

      if (hasChanged && onBarChange) {
        const newStartDate = days[newStartIdx];
        const newEndDate = days[newEndIdx];
        // Preserve original times
        const origStartTime = d.bar.start_date.slice(11, 16) || '08:00';
        const origEndTime = d.bar.end_date?.slice(11, 16) || '17:00';

        const req: BarChangeRequest = {
          appointmentId: d.bar.appointment_id,
          typeName: d.bar.type_name,
          jobTitle: d.bar.job_title,
          jobNumber: d.bar.job_number,
          newStartDate: `${format(newStartDate, 'yyyy-MM-dd')}T${origStartTime}:00`,
          newEndDate: `${format(newEndDate, 'yyyy-MM-dd')}T${origEndTime}:00`,
        };

        if (targetPerson && targetPerson.personId !== d.personId) {
          req.newPersonId = targetPerson.personId;
          req.newPersonName = targetPerson.personName;
          req.oldPersonId = d.personId;
        }

        onBarChange(req);
      }

      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [getBarIndices, getDayWidth, idxToPosition, totalDays, days, findPersonAtY, onBarChange]);

  const colStyle = { gridTemplateColumns: `repeat(${totalDays}, minmax(80px, 1fr))` };

  return (
    <div className="flex-1 overflow-auto border-r select-none">
      {/* Day headers */}
      <div className="flex sticky top-0 bg-card z-20 border-b">
        <div className="w-52 shrink-0 border-r p-2 text-xs font-semibold text-muted-foreground">
          Teams & Mitarbeiter
        </div>
        <div className="flex-1 grid" style={colStyle}>
          {days.map((day, idx) => {
            const weekend = isWeekend(day);
            const today = isToday(day);
            const weekSep = idx > 0 && day.getDay() === 1;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'text-center py-2 px-1 border-r',
                  today && 'bg-primary/10',
                  weekend && 'bg-muted/60',
                  weekSep && 'border-l-2 border-l-border',
                )}
              >
                <div className={cn(
                  'text-[10px] uppercase',
                  today ? 'text-primary font-bold' : weekend ? 'text-muted-foreground/70' : 'text-muted-foreground',
                )}>
                  {format(day, 'EEEEEE', { locale: de }).toUpperCase()}.
                </div>
                <div className={cn(
                  'text-sm font-semibold',
                  today ? 'text-primary' : weekend ? 'text-muted-foreground/70' : '',
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team sections */}
      {teams.map(team => (
        <div key={team.id}>
          {/* Team header row */}
          <div
            className="flex border-b bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setCollapsed(p => ({ ...p, [team.id]: !p[team.id] }))}
          >
            <div className="w-52 shrink-0 border-r p-2 flex items-center gap-2">
              {collapsed[team.id]
                ? <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
              <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm truncate">{team.name}</span>
              <Badge variant="secondary" className="text-[10px] ml-auto shrink-0">{team.members.length}</Badge>
            </div>
            <div className="flex-1 grid" style={colStyle}>
              {days.map((day, idx) => {
                const weekSep = idx > 0 && day.getDay() === 1;
                return (
                  <div key={day.toISOString()} className={cn(
                    'border-r h-9',
                    isToday(day) && 'bg-primary/5',
                    isWeekend(day) && 'bg-muted/40',
                    weekSep && 'border-l-2 border-l-border',
                  )} />
                );
              })}
            </div>
          </div>

          {/* Member rows */}
          {!collapsed[team.id] && team.members.map(member => {
            const personBars = getPersonBars(member.user_id);
            // Calculate lanes for overlapping bars
            const barItems = personBars
              .map(bar => {
                const idx = getBarIndices(bar);
                if (!idx) return null;
                return { ...idx, bar };
              })
              .filter(Boolean) as { startIdx: number; endIdx: number; bar: GanttBar }[];

            const { lanes, maxLanes } = assignLanes(barItems);
            const rowH = maxLanes <= 1 ? ROW_HEIGHT : Math.max(ROW_HEIGHT, maxLanes * (BAR_HALF + BAR_GAP) + BAR_GAP * 2);

            return (
              <div
                key={member.user_id}
                className="flex border-b hover:bg-muted/5 transition-colors"
                data-person-row
                data-person-id={member.user_id}
                data-person-name={member.name}
              >
                <div className="w-52 shrink-0 border-r p-2 pl-9 flex items-center gap-2" style={{ minHeight: rowH }}>
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{member.name || 'Unbenannt'}</span>
                </div>
                <div
                  className="flex-1 relative"
                  style={{ display: 'grid', ...colStyle, minHeight: rowH }}
                  data-grid-row={member.user_id}
                >
                  {/* Droppable day cells */}
                  {days.map((day, idx) => {
                    const weekSep = idx > 0 && day.getDay() === 1;
                    return (
                      <DroppableCell
                        key={day.toISOString()}
                        id={`${member.user_id}|${format(day, 'yyyy-MM-dd')}|${member.name}`}
                        className={cn(
                          'border-r',
                          isToday(day) && 'bg-primary/5',
                          isWeekend(day) && 'bg-muted/40',
                          weekSep && 'border-l-2 border-l-border',
                        )}
                        // Don't fix height, let it grow with row
                      />
                    );
                  })}
                  {/* Appointment bars with lane stacking */}
                  {lanes.map(({ bar, lane }) => {
                    const barStartIdx = Math.max(0, differenceInCalendarDays(startOfDay(new Date(bar.start_date)), viewStart));
                    const barEndIdx = Math.min(totalDays - 1, differenceInCalendarDays(bar.end_date ? startOfDay(new Date(bar.end_date)) : startOfDay(new Date(bar.start_date)), viewStart));
                    const isSingleDay = barStartIdx === barEndIdx;
                    const startFrac = isSingleDay || barStartIdx === differenceInCalendarDays(startOfDay(new Date(bar.start_date)), viewStart) ? getTimeFraction(bar.start_date) : 0;
                    const endFrac = isSingleDay || barEndIdx === differenceInCalendarDays(bar.end_date ? startOfDay(new Date(bar.end_date)) : startOfDay(new Date(bar.start_date)), viewStart) ? getTimeFraction(bar.end_date || bar.start_date) : 1;
                    const pos = idxToPosition(barStartIdx, barEndIdx, startFrac, endFrac);
                    const tradeClass = TRADE_CLASSES[bar.trade || ''] || 'bg-secondary border-border text-foreground';

                    const isPreview = dragPreview?.barId === bar.id;
                    const displayPos = isPreview ? { left: dragPreview.left, width: dragPreview.width } : pos;

                    const barH = maxLanes > 1 ? BAR_HALF : BAR_FULL;
                    const topOffset = maxLanes > 1
                      ? BAR_GAP + lane * (BAR_HALF + BAR_GAP)
                      : (ROW_HEIGHT - BAR_FULL) / 2;

                    return (
                      <div
                        key={bar.id}
                        className={cn(
                          'absolute rounded-md border text-xs px-1.5 flex items-center gap-1 z-10 shadow-sm transition-shadow truncate group',
                          tradeClass,
                          isPreview && 'opacity-70 ring-2 ring-primary',
                        )}
                        style={{
                          left: displayPos.left,
                          width: displayPos.width,
                          top: topOffset,
                          height: barH,
                        }}
                        title={`${bar.job_title}_${bar.type_name}`}
                      >
                        {/* Move handle (entire bar) */}
                        <div
                          className="absolute inset-0 cursor-grab active:cursor-grabbing"
                          onMouseDown={e => {
                            const gridEl = (e.currentTarget.closest('[data-grid-row]') as HTMLElement);
                            if (gridEl) handleBarMouseDown(e, bar, 'move', gridEl, member.user_id, member.name);
                          }}
                          onClick={() => { if (!wasDragged.current) onBarClick?.(bar); }}
                        />
                        {/* Content */}
                        {bar.isIncomplete && (
                          <AlertCircle className="h-3 w-3 text-destructive shrink-0 relative pointer-events-none" />
                        )}
                        <span className="font-medium truncate relative pointer-events-none">
                          {bar.job_title}_{bar.type_name}
                        </span>
                        {/* Resize handle (right edge) */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-foreground/10 rounded-r-md"
                          onMouseDown={e => {
                            const gridEl = (e.currentTarget.closest('[data-grid-row]') as HTMLElement);
                            if (gridEl) handleBarMouseDown(e, bar, 'resize-end', gridEl, member.user_id, member.name);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {teams.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Keine Teams gefunden. Bitte Teams in den Einstellungen anlegen.
        </div>
      )}
    </div>
  );
};

export default GanttChart;
