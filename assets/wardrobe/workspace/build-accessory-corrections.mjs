import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('assets/wardrobe');
const items = path.join(root, 'items');
const source = async (name) => path.join(items, name);
const out = (name) => path.join(items, name);

// This is the approved 304x500 body art's face coordinate space. Lens fills are
// intentionally omitted so Pip's painted eyes and eyelid animation stay visible.
const glassesSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="304" height="500" viewBox="0 0 304 500">
  <defs>
    <linearGradient id="bronze" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#B98A52"/><stop offset=".48" stop-color="#8D673D"/><stop offset="1" stop-color="#6C5135"/>
    </linearGradient>
  </defs>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="#4E4037" stroke-opacity=".32" stroke-width="6" transform="translate(0 1)">
      <circle cx="111" cy="185" r="34"/><circle cx="203" cy="185" r="34"/>
      <path d="M145 182 Q157 176 169 182 M77 181 Q69 179 64 184 M237 181 Q245 179 250 184"/>
    </g>
    <g stroke="url(#bronze)" stroke-width="4.5">
      <circle cx="111" cy="184" r="34"/><circle cx="203" cy="184" r="34"/>
      <path d="M145 181 Q157 175 169 181 M77 180 Q69 178 64 183 M237 180 Q245 178 250 183"/>
    </g>
    <g stroke="#F8E6BE" stroke-opacity=".82" stroke-width="1.7">
      <path d="M86 160 Q97 151 109 150 M178 160 Q189 151 201 150"/>
      <path d="M77 181 Q69 179 65 183 M237 181 Q245 179 249 183"/>
    </g>
  </g>
</svg>`;
await fs.writeFile(out('glasses-storybook-v2.svg'), glassesSvg);
await sharp(Buffer.from(glassesSvg)).png().toFile(out('glasses-body-layer-v2.png'));

// A petite, side-perched crown follows the head controller. The position is in
// body-art coordinates, not screen coordinates; the three tufts remain clear.
const crown = await sharp(await source('crown-art.png'))
  .resize(92, 54, { fit: 'fill' })
  .rotate(8, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png().toBuffer();
await sharp({ create: { width: 304, height: 500, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: crown, left: 169, top: 43 }])
  .png().toFile(out('crown-body-layer-v2.png'));

// Keep the generated watercolor helmet shell, remove its duplicate plume, and
// open a tuft-shaped notch. The notch lets Pip's original feathers show through.
const helmetSource = await sharp(await source('knight-helmet-art.png')).png().toBuffer();
const helmetMask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="165" height="142" viewBox="0 0 165 142">
  <defs><mask id="tuft-opening"><rect width="165" height="142" fill="white"/><path fill="black" d="M51 0H114C120 13 119 26 111 37C104 47 94 53 82 56C70 53 60 47 53 37C45 26 45 13 51 0Z"/></mask></defs>
  <rect width="165" height="142" fill="white" mask="url(#tuft-opening)"/>
</svg>`);
const helmet = await sharp(helmetSource).composite([{ input: helmetMask, blend: 'dest-in' }]).png().toBuffer();
await sharp({ create: { width: 304, height: 500, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: helmet, left: 69, top: -19 }])
  .png().toFile(out('knight-helmet-body-layer-v2.png'));

// The generated chest crop had a fully opaque last row spanning all 190 px.
// Fade only its last 9 rows, then scale it to Pip's actual torso width.
const chest = await sharp(await source('knight-chest-art.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let y = 119; y < chest.info.height; y += 1) {
  const fade = Math.max(0, Math.min(1, (127 - y) / 8));
  for (let x = 0; x < chest.info.width; x += 1) {
    const alphaIndex = (y * chest.info.width + x) * 4 + 3;
    chest.data[alphaIndex] = Math.round(chest.data[alphaIndex] * fade);
  }
}
const chestClean = await sharp(chest.data, { raw: chest.info }).png().toBuffer();
const chestSized = await sharp(chestClean).resize(154, 104, { fit: 'contain' }).png().toBuffer();
await sharp({ create: { width: 304, height: 500, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: chestSized, left: 75, top: 335 }])
  .png().toFile(out('knight-chest-body-layer-v2.png'));

// Fitted guards are scaled down and centered inside the exact Lottie flipper
// canvases. Their images share the rig's 85x96 / 86x96 pixels and pivots.
const armSpecs = [
  { name: 'knight-left-arm-layer-v2.png', art: 'knight-flipper-left-art.png', width: 85, left: 20 },
  { name: 'knight-right-arm-layer-v2.png', art: 'knight-flipper-right-art.png', width: 86, left: 20 },
];
for (const arm of armSpecs) {
  const fitted = await sharp(await source(arm.art)).resize(44, 52, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: arm.width, height: 96, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fitted, left: arm.left, top: 28 }])
    .png().toFile(out(arm.name));
}

// Boots now sit over the feet at the ankle line while keeping the source foot
// transform/pivot. The enlarged toe cap prevents the boot from appearing loose.
const boot = await sharp(await source('knight-boot-art.png')).resize(48, 42, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
await sharp({ create: { width: 49, height: 45, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: boot, left: 0, top: 2 }])
  .png().toFile(out('knight-left-foot-layer-v2.png'));
await sharp({ create: { width: 48, height: 45, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: await sharp(boot).flop().png().toBuffer(), left: 1, top: 2 }])
  .png().toFile(out('knight-right-foot-layer-v2.png'));

console.log('Created versioned, body-aligned wardrobe correction layers.');
