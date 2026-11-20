import sharp from 'sharp';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url).pathname;
const sourcePath = `${root}source/approved-body-with-scarf.png`;
const underlayPath = `${root}source/body-attempt-scaled.png`;
const W = 304, H = 500;
const { data: src } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data: under } = await sharp(underlayPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

// Trace the three visible pieces of the approved scarf (neck wrap and two
// ends). This silhouette mask keeps the dark outline and complete yarn weave.
const scarfPaths = [
  'M37 280 C59 274 91 276 113 278 L190 280 C216 275 242 275 260 280 C273 284 279 294 278 308 L276 319 C271 332 247 340 224 342 C171 343 106 341 55 337 C39 334 32 325 33 310 L34 294 C34 287 34 283 37 280 Z',
  'M201 280 C218 274 240 276 255 284 C269 291 274 309 277 331 L282 360 C284 376 276 390 258 394 L226 394 C211 392 204 384 205 370 L208 342 C213 319 207 296 201 280 Z',
];
const pathElements = scarfPaths.map(d => `<path d="${d}" fill="white"/>`).join('');
const maskSvg = (stroke) => Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${scarfPaths.map(d => `<path d="${d}" fill="white" ${stroke ? 'stroke="white" stroke-width="4"' : ''}/>`).join('')}</svg>`);
const rawMask = new Uint8Array(await sharp(maskSvg(false)).extractChannel('alpha').raw().toBuffer());
const removeMask = new Uint8Array(await sharp(maskSvg(true)).extractChannel('alpha').raw().toBuffer());
const bodyPatchSvg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><path d="M41 270 C73 268 103 270 147 271 C194 271 234 267 266 271 C278 281 281 310 282 339 C284 366 280 391 267 406 C246 420 214 423 180 423 L93 423 C61 420 39 411 29 396 C24 368 27 335 27 309 C28 288 32 276 41 270 Z" fill="white"/></svg>`);
const expandedMask = new Uint8Array(await sharp(bodyPatchSvg).blur(7).extractChannel('alpha').raw().toBuffer());

// Slightly expand the underpaint to remove every old scarf edge. Softly blend
// the generated neck geometry only beneath the accessory; every pixel outside
// that small region remains from the approved body artwork.
const underMask = expandedMask;

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = 0; const l = (max + min) / 2;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let q;
  if (h < 60) q = [c, x, 0]; else if (h < 120) q = [x, c, 0];
  else if (h < 180) q = [0, c, x]; else if (h < 240) q = [0, x, c];
  else if (h < 300) q = [x, 0, c]; else q = [c, 0, x];
  return q.map(v => Math.max(0, Math.min(255, Math.round((v + m) * 255))));
}

const clean = Buffer.from(src);
for (let p = 0; p < W * H; p++) {
  const m = underMask[p] / 255;
  if (!m && removeMask[p] <= 245) continue;
  const i = p * 4;
  if (removeMask[p] > 245) {
    clean.set(under.subarray(i, i + 4), i);
    continue;
  }
  const sa = src[i + 3] / 255, ua = under[i + 3] / 255;
  const oa = sa * (1 - m) + ua * m;
  for (let c = 0; c < 3; c++) {
    const premult = src[i + c] * sa * (1 - m) + under[i + c] * ua * m;
    clean[i + c] = oa ? Math.round(premult / oa) : 0;
  }
  clean[i + 3] = Math.round(oa * 255);
}
for (let y = 270; y < 404; y++) for (let x = 24; x < 284; x++) {
  const i = (y * W + x) * 4;
  const [r, g, b] = src.subarray(i, i + 3);
  if (Math.min(g - r, b - r) > 8 && g > 42 && Math.abs(g - b) < 48) clean.set(under.subarray(i, i + 4), i);
}
await sharp(clean, { raw: { width: W, height: H, channels: 4 } }).png().toFile(`${root}character/body-no-scarf.png`);

const variants = [
  { id: 'teal', label: 'Original Teal', hue: null, sat: 1 },
  { id: 'red', label: 'Cozy Red', hue: 8, sat: 1.22 },
  { id: 'lavender', label: 'Soft Lavender', hue: 274, sat: 0.84 },
];
for (const v of variants) {
  const out = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    const i = p * 4, a = Math.round(rawMask[p] * src[i + 3] / 255);
    if (!a) continue;
    let [r, g, b] = src.subarray(i, i + 3);
    if (v.hue !== null) {
      let [h, s, l] = rgbToHsl(r, g, b);
      // Keep the yarn's light/dark texture and outline contrast, changing hue only.
      h = v.hue; s = Math.max(0.12, Math.min(0.56, s * v.sat + (v.hue === 8 ? 0.18 : 0.07)));
      [r, g, b] = hslToRgb(h, s, l);
    }
    out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a;
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(`${root}scarves/scarf-${v.id}.png`);
  await sharp(clean, { raw: { width: W, height: H, channels: 4 } })
    .composite([{ input: out, raw: { width: W, height: H, channels: 4 } }])
    .png().toFile(`${root}previews/pip-${v.id}.png`);
}

const catalogVariants = await Promise.all(variants.map(async ({ id, label }) => ({
  id, label, file: `scarves/scarf-${id}.png`, sizeBytes: (await fs.stat(`${root}scarves/scarf-${id}.png`)).size
})));
await fs.writeFile(`${root}workspace/catalog.json`, JSON.stringify({
  source: 'Approved storybook Pip body; scarf pixels separated using a local color-region mask.',
  dimensions: { width: W, height: H },
  variants: catalogVariants,
  body: { file: 'character/body-no-scarf.png', sizeBytes: (await fs.stat(`${root}character/body-no-scarf.png`)).size },
  method: 'Scarf variants preserve the same extracted knitting texture, silhouette, alpha and outline. Red and lavender are hue recolors of the existing approved scarf; no character pixels are regenerated.'
}, null, 2));
