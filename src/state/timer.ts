import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'igloo.timer.v1';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

export type TimerState = {
  mode: TimerMode;
  status: TimerStatus;
  focusMinutes: number;
  durationMs: number;
  remainingMs: number;
  endAt: number | null;
  focusTotalMs: number;
  completedSessions: number;
};

export const defaultTimerState: TimerState = {
  mode: 'focus', status: 'idle', focusMinutes: 25, durationMs: 25 * 60_000,
  remainingMs: 25 * 60_000, endAt: null, focusTotalMs: 0, completedSessions: 0,
};

export async function loadTimerState(): Promise<TimerState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultTimerState;
    const saved = { ...defaultTimerState, ...JSON.parse(raw) } as TimerState;
    if (saved.status === 'running' && saved.endAt) {
      const remainingMs = Math.max(0, saved.endAt - Date.now());
      if (remainingMs === 0) return completeSession({ ...saved, remainingMs: 0 });
      return { ...saved, remainingMs };
    }
    return saved;
  } catch {
    return defaultTimerState;
  }
}

export async function saveTimerState(state: TimerState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function completeSession(state: TimerState): TimerState {
  if (state.mode === 'focus') {
    const nextCount = state.completedSessions + 1;
    const mode: TimerMode = nextCount % 4 === 0 ? 'longBreak' : 'shortBreak';
    const durationMs = mode === 'longBreak' ? 15 * 60_000 : 5 * 60_000;
    return {
      ...state,
      mode,
      status: 'idle',
      durationMs,
      remainingMs: durationMs,
      endAt: null,
      focusTotalMs: state.focusTotalMs + Math.max(0, state.durationMs - state.remainingMs),
      completedSessions: nextCount,
    };
  }
  const durationMs = state.focusMinutes * 60_000;
  return { ...state, mode: 'focus', status: 'idle', durationMs, remainingMs: durationMs, endAt: null };
}

export function reconcileTimer(state: TimerState, now = Date.now()): TimerState {
  if (state.status !== 'running' || !state.endAt) return state;
  const exactRemainingMs = Math.max(0, state.endAt - now);
  const remainingMs = Math.ceil(exactRemainingMs / 1000) * 1000;
  if (remainingMs === 0) return completeSession({ ...state, remainingMs: 0 });
  if (remainingMs === state.remainingMs) return state;
  return { ...state, remainingMs };
}

export function constructionProgress(focusTotalMs: number) {
  const minutes = focusTotalMs / 60_000;
  return {
    minutes,
    progress: Math.min(1, minutes / 60),
    stage: minutes >= 60 ? 5 : minutes >= 50 ? 4 : minutes >= 40 ? 3 : minutes >= 25 ? 2 : minutes >= 10 ? 1 : 0,
    completed: minutes >= 60,
  };
}
