import { pixelBox, type Bounds } from '../furniture/catalog';

// Furniture anchors use the existing 1024 × 1536 room artboard.
export const IGLOO_FURNITURE = {
  fireplace: pixelBox({ x: 8, y: 1028, width: 251, height: 244 }),
  fireplaceTarget: pixelBox({ x: 18, y: 1076, width: 230, height: 159 }),
  garden: pixelBox({ x: 24, y: 1270, width: 203, height: 149 }),
  radio: pixelBox({ x: 233, y: 1330, width: 156, height: 171 }),
  console: pixelBox({ x: 764, y: 1101, width: 241, height: 144 }),
  gifts: pixelBox({ x: 642, y: 1249, width: 145, height: 133 }),
  pets: pixelBox({ x: 739, y: 1397, width: 235, height: 119 }),
};

export const COFFEE_STATION: Bounds = { x: 336, y: 1060, width: 218, height: 275 };
export const IGLOO_COFFEE_OFFSET = { x: 54, y: 18 };

export const IGLOO_FIRE = { x: 133, y: 1196 };

// Broad floor shadows and tighter contact shadows follow the furniture feet.
export const IGLOO_FLOOR_CONTACTS = [
  [135, 1233, 117, 17],
  [126, 1409, 79, 13],
  [311, 1500, 74, 16],
  [500, 1347, 100, 15],
  [885, 1235, 108, 17],
  [714, 1370, 53, 11],
  [854, 1510, 103, 15],
] as const;
