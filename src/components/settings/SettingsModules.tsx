import { useBonusSettings } from '@/context/BonusSettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Trophy, Warehouse } from 'lucide-react';
import { toast } from 'sonner';

const SettingsModules = () => {
  const { settings, updateSettings } = useBonusSettings();
  const perfEnabled = settings?.module_performance_enabled ?? true;
  const lagerEnabled = settings?.module_fahrzeuglager_enabled ?? true;

  const toggle = async (field: 'module_performance_enabled' | 'module_fahrzeuglager_enabled', current: boolean, label: string) => {
    try {
      await updateSettings({ [field]: !current });
      toast.success(`${label} ${!current ? 'aktiviert' : 'deaktiviert'}. Seite wird neu geladen…`);
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast.error('Fehler beim Speichern.');
    }
  };

  const modules = [
    {
      field: 'module_fahrzeuglager_enabled' as const,
      enabled: lagerEnabled,
      label: 'Fahrzeuglager',
      description: 'Fahrzeuge, Inventar und Materialverwaltung.',
      icon: Warehouse,
    },
    {
      field: 'module_performance_enabled' as const,
      enabled: perfEnabled,
      label: 'Performance & Bonus',
      description: 'Monatliche Leistungsbewertung und Bonusberechnung für Monteure.',
      icon: Trophy,
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Module</CardTitle>
          <CardDescription className="text-xs">
            Aktiviere oder deaktiviere optionale Funktionsbereiche.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {modules.map((m) => (
            <div key={m.field} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <m.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
              </div>
              <Switch checked={m.enabled} onCheckedChange={() => toggle(m.field, m.enabled, m.label)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsModules;
