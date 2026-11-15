import fs from 'node:fs/promises';
import sharp from 'sharp';

const root = 'assets/animations/pip-sofa-study';
const sheetPath = `${root}/source/typing-sheet.png`;
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
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let p = 0; p < info.width * info.height; p++) {
    const k = p * 4, r = data[k], g = data[k + 1], b = data[k + 2];
    const d = Math.hypot(255 - r, g, 255 - b);
    if (d < 18) data[k + 3] = 0;
    else if (d < 160) {
      const alpha = (d - 18) / 142;
      data[k + 3] = Math.round(data[k + 3] * alpha);
      if (alpha > 0) {
        data[k] = Math.min(255, Math.round((r - 255 * (1 - alpha)) / alpha));
        data[k + 1] = Math.min(255, Math.round(g / alpha));
        data[k + 2] = Math.min(255, Math.round((b - 255 * (1 - alpha)) / alpha));
      }
    }
    if (data[k + 3] > 8) {
      const x = p % info.width, y = Math.floor(p / info.width);
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error(`Frame ${i} has no character after magenta removal.`);
  cells.push({ data, width: info.width, height: info.height, bbox: { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 } });
}

// One shared scale for the complete generated action; preserve every pose and one bottom anchor.
const maxWidth = Math.max(...cells.map((cell) => cell.bbox.width));
const maxHeight = Math.max(...cells.map((cell) => cell.bbox.height));
const commonScale = Math.min(target.width / maxWidth, target.height / maxHeight);
const outputFrames = [];
for (let i = 0; i < frameCount; i++) {
  const output = `${frameRoot}/pip-typing_${String(i).padStart(2, '0')}.png`;
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
  sourceSheet: 'source/typing-sheet.png', baseline: baselinePath, frameCount,
  cellGrid: [cols, rows], canvas: [target.width, target.height], commonScale,
  bottomBaseline: target.height, fps: 12, loop: true,
  generatedCellBounds: cells.map((cell) => cell.bbox),
}, null, 2) + '\n');
console.log(JSON.stringify({ source: [sheetMeta.width, sheetMeta.height], cells: [cols, rows], maxCellSubject: [maxWidth, maxHeight], commonScale, canvas: [target.width, target.height], frames: outputFrames.length }));
