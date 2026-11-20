// Register the study setup to the cushion painted into both room plates.
export const STUDY_SEAT = { x: 602, y: 961 };
// The compact machine sits in the floor gap between the sofa and study chair.
// Its artwork and tap target share this box on the 1024 × 1536 room canvas.
export const COFFEE_STATION = { x: 300, y: 748, width: 165, height: 208 };
export const HOME_SLOTS = {
  ceiling: { x: 245, y: 55, width: 535, height: 265, z: 1, optional: true },
  window: { x: 335, y: 425, width: 355, height: 215, z: 2, optional: false },
  rug: { x: 420, y: 1245, width: 390, height: 185, z: 3, optional: true },
  sofa: { x: 110, y: 570, width: 290, height: 195, z: 4, optional: true },
  bed: { x: 0, y: 1090, width: 390, height: 390, z: 5, optional: false },
  bookshelf: { x: 790, y: 455, width: 170, height: 280, z: 6, optional: true },
  plant: { x: 710, y: 585, width: 75, height: 130, z: 7, optional: true },
  desk: { x: STUDY_SEAT.x + 39, y: STUDY_SEAT.y - 181, width: 340, height: 350, z: 8, optional: false },
  lighting: { x: 865, y: 610, width: 145, height: 215, z: 9, optional: false },
  wallArt: { x: 155, y: 400, width: 125, height: 155, z: 10, optional: true },
  books: { x: 670, y: 890, width: 75, height: 70, z: 10, optional: true },
  toy: { x: 330, y: 1380, width: 65, height: 75, z: 10, optional: true },
  sideTable: { x: 570, y: 1125, width: 120, height: 140, z: 7, optional: true },
  petBed: { x: 92, y: 820, width: 165, height: 115, z: 7, optional: true },
  tabletop: { x: 845, y: 880, width: 95, height: 65, z: 10, optional: true },
} as const;
export type HomeSlot = keyof typeof HOME_SLOTS;
export const HOME_CANVAS = { width: 1024, height: 1536 } as const;
// The desk PNG has transparent padding above the tabletop. Keep its tap area
// over the left drawer and clear of the garden's own control.
export const STUDY_DESK_TARGET = {
  x: HOME_SLOTS.desk.x + 20,
  y: HOME_SLOTS.desk.y + 130,
  width: 120,
  height: 130,
};
