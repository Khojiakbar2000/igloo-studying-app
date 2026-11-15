export const PERSONAL_IGLOO_STAGES = [
  { id: 'little', label: 'Little Igloo', description: 'Your familiar little home, just as you left it.', source: require('../../assets/environments/igloo/concepts/my-igloo-clean-plate.png'), thumbnail: require('../../assets/environments/igloo/expansions/little-thumb.jpg') },
  { id: 'cozy', label: 'Cozy Igloo', description: 'A quiet living nook, a warm fire, and a little more room.', source: require('../../assets/environments/igloo/expansions/cozy-igloo.jpg'), thumbnail: require('../../assets/environments/igloo/expansions/cozy-thumb.jpg') },
  { id: 'dream', label: 'Dream Igloo', description: 'Snowy views, a tiny kitchen, and a sky full of possibilities.', source: require('../../assets/environments/igloo/expansions/dream-igloo.jpg'), thumbnail: require('../../assets/environments/igloo/expansions/dream-thumb.jpg') },
] as const;
export type PersonalIglooStage = typeof PERSONAL_IGLOO_STAGES[number]['id'];
export const personalIglooStage = (id: PersonalIglooStage) => PERSONAL_IGLOO_STAGES.find((stage) => stage.id === id)!;
export const isPersonalIglooStage = (value: unknown): value is PersonalIglooStage => PERSONAL_IGLOO_STAGES.some((stage) => stage.id === value);
