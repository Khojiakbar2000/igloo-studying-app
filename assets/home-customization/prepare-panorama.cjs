const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '../..');
const home = path.join(root, 'assets/home-customization');
const giftArt = path.join(root, 'assets/environments/igloo/gifts');
const fixtures = {
  chair: 'assets/home-customization/panorama/chair.webp',
  coffeeCabinet: 'assets/home-customization/panorama/coffee-cabinet.webp',
  coffee: 'assets/environments/study-together/coffee/machine.png',
  fireplace: 'assets/environments/study-together/fireplace.png',
  evergreen: 'assets/environments/igloo/garden/plant-3.webp',
  petBowl: 'assets/animations/igloo-pets/bowl.png',
  petToy: 'assets/animations/study-together-breaks/toy.png',
};

async function footprint(file) {
  const { data, info: { width, height } } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = width, top = height, right = 0, bottom = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < 30) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x + 1);
      bottom = Math.max(bottom, y + 1);
    }
  }
  if (left >= right || top >= bottom) throw new Error(`Empty furniture sprite: ${file}`);
  return [width, height, left, top, right, bottom];
}

async function main() {
  const catalog = await fs.readFile(path.join(root, 'src/gifts/catalog.ts'), 'utf8');
  const giftItems = [...catalog.matchAll(/id:'(gift-[^']+)'[^\n]+art:'(room-\d+)'/g)];
  const files = Object.fromEntries(Object.entries(fixtures).map(([id, file]) => [id, path.join(root, file)]));
  for (const file of await fs.readdir(path.join(home, 'items'))) {
    if (file.endsWith('.png')) files[path.basename(file, '.png')] = path.join(home, 'items', file);
  }
  for (const [, id, sprite] of giftItems) files[id] = path.join(giftArt, sprite + '.webp');
  const entries = await Promise.all(Object.entries(files).map(async ([id, file]) => [id, await footprint(file)]));
  await fs.writeFile(path.join(home, 'panorama/footprints.json'), JSON.stringify(Object.fromEntries(entries), null, 2) + '\n');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
