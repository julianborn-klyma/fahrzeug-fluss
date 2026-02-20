import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBranding } from '@/hooks/useBranding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Palette } from 'lucide-react';

const COLOR_PRESETS = [
  { label: 'Gelb (Standard)', value: '45 100% 51%' },
  { label: 'Blau', value: '210 70% 50%' },
  { label: 'Grün', value: '152 60% 42%' },
  { label: 'Rot', value: '0 72% 51%' },
  { label: 'Lila', value: '262 60% 50%' },
  { label: 'Orange', value: '25 95% 53%' },
  { label: 'Türkis', value: '180 60% 45%' },
];

const hslToHex = (hslStr: string): string => {
  const parts = hslStr.split(' ');
  const h = parseFloat(parts[0]) || 0;
  const s = (parseFloat(parts[1]) || 0) / 100;
  const l = (parseFloat(parts[2]) || 0) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const SettingsBranding = () => {
  const { branding, isLoading, updateBranding } = useBranding();
  const [uploading, setUploading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [customHex, setCustomHex] = useState('#ffcc00');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (branding?.primary_color) {
      setSelectedColor(branding.primary_color);
      setCustomHex(hslToHex(branding.primary_color));
    }
  }, [branding?.primary_color]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `logo.${ext}`;
      // Remove old logo files
      const { data: existing } = await supabase.storage.from('branding').list();
      if (existing?.length) {
        await supabase.storage.from('branding').remove(existing.map(f => f.name));
      }
      const { error: uploadError } = await supabase.storage.from('branding').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('branding').getPublicUrl(path);
      await updateBranding.mutateAsync({ logo_url: urlData.publicUrl });
      toast.success('Logo aktualisiert');
    } catch (err: any) {
      toast.error('Fehler beim Hochladen: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const { data: existing } = await supabase.storage.from('branding').list();
      if (existing?.length) {
        await supabase.storage.from('branding').remove(existing.map(f => f.name));
      }
      await updateBranding.mutateAsync({ logo_url: '' });
      toast.success('Logo entfernt');
    } catch (err: any) {
      toast.error('Fehler: ' + err.message);
    }
  };

  const handleColorSave = async (hslValue: string) => {
    try {
      await updateBranding.mutateAsync({ primary_color: hslValue });
      setSelectedColor(hslValue);
      // Apply immediately
      document.documentElement.style.setProperty('--primary', hslValue);
      document.documentElement.style.setProperty('--accent', hslValue);
      document.documentElement.style.setProperty('--ring', hslValue);
      toast.success('Farbe aktualisiert. Seite wird neu geladen…');
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast.error('Fehler beim Speichern.');
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Laden…</div>;

  return (
    <div className="space-y-4">
      {/* Logo */}
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm">Logo</CardTitle>
          <CardDescription className="text-xs">
            Das Logo wird oben links in der Navigation angezeigt.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {branding?.logo_url ? (
            <div className="flex items-center gap-4">
              <img src={branding.logo_url} alt="Logo" className="h-10 max-w-[200px] object-contain" />
              <Button variant="ghost" size="icon" onClick={handleRemoveLogo}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Kein Logo hochgeladen – es wird "KLYMA" als Text angezeigt.</p>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Wird hochgeladen…' : 'Logo hochladen'}
          </Button>
        </CardContent>
      </Card>

      {/* Hauptfarbe */}
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Hauptfarbe
          </CardTitle>
          <CardDescription className="text-xs">
            Die Hauptfarbe wird für Buttons, Akzente und aktive Elemente verwendet.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleColorSave(preset.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${
                  selectedColor === preset.value
                    ? 'border-foreground bg-muted font-medium'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: `hsl(${preset.value})` }}
                />
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-xs whitespace-nowrap">Eigene Farbe:</Label>
            <Input
              type="color"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              className="h-9 w-14 p-1 cursor-pointer"
            />
            <span className="text-xs text-muted-foreground">{customHex}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleColorSave(hexToHsl(customHex))}
            >
              Übernehmen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsBranding;
