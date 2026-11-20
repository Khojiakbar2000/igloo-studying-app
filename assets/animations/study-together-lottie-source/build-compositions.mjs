import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { addPipReactions } from './add-pip-reactions.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(ROOT, 'study-together-lottie-source');
const OUTPUT = path.join(ROOT, 'study-together-lottie');
const ARTBOARD = { width: 430, height: 541 };
const CEL_INDEXES = [0, 4, 6, 8, 11, 13, 15, 17, 20, 24, 26, 28, 31, 33, 35, 38];
const STUDY_CELS = [4, 2, 2, 3, 2, 2, 2, 3, 4, 2, 2, 3, 2, 2, 3, 4];
const ACTIONS = {
  drink: { durationMs: 520, sequence: [0, 1, 2, 3] },
  bored: { durationMs: 430, sequence: [0, 1, 2, 3] },
  stretch: { durationMs: 460, sequence: [0, 1, 2, 3] },
  wave: { durationMs: 340, sequence: [0, 1, 2, 1, 2, 3] },
  break: { durationMs: 520, sequence: [0, 1, 2, 3], hold: true, wake: [3, 2, 1, 0] },
  yawn: { durationMs: 390, sequence: [0, 1, 2, 1, 3] },
  celebrate: { durationMs: 400, sequence: [0, 1, 2, 1, 3] },
};
const ACTORS = [
  { id: 'typing', label: 'Pip typing on the MacBook', folder: 'pip-sofa-study', prefix: 'pip-typing', fps: 12, target: 'pip-sofa-study/frames/pip-typing_00.png' },
  { id: 'reading', label: 'Pip reading a book', folder: 'study-together-reading', prefix: 'pip-reading', fps: 10, target: 'study-together-reading/frames/pip-reading_00.png' },
  { id: 'writing', label: 'Pip writing in a notebook', folder: 'study-together-writing', prefix: 'pip-writing', fps: 12, target: 'study-together-writing/frames/pip-writing_00.png' },
  { id: 'headphones', label: 'Pip studying on a tablet with headphones', folder: 'study-together-headphones', prefix: 'pip-headphones', fps: 9, target: 'study-together-headphones/frames/pip-headphones_00.png' },
];

async function rgba(file) {
  return sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

function alphaBounds(data, width, height, threshold = 28) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > threshold) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  return right < left ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
}

// Generated sheets have uneven row spacing. These boundaries follow the
// transparent valleys between complete poses, rather than slicing feet off.
const SHEET_ROWS = {
  coffee: [0, 317, 631, 942, 1230],
  bored: [0, 311, 625, 938, 1254],
  stretch: [0, 332, 685, 1041, 1402],
  wave: [0, 348, 691, 1038, 1402],
  break: [0, 347, 680, 988, 1263],
  yawn: [0, 324, 649, 976, 1312],
  celebrate: [0, 334, 674, 995, 1337],
};
async function cropCell(sheetPath, col, row) {
  const metadata = await sharp(sheetPath).metadata();
  const left = Math.floor(col * metadata.width / 4);
  const rows = SHEET_ROWS[path.basename(path.dirname(sheetPath))];
  const top = rows[row];
  const width = Math.floor((col + 1) * metadata.width / 4) - left;
  const height = rows[row + 1] - top;
  const cell = await sharp(sheetPath).extract({ left, top, width, height }).ensureAlpha().png().toBuffer();
  const raw = await sharp(cell).raw().toBuffer({ resolveWithObject: true });
  const bounds = alphaBounds(raw.data, raw.info.width, raw.info.height);
  if (!bounds) throw new Error(`No visible character in ${path.basename(sheetPath)} cell ${col},${row}`);
  const margin = 3;
  const x = Math.max(0, bounds.left - margin);
  const y = Math.max(0, bounds.top - margin);
  const w = Math.min(raw.info.width - x, bounds.width + margin * 2);
  const h = Math.min(raw.info.height - y, bounds.height + margin * 2);
  return sharp(cell).extract({ left: x, top: y, width: w, height: h }).png().toBuffer();
}

// Measure the solid head silhouette, excluding hands, props and raised flippers.
// Full-pose bounds are not a stable anatomical scale reference.
async function headRegistration(input) {
  const { data, info } = await rgba(input);
  const box = alphaBounds(data, info.width, info.height);
  let best = { width: 0, center: 0 };
  for (let y = Math.round(box.top + box.height * 0.18); y <= box.top + box.height * 0.43; y++) {
    let start = -1;
    for (let x = 0; x <= info.width; x++) {
      const solid = x < info.width && data[(y * info.width + x) * 4 + 3] > 180;
      if (solid && start < 0) start = x;
      if (!solid && start >= 0) {
        if (x - start > best.width) best = { width: x - start, center: (start + x) / 2 };
        start = -1;
      }
    }
  }
  if (!best.width) throw new Error('Cannot locate character head');
  return best;
}

async function normalizeActions(actor, targetBox, actorIndex) {
  const referenceHead = await headRegistration(path.join(ROOT, actor.target));
  const all = {};
  for (const action of Object.keys(ACTIONS)) {
    const sheet = path.join(SOURCE, action === 'drink' ? 'coffee' : action, 'pose-sheet.png');
    all[action] = [];
    for (let row = 0; row < 4; row++) {
      all[action].push(await cropCell(sheet, actorIndex, row));
    }
  }

  const actionSizes = {};
  for (const [action, buffers] of Object.entries(all)) {
    actionSizes[action] = [];
    for (const buffer of buffers) {
      const meta = await sharp(buffer).metadata();
      actionSizes[action].push({ width: meta.width, height: meta.height });
    }
  }

  const actionPaths = {};
  for (const [action, buffers] of Object.entries(all)) {
    actionPaths[action] = [];
    for (let row = 0; row < buffers.length; row++) {
      const size = actionSizes[action][row];
      const head = await headRegistration(buffers[row]);
      const scale = referenceHead.width / head.width;
      const width = Math.max(1, Math.round(size.width * scale));
      const height = Math.max(1, Math.round(size.height * scale));
      const left = Math.round(referenceHead.center - head.center * scale);
      const top = Math.max(0, Math.round(targetBox.top + targetBox.height - height));
      const canvas = Buffer.from(await sharp({ create: { width: ARTBOARD.width, height: ARTBOARD.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer());
      const file = path.join(OUTPUT, 'images', actor.id, `${action}-${String(row).padStart(2, '0')}.png`);
      await fs.mkdir(path.dirname(file), { recursive: true });
      const resized = await sharp(buffers[row]).resize(width, height, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
      const clipLeft = Math.max(0, -left);
      const visible = await sharp(resized).extract({ left: clipLeft, top: 0, width: Math.min(width - clipLeft, ARTBOARD.width - Math.max(0, left)), height: Math.min(height, ARTBOARD.height - top) }).png().toBuffer();
      await sharp(canvas).composite([{ input: visible, left: Math.max(0, left), top }]).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(file);
      actionPaths[action].push(file);
    }
  }
  return { actionPaths };
}

function opacityKeys(start, end, from = 100, to = 0) {
  return { a: 1, k: [
    { t: start, s: [from], e: [to], o: { x: 0.333, y: 0 }, i: { x: 0.667, y: 1 }, h: 0 },
    { t: end, s: [to] },
  ] };
}

function layer(assetId, name, start, end, asset, opacity = 100) {
  return {
    ddd: 0, ind: 0, ty: 2, nm: name, refId: assetId, sr: 1,
    ks: {
      o: typeof opacity === 'number' ? { a: 0, k: opacity } : opacity,
      // All cels retain the full, shared artboard. This keeps the feet and body
      // on the same coordinates across the original study cels and generated poses.
      r: { a: 0, k: 0 }, p: { a: 0, k: [ARTBOARD.width / 2, ARTBOARD.height / 2, 0] },
      a: { a: 0, k: [ARTBOARD.width / 2, ARTBOARD.height / 2, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    ao: 0, ip: start, op: end, st: 0, bm: 0,
  };
}

async function buildActor(actor) {
  const activityDir = path.join(ROOT, actor.folder);
  const studyPaths = CEL_INDEXES.map(index => path.join(activityDir, 'exports', `${actor.prefix}_${String(index).padStart(3, '0')}.png`));
  const target = await rgba(path.join(ROOT, actor.target));
  const targetBox = alphaBounds(target.data, target.info.width, target.info.height);
  const { actionPaths, scale } = await normalizeActions(actor, targetBox, ACTORS.indexOf(actor));
  const assetFiles = [...studyPaths, ...Object.values(actionPaths).flat()];
  const assetIds = new Map();
  const assetById = new Map();
  const assets = [];
  for (const file of assetFiles) {
    if (assetIds.has(file)) continue;
    const id = `asset_${String(assets.length).padStart(3, '0')}`;
    const dimensions = await sharp(file).metadata();
    if (dimensions.width !== ARTBOARD.width || dimensions.height !== ARTBOARD.height) {
      throw new Error(`Lottie cel has an unexpected canvas size: ${file} (${dimensions.width}x${dimensions.height})`);
    }
    const image = await sharp(file).png({ palette: true, colors: 256, dither: 0.8, compressionLevel: 9 }).toBuffer();
    const asset = { id, w: ARTBOARD.width, h: ARTBOARD.height, p: `data:image/png;base64,${image.toString('base64')}` };
    assetIds.set(file, id);
    assetById.set(id, asset);
    assets.push({ id, w: asset.w, h: asset.h, u: '', p: asset.p, e: 1 });
  }

  let cursor = 0;
  const layers = [];
  const markers = [];
  const segments = { study: [0, 0], actions: {}, wake: null };
  const studyRanges = [];
  for (let index = 0; index < studyPaths.length; index++) {
    const duration = Math.max(1, Math.round(STUDY_CELS[index] * 30 / actor.fps));
    const start = cursor;
    const end = start + duration;
    studyRanges.push([start, end]);
    const assetId = assetIds.get(studyPaths[index]);
    layers.push(layer(assetId, `${actor.id} study cel ${index + 1}`, start, end, assetById.get(assetId)));
    cursor = end;
  }
  const studyEnd = cursor;
  segments.study = [0, studyEnd];
  markers.push({ tm: 0, cm: 'study', dr: studyEnd });

  for (const [action, config] of Object.entries(ACTIONS)) {
    const start = cursor;
    const sequence = config.sequence;
    let row3Start = -1;
    for (let position = 0; position < sequence.length; position++) {
      const row = sequence[position];
      const duration = Math.max(1, Math.round(config.durationMs * 30 / 1000));
      const frameStart = cursor;
      const frameEnd = cursor + duration;
      if (row === 3) row3Start = frameStart;
      const assetId = assetIds.get(actionPaths[action][row]);
      layers.push(layer(assetId, `${actor.id} ${action} ${position + 1}`, frameStart, frameEnd, assetById.get(assetId)));
      cursor = frameEnd;
    }
    // Soften the final return pose into the exact first approved study cel.
    const fadeFrames = Math.min(6, cursor - row3Start);
    if (row3Start >= 0 && fadeFrames > 0 && action !== 'break') {
      const transitionStart = cursor - fadeFrames;
      layers[layers.length - 1].ks.o = opacityKeys(transitionStart, cursor, 100, 0);
      const assetId = assetIds.get(studyPaths[0]);
      layers.push(layer(assetId, `${actor.id} ${action} return to study`, transitionStart, cursor, assetById.get(assetId), opacityKeys(transitionStart, cursor, 0, 100)));
    }
    segments.actions[action] = [start, cursor];
    markers.push({ tm: start, cm: action, dr: cursor - start });
  }

  const wakeStart = cursor;
  for (const row of ACTIONS.break.wake) {
    const duration = Math.max(1, Math.round(300 * 30 / 1000));
    const frameStart = cursor;
    const frameEnd = cursor + duration;
    const assetId = assetIds.get(actionPaths.break[row]);
    layers.push(layer(assetId, `${actor.id} wake ${row}`, frameStart, frameEnd, assetById.get(assetId)));
    cursor = frameEnd;
  }
  const wakeFadeStart = cursor - 6;
  layers[layers.length - 1].ks.o = opacityKeys(wakeFadeStart, cursor, 100, 0);
  const wakeStudyAsset = assetIds.get(studyPaths[0]);
  layers.push(layer(wakeStudyAsset, `${actor.id} wake to study`, wakeFadeStart, cursor, assetById.get(wakeStudyAsset), opacityKeys(wakeFadeStart, cursor, 0, 100)));
  segments.wake = [wakeStart, cursor];
  markers.push({ tm: wakeStart, cm: 'wake', dr: cursor - wakeStart });

  for (const entry of layers) entry.ind = layers.indexOf(entry) + 1;
  const composition = {
    v: '5.12.2', fr: 30, ip: 0, op: cursor, w: ARTBOARD.width, h: ARTBOARD.height,
    nm: `Study Together / ${actor.id} / study + actions`, ddd: 0, assets, layers, markers,
  };
  if (actor.id === 'typing') await addPipReactions(composition, segments, OUTPUT);
  const outDir = path.join(OUTPUT, 'lottie');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, `${actor.id}.json`), JSON.stringify(composition));
  await fs.writeFile(path.join(outDir, `${actor.id}.segments.json`), JSON.stringify({ fps: 30, segments, actionLabels: Object.keys(ACTIONS) }, null, 2));
  console.log(`${actor.id}: ${assets.length} image assets, ${layers.length} layers, ${composition.op} frames; action poses registered to approved head width and seated baseline`);
  return { actor: actor.id, fps: 30, segments, compositionFrames: composition.op, assets: assets.length };
}

await fs.mkdir(OUTPUT, { recursive: true });
const manifest = [];
for (const actor of ACTORS) manifest.push(await buildActor(actor));
await fs.writeFile(path.join(OUTPUT, 'manifest.json'), JSON.stringify({ runtime: 'lottie-react-native', sourceCels: 'Existing approved Synfig exports; preserved as source backups', actionArtwork: 'ImageGen complete-character 4x4 sheets, one column per study activity', artboard: ARTBOARD, animations: manifest }, null, 2));
