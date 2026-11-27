import type { Bounds } from '../furniture/catalog';
import type { HomeSlot } from './slots';

export const PANORAMA = { width: 1536, height: 1024 };
export const ROOM_ZONES = [
  { id: 'lounge', label: 'Lounge' },
  { id: 'study', label: 'Study' },
  { id: 'nooks', label: 'Pet & coffee' },
] as const;
export type RoomZone = typeof ROOM_ZONES[number]['id'];

export function panoramaBounds({ x, y, width, height }: Bounds): Bounds {
  return { x: x / PANORAMA.width * 100, y: y / PANORAMA.height * 100, width: width / PANORAMA.width * 100, height: height / PANORAMA.height * 100 };
}

export function cameraOffset(zone: RoomZone, worldWidth: number, viewportWidth: number) {
  return Math.max(0, worldWidth - viewportWidth) * ROOM_ZONES.findIndex(item => item.id === zone) / (ROOM_ZONES.length - 1);
}

type Slot = Bounds & { zone: RoomZone; z: number };
export const PANORAMA_SLOTS: Record<HomeSlot, Slot> = {
  ceiling: { x: 650, y: 7, width: 235, height: 91, z: 1, zone: 'study' },
  window: { x: 640, y: 169, width: 250, height: 224, z: 1, zone: 'study' },
  rug: { x: 541, y: 644, width: 535, height: 240, z: 1, zone: 'study' },
  bookshelf: { x: 349, y: 568, width: 121, height: 188, z: 2, zone: 'lounge' },
  sofa: { x: 220, y: 395, width: 291, height: 188, z: 2, zone: 'lounge' },
  bed: { x: 52, y: 657, width: 269, height: 222, z: 3, zone: 'lounge' },
  desk: { x: 761, y: 545, width: 288, height: 207, z: 3, zone: 'study' },
  lighting: { x: 971, y: 444, width: 109, height: 157, z: 4, zone: 'study' },
  wallArt: { x: 950, y: 242, width: 106, height: 113, z: 2, zone: 'study' },
  plant: { x: 1358, y: 596, width: 88, height: 138, z: 3, zone: 'nooks' },
  books: { x: 928, y: 546, width: 58, height: 60, z: 4, zone: 'study' },
  toy: { x: 1182, y: 808, width: 65, height: 70, z: 4, zone: 'nooks' },
  sideTable: { x: 1010, y: 713, width: 115, height: 137, z: 3, zone: 'nooks' },
  petBed: { x: 1240, y: 744, width: 248, height: 162, z: 3, zone: 'nooks' },
  tabletop: { x: 932, y: 621, width: 68, height: 64, z: 4, zone: 'study' },
};

export const PANORAMA_PROPS = {
  fireplace: { x: 32, y: 383, width: 202, height: 176 },
  chair: { x: 581, y: 477, width: 188, height: 236 },
  laptopPip: { x: 557, y: 355, width: 274, height: 345 },
  radio: { x: 462, y: 666, width: 108, height: 126 },
  coffeeCabinet: { x: 1132, y: 527, width: 224, height: 163 },
  coffee: { x: 1165, y: 404, width: 147, height: 172 },
  evergreen: { x: 1445, y: 572, width: 78, height: 101 },
  garden: { x: 1373, y: 471, width: 148, height: 121 },
  awards: { x: 413, y: 249, width: 180, height: 106 },
  gifts: { x: 909, y: 806, width: 120, height: 101 },
  mailbox: { x: 1378, y: 259, width: 108, height: 125 },
  petToy: { x: 1243, y: 835, width: 45, height: 42 },
  petBowl: { x: 1438, y: 865, width: 54, height: 32 },
} satisfies Record<string, Bounds>;

export const PANORAMA_DESK_TARGET = { x: 848, y: 613, width: 205, height: 143 };
export const PANORAMA_CHAIR_CONTACT = { x: 711, y: 612 };
export const PANORAMA_BED_PATH = [[44, 58], [30, 74], [8, 72]] as const;

/** Measure the painted silhouette. The encoded PNG can contain a larger padded canvas. */
export type SpriteFootprint = readonly [canvasWidth: number, canvasHeight: number, left: number, top: number, right: number, bottom: number];
export function fittedSprite(box: Bounds, footprint: SpriteFootprint): Bounds {
  const [imageWidth, imageHeight, left, top, right, bottom] = footprint;
  const width = right - left;
  const height = bottom - top;
  const scale = Math.min(box.width / width, box.height / height);
  return {
    x: box.x + (box.width - width * scale) / 2 - left * scale,
    y: box.y + box.height - bottom * scale,
    width: imageWidth * scale,
    height: imageHeight * scale,
  };
}
