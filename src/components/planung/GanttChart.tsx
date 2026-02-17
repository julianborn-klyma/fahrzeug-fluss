import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Users, User } from 'lucide-react';
import { format, isToday, isWeekend, isSunday, differenceInCalendarDays, startOfDay, getISOWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
}

interface Props {
  teams: GanttTeam[];
  days: Date[];
  bars: GanttBar[];
  onBarClick?: (jobId: string) => void;
}

const TRADE_CLASSES: Record<string, string> = {
  SHK: 'bg-trade-shk border-trade-shk-border text-trade-shk-text',
  Elektro: 'bg-trade-elektro border-trade-elektro-border text-trade-elektro-text',
  Fundament: 'bg-trade-fundament border-trade-fundament-border text-trade-fundament-text',
  Dach: 'bg-trade-dach border-trade-dach-border text-trade-dach-text',
  GaLa: 'bg-trade-gala border-trade-gala-border text-trade-gala-text',
};

const DroppableCell = ({ id, className }: { id: string; className?: string }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && 'bg-primary/20 ring-1 ring-primary/40')}
    />
  );
};

const GanttChart = ({ teams, days, bars, onBarClick }: Props) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const totalDays = days.length;
  const viewStart = days[0];

  const getPersonBars = (personId: string) => bars.filter(b => b.person_id === personId);

  const getBarPosition = (bar: GanttBar) => {
    const start = startOfDay(new Date(bar.start_date));
    const end = bar.end_date ? startOfDay(new Date(bar.end_date)) : start;
    const startIdx = Math.max(0, differenceInCalendarDays(start, viewStart));
    const endIdx = Math.min(totalDays - 1, differenceInCalendarDays(end, viewStart));
    if (endIdx < 0 || startIdx >= totalDays) return null;
    return {
      left: `${(startIdx / totalDays) * 100}%`,
      width: `${(Math.max(1, endIdx - startIdx + 1) / totalDays) * 100}%`,
    };
  };

  const colStyle = { gridTemplateColumns: `repeat(${totalDays}, minmax(80px, 1fr))` };

  return (
    <div className="flex-1 overflow-auto border-r">
      {/* Day headers */}
      <div className="flex sticky top-0 bg-card z-20 border-b">
        <div className="w-52 shrink-0 border-r p-2 text-xs font-semibold text-muted-foreground">
          Teams & Mitarbeiter
        </div>
        <div className="flex-1 grid" style={colStyle}>
          {days.map((day, idx) => {
            const weekend = isWeekend(day);
            const today = isToday(day);
            // Add a thicker left border on Mondays (week separator) except the first column
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
          {/* Team header */}
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
            return (
              <div key={member.user_id} className="flex border-b hover:bg-muted/5 transition-colors">
                <div className="w-52 shrink-0 border-r p-2 pl-9 flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{member.name || 'Unbenannt'}</span>
                </div>
                <div className="flex-1 relative" style={{ display: 'grid', ...colStyle }}>
                  {/* Droppable day cells */}
                  {days.map((day, idx) => {
                    const weekSep = idx > 0 && day.getDay() === 1;
                    return (
                      <DroppableCell
                        key={day.toISOString()}
                        id={`${member.user_id}|${format(day, 'yyyy-MM-dd')}|${member.name}`}
                        className={cn(
                          'border-r h-12',
                          isToday(day) && 'bg-primary/5',
                          isWeekend(day) && 'bg-muted/40',
                          weekSep && 'border-l-2 border-l-border',
                        )}
                      />
                    );
                  })}
                  {/* Appointment bars */}
                  {personBars.map(bar => {
                    const pos = getBarPosition(bar);
                    if (!pos) return null;
                    const tradeClass = TRADE_CLASSES[bar.trade || ''] || 'bg-secondary border-border text-foreground';
                    return (
                      <div
                        key={bar.id}
                        className={cn(
                          'absolute top-1 h-10 rounded-md border text-xs px-2 flex items-center gap-1 cursor-pointer z-10 shadow-sm hover:shadow-md transition-shadow truncate',
                          tradeClass,
                        )}
                        style={{ left: pos.left, width: pos.width }}
                        title={`${bar.type_name} – ${bar.job_title} (#${bar.job_number})`}
                        onClick={() => onBarClick?.(bar.job_id)}
                      >
                        <span className="font-medium truncate">{bar.type_name}</span>
                        <span className="opacity-60 shrink-0">#{bar.job_number}</span>
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
