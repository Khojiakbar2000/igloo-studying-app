import type { SpriteFootprint } from './panorama';

export const PANORAMA_SHELL = require('../../assets/home-customization/panorama/shell-warm-nordic.webp');
export const PANORAMA_FIXTURES = {
  chair: require('../../assets/home-customization/panorama/chair.webp'),
  coffeeCabinet: require('../../assets/home-customization/panorama/coffee-cabinet.webp'),
  coffee: require('../../assets/environments/study-together/coffee/machine-warm-nordic.png'),
  fireplace: require('../../assets/environments/study-together/fireplace-warm-nordic.png'),
  evergreen: require('../../assets/environments/igloo/garden/plant-3.webp'),
  petBowl: require('../../assets/animations/igloo-pets/bowl.png'),
  petToy: require('../../assets/animations/study-together-breaks/toy.png'),
};

export const PANORAMA_FOOTPRINTS: Record<string, SpriteFootprint> = require('../../assets/home-customization/panorama/footprints.json');
