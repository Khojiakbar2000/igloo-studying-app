import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const dir = dirname(new URL(import.meta.url).pathname);
const sourceSvg = await readFile(join(dir, 'pip-layered.svg'), 'utf8');
const fragment = JSON.parse(await readFile(join(dir, 'pip-layered.scene.json'), 'utf8'));
const colorVariant = process.argv[2] || 'teal';
const partMap = {
  'scarf-back': 'ScarfBack',
  'foot-left': 'FootLeft',
  'foot-right': 'FootRight',
  body: 'BodyArt', belly: 'Belly',
  'flipper-left': 'FlipperLeft', 'flipper-right': 'FlipperRight',
  head: 'HeadShell', 'feather-tufts': 'FeatherTufts', face: 'Face',
  'eye-near': 'EyeNear', 'eye-far': 'EyeFar', eyelids: 'Eyelids', beak: 'Beak',
  'scarf-band': 'ScarfBand', 'scarf-tail': 'ScarfTail',
  laptop: 'Laptop', keyboard: 'Keyboard',
};

// Rive's SVG importer emits shape IDs in SVG painter order but flattens SVG <g>s.
// Reattach each imported vector shape to a named Rive transform group here.
const tokens = sourceSvg.match(/<\/?g\b[^>]*>|<(?:path|ellipse|circle|rect|polygon|polyline|line)\b[^>]*\/>/g) || [];
const stack = [];
const drawables = [];
for (const token of tokens) {
  if (token.startsWith('</g')) stack.pop();
  else if (token.startsWith('<g')) stack.push(token.match(/id="([^"]+)"/)?.[1] || '');
  else drawables.push([...stack].reverse().find((id) => partMap[id]) || '');
}
if (drawables.length !== fragment.shapes.length) {
  throw new Error(`SVG has ${drawables.length} paths, importer returned ${fragment.shapes.length}`);
}

const root = { id: 'PipRoot', x: 0, y: 0 };
const defs = [
  ['BodyRig', 'PipRoot', [560, 980]],
  ['ScarfBack', 'BodyRig', [205, 835]],
  ['FootLeft', 'BodyRig', [515, 1235]],
  ['FootRight', 'BodyRig', [795, 1235]],
  ['BodyArt', 'BodyRig', [560, 980]],
  ['Belly', 'BodyRig', [560, 980]],
  ['FlipperLeft', 'BodyRig', [389, 857]],
  ['FlipperRight', 'BodyRig', [721, 850]],
  ['HeadPivot', 'BodyRig', [508, 684]],
  ['HeadShell', 'HeadPivot', [508, 684]],
  ['FeatherTufts', 'HeadPivot', [508, 684]],
  ['Face', 'HeadPivot', [508, 684]],
  ['Eyes', 'HeadPivot', [508, 684]],
  ['EyeNear', 'Eyes', [493, 522]],
  ['EyeFar', 'Eyes', [716, 539]],
  ['Eyelids', 'HeadPivot', [508, 684]],
  ['Beak', 'HeadPivot', [680, 600]],
  ['Scarf', 'BodyRig', [450, 734]],
  ['ScarfBand', 'Scarf', [450, 734]],
  ['ScarfTail', 'Scarf', [455, 874]],
  ['Laptop', 'PipRoot', [0, 0]],
  ['Keyboard', 'Laptop', [0, 0]],
];
const groups = [root];
const world = new Map([[root.id, [0, 0]]]);
for (const [id, parent, p] of defs) {
  const pw = world.get(parent);
  if (!pw) throw new Error(`Unknown parent group ${parent} for ${id}`);
  groups.push({ id, parent, x: p[0] - pw[0], y: p[1] - pw[1] });
  world.set(id, p);
}

const counts = new Map();
const shapes = fragment.shapes.map((input, index) => {
  const group = partMap[drawables[index]];
  if (!group) throw new Error(`No Rive group for SVG group ${drawables[index]}`);
  const pivot = world.get(group);
  const n = counts.get(group) || 0;
  counts.set(group, n + 1);
  const shape = { ...input, id: `${group}_${String(n + 1).padStart(2, '0')}`, parent: group, x: input.x - pivot[0], y: input.y - pivot[1] };
  shape.fill = recolor(shape.fill, group, colorVariant);
  shape.stroke = recolorStroke(shape.stroke, group, colorVariant);
  return shape;
});

const idle = {
  name: 'idle', fps: 60, duration: 480, loop: 'loop', tracks: [
    track('BodyRig', 'y', [[0, 980], [120, 968, 'ease-in-out'], [240, 980, 'ease-in-out'], [360, 968, 'ease-in-out'], [480, 980, 'ease-in-out']]),
    track('HeadPivot', 'rotation', [[0, 0], [100, 1.25, 'ease-in-out'], [220, -0.6, 'ease-in-out'], [360, 0.35, 'ease-in-out'], [480, 0]]),
    track('Eyes', 'x', [[0, 0], [95, 3, 'ease-in-out'], [215, 0, 'ease-in-out'], [480, 0]]),
    track('Eyes', 'y', [[0, 0], [95, 4, 'ease-in-out'], [215, 0, 'ease-in-out'], [480, 0]]),
    track('ScarfTail', 'rotation', [[0, 0], [110, 1.5, 'ease-in-out'], [220, 0.2, 'ease-in-out'], [350, -1.2, 'ease-in-out'], [480, 0]]),
    track('Eyelids', 'opacity', [[0, 0], [119, 0], [122, 1], [125, 1], [129, 0], [360, 0], [363, 1], [366, 1], [370, 0], [480, 0]]),
  ],
};
const studying = {
  name: 'studying', fps: 60, duration: 360, loop: 'loop', tracks: [
    track('BodyRig', 'y', [[0, 980], [90, 972, 'ease-in-out'], [180, 980, 'ease-in-out'], [270, 972, 'ease-in-out'], [360, 980, 'ease-in-out']]),
    track('HeadPivot', 'rotation', [[0, 0], [75, 0.8, 'ease-in-out'], [170, 0, 'ease-in-out'], [255, -0.65, 'ease-in-out'], [360, 0]]),
    track('Eyes', 'x', [[0, 0], [82, 4, 'ease-in-out'], [170, 0, 'ease-in-out'], [360, 0]]),
    track('Eyes', 'y', [[0, 0], [82, 5, 'ease-in-out'], [170, 0, 'ease-in-out'], [360, 0]]),
    track('FlipperLeft', 'rotation', [[0, 0], [12, -2.5, 'ease-out'], [21, 2, 'ease-in-out'], [33, 0, 'ease-in-out'], [68, -2, 'ease-out'], [78, 2.3, 'ease-in-out'], [92, 0], [140, -2.6, 'ease-out'], [151, 1.8, 'ease-in-out'], [164, 0], [220, -2, 'ease-out'], [232, 2.2, 'ease-in-out'], [245, 0], [300, -2.5, 'ease-out'], [312, 1.8, 'ease-in-out'], [325, 0], [360, 0]]),
    track('FlipperRight', 'rotation', [[0, 0], [18, 2.2, 'ease-out'], [29, -1.6, 'ease-in-out'], [40, 0], [75, 1.8, 'ease-out'], [87, -2.1, 'ease-in-out'], [98, 0], [145, 2.4, 'ease-out'], [158, -1.9, 'ease-in-out'], [170, 0], [225, 2, 'ease-out'], [238, -1.8, 'ease-in-out'], [250, 0], [305, 2.3, 'ease-out'], [318, -1.8, 'ease-in-out'], [330, 0], [360, 0]]),
    track('ScarfTail', 'rotation', [[0, 0], [85, 0.9, 'ease-in-out'], [175, 0, 'ease-in-out'], [270, -0.7, 'ease-in-out'], [360, 0]]),
    track('Eyelids', 'opacity', [[0, 0], [83, 0], [86, 1], [89, 1], [93, 0], [260, 0], [263, 1], [266, 1], [270, 0], [360, 0]]),
  ],
};
const celebrate = {
  name: 'celebrate', fps: 60, duration: 96, loop: 'oneShot', tracks: [
    track('PipRoot', 'y', [[0, 0], [8, 0], [18, -60, 'ease-out'], [35, -66, 'ease-in-out'], [50, -42, 'ease-in'], [59, 0, 'ease-out'], [80, 0, 'ease-in-out'], [96, 0]]),
    track('BodyRig', 'scaleY', [[0, 1], [10, 0.97, 'ease-in'], [23, 1.02, 'ease-out'], [45, 1, 'ease-in-out'], [56, 0.92, 'ease-out'], [66, 1.02, 'ease-out'], [96, 1]]),
    track('BodyRig', 'scaleX', [[0, 1], [10, 1.02, 'ease-in'], [23, 0.99, 'ease-out'], [45, 1, 'ease-in-out'], [56, 1.04, 'ease-out'], [66, 0.99, 'ease-out'], [96, 1]]),
    track('FlipperLeft', 'rotation', [[0, 0], [17, -3, 'ease-out'], [35, 8, 'ease-out'], [52, -5, 'ease-in-out'], [72, 2, 'ease-out'], [96, 0]]),
    track('FlipperRight', 'rotation', [[0, 0], [17, 3, 'ease-out'], [35, -8, 'ease-out'], [52, 5, 'ease-in-out'], [72, -2, 'ease-out'], [96, 0]]),
    track('HeadPivot', 'rotation', [[0, 0], [22, -1, 'ease-out'], [39, 1.6, 'ease-in-out'], [57, -0.6, 'ease-out'], [78, 0.4, 'ease-in-out'], [96, 0]]),
    track('ScarfTail', 'rotation', [[0, 0], [35, -2.4, 'ease-out'], [53, 2, 'ease-in-out'], [74, -0.9, 'ease-out'], [96, 0]]),
    track('Beak', 'scaleY', [[0, 1], [22, 1.05, 'ease-out'], [48, 1, 'ease-in-out'], [96, 1]]),
  ],
};

const scene = {
  artboard: { name: 'Pip', width: 1176, height: 1337 },
  backgroundColor: '#EEF3F7',
  groups,
  shapes,
  animations: [idle, studying, celebrate],
  stateMachine: {
    name: 'PipModes',
    inputs: [{ name: 'studying', type: 'bool', value: false }, { name: 'celebrate', type: 'trigger' }],
    states: [
      { name: 'idle', animation: 'idle' },
      { name: 'studying', animation: 'studying' },
      { name: 'celebrating', animation: 'celebrate' },
    ],
    transitions: [
      { from: 'entry', to: 'idle' },
      { from: 'idle', to: 'studying', condition: { input: 'studying', value: true } },
      { from: 'studying', to: 'idle', condition: { input: 'studying', value: false } },
      { from: 'any', to: 'celebrating', condition: { input: 'celebrate' } },
      { from: 'celebrating', to: 'idle', exitTimeMs: 1600 },
    ],
  },
};

await writeFile(join(dir, `pip-rig-${colorVariant}.scene.json`), JSON.stringify(scene, null, 2));
console.log(`Wrote ${shapes.length} named vector shapes under ${groups.length} transform groups (${colorVariant} scarf)`);

function track(target, property, frames) {
  return { target, property, keyframes: frames.map(([frame, value, easing]) => ({ frame, value, ...(easing ? { easing } : {}) })) };
}

function recolor(fill, group, variant) {
  if (!fill || !['ScarfBack', 'ScarfBand', 'ScarfTail'].includes(group) || variant === 'teal') return fill;
  const colors = { '#8bb6b3': '#e4a3b3', '#689495': '#c9788f', '#41696f': '#8c4b62' };
  if (fill.gradient?.stops) fill.gradient.stops = fill.gradient.stops.map((s) => ({ ...s, color: colors[s.color.toLowerCase()] || s.color }));
  if (fill.color) fill.color = colors[fill.color.toLowerCase()] || fill.color;
  return fill;
}

function recolorStroke(stroke, group, variant) {
  if (!stroke || !['ScarfBack', 'ScarfBand', 'ScarfTail'].includes(group) || variant === 'teal') return stroke;
  const colors = {
    '#b7d2c8': '#f1c6ce', '#3c656d': '#7b4059', '#9fc1ba': '#d996a7',
    '#d0ded2': '#f4cbd1', '#bad3ca': '#f1c6ce', '#3d6970': '#7b4059',
    '#a8c7c0': '#d996a7', '#d4e1d6': '#f4cbd1', '#c2d6cc': '#f1c6ce', '#375b65': '#7b4059',
  };
  stroke.color = colors[stroke.color.toLowerCase()] || stroke.color;
  return stroke;
}
