import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const root = path.resolve('assets/animations/igloo-window/synfig');
const renderRoot = path.join(root, 'exports');
const scratch = '/private/tmp/igloo-window-storm-render';
const synfig = '/opt/homebrew/Cellar/synfig/1.5.5_4/bin/synfig';
const ffmpeg = '/opt/homebrew/Cellar/ffmpeg/9.0.2_1/bin/ffmpeg';
const timeline = JSON.parse(await fs.readFile(path.join(root, 'timeline.json'), 'utf8'));
const totalFrames = timeline.cels.reduce((sum, cel) => sum + cel.exposure, 0);
const duration = totalFrames / timeline.fps;
await fs.mkdir(renderRoot, { recursive: true });
await fs.mkdir(scratch, { recursive: true });
const render = spawnSync(synfig, [
  '--quiet', `--fps=${timeline.fps}`, '--begin-time=0f', `--end-time=${totalFrames}f`, '-w', '500', '-h', '500',
  '-i', path.join(root, 'pip-window-storm.sif'), '-o', path.join(scratch, 'pip-window.png'),
], { cwd: process.cwd(), encoding: 'utf8' });
if (render.status !== 0) throw new Error(`Synfig render failed (${render.status}): ${render.stderr}`);
const framePaths = [];
for (let i = 0; i < totalFrames; i++) {
  const input = path.join(scratch, `pip-window.${String(i + 1).padStart(4, '0')}.png`);
  const output = path.join(renderRoot, `pip-window_${String(i).padStart(3, '0')}.png`);
  const image = sharp(input);
  const meta = await image.metadata();
  if (meta.width !== 500 || meta.height !== 500 || meta.channels !== 4) throw new Error(`Unexpected frame format: ${JSON.stringify(meta)}`);
  const alpha = await image.extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
  if (alpha[3] !== 0) throw new Error(`Transparent corner check failed at frame ${i}`);
  await fs.copyFile(input, output);
  framePaths.push(output);
}
const mp4 = spawnSync(ffmpeg, [
  '-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(timeline.fps), '-start_number', '0', '-i', path.join(renderRoot, 'pip-window_%03d.png'),
  '-f', 'lavfi', '-i', `color=c=0xEAF3F7:s=500x500:r=${timeline.fps}:d=${duration}`,
  '-filter_complex', '[1:v][0:v]overlay=shortest=1:format=auto', '-frames:v', String(totalFrames), '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p',
  path.join(root, 'pip-window-storm-preview.mp4'),
], { encoding: 'utf8' });
if (mp4.status !== 0) throw new Error(`MP4 encode failed (${mp4.status}): ${mp4.stderr}`);
const gif = spawnSync(ffmpeg, [
  '-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(timeline.fps), '-start_number', '0', '-i', path.join(renderRoot, 'pip-window_%03d.png'),
  '-f', 'lavfi', '-i', `color=c=0xEAF3F7:s=500x500:r=${timeline.fps}:d=${duration}`,
  '-filter_complex', '[1:v][0:v]overlay=shortest=1:format=auto,split[a][b];[a]palettegen[p];[b][p]paletteuse', '-loop', '0',
  path.join(root, 'pip-window-storm-preview.gif'),
], { encoding: 'utf8' });
if (gif.status !== 0) throw new Error(`GIF encode failed (${gif.status}): ${gif.stderr}`);
const samples = [];
let cursor = 0;
for (const cel of timeline.cels) {
  const input = await sharp(framePaths[cursor]).resize(220, 220, { fit: 'contain', background: '#FFFFFF' }).flatten({ background: '#FFFFFF' }).png().toBuffer();
  samples.push(input);
  cursor += cel.exposure;
}
const cols = 4, rows = Math.ceil(samples.length / cols), tiles = samples.map((input, i) => ({ input, left: (i % cols) * 220, top: Math.floor(i / cols) * 220 }));
await sharp({ create: { width: cols * 220, height: rows * 220, channels: 3, background: '#FFFFFF' } }).composite(tiles).png().toFile(path.join(root, 'rendered-contact.png'));
console.log(JSON.stringify({ frames: totalFrames, cels: timeline.cels.length, fps: timeline.fps, duration, alpha: true }));
