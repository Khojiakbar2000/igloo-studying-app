import type { TimerMode, TimerStatus } from '../../state/timer';

export type PipPhase = 'idle' | 'study' | 'rest';
export type PipReaction = 'excited' | 'blink' | 'look' | 'smile' | 'bored' | 'stretch' | 'yawn' | 'celebrate' | 'coffee' | 'wave';
export type PipClip = PipPhase | PipReaction | 'wake' | 'rest-hold';
export type ReactionCue = { id: number; reaction: PipReaction };

export const REACTION_LABELS: Record<PipReaction, string> = {
  excited: 'Excited', blink: 'Blink', look: 'Look around', smile: 'Smile', bored: 'Bored',
  stretch: 'Stretch', yawn: 'Yawn', celebrate: 'Celebrate', coffee: 'Coffee', wave: 'Wave',
};

export function pipPhase(mode: TimerMode, status: TimerStatus): PipPhase {
  if (mode !== 'focus') return 'rest';
  return status === 'running' ? 'study' : 'idle';
}

export function sessionReaction(
  previous: { completed: number; focusId: string | null } | null,
  current: { completed: number; focusId: string | null; phase: PipPhase },
): PipReaction | null {
  if (!previous) return null;
  if (current.completed > previous.completed) return 'celebrate';
  if (current.phase === 'study' && current.focusId && current.focusId !== previous.focusId) return 'excited';
  return null;
}

export function nextPipClip({
  phase, resting, cue, ambient, coffeeAllowed,
}: {
  phase: PipPhase; resting: boolean; cue: ReactionCue | null;
  ambient: PipReaction | null; coffeeAllowed: boolean;
}): { clip: PipClip; cueId: number | null } {
  if (resting && phase !== 'rest') return { clip: 'wake', cueId: null };
  if (cue) return { clip: cue.reaction, cueId: cue.id };
  if (ambient && (ambient === 'coffee' ? coffeeAllowed : phase === 'study')) return { clip: ambient, cueId: null };
  return { clip: phase === 'rest' && resting ? 'rest-hold' : phase, cueId: null };
}

const STUDY_REACTIONS: ReadonlyArray<readonly [PipReaction, number]> = [
  ['blink', 7], ['look', 4], ['smile', 4], ['bored', 1],
];
const LONG_REACTIONS: ReadonlyArray<readonly [PipReaction, number]> = [['stretch', 4], ['yawn', 2]];

export function nextFocusReaction(extended: boolean, previous: PipReaction | null, random = Math.random) {
  const candidates = (extended ? [...STUDY_REACTIONS, ...LONG_REACTIONS] : STUDY_REACTIONS)
    .filter(([reaction]) => reaction !== previous);
  let chance = random() * candidates.reduce((total, [, weight]) => total + weight, 0);
  for (const [reaction, weight] of candidates) {
    chance -= weight;
    if (chance < 0) return reaction;
  }
  return candidates[candidates.length - 1][0];
}

export function extendedFocusThreshold(random = Math.random) {
  return (45 + 15 * random()) * 60_000;
}
