import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_ORDER } from '@/types/montage';
import type { AppointmentStatus } from '@/types/montage';
import { cn } from '@/lib/utils';

interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

interface AppointmentStatusTimelineProps {
  appointment: any;
  documents: any[];
  onStatusChange: (newStatus: AppointmentStatus) => Promise<void>;
}

/** Validates whether "vorbereitet" requirements are met for a single appointment. */
export function validateAppointmentRequirements(
  appointment: any,
  documents: any[],
): ValidationResult {
  const warnings: string[] = [];

  // Must have start and end date with assigned monteurs
  if (!appointment.start_date || !appointment.end_date) {
    warnings.push('Termin hat kein Start-/Enddatum.');
  }
  const assignments = appointment.assignments || [];
  if (assignments.length === 0) {
    warnings.push('Keine Monteure zugewiesen.');
  }

  // All required documents must be uploaded
  const reqDocs = appointment.appointment_type?.required_documents || [];
  for (const rd of reqDocs) {
    const dt = (rd as any).document_types || rd.document_type;
    const docTypeId = rd.document_type_id;
    const uploaded = documents.some((d: any) => d.document_type_id === docTypeId);
    if (!uploaded) {
      warnings.push(`Fehlende Pflichtdokumente: ${dt?.name || 'Unbekannt'}`);
    }
  }

  // All required fields must be filled
  const fields = appointment.appointment_type?.fields || [];
  const values = appointment.field_values || {};
  const missingFields = fields.filter((f: any) => f.is_required && !values[f.id]?.toString().trim());
  if (missingFields.length > 0) {
    warnings.push(`Pflichtfelder nicht ausgefüllt: ${missingFields.map((f: any) => f.label).join(', ')}`);
  }

  // Must have at least one checklist
  const checklists = appointment.checklists || [];
  if (checklists.length === 0) {
    warnings.push('Keine Checkliste zugewiesen.');
  }

  return { valid: warnings.length === 0, warnings };
}

const STATUSES_REQUIRING_VALIDATION: AppointmentStatus[] = ['vorbereitet', 'in_umsetzung', 'review', 'abgenommen'];

const AppointmentStatusTimeline = ({ appointment, documents, onStatusChange }: AppointmentStatusTimelineProps) => {
  const [loading, setLoading] = useState(false);
  const [transitionWarnings, setTransitionWarnings] = useState<string[]>([]);
  const currentStatus = (appointment.status || 'neu') as AppointmentStatus;
  const currentIdx = APPOINTMENT_STATUS_ORDER.indexOf(currentStatus);

  const liveValidation = useMemo(() => {
    if (STATUSES_REQUIRING_VALIDATION.includes(currentStatus)) {
      return validateAppointmentRequirements(appointment, documents);
    }
    return { valid: true, warnings: [] };
  }, [currentStatus, appointment, documents]);

  const handleStatusChange = async (targetStatus: AppointmentStatus) => {
    const targetIdx = APPOINTMENT_STATUS_ORDER.indexOf(targetStatus);
    const vorIdx = APPOINTMENT_STATUS_ORDER.indexOf('vorbereitet');
    if (targetIdx >= vorIdx) {
      const validation = validateAppointmentRequirements(appointment, documents);
      if (!validation.valid) {
        setTransitionWarnings(validation.warnings);
        return;
      }
    }
    setTransitionWarnings([]);
    setLoading(true);
    try {
      await onStatusChange(targetStatus);
    } finally {
      setLoading(false);
    }
  };

  const nextStatus = currentIdx < APPOINTMENT_STATUS_ORDER.length - 1 ? APPOINTMENT_STATUS_ORDER[currentIdx + 1] : null;
  const prevStatus = currentIdx > 0 ? APPOINTMENT_STATUS_ORDER[currentIdx - 1] : null;

  const allWarnings = liveValidation.warnings.length > 0 ? liveValidation.warnings : transitionWarnings;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {APPOINTMENT_STATUS_ORDER.map((s, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const hasWarning = isCurrent && !liveValidation.valid;
          return (
            <div key={s} className="flex items-center">
              {i > 0 && (
                <div className={cn("h-0.5 w-4 md:w-6", isDone || isCurrent ? "bg-primary" : "bg-border")} />
              )}
              <div className="flex flex-col items-center gap-1 min-w-[50px] md:min-w-[70px]">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors",
                  hasWarning ? "border-destructive bg-destructive/10 text-destructive" :
                  isCurrent ? "border-primary bg-primary text-primary-foreground" :
                  isDone ? "border-primary bg-primary/20 text-primary" :
                  "border-border bg-background text-muted-foreground"
                )}>
                  {hasWarning ? <AlertTriangle className="h-3 w-3" /> :
                   isDone ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                </div>
                <span className={cn(
                  "text-[9px] md:text-[10px] text-center leading-tight",
                  hasWarning ? "font-semibold text-destructive" :
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                )}>
                  {APPOINTMENT_STATUS_LABELS[s]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        {prevStatus && (
          <Button variant="outline" size="sm" className="h-6 text-[10px]" disabled={loading} onClick={() => handleStatusChange(prevStatus)}>
            ← {APPOINTMENT_STATUS_LABELS[prevStatus]}
          </Button>
        )}
        {nextStatus && (
          <Button size="sm" className="h-6 text-[10px]" disabled={loading} onClick={() => handleStatusChange(nextStatus)}>
            {APPOINTMENT_STATUS_LABELS[nextStatus]} →
          </Button>
        )}
      </div>

      {allWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1 text-xs">
              {liveValidation.warnings.length > 0
                ? 'Voraussetzungen nicht erfüllt:'
                : 'Status kann nicht geändert werden:'}
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-xs">
              {allWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AppointmentStatusTimeline;
