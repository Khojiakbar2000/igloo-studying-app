import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const ids = ['winter-explorer', 'wizard', 'royal', 'scholar'];
const actions = ['idle', 'wave', 'shiver', 'celebrate'];
const size = 720;
const center = { x: 360, y: 610 };
const controllerAnchors = {
  body: { x: 360, y: 330 },
};

async function boundsOf(file, threshold = 1) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > threshold) {
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) throw new Error(`No visible pixels in ${file}`);
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function components(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const seen = new Uint8Array(info.width * info.height);
  const queue = new Int32Array(seen.length);
  const output = [];
  for (let i = 0; i < seen.length; i++) {
    if (seen[i] || data[i * 4 + 3] < 16) continue;
    let head = 0, tail = 0, left = info.width, top = info.height, right = 0, bottom = 0;
    seen[i] = 1; queue[tail++] = i;
    while (head < tail) {
      const p = queue[head++], x = p % info.width, y = Math.floor(p / info.width);
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      for (let yy = Math.max(0, y - 1); yy <= Math.min(info.height - 1, y + 1); yy++) {
        for (let xx = Math.max(0, x - 1); xx <= Math.min(info.width - 1, x + 1); xx++) {
          const j = yy * info.width + xx;
          if (!seen[j] && data[j * 4 + 3] >= 16) { seen[j] = 1; queue[tail++] = j; }
        }
      }
    }
    if (tail > 20) output.push({ area: tail, bbox: { left, top, width: right - left + 1, height: bottom - top + 1 } });
  }
  return output.sort((a, b) => a.bbox.left - b.bbox.left);
}

async function mapLayer(source, fileName, transform, outputDir) {
  const raw = await sharp(source).resize({ width: Math.round(1254 * transform.scale), height: Math.round(1254 * transform.scale) }).png().toBuffer();
  const left = Math.round(transform.left), top = Math.round(transform.top);
  const canvas = await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: raw, left, top }]).png().toBuffer();
  const bounds = await boundsOf(canvas);
  const png = await sharp(canvas).extract(bounds).png().toBuffer();
  const file = path.join(outputDir, `${fileName}.png`);
  await fs.writeFile(file, png);
  return { file, png, bounds };
}

for (const id of ids) {
  const dir = path.join(root, 'assets/wardrobe/costumes', id);
  const source = path.join(dir, 'source/complete.png');
  const sourceBounds = await boundsOf(source, 10);
  const scale = 534 / sourceBounds.height;
  const transform = {
    scale,
    left: 360 - ((sourceBounds.left + sourceBounds.width / 2) * scale),
    top: 80 - sourceBounds.top * scale,
  };
  const complete = await mapLayer(source, 'complete-fitted', transform, path.join(dir, 'layers'));
  const layerSources = {
    body: path.join(dir, 'layers/source/body.png'),
    flippers: path.join(dir, 'layers/source/flippers-v2.png'),
    feet: path.join(dir, 'layers/source/feet.png'),
  };
  const fitted = {};
  for (const [name, file] of Object.entries(layerSources)) fitted[name] = await mapLayer(file, name, transform, path.join(dir, 'layers'));
  const arms = await components(fitted.flippers.file);
  const feet = await components(fitted.feet.file);
  if (arms.length !== 2 || feet.length !== 2) throw new Error(`${id}: expected two flippers and feet, got ${arms.length}/${feet.length}`);
  const addOffset = (box, offset) => ({ ...box, left: box.left + offset.left, top: box.top + offset.top });
  const leftArm = addOffset(arms[0].bbox, fitted.flippers.bounds), rightArm = addOffset(arms[1].bbox, fitted.flippers.bounds);
  const leftFoot = addOffset(feet[0].bbox, fitted.feet.bounds), rightFoot = addOffset(feet[1].bbox, fitted.feet.bounds);
  const splitComponent = async (input, bbox, offset, name) => {
    const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const mask = Buffer.alloc(info.width * info.height, 0);
    const queue = new Int32Array(mask.length);
    let head = 0, tail = 0;
    const start = (bbox.top + Math.floor(bbox.height / 2)) * info.width + bbox.left + Math.floor(bbox.width / 2);
    mask[start] = 1; queue[tail++] = start;
    while (head < tail) {
      const p = queue[head++], x = p % info.width, y = Math.floor(p / info.width);
      for (let yy = Math.max(0, y - 1); yy <= Math.min(info.height - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(info.width - 1, x + 1); xx++) {
        const j = yy * info.width + xx;
        if (!mask[j] && data[j * 4 + 3] >= 16) { mask[j] = 1; queue[tail++] = j; }
      }
    }
    const isolated = Buffer.from(data);
    for (let i = 0; i < mask.length; i++) if (!mask[i]) isolated[i * 4 + 3] = 0;
    const canvas = await sharp(isolated, { raw: info }).png().toBuffer();
    const croppedBounds = await boundsOf(canvas);
    const png = await sharp(canvas).extract(croppedBounds).png().toBuffer();
    const result = { file: path.join(dir, 'layers', `${name}.png`), png, bounds: addOffset(croppedBounds, offset) };
    await fs.writeFile(result.file, png);
    return result;
  };
  const armsLayer = fitted.flippers.file, feetLayer = fitted.feet.file;
  fitted.leftArm = await splitComponent(armsLayer, arms[0].bbox, fitted.flippers.bounds, 'left-flipper');
  fitted.rightArm = await splitComponent(armsLayer, arms[1].bbox, fitted.flippers.bounds, 'right-flipper');
  fitted.leftFoot = await splitComponent(feetLayer, feet[0].bbox, fitted.feet.bounds, 'left-foot');
  fitted.rightFoot = await splitComponent(feetLayer, feet[1].bbox, fitted.feet.bounds, 'right-foot');

  const anchors = {
    body: controllerAnchors.body,
    leftArm: { x: leftArm.left + leftArm.width * 0.84, y: leftArm.top + leftArm.height * 0.57 },
    rightArm: { x: rightArm.left + rightArm.width * 0.16, y: rightArm.top + rightArm.height * 0.57 },
    leftFoot: { x: leftFoot.left + leftFoot.width * 0.84, y: leftFoot.top + leftFoot.height * 0.14 },
    rightFoot: { x: rightFoot.left + rightFoot.width * 0.16, y: rightFoot.top + rightFoot.height * 0.14 },
  };

  const visual = await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: fitted.body.png, left: fitted.body.bounds.left, top: fitted.body.bounds.top },
      { input: fitted.leftFoot.png, left: fitted.leftFoot.bounds.left, top: fitted.leftFoot.bounds.top },
      { input: fitted.rightFoot.png, left: fitted.rightFoot.bounds.left, top: fitted.rightFoot.bounds.top },
      { input: fitted.leftArm.png, left: fitted.leftArm.bounds.left, top: fitted.leftArm.bounds.top },
      { input: fitted.rightArm.png, left: fitted.rightArm.bounds.left, top: fitted.rightArm.bounds.top },
    ]).png().toBuffer();
  await fs.writeFile(path.join(dir, 'layers/recomposed.png'), visual);
  const comparison = await sharp({ create: { width: size * 2, height: size, channels: 4, background: { r: 247, g: 243, b: 233, alpha: 1 } } })
    .composite([{ input: complete.png, left: complete.bounds.left, top: complete.bounds.top }, { input: visual, left: size, top: 0 }])
    .png().toBuffer();
  await fs.writeFile(path.join(dir, 'layers/complete-vs-recomposed.png'), comparison);

  const outputDir = path.join(dir, 'lottie');
  await fs.mkdir(outputDir, { recursive: true });
  const byName = { body: 'body', leftArm: 'leftArm', rightArm: 'rightArm', leftFoot: 'leftFoot', rightFoot: 'rightFoot' };
  for (const action of actions) {
    const data = JSON.parse(await fs.readFile(path.join(root, `assets/wardrobe/lottie/${action}.json`), 'utf8'));
    for (const layer of data.layers.filter(item => item.ty === 2 && byName[item.nm])) {
      const mapped = fitted[layer.nm];
      const originalBounds = mapped.bounds;
      const anchor = anchors[layer.nm];
      const localAnchor = [anchor.x - originalBounds.left, anchor.y - originalBounds.top];
      layer.ks.a = { a: 0, k: localAnchor };
      layer.ks.p = { a: 0, k: [anchor.x - center.x, anchor.y - center.y] };
      const asset = data.assets.find(item => item.id === layer.refId);
      const metadata = await sharp(mapped.png).metadata();
      asset.w = metadata.width;
      asset.h = metadata.height;
      asset.u = '';
      asset.p = `data:image/png;base64,${mapped.png.toString('base64')}`;
      asset.e = 1;
    }
    await fs.writeFile(path.join(outputDir, `${action}.json`), `${JSON.stringify(data)}\n`);
  }
  const thumb = await sharp(source).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 158, height: 204, fit: 'inside' }).png().toBuffer();
  await sharp({ create: { width: 300, height: 220, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: thumb, gravity: 'center' }]).png().toFile(path.join(root, `assets/wardrobe/items/${id}-thumb.png`));
  console.log(JSON.stringify({ id, sourceBounds, scale, transform, armBboxes: [leftArm, rightArm], footBboxes: [leftFoot, rightFoot], anchors }));
}
