import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = new URL('../', import.meta.url).pathname;
const source = new URL('../../../animations/pip/storybook/lottie/', import.meta.url).pathname;
const actions = ['pip-cold','blink','wave','hopeful-wave','scarf-tuck','curious-look','celebrate'];
const failures = [];
const report = [];
for (const action of actions) {
  const original = JSON.parse(await fs.readFile(path.join(source, `${action}.json`), 'utf8'));
  const customized = JSON.parse(await fs.readFile(`${root}lottie/${action}.json`, 'utf8'));
  const oldLayers = customized.layers.filter(layer => layer.ind !== 81);
  if (JSON.stringify(oldLayers) !== JSON.stringify(original.layers)) failures.push(`${action}: an existing animation layer changed`);
  for (const key of ['fr','ip','op','w','h']) if (customized[key] !== original[key]) failures.push(`${action}: ${key} changed`);
  if (customized.layers.filter(layer => layer.nm === 'Pip scarf accessory').length !== 1) failures.push(`${action}: scarf layer count is not 1`);
  if (!customized.assets.some(asset => asset.id === 'pip_scarf')) failures.push(`${action}: scarf image missing`);
  report.push({ action, durationSeconds:(customized.op-customized.ip)/customized.fr, fps:customized.fr, sizeBytes:(await fs.stat(`${root}lottie/${action}.json`)).size, imageLayerCount:customized.layers.filter(layer=>layer.ty===2).length });
}
for (const id of ['teal','red','lavender']) {
  const f = `${root}scarves/scarf-${id}.png`;
  const meta = await sharp(f).metadata();
  if (meta.width !== 304 || meta.height !== 500 || !meta.hasAlpha) failures.push(`${id}: scarf image size or alpha mismatch`);
}
const result = {
  passes: failures.length === 0,
  failures,
  unchangedMotionLayersAndTiming: failures.length === 0,
  scarves: await Promise.all(['teal','red','lavender'].map(async id=>({id,bytes:(await fs.stat(`${root}scarves/scarf-${id}.png`)).size}))),
  body: { bytes:(await fs.stat(`${root}character/body-no-scarf.png`)).size, ...(await sharp(`${root}character/body-no-scarf.png`).metadata()) },
  actions:report,
  totalAnimationJsonBytes:report.reduce((sum,x)=>sum+x.sizeBytes,0),
  test: JSON.parse(await fs.readFile(`${root}workspace/browser-test.json`,'utf8')).allPassed ? '21 of 21 live browser swaps passed' : 'browser test failed',
};
await fs.writeFile(`${root}workspace/asset-verification.json`, JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if (failures.length) process.exitCode=1;
