import type { TimerMode, TimerStatus } from '../../state/timer';

export const BREAK_ACTIVITIES = [
  { id: 'stretch', label: 'Stretch', status: 'Pip is stretching.', weight: 4 },
  { id: 'walk', label: 'Walk', status: 'Pip is taking a little walk.', weight: 3 },
  { id: 'drink', label: 'Drink', status: 'Pip is taking a drink break.', weight: 2 },
  { id: 'nap', label: 'Nap', status: 'Pip is taking a short nap.', weight: 4 },
  { id: 'window', label: 'Look Outside', status: 'Pip is looking out the window.', weight: 3 },
  { id: 'play', label: 'Play', status: 'Pip is having a playful moment.', weight: 2 },
] as const;

export type BreakActivity = typeof BREAK_ACTIVITIES[number]['id'] | 'relax';
export type BreakPerformance = Exclude<BreakActivity, 'drink'>;
export const activityInfo = (id: BreakActivity) => id === 'relax' ? { id, label: 'Relax', status: 'Pip is relaxing.' } : BREAK_ACTIVITIES.find(activity => activity.id === id)!;

export function isRunningBreak(mode: TimerMode, status: TimerStatus) {
  return mode !== 'focus' && status === 'running';
}

export function chooseBreakActivity(previous: BreakActivity | null, drinkAvailable: boolean, random = Math.random): BreakActivity {
  const choices = BREAK_ACTIVITIES.filter(({ id }) => id !== previous && (id !== 'drink' || drinkAvailable));
  let ticket = random() * choices.reduce((total, item) => total + item.weight, 0);
  for (const item of choices) {
    ticket -= item.weight;
    if (ticket < 0) return item.id;
  }
  return choices[choices.length - 1].id;
}
