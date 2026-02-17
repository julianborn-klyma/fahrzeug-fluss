import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, GripVertical, AlertTriangle, Users, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarAppointment {
  id: string;
  type_name: string;
  trade: string | null;
  job_id: string;
  job_number: string;
  job_title: string;
  client_name: string;
  job_status: string;
  has_assignments: boolean;
}

interface Props {
  appointments: SidebarAppointment[];
}

const TRADE_BADGE: Record<string, string> = {
  SHK: 'bg-trade-shk text-trade-shk-text border-trade-shk-border',
  Elektro: 'bg-trade-elektro text-trade-elektro-text border-trade-elektro-border',
  Fundament: 'bg-trade-fundament text-trade-fundament-text border-trade-fundament-border',
  Dach: 'bg-trade-dach text-trade-dach-text border-trade-dach-border',
  GaLa: 'bg-trade-gala text-trade-gala-text border-trade-gala-border',
};

const STATUS_GROUPS: { key: string; label: string; statuses: string[]; icon?: React.ReactNode }[] = [
  { key: 'vorbereitet', label: 'Vorbereitet', statuses: ['vorbereitet'] },
  { key: 'in_planung', label: 'In Planung', statuses: ['in_planung'] },
  { key: 'nacharbeiten', label: 'Nacharbeiten', statuses: ['review'], icon: <AlertTriangle className="h-3.5 w-3.5 text-warning" /> },
];

const DraggableCard = ({ appt }: { appt: SidebarAppointment }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-${appt.id}`,
    data: { appointment: appt },
  });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    zIndex: 50,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const tradeBadge = TRADE_BADGE[appt.trade || ''] || 'bg-secondary text-secondary-foreground';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing',
        isDragging && 'ring-2 ring-primary',
      )}
    >
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-0.5 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium truncate">
            {appt.client_name} – {appt.job_title}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', tradeBadge)}>
              {appt.type_name}
            </span>
            {appt.has_assignments && <Users className="h-3 w-3 text-muted-foreground" />}
            <Monitor className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{appt.job_number}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentSidebar = ({ appointments }: Props) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const filtered = statusFilter === 'all'
    ? appointments
    : appointments.filter(a => STATUS_GROUPS.find(g => g.key === statusFilter)?.statuses.includes(a.job_status));

  const toggleGroup = (key: string) =>
    setCollapsedGroups(p => ({ ...p, [key]: !p[key] }));

  const groups = STATUS_GROUPS.map(g => ({
    ...g,
    items: filtered.filter(a => g.statuses.includes(a.job_status)),
  })).filter(g => g.items.length > 0);

  // Items not matching any group
  const ungroupedItems = filtered.filter(a =>
    !STATUS_GROUPS.some(g => g.statuses.includes(a.job_status))
  );

  return (
    <div className="w-80 shrink-0 border-l bg-card flex flex-col">
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Verplanung</span>
          <Badge variant="secondary" className="text-xs">{appointments.length}</Badge>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Alle Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {STATUS_GROUPS.map(g => (
              <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Appointment list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {groups.map(group => (
          <div key={group.key}>
            <button
              className="flex items-center gap-2 w-full px-1 py-1.5 text-sm font-medium hover:bg-muted/50 rounded"
              onClick={() => toggleGroup(group.key)}
            >
              {group.icon}
              {collapsedGroups[group.key]
                ? <ChevronRight className="h-3.5 w-3.5" />
                : <ChevronDown className="h-3.5 w-3.5" />}
              <span>{group.label}</span>
              <Badge variant="outline" className="text-[10px] ml-auto">{group.items.length}</Badge>
            </button>
            {!collapsedGroups[group.key] && (
              <div className="space-y-2 mt-1">
                {group.items.map(appt => (
                  <DraggableCard key={appt.id} appt={appt} />
                ))}
              </div>
            )}
          </div>
        ))}

        {ungroupedItems.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground px-1 py-1">Sonstige</p>
            <div className="space-y-2">
              {ungroupedItems.map(appt => (
                <DraggableCard key={appt.id} appt={appt} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Keine Termine zur Verplanung.
          </p>
        )}
      </div>
    </div>
  );
};

export default AppointmentSidebar;
