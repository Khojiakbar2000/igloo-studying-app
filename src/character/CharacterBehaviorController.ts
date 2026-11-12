import { useCallback, useEffect, useRef, useState } from 'react';

export type CharacterEmotion =
  | 'curious' | 'excited' | 'surprised' | 'confused' | 'thinking' | 'happy'
  | 'proud' | 'playful' | 'sleepy' | 'focused' | 'encouraging';
export type CharacterAction =
  | 'idle' | 'approach' | 'hatch' | 'discover' | 'reach' | 'carry' | 'place'
  | 'celebrate' | 'wave' | 'study' | 'react';
export type OnboardingChapter = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type CharacterBehavior = {
  chapter: OnboardingChapter;
  emotion: CharacterEmotion;
  action: CharacterAction;
  dialogue: string | null;
  priority: number;
  eventId: number;
};

export type CharacterEvent = {
  chapter?: OnboardingChapter;
  emotion: CharacterEmotion;
  action: CharacterAction;
  dialogue?: string | null;
  priority?: number;
  durationMs?: number;
};

const baseBehavior: CharacterBehavior = {
  chapter: 1,
  emotion: 'curious',
  action: 'idle',
  dialogue: null,
  priority: 0,
  eventId: 0,
};

/** Semantic character director: story events win over idle, then recover to a quiet pose. */
export function useCharacterBehavior(chapter: OnboardingChapter) {
  const [behavior, setBehavior] = useState<CharacterBehavior>({ ...baseBehavior, chapter });
  const sequence = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockedUntil = useRef(0);
  const priorityRef = useRef(behavior.priority);
  const currentChapter = useRef(chapter);
  priorityRef.current = behavior.priority;
  currentChapter.current = chapter;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const perform = useCallback((event: CharacterEvent) => {
    const nextPriority = event.priority ?? 2;
    if (Date.now() < lockedUntil.current && nextPriority < priorityRef.current) return false;
    if (timer.current) clearTimeout(timer.current);
    const eventId = ++sequence.current;
    const next = { ...event, chapter: event.chapter ?? currentChapter.current, priority: nextPriority, eventId };
    setBehavior({
      chapter: next.chapter!, emotion: next.emotion, action: next.action,
      dialogue: next.dialogue ?? null, priority: nextPriority, eventId,
    });
    lockedUntil.current = Date.now() + (event.durationMs ?? 0);
    if (event.durationMs) {
      timer.current = setTimeout(() => {
        setBehavior((current) => current.eventId === eventId
          ? { ...current, emotion: 'curious', action: 'idle', dialogue: null, priority: 0 }
          : current);
        lockedUntil.current = 0;
        timer.current = null;
      }, event.durationMs);
    }
    return true;
  }, []);

  const reset = useCallback((nextChapter = currentChapter.current) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    lockedUntil.current = 0;
    priorityRef.current = 0;
    currentChapter.current = nextChapter;
    const eventId = ++sequence.current;
    setBehavior({ ...baseBehavior, chapter: nextChapter, eventId });
  }, []);

  return { behavior, perform, reset };
}
