import type { CharacterDestination, CharacterEvent, CharacterSource } from './CharacterBehaviorController';
import { CHARACTER_SOURCE_PRIORITY } from './CharacterBehaviorController';

export type PersonalHomeCue =
  | 'greet'
  | 'explore'
  | 'read'
  | 'rest'
  | 'lookOutside'
  | 'prepareStudy'
  | 'focus'
  | 'celebrate';

export type PersonalHomeBeat = CharacterEvent & {
  cue: PersonalHomeCue;
  destination: CharacterDestination;
  source: CharacterSource;
  movement: 'walk' | 'stay' | 'climb';
};

const homeBeats: Record<PersonalHomeCue, PersonalHomeBeat> = {
  greet: {
    cue: 'greet', destination: 'entrance', movement: 'walk', source: 'story',
    emotion: 'happy', action: 'wave', dialogue: 'Home again!', priority: CHARACTER_SOURCE_PRIORITY.story, durationMs: 1_800,
  },
  explore: {
    cue: 'explore', destination: 'window', movement: 'walk', source: 'autonomous',
    emotion: 'curious', action: 'discover', dialogue: 'I wonder what the snow is doing.', priority: CHARACTER_SOURCE_PRIORITY.autonomous, durationMs: 2_600,
  },
  read: {
    cue: 'read', destination: 'bookshelf', movement: 'walk', source: 'autonomous',
    emotion: 'thinking', action: 'study', dialogue: 'I saved this page.', priority: CHARACTER_SOURCE_PRIORITY.autonomous, durationMs: 3_000,
  },
  rest: {
    cue: 'rest', destination: 'bed', movement: 'climb', source: 'autonomous',
    emotion: 'sleepy', action: 'idle', dialogue: null, priority: CHARACTER_SOURCE_PRIORITY.autonomous, durationMs: 4_000,
  },
  lookOutside: {
    cue: 'lookOutside', destination: 'window', movement: 'walk', source: 'story',
    emotion: 'curious', action: 'react', dialogue: 'Snow is falling softly.', priority: CHARACTER_SOURCE_PRIORITY.story, durationMs: 2_500,
  },
  prepareStudy: {
    cue: 'prepareStudy', destination: 'desk', movement: 'walk', source: 'focus',
    emotion: 'encouraging', action: 'study', dialogue: 'I’ll get my book ready.', priority: CHARACTER_SOURCE_PRIORITY.focus, durationMs: 1_800,
  },
  focus: {
    cue: 'focus', destination: 'desk', movement: 'stay', source: 'focus',
    emotion: 'focused', action: 'study', dialogue: null, priority: CHARACTER_SOURCE_PRIORITY.focus,
  },
  celebrate: {
    cue: 'celebrate', destination: 'rug', movement: 'stay', source: 'completion',
    emotion: 'proud', action: 'celebrate', dialogue: 'We did good work!', priority: CHARACTER_SOURCE_PRIORITY.completion, durationMs: 1_700,
  },
};

/** Semantic home events keep dialogue, destination, and acting intent together. */
export function getPersonalHomeBeat(cue: PersonalHomeCue): PersonalHomeBeat {
  return { ...homeBeats[cue] };
}

/** Direct taps preempt roaming; during focus they acknowledge in place instead of wandering. */
export function getPersonalHomeInteractionBeat(cue: PersonalHomeCue, focusActive = false): PersonalHomeBeat {
  if (focusActive) {
    return {
      ...homeBeats.focus,
      cue,
      emotion: 'curious',
      action: 'react',
      source: 'user',
      priority: CHARACTER_SOURCE_PRIORITY.user,
      dialogue: null,
      durationMs: 700,
    };
  }
  return {
    ...homeBeats[cue],
    source: 'user',
    priority: CHARACTER_SOURCE_PRIORITY.user,
  };
}

export const PERSONAL_HOME_AUTONOMY_COOLDOWN_MS = 90_000;
const autonomousSequence: PersonalHomeCue[] = ['explore', 'read', 'rest'];

/** Deterministic and intentionally sparse. The host should call this only after user inactivity. */
export function nextPersonalHomeBeat(options: {
  mode: 'home' | 'focus' | 'break';
  idleForMs: number;
  sequenceIndex: number;
}): PersonalHomeBeat | null {
  if (options.mode !== 'home' || options.idleForMs < PERSONAL_HOME_AUTONOMY_COOLDOWN_MS) return null;
  const index = Math.abs(Math.floor(options.sequenceIndex)) % autonomousSequence.length;
  return getPersonalHomeBeat(autonomousSequence[index]);
}
