import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(dir, '../../../..');
const outDir = path.join(dir, 'layers');
const targetDir = path.join(dir, 'lottie');
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(targetDir, { recursive: true });

// These four images were generated against one identical 1254px canvas.
// A single affine fit aligns the new skin to the approved standing Pip's
// measured 720x720 composition bounds.
const sourceSize = 1254;
const scale = 533 / (1081 - 130);
const left = 208 - 346 * scale;
const top = 80 - 130 * scale;
const outputSize = 720;

async function alphaComponents(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const seen = new Uint8Array(info.width * info.height);
  const queue = new Int32Array(info.width * info.height);
  const components = [];
  for (let i = 0; i < seen.length; i++) {
    if (seen[i] || data[i * 4 + 3] < 16) continue;
    let head = 0, tail = 0;
    let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
    seen[i] = 1;
    queue[tail++] = i;
    while (head < tail) {
      const p = queue[head++], x = p % info.width, y = (p / info.width) | 0;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      for (let yy = Math.max(0, y - 1); yy <= Math.min(info.height - 1, y + 1); yy++) {
        for (let xx = Math.max(0, x - 1); xx <= Math.min(info.width - 1, x + 1); xx++) {
          const j = yy * info.width + xx;
          if (!seen[j] && data[j * 4 + 3] >= 16) { seen[j] = 1; queue[tail++] = j; }
        }
      }
    }
    if (tail > 20) components.push({ area: tail, bbox: { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 } });
  }
  return components.sort((a, b) => b.area - a.area);
}

async function tightAlphaCrop(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    // Ignore single-alpha noise introduced by ImageGen during cutout cleanup;
    // it expands the texture bounds but contributes no visible pixels.
    if (data[(y * info.width + x) * 4 + 3] > 1) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error(`Empty alpha layer: ${file}`);
  const bounds = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  return { bounds, width: bounds.width, height: bounds.height, png: await sharp(file).extract(bounds).png().toBuffer() };
}

async function fitCanvas(input, name, crop) {
  let raw;
  if (crop) {
    const part = await sharp(input).extract(crop).png().toBuffer();
    raw = await sharp({ create: { width: sourceSize, height: sourceSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: part, left: crop.left, top: crop.top }]).png().toBuffer();
  } else {
    raw = await sharp(input).png().toBuffer();
  }
  const fitted = await sharp(raw).resize({ width: Math.round(sourceSize * scale), height: Math.round(sourceSize * scale) }).png().toBuffer();
  const placed = await sharp({ create: { width: outputSize, height: outputSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fitted, left: Math.round(left), top: Math.round(top) }]).png().toBuffer();
  const file = path.join(outDir, `${name}.png`);
  await fs.writeFile(file, placed);
  return file;
}

const bodyFile = await fitCanvas(path.join(dir, 'body-layer-source.png'), 'body');
const flippers = await alphaComponents(path.join(dir, 'flippers-pair-layer-source.png'));
const feet = await alphaComponents(path.join(dir, 'feet-pair-layer-source.png'));
if (flippers.length !== 2 || feet.length !== 2) throw new Error(`Expected exactly two flippers/feet, found ${flippers.length}/${feet.length}`);
const byX = items => items.sort((a, b) => a.bbox.left - b.bbox.left);
const flipperParts = byX(flippers), footParts = byX(feet);
const layerFiles = {
  body: bodyFile,
  leftArm: await fitCanvas(path.join(dir, 'flippers-pair-layer-source.png'), 'left-flipper', flipperParts[0].bbox),
  rightArm: await fitCanvas(path.join(dir, 'flippers-pair-layer-source.png'), 'right-flipper', flipperParts[1].bbox),
  leftFoot: await fitCanvas(path.join(dir, 'feet-pair-layer-source.png'), 'left-foot', footParts[0].bbox),
  rightFoot: await fitCanvas(path.join(dir, 'feet-pair-layer-source.png'), 'right-foot', footParts[1].bbox),
};
const croppedAssets = Object.fromEntries(await Promise.all(Object.entries(layerFiles).map(async ([key, file]) => [key, await tightAlphaCrop(file)])));
const layerNames = { rightFoot: 'rightFoot', leftFoot: 'leftFoot', rightArm: 'rightArm', leftArm: 'leftArm', body: 'body' };
const anchorByLayer = {
  rightFoot: [415, 578], leftFoot: [315, 578],
  rightArm: [470, 400], leftArm: [264, 400], body: [360, 330],
};
const actions = ['idle', 'wave', 'shiver', 'celebrate'];
for (const action of actions) {
  const sourcePath = path.join(root, 'assets/wardrobe/lottie', `${action}.json`);
  const data = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
  // The existing blink overlay is artwork-specific; retaining it would put the
  // original face over the new helmet. Keep the established body/limb motion.
  data.layers = data.layers.filter(layer => !(layer.ty === 2 && layer.refId === 'eyelids'));
  data.assets = data.assets.filter(asset => asset.id !== 'eyelids');
  for (const layer of data.layers.filter(layer => layer.ty === 2 && layerNames[layer.nm])) {
    const anchor = anchorByLayer[layer.nm];
    const cropped = croppedAssets[fileKeyForLayer(layer.nm)];
    layer.ks.a = { a: 0, k: [anchor[0] - cropped.bounds.left, anchor[1] - cropped.bounds.top] };
    const asset = data.assets.find(item => item.id === layer.refId);
    asset.w = cropped.width;
    asset.h = cropped.height;
    asset.u = '';
    asset.p = `data:image/png;base64,${cropped.png.toString('base64')}`;
    asset.e = 1;
  }
  await fs.writeFile(path.join(targetDir, `${action}.json`), `${JSON.stringify(data)}\n`);
}

function fileKeyForLayer(name) {
  return name === 'rightArm' ? 'rightArm' : name === 'leftArm' ? 'leftArm' : name;
}

const full = await fs.readFile(path.join(dir, 'complete-armored-pip.png'));
const original = await fs.readFile(path.join(root, 'assets/animations/pip/storybook/character/standing-fallback.png'));
const fullFitted = await sharp(full).resize({ width: Math.round(sourceSize * scale), height: Math.round(sourceSize * scale) })
  .png().toBuffer();
const fullComp = await sharp({ create: { width: outputSize, height: outputSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: fullFitted, left: Math.round(left), top: Math.round(top) }]).png().toBuffer();
await sharp({ create: { width: 1440, height: 720, channels: 4, background: { r: 245, g: 242, b: 232, alpha: 1 } } })
  .composite([
    { input: original, left: 0, top: 0 },
    { input: fullComp, left: 720, top: 0 },
  ]).png().toFile(path.join(dir, 'original-vs-complete-720.png'));

const body = await sharp(layerFiles.body).png().toBuffer();
let reconstructed = await sharp({ create: { width: 720, height: 720, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: body, left: 0, top: 0 }]).png().toBuffer();
for (const key of ['leftFoot', 'rightFoot', 'leftArm', 'rightArm']) reconstructed = await sharp(reconstructed).composite([{ input: await sharp(layerFiles[key]).png().toBuffer(), left: 0, top: 0 }]).png().toBuffer();
await sharp({ create: { width: 1440, height: 720, channels: 4, background: { r: 245, g: 242, b: 232, alpha: 1 } } })
  .composite([{ input: fullComp, left: 0, top: 0 }, { input: reconstructed, left: 720, top: 0 }])
  .png().toFile(path.join(dir, 'complete-vs-layered-720.png'));

console.log(JSON.stringify({ scale, offset: [Math.round(left), Math.round(top)], flipperComponents: flipperParts, footComponents: footParts, outputs: [...Object.values(layerFiles), ...actions.map(a => path.join(targetDir, `${a}.json`))] }, null, 2));
