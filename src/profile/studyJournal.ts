import { focusInDay, goalDayBounds, shiftLocalDate, type FocusSpan } from '../state/dailyGoals';

export const STREAK_MILESTONES = [3, 7, 14, 30, 100] as const;

export function journalWeek(today: string, previous: boolean, spans: FocusSpan[]) {
  const [startOfToday] = goalDayBounds(today);
  const sinceMonday = (new Date(startOfToday).getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, index) => {
    const date = shiftLocalDate(today, index - sinceMonday - (previous ? 7 : 0));
    return { date, focusMs: focusInDay(spans, date) };
  });
}

export function duration(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  if (!minutes && ms > 0) return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
}

export function journalDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Date(goalDayBounds(date)[0]).toLocaleDateString(undefined, options);
}
