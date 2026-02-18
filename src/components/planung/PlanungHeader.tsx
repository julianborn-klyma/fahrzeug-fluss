import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Calendar, Map, Eye, EyeOff, Filter } from 'lucide-react';
import { format, getISOWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export type ViewMode = 'day' | 'week' | 'r4w' | 'month';
export type RightPanel = 'sidebar' | 'map';

export interface TeamOption {
  id: string;
  name: string;
}

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
  teams?: TeamOption[];
  visibleTeamIds?: string[];
  onVisibleTeamIdsChange?: (ids: string[]) => void;
}

const PlanungHeader = ({
  currentDate, onPrev, onNext, onToday,
  viewMode, onViewModeChange,
  showWeekends, onToggleWeekends,
  rightPanel, onToggleRightPanel,
  teams = [], visibleTeamIds, onVisibleTeamIdsChange,
}: Props) => {
  const kw = getISOWeek(currentDate);
  const monthYear = format(currentDate, 'MMMM yyyy', { locale: de });

  const allSelected = !visibleTeamIds || visibleTeamIds.length === teams.length;
  const someFiltered = visibleTeamIds && visibleTeamIds.length < teams.length;

  const toggleTeam = (id: string) => {
    if (!onVisibleTeamIdsChange || !visibleTeamIds) return;
    if (visibleTeamIds.includes(id)) {
      onVisibleTeamIdsChange(visibleTeamIds.filter(t => t !== id));
    } else {
      onVisibleTeamIdsChange([...visibleTeamIds, id]);
    }
  };

  const selectAll = () => {
    onVisibleTeamIdsChange?.(teams.map(t => t.id));
  };

  const selectNone = () => {
    onVisibleTeamIdsChange?.([]);
  };

  return (
    <div className="flex flex-col border-b bg-card">
      <div className="flex items-center justify-between px-4 py-2 gap-2 flex-wrap">
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
        {/* Team filter */}
        {teams.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={someFiltered ? 'secondary' : 'outline'} size="sm" className="h-8">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Teams
                {someFiltered && (
                  <Badge variant="default" className="ml-1 text-[10px] px-1.5 py-0">
                    {visibleTeamIds?.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-muted-foreground">Teams filtern</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectAll}>Alle</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectNone}>Keine</Button>
                </div>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {teams.map(team => (
                  <label
                    key={team.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={!visibleTeamIds || visibleTeamIds.includes(team.id)}
                      onCheckedChange={() => toggleTeam(team.id)}
                    />
                    <span className="truncate">{team.name}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

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

      {/* Status Legend */}
      <div className="flex items-center gap-3 px-4 py-1 border-t bg-muted/20">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase">Status:</span>
        {[
          { key: 'neu', label: 'Neu', color: 'bg-muted-foreground/50' },
          { key: 'in_planung', label: 'In Planung', color: 'bg-blue-400' },
          { key: 'vorbereitet', label: 'Vorbereitet', color: 'bg-amber-400' },
          { key: 'in_umsetzung', label: 'In Umsetzung', color: 'bg-orange-400' },
          { key: 'review', label: 'Review', color: 'bg-purple-400' },
          { key: 'abgenommen', label: 'Abgenommen', color: 'bg-green-500' },
        ].map(s => (
          <div key={s.key} className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanungHeader;
