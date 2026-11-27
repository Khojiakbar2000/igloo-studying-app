import { CONSTRUCTION_MILESTONES, constructionProgress } from '../../state/timer';

export const constructionStageLabels = [
  'Ready to build', 'The first snow blocks', 'A sturdy foundation',
  'The walls are rising', 'The dome is taking shape', 'Home, sweet home',
] as const;

/** Completed focus drives the existing non-looping construction timeline. */
export const constructionFrame = (progress: number) =>
  Math.round(Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0)) * 300);

export function winterStage(progress: number) {
  const target = CONSTRUCTION_MILESTONES[CONSTRUCTION_MILESTONES.length - 1] * 60_000;
  return constructionStageLabels[constructionProgress(progress * target).stage];
}
