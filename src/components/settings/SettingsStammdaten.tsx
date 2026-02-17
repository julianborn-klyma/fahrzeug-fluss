import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Clock, Save } from 'lucide-react';
import { toast } from 'sonner';

const SettingsStammdaten = () => {
  const queryClient = useQueryClient();
  const [workDayStart, setWorkDayStart] = useState('08:00');
  const [workDayEnd, setWorkDayEnd] = useState('17:00');
  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['bonus-settings-stammdaten'],
    queryFn: async () => {
      const { data } = await supabase.from('bonus_settings').select('id, work_day_start, work_day_end').limit(1).single();
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setWorkDayStart((settings as any).work_day_start || '08:00');
      setWorkDayEnd((settings as any).work_day_end || '17:00');
    }
  }, [settings]);

  const handleSave = async () => {
    if (!settings?.id) return;
    setSaving(true);
    try {
      await supabase.from('bonus_settings').update({
        work_day_start: workDayStart,
        work_day_end: workDayEnd,
      } as any).eq('id', settings.id);
      queryClient.invalidateQueries({ queryKey: ['bonus-settings-stammdaten'] });
      queryClient.invalidateQueries({ queryKey: ['work-day-settings'] });
      toast.success('Arbeitszeiten gespeichert.');
    } catch {
      toast.error('Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Arbeitszeiten
          </CardTitle>
          <CardDescription className="text-sm">
            Definiere den Standard-Arbeitstag für die Planungstafel. Diese Zeiten bestimmen die Skalierung der Terminbalken im Gantt-Chart.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="space-y-1.5">
              <Label className="text-sm">Arbeitsbeginn</Label>
              <Input
                type="time"
                value={workDayStart}
                onChange={e => setWorkDayStart(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Arbeitsende</Label>
              <Input
                type="time"
                value={workDayEnd}
                onChange={e => setWorkDayEnd(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Arbeitstag: {workDayStart} – {workDayEnd} ({(() => {
              const [sh, sm] = workDayStart.split(':').map(Number);
              const [eh, em] = workDayEnd.split(':').map(Number);
              const hours = (eh * 60 + em - sh * 60 - sm) / 60;
              return hours.toFixed(1);
            })()} Stunden)
          </p>
          <Button onClick={handleSave} disabled={saving} className="mt-3 gap-2" size="sm">
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsStammdaten;
