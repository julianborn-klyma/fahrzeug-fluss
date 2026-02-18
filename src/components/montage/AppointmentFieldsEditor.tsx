import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AppointmentFieldsEditorProps {
  appointmentId: string;
  fields: any[];
  fieldValues: Record<string, any>;
  readonly?: boolean;
}

const AppointmentFieldsEditor = ({ appointmentId, fields, fieldValues, readonly }: AppointmentFieldsEditorProps) => {
  const [localValues, setLocalValues] = useState<Record<string, any>>({ ...fieldValues });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const hasChanges = JSON.stringify(localValues) !== JSON.stringify(fieldValues);

  const requiredFields = fields.filter((f: any) => f.is_required);
  const filledRequired = requiredFields.filter((f: any) => {
    const val = localValues[f.id];
    return val !== undefined && val !== null && val !== '';
  });
  const isFieldsComplete = requiredFields.length === 0 || filledRequired.length === requiredFields.length;

  const updateValue = (fieldId: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('job_appointments')
        .update({ field_values: localValues } as any)
        .eq('id', appointmentId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['gantt-appointment-detail'] });
      queryClient.invalidateQueries({ queryKey: ['planung-scheduled'] });
      toast.success('Felder gespeichert.');
    } catch {
      toast.error('Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  if (fields.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Keine Felder definiert.</p>;
  }

  const renderField = (f: any) => {
    const val = localValues[f.id] ?? '';

    if (readonly) {
      const isEmpty = val === undefined || val === null || val === '';
      return (
        <div key={f.id} className={cn(f.width === 'full' ? 'col-span-2' : '')}>
          <span className="text-muted-foreground text-xs">
            {f.label}
            {f.is_required && <span className="text-destructive ml-0.5">*</span>}
          </span>
          <p className={cn("font-medium text-sm", isEmpty && "text-muted-foreground/50 italic")}>
            {isEmpty ? '—' : f.field_type === 'boolean' ? (val ? 'Ja' : 'Nein') : String(val)}
          </p>
        </div>
      );
    }

    switch (f.field_type) {
      case 'dropdown':
        return (
          <div key={f.id} className={cn(f.width === 'full' ? 'col-span-2' : '')}>
            <Label className="text-xs">
              {f.label}
              {f.is_required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            <Select value={val?.toString() || '__empty__'} onValueChange={(v) => updateValue(f.id, v === '__empty__' ? '' : v)}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue placeholder={f.placeholder || 'Wählen…'} />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-popover">
                <SelectItem value="__empty__">— Keine Auswahl —</SelectItem>
                {(Array.isArray(f.options) ? f.options : [])
                  .filter((opt: any) => {
                    const v = typeof opt === 'string' ? opt : opt?.value;
                    return v !== undefined && v !== null && v !== '';
                  })
                  .map((opt: any) => (
                  <SelectItem key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'boolean':
        return (
          <div key={f.id} className={cn("flex items-center gap-2 pt-4", f.width === 'full' ? 'col-span-2' : '')}>
            <Switch checked={!!val} onCheckedChange={(v) => updateValue(f.id, v)} />
            <Label className="text-xs">
              {f.label}
              {f.is_required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
          </div>
        );
      case 'date':
        return (
          <div key={f.id} className={cn(f.width === 'full' ? 'col-span-2' : '')}>
            <Label className="text-xs">
              {f.label}
              {f.is_required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            <Input
              type="date"
              value={val?.toString() || ''}
              onChange={(e) => updateValue(f.id, e.target.value)}
              className="h-8 text-xs mt-1"
            />
          </div>
        );
      default: // text
        return (
          <div key={f.id} className={cn(f.width === 'full' ? 'col-span-2' : '')}>
            <Label className="text-xs">
              {f.label}
              {f.is_required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            <Input
              value={val?.toString() || ''}
              onChange={(e) => updateValue(f.id, e.target.value)}
              placeholder={f.placeholder || ''}
              className="h-8 text-xs mt-1"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {fields.map(renderField)}
      </div>

      {requiredFields.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          {isFieldsComplete ? (
            <span className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Alle Pflichtfelder ausgefüllt
            </span>
          ) : (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {requiredFields.length - filledRequired.length} offen
            </span>
          )}
        </div>
      )}

      {!readonly && hasChanges && (
        <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
          <Save className="h-3 w-3" /> {saving ? 'Speichern…' : 'Felder speichern'}
        </Button>
      )}
    </div>
  );
};

export default AppointmentFieldsEditor;
