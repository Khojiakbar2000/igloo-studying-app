import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('assets/wardrobe');
const source = path.resolve('assets/experiments/pip-scarf-customization-v1/lottie');
const destination = path.join(root, 'lottie');
await fs.mkdir(destination, { recursive: true });

// Reuse the existing approved clips and source art. Only the scarf image layer is
// removed so the wardrobe can render that one attachment as a live-swappable RN image.
const actions = { idle: 'blink', wave: 'wave', shiver: 'pip-cold', celebrate: 'celebrate' };
for (const [name, sourceName] of Object.entries(actions)) {
  const animation = JSON.parse(await fs.readFile(path.join(source, `${sourceName}.json`), 'utf8'));
  animation.layers = animation.layers.filter((layer) => layer.nm !== 'Pip scarf accessory');
  animation.assets = animation.assets.filter((asset) => asset.id !== 'pip_scarf');
  await fs.writeFile(path.join(destination, `${name}.json`), `${JSON.stringify(animation)}\n`);
}
console.log(`Prepared ${Object.keys(actions).length} accessory-ready copies of existing storybook Lottie actions.`);
