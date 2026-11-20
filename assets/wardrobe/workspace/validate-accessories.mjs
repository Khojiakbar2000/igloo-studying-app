import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('assets/wardrobe');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'accessory-manifest.json'), 'utf8'));
const allowedSlots = new Set(['head', 'face', 'neck', 'body', 'back', 'leftFlipper', 'rightFlipper', 'leftFoot', 'rightFoot']);
const errors = [];

for (const asset of manifest.assets) {
  const file = path.join(root, asset.file);
  let metadata;
  let pixels;
  try {
    metadata = await sharp(file).metadata();
    pixels = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  } catch (error) {
    errors.push(`${asset.id}: cannot read ${asset.file}: ${error.message}`);
    continue;
  }
  const [expectedWidth, expectedHeight] = asset.canvas;
  if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
    errors.push(`${asset.id}: canvas is ${metadata.width}×${metadata.height}; expected ${expectedWidth}×${expectedHeight}`);
    continue;
  }
  if (!metadata.hasAlpha) errors.push(`${asset.id}: PNG has no alpha channel`);
  if (!allowedSlots.has(asset.slot)) errors.push(`${asset.id}: unknown attachment slot ${asset.slot}`);
  if (!['body', 'leftArm', 'rightArm', 'leftFoot', 'rightFoot'].includes(asset.frame)) errors.push(`${asset.id}: unknown rig frame ${asset.frame}`);
  if (!['front', 'behind'].includes(asset.layer) || !Number.isFinite(asset.order)) errors.push(`${asset.id}: missing/invalid layer ordering`);
  if (!Array.isArray(asset.anchor) || asset.anchor.length !== 2 || asset.anchor.some((value) => !Number.isFinite(value))) errors.push(`${asset.id}: missing anchor metadata`);

  let minX = expectedWidth, minY = expectedHeight, maxX = -1, maxY = -1;
  const { data, info } = pixels;
  for (let y = 0; y < expectedHeight; y += 1) {
    for (let x = 0; x < expectedWidth; x += 1) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha > 8) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) {
    errors.push(`${asset.id}: image has no visible pixels`);
    continue;
  }
  const boxWidth = maxX - minX + 1, boxHeight = maxY - minY + 1;
  if (boxWidth > asset.alphaBoundsMax[0] || boxHeight > asset.alphaBoundsMax[1]) {
    errors.push(`${asset.id}: visible alpha bounds ${boxWidth}×${boxHeight} exceed ${asset.alphaBoundsMax.join('×')}`);
  }
  if (boxWidth < expectedWidth * 0.2 && boxHeight < expectedHeight * 0.2) {
    errors.push(`${asset.id}: very small visible artwork inside its canvas; check transparent padding`);
  }
  for (const [cx, cy] of asset.transparentLensCenters ?? []) {
    const radius = asset.transparentLensRadius;
    for (let y = Math.max(0, cy - radius); y <= Math.min(expectedHeight - 1, cy + radius); y += 1) {
      for (let x = Math.max(0, cx - radius); x <= Math.min(expectedWidth - 1, cx + radius); x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2 && data[(y * info.width + x) * 4 + 3] > 8) {
          errors.push(`${asset.id}: lens interior is not transparent near (${x}, ${y})`);
          y = expectedHeight;
          break;
        }
      }
    }
  }
  console.log(`${errors.some((error) => error.startsWith(`${asset.id}:`)) ? 'FAIL' : 'OK  '} ${asset.id}: ${metadata.width}×${metadata.height}, alpha bounds ${boxWidth}×${boxHeight}`);
}

if (errors.length) {
  console.error('\nAccessory validation failed:\n' + errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`\nValidated ${manifest.assets.length} accessory images and attachment records.`);
}
