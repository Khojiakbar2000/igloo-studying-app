export type PenguinActivity = 'offline' | 'idle' | 'focusing' | 'on_break';
export type PenguinAction = 'study' | 'drink' | 'bored' | 'stretch' | 'yawn' | 'break' | 'wave' | 'celebrate';
export type PenguinPersonality = 'hardworking' | 'sleepy' | 'curious' | 'cheerful';
export type AnimationPriority = 'ambient' | 'social' | 'user' | 'session';

export type RendererCapability = {
  available: boolean;
  renderer: 'lottie' | 'synfig' | 'frames' | 'rive' | null;
  note: string;
};

/** Honest capability map for the approved seated character art. */
export const SEATED_ACTION_CAPABILITIES: Record<PenguinAction, RendererCapability> = {
  study: { available: true, renderer: 'lottie', note: 'Independent Lottie study loops for typing, reading, writing, and tablet use.' },
  drink: { available: true, renderer: 'lottie', note: 'Lottie coffee clips preserve each seat’s study material.' },
  bored: { available: true, renderer: 'lottie', note: 'Lottie bored look and recovery clips.' },
  stretch: { available: true, renderer: 'lottie', note: 'Lottie seated stretch clips.' },
  yawn: { available: true, renderer: 'lottie', note: 'Lottie yawn and recovery clips.' },
  break: { available: true, renderer: 'lottie', note: 'Lottie rest pose holds through the Pomodoro break.' },
  wave: { available: true, renderer: 'lottie', note: 'Lottie wave clips play independently at each seat.' },
  celebrate: { available: true, renderer: 'lottie', note: 'Lottie celebration clips follow completed focus sessions.' },
};

export function activityFromPomodoro(mode: 'focus' | 'shortBreak' | 'longBreak', status: 'idle' | 'running' | 'paused'): PenguinActivity {
  if (status !== 'running') return 'idle';
  return mode === 'focus' ? 'focusing' : 'on_break';
}

export function shouldAdvanceStudyLoop(activity: PenguinActivity) {
  return activity === 'focusing';
}

export type AnimationRequest = { action: PenguinAction; priority: AnimationPriority };
const PRIORITY: Record<AnimationPriority, number> = { ambient: 0, social: 40, user: 80, session: 100 };

/** Rejects unsupported actions and lower-priority requests before a renderer is touched. */
export function canAcceptAnimationRequest(current: AnimationRequest | null, next: AnimationRequest) {
  if (!SEATED_ACTION_CAPABILITIES[next.action].available) return false;
  return current === null || PRIORITY[next.priority] >= PRIORITY[current.priority];
}
