import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('assets/wardrobe');
const items = path.join(root, 'items');
const previewDir = path.join(root, 'previews');
await fs.mkdir(previewDir, { recursive: true });
const lottie = JSON.parse(await fs.readFile(path.resolve('assets/wardrobe/lottie/idle.json'), 'utf8'));
const assetById = new Map(lottie.assets.map((asset) => [asset.id, asset]));
const baseLayers = [];
for (const layer of [...lottie.layers].reverse()) {
  if (layer.nm === 'Painted blinking eyelids') continue;
  const asset = assetById.get(layer.refId);
  if (!asset?.p?.startsWith('data:image/png;base64,')) continue;
  const [x, y] = layer.ks.p.k;
  const [ax, ay] = layer.ks.a.k;
  baseLayers.push({ input: Buffer.from(asset.p.split(',')[1], 'base64'), left: Math.round(360 + x - ax), top: Math.round(610 + y - ay) });
}
const bodyLeft = 208;
const bodyTop = 80;
const full = (name) => path.join(items, name);
const overlay = async (name, left = bodyLeft, top = bodyTop) => ({ input: await fs.readFile(full(name)), left, top });

async function render(name, beforeBehind, beforeFront, afterBehind, afterFront) {
  const common = [...baseLayers];
  const overlayScarf = await overlay('scarves/scarf-teal.png');
  const beforeResult = await sharp({ create: { width: 720, height: 720, channels: 4, background: '#f7f4ee' } })
    .composite([...beforeBehind, ...common, overlayScarf, ...beforeFront])
    .png().toBuffer();
  const afterParts = [...afterBehind, ...common, ...afterFront];
  const afterResult = await sharp({ create: { width: 720, height: 720, channels: 4, background: '#f7f4ee' } })
    .composite(afterParts)
    .png().toBuffer();
  return { name, before: await sharp(beforeResult).resize(342, 342, { fit: 'contain' }).png().toBuffer(), after: await sharp(afterResult).resize(342, 342, { fit: 'contain' }).png().toBuffer() };
}

const crown = await render('CROWN', [await overlay('crown-body-layer.png')], [], [], [await overlay('crown-body-layer-v2.png')]);
const glasses = await render('GLASSES', [], [await overlay('glasses-body-layer.png')], [], [await overlay('glasses-body-layer-v2.png')]);
const armorBefore = [
  await overlay('knight-cape-body-layer.png'),
  await overlay('knight-helmet-body-layer.png'),
  await overlay('knight-chest-body-layer.png'),
  { input: await fs.readFile(full('knight-left-arm-layer.png')), left: 200, top: 384 },
  { input: await fs.readFile(full('knight-right-arm-layer.png')), left: 449, top: 384 },
  { input: await fs.readFile(full('knight-left-foot-layer.png')), left: 291, top: 569 },
  { input: await fs.readFile(full('knight-right-foot-layer.png')), left: 391, top: 569 },
];
const armorAfter = [
  await overlay('knight-cape-body-layer.png'),
  await overlay('knight-chest-body-layer-v2.png'),
  await overlay('scarves/scarf-teal.png'),
  await overlay('knight-helmet-body-layer-v2.png'),
  { input: await fs.readFile(full('knight-left-arm-layer-v2.png')), left: 200, top: 384 },
  { input: await fs.readFile(full('knight-right-arm-layer-v2.png')), left: 449, top: 384 },
  { input: await fs.readFile(full('knight-left-foot-layer-v2.png')), left: 290, top: 569 },
  { input: await fs.readFile(full('knight-right-foot-layer-v2.png')), left: 391, top: 569 },
];
const armorBehindBefore = armorBefore.filter((entry, index) => index < 2);
const armorFrontBefore = armorBefore.filter((entry, index) => index >= 2);
const armor = await render('KNIGHT ARMOR', armorBehindBefore, armorFrontBefore, [armorAfter[0]], armorAfter.slice(1));

const label = (text, color) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="342" height="54"><rect x="0" y="0" width="342" height="54" rx="16" fill="#fffdf8"/><text x="22" y="35" font-family="Arial,sans-serif" font-size="20" font-weight="700" fill="${color}">${text}</text></svg>`);
const cards = [
  { title: 'CURRENT · CROWN', img: crown.before }, { title: 'CORRECTED · CROWN', img: crown.after },
  { title: 'CURRENT · GLASSES', img: glasses.before }, { title: 'CORRECTED · GLASSES', img: glasses.after },
  { title: 'CURRENT · KNIGHT', img: armor.before }, { title: 'CORRECTED · KNIGHT', img: armor.after },
];
const cardBuffers = [];
for (const card of cards) {
  const image = await sharp(card.img).resize(342, 342, { fit: 'contain' }).png().toBuffer();
  const labelSvg = label(card.title, card.title.startsWith('CURRENT') ? '#9b5e56' : '#4f7771');
  cardBuffers.push({ input: labelSvg, left: 0, top: 0 }, { input: image, left: 0, top: 54 });
}
const cardHeight = 396;
const width = 684;
const height = cardHeight * 3;
const grid = [];
for (let row = 0; row < 3; row += 1) {
  for (let col = 0; col < 2; col += 1) {
    const index = row * 2 + col;
    const card = cards[index];
    grid.push({ input: label(card.title, card.title.startsWith('CURRENT') ? '#9b5e56' : '#4f7771'), left: col * 342, top: row * cardHeight });
    grid.push({ input: await sharp(card.img).resize(342, 342, { fit: 'contain' }).png().toBuffer(), left: col * 342, top: row * cardHeight + 54 });
  }
}
void cardBuffers;
await sharp({ create: { width, height, channels: 4, background: '#eaf1f5' } }).composite(grid).png().toFile(path.join(previewDir, 'accessory-quality-v2.png'));
console.log(`Wrote ${path.join(previewDir, 'accessory-quality-v2.png')}`);
