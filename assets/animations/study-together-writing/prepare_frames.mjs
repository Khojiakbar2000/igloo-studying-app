import fs from 'node:fs/promises';
import sharp from 'sharp';

const root = 'assets/animations/study-together-writing';
const sheetPath = `${root}/source/writing-sheet.png`;
const baselinePath = `${root}/source/baseline.png`;
const frameRoot = `${root}/frames`;
const cols = 4, rows = 4, frameCount = cols * rows;
const target = { width: 430, height: 541 };
await fs.mkdir(frameRoot, { recursive: true });

const sheetMeta = await sharp(sheetPath).metadata();
const boundaries = (length, count) => Array.from({ length: count + 1 }, (_, i) => Math.round(i * length / count));
const xs = boundaries(sheetMeta.width, cols), ys = boundaries(sheetMeta.height, rows);
const cells = [];
for (let i = 0; i < frameCount; i++) {
  const col = i % cols, row = Math.floor(i / cols);
  const { data, info } = await sharp(sheetPath).extract({
    left: xs[col], top: ys[row], width: xs[col + 1] - xs[col], height: ys[row + 1] - ys[row],
  }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const count = info.width * info.height;
  const queued = new Uint8Array(count), queue = new Uint32Array(count);
  let head = 0, tail = 0;
  const distanceFromWhite = (pixel) => Math.hypot(255 - data[pixel * 4], 255 - data[pixel * 4 + 1], 255 - data[pixel * 4 + 2]);
  const addBackgroundCandidate = (pixel) => {
    if (queued[pixel] || distanceFromWhite(pixel) >= 12) return;
    queued[pixel] = 1; queue[tail++] = pixel;
  };
  for (let x = 0; x < info.width; x++) { addBackgroundCandidate(x); addBackgroundCandidate((info.height - 1) * info.width + x); }
  for (let y = 0; y < info.height; y++) { addBackgroundCandidate(y * info.width); addBackgroundCandidate(y * info.width + info.width - 1); }
  while (head < tail) {
    const pixel = queue[head++], x = pixel % info.width, y = Math.floor(pixel / info.width);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < info.width && ny >= 0 && ny < info.height) addBackgroundCandidate(ny * info.width + nx);
    }
  }
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let p = 0; p < count; p++) {
    const k = p * 4, d = distanceFromWhite(p);
    if (queued[p] && d < 12) data[k + 3] = 0;
    if (data[k + 3] > 8) { const x = p % info.width, y = Math.floor(p / info.width); minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  }
  if (maxX < minX || maxY < minY) throw new Error(`Frame ${i} has no character after magenta removal.`);
  cells.push({ data, width: info.width, height: info.height, bbox: { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 } });
}

// One shared scale for the complete generated action; preserve every pose and one bottom anchor.
const maxWidth = Math.max(...cells.map((cell) => cell.bbox.width));
const maxHeight = Math.max(...cells.map((cell) => cell.bbox.height));
const referenceSubjectHeight = 456;
const commonScale = Math.min(target.width / maxWidth, referenceSubjectHeight / maxHeight);
const outputFrames = [];
for (let i = 0; i < frameCount; i++) {
  const output = `${frameRoot}/pip-writing_${String(i).padStart(2, '0')}.png`;
  const cell = cells[i];
  const b = cell.bbox;
  const crop = await sharp(cell.data, { raw: { width: cell.width, height: cell.height, channels: 4 } })
    .extract({ left: b.left, top: b.top, width: b.width, height: b.height })
    .png().toBuffer();
  const width = Math.round(b.width * commonScale), height = Math.round(b.height * commonScale);
  const aligned = await sharp(crop).resize({ width, height, fit: 'fill' }).png().toBuffer();
  await sharp({ create: { ...target, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: aligned, left: Math.round((target.width - width) / 2), top: target.height - height }])
    .png().toFile(output);
  outputFrames.push(output);
}

const tiles = [];
for (let i = 0; i < frameCount; i++) {
  const input = await sharp(outputFrames[i]).resize(180, 226, { fit: 'contain', background: '#FFFFFF' }).flatten({ background: '#FFFFFF' }).png().toBuffer();
  tiles.push({ input, left: (i % cols) * 180, top: Math.floor(i / cols) * 226 });
}
await sharp({ create: { width: cols * 180, height: rows * 226, channels: 3, background: '#FFFFFF' } })
  .composite(tiles).png().toFile(`${root}/contact-sheet.png`);
await fs.writeFile(`${root}/frame-prep.json`, JSON.stringify({
  sourceSheet: 'source/writing-sheet.png', baseline: baselinePath, frameCount,
  cellGrid: [cols, rows], canvas: [target.width, target.height], commonScale,
  bottomBaseline: target.height, fps: 12, loop: true,
  generatedCellBounds: cells.map((cell) => cell.bbox),
}, null, 2) + '\n');
console.log(JSON.stringify({ source: [sheetMeta.width, sheetMeta.height], cells: [cols, rows], maxCellSubject: [maxWidth, maxHeight], commonScale, canvas: [target.width, target.height], frames: outputFrames.length }));
