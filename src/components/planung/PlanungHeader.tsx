import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Map, Eye, EyeOff } from 'lucide-react';
import { format, getISOWeek } from 'date-fns';
import { de } from 'date-fns/locale';

export type ViewMode = 'day' | 'week' | 'r4w' | 'month';
export type RightPanel = 'sidebar' | 'map';

interface Props {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  showWeekends: boolean;
  onToggleWeekends: () => void;
  rightPanel: RightPanel;
  onToggleRightPanel: () => void;
}

const PlanungHeader = ({
  currentDate, onPrev, onNext, onToday,
  viewMode, onViewModeChange,
  showWeekends, onToggleWeekends,
  rightPanel, onToggleRightPanel,
}: Props) => {
  const kw = getISOWeek(currentDate);
  const monthYear = format(currentDate, 'MMMM yyyy', { locale: de });

  return (
    <div className="flex items-center justify-between border-b bg-card px-4 py-2 gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          <Calendar className="h-4 w-4 mr-1" />Heute
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">KW {kw}</span>
        <span className="text-sm text-muted-foreground capitalize">{monthYear}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex border rounded-lg overflow-hidden">
          {(['day', 'week', 'r4w', 'month'] as ViewMode[]).map(m => (
            <Button
              key={m}
              variant={viewMode === m ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none px-3 h-8"
              onClick={() => onViewModeChange(m)}
            >
              {m === 'day' ? 'Tag' : m === 'week' ? 'Woche' : m === 'r4w' ? 'R4W' : 'Monat'}
            </Button>
          ))}
        </div>

        <Button variant={showWeekends ? 'outline' : 'secondary'} size="sm" className="h-8" onClick={onToggleWeekends}>
          {showWeekends ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
          Wochenenden
        </Button>

        <Button
          variant={rightPanel === 'map' ? 'default' : 'outline'}
          size="sm"
          className="h-8"
          onClick={onToggleRightPanel}
        >
          <Map className="h-3.5 w-3.5 mr-1" />
          Karte
        </Button>
      </div>
    </div>
  );
};

export default PlanungHeader;
