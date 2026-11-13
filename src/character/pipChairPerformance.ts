/** Drawn key-pose performance timings, reviewed at 12 drawings per second. */
export const PIP_CHAIR_FRAME_MS = [
  180, 120, 340, // glance leads, head/body follow, anticipation settles
  150, 150, 150, 170, // two foot contacts and a braking step
  260, // clear anticipation hold
  100, 120, 120, // push, arc, weighted landing
  260, 360, 200, // follow-through, settle, pleased seated pose
] as const;

export const PIP_CHAIR_DURATION_MS = PIP_CHAIR_FRAME_MS.reduce((sum, duration) => sum + duration, 0);

export type PipAction = 'idle' | 'chair-performance' | 'study' | 'user-action';

const priority: Record<PipAction, number> = {
  idle: 0,
  study: 1,
  'chair-performance': 2,
  'user-action': 3,
};

/** Plays one cancellable semantic action; callers own the visual clock and root path. */
export function playPipChairPerformance(
  onFrame: (frame: number) => void,
  onComplete: () => void,
  currentAction: PipAction = 'chair-performance',
) {
  if (priority[currentAction] > priority['chair-performance']) return () => undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;
  let cancelled = false;

  const advance = () => {
    if (cancelled) return;
    onFrame(frame);
    const duration = PIP_CHAIR_FRAME_MS[frame];
    frame += 1;
    if (frame < PIP_CHAIR_FRAME_MS.length) timer = setTimeout(advance, duration);
    else timer = setTimeout(() => {
      if (!cancelled) onComplete();
    }, duration);
  };

  advance();
  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}
