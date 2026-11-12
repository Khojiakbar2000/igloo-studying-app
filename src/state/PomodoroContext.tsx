import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import {
  completeSession, defaultTimerState, loadTimerState, reconcileTimer, saveTimerState,
  TimerMode, TimerState,
} from './timer';

type PomodoroApi = {
  timer: TimerState;
  hydrated: boolean;
  start: () => void;
  pause: () => void;
  finish: () => void;
  setFocusMinutes: (minutes: number) => void;
  startFocus: (minutes?: number) => void;
};

const PomodoroContext = createContext<PomodoroApi | null>(null);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useState(defaultTimerState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    loadTimerState().then((restored) => {
      if (!alive) return;
      setTimer(restored);
      setHydrated(true);
      void saveTimerState(restored);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const tick = () => setTimer((current) => {
      const next = reconcileTimer(current);
      if (next !== current) void saveTimerState(next);
      return next;
    });
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [hydrated]);

  const update = useCallback((recipe: (current: TimerState) => TimerState) => {
    setTimer((current) => {
      const next = recipe(current);
      void saveTimerState(next);
      return next;
    });
  }, []);

  const start = useCallback(() => update((current) => {
    if (current.status === 'running') return current;
    const now = Date.now();
    return { ...current, status: 'running', endAt: now + current.remainingMs };
  }), [update]);

  const pause = useCallback(() => update((current) => {
    if (current.status !== 'running' || !current.endAt) return current;
    const currentRemaining = Math.max(0, current.endAt - Date.now());
    const reconciled = currentRemaining === 0
      ? completeSession({ ...current, remainingMs: 0 })
      : { ...current, status: 'paused' as const, remainingMs: currentRemaining, endAt: null };
    return reconciled;
  }), [update]);

  const finish = useCallback(() => update((current) => {
    const atMoment = current.status === 'running' && current.endAt
      ? { ...current, remainingMs: Math.max(0, current.endAt - Date.now()) }
      : current;
    return completeSession(atMoment);
  }), [update]);

  const setFocusMinutes = useCallback((minutes: number) => update((current) => {
    if (current.status === 'running' || current.mode !== 'focus') return current;
    const focusMinutes = Math.min(60, Math.max(10, minutes));
    const durationMs = focusMinutes * 60_000;
    return { ...current, focusMinutes, durationMs, remainingMs: durationMs, status: 'idle', endAt: null };
  }), [update]);

  const startFocus = useCallback((minutes?: number) => update((current) => {
    const focusMinutes = Math.min(60, Math.max(10, minutes ?? current.focusMinutes));
    const durationMs = focusMinutes * 60_000;
    return { ...current, focusMinutes, mode: 'focus' as TimerMode, status: 'running', durationMs, remainingMs: durationMs, endAt: Date.now() + durationMs };
  }), [update]);

  const value = useMemo(() => ({ timer, hydrated, start, pause, finish, setFocusMinutes, startFocus }),
    [timer, hydrated, start, pause, finish, setFocusMinutes, startFocus]);

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const value = useContext(PomodoroContext);
  if (!value) throw new Error('usePomodoro must be used inside PomodoroProvider');
  return value;
}
