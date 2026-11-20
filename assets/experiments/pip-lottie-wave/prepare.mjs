import sharp from 'sharp';
import fs from 'node:fs/promises';
const dir='assets/experiments/pip-lottie-wave';
const src='assets/animations/pip-sofa-study/source/baseline.png';
const W=1176,H=1337;
const arm='M183 780 C205 750 260 760 327 783 C412 812 532 850 585 900 C610 923 626 960 611 983 C598 1009 562 1010 518 997 C416 974 310 916 257 881 C220 857 190 818 183 780 Z';
const svg=(s)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`);
const mask=svg(`<path d="${arm}" fill="white"/>`);
await sharp(src).composite([{input:mask,blend:'dest-in'}]).png().toFile(dir+'/flipper.png');
// Concealed shoulder and torso surface, painted as overlapping curved geometry.
const patch=svg(`<defs><radialGradient id="b" cx="35%" cy="15%" r="100%"><stop stop-color="#58566e"/><stop offset=".55" stop-color="#434159"/><stop offset="1" stop-color="#34334b"/></radialGradient></defs><path d="${arm}" fill="url(#b)"/><ellipse cx="235" cy="808" rx="48" ry="58" fill="url(#b)"/>`);
await sharp(src).composite([{input:patch}]).png().toFile(dir+'/body.png');
const a=await fs.readFile(dir+'/body.png'),b=await fs.readFile(dir+'/flipper.png');
await fs.writeFile(dir+'/creator-params.json',JSON.stringify({body:a.toString('base64'),flipper:b.toString('base64')}));
