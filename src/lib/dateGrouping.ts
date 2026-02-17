import { getISOWeek, getYear, getMonth, format } from 'date-fns';
import { de } from 'date-fns/locale';

export type GroupByOption =
  | 'none'
  | 'kw_start'
  | 'month_start'
  | 'kw_end'
  | 'month_end'
  | 'trade';

export const GROUP_BY_LABELS: Record<GroupByOption, string> = {
  none: 'Keine Gruppierung',
  kw_start: 'KW Startdatum',
  month_start: 'Monat Startdatum',
  kw_end: 'KW Abschlussdatum',
  month_end: 'Monat Abschlussdatum',
  trade: 'Gewerk',
};

export function getCalendarWeek(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    return getISOWeek(new Date(dateStr));
  } catch {
    return null;
  }
}

export function getCalendarMonth(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    return getMonth(new Date(dateStr)) + 1;
  } catch {
    return null;
  }
}

export function getCalendarYear(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    return getYear(new Date(dateStr));
  } catch {
    return null;
  }
}

export function getKWLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Kein Datum';
  try {
    const d = new Date(dateStr);
    return `KW ${getISOWeek(d)} / ${getYear(d)}`;
  } catch {
    return 'Kein Datum';
  }
}

export function getMonthLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Kein Datum';
  try {
    return format(new Date(dateStr), 'MMMM yyyy', { locale: de });
  } catch {
    return 'Kein Datum';
  }
}

export function getGroupKey(
  groupBy: GroupByOption,
  item: { start_date?: string | null; end_date?: string | null; trade?: string | null; appointment_types?: { trade?: string | null } | null }
): string {
  switch (groupBy) {
    case 'kw_start':
      return getKWLabel(item.start_date);
    case 'month_start':
      return getMonthLabel(item.start_date);
    case 'kw_end':
      return getKWLabel(item.end_date);
    case 'month_end':
      return getMonthLabel(item.end_date);
    case 'trade':
      return item.trade || item.appointment_types?.trade || 'Kein Gewerk';
    default:
      return '';
  }
}

export function groupItems<T>(items: T[], groupBy: GroupByOption, keyFn: (item: T) => string): { key: string; items: T[] }[] {
  if (groupBy === 'none') return [{ key: '', items }];
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
}

/** Generate KW options for filter dropdown */
export function generateKWOptions(year: number): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  for (let kw = 1; kw <= 53; kw++) {
    opts.push({ value: `${kw}`, label: `KW ${kw}` });
  }
  return opts;
}

export const MONTH_OPTIONS = [
  { value: '1', label: 'Januar' },
  { value: '2', label: 'Februar' },
  { value: '3', label: 'März' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Dezember' },
];
