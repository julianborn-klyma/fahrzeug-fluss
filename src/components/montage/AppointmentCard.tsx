import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Clock, ChevronDown, ChevronRight, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { TRADE_LABELS, type TradeType } from '@/types/montage';

interface AppointmentCardProps {
  appointment: any;
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  offen: 'outline',
  geplant: 'secondary',
  abgeschlossen: 'default',
  abgesagt: 'destructive',
};

const AppointmentCard = ({ appointment: a }: AppointmentCardProps) => {
  const [open, setOpen] = useState(false);

  const fields = a.appointment_type?.fields || [];
  const fieldValues = a.field_values || {};
  const assignments = a.assignments || [];

  // Compute completion status
  const requiredFields = fields.filter((f: any) => f.is_required);
  const filledRequired = requiredFields.filter((f: any) => {
    const val = fieldValues[f.id];
    return val !== undefined && val !== null && val !== '';
  });
  const isComplete = requiredFields.length === 0 || filledRequired.length === requiredFields.length;
  const hasDateSet = !!a.start_date && !!a.end_date;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className="mt-0.5">
                  {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{a.appointment_type?.name || 'Termin'}</span>
                    {a.appointment_type?.trade && (
                      <Badge variant="outline" className="text-xs">
                        {TRADE_LABELS[a.appointment_type.trade as TradeType] || a.appointment_type.trade}
                      </Badge>
                    )}
                    {a.appointment_type?.is_internal && (
                      <Badge variant="default" className="text-xs bg-amber-500 hover:bg-amber-600">Intern</Badge>
                    )}
                  </div>

                  {/* Date/Time */}
                  {hasDateSet ? (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(a.start_date), 'dd.MM.yyyy', { locale: de })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(a.start_date), 'HH:mm', { locale: de })}
                        {a.end_date && ` – ${format(new Date(a.end_date), 'HH:mm', { locale: de })}`}
                      </span>
                      {a.end_date && format(new Date(a.start_date), 'yyyy-MM-dd') !== format(new Date(a.end_date), 'yyyy-MM-dd') && (
                        <span className="text-xs">bis {format(new Date(a.end_date), 'dd.MM.yyyy', { locale: de })}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Kein Datum gesetzt</span>
                  )}

                  {/* Assigned monteurs */}
                  {assignments.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{assignments.map((ass: any) => ass.person_name || 'Unbenannt').join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Completion indicator */}
                {requiredFields.length > 0 && (
                  isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )
                )}
                <Badge variant={STATUS_VARIANTS[a.status] || 'outline'} className="text-xs">
                  {a.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
            {/* Fields */}
            {fields.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Felder</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {fields.map((f: any) => {
                    const val = fieldValues[f.id];
                    const isEmpty = val === undefined || val === null || val === '';
                    return (
                      <div key={f.id} className="text-sm">
                        <span className="text-muted-foreground">
                          {f.label}
                          {f.is_required && <span className="text-destructive ml-0.5">*</span>}
                        </span>
                        <p className={`font-medium ${isEmpty ? 'text-muted-foreground/50 italic' : ''}`}>
                          {isEmpty ? '—' : String(val)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Keine Felder definiert.</p>
            )}

            {/* Completion summary */}
            {requiredFields.length > 0 && (
              <div className="flex items-center gap-2 text-xs pt-1 border-t">
                {isComplete ? (
                  <span className="flex items-center gap-1 text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Alle Pflichtfelder ausgefüllt
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> {requiredFields.length - filledRequired.length} Pflichtfeld{requiredFields.length - filledRequired.length !== 1 ? 'er' : ''} offen
                  </span>
                )}
              </div>
            )}

            {/* Notes */}
            {a.notes && (
              <div className="text-xs border-t pt-2">
                <span className="text-muted-foreground font-semibold uppercase">Notizen</span>
                <p className="mt-1">{a.notes}</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default AppointmentCard;
