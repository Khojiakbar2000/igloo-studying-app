import fs from 'node:fs/promises';
import path from 'node:path';

/** Append Pip’s short reactions without changing the existing action ranges. */
export async function addPipReactions(composition, segments, output) {
  if (segments.reactions) return;

  const named = name => {
    const cel = composition.layers.find(layer => layer.nm === `typing ${name}`);
    if (!cel) throw new Error(`Missing typing cel: ${name}`);
    return cel;
  };

  const baseline = named('study cel 1');
  const blinkCels = ['study cel 5', 'study cel 6', 'study cel 7', 'study cel 8']
    .map(name => structuredClone(named(name)));
  // Keep the blink cels available for the scheduler. Remove the fixed blinks from the study loop.
  for (const [target, open] of [[6, 5], [7, 8], [14, 13], [15, 16]]) {
    named(`study cel ${target}`).refId = named(`study cel ${open}`).refId;
  }

  const expression = async name => {
    const file = path.join(output, 'images', 'typing', `reaction-${name}.png`);
    const png = await fs.readFile(file);
    const id = `pip_reaction_${name}`;
    composition.assets.push({ id, w: composition.w, h: composition.h, u: '', e: 1, p: `data:image/png;base64,${png.toString('base64')}` });
    return { ...baseline, refId: id };
  };

  const look = await expression('look');
  const smile = await expression('smile');
  const sequences = {
    excited: [[baseline, 3], [named('celebrate 1'), 8], [named('celebrate 2'), 11], [baseline, 5]],
    blink: [[blinkCels[0], 2], [blinkCels[1], 2], [blinkCels[2], 3], [blinkCels[3], 3]],
    look: [[baseline, 3], [look, 24], [baseline, 4]],
    smile: [[baseline, 3], [smile, 22], [baseline, 4]],
  };

  segments.reactions = {};
  for (const [name, frames] of Object.entries(sequences)) {
    const start = composition.op;
    frames.forEach(([cel, count], index) => {
      const ip = composition.op;
      composition.op += count;
      composition.layers.push({ ...structuredClone(cel), ind: composition.layers.length + 1, nm: `Pip ${name} ${index + 1}`, ip, op: composition.op });
    });
    segments.reactions[name] = [start, composition.op];
    composition.markers.push({ tm: start, cm: name, dr: composition.op - start });
  }
}
