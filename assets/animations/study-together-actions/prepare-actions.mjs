import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.dirname(new URL(import.meta.url).pathname);
const actions = ['coffee', 'bored', 'stretch', 'wave', 'break', 'yawn', 'celebrate'];
const outW = 430;
const outH = 541;
const baselineY = 527;

function alphaBounds(data, width, height) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 0) {
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
  }
  return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
}

function removeSmallComponents(data, width, height, minimum = 36) {
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const components = [];
  for (let i = 0; i < width * height; i++) {
    if (seen[i] || data[i * 4 + 3] === 0) continue;
    let head = 0, tail = 0;
    queue[tail++] = i; seen[i] = 1;
    while (head < tail) {
      const p = queue[head++], x = p % width, y = (p / width) | 0;
      if (x > 0) { const n = p - 1; if (!seen[n] && data[n * 4 + 3]) { seen[n] = 1; queue[tail++] = n; } }
      if (x + 1 < width) { const n = p + 1; if (!seen[n] && data[n * 4 + 3]) { seen[n] = 1; queue[tail++] = n; } }
      if (y > 0) { const n = p - width; if (!seen[n] && data[n * 4 + 3]) { seen[n] = 1; queue[tail++] = n; } }
      if (y + 1 < height) { const n = p + width; if (!seen[n] && data[n * 4 + 3]) { seen[n] = 1; queue[tail++] = n; } }
    }
    let left = width, top = height, right = -1, bottom = -1;
    const pixels = queue.slice(0, tail);
    for (const p of pixels) { const x = p % width, y = (p / width) | 0; left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
    components.push({ size: tail, pixels, bounds: { left, top, right, bottom, width: right-left+1, height: bottom-top+1 } });
  }
  for (const component of components) if (component.size < minimum) {
    for (const p of component.pixels) data[p * 4 + 3] = 0;
  }
  const kept = components.filter(component => component.size >= minimum).sort((a, b) => b.size - a.size);
  return { count: kept.length, main: kept[0] };
}

for (const action of actions) {
  const dir = path.join(root, action);
  const input = path.join(dir, 'source/pose-sheet.png');
  const meta = await sharp(input).metadata();
  if (!meta.width || !meta.height) throw new Error(`Cannot read ${input}`);
  const splitX = Math.floor(meta.width / 2), splitY = Math.floor(meta.height / 2);
  const cells = [
    { left: 0, top: 0, width: splitX, height: splitY },
    { left: splitX, top: 0, width: meta.width - splitX, height: splitY },
    { left: 0, top: splitY, width: splitX, height: meta.height - splitY },
    { left: splitX, top: splitY, width: meta.width - splitX, height: meta.height - splitY },
  ];
  const frames = [];
  for (const cell of cells) {
    const { data, info } = await sharp(input).extract(cell).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { count: keptComponents, main } = removeSmallComponents(data, info.width, info.height);
    const bounds = alphaBounds(data, info.width, info.height);
    if (bounds.right < 0 || !main) throw new Error(`Empty cell in ${action}`);
    frames.push({ data, width: info.width, height: info.height, bounds, main: main.bounds, keptComponents });
  }
  const maxW = Math.max(...frames.map(frame => frame.bounds.width));
  const maxH = Math.max(...frames.map(frame => frame.bounds.height));
  const scale = Math.min(outW / maxW, 430 / maxH);
  const anchorX = frames.reduce((sum, frame) => sum + frame.main.left + frame.main.width / 2, 0) / frames.length;
  const anchorY = frames.reduce((sum, frame) => sum + frame.main.bottom, 0) / frames.length;
  await fs.mkdir(path.join(dir, 'frames'), { recursive: true });
  const contact = [];
  for (let index = 0; index < frames.length; index++) {
    const frame = frames[index];
    const crop = { left: frame.bounds.left, top: frame.bounds.top, width: frame.bounds.width, height: frame.bounds.height };
    const resized = await sharp(frame.data, { raw: { width: frame.width, height: frame.height, channels: 4 } })
      .extract(crop)
      .resize(Math.max(1, Math.round(frame.bounds.width * scale)), Math.max(1, Math.round(frame.bounds.height * scale)), { fit: 'fill', kernel: 'lanczos3' })
      .png().toBuffer();
    const left = Math.round(outW / 2 - (anchorX - frame.bounds.left) * scale);
    const top = Math.round(baselineY - (anchorY - frame.bounds.top) * scale);
    const resizedMeta = await sharp(resized).metadata();
    const clipLeft = Math.max(0, -left), clipTop = Math.max(0, -top);
    const clipWidth = Math.min(resizedMeta.width - clipLeft, outW - Math.max(0, left));
    const clipHeight = Math.min(resizedMeta.height - clipTop, outH - Math.max(0, top));
    const clipped = await sharp(resized).extract({ left: clipLeft, top: clipTop, width: clipWidth, height: clipHeight }).png().toBuffer();
    const canvas = await sharp({ create: { width: outW, height: outH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: clipped, left: Math.max(0, left), top: Math.max(0, top) }]).png().toBuffer();
    const output = path.join(dir, `frames/frame-${String(index).padStart(2, '0')}.png`);
    await fs.writeFile(output, canvas);
    contact.push({ input: canvas, left: index * outW, top: 0 });
    console.log(`${action} frame ${index}: ${frame.width}x${frame.height}, components=${frame.keptComponents}, placement=${left},${top}`);
  }
  await sharp({ create: { width: outW * 4, height: outH, channels: 4, background: '#E8EEF4' } })
    .composite(contact).png().toFile(path.join(dir, 'contact-sheet.png'));
  await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ action, canvas: { width: outW, height: outH }, frameCount: 4, sourceSheet: `source/pose-sheet.png`, scale, anchorX, anchorY, baselineY, durationMs: action === 'break' ? 1600 : 2200 }, null, 2) + '\n');
}
