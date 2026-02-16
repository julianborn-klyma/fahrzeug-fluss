import { useState, useEffect } from 'react';
import { useBonusSettings } from '@/context/BonusSettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';

const WEIGHT_KEYS = [
  { key: 'weight_speed', label: 'Schnelligkeit' },
  { key: 'weight_quality', label: 'Qualität' },
  { key: 'weight_reliability', label: 'Zuverlässigkeit' },
  { key: 'weight_team', label: 'Teamarbeit' },
  { key: 'weight_cleanliness', label: 'Sauberkeit' },
] as const;

const SettingsBonusParams = () => {
  const { settings, loading, updateSettings } = useBonusSettings();

  const [pool, setPool] = useState(2000);
  const [weights, setWeights] = useState<Record<string, number>>({
    weight_speed: 30,
    weight_quality: 30,
    weight_reliability: 15,
    weight_team: 15,
    weight_cleanliness: 10,
  });
  const [thresholdBonus, setThresholdBonus] = useState(1.0);
  const [thresholdNeutral, setThresholdNeutral] = useState(0.5);
  const [requireApproval, setRequireApproval] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setPool(settings.half_year_bonus_pool);
      setWeights({
        weight_speed: Math.round(settings.weight_speed * 100),
        weight_quality: Math.round(settings.weight_quality * 100),
        weight_reliability: Math.round(settings.weight_reliability * 100),
        weight_team: Math.round(settings.weight_team * 100),
        weight_cleanliness: Math.round(settings.weight_cleanliness * 100),
      });
      setThresholdBonus(settings.threshold_min_bonus);
      setThresholdNeutral(settings.threshold_min_neutral);
      setRequireApproval(settings.require_approval);
    }
  }, [settings]);

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);
  const isWeightValid = totalWeight === 100;

  const handleSave = async () => {
    if (!isWeightValid) {
      toast.error('Die Summe der Gewichtungen muss genau 100% ergeben.');
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        half_year_bonus_pool: pool,
        weight_speed: weights.weight_speed / 100,
        weight_quality: weights.weight_quality / 100,
        weight_reliability: weights.weight_reliability / 100,
        weight_team: weights.weight_team / 100,
        weight_cleanliness: weights.weight_cleanliness / 100,
        threshold_min_bonus: thresholdBonus,
        threshold_min_neutral: thresholdNeutral,
        require_approval: requireApproval,
      });
      toast.success('Bonus-Parameter gespeichert.');
    } catch {
      toast.error('Fehler beim Speichern.');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Lade Einstellungen…</div>;
  }

  return (
    <div className="space-y-4">
      {/* Bonus Pool */}
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Bonus-Pool</CardTitle>
          <CardDescription className="text-xs">
            Maximaler Bonus pro Halbjahr und Mitarbeiter
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-2 max-w-xs">
            <Label htmlFor="pool" className="text-xs whitespace-nowrap">
              Maximaler Halbjahres-Bonus
            </Label>
            <div className="relative flex-1">
              <Input
                id="pool"
                type="number"
                min={0}
                value={pool}
                onChange={e => setPool(Number(e.target.value))}
                className="h-8 text-xs pr-6"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weights */}
      <Card>
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Gewichtung der Kategorien</CardTitle>
              <CardDescription className="text-xs">
                Prozentuale Gewichtung für die Gesamtbewertung
              </CardDescription>
            </div>
            <Badge
              variant={isWeightValid ? 'default' : 'destructive'}
              className="text-xs gap-1"
            >
              {isWeightValid ? (
                <Check className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              Summe: {totalWeight}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {WEIGHT_KEYS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key} className="text-xs">{label}</Label>
                <div className="relative">
                  <Input
                    id={key}
                    type="number"
                    min={0}
                    max={100}
                    value={weights[key]}
                    onChange={e => setWeights(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="h-8 text-xs pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Thresholds */}
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Schwellenwerte</CardTitle>
          <CardDescription className="text-xs">
            Punktegrenzen für Bonus-Berechtigung und Verbesserungsbedarf
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div className="space-y-1">
              <Label htmlFor="threshold-bonus" className="text-xs">
                Ab wann gibt es Bonus? (Punkte)
              </Label>
              <Input
                id="threshold-bonus"
                type="number"
                step={0.1}
                min={0}
                value={thresholdBonus}
                onChange={e => setThresholdBonus(Number(e.target.value))}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">≥ Wert → "Bonus erreicht"</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="threshold-neutral" className="text-xs">
                Ab wann ist Verbesserung notwendig? (Punkte)
              </Label>
              <Input
                id="threshold-neutral"
                type="number"
                step={0.1}
                min={0}
                value={thresholdNeutral}
                onChange={e => setThresholdNeutral(Number(e.target.value))}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">&lt; Wert → "Verbesserung notwendig"</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Toggle */}
      <Card>
        <CardContent className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Freigabe durch Admin erforderlich</p>
              <p className="text-xs text-muted-foreground">
                Wenn aktiviert, müssen Teamleiter-Bewertungen von einem Admin freigegeben werden.
              </p>
            </div>
            <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Formula Preview */}
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Berechnungsformel (Vorschau)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="bg-muted rounded-md p-3 text-xs font-mono space-y-1">
            <p>
              Gesamtpunkte = (Schnelligkeit × {weights.weight_speed}%) + (Qualität × {weights.weight_quality}%) + (Zuverlässigkeit × {weights.weight_reliability}%) + (Teamarbeit × {weights.weight_team}%) + (Sauberkeit × {weights.weight_cleanliness}%)
            </p>
            <p className="text-muted-foreground mt-2">
              ≥ {thresholdBonus} Punkte → Bonus: (Punkte / 2) × ({pool}€ / 6) = max. {((2 / 2) * (pool / 6)).toFixed(0)}€/Monat
            </p>
            <p className="text-muted-foreground">
              ≥ {thresholdNeutral} und &lt; {thresholdBonus} → Kein Bonus
            </p>
            <p className="text-muted-foreground">
              &lt; {thresholdNeutral} → Verbesserung notwendig
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !isWeightValid} size="sm" className="gap-2 text-xs">
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Speichere…' : 'Speichern'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsBonusParams;
