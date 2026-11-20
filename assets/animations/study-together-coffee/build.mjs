import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const folder = import.meta.dirname;
const assets = path.resolve(folder, '../..');
const props = path.join(assets, 'environments/study-together/coffee');
const typing = JSON.parse(await fs.readFile(path.join(assets, 'animations/study-together-lottie/lottie/typing.json')));
const chair = [62, 685];
const start = [177, 958];
const landing = [159, 1052];
const counter = [351, 1320];
const tray = [450, 1216];
const saucer = [108, 947];
const cupTop = [200, 846];
const s = 220 / 430;
const drinks = ['coffee', 'cocoa', 'tea', 'milk'];
const cup = 'drink-cup';
const sip = 'drink-sip';

const fixed = k => ({ a: 0, k });
const ease = { i: { x: 0.67, y: 0.91 }, o: { x: 0.31, y: 0.12 } };
const keys = (points, curve = ease) => ({ a: 1, k: points.map(([t, value], index) => ({
  t, s: Array.isArray(value) ? value : [value], ...(index < points.length - 1 ? curve : {}),
})) });
const xy = points => keys(points.map(([t, [x, y]]) => [t, [x, y, 0]]));
const transform = (p, s = [100, 100, 100], a = [0, 0, 0], o = 100, r = 0) => ({
  p: Array.isArray(p) ? fixed([...p, 0]) : p, a: fixed(a),
  s: Array.isArray(s) ? fixed(s) : s,
  o: typeof o === 'number' ? fixed(o) : o,
  r: typeof r === 'number' ? fixed(r) : r,
});
const image = (id, ip, op, ks, nm = id) => ({ ty: 2, refId: id, nm, ip, op, st: 0, sr: 1, ao: 0, ddd: 0, ks });
const composition = (nm, op, layers, assets = []) => ({
  v: '5.12.2', fr: 30, ip: 0, op, w: 1024, h: 1536, nm, ddd: 0, assets,
  layers: layers.map((layer, index) => ({ ...layer, ind: index + 1 })),
});
const embedded = (id, bytes, w, h) => ({ id, w, h, u: '', p: `data:image/png;base64,${bytes.toString('base64')}`, e: 1 });
const file = async (id, filename) => {
  const data = await fs.readFile(filename);
  const { width, height } = await sharp(data).metadata();
  return embedded(id, data, width, height);
};

const mugs = Object.fromEntries(await Promise.all(drinks.map(async id => [id, await file(cup, path.join(props, id + '.png'))])));
const byId = id => typing.assets.find(asset => asset.id === id);
const byLayer = name => typing.layers.find(layer => layer.nm === name);
const fromTyping = (name, ip, op, opacity = 100) => {
  const original = byLayer(name) ?? byLayer(`typing ${name}`);
  const [x, y] = original.ks.p.k;
  const scale = original.ks.s.k[0] * s;
  return image(original.refId, ip, op, transform([chair[0] + x * s, chair[1] + y * s], [scale, scale, 100], [215, 270.5, 0], opacity), name);
};

const walk = await Promise.all([1, 2, 3, 4].map(async i => {
  const src = path.join(assets, 'animations/igloo-penguin-walk', `frame-0${i}.png`);
  const bytes = await sharp(src).trim({ threshold: 20 }).resize({ height: 226 }).png({ palette: true, colors: 256 }).toBuffer();
  const { width, height } = await sharp(bytes).metadata();
  return embedded(`walk${i}`, bytes, width, height);
}));
const reach = await file('reach', path.join(folder, 'reach.png'));
const carry = await file('carry', path.join(folder, 'carry.png'));
const firstTyping = Buffer.from(byId('asset_000').p.split(',')[1], 'base64');
const laptopMask = Buffer.from('<svg width="430" height="541"><path fill="white" d="M148 433L216 418L276 405L296 348Q300 330 311 326L415 310Q433 308 429 325L393 413Q391 423 381 429L271 478L158 458Q144 455 148 433Z"/></svg>');
const laptop = embedded('parked-laptop', await sharp(firstTyping).composite([{ input: laptopMask, blend: 'dest-in' }]).png({ palette: true }).toBuffer(), 430, 541);

const sipLayer = byLayer('typing drink 3');
const sipBytes = Buffer.from(byId(sipLayer.refId).p.split(',')[1], 'base64');
const sipColors = { cocoa: [0.95, 0.71, 0.74], tea: [0.77, 0.84, 0.61], milk: [0.72, 0.82, 1.07] };
const sipCels = { coffee: embedded(sip, sipBytes, 430, 541) };
for (const [id, tint] of Object.entries(sipColors)) {
  const { data } = await sharp(sipBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 322; y < 389; y++) {
    for (let x = 248; x < 315; x++) {
      const index = (y * 430 + x) * 4;
      const [r, g, b, a] = data.subarray(index, index + 4);
      const inside = ((x - 281) / 36) ** 2 + ((y - 354) / 33) ** 2;
      if (inside > 1 || a < 30 || r - b < 12 || r - b > 91 || r < 121 || g < r * 0.66 || b < r * 0.46) continue;
      const edge = Math.min(1, (1 - inside) * 8);
      tint.forEach((factor, channel) => { data[index + channel] = Math.min(255, data[index + channel] * (1 + (factor - 1) * edge)); });
    }
  }
  const bytes = await sharp(data, { raw: { width: 430, height: 541, channels: 4 } }).png({ palette: true, colors: 256 }).toBuffer();
  sipCels[id] = embedded(sip, bytes, 430, 541);
}

const mugSize = [36, 31];
const cupKs = (positions, opacities = 100, rotation = 0) => transform(
  Array.isArray(positions[0]) ? xy(positions) : positions,
  [-100 * mugSize[0] / mugs.coffee.w, 100 * mugSize[1] / mugs.coffee.h, 100],
  [mugs.coffee.w / 2, mugs.coffee.h / 2, 0], opacities, rotation,
);
const ellipse = (name, ip, op, pos, size, color, opacity, scale = [100, 100, 100]) => ({
  ty: 4, nm: name, ip, op, st: 0, sr: 1, ao: 0,
  ks: transform(pos, scale, [0, 0, 0], opacity),
  shapes: [{ ty: 'el', d: 1, s: fixed(size), p: fixed([0, 0]) }, { ty: 'fl', c: fixed(color), o: fixed(100) }],
});
const stroke = (name, ip, op, points, color, width, position, opacity) => ({
  ty: 4, nm: name, ip, op, st: 0, sr: 1, ao: 0, ks: transform(position, [100, 100, 100], [0, 0, 0], opacity),
  shapes: [
    { ty: 'sh', ks: fixed({ c: false, v: points, i: points.map(() => [0, 0]), o: points.map(() => [0, 0]) }) },
    { ty: 'st', c: fixed(color), o: fixed(100), w: fixed(width), lc: 2, lj: 2 },
  ],
});
const amber = [1, 0.70, 0.32, 1];
const cream = [1, 0.94, 0.86, 1];
const steam = (start, end) => [0, 1, 2].map(i => {
  const from = start + i * 3;
  return stroke('steam', from, end, [[0, 4], [-4, -2], [-5, -7], [-2, -12], [2, -17]],
    cream, 3, xy([[from, [445 + i * 6, 1208]], [end, [449 + i * 10, 1155]]]),
    keys([[from, 0], [from + 11, 58], [end, 0]]));
});
const light = [423, 445, 468].map((x, i) => ellipse('lit brass button', 0, 108, [x, 1139], [17, 17], amber,
  keys([[0, 0], [7 + i * 2, 66], [72 + i, 43], [96, 24], [108, 0]])));
const streamColor = [0.52, 0.25, 0.13, 1];
const brew = composition('Igloo drink preparation', 108, [
  ...steam(63, 105),
  ...light,
  stroke('drink stream', 19, 68, [[0, 0], [-0.7, 5], [0.5, 12], [0, 19]], streamColor, 4.5, [445, 1197],
    keys([[19, 0], [23, 100], [64, 100], [68, 0]])),
  ellipse('stream glint', 22, 67, [445, 1205], [1.5, 12], cream, 26),
  ...[-1, 1].flatMap((side, i) => [
    stroke('completion sparkle', 79, 102, [[-5, 0], [5, 0]], cream, 2.2, [445 + side * 34, 1177 + i * 10], keys([[79, 0], [84, 100], [102, 0]])),
    stroke('completion sparkle', 79, 102, [[0, -5], [0, 5]], cream, 2.2, [445 + side * 34, 1177 + i * 10], keys([[79, 0], [84, 100], [102, 0]])),
  ]),
  image(cup, 6, 108, cupKs([[6, [tray[0], tray[1] + 12]], [18, tray]], keys([[6, 0], [13, 100]]))),
], [mugs.coffee]);
const waiting = composition('Steam above the prepared cup', 90, [
  ...steam(4, 70), image(cup, 0, 90, cupKs(tray)),
], [mugs.coffee]);

function stride(ip, op, waypoints, direction, fade = 100) {
  const position = xy(waypoints);
  const frames = [];
  for (let frame = ip, beat = 0; frame < op; frame += 5, beat++) {
    const cel = walk[beat % walk.length];
    frames.push(image(cel.id, frame, Math.min(frame + 5, op), transform(position,
      [direction * 100, 100, 100], [cel.w * 0.5, cel.h, 0], fade), 'Pip waddles'));
  }
  return frames;
}
const outgoing = [[14, start], [34, landing], [52, [203, 1093]], [78, counter]];
const back = [[108, counter], [130, [243, 1171]], [153, landing], [173, start]];
const reachKs = transform(counter, [68, 68, 100], [115, reach.h - 4, 0]);
const carryKs = transform(counter, [68, 68, 100], [115, carry.h - 4, 0],
  keys([[91, 0], [100, 100], [107, 100], [112, 0]]));
const movingCup = [
  [0, tray], [89, tray], [97, [414, 1207]], [103, [392, 1223]], [108, [392, 1223]],
  [115, [316, 1224]], [130, [215, 1075]], [153, [127, 956]], [174, saucer],
  [181, saucer], [192, [155, 887]], [200, cupTop],
  [223, cupTop], [230, [151, 887]], [242, saucer], [257, saucer],
];
const tilt = keys([[0, 0], [89, 0], [97, -9], [108, 0], [181, 0], [200, 12], [223, 12], [242, 0]]);
function raisedCupLayer() {
  const layer = fromTyping('typing drink 3', 200, 223);
  layer.refId = sip;
  return layer;
}
const service = composition('Pip notices, collects, returns, and sips', 257, [
  raisedCupLayer(),
  image(cup, 0, 201, cupKs(movingCup, 100, tilt), 'Cup follows Pip’s flipper'),
  image(cup, 223, 257, cupKs(movingCup, 100, tilt), 'Pip lowers cup to the sofa'),
  image('carry', 91, 112, carryKs, 'Pip retracts his flipper around the handle'),
  image('reach', 78, 100, { ...reachKs, o: keys([[78, 15], [82, 100], [92, 100], [100, 0]]) }, 'Pip reaches the tray'),
  ...stride(14, 80, outgoing, 1, keys([[14, 0], [25, 100]])),
  ...stride(108, 173, back, -1, keys([[108, 0], [112, 100], [160, 100], [173, 0]])),
  fromTyping('study cel 1', 0, 7),
  image('pip_reaction_look', 7, 14, transform(chair, [s * 100, s * 100, 100])),
  fromTyping('study cel 1', 14, 28, keys([[14, 100], [28, 0]])),
  fromTyping('study cel 1', 164, 200, keys([[164, 0], [174, 100]])),
  fromTyping('study cel 1', 223, 242),
  image('pip_reaction_smile', 242, 251, transform(chair, [s * 100, s * 100, 100])),
  fromTyping('study cel 1', 251, 257),
  image(laptop.id, 22, 172, transform(chair, [s * 100, s * 100, 100], [0, 0, 0], keys([[22, 0], [32, 100], [161, 100], [172, 0]]))),
  ellipse('Pip floor shadow', 24, 163, xy([...outgoing, ...back]), [110, 22], [0.30, 0.16, 0.29, 1], 20),
], [mugs.coffee, sipCels.coffee, ...walk, reach, carry, laptop, byId('asset_000'), byId('pip_reaction_look'), byId('pip_reaction_smile')]);

await fs.writeFile(path.join(folder, 'brew.json'), JSON.stringify(brew));
await fs.writeFile(path.join(folder, 'waiting.json'), JSON.stringify(waiting));
await fs.writeFile(path.join(folder, 'serve.json'), JSON.stringify(service));
await fs.writeFile(path.join(folder, 'drink-art.json'), JSON.stringify({ mugs, sipCels }));
