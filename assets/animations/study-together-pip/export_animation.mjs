import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const root = path.resolve('assets/animations/study-together-pip');
const exportRoot = path.join(root, 'exports');
const scratch = '/private/tmp/igloo-study-typing-render';
const timeline = JSON.parse(await fs.readFile(path.join(root, 'timeline.json'), 'utf8'));
const frameCount = timeline.exposureFrames.reduce((sum, value) => sum + value, 0);
await fs.mkdir(scratch, { recursive: true });
const result = spawnSync('/opt/homebrew/Cellar/synfig/1.5.5_4/bin/synfig', [
  '--quiet', `--fps=${timeline.fps}`, '--begin-time=0f', `--end-time=${frameCount}f`, '-w', '430', '-h', '541',
  '-i', path.join(root, 'pip-study-typing.sif'), '-o', path.join(scratch, 'pip-typing.png'),
], { cwd: process.cwd(), encoding: 'utf8' });
if (result.status !== 0) throw new Error(`Synfig render failed (${result.status}): ${result.stderr}`);
await fs.mkdir(exportRoot, { recursive: true });
for (let i = 0; i < frameCount; i++) {
  const input = path.join(scratch, `pip-typing.${String(i).padStart(4, '0')}.png`);
  const output = path.join(exportRoot, `pip-typing_${String(i).padStart(3, '0')}.png`);
  const frame = sharp(input);
  const meta = await frame.metadata();
  const alpha = await frame.extract({ left: 0, top: 0, width: 1, height: 1 }).ensureAlpha().raw().toBuffer();
  if (meta.width !== 430 || meta.height !== 541 || alpha[3] !== 0) throw new Error(`Invalid transparent Synfig frame: ${input}`);
  await fs.copyFile(input, output);
}
console.log(`Exported ${frameCount} transparent Synfig frames at ${timeline.fps} fps.`);
