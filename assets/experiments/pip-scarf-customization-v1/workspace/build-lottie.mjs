import fs from 'node:fs/promises';
import path from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const production = new URL('../../../animations/pip/storybook/lottie/', import.meta.url).pathname;
const actions = ['pip-cold', 'blink', 'wave', 'hopeful-wave', 'scarf-tuck', 'curious-look', 'celebrate'];
const bodyBuffer = await fs.readFile(`${root}character/body-no-scarf.png`);
const scarfBuffer = await fs.readFile(`${root}scarves/scarf-teal.png`);
const bodyUri = `data:image/png;base64,${bodyBuffer.toString('base64')}`;
const scarfUri = `data:image/png;base64,${scarfBuffer.toString('base64')}`;

for (const action of actions) {
  const json = JSON.parse(await fs.readFile(path.join(production, `${action}.json`), 'utf8'));
  const bodyAsset = json.assets.find(a => a.id === 'image_4');
  const bodyLayer = json.layers.find(l => l.nm === 'body');
  if (!bodyAsset || !bodyLayer) throw new Error(`Expected image_4 body in ${action}`);
  bodyAsset.p = bodyUri;
  bodyAsset.u = '';
  bodyAsset.e = 1;
  const scarfAsset = { id: 'pip_scarf', w: 304, h: 500, u: '', p: scarfUri, e: 1 };
  const scarfLayer = structuredClone(bodyLayer);
  scarfLayer.ind = 81;
  scarfLayer.nm = 'Pip scarf accessory';
  scarfLayer.refId = 'pip_scarf';
  scarfLayer.parent = bodyLayer.parent;
  const bodyAt = json.layers.indexOf(bodyLayer);
  json.layers.splice(bodyAt, 0, scarfLayer); // above torso, behind both flippers
  json.assets.push(scarfAsset);
  await fs.writeFile(`${root}lottie/${action}.json`, `${JSON.stringify(json)}\n`);
}
console.log(`Created ${actions.length} editable Lottie copies with a single reusable scarf layer.`);
