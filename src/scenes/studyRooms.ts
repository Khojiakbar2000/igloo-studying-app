export const STUDY_ROOMS = [
  { id: 'library', label: 'Midnight Library', icon: '📚', description: 'A quiet chapter beneath the reading lamps.', background: require('../../assets/environments/study-together/rooms/library.jpg'), thumbnail: require('../../assets/environments/study-together/rooms/library-thumb.jpg') },
  { id: 'cafe', label: 'Rainy Café', icon: '☕', description: 'Warm lights, rainy streets, good company.', background: require('../../assets/environments/study-together/rooms/cafe.jpg'), thumbnail: require('../../assets/environments/study-together/rooms/cafe-thumb.jpg') },
  { id: 'igloo', label: 'Snowy Igloo', icon: '❄️', description: 'Our familiar little shelter from the snow.', background: require('../../assets/environments/igloo/study-together-layers/room-floor-background-blizzard.jpg'), thumbnail: require('../../assets/environments/study-together/rooms/igloo-thumb.jpg') },
  { id: 'blossom', label: 'Cherry Blossom Room', icon: '🌸', description: 'A spring breeze between the pages.', background: require('../../assets/environments/study-together/rooms/blossom.jpg'), thumbnail: require('../../assets/environments/study-together/rooms/blossom-thumb.jpg') },
  { id: 'underwater', label: 'Underwater Library', icon: '🌊', description: 'A deep-blue sanctuary for curious minds.', background: require('../../assets/environments/study-together/rooms/underwater.jpg'), thumbnail: require('../../assets/environments/study-together/rooms/underwater-thumb.jpg') },
  { id: 'cabin', label: 'Forest Cabin', icon: '🌲', description: 'A crackling fire and nowhere to rush.', background: require('../../assets/environments/study-together/rooms/cabin.jpg'), thumbnail: require('../../assets/environments/study-together/rooms/cabin-thumb.jpg') },
  { id: 'observatory', label: 'Stargazing Observatory', icon: '🌌', description: 'Little steps beneath an infinite sky.', background: require('../../assets/environments/study-together/rooms/observatory.jpg'), thumbnail: require('../../assets/environments/study-together/rooms/observatory-thumb.jpg') },
  { id: 'train', label: 'Midnight Train', icon: '🚂', description: 'Mountains pass. Your story keeps going.', background: require('../../assets/environments/study-together/rooms/train.jpg'), thumbnail: require('../../assets/environments/study-together/rooms/train-thumb.jpg') },
  { id: 'castle', label: 'Enchanted Castle', icon: '🏰', description: 'A little magic in every chapter.', background: require('../../assets/environments/study-together/rooms/castle.jpg'), thumbnail: require('../../assets/environments/study-together/rooms/castle-thumb.jpg') },
  { id: 'aquarium', label: 'Aquarium Lounge', icon: '🐠', description: 'Let the world drift gently by.', background: require('../../assets/environments/study-together/rooms/aquarium.jpg'), thumbnail: require('../../assets/environments/study-together/rooms/aquarium-thumb.jpg') },
] as const;

export type StudyRoomId = typeof STUDY_ROOMS[number]['id'];
export const studyRoom = (id: StudyRoomId) => STUDY_ROOMS.find((room) => room.id === id)!;
export function isStudyRoomId(value: unknown): value is StudyRoomId {
  return STUDY_ROOMS.some((room) => room.id === value);
}

export const ROOM_MOTION = {
  library: require('../../assets/animations/study-together-rooms/library.json'),
  cafe: require('../../assets/animations/study-together-rooms/cafe.json'),
  igloo: require('../../assets/animations/study-together-rooms/igloo.json'),
  blossom: require('../../assets/animations/study-together-rooms/blossom.json'),
  underwater: require('../../assets/animations/study-together-rooms/underwater.json'),
  cabin: require('../../assets/animations/study-together-rooms/cabin.json'),
  observatory: require('../../assets/animations/study-together-rooms/observatory.json'),
  train: require('../../assets/animations/study-together-rooms/train.json'),
  castle: require('../../assets/animations/study-together-rooms/castle.json'),
  aquarium: require('../../assets/animations/study-together-rooms/aquarium.json'),
};
