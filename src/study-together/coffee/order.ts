import type { TimerMode, TimerStatus } from '../../state/timer';

export const DRINKS = [
  { id: 'coffee', label: 'Coffee', color: '#75452d' },
  { id: 'cocoa', label: 'Hot Chocolate', color: '#a45d38' },
  { id: 'tea', label: 'Green Tea', color: '#929856' },
  { id: 'milk', label: 'Warm Milk', color: '#fce7c1' },
] as const;

export type DrinkId = typeof DRINKS[number]['id'];
export const findDrink = (id: DrinkId) => DRINKS.find(drink => drink.id === id)!;
export const BREW_MS = 3_600;

export type DrinkOrder = {
  id: number;
  drink: DrinkId;
  phase: 'brewing' | 'ready' | 'serving';
  startedAt: number;
  waitForBreak: boolean;
};

export function isFocusProtected(mode: TimerMode, status: TimerStatus) {
  return mode === 'focus' && status !== 'idle';
}

export function canCollect(order: DrinkOrder | null, mode: TimerMode, status: TimerStatus) {
  if (order?.phase !== 'ready' || status === 'paused' || isFocusProtected(mode, status)) return false;
  return !order.waitForBreak || (mode !== 'focus' && status === 'running');
}
