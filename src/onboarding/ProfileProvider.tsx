import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePomodoro } from '../state/PomodoroContext';
import { studyMilestones } from '../awards/progression';
import { COMPLETION_KEY, ONBOARDING_KEY, companionName, restoreProfile, type Profile } from './profile';

let saves = Promise.resolve();
function write(profile: Profile) {
  const persist = () => AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(profile));
  const task = saves.catch(() => undefined).then(persist);
  saves = task;
  return task;
}
const Context = createContext<{
  profile: Profile; ready: boolean; error: boolean;
  retryLoad: () => void;
  update: (patch: Partial<Profile>) => void;
  save: (draft: Profile) => Promise<boolean>;
} | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { timer, hydrated } = usePomodoro();
  const [profile, setProfile] = useState(() => restoreProfile(null));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [readAttempt,setReadAttempt]=useState(0);
  const retryLoad=useCallback(()=>{setError(false);setReadAttempt(previous=>previous+1);},[]);
  useEffect(() => {
    if (!hydrated || ready) return;
    let alive = true;
    void AsyncStorage.multiGet([ONBOARDING_KEY, COMPLETION_KEY]).then(values => {
      if (!alive) return;
      let raw: unknown;
      try { raw = JSON.parse(values[0][1] ?? 'null'); } catch { raw = null; }
      const existing = timer.focusTotalMs > 0 || timer.goals.length > 0 || timer.sessions.length > 0 || timer.activeFocus !== null;
      setProfile(restoreProfile(raw, values[1][1] === 'true', existing, studyMilestones(timer.sessions).progress.days > 0));
      setReady(true);
    }).catch(() => {
      if (!alive) return;
      setError(true);
    });
    return () => { alive = false; };
  }, [hydrated, ready, readAttempt]); // Only hydrate once, after the timer restore.
  useEffect(() => {
    if (ready) void write(profile).then(() => setError(false)).catch(() => setError(true));
  }, [profile, ready]);
  const update = useCallback((patch: Partial<Profile>) => setProfile(current => ({ ...current, ...patch })), []);
  const save = useCallback(async (draft: Profile) => {
    try {
      await write(draft);
      setProfile(draft);
      setError(false);
      return true;
    } catch { setError(true); return false; }
  }, []);
  return <Context.Provider value={{ profile, ready, update, save, error, retryLoad }}>{children}</Context.Provider>;
}
export function useStudyProfile() {
  const value = useContext(Context);
  if (!value) throw new Error('Study profile must be used inside ProfileProvider');
  return value;
}
export function useCompanionName() {
  const value = useContext(Context);
  return value ? companionName(value.profile) : 'Pip';
}

export function usePrimaryStudyTopic() {
  return useContext(Context)?.profile.primary ?? undefined;
}
