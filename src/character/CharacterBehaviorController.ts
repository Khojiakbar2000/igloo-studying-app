import { useCallback, useEffect, useRef, useState } from 'react';

export type CharacterEmotion =
  | 'curious' | 'excited' | 'surprised' | 'confused' | 'thinking' | 'happy'
  | 'proud' | 'playful' | 'sleepy' | 'focused' | 'encouraging';
export type CharacterAction =
  | 'idle' | 'approach' | 'hatch' | 'discover' | 'reach' | 'carry' | 'place'
  | 'celebrate' | 'wave' | 'study' | 'react';
export type OnboardingChapter = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type CharacterDestination = 'entrance' | 'desk' | 'bed' | 'bookshelf' | 'window' | 'rug';
export type CharacterSource = 'ambient' | 'autonomous' | 'story' | 'user' | 'focus' | 'completion';

export const CHARACTER_SOURCE_PRIORITY: Record<CharacterSource, number> = {
  ambient: 0,
  autonomous: 10,
  story: 40,
  focus: 85,
  user: 90,
  completion: 100,
};

export type CharacterBehavior = {
  chapter: OnboardingChapter;
  emotion: CharacterEmotion;
  action: CharacterAction;
  dialogue: string | null;
  priority: number;
  destination: CharacterDestination | null;
  source: CharacterSource;
  eventId: number;
};

export type CharacterEvent = {
  chapter?: OnboardingChapter;
  emotion: CharacterEmotion;
  action: CharacterAction;
  dialogue?: string | null;
  priority?: number;
  durationMs?: number;
  destination?: CharacterDestination | null;
  source?: CharacterSource;
};

const baseBehavior: CharacterBehavior = {
  chapter: 1,
  emotion: 'curious',
  action: 'idle',
  dialogue: null,
  priority: 0,
  destination: null,
  source: 'ambient',
  eventId: 0,
};

/** Semantic director: source priorities govern interruptions, and focus blocks autonomous beats. */
export function useCharacterBehavior(chapter: OnboardingChapter) {
  const [behavior, setBehavior] = useState<CharacterBehavior>({ ...baseBehavior, chapter });
  const sequence = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockedUntil = useRef(0);
  const focusActive = useRef(false);
  const priorityRef = useRef(behavior.priority);
  const currentChapter = useRef(chapter);
  priorityRef.current = behavior.priority;
  currentChapter.current = chapter;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const perform = useCallback((event: CharacterEvent) => {
    const source = event.source ?? 'story';
    if (focusActive.current && source === 'autonomous') return false;
    const nextPriority = Math.max(event.priority ?? 2, CHARACTER_SOURCE_PRIORITY[source]);
    if (Date.now() < lockedUntil.current && nextPriority < priorityRef.current) return false;
    if (timer.current) clearTimeout(timer.current);
    priorityRef.current = nextPriority;
    const eventId = ++sequence.current;
    const next = { ...event, chapter: event.chapter ?? currentChapter.current, priority: nextPriority, eventId };
    setBehavior({
      chapter: next.chapter!, emotion: next.emotion, action: next.action,
      dialogue: next.dialogue ?? null, priority: nextPriority,
      destination: next.destination ?? null, source, eventId,
    });
    lockedUntil.current = Date.now() + (event.durationMs ?? 0);
    if (event.durationMs) {
      timer.current = setTimeout(() => {
        if (focusActive.current) {
          const recoveryEventId = ++sequence.current;
          priorityRef.current = CHARACTER_SOURCE_PRIORITY.focus;
          lockedUntil.current = Number.POSITIVE_INFINITY;
          setBehavior((current) => current.eventId === eventId
            ? { ...baseBehavior, chapter: currentChapter.current, emotion: 'focused', action: 'study', destination: 'desk', source: 'focus', priority: CHARACTER_SOURCE_PRIORITY.focus, eventId: recoveryEventId }
            : current);
        } else {
          const recoveryEventId = ++sequence.current;
          lockedUntil.current = 0;
          priorityRef.current = 0;
          setBehavior((current) => current.eventId === eventId
            ? { ...baseBehavior, chapter: currentChapter.current, eventId: recoveryEventId }
            : current);
        }
        timer.current = null;
      }, event.durationMs);
    }
    return true;
  }, []);

  const setFocusActive = useCallback((active: boolean) => {
    focusActive.current = active;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const eventId = ++sequence.current;
    if (active) {
      priorityRef.current = CHARACTER_SOURCE_PRIORITY.focus;
      lockedUntil.current = Number.POSITIVE_INFINITY;
      setBehavior({ ...baseBehavior, chapter: currentChapter.current, emotion: 'focused', action: 'study', destination: 'desk', source: 'focus', priority: CHARACTER_SOURCE_PRIORITY.focus, eventId });
      return;
    }
    priorityRef.current = 0;
    lockedUntil.current = 0;
    setBehavior({ ...baseBehavior, chapter: currentChapter.current, eventId });
  }, []);

  const reset = useCallback((nextChapter = currentChapter.current) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    lockedUntil.current = 0;
    focusActive.current = false;
    priorityRef.current = 0;
    currentChapter.current = nextChapter;
    const eventId = ++sequence.current;
    setBehavior({ ...baseBehavior, chapter: nextChapter, eventId });
  }, []);

  return { behavior, perform, reset, setFocusActive };
}
