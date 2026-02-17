import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { JOB_STATUS_LABELS, JOB_STATUS_ORDER } from '@/types/montage';
import type { JobStatus, Job } from '@/types/montage';
import { cn } from '@/lib/utils';

interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

interface JobStatusTimelineProps {
  job: Job;
  appointments: any[];
  documents: any[];
  onStatusChange: (newStatus: JobStatus) => Promise<void>;
}

/** Validates whether "vorbereitet" requirements are met. Exported for reuse. */
export function validateVorbereitetRequirements(
  appointments: any[],
  documents: any[],
): ValidationResult {
  const warnings: string[] = [];

  // All required documents must be uploaded
  for (const appt of appointments) {
    const reqDocs = appt.appointment_type?.required_documents || [];
    for (const rd of reqDocs) {
      const dt = (rd as any).document_types || rd.document_type;
      const docTypeId = rd.document_type_id;
      const uploaded = documents.some((d: any) => d.document_type_id === docTypeId);
      if (!uploaded) {
        warnings.push(`Fehlende Pflichtdokumente: ${dt?.name || 'Unbekannt'}`);
      }
    }
  }

  // All required fields in appointments must be filled
  for (const appt of appointments) {
    const fields = appt.appointment_type?.fields || [];
    const values = appt.field_values || {};
    const missingFields = fields.filter((f: any) => f.is_required && !values[f.id]?.toString().trim());
    if (missingFields.length > 0) {
      warnings.push(`Termin "${appt.appointment_type?.name || 'Unbekannt'}": Pflichtfelder nicht ausgefüllt (${missingFields.map((f: any) => f.label).join(', ')})`);
    }
  }

  // Each appointment must have at least one checklist
  for (const appt of appointments) {
    const checklists = appt.checklists || [];
    if (checklists.length === 0) {
      warnings.push(`Termin "${appt.appointment_type?.name || 'Unbekannt'}" hat keine Checkliste.`);
    }
  }

  return { valid: warnings.length === 0, warnings };
}

const STATUSES_REQUIRING_VALIDATION: JobStatus[] = ['vorbereitet', 'in_umsetzung', 'review', 'abgenommen', 'nacharbeiten', 'abgeschlossen'];

const JobStatusTimeline = ({ job, appointments, documents, onStatusChange }: JobStatusTimelineProps) => {
  const [loading, setLoading] = useState(false);
  const [transitionWarnings, setTransitionWarnings] = useState<string[]>([]);
  const currentIdx = JOB_STATUS_ORDER.indexOf(job.status);

  // Continuously validate if the current status is >= vorbereitet
  const liveValidation = useMemo(() => {
    if (STATUSES_REQUIRING_VALIDATION.includes(job.status)) {
      return validateVorbereitetRequirements(appointments, documents);
    }
    return { valid: true, warnings: [] };
  }, [job.status, appointments, documents]);

  const handleStatusChange = async (targetStatus: JobStatus) => {
    // Validate when transitioning TO vorbereitet or beyond
    const targetIdx = JOB_STATUS_ORDER.indexOf(targetStatus);
    const vorIdx = JOB_STATUS_ORDER.indexOf('vorbereitet');
    if (targetIdx >= vorIdx) {
      const validation = validateVorbereitetRequirements(appointments, documents);
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

  const nextStatus = currentIdx < JOB_STATUS_ORDER.length - 1 ? JOB_STATUS_ORDER[currentIdx + 1] : null;
  const prevStatus = currentIdx > 0 ? JOB_STATUS_ORDER[currentIdx - 1] : null;

  const allWarnings = liveValidation.warnings.length > 0 ? liveValidation.warnings : transitionWarnings;

  return (
    <div className="space-y-3">
      {/* Timeline */}
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {JOB_STATUS_ORDER.map((s, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const hasWarning = isCurrent && !liveValidation.valid;
          return (
            <div key={s} className="flex items-center">
              {i > 0 && (
                <div className={cn("h-0.5 w-6 md:w-10", isDone || isCurrent ? "bg-primary" : "bg-border")} />
              )}
              <div className="flex flex-col items-center gap-1 min-w-[60px] md:min-w-[80px]">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  hasWarning ? "border-destructive bg-destructive/10 text-destructive" :
                  isCurrent ? "border-primary bg-primary text-primary-foreground" :
                  isDone ? "border-primary bg-primary/20 text-primary" :
                  "border-border bg-background text-muted-foreground"
                )}>
                  {hasWarning ? <AlertTriangle className="h-4 w-4" /> :
                   isDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </div>
                <span className={cn(
                  "text-[10px] md:text-xs text-center leading-tight",
                  hasWarning ? "font-semibold text-destructive" :
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                )}>
                  {JOB_STATUS_LABELS[s]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {prevStatus && (
          <Button variant="outline" size="sm" disabled={loading} onClick={() => handleStatusChange(prevStatus)}>
            ← {JOB_STATUS_LABELS[prevStatus]}
          </Button>
        )}
        {nextStatus && (
          <Button size="sm" disabled={loading} onClick={() => handleStatusChange(nextStatus)}>
            {JOB_STATUS_LABELS[nextStatus]} →
          </Button>
        )}
      </div>

      {/* Validation warnings (live or transition) */}
      {allWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">
              {liveValidation.warnings.length > 0
                ? 'Voraussetzungen für den aktuellen Status nicht erfüllt:'
                : 'Status kann nicht geändert werden:'}
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-sm">
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

export default JobStatusTimeline;
