import fs from 'node:fs/promises';
import sharp from 'sharp';

const root = 'assets/animations/igloo-window/synfig';
const sheet = `${root}/source/pip-window-interaction-16.png`;
const master = 'assets/characters/penguin/igloo-penguin-front-gaze.png';
const out = `${root}/cels`;
await fs.mkdir(out, { recursive: true });
const meta = await sharp(sheet).metadata();
const cellW = meta.width / 4;
const cellH = meta.height / 4;
const size = 500;
const scale = 1.18;
const cropW = Math.round(cellW * scale);
const cropH = Math.round(cellH * scale);
const left = Math.round((size - cropW) / 2);
const base = await sharp(master).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer({ resolveWithObject: true });
const neutral = await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: await sharp(base.data).resize({ height: 420 }).png().toBuffer(), left: Math.round((size - (base.info.width * 420 / base.info.height)) / 2), top: 38 }]).png().toBuffer();
await sharp(neutral).png().toFile(`${out}/pip-window_00.png`);
for (let pose = 1; pose <= 14; pose++) {
  const col = pose % 4;
  const row = Math.floor(pose / 4);
  const x0 = Math.round(col * cellW), x1 = Math.round((col + 1) * cellW);
  const y0 = Math.round(row * cellH), y1 = Math.round((row + 1) * cellH);
  const crop = await sharp(sheet).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).resize({ width: cropW, height: cropH, fit: 'fill' }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: crop, left, top: 12 }]).png().toFile(`${out}/pip-window_${String(pose).padStart(2, '0')}.png`);
}
await sharp(neutral).png().toFile(`${out}/pip-window_15.png`);

// Remove disconnected sheet spill, preserve the character drawing intact, and align all feet.
for (let pose = 1; pose <= 14; pose++) {
  const file = `${out}/pip-window_${String(pose).padStart(2, '0')}.png`;
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const seen = new Uint8Array(info.width * info.height);
  const components = [];
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const start = y * info.width + x;
    if (seen[start] || data[start * 4 + 3] === 0) continue;
    const stack = [start]; const pixels = []; let maxY = y; seen[start] = 1;
    while (stack.length) {
      const p = stack.pop(), px = p % info.width, py = (p / info.width) | 0;
      pixels.push(p); maxY = Math.max(maxY, py);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= info.width || ny >= info.height) continue;
        const q = ny * info.width + nx;
        if (!seen[q] && data[q * 4 + 3] > 0) { seen[q] = 1; stack.push(q); }
      }
    }
    components.push({ pixels, maxY });
  }
  components.sort((a, b) => b.pixels.length - a.pixels.length);
  const main = components[0];
  for (const c of components.slice(1)) for (const p of c.pixels) data[p * 4 + 3] = 0;
  const offset = 459 - main.maxY;
  const shifted = new Uint8Array(data.length);
  for (let y = 0; y < info.height; y++) {
    const dy = y + offset;
    if (dy >= 0 && dy < info.height) shifted.set(data.subarray(y * info.width * 4, (y + 1) * info.width * 4), dy * info.width * 4);
  }
  await sharp(shifted, { raw: info }).png().toFile(file);
}

const tiles = [];
for (let i = 0; i < 16; i++) {
  const input = await sharp(`${out}/pip-window_${String(i).padStart(2, '0')}.png`).resize(220, 220, { fit: 'contain', background: '#FFFFFF' }).flatten({ background: '#FFFFFF' }).png().toBuffer();
  tiles.push({ input, left: (i % 4) * 220, top: Math.floor(i / 4) * 220 });
}
await sharp({ create: { width: 880, height: 880, channels: 3, background: '#FFFFFF' } }).composite(tiles).png().toFile(`${root}/keypose-contact.png`);
await fs.writeFile(`${root}/prep.json`, JSON.stringify({ source: 'source/pip-window-interaction-16.png', baseline: master, frames: 16, canvas: [size, size], groundY: 460, scale: 1.18 }, null, 2) + '\n');
console.log(JSON.stringify({ source: [meta.width, meta.height], cell: [cellW, cellH], normalized: [size, size], count: 16 }));
