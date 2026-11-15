/** ImageGen panoramas + small Creator-authored Lottie loops. Only one plays at a time. */
export const STUDY_WINDOW_SCENES = [
  { id: 'aquarium', label: 'Aquarium', icon: '🐠', description: 'A little ocean, a little focus.' },
  { id: 'zombies', label: 'Zombie apocalypse', icon: '🧟', description: 'The world can wait. You’re safe in here.' },
  { id: 'beach', label: 'Beach', icon: '🏝️', description: 'A study break by the sea.' },
  { id: 'moon', label: 'Moon', icon: '🌙', description: 'A quiet corner of the universe.' },
  { id: 'spaceship', label: 'Cosmic ship', icon: '🪐', description: 'One small task. One spectacular voyage.' },
  { id: 'blizzard', label: 'Blizzard', icon: '❄️', description: 'Cold outside. Cozy together.' },
] as const;

export type StudyWindowScene = typeof STUDY_WINDOW_SCENES[number]['id'];
export type IllustratedWindowScene = Exclude<StudyWindowScene, 'blizzard'>;

export const WINDOW_OPENING = { x: 218, y: 402, width: 660, height: 234 } as const;
export const WINDOW_CLIP = 'M0 100 C0 50 40 24 110 12 C180 0 240 0 330 0 C420 0 460 0 550 12 C620 24 660 50 660 100 L660 212 C660 224 650 234 638 234 L22 234 C10 234 0 224 0 212 Z';

export const WINDOW_ART = {
  aquarium: require('../../assets/animations/study-together-window/scenarios/aquarium.jpg'),
  zombies: require('../../assets/animations/study-together-window/scenarios/zombies.jpg'),
  beach: require('../../assets/animations/study-together-window/scenarios/beach.jpg'),
  moon: require('../../assets/animations/study-together-window/scenarios/moon.jpg'),
  spaceship: require('../../assets/animations/study-together-window/scenarios/spaceship.jpg'),
};

export const WINDOW_MOTION = {
  aquarium: require('../../assets/animations/study-together-window/scenarios/aquarium.json'),
  zombies: require('../../assets/animations/study-together-window/scenarios/zombies.json'),
  beach: require('../../assets/animations/study-together-window/scenarios/beach.json'),
  moon: require('../../assets/animations/study-together-window/scenarios/moon.json'),
  spaceship: require('../../assets/animations/study-together-window/scenarios/spaceship.json'),
};
