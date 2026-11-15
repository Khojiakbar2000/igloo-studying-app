import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('assets/animations/pip-customization');
const studyFrames = Array.from({ length: 16 }, (_, index) => `assets/animations/pip-sofa-study/frames/pip-typing_${String(index).padStart(2, '0')}.png`);
const chairFrames = [
  ...Array.from({ length: 11 }, (_, index) => `assets/animations/pip-chair-performance/frames/pip-chair_${String(index).padStart(2, '0')}.png`),
  'assets/animations/pip-chair-performance/frames/pip-chair-contact-v2.png',
  'assets/animations/pip-chair-performance/frames/pip-chair-settle-v2.png',
  'assets/animations/pip-chair-performance/frames/pip-chair-rest-v2.png',
];

const scarfColors = {
  teal: { h: 177, s: 0.44 },
  berry: { h: 345, s: 0.46 },
  lilac: { h: 267, s: 0.43 },
};

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}

function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  const match = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return match.map((channel) => Math.round((channel + m) * 255));
}

async function recolorScarf(source, output, palette) {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const target = Buffer.from(data);
  const color = scarfColors[palette];
  for (let i = 0; i < data.length; i += info.channels) {
    const [h, s, v] = rgbToHsv(data[i], data[i + 1], data[i + 2]);
    // Pip's knitted scarf is the only cool cyan/teal material in these character frames.
    if (data[i + 3] > 0 && h >= 145 && h <= 205 && s > 0.10 && v > 0.10) {
      const [r, g, b] = hsvToRgb(color.h, Math.min(0.82, Math.max(color.s, s * 0.78)), v);
      target[i] = r; target[i + 1] = g; target[i + 2] = b;
    }
  }
  await sharp(target, { raw: info }).png().toFile(output);
}

async function buildTintSets(frames, outDir) {
  await fs.mkdir(outDir, { recursive: true });
  for (const [color, config] of Object.entries(scarfColors)) {
    const colorDir = path.join(outDir, color);
    await fs.mkdir(colorDir, { recursive: true });
    for (let i = 0; i < frames.length; i += 1) {
      const name = `frame-${String(i).padStart(2, '0')}.png`;
      if (color === 'teal') await fs.copyFile(frames[i], path.join(colorDir, name));
      else await recolorScarf(frames[i], path.join(colorDir, name), color);
    }
  }
}

async function extractAccessory(atlas, output, canvas, placement) {
  const meta = await sharp(atlas).metadata();
  const cellWidth = Math.floor(meta.width / 4);
  const cellHeight = Math.floor(meta.height / 4);
  const tile = await sharp(atlas).extract({ left: 0, top: 0, width: cellWidth, height: cellHeight }).png().toBuffer();
  const object = await sharp(tile).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 }).resize(placement.width, placement.height, { fit: 'contain' }).png().toBuffer();
  const overlay = await sharp({ create: { width: canvas.width, height: canvas.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: object, left: placement.left, top: placement.top }]).png().toBuffer();
  await fs.mkdir(path.dirname(output), { recursive: true });
  await sharp(overlay).png().toFile(output);
}

async function buildSynchronizedAccessories(atlas, accessory, style, canvas, placement, count) {
  const outDir = path.join(root, style, accessory);
  await fs.mkdir(outDir, { recursive: true });
  const aligned = path.join(outDir, 'aligned.png');
  await extractAccessory(atlas, aligned, canvas, placement);
  // Keep a fixed-dimension cel alongside every character cel. Playback uses the exact same frame index.
  for (let i = 0; i < count; i += 1) await fs.copyFile(aligned, path.join(outDir, `frame-${String(i).padStart(2, '0')}.png`));
}

await buildTintSets(studyFrames, path.join(root, 'study-together', 'scarves'));
await buildTintSets(chairFrames, path.join(root, 'my-igloo', 'scarves'));

await buildSynchronizedAccessories(path.join(root, 'source', 'glasses-study-atlas.png'), 'glasses', 'study-together', { width: 430, height: 541 }, { left: 196, top: 232, width: 145, height: 60 }, 16);
await buildSynchronizedAccessories(path.join(root, 'source', 'headphones-study-atlas.png'), 'headphones', 'study-together', { width: 430, height: 541 }, { left: 105, top: 112, width: 220, height: 190 }, 16);
await buildSynchronizedAccessories(path.join(root, 'source', 'glasses-my-igloo-atlas.png'), 'glasses', 'my-igloo', { width: 480, height: 560 }, { left: 174, top: 224, width: 150, height: 58 }, 14);
await buildSynchronizedAccessories(path.join(root, 'source', 'headphones-my-igloo-atlas.png'), 'headphones', 'my-igloo', { width: 480, height: 560 }, { left: 130, top: 118, width: 220, height: 180 }, 14);

console.log('Prepared fixed-canvas scarf variants and synchronized accessory cels.');
