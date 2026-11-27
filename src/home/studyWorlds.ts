import type { Bounds } from '../furniture/catalog';
import type { HomeSlot } from './slots';
import type { StudyRoomId } from './state';

export type WorldId = Exclude<StudyRoomId, 'igloo'>;
type Placement = [x: number, y: number, width: number, height: number];
type World = {
  art: number;
  thumbnail: number;
  desk: Placement;
  placements: Partial<Record<HomeSlot, Placement>>;
  spare?: Placement;
};
export const worlds: Record<WorldId, World> = {
  bedroom: {
    art: require('../../assets/environments/study-worlds/bedroom.webp'),
    thumbnail: require('../../assets/environments/study-worlds/bedroom-thumb.webp'),
    desk: [57, 72, 31, 24],
    placements: { bed: [3, 68, 38, 30], bookshelf: [87, 47, 13, 30], plant: [43, 68, 10, 17], wallArt: [10, 34, 15, 17], window: [34, 25, 36, 29] },
  },
  library: {
    art: require('../../assets/environments/study-worlds/library.webp'),
    thumbnail: require('../../assets/environments/study-worlds/library-thumb.webp'),
    desk: [28, 75, 35, 25], spare: [67, 61, 22, 15],
    placements: { bookshelf: [0, 49, 18, 36], plant: [83, 69, 12, 19], wallArt: [63, 35, 13, 15] },
  },
  ocean: {
    art: require('../../assets/environments/study-worlds/ocean.webp'),
    thumbnail: require('../../assets/environments/study-worlds/ocean-thumb.webp'),
    desk: [33, 76, 38, 24], spare: [73, 73, 23, 16],
    placements: { plant: [7, 70, 14, 23], bookshelf: [88, 73, 11, 22], wallArt: [12, 60, 9, 10] },
  },
  treehouse: {
    art: require('../../assets/environments/study-worlds/treehouse.webp'),
    thumbnail: require('../../assets/environments/study-worlds/treehouse-thumb.webp'),
    desk: [44, 75, 34, 24], spare: [8, 66, 22, 16],
    placements: { bookshelf: [82, 47, 17, 33], plant: [22, 73, 14, 24], wallArt: [83, 36, 11, 15] },
  },
  observatory: {
    art: require('../../assets/environments/study-worlds/observatory.webp'),
    thumbnail: require('../../assets/environments/study-worlds/observatory-thumb.webp'),
    desk: [21, 74, 38, 26],
    placements: { bookshelf: [1, 51, 16, 30], plant: [86, 67, 11, 21], wallArt: [70, 55, 11, 13] },
  },
  train: {
    art: require('../../assets/environments/study-worlds/train.webp'),
    thumbnail: require('../../assets/environments/study-worlds/train-thumb.webp'),
    desk: [21, 74, 35, 26], spare: [68, 73, 27, 18],
    placements: { bookshelf: [86, 60, 13, 27], plant: [1, 69, 11, 18], wallArt: [47, 48, 8, 11] },
  },
};

export function worldBox([x,y,width,height]: Placement): Bounds {
  return {x,y,width,height};
}

export function furniturePositions(world: World): Partial<Record<HomeSlot, Placement>> {
  const [x,y,w,h] = world.desk;
  return {
    rug: [x - 8, y + 10, w + 16, 14],
    desk: world.desk,
    lighting: [x + w * .68, y - .39 * h, w * .24, h * .73],
    books: [x + w * .18, y + h * .05, w * .19, h * .27],
    tabletop: [x + w * .40, y + h * .03, w * .17, h * .28],
    toy: [x + w * .84, y + h * .66, w * .20, h * .32],
    petBed: [2, 87, 20, 12],
    sideTable: [82, 79, 15, 19],
    ...world.placements,
  };
}
