import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePomodoro } from '../state/PomodoroContext';
import { AmbientMixer } from './mixer';
import { MAX_TRACKS, SOUNDS, type SoundId } from './sounds';

type Preferences = {
  selected: SoundId[];
  levels: Partial<Record<SoundId, number>>;
  master: number;
  muted: boolean;
  enabled: boolean;
  stopAtEnd: boolean;
  duringBreaks: boolean;
};

const STORAGE_KEY = 'igloo.ambient.v1';
const defaults: Preferences = {
  selected: [], levels: {}, master: 0.6, muted: false, enabled: true,
  stopAtEnd: false, duringBreaks: true,
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const validVolume = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? clamp(value) : fallback;
export const trackVolume = (prefs: Preferences, id: SoundId) => prefs.levels[id] ?? 0.72;

function restore(value: string | null): Preferences {
  if (!value) return defaults;
  const raw = JSON.parse(value) as Partial<Preferences> | null;
  if (!raw || typeof raw !== 'object') return defaults;
  const ids = new Set<string>(SOUNDS.map(sound => sound.id));
  const selected = Array.isArray(raw.selected)
    ? [...new Set(raw.selected.filter(id => ids.has(id)))].slice(0, MAX_TRACKS) : [];
  const levels: Preferences['levels'] = {};
  for (const { id } of SOUNDS) levels[id] = validVolume(raw.levels?.[id], 0.72);
  return {
    selected, levels, master: validVolume(raw.master, defaults.master),
    muted: raw.muted === true,
    enabled: raw.enabled !== false,
    stopAtEnd: raw.stopAtEnd === true,
    duringBreaks: raw.duringBreaks !== false,
  };
}

type AmbientApi = {
  unlockAudio: () => void;
  prefs: Preferences;
  ready: boolean;
  playing: boolean;
  needsGesture: boolean;
  pausedByMedia: boolean;
  breakPaused: boolean;
  error: string | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleTrack: (id: SoundId) => void;
  togglePlayback: () => void;
  setVolume: (value: number, id?: SoundId) => void;
  setOption: (key: 'muted' | 'stopAtEnd' | 'duringBreaks', value: boolean) => void;
};

const Context = createContext<AmbientApi | null>(null);

export function AmbientSoundProvider({ children }: { children: React.ReactNode }) {
  const { timer: { mode, status, completedSessions, endAt, home }, hydrated } = usePomodoro();
  const mixer = useRef<AmbientMixer | null>(null);
  const completed = useRef<number | null>(null);
  const [prefs, setPrefs] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(Platform.OS !== 'web');
  const [pausedByMedia, setPausedByMedia] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const engine = new AmbientMixer(setError, setPausedByMedia);
    mixer.current = engine;
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then(restore).then(restored => {
      if (active) setPrefs(restored);
    }).catch(() => {
      if (active) setError('Saved sound settings couldn’t be loaded.');
    }).finally(() => { if (active) setReady(true); });
    return () => {
      active = false;
      mixer.current = null;
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {
      setError('Sound settings couldn’t be saved.');
    });
  }, [prefs, ready]);

  const breakPaused = hydrated && mode !== 'focus' && !prefs.duringBreaks;
  const fireplaceAutoSelected = home.lighting.sources.fireplace && !prefs.selected.includes('fireplace') && prefs.selected.length < MAX_TRACKS;
  const playing = ready && hydrated && unlocked && !pausedByMedia && prefs.enabled && !breakPaused && !prefs.muted
    && prefs.master > 0 && (prefs.selected.some(id => trackVolume(prefs, id) > 0) || fireplaceAutoSelected && trackVolume(prefs, 'fireplace') > 0);
  const desired = useMemo(() => {
    const tracks = new Map<SoundId, number>();
    if (ready && hydrated && unlocked && prefs.enabled && !breakPaused) {
      for (const id of prefs.selected) {
        const volume = prefs.muted ? 0 : prefs.master * trackVolume(prefs, id) * 0.64;
        tracks.set(id, volume);
      }
      if (home.lighting.sources.fireplace && !prefs.selected.includes('fireplace') && prefs.selected.length < MAX_TRACKS) {
        const volume = prefs.muted ? 0 : prefs.master * trackVolume(prefs, 'fireplace') * 0.28;
        tracks.set('fireplace', volume);
      }
    }
    return tracks;
  }, [ready, hydrated, unlocked, prefs, breakPaused, home.lighting.sources.fireplace]);

  useEffect(() => {
    mixer.current?.setMix(desired, prefs.enabled && !breakPaused ? 350 : 1200);
  }, [desired, prefs.enabled, breakPaused]);

  useEffect(() => {
    if (!ready || !hydrated) return;
    if (completed.current !== null && completedSessions > completed.current && prefs.stopAtEnd) {
      setPrefs(current => current.enabled ? { ...current, enabled: false } : current);
    }
    completed.current = completedSessions;
  }, [completedSessions, hydrated, prefs.stopAtEnd, ready]);

  useEffect(() => {
    if (!ready || !hydrated || !prefs.stopAtEnd || mode !== 'focus' || status !== 'running' || !endAt) return;
    const deadline = setTimeout(() => {
      setPrefs(current => current.enabled ? { ...current, enabled: false } : current);
    }, Math.max(0, endAt - Date.now()));
    return () => clearTimeout(deadline);
  }, [endAt, hydrated, mode, prefs.stopAtEnd, ready, status]);

  const unlock = () => {
    const engine = mixer.current;
    // Request browser audio from the button event, before any asynchronous state reconciliation.
    void engine?.unlock().then(() => setUnlocked(true), () => {
      setError('Audio is blocked. Tap Play mix to try again.');
    });
  };

  const toggleTrack = (id: SoundId) => {
    if (!ready) return;
    setError(null);
    unlock();
    setPrefs(current => {
      if (current.selected.includes(id)) return { ...current, selected: current.selected.filter(sound => sound !== id) };
      if (current.selected.length >= MAX_TRACKS) return current;
      return { ...current, selected: [...current.selected, id], enabled: true };
    });
  };

  const togglePlayback = () => {
    if (!ready || !prefs.selected.length) return;
    setError(null);
    if (pausedByMedia && prefs.enabled) {
      mixer.current?.resumeFromMediaPause();
    } else if (!unlocked || !prefs.enabled) {
      unlock();
      setPrefs(current => ({ ...current, enabled: true }));
    } else {
      setPrefs(current => ({ ...current, enabled: false }));
    }
  };

  return <Context.Provider value={{
    prefs, ready, playing, needsGesture: !unlocked, pausedByMedia, breakPaused, error, open, setOpen,
    toggleTrack, togglePlayback, unlockAudio: unlock,
    setVolume: (value, id) => setPrefs(current => id
      ? { ...current, levels: { ...current.levels, [id]: clamp(value) } }
      : { ...current, master: clamp(value) }),
    setOption: (key, value) => setPrefs(current => ({ ...current, [key]: value })),
  }}>{children}</Context.Provider>;
}

export function useAmbientSound() {
  const value = useContext(Context);
  if (!value) throw new Error('Ambient sound controls must be inside AmbientSoundProvider.');
  return value;
}
