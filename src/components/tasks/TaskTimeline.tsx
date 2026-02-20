import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, CheckCircle2, Circle, ChevronDown, Clock, AlertCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { useTasks } from '@/hooks/useTasks';
import CreateTaskDialog from './CreateTaskDialog';
import { toast } from 'sonner';

interface TaskTimelineProps {
  entityType: string;
  entityId: string;
}

const TaskTimeline = ({ entityType, entityId }: TaskTimelineProps) => {
  const { tasks, isLoading, toggleTaskStatus } = useTasks(entityType, entityId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [closedOpen, setClosedOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openTasks = tasks.filter((t) => t.status === 'open');
  const closedTasks = tasks.filter((t) => t.status === 'closed');

  const handleToggle = async (id: string, currentStatus: string) => {
    try {
      await toggleTaskStatus.mutateAsync({ id, currentStatus });
      toast.success(currentStatus === 'open' ? 'Aufgabe geschlossen.' : 'Aufgabe wiedereröffnet.');
    } catch {
      toast.error('Fehler.');
    }
  };

  const TaskItem = ({ task }: { task: any }) => {
    const isOverdue = task.due_date && task.status === 'open' && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
    const isExpanded = expandedId === task.id;

    return (
      <div className="border rounded-md p-2.5 space-y-1">
        <div className="flex items-center gap-2">
          <button onClick={() => handleToggle(task.id, task.status)} className="shrink-0">
            {task.status === 'closed' ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            )}
          </button>
          <span
            className={`text-sm font-medium flex-1 cursor-pointer ${task.status === 'closed' ? 'line-through text-muted-foreground' : ''}`}
            onClick={() => setExpandedId(isExpanded ? null : task.id)}
          >
            {task.title}
          </span>
          {isOverdue && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
              <AlertCircle className="h-3 w-3" /> Überfällig
            </Badge>
          )}
          {task.due_date && !isOverdue && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {format(new Date(task.due_date), 'dd.MM.yy', { locale: de })}
            </span>
          )}
        </div>
        {task.assigned_profile && (
          <p className="text-[10px] text-muted-foreground pl-6">{task.assigned_profile.name || task.assigned_profile.email}</p>
        )}
        {isExpanded && task.description && (
          <p className="text-xs text-muted-foreground pl-6 pt-1 border-t mt-1">{task.description}</p>
        )}
      </div>
    );
  };

  if (isLoading) return <div className="py-2 text-xs text-muted-foreground">Lade Aufgaben…</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aufgaben</h4>
        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3 w-3" /> Neue Aufgabe
        </Button>
      </div>

      {openTasks.length === 0 && closedTasks.length === 0 && (
        <p className="text-xs text-muted-foreground italic py-2">Keine Aufgaben vorhanden.</p>
      )}

      {openTasks.map((t) => (
        <TaskItem key={t.id} task={t} />
      ))}

      {closedTasks.length > 0 && (
        <Collapsible open={closedOpen} onOpenChange={setClosedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-1 text-muted-foreground h-7">
              <ChevronDown className={`h-3 w-3 transition-transform ${closedOpen ? '' : '-rotate-90'}`} />
              {closedTasks.length} abgeschlossen
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-1">
            {closedTasks.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entityType={entityType}
        entityId={entityId}
      />
    </div>
  );
};

export default TaskTimeline;
