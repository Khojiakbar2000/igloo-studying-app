import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { defaultTimerState, loadTimerState, reconcileTimer, saveTimerState, startTimer, pauseTimer, finishTimer, startFocusTimer, setFocusDuration, type TimerState } from './timer';
import { addDailyGoal, editDailyGoal, completeDailyGoal, deleteDailyGoal, moveGoalToTomorrow, moveGoalToToday, reviewGoalSession, localDateKey } from './dailyGoals';

import { equipHome, purchaseHome, removeHome, arrangeHomeState, type HomeState } from '../home/state';
import type { AtmospherePreference } from '../home/atmosphere';
import type { HomeSlot } from '../home/slots';

type PomodoroApi = {
  setAtmosphere: (value: AtmospherePreference) => void; setSnowfall: (value: boolean) => void;
  buyFurniture: (id: string) => void; equipFurniture: (id: string) => void; removeFurniture: (slot: HomeSlot) => void; arrangeHome: (action: 'save' | 'restore' | 'undo' | 'fallback') => void;
  timer: TimerState; hydrated: boolean; today: string; storageError: boolean; retrySave: () => void;
  start: () => void; pause: () => void; finish: () => void; setFocusMinutes: (minutes: number) => void; startFocus: (minutes?: number) => void;
  addGoal: (title: string) => void; editGoal: (id: string, title: string) => void; deleteGoal: (id: string) => void;
  completeGoal: (id: string, completed: boolean) => void; moveGoal: (id: string, target?: 'today' | 'tomorrow') => void;
  selectGoal: (id: string | null) => void; reviewSession: (id: string, finished: boolean) => void;
};
const PomodoroContext = createContext<PomodoroApi | null>(null);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useState(defaultTimerState);
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState(localDateKey());
  const [storageError, setStorageError] = useState(false);
  const lastSaved = useRef<TimerState | null>(null);
  useEffect(() => {
    let alive = true;
    loadTimerState().then((restored) => { if (alive) { setTimer(restored); setHydrated(true); } }).catch(() => { if (alive) setStorageError(true); });
    return () => { alive = false; };
  }, []);

  const retrySave = useCallback(() => {
    if (!hydrated) {
      void loadTimerState().then((restored) => { setTimer(restored); setHydrated(true); setStorageError(false); }).catch(() => setStorageError(true));
      return;
    }
    void saveTimerState(timer).then(() => setStorageError(false)).catch(() => setStorageError(true));
  }, [timer, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    // Running timers restore from endAt; don't rewrite growing history every second.
    const previous = lastSaved.current;
    const keys = Object.keys(timer) as (keyof TimerState)[];
    if (previous && keys.every((key) => (key === 'remainingMs' && timer.status === 'running') || timer[key] === previous[key])) return;
    lastSaved.current = timer;
    void saveTimerState(timer).then(() => setStorageError(false)).catch(() => { lastSaved.current = null; setStorageError(true); });
  }, [timer, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const tick = () => { const now = Date.now(); setToday(localDateKey(now)); setTimer((current) => reconcileTimer(current, now)); };
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') tick(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [hydrated]);
  const update = useCallback((recipe: (current: TimerState) => TimerState) => {
    if (hydrated) setTimer(recipe);
  }, [hydrated]);
  const start = useCallback(() => update((s) => startTimer(s)), [update]);
  const pause = useCallback(() => update((s) => pauseTimer(s)), [update]);
  const finish = useCallback(() => update((s) => finishTimer(s)), [update]);
  const setFocusMinutes = useCallback((minutes: number) => update((s) => setFocusDuration(s, minutes)), [update]);
  const startFocus = useCallback((minutes?: number) => update((s) => startFocusTimer(s, minutes)), [update]);
  const addGoal = useCallback((title: string) => update((s) => addDailyGoal(s, title)), [update]);
  const editGoal = useCallback((id: string, title: string) => update((s) => editDailyGoal(s, id, title)), [update]);
  const deleteGoal = useCallback((id: string) => update((s) => deleteDailyGoal(s, id)), [update]);
  const completeGoal = useCallback((id: string, complete: boolean) => update((s) => completeDailyGoal(s, id, complete)), [update]);
  const moveGoal = useCallback((id: string, target: 'today' | 'tomorrow' = 'tomorrow') => update((s) => s.activeFocus?.goalId === id ? s : target === 'today' ? moveGoalToToday(s, id) : moveGoalToTomorrow(s, id)), [update]);
  const selectGoal = useCallback((id: string | null) => update((s) => {
    if (s.activeFocus) return s;
    if (id !== null && !s.goals.some((g) => g.id === id && !g.completedAt && !g.deletedAt && g.date === localDateKey())) return s;
    return { ...s, selectedGoalId: id };
  }), [update]);
  const reviewSession = useCallback((id: string, finished: boolean) => update((s) => reviewGoalSession(s, id, finished)), [update]);
  const changeHome = useCallback((recipe: (home: HomeState) => HomeState) => update(s => { const home = recipe(s.home); return home === s.home ? s : {...s, home}; }), [update]);
  const setAtmosphere = useCallback((value: AtmospherePreference) => changeHome(h => ({...h, atmosphere: value})), [changeHome]);
  const setSnowfall = useCallback((value: boolean) => changeHome(h => ({...h, snowfall: value})), [changeHome]);
  const buyFurniture = useCallback((id: string) => changeHome(h => purchaseHome(h, id)), [changeHome]);
  const equipFurniture = useCallback((id: string) => changeHome(h => equipHome(h, id)), [changeHome]);
  const removeFurniture = useCallback((slot: HomeSlot) => changeHome(h => removeHome(h, slot)), [changeHome]);
  const arrangeHome = useCallback((action: 'save' | 'restore' | 'undo' | 'fallback') => changeHome(h => arrangeHomeState(h, action)), [changeHome]);
  const value = useMemo(() => ({ setAtmosphere, setSnowfall, buyFurniture, equipFurniture, removeFurniture, arrangeHome, timer, hydrated, today, storageError, retrySave, start, pause, finish, setFocusMinutes, startFocus, addGoal, editGoal, deleteGoal, completeGoal, moveGoal, selectGoal, reviewSession }), [setAtmosphere, setSnowfall, buyFurniture, equipFurniture, removeFurniture, arrangeHome, timer, hydrated, today, storageError, retrySave, start, pause, finish, setFocusMinutes, startFocus, addGoal, editGoal, deleteGoal, completeGoal, moveGoal, selectGoal, reviewSession]);
  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}
export function usePomodoro() {
  const value = useContext(PomodoroContext);
  if (!value) throw new Error('usePomodoro must be used inside PomodoroProvider');
  return value;
}
