export type Bounds = { x: number; y: number; width: number; height: number };
export const FURNITURE = {
  sofa: { label: 'Sofa', action: 'Sit, relax, stretch or nap', symbol: '☾' },
  bookshelf: { label: 'Bookshelf', action: 'Read study history and achievements', symbol: '▤' },
  desk: { label: 'Study desk', action: 'Open the focus timer', symbol: '◷' },
  bed: { label: 'Bed', action: 'Let Pip rest', symbol: '☾' },
  wardrobe: { label: 'Wardrobe', action: 'Change Pip’s outfit', symbol: '♧' },
  window: { label: 'Window', action: 'Change the scenery', symbol: '◇' },
  scenery: { label: 'Scenery console', action: 'Choose a room, window or lighting preset', symbol: '◈' },
  radio: { label: 'Radio', action: 'Mix ambient sounds', symbol: '♫' },
  coffee: { label: 'Coffee machine', action: 'Prepare a warm drink', symbol: '♨' },
  awards: { label: 'Trophy cabinet', action: 'Inspect Living Awards', symbol: '★' },
  pets: { label: 'Pet corner', action: 'Visit or adopt a pet', symbol: '♥' },
  gifts: { label: 'Mystery Gifts', action: 'Open earned gifts and view your collection', symbol: '❖' },
  garden: { label: 'Winter Garden', action: 'Inspect and tend plants', symbol: '✿' },
  mailbox: { label: 'Mailbox', action: 'Read Pip’s letters', symbol: '✉' },
  lamp: { label: 'Study lamp', action: 'Toggle the study lamp', symbol: '✦' },
  lantern: { label: 'Lantern', action: 'Toggle the lantern', symbol: '✦' },
  fairy: { label: 'Fairy lights', action: 'Toggle fairy lights', symbol: '✧' },
  fireplace: { label: 'Fireplace', action: 'Toggle the fire', symbol: '♨' },
} as const;
export type FurnitureId = keyof typeof FURNITURE;
export const roomBox = (x: number, y: number, width: number, height: number): Bounds => ({ x, y, width, height });
export const pixelBox = ({ x, y, width, height }: Bounds) => roomBox(x / 10.24, y / 15.36, width / 10.24, height / 15.36);
export const boxStyle = ({ x, y, width, height }: Bounds) => ({
  left: `${x}%` as const, top: `${y}%` as const, width: `${width}%` as const, height: `${height}%` as const,
});
export const intersects = (a: Bounds, b: Bounds) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

export function canPerformFurnitureActivity(mode: string, status: string) {
  return status !== 'paused' && (mode !== 'focus' || status !== 'running');
}

export const MOVABLE_DECOR = ['wallArt', 'toy', 'tabletop'] as const;
type Decor = typeof MOVABLE_DECOR[number];
export type DecorPlacement = Partial<Record<Decor, -1 | 1>>;
export const isMovableDecor = (slot: string): slot is Decor => MOVABLE_DECOR.some(value => value === slot);
export const decorOffset = (placement: DecorPlacement, slot: string) => isMovableDecor(slot) ? (placement[slot] ?? 0) * 24 : 0;
export function restoreDecorPlacement(raw?: Partial<DecorPlacement>): DecorPlacement {
  const placement: DecorPlacement = {};
  for (const slot of MOVABLE_DECOR) if (raw?.[slot] === -1 || raw?.[slot] === 1) placement[slot] = raw[slot];
  return placement;
}
