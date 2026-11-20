import type { AnimationObject } from 'lottie-react-native';
import type { AwardId } from './progression';

type Sprite = { id: string; w: number; h: number; u: string; e: number; p: string };
const art: Record<AwardId | 'gift-base' | 'gift-lid', Sprite> = require('../../assets/environments/igloo/awards/sprites.json');
type Point = [number, number];
type Key<T> = readonly [number, T];
const fixed = <T,>(k: T) => ({ a: 0, k });
const keys = <T extends number | number[],>(points: Key<T>[]) => ({
  a: 1,
  k: points.map(([t, s], index) => ({
    t, s: typeof s === 'number' ? [s] : s,
    ...(index < points.length - 1 ? { i: { x: 0.65, y: 1 }, o: { x: 0.35, y: 0 } } : {}),
  })),
});
const position = (points: Key<Point>[]) => keys(points.map(([t, [x, y]]) => [t, [x, y, 0]]));
const scale = (points: Key<number>[]) => keys(points.map(([t, size]) => [t, [size, size, 100]]));
const layer = (ty: number, nm: string, op: number, ip = 0) => ({ ty, nm, op, ip, st: 0, sr: 1, ddd: 0, ao: 0 });
const image = (sprite: Sprite, end: number, path: Key<Point>[], size: Key<number>[], opacity: Key<number>[], turn: Key<number>[], start = 0) => ({
  ...layer(2, sprite.id, end, start), refId: sprite.id,
  ks: { p: position(path), s: scale(size), a: fixed([sprite.w / 2, sprite.h / 2, 0]), o: keys(opacity), r: keys(turn) },
});
const shine = [1, 0.86, 0.55, 1];
const frost = [0.76, 0.91, 1, 1];
const lavender = [0.94, 0.7, 1, 1];

function light(name: string, start: number, end: number, size: number, color: number[], path: Key<Point>[], opacity: Key<number>[], rays = false) {
  const vertices = [[0,-size],[size*.2,-size*.2],[size,0],[size*.2,size*.2],[0,size],[-size*.2,size*.2],[-size,0],[-size*.2,-size*.2]];
  const marks = vertices.map(() => [0, 0]);
  return {
    ...layer(4, name, end, start),
    ks: { p: position(path), s: fixed([100,100,100]), a: fixed([0,0,0]), r: fixed(0), o: keys(opacity) },
    shapes: [
      rays ? { ty: 'sh', ks: fixed({ c: true, v: vertices, i: marks, o: marks }) }
        : { ty: 'el', d: 1, p: fixed([0,0]), s: fixed([size * 2,size * 2]) },
      { ty: 'fl', c: fixed(color), o: fixed(100) },
    ],
  };
}

function glint(at: Point, frame: number, size: number, color: number[]) {
  return light('Glint', frame, frame+29, size, color,
    [[frame,at],[frame+29,[at[0]+2,at[1]-3]]], [[frame,0],[frame+11,78],[frame+29,0]], true);
}

function composition(name: string, width: number, height: number, end: number, assets: Sprite[], layers: object[]): AnimationObject {
  return { v: '5.7.0', fr: 30, ip: 0, op: end, w: width, h: height, nm: name, assets,
    layers: layers.map((item, index) => ({ ind: index+1, ...item })) } as AnimationObject;
}

export function trophyMotion(id: AwardId) {
  const trophy = art[id];
  const origin: Point = [112, 112];
  const end = 150;
  const lamp = (name: string, at: Point, color: number[], radius: number) =>
    [light(name, 0, end, radius, color, [[0,at]], [[0,8],[66,28],[117,10],[end,8]])];
  const effects: Record<AwardId, object[]> = {
    'first-steps': [glint([85,72], 31, 12, shine), glint([143,161], 97, 6, shine)],
    'focus-explorer': [glint([112,47], 30, 12, frost), glint([146,84], 94, 8, frost)],
    'dedicated-learner': [glint([140,117], 62, 13, frost), glint([79,153], 100, 7, shine)],
    'winter-scholar': [...lamp('Crystal light', [112,120], lavender, 18), glint([125,79], 64, 10, lavender)],
    'focus-master': [glint([84,68], 27, 8, shine), ...[19,28,37,46,55,64,73,82,91,100,109].map((frame, index) =>
      light('Falling sand', frame, frame+15, 1.45, shine, [[frame,[111.5+index%2,112]],[frame+15,[112,145]]],
        [[frame,0],[frame+3,72],[frame+15,0]]))],
    'igloo-legend': [glint([113,57], 16, 15, frost), glint([155,102], 79, 10, frost), glint([73,124], 112, 9, frost)],
    'consistency-star': [...lamp('Starlight', [112,108], shine, 20), glint([134,111], 53, 16, shine)],
    'deep-focus': [...lamp('Lantern light', [112,133], shine, 18), glint([113,140], 88, 7, shine)],
  };
  const pivot = id === 'focus-explorer' ? 6 : id === 'dedicated-learner' || id === 'first-steps' ? 2 : 0;
  const trophyLayer = image(trophy, end, [[0,origin]], [[0,100]], [[0,100]], [[0,0],[43,pivot],[104,-pivot],[end,0]]);
  return composition(id, 224, 224, end, [trophy], [...effects[id], trophyLayer]);
}

export const GIFT_REVEAL_MS = 1667;
export const GIFT_DURATION_MS = 4000;
export const CABINET = { x: 162, y: 249, width: 269, height: 158 };
export function shelfPosition(index: number): Point {
  return [0.22 + index % 4 * 0.173, index < 4 ? 0.56 : 0.88];
}

export function giftMotion(id: AwardId, slot: number) {
  const trophy = art[id];
  const box = art['gift-base'];
  const lid = art['gift-lid'];
  const end = 120;
  const floor: Point = [307, 925];
  const reveal: Point = [314, 744];
  const [x, y] = shelfPosition(Math.max(0, slot));
  const finish: Point = [CABINET.x + CABINET.width*x, CABINET.y + CABINET.height*y - 10];
  const sparkle = (x: number, y: number, at: number, size: number) => glint([x,y], at, size, shine);
  return composition('Award reveal', 1024, 1536, end, [trophy, box, lid], [
    sparkle(252,708,44,18), sparkle(370,777,50,14), sparkle(358,696,59,10),
    sparkle(finish[0]+14,finish[1]-9,90,13),
    image(lid, 76, [[0,[floor[0],floor[1]-35]],[15,floor],[36,floor],[52,[216,825]],[76,[200,845]]],
      [[0,27],[15,84],[36,84],[52,84]], [[0,0],[11,100],[51,100],[76,0]], [[0,-8],[17,0],[36,0],[54,34],[76,44]]),
    image(trophy, end, [[42,floor],[59,reveal],[78,reveal],[99,finish]],
      [[42,15],[58,105],[78,103],[99,15]], [[42,0],[52,100],[104,100],[118,0]], [[42,-8],[60,4],[78,0]], 42),
    image(box, 101, [[0,[floor[0],floor[1]-35]],[15,floor]], [[0,27],[15,84]],
      [[0,0],[11,100],[75,100],[101,0]], [[0,-8],[17,0]]),
  ]);
}
