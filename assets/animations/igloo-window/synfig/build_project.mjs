import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('assets/animations/igloo-window/synfig');
const timeline = JSON.parse(await fs.readFile(path.join(root, 'timeline.json'), 'utf8'));
const endFrame = timeline.cels.reduce((sum, cel) => sum + cel.exposure, 0);
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
let cursor = 0;
const layers = timeline.cels.map((cel, i) => {
  const start = cursor;
  cursor += cel.exposure;
  const initial = i === 0 ? 1 : 0;
  const first = `<waypoint time="0f" before="constant" after="constant"><real value="${initial}.0"/></waypoint>`;
  const on = i === 0 ? '' : `<waypoint time="${start}f" before="constant" after="constant"><real value="1.0"/></waypoint>`;
  const off = `<waypoint time="${cursor}f" before="constant" after="constant"><real value="0.0"/></waypoint>`;
  const amount = `<animated type="real" version="1.0">${first}${on}${off}</animated>`;
  const source = `cels/pip-window_${String(cel.pose).padStart(2, '0')}.png`;
  return `<layer type="import" active="true" version="0.1" desc="${escape(cel.id)} · pose ${String(cel.pose).padStart(2, '0')} · ${start}f"><param name="z_depth"><real value="0.0"/></param><param name="amount">${amount}</param><param name="blend_method"><integer value="0"/></param><param name="tl"><vector><x>-2.25</x><y>2.25</y></vector></param><param name="br"><vector><x>2.25</x><y>-2.25</y></vector></param><param name="filename"><string>${escape(source)}</string></param></layer>`;
});
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<canvas version="1.2" width="500" height="500" xres="2834.645669" yres="2834.645669" fps="${timeline.fps}.0" begin-time="0f" end-time="${endFrame}f" antialias="2" view-box="-2.25 2.25 2.25 -2.25" bgcolor="0.0 0.0 0.0 0.0">
<name>Pip — My Igloo Window Storm</name><desc>Editable ImageGen cel timeline for the window opening, storm reaction, shiver, close, and recovery. Each cel is a named import layer.</desc><author>IGLOO animation experiment</author>
${layers.reverse().join('\n')}
</canvas>`;
await fs.writeFile(path.join(root, 'pip-window-storm.sif'), xml);
console.log(`Wrote ${layers.length} cel exposures, ${endFrame} frames (${endFrame / timeline.fps}s) at ${timeline.fps}fps.`);
