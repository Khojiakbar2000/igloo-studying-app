import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('assets/animations/synfig-shiver');
const frameCount = 16;
const timeline = JSON.parse(await fs.readFile(path.join(root, 'timeline.json'), 'utf8'));
const { fps, exposureFrames } = timeline;
if (exposureFrames.length !== frameCount) throw new Error('Timeline must specify one exposure for each cel.');
const starts = exposureFrames.map((_, i) => exposureFrames.slice(0, i).reduce((sum, value) => sum + value, 0));
const endFrame = exposureFrames.reduce((sum, value) => sum + value, 0);
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const layers = [];
for (let i = 0; i < frameCount; i++) {
  const on = starts[i];
  const off = on + exposureFrames[i];
  const initial = i === 0 ? '<waypoint time="0f" before="constant" after="constant"><real value="1.0"/></waypoint>' : '<waypoint time="0f" before="constant" after="constant"><real value="0.0"/></waypoint>';
  const activate = i === 0 ? '' : `<waypoint time="${on}f" before="constant" after="constant"><real value="1.0"/></waypoint>`;
  const amount = `<animated type="real" version="1.0">${initial}${activate}<waypoint time="${off}f" before="constant" after="constant"><real value="0.0"/></waypoint></animated>`;
  layers.push(`<layer type="import" active="true" version="0.1" desc="Pip cel ${String(i + 1).padStart(2, '0')} — ${on}f"><param name="z_depth"><real value="0.0"/></param><param name="amount">${amount}</param><param name="blend_method"><integer value="0"/></param><param name="tl"><vector><x>-2.25</x><y>2.25</y></vector></param><param name="br"><vector><x>2.25</x><y>-2.25</y></vector></param><param name="filename"><string>${escape(`frames/pip-shiver_${String(i).padStart(2, '0')}.png`)}</string></param></layer>`);
}
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<canvas version="1.2" width="500" height="500" xres="2834.645669" yres="2834.645669" fps="${fps}.0" begin-time="0f" end-time="${endFrame}f" antialias="2" view-box="-2.25 2.25 2.25 -2.25" bgcolor="0.0 0.0 0.0 0.0">
<name>Pip — Cold Shiver Study</name><desc>Editable stepped cel timeline rendered from 16 ImageGen-drawn poses. Each full-character drawing is preserved as an independent import layer.</desc><author>IGLOO animation experiment</author>
${layers.reverse().join('\n')}
</canvas>`;
await fs.writeFile(path.join(root, 'pip-cold-shiver.sif'), xml);
console.log(`Wrote ${frameCount} editable cel layers, ${endFrame} frames (${endFrame / fps}s) at ${fps}fps.`);
