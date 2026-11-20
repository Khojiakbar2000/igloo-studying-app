export type DailyGoal = { id: string; title: string; date: string; createdAt: number; completedAt: number | null; firstCompletedAt: number | null; deletedAt: number | null };
export type FocusSpan = { start: number; end: number };
export type ActiveFocus = { id: string; goalId: string | null; goalTitle: string | null; startedAt: number; runningSince: number | null; spans: FocusSpan[]; interrupted?: boolean };
export type FocusSession = { id: string; goalId: string | null; goalTitle: string | null; startedAt: number; endedAt: number; date: string; focusMs: number; spans: FocusSpan[]; completed: boolean; interrupted?: boolean; review: 'pending' | 'finished' | 'working' | 'dismissed' | null };
export type GoalCelebration = { id: string; kind: 'goal' | 'all'; date: string };
export type DailyGoalData = { goals: DailyGoal[]; sessions: FocusSession[]; selectedGoalId: string | null; activeFocus: ActiveFocus | null; lastGoalCelebration: GoalCelebration | null; celebratedDates: string[] };

export const emptyGoalData: DailyGoalData = { goals: [], sessions: [], selectedGoalId: null, activeFocus: null, lastGoalCelebration: null, celebratedDates: [] };
export const makeId = (prefix: string, now = Date.now()) => `${prefix}-${now}-${Math.random().toString(36).slice(2, 10)}`;
export function localDateKey(now: number | Date = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function shiftLocalDate(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number);
  return localDateKey(new Date(y, m - 1, d + days, 12));
}
export function nextLocalDate(date: string) {
  return shiftLocalDate(date, 1);
}

/** Study days are verified by the existing completed-session progression. */
export function studyStreak(verifiedDays: readonly string[], today: string) {
  const days = new Set(verifiedDays.filter(date => date <= today));
  let date = days.has(today) ? today : shiftLocalDate(today, -1);
  let current = 0;
  while (days.has(date)) {
    current++;
    date = shiftLocalDate(date, -1);
  }
  let longest = 0;
  let consecutive = 0;
  let previous: string | undefined;
  for (const day of [...days].sort()) {
    consecutive = previous && nextLocalDate(previous) === day ? consecutive + 1 : 1;
    longest = Math.max(longest, consecutive);
    previous = day;
  }
  return { current, longest };
}
export function goalDayBounds(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return [new Date(y, m - 1, d).getTime(), new Date(y, m - 1, d + 1).getTime()] as const;
}
export const goalsOn = (data: DailyGoalData, date: string) => data.goals.filter((g) => g.date === date && !g.deletedAt);
export function addDailyGoal<T extends DailyGoalData>(state: T, title: string, date = localDateKey(), now = Date.now()): T {
  const text = title.trim().slice(0, 180);
  if (!text) return state;
  return { ...state, goals: [...state.goals, { id: makeId('goal', now), title: text, date, createdAt: now, completedAt: null, firstCompletedAt: null, deletedAt: null }] };
}
export function editDailyGoal<T extends DailyGoalData>(state: T, id: string, title: string): T {
  const text = title.trim().slice(0, 180);
  if (!text) return state;
  return { ...state, goals: state.goals.map((g) => g.id === id && !g.deletedAt ? { ...g, title: text } : g) };
}
export function completeDailyGoal<T extends DailyGoalData>(state: T, id: string, completed: boolean, now = Date.now()): T {
  const goal = state.goals.find((g) => g.id === id && !g.deletedAt);
  if (!goal || Boolean(goal.completedAt) === completed) return state;
  const goals = state.goals.map((g) => g.id === id ? { ...g, completedAt: completed ? now : null, firstCompletedAt: completed ? g.firstCompletedAt ?? now : g.firstCompletedAt } : g);
  const all = goals.filter((g) => g.date === goal.date && !g.deletedAt).every((g) => Boolean(g.completedAt));
  const today = localDateKey(now);
  const special = completed && all && goal.date === today && !state.celebratedDates.includes(today);
  const reaction = completed && goal.date === today && (!goal.firstCompletedAt || special);
  return { ...state, goals,
    selectedGoalId: completed && state.selectedGoalId === id ? null : state.selectedGoalId,
    sessions: completed ? state.sessions.map((s) => s.goalId === id && s.review === 'pending' ? { ...s, review: 'finished' as const } : s) : state.sessions,
    lastGoalCelebration: reaction ? { id: makeId('celebrate', now), kind: special ? 'all' : 'goal', date: today } : state.lastGoalCelebration,
    celebratedDates: special ? [...state.celebratedDates, today] : state.celebratedDates,
  };
}
export function deleteDailyGoal<T extends DailyGoalData>(state: T, id: string, now = Date.now()): T {
  return { ...state, goals: state.goals.map((g) => g.id === id ? { ...g, deletedAt: now } : g), selectedGoalId: state.selectedGoalId === id ? null : state.selectedGoalId,
    sessions: state.sessions.map((s) => s.goalId === id && s.review === 'pending' ? { ...s, review: 'dismissed' as const } : s) };
}
export function moveGoalToTomorrow<T extends DailyGoalData>(state: T, id: string, today = localDateKey()): T {
  const target = nextLocalDate(today);
  return { ...state, goals: state.goals.map((g) => g.id === id && !g.completedAt && !g.deletedAt && g.date <= today ? { ...g, date: target } : g), selectedGoalId: state.selectedGoalId === id ? null : state.selectedGoalId };
}
export function moveGoalToToday<T extends DailyGoalData>(state: T, id: string, today = localDateKey()): T {
  return { ...state, goals: state.goals.map((g) => g.id === id && !g.completedAt && !g.deletedAt ? { ...g, date: today } : g) };
}
export function pendingGoalSession(state: DailyGoalData) {
  return state.sessions.find((s) => s.review === 'pending' && state.goals.some((g) => g.id === s.goalId && !g.deletedAt && !g.completedAt));
}
export function reviewGoalSession<T extends DailyGoalData>(state: T, sessionId: string, finished: boolean, now = Date.now()): T {
  const session = state.sessions.find((s) => s.id === sessionId && s.review === 'pending');
  if (!session) return state;
  let next = { ...state, sessions: state.sessions.map((s) => s.id === sessionId ? { ...s, review: finished ? 'finished' as const : 'working' as const } : s) };
  if (finished && session.goalId) next = completeDailyGoal(next, session.goalId, true, now);
  else if (session.goalId && state.goals.some((g) => g.id === session.goalId && g.date === localDateKey(now) && !g.completedAt && !g.deletedAt)) next.selectedGoalId = session.goalId;
  return next;
}
export function focusInDay(spans: FocusSpan[], date: string) {
  const [start, end] = goalDayBounds(date);
  return spans.reduce((sum, span) => sum + Math.max(0, Math.min(span.end, end) - Math.max(span.start, start)), 0);
}
export function dailySummary(state: DailyGoalData, date: string, now = Date.now(), runningEndAt: number | null = null) {
  const active = state.activeFocus;
  const spans = active ? [...active.spans, ...(active.runningSince !== null ? [{ start: active.runningSince, end: Math.max(active.runningSince, Math.min(now, runningEndAt ?? now)) }] : [])] : [];
  const goals = goalsOn(state, date);
  return { focusMs: state.sessions.reduce((sum, s) => sum + focusInDay(s.spans, date), 0) + focusInDay(spans, date), sessions: state.sessions.filter((s) => s.date === date && s.completed).length, goalsCompleted: goals.filter((g) => g.completedAt).length, goalsTotal: goals.length };
}
