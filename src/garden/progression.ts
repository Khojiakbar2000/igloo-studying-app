import { studyMilestones } from '../awards/progression';
import type { FocusSession } from '../state/dailyGoals';

export const PLANTS = [
  { name: 'Snow Flower', hours: 0, color: '#bde6ff' },
  { name: 'Crystal Rose', hours: 5, color: '#83c5ff' },
  { name: 'Glowing Mushroom', hours: 10, color: '#a1eaf3' },
  { name: 'Mini Pine Tree', hours: 20, color: '#d6ebc2' },
  { name: 'Moonlight Lily', hours: 40, color: '#E9B968' },
  { name: 'Star Blossom', hours: 75, color: '#ffe294' },
] as const;
export const STAGES = ['Seed', 'Sprout', 'Young plant', 'Flowering', 'Fully grown'];
export const THRESHOLDS = [25, 50, 100, 150, 200];
export const DECORATIONS = ['Terracotta', 'Blue ceramic', 'Moonstones', 'Lantern'] as const;
export type Plant = { kind: number; ms: number; decoration: number; seenStage: number };
export type Garden = { plots: (Plant | null)[]; active: number | null };
export type GardenAction =
  | { type: 'plant'; slot: number; kind: number }
  | { type: 'move'; slot: number; to: number }
  | { type: 'activate' | 'decorate' | 'seen'; slot: number };

export const minutes = (plant: Plant) => Math.floor(plant.ms / 60_000);
export const stage = (plant: Plant) => THRESHOLDS.filter(value => value <= minutes(plant)).length;
export const stageName = (plant: Plant) => STAGES[stage(plant) - 1] ?? 'Sown';
const valid = (value: unknown, count: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < count;

export function restoreGarden(raw?: Partial<Garden>): Garden {
  const plots = Array.from({ length: 6 }, (_, i) => {
    const plant = raw?.plots?.[i];
    if (!plant || !valid(plant.kind, PLANTS.length)) return null;
    return {
      kind: plant.kind,
      ms: Number.isSafeInteger(plant.ms) ? Math.min(12_000_000, Math.max(0, plant.ms)) : 0,
      decoration: valid(plant.decoration, DECORATIONS.length) ? plant.decoration : 0,
      seenStage: valid(plant.seenStage, 6) ? plant.seenStage : 0,
    };
  });
  return { plots, active: valid(raw?.active, 6) && plots[raw.active] ? raw.active : null };
}

export function canPlant(kind: number, progress: ReturnType<typeof studyMilestones>['progress']) {
  return valid(kind, PLANTS.length) && progress.sessions > 0 && progress.time >= PLANTS[kind].hours * 3_600_000;
}

export function changeGarden(garden: Garden, action: GardenAction, history: readonly FocusSession[]): Garden {
  const { slot } = action;
  if (!valid(slot, 6)) return garden;
  const plots = [...garden.plots];
  const plant = plots[slot];
  if (action.type === 'plant') {
    if (plant || !canPlant(action.kind, studyMilestones(history).progress)) return garden;
    plots[slot] = { kind: action.kind, ms: 0, decoration: 0, seenStage: 0 };
    return { plots, active: slot };
  }
  if (!plant) return garden;
  if (action.type === 'activate') return { plots, active: slot };
  if (action.type === 'move') {
    if (!valid(action.to, 6) || action.to === slot) return garden;
    plots[slot] = plots[action.to];
    plots[action.to] = plant;
    const active = garden.active === slot ? action.to : garden.active === action.to ? slot : garden.active;
    return { plots, active };
  }
  plots[slot] = action.type === 'seen'
    ? { ...plant, seenStage: stage(plant) }
    : { ...plant, decoration: (plant.decoration + 1) % DECORATIONS.length };
  return { ...garden, plots };
}

// Called only while recording a new session in the atomic timer snapshot.
export function growGarden(garden: Garden, session: FocusSession): Garden {
  if (garden.active === null) return garden;
  const plant = garden.plots[garden.active];
  if (!plant || stage(plant) === 5 || !session.completed) return garden;
  const { time } = studyMilestones([session]).progress;
  if (!time) return garden;
  const plots = [...garden.plots];
  plots[garden.active] = { ...plant, ms: Math.min(12_000_000, plant.ms + time) };
  return { ...garden, plots };
}
