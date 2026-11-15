export const HOME_SLOTS = {
  ceiling: { x: 245, y: 55, width: 535, height: 265, z: 1, optional: true },
  window: { x: 335, y: 425, width: 355, height: 215, z: 2, optional: false },
  rug: { x: 275, y: 1080, width: 430, height: 180, z: 3, optional: true },
  sofa: { x: 140, y: 555, width: 250, height: 180, z: 4, optional: true },
  bed: { x: 0, y: 1080, width: 430, height: 410, z: 5, optional: false },
  bookshelf: { x: 790, y: 455, width: 170, height: 280, z: 6, optional: true },
  plant: { x: 710, y: 585, width: 75, height: 130, z: 7, optional: true },
  desk: { x: 640, y: 770, width: 350, height: 360, z: 8, optional: false },
  lighting: { x: 865, y: 610, width: 145, height: 215, z: 9, optional: false },
  wallArt: { x: 155, y: 400, width: 125, height: 155, z: 10, optional: true },
  books: { x: 670, y: 890, width: 75, height: 70, z: 10, optional: true },
  toy: { x: 330, y: 1380, width: 65, height: 75, z: 10, optional: true },
  tabletop: { x: 845, y: 880, width: 95, height: 65, z: 10, optional: true },
} as const;
export type HomeSlot = keyof typeof HOME_SLOTS;
export const HOME_CANVAS = { width: 1024, height: 1536 } as const;
