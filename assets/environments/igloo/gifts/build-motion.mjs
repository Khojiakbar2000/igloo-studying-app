import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const here = import.meta.dirname;
const steady = k => ({ a: 0, k });
const ease = (t, s) => ({ t, s, i: { x: [.65], y: [1] }, o: { x: [.3], y: [0] } });
const keys = (frames) => ({ a: 1, k: frames.map(([t, s]) => ease(t, s)) });
const duration = 78;
function layer(ty, ind, nm, position, options = {}) {
  return { ty, ind, nm, ip: 0, op: duration, st: 0, sr: 1, ks: {
    o: options.opacity ?? steady(100), p: position, s: options.scale ?? steady([100,100,100]),
    r: options.rotation ?? steady(0), a: steady(options.anchor ?? [0,0,0]),
  } };
}
const colors = [[.67,.84,1],[.51,.79,1],[.78,.57,1],[1,.82,.44]];
for (let rarity = 0; rarity < colors.length; rarity++) {
  const color = colors[rarity];
  const assets = await Promise.all([rarity, rarity + 4].map(async (tile, i) => {
    const { data, info } = await sharp(path.join(here, `box-${tile}.webp`)).resize({ width: 200 }).png().toBuffer({ resolveWithObject: true });
    return { id: i === 0 ? 'body' : 'lid', w: info.width, h: info.height, u: '', p: 'data:image/png;base64,' + data.toString('base64'), e: 1 };
  }));
  const [body,lid] = assets;
  const at = (asset, timeline, rotation) => ({ ...layer(2, asset === body ? 21 : 20, asset.id,
    keys(timeline), { rotation: keys(rotation), anchor: [asset.w/2,asset === body ? 12 : asset.h-14,0] }), refId: asset.id });
  const drift = [[0,[88,145,0]],[10,[159,155,0]],[16,[151,155,0]],[20,[169,155,0]],[25,[156,155,0]],[30,[160,155,0]]];
  const shake = [[0,[-9]],[10,[0]],[16,[-4]],[20,[4]],[25,[-2]],[30,[0]]];
  const layers = Array.from({length: 5 + rarity*2}, (_,i) => {
    const x = 120 + (i*19)%80;
    const y = 160 - (i*17)%70;
    return { ...layer(4,i+1,'glow mote',keys([[31,[160,155,0]],[58,[x,y,0]],[77,[x,y-15,0]]]),{
      opacity: keys([[30,[0]],[41,[90]],[61,[60]],[77,[0]]]),
    }), shapes: [
      {ty:'el',p:steady([0,0]),s:steady([4+i%4,4+i%4])},
      {ty:'fl',c:steady([...color,1]),o:steady(100),r:1},
    ] };
  });
  layers.push({ ...layer(4, 18, 'Warm light in the chest', steady([159,154,0]), {
    opacity: keys([[32,[0]],[43,[36]],[58,[22]],[77,[0]]]),
    scale: keys([[32,[25,25,100]],[57,[112,122,100]],[77,[135,146,100]]]),
  }), shapes: [
    {ty:'el',p:steady([0,-13]),s:steady([70,60])},
    {ty:'gf',o:steady(100),r:1,t:2,s:steady([0,-13]),e:steady([35,-13]),h:steady(0),a:steady(0),
      g:{p:2,k:steady([0,...color,1,...color,0,1,1,0])}},
  ]});
  layers.push(at(lid,[...drift,[44,[233,102,0]],[61,[242,139,0]],[77,[241,142,0]]],[...shake,[46,[26]],[65,[21]]]));
  layers.push(at(body,drift,shake));
  await writeFile(path.join(here,`open-${rarity}.json`),JSON.stringify({v:'5.7.4',fr:30,ip:0,op:duration,w:320,h:320,ddd:0,assets,layers}));
}

// Keep the existing indexed study animation. Recolor the knitted teal material only,
// using the same cel bounds and the original pose timing.
const original = JSON.parse(await readFile(path.join(here,'../../../animations/study-together-lottie/lottie/typing.json'),'utf8'));
const dyed = {};
for (const asset of original.assets.filter(item => item.e && item.p.startsWith('data:image/png;base64,'))) {
  const { data, info } = await sharp(Buffer.from(asset.p.split(',')[1],'base64')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const overlay = Buffer.alloc(data.length);
  let pixels = 0;
  for (let y = Math.floor(info.height*.44); y < info.height*.89; y++) {
    for (let x=0; x<info.width*.78; x++) {
      const i=(y*info.width+x)*4;
      const [r,g,b,a]=data.subarray(i,i+4);
      if (a<24 || g-r<8 || g-b<0 || b-r<4 || r>182) continue;
      const s=Math.min(1,(g-r)/18,(g-b+8)/12);
      overlay[i]=Math.min(255,r+(g-r+55)*s);
      overlay[i+1]=Math.max(0,g-35*s);
      overlay[i+2]=Math.max(0,b-24*s);
      overlay[i+3]=a;
      pixels++;
    }
  }
  if(pixels>30) {
    const png=await sharp(overlay,{raw:info}).png({compressionLevel:9,palette:true,colours:192,quality:90}).toBuffer();
    dyed[asset.id]='data:image/png;base64,'+png.toString('base64');
  }
}
await writeFile(path.join(here,'berry-study-cels.json'),JSON.stringify(dyed));
