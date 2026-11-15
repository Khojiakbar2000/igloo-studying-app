import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const root = path.resolve('assets/animations/synfig-shiver');
const renderRoot = path.join(root, 'exports');
const previousExport = path.join(root, 'exports-v1');
const scratch = '/private/tmp/igloo-pip-shiver-render';
const synfig = '/opt/homebrew/Cellar/synfig/1.5.5_4/bin/synfig';
const ffmpeg = '/opt/homebrew/Cellar/ffmpeg/9.0.2_1/bin/ffmpeg';
const timeline = JSON.parse(await fs.readFile(path.join(root, 'timeline.json'), 'utf8'));
const totalFrames = timeline.exposureFrames.reduce((sum, value) => sum + value, 0);
const duration = totalFrames / timeline.fps;
try {
  await fs.access(renderRoot);
  try { await fs.access(previousExport); }
  catch { await fs.rename(renderRoot, previousExport); }
} catch { /* first export */ }
await fs.mkdir(renderRoot, { recursive: true });
await fs.mkdir(scratch, { recursive: true });
const result = spawnSync(synfig, [
  '--quiet', `--fps=${timeline.fps}`, '--begin-time=0f', `--end-time=${totalFrames}f`, '-w', '500', '-h', '500',
  '-i', path.join(root, 'pip-cold-shiver.sif'), '-o', path.join(scratch, 'pip-shiver.png'),
], { cwd: process.cwd(), encoding: 'utf8' });
if (result.status !== 0) throw new Error(`Synfig render failed (${result.status}): ${result.stderr}`);
const framePaths = [];
for (let i = 0; i < totalFrames; i++) {
  const input = path.join(scratch, `pip-shiver.${String(i + 1).padStart(4, '0')}.png`);
  const output = path.join(renderRoot, `pip-shiver_${String(i).padStart(3, '0')}.png`);
  const image = sharp(input);
  const meta = await image.metadata();
  if (meta.width !== 500 || meta.height !== 500 || meta.channels !== 4) throw new Error(`Unexpected frame format at ${input}: ${JSON.stringify(meta)}`);
  const alphaProbe = await image.extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
  if (alphaProbe[3] !== 0) throw new Error(`Frame ${i} lost transparency`);
  await fs.copyFile(input, output);
  framePaths.push(output);
}
const ff = spawnSync(ffmpeg, [
  '-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(timeline.fps), '-start_number', '0',
  '-i', path.join(renderRoot, 'pip-shiver_%03d.png'), '-f', 'lavfi', '-i', `color=c=0xEAF3F7:s=500x500:r=${timeline.fps}:d=${duration}`,
  '-filter_complex', '[1:v][0:v]overlay=shortest=1:format=auto', '-frames:v', String(totalFrames),
  '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', path.join(root, 'pip-cold-shiver-preview.mp4'),
], { encoding: 'utf8' });
if (ff.status !== 0) throw new Error(`MP4 encode failed (${ff.status}): ${ff.stderr}`);
const gif = spawnSync(ffmpeg, [
  '-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(timeline.fps), '-start_number', '0',
  '-i', path.join(renderRoot, 'pip-shiver_%03d.png'), '-filter_complex',
  '[0:v]split[a][b];[a]palettegen=reserve_transparent=on[p];[b][p]paletteuse=alpha_threshold=96',
  '-loop', '0', path.join(root, 'pip-cold-shiver-preview.gif'),
], { encoding: 'utf8' });
if (gif.status !== 0) throw new Error(`GIF preview encode failed (${gif.status}): ${gif.stderr}`);
const tiles = [];
let offset = 0;
for (let i = 0; i < 16; i++) {
  const input = await sharp(framePaths[offset]).resize(220, 220, { fit: 'contain', background: '#FFFFFF' }).flatten({ background: '#FFFFFF' }).png().toBuffer();
  tiles.push({ input, left: (i % 4) * 220, top: Math.floor(i / 4) * 220 });
  offset += timeline.exposureFrames[i];
}
await sharp({ create: { width: 880, height: 880, channels: 3, background: '#FFFFFF' } }).composite(tiles).png().toFile(path.join(root, 'rendered-contact.png'));
console.log(JSON.stringify({ frames: framePaths.length, fps: timeline.fps, duration, transparent: true, preview: path.join(root, 'pip-cold-shiver-preview.mp4') }));
