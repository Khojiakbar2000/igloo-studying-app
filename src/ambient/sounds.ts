export const SOUNDS = [
  { id: 'rain', label: 'Rain', icon: 'rain', source: require('../../assets/audio/ambient/rain.wav') },
  { id: 'heavy-rain', label: 'Heavy Rain', icon: 'storm', source: require('../../assets/audio/ambient/heavy-rain.wav') },
  { id: 'ocean', label: 'Ocean', icon: 'ocean', source: require('../../assets/audio/ambient/ocean.wav') },
  { id: 'forest', label: 'Forest', icon: 'forest', source: require('../../assets/audio/ambient/forest.wav') },
  { id: 'fireplace', label: 'Fireplace', icon: 'fire', source: require('../../assets/audio/ambient/fireplace.wav') },
  { id: 'snowstorm', label: 'Snowstorm', icon: 'snow', source: require('../../assets/audio/ambient/snowstorm.wav') },
  { id: 'night', label: 'Night', icon: 'night', source: require('../../assets/audio/ambient/night.wav') },
  { id: 'white-noise', label: 'White Noise', icon: 'white', source: require('../../assets/audio/ambient/white-noise.wav') },
  { id: 'brown-noise', label: 'Brown Noise', icon: 'brown', source: require('../../assets/audio/ambient/brown-noise.wav') },
  { id: 'pink-noise', label: 'Pink Noise', icon: 'pink', source: require('../../assets/audio/ambient/pink-noise.wav') },
] as const;

export type Sound = typeof SOUNDS[number];
export type SoundId = Sound['id'];
export const soundById = (id: SoundId) => SOUNDS.find(sound => sound.id === id)!;
export const MAX_TRACKS = 3;
