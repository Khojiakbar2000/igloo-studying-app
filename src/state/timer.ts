import { growGarden } from '../garden/progression';
import { restoreDiscoveries, type Discoveries } from '../window-surprises/events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyGoalData, localDateKey, makeId, type ActiveFocus, type DailyGoalData, type FocusSession } from './dailyGoals';

import { EMPTY_AWARDS, recordAwards, restoreAwards, type AwardState } from '../awards/progression';

import { UNLIMITED_SNOWFLAKES, createHome, restoreHome, rewardHome, type HomeState } from '../home/state';

const STORAGE_KEY = 'igloo.timer.v1';
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';
export type TimerState = DailyGoalData & {
  home: HomeState; discoveries: Discoveries; surpriseSounds: boolean; awards: AwardState; mode: TimerMode; status: TimerStatus; focusMinutes: number; durationMs: number;
  remainingMs: number; endAt: number | null; focusTotalMs: number; completedSessions: number;
};
export const defaultTimerState: TimerState = {
  ...emptyGoalData, home: createHome(), discoveries: {}, surpriseSounds: false, awards: EMPTY_AWARDS, mode: 'focus', status: 'idle', focusMinutes: 25, durationMs: 25 * 60_000,
  remainingMs: 25 * 60_000, endAt: null, focusTotalMs: 0, completedSessions: 0,
};

/** Backwards-compatible extension of the existing atomic timer snapshot. */
export function restoreTimerState(raw: string | null, now = Date.now()): TimerState {
  if (!raw) return defaultTimerState;
  try {
    const parsed = JSON.parse(raw);
    const state: TimerState = { ...defaultTimerState, ...parsed };
    if (!['focus', 'shortBreak', 'longBreak'].includes(state.mode) || !['idle', 'running', 'paused'].includes(state.status)
      || !Number.isFinite(state.durationMs) || state.durationMs <= 0 || !Number.isFinite(state.remainingMs)
      || !Number.isFinite(state.focusTotalMs) || !Number.isFinite(state.completedSessions)) return defaultTimerState;
    state.goals = Array.isArray(parsed.goals) ? parsed.goals.filter((g: any) => typeof g.id === 'string' && typeof g.title === 'string' && typeof g.date === 'string').map((g: any) => ({ ...g, completedAt: g.completedAt ?? null, firstCompletedAt: g.firstCompletedAt ?? g.completedAt ?? null, deletedAt: g.deletedAt ?? null })) : [];
    state.sessions = Array.isArray(parsed.sessions) ? [...new Map<string, FocusSession>(parsed.sessions.filter((s: any) => typeof s.id === 'string' && Array.isArray(s.spans) && Number.isFinite(s.focusMs)).map((s: FocusSession) => [s.id, s] as const)).values()] : [];
    state.discoveries = restoreDiscoveries(parsed.discoveries);
    state.surpriseSounds = parsed.surpriseSounds === true;
    state.awards = restoreAwards(parsed.awards, state.sessions);
    state.home = restoreHome(parsed.home, state.sessions.map(s => s.id));
    state.celebratedDates = Array.isArray(parsed.celebratedDates) ? parsed.celebratedDates.filter((d: unknown) => typeof d === 'string') : [];
    if (state.activeFocus && (!state.activeFocus.id || !Array.isArray(state.activeFocus.spans))) state.activeFocus = null;
    if (state.status === 'running' && !Number.isFinite(state.endAt)) state.status = 'paused';
    if (state.status === 'running' && state.endAt) {
      return reconcileTimer(state, now);
    }
    return state;
  } catch { return defaultTimerState; }
}
export async function loadTimerState() {
  return restoreTimerState(await AsyncStorage.getItem(STORAGE_KEY));
}
let writes: Promise<void> = Promise.resolve();
export function saveTimerState(state: TimerState) {
  // JSON encodes Infinity as null, so save the unlimited balance explicitly.
  const raw = JSON.stringify(state.home.snowflakes === Infinity
    ? { ...state, home: { ...state.home, snowflakes: UNLIMITED_SNOWFLAKES } }
    : state);
  const write = writes.catch(() => undefined).then(() => AsyncStorage.setItem(STORAGE_KEY, raw));
  writes = write;
  return write;
}

function activeFor(state: TimerState, now: number): ActiveFocus {
  if (state.activeFocus) return state.activeFocus;
  const goal = state.goals.find((g) => g.id === state.selectedGoalId && !g.deletedAt && !g.completedAt && g.date === localDateKey(now));
  // Legacy paused/running snapshots have no spans. Preserve their elapsed focus credit.
  const spent = Math.max(0, state.durationMs - state.remainingMs);
  const end = state.status === 'running' && state.endAt ? Math.min(now, state.endAt) : now;
  return { id: makeId('focus', now), goalId: goal?.id ?? null, goalTitle: goal?.title ?? null, startedAt: end - spent,
    runningSince: null, spans: spent ? [{ start: end - spent, end }] : [] };
}
function closeSpan(active: ActiveFocus, end: number): ActiveFocus {
  return { ...active, runningSince: null, spans: active.runningSince !== null && end > active.runningSince ? [...active.spans, { start: active.runningSince, end }] : active.spans };
}
export function startTimer(state: TimerState, now = Date.now()): TimerState {
  if (state.status === 'running') return state;
  const active = state.mode === 'focus' ? activeFor(state, now) : null;
  return { ...state, status: 'running', endAt: now + state.remainingMs, activeFocus: active ? { ...active, runningSince: now } : null };
}
export function pauseTimer(state: TimerState, now = Date.now()): TimerState {
  if (state.status !== 'running' || !state.endAt) return state;
  const remainingMs = Math.max(0, state.endAt - now);
  if (!remainingMs) return completeSession({ ...state, remainingMs: 0 }, state.endAt);
  const active = state.mode === 'focus' ? activeFor(state, now) : null;
  return { ...state, status: 'paused', remainingMs, endAt: null, activeFocus: active ? { ...closeSpan(active, now), interrupted: true } : null };
}
export function completeSession(state: TimerState, now = Date.now()): TimerState {
  if (state.status === 'idle') return state;
  if (state.mode === 'focus') {
    const endedAt = state.status === 'running' && state.endAt ? Math.min(now, state.endAt) : now;
    const active = closeSpan(activeFor(state, endedAt), endedAt);
    const alreadyRecorded = state.sessions.some((s) => s.id === active.id);
    const focusMs = Math.max(0, state.durationMs - state.remainingMs);
    const goal = state.goals.find((g) => g.id === active.goalId && !g.deletedAt && !g.completedAt);
    const record: FocusSession = { id: active.id, goalId: active.goalId, goalTitle: active.goalTitle, startedAt: active.startedAt,
      endedAt, date: localDateKey(endedAt), focusMs, spans: active.spans, completed: state.remainingMs === 0,
      interrupted: active.interrupted, review: goal && focusMs > 0 ? 'pending' : null };
    const sessions = alreadyRecorded ? state.sessions : [...state.sessions, record];
    const awards = !alreadyRecorded && record.completed ? recordAwards(state.awards, sessions) : state.awards;
    const nextCount = state.completedSessions + (alreadyRecorded ? 0 : 1);
    const mode: TimerMode = nextCount > 0 && nextCount % 4 === 0 ? 'longBreak' : 'shortBreak';
    const durationMs = mode === 'longBreak' ? 15 * 60_000 : 5 * 60_000;
    return { ...state, mode, status: 'idle', durationMs, remainingMs: durationMs, endAt: null, activeFocus: null,
      home: alreadyRecorded ? state.home : { ...rewardHome(state.home, record), garden: growGarden(state.home.garden, record) },
      sessions, awards, focusTotalMs: state.focusTotalMs + (alreadyRecorded ? 0 : focusMs), completedSessions: nextCount };
  }
  const durationMs = state.focusMinutes * 60_000;
  return { ...state, mode: 'focus', status: 'idle', durationMs, remainingMs: durationMs, endAt: null, activeFocus: null };
}
export function finishTimer(state: TimerState, now = Date.now()) {
  const exact = state.status === 'running' && state.endAt ? { ...state, remainingMs: Math.max(0, state.endAt - now) } : state;
  return completeSession(exact, now);
}
export function reconcileTimer(state: TimerState, now = Date.now()): TimerState {
  if (state.status !== 'running' || !state.endAt) return state;
  const remainingMs = Math.ceil(Math.max(0, state.endAt - now) / 1000) * 1000;
  if (!remainingMs) return completeSession({ ...state, remainingMs: 0 }, state.endAt);
  return remainingMs === state.remainingMs ? state : { ...state, remainingMs };
}
export function startFocusTimer(state: TimerState, minutes?: number, now = Date.now()) {
  if (state.mode === 'focus' && state.status !== 'idle') return startTimer(state, now);
  const focusMinutes = Math.min(60, Math.max(10, minutes ?? state.focusMinutes));
  const durationMs = focusMinutes * 60_000;
  return startTimer({ ...state, focusMinutes, mode: 'focus', status: 'idle', durationMs, remainingMs: durationMs, endAt: null, activeFocus: null }, now);
}
export function setFocusDuration(state: TimerState, minutes: number, preferred = false): TimerState {
  const focusMinutes = Math.min(60, Math.max(10, minutes));
  if (state.status !== 'idle' || state.mode !== 'focus') {
    return preferred && state.focusMinutes !== focusMinutes ? { ...state, focusMinutes } : state;
  }
  const durationMs = focusMinutes * 60_000;
  return { ...state, focusMinutes, durationMs, remainingMs: durationMs, endAt: null };
}
export const CONSTRUCTION_MILESTONES = [10, 25, 40, 50, 60] as const;
const constructionTarget = CONSTRUCTION_MILESTONES[CONSTRUCTION_MILESTONES.length - 1];
export function constructionProgress(focusTotalMs: number) {
  const minutes = focusTotalMs / 60_000;
  const stage = CONSTRUCTION_MILESTONES.filter(target => minutes >= target).length;
  return { minutes, progress: Math.max(0, Math.min(1, minutes / constructionTarget)), stage,
    completed: minutes >= constructionTarget, nextMilestone: CONSTRUCTION_MILESTONES[stage] ?? null };
}
