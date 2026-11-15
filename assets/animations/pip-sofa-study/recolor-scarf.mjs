import sharp from 'sharp';

const source = new URL('./source/baseline.png', import.meta.url);
const output = new URL('./experiment-scarf-berry.png', import.meta.url);
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

function toHsv(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return [hue, max ? delta / max : 0, max];
}

function toRgb(hue, saturation, value) {
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const match = value - chroma;
  let channels;
  if (hue < 60) channels = [chroma, x, 0];
  else if (hue < 120) channels = [x, chroma, 0];
  else if (hue < 180) channels = [0, chroma, x];
  else if (hue < 240) channels = [0, x, chroma];
  else if (hue < 300) channels = [x, 0, chroma];
  else channels = [chroma, 0, x];
  return channels.map((channel) => Math.round((channel + match) * 255));
}

let recolored = 0;
for (let y = 580; y < 1020; y += 1) {
  for (let x = 24; x < 740; x += 1) {
    const index = (y * info.width + x) * 4;
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const scarfLike = data[index + 3] > 80
      && green > red * 1.11
      && blue > red * 1.08
      && Math.abs(green - blue) < 48
      && green > 54
      && green < 190;
    if (!scarfLike) continue;

    const [hue, saturation, value] = toHsv(red, green, blue);
    if (hue < 145 || hue > 210) continue;
    [data[index], data[index + 1], data[index + 2]] = toRgb(335, Math.max(saturation, 0.24), value);
    recolored += 1;
  }
}

await sharp(data, { raw: info }).png().toFile(output);
console.log(`Recolored ${recolored} scarf pixels to berry while retaining their brightness and texture.`);
