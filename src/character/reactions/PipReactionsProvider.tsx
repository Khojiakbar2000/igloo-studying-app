import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePomodoro } from '../../state/PomodoroContext';
import { extendedFocusThreshold, pipPhase, sessionReaction, REACTION_LABELS, type PipClip, type PipPhase, type PipReaction, type ReactionCue } from './pipReactions';

type PipReactions = {
  phase: PipPhase;
  cue: ReactionCue | null;
  seated: boolean;
  coffeeAllowed: boolean;
  hasExtendedFocus: () => boolean;
  claimCue: (id: number) => boolean;
  finishCue: (id: number) => void;
  clip: PipClip;
  reportClip: (clip: PipClip) => void;
  lastFinished: PipReaction | null;
  reportFinished: (reaction: PipReaction) => void;
  requestRestReaction: (reaction: 'look' | 'celebrate' | 'smile' | 'wave' | 'stretch') => void;
  debug: (reaction: PipReaction) => void;
  override: PipPhase | null;
  debugPhase: (phase: PipPhase | null) => void;
};
const Context = createContext<PipReactions | null>(null);

function previewAction() {
  if (!__DEV__ || typeof window === 'undefined') return null;
  const query = new URLSearchParams(window.location.search);
  return query.get('preview') === 'study-together' ? query.get('action') : null;
}

export function PipReactionsProvider({ children }: { children: React.ReactNode }) {
  const { timer, hydrated } = usePomodoro();
  const { mode, status, completedSessions, activeFocus, focusTotalMs } = timer;
  const actualPhase = pipPhase(mode, status);
  const focusId = activeFocus?.id ?? null;
  const previous = useRef<{ completed: number; focusId: string | null } | null>(null);
  const nextId = useRef(1);
  const claimed = useRef(0);
  const [extendedAt] = useState(extendedFocusThreshold);
  const time = useRef({ focusTotalMs, activeFocus });
  time.current = { focusTotalMs, activeFocus };

  const [cue, setCue] = useState<ReactionCue | null>(() => {
    const action = previewAction();
    if (action === 'drink') return { id: 1, reaction: 'coffee' };
    if (action && Object.hasOwn(REACTION_LABELS, action)) return { id: 1, reaction: action as PipReaction };
    return null;
  });
  const [override, setOverride] = useState<PipPhase | null>(() => previewAction() === 'break' ? 'rest' : null);
  const [clip, setClip] = useState<PipClip>('idle');
  const [lastFinished, setLastFinished] = useState<PipReaction | null>(null);
  const reportClip = useCallback((next: PipClip) => { if (__DEV__) setClip(next); }, []);
  const reportFinished = useCallback((reaction: PipReaction) => { if (__DEV__) setLastFinished(reaction); }, []);
  const phase = override ?? actualPhase;
  const seated = phase !== 'idle' || status === 'paused' || cue !== null || override !== null;
  const coffeeAllowed = phase === 'rest' && (override === 'rest' || status === 'running');

  const request = useCallback((reaction: PipReaction) => setCue({ id: ++nextId.current, reaction }), []);
  const claimCue = useCallback((id: number) => {
    if (id <= claimed.current) return false;
    claimed.current = id;
    return true;
  }, []);
  const finishCue = useCallback((id: number) => setCue(current => current?.id === id ? null : current), []);
  const hasExtendedFocus = useCallback(() => {
    const current = time.current;
    const active = current.activeFocus;
    if (!active) return current.focusTotalMs >= extendedAt;
    const closed = active.spans.reduce((total, span) => total + Math.max(0, span.end - span.start), 0);
    const open = active.runningSince === null ? 0 : Math.max(0, Date.now() - active.runningSince);
    return current.focusTotalMs + closed + open >= extendedAt;
  }, [extendedAt]);

  useEffect(() => {
    if (!hydrated) return;
    const before = previous.current;
    previous.current = { completed: completedSessions, focusId };
    if (override !== null) return;
    const reaction = sessionReaction(before, { completed: completedSessions, focusId, phase: actualPhase });
    if (reaction) request(reaction);
    else if (actualPhase !== 'study') setCue(current => current?.reaction === 'excited' ? null : current);
  }, [actualPhase, completedSessions, focusId, hydrated, override, request]);

  const requestRestReaction = useCallback((reaction: 'look' | 'celebrate' | 'smile' | 'wave' | 'stretch') => {
    if (!hydrated || actualPhase === 'study' || status === 'paused') return;
    const cue = { id: ++nextId.current, reaction };
    setCue(current => current ?? cue);
  }, [actualPhase, hydrated, status]);
  const debug = useCallback((reaction: PipReaction) => { if (__DEV__) request(reaction); }, [request]);
  const debugPhase = useCallback((next: PipPhase | null) => {
    if (!__DEV__) return;
    setCue(null);
    setOverride(next);
  }, []);
  const value = useMemo(() => ({
    phase, cue, seated, coffeeAllowed, hasExtendedFocus, claimCue, finishCue, clip, reportClip, lastFinished, reportFinished, requestRestReaction, debug, override, debugPhase,
  }), [phase, cue, seated, coffeeAllowed, hasExtendedFocus, claimCue, finishCue, clip, reportClip, lastFinished, reportFinished, requestRestReaction, debug, override, debugPhase]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePipReactions() {
  const value = useContext(Context);
  if (!value) throw new Error('Pip reactions require PipReactionsProvider');
  return value;
}
