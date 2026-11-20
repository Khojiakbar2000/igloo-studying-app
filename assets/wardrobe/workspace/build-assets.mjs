import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('assets/wardrobe');
const generated = path.join(root, 'generated');
const items = path.join(root, 'items');
await fs.mkdir(items, { recursive: true });

async function crop(source, rect, output, size) {
  let image = sharp(path.join(generated, source)).extract(rect);
  if (size) image = image.resize(size.width, size.height, { fit: 'contain' });
  await image.png().toFile(path.join(items, output));
}
async function canvas(output, width, height, layers) {
  const composites = layers.map(({ file, left, top, width: w, height: h, flip }) => ({
    input: sharp(path.join(items, file)).resize(w, h, { fit: 'contain' }).flip(Boolean(flip)).png().toBuffer(),
    left, top,
  }));
  const inputs = await Promise.all(composites.map(async (entry) => ({ ...entry, input: await entry.input })));
  await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(inputs).png().toFile(path.join(items, output));
}

// Crops preserve the generated watercolor edges and alpha; the PNG sources remain unchanged.
await crop('crown-source.png', { left: 248, top: 180, width: 1035, height: 610 }, 'crown-art.png', { width: 176, height: 104 });
await crop('glasses-source.png', { left: 402, top: 72, width: 1350, height: 568 }, 'round-glasses-art.png', { width: 218, height: 92 });
await crop('knight-sheet-source.png', { left: 164, top: 12, width: 510, height: 438 }, 'knight-helmet-art.png', { width: 165, height: 142 });
await crop('knight-sheet-source.png', { left: 846, top: 92, width: 538, height: 360 }, 'knight-chest-art.png', { width: 190, height: 128 });
await crop('knight-sheet-source.png', { left: 118, top: 474, width: 224, height: 250 }, 'knight-flipper-left-art.png', { width: 77, height: 86 });
await crop('knight-sheet-source.png', { left: 426, top: 474, width: 220, height: 250 }, 'knight-flipper-right-art.png', { width: 77, height: 86 });
await crop('knight-sheet-source.png', { left: 122, top: 766, width: 257, height: 224 }, 'knight-boot-art.png', { width: 48, height: 42 });
await crop('knight-sheet-source.png', { left: 738, top: 492, width: 744, height: 492 }, 'knight-cape-art.png', { width: 214, height: 142 });

// Full-body coordinates use the approved 304 x 500 Lottie body layer as their canvas.
await canvas('crown-body-layer.png', 304, 500, [{ file: 'crown-art.png', left: 64, top: -22, width: 176, height: 104 }]);
await canvas('glasses-body-layer.png', 304, 500, [{ file: 'round-glasses-art.png', left: 43, top: 128, width: 218, height: 92 }]);
await canvas('knight-helmet-body-layer.png', 304, 500, [{ file: 'knight-helmet-art.png', left: 70, top: -24, width: 165, height: 142 }]);
await canvas('knight-chest-body-layer.png', 304, 500, [{ file: 'knight-chest-art.png', left: 57, top: 321, width: 190, height: 128 }]);
await canvas('knight-cape-body-layer.png', 304, 500, [{ file: 'knight-cape-art.png', left: 45, top: 284, width: 214, height: 142 }]);
await canvas('knight-left-arm-layer.png', 85, 96, [{ file: 'knight-flipper-left-art.png', left: 4, top: 5, width: 77, height: 86 }]);
await canvas('knight-right-arm-layer.png', 86, 96, [{ file: 'knight-flipper-right-art.png', left: 5, top: 5, width: 77, height: 86 }]);
await canvas('knight-left-foot-layer.png', 48, 45, [{ file: 'knight-boot-art.png', left: 0, top: 1, width: 48, height: 42 }]);
await canvas('knight-right-foot-layer.png', 49, 45, [{ file: 'knight-boot-art.png', left: 1, top: 1, width: 48, height: 42, flip: true }]);
await canvas('knight-set-thumb.png', 300, 220, [
  { file: 'knight-cape-art.png', left: 43, top: 57, width: 214, height: 142 },
  { file: 'knight-helmet-art.png', left: 87, top: 2, width: 126, height: 108 },
  { file: 'knight-chest-art.png', left: 80, top: 84, width: 140, height: 94 },
  { file: 'knight-flipper-left-art.png', left: 16, top: 111, width: 58, height: 65 },
  { file: 'knight-flipper-right-art.png', left: 227, top: 111, width: 58, height: 65 },
  { file: 'knight-boot-art.png', left: 73, top: 174, width: 48, height: 42 },
  { file: 'knight-boot-art.png', left: 180, top: 174, width: 48, height: 42, flip: true },
]);

console.log(`Prepared reusable Pip accessory layers in ${items}`);
