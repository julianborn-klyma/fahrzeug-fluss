import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, Briefcase, MapPin, User, Calendar } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAllTasks } from '@/hooks/useTasks';
import { useAuth } from '@/context/AuthContext';
import CreateTaskDialog from '@/components/tasks/CreateTaskDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const ENTITY_LABELS: Record<string, { label: string; icon: any; pathFn: (id: string) => string }> = {
  job: { label: 'Auftrag', icon: Briefcase, pathFn: (id) => `/admin/montage/job/${id}` },
  property: { label: 'Immobilie', icon: MapPin, pathFn: (id) => `/admin/montage/immobilien/${id}` },
  client: { label: 'Kunde', icon: User, pathFn: (id) => `/admin/montage/kunden/${id}` },
  appointment: { label: 'Termin', icon: Calendar, pathFn: () => '#' },
};

const AdminTasks = () => {
  const { tasks, isLoading, toggleTaskStatus } = useAllTasks();
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [personFilter, setPersonFilter] = useState<string>('mine');
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch all profiles for the person filter dropdown
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-list'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, name, email').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      // Person filter
      if (personFilter === 'mine') return t.assigned_to === user?.id;
      if (personFilter === 'all') return true;
      return t.assigned_to === personFilter;
    });
  }, [tasks, statusFilter, personFilter, user?.id]);

  const handleToggle = async (id: string, currentStatus: string) => {
    try {
      await toggleTaskStatus.mutateAsync({ id, currentStatus });
      toast.success(currentStatus === 'open' ? 'Aufgabe geschlossen.' : 'Aufgabe wiedereröffnet.');
    } catch {
      toast.error('Fehler.');
    }
  };

  const title = personFilter === 'mine'
    ? 'Meine Aufgaben'
    : personFilter === 'all'
      ? 'Alle Aufgaben'
      : `Aufgaben von ${profiles.find(p => p.user_id === personFilter)?.name || '…'}`;

  return (
    <AdminLayout>
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Select value={personFilter} onValueChange={setPersonFilter}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200] bg-popover">
                  <SelectItem value="mine">Meine Aufgaben</SelectItem>
                  <SelectItem value="all">Alle Aufgaben</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.name || p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-popover">
                <SelectItem value="open">Offen</SelectItem>
                <SelectItem value="closed">Geschlossen</SelectItem>
                <SelectItem value="all">Alle</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Neue Aufgabe
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Keine Aufgaben gefunden.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => {
              const isOverdue = task.due_date && task.status === 'open' && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
              const entity = task.entity_type ? ENTITY_LABELS[task.entity_type] : null;
              const EntityIcon = entity?.icon;

              return (
                <div key={task.id} className="border rounded-lg p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <button onClick={() => handleToggle(task.id, task.status)} className="shrink-0">
                    {task.status === 'closed' ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'closed' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                    )}
                  </div>

                  {/* Show assigned person name when viewing all or specific person */}
                  {personFilter !== 'mine' && task.assigned_profile && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {task.assigned_profile.name}
                    </span>
                  )}

                  {entity && task.entity_id && (
                    <Badge
                      variant="outline"
                      className="cursor-pointer text-xs gap-1 shrink-0"
                      onClick={() => navigate(entity.pathFn(task.entity_id!))}
                    >
                      {EntityIcon && <EntityIcon className="h-3 w-3" />}
                      {entity.label}
                    </Badge>
                  )}

                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs gap-0.5 shrink-0">
                      <AlertCircle className="h-3 w-3" /> Überfällig
                    </Badge>
                  )}

                  {task.due_date && !isOverdue && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {format(new Date(task.due_date), 'dd.MM.yy', { locale: de })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <CreateTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </AdminLayout>
  );
};

export default AdminTasks;
