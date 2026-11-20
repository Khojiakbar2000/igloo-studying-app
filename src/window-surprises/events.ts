import type { StudyWindowScene } from '../scenes/studyWindowScenes';

type Rarity = 'small' | 'special' | 'rare';
type Motion = 'ground' | 'pass' | 'approach' | 'sky' | 'glow' | 'slip' | 'dance';
type Entry = readonly [id: string, name: string, motion: Motion, rarity?: Rarity, interactive?: boolean];
const scenes = {
  blizzard: [
    ['snow-fox', 'Snow fox', 'ground', 'small', true], ['penguin-visitor', 'Penguin visitor', 'approach', 'special', true],
    ['golden-star', 'Golden shooting star', 'sky', 'special'], ['snowman', 'Snowman', 'glow'],
    ['aurora', 'Northern lights', 'glow', 'rare'], ['polar-bear', 'Polar bear cub', 'ground'],
  ],
  aquarium: [
    ['baby-whale', 'Baby whale', 'approach', 'special', true], ['glowing-fish', 'School of glowing fish', 'pass'],
    ['octopus', 'Curious octopus', 'approach', 'small', true], ['jellyfish', 'Jellyfish', 'pass'],
    ['submarine', 'Tiny submarine', 'pass', 'special', true], ['sea-turtle', 'Sea turtle', 'pass'],
  ],
  beach: [
    ['crab', 'Little crab', 'ground', 'small', true], ['dolphins', 'Leaping dolphins', 'pass'],
    ['bottle', 'Message in a bottle', 'ground'], ['tropical-bird', 'Tropical bird', 'sky'], ['sunset', 'Peach sunset', 'glow', 'special'],
  ],
  moon: [
    ['moon-astronaut', 'Moon astronaut', 'approach', 'special', true], ['rover', 'Lunar rover', 'ground'],
    ['meteors', 'Meteor shower', 'sky', 'special'], ['satellite', 'Silver satellite', 'pass'], ['moon-orb', 'Mysterious light', 'glow'],
  ],
  spaceship: [
    ['ufo', 'Little UFO', 'pass', 'small', true], ['nebula', 'Ribbon nebula', 'glow', 'special'],
    ['flyby', 'Passing spaceship', 'pass'], ['ringed-planet', 'Ringed planet', 'glow'],
    ['alien', 'Waving alien', 'approach', 'special', true], ['lost-astronaut', 'Lost astronaut', 'approach', 'rare', true],
  ],
  zombies: [
    ['zombie-stroll', 'Zombie out for a stroll', 'ground'], ['zombie-slip', 'Slippery snow', 'slip'],
    ['shadow', 'Shy shadow', 'glow'], ['zombie-wave', 'Friendly zombie', 'approach', 'small', true],
    ['zombie-dance', 'Zombie dance troupe', 'dance', 'special'],
  ],
} as const satisfies Record<StudyWindowScene, readonly Entry[]>;

export type SurpriseId = (typeof scenes)[StudyWindowScene][number][0];
export type Surprise = { id: SurpriseId; scene: StudyWindowScene; name: string; motion: Motion; rarity: Rarity; interactive: boolean; slot: number };
export const SURPRISES = (Object.entries(scenes) as [StudyWindowScene, readonly Entry[]][]).flatMap(([scene, entries]) =>
  entries.map(([id, name, motion, rarity = 'small', interactive = false], slot): Surprise =>
    ({ id: id as SurpriseId, scene, name, motion, rarity, interactive, slot })));
export type Discoveries = Partial<Record<SurpriseId, number>>;

export function restoreDiscoveries(value: unknown): Discoveries {
  if (!value || typeof value !== 'object') return {};
  const dates = value as Record<string, unknown>;
  return Object.fromEntries(SURPRISES.flatMap(({id}) => {
    const date = dates[id];
    return typeof date === 'number' && Number.isFinite(date) && date > 0 && date < 8.64e15 ? [[id,date]] : [];
  }));
}

export function surpriseDelay(random = Math.random) {
  return (8 + random() * 7) * 60_000;
}

export function pickSurprise(scene: StudyWindowScene, recent: readonly SurpriseId[], specialReady: boolean, rareReady: boolean, random = Math.random) {
  if (random() < .12) return undefined;
  const choices = SURPRISES.filter(event => event.scene === scene && !recent.includes(event.id)
    && (event.rarity === 'small' || (event.rarity === 'special' ? specialReady : rareReady)));
  const weight = { small: 8, special: 13, rare: 2 };
  let ticket = random() * choices.reduce((sum, event) => sum + weight[event.rarity], 0);
  return choices.find(event => (ticket -= weight[event.rarity]) < 0);
}
