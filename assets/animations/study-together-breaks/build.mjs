import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dir = import.meta.dirname;
const root = path.resolve(dir, '..');
const load = async file => JSON.parse(await fs.readFile(path.join(root, file)));
const typing = await load('study-together-lottie/lottie/typing.json');
const coffee = await load('study-together-coffee/serve.json');
const dance = await load('pip/lottie/dance.json');
const art = new Map();
const ranges = {};
const layers = [];
let offset = 0;

const seat = [62, 685];
const foot = [180, 958];
const situated = [149, 1066];
const seatScale = 220 / 430;
const sofa = [52, 680];
const fx = { i: { x: .67, y: .9 }, o: { x: .32, y: .13 } };
const fixed = k => ({ a: 0, k });
const keys = points => ({ a: 1, k: points.map(([t, value], i) => ({
  t: offset + t, s: Array.isArray(value) ? value : [value], ...(i < points.length - 1 ? fx : {}),
})) });
const position = points => keys(points.map(([t, [x, y]]) => [t, [x, y, 0]]));
const xy = p => Array.isArray(p) ? fixed([...p, 0]) : p;
const prop = value => typeof value === 'number' || Array.isArray(value) ? fixed(value) : value;
const ks = (p, s = 100, a = [0, 0], o = 100, rotation = 0) => ({
  p: xy(p), s: prop(typeof s === 'number' ? [s, s, 100] : s), a: fixed([...a, 0]),
  o: prop(o), r: prop(rotation),
});
const layer = (ty, nm, ip, op, extras = {}) => ({
  ty, nm, ip: offset + ip, op: offset + op, st: 0, sr: 1, ddd: 0, ao: 0, ...extras,
});
const image = (refId, start, end, transform, name = refId) =>
  layer(2, name, start, end, { refId, ks: transform });

function store(id, bytes, w, h) {
  const asset = { id, w, h, u: '', e: 1, p: `data:image/png;base64,${bytes.toString('base64')}` };
  art.set(id, asset);
  return asset;
}

async function local(id) {
  const bytes = await fs.readFile(path.join(dir, id + '.png'));
  const { width, height } = await sharp(bytes).metadata();
  return store(id, bytes, width, height);
}
const nap = await local('nap');
const windowPose = await local('window');
const toy = await local('toy');
const stretch = await local('stretch');
const relax = await local('relax');
const walk = coffee.assets.filter(item => /^walk[1-4]$/.test(item.id));
walk.forEach(asset => art.set(asset.id, asset));
const { w: sofaWidth, h: sofaHeight } = { w: 920, h: 438 };
const sofaBytes = await sharp(path.join(root, '../environments/igloo/study-together-layers/sofa.png')).resize(sofaWidth, sofaHeight, { fit: 'fill' }).png().toBuffer();
store('sofa-occlusion', sofaBytes, sofaWidth, sofaHeight);

const cushionBounds = { left: 142, top: 210, width: 150, height: 106 };
const feather = Buffer.from('<svg width="150" height="106"><defs><filter id="soft"><feGaussianBlur stdDeviation="8"/></filter></defs><ellipse cx="76" cy="56" rx="64" ry="41" fill="white" filter="url(#soft)"/></svg>');
const cushionCrop = await sharp(sofaBytes).extract(cushionBounds).png().toBuffer();
const cushion = await sharp(cushionCrop).composite([{ input: feather, blend: 'dest-in' }]).png().toBuffer();
store('cushion', cushion, cushionBounds.width, cushionBounds.height);

const closedMask = Buffer.from('<svg width="261" height="350"><path fill="white" d="M87 258L205 248L212 247L253 263L255 270L253 276L105 282L87 273Z"/></svg>');
const closedBook = await sharp(path.join(dir, 'stretch.png')).composite([{ input: closedMask, blend: 'dest-in' }]).png().toBuffer();
store('closed-laptop', await sharp(closedBook).extract({left:85,top:247,width:172,height:37}).png().toBuffer(), 172, 37);

for (const asset of dance.assets) art.set('dance-' + asset.id, { ...asset, id: 'dance-' + asset.id });
art.set('dance-motion', {id: 'dance-motion', layers: dance.layers.map(item => item.refId ? { ...item, refId: 'dance-' + item.refId } : item)});

function typingCel(name, ip, op, opacity = 100) {
  const cel = typing.layers.find(item => item.nm === name || item.nm === 'typing ' + name);
  const data = typing.assets.find(item => item.id === cel.refId);
  art.set(data.id, data);
  const [x, y] = cel.ks.p.k;
  return image(data.id, ip, op, ks([seat[0] + x * seatScale, seat[1] + y * seatScale],
    cel.ks.s.k[0] * seatScale, [215, 270.5], opacity), name);
}

const settling = (from, to) => typingCel('break 4', from, to);
function squash(at) {
  const x = sofa[0] + cushionBounds.left;
  const y = sofa[1] + cushionBounds.top;
  return image('cushion', at, at + 17, ks(position([[at, [x, y]], [at + 5, [x, y + 4]], [at + 17, [x, y]]]),
    100, [0, 0], keys([[at, 0], [at + 5, 82], [at + 17, 0]])), 'Sofa cushions settle');
}

function body(asset, begin, finish, p, scale, opacity = 100, rotate = 0) {
  return image(asset.id, begin, finish, ks(p, scale, [asset.w / 2, asset.h - 4], opacity, rotate));
}

function walkCels(ip, op, route, direction, scale = 100, opacity = 100) {
  const p = position(route);
  return Array.from({ length: Math.ceil((op - ip) / 5) }, (_, n) => {
    const cel = walk[n % walk.length];
    let sizing;
    if (typeof scale === 'number') sizing = [direction * scale, scale, 100];
    else sizing = keys(scale.map(([t, size]) => [t, [direction * size, size, 100]]));
    return body(cel, ip + n * 5, Math.min(ip + (n + 1) * 5, op), p, sizing, opacity);
  });
}

function shadow(ip, op, route) {
  const p = route.map(([t,[x,y]]) => [t,[x,y-5]]);
  return layer(4, 'Soft floor shadow', ip, op, { ks: ks(position(p), 100, [0,0], 18), shapes: [
    {ty:'el',d:1,p:fixed([0,0]),s:fixed([92,18])}, {ty:'fl',c:fixed([.25,.13,.30,1]),o:fixed(100)},
  ]});
}

function parkedLaptop(ip, op, fadeStart = ip + 9, fadeEnd = op - 9) {
  return image('closed-laptop', ip, op, ks([147,918], 53, [0,0],
    keys([[ip,0],[fadeStart,100],[fadeEnd,100],[op,0]])));
}

function sitIn(ip, end) {
  return typingCel('break 4', ip, end, keys([[ip,0],[ip+10,100]]));
}

function animate(id, length, draw) {
  const start = offset;
  layers.push(...draw());
  offset += length;
  ranges[id] = [start, offset];
}

function closedStretch(start) {
  return [
    body(stretch, start + 11, start + 60, [183, 956], keys([[start+11,[65,64,100]],[start+28,[65,67,100]],[start+60,[65,64,100]]]),
      keys([[start+11,0],[start+20,100],[start+53,100],[start+60,0]])),
    body(relax, start, start+72, [183,956], 65,
      keys([[start,0],[start+11,100],[start+17,0],[start+54,0],[start+60,100],[start+72,0]])),
  ];
}

animate('stretch', 103, () => [
  ...closedStretch(16),
  typingCel('break 3', 0, 10),
  typingCel('break 2', 10, 21, keys([[10,100],[21,0]])),
  settling(85, 103),
  squash(77),
]);

animate('nap', 238, () => {
  const glyphs = [0,1,2].map(i => {
    const start = 31 + i * 35;
    const end = start + 57;
    const z = 9 + i * 2;
    return layer(4, 'Drifting Z', start, end, {
      ks: ks(position([[start,[234,786]],[end,[267+i*8,719-i*8]]]), 100, [0,0],
        keys([[start,0],[start+10,75],[end-13,54],[end,0]]), -13),
      shapes: [
        {ty:'sh',ks:fixed({c:false,v:[[0,0],[z,0],[0,z],[z,z]],i:[[0,0],[0,0],[0,0],[0,0]],o:[[0,0],[0,0],[0,0],[0,0]]})},
        {ty:'st',c:fixed([1,.93,.79,1]),o:fixed(100),w:fixed(3),lc:2,lj:2},
      ],
    });
  });
  const breathing = [[17,[61,58,100]],[44,[61,59.5,100]],[74,[61,58,100]],[104,[61,59.5,100]],[134,[61,58,100]],[164,[61,59,100]]];
  return [
    ...glyphs,
    body(nap, 13, 167, [179,956], keys(breathing), keys([[13,0],[25,100],[154,100],[167,0]])),
    typingCel('break 3', 0, 19),
    ...closedStretch(159),
    settling(221, 238),
    squash(13),
  ];
});

animate('walk', 221, () => {
  const out = [[8,foot],[28,situated],[50,[119,1143]],[72,[136,1195]]];
  const wander = [[94,[136,1195]],[109,[183,1221]],[128,[240,1189]]];
  const home = [[148,[240,1189]],[182,[170,1090]],[209,foot]];
  return [
    ...walkCels(8,73,out,-1,94,keys([[8,0],[22,100]])),
    body(walk[3], 73,94,[136,1195], 94, 100, keys([[73,0],[81,-5],[91,0]])),
    ...walkCels(94,129,wander,1,94),
    body(walk[2], 129,148,[240,1189], 94, 100, keys([[129,0],[138,5],[147,0]])),
    ...walkCels(148,210,home,-1,94,keys([[148,100],[195,100],[210,0]])),
    typingCel('break 4',0,20,keys([[0,100],[20,0]])),
    sitIn(197,221),
    parkedLaptop(17,205),
    squash(201),
    shadow(21,197,[...out,[94,[136,1195]],...wander.slice(1),...home]),
  ];
});

animate('window', 268, () => {
  const approach = [[7,foot],[27,[91,1007]],[43,[62,915]],[64,[62,775]]];
  const behind = [[64,[62,775]],[85,[135,720]],[110,[280,714]]];
  const homeFar = [[165,[280,714]],[192,[135,720]],[207,[62,775]]];
  const home = [[207,[62,775]],[232,[62,929]],[242,[107,1022]],[256,foot]];
  return [
    parkedLaptop(15,254),
    // After passing the arm, the base of the rear-facing actor is occluded by the sofa.
    image('sofa-occlusion',65,207,ks(sofa)),
    body(windowPose,107,168,[278,714], keys([[107,[52,52,100]],[130,[52,53.2,100]],[166,[52,52,100]]]),
      keys([[107,0],[113,100],[161,100],[168,0]]),
      keys([[107,0],[124,0],[136,-5],[146,-3],[158,0]])),
    ...walkCels(63,113,behind,1,[[63,83],[110,77]],keys([[63,100],[108,100],[113,0]])),
    ...walkCels(161,208,homeFar,-1,[[161,77],[207,83]],keys([[161,0],[168,100]])),
    ...walkCels(7,65,approach,-1,[[7,94],[64,83]],keys([[7,0],[21,100]])),
    ...walkCels(207,257,home,1,[[207,83],[246,94]],keys([[207,100],[247,100],[257,0]])),
    typingCel('break 4',0,20,keys([[0,100],[20,0]])),
    sitIn(246,268),
    squash(249),
    shadow(20,246,[...approach,...behind.slice(1),...homeFar,...home.slice(1)]),
  ];
});

animate('play', 189, () => {
  const danceSpot = [166, 1110];
  const out = [[12,foot],[28,situated],[40,danceSpot]];
  const home = [[129,danceSpot],[145,situated],[173,foot]];
  return [
    body(toy, 43, 141, position([[43,[230,1107]],[65,[230,1107]],[82,[254,1097]],[107,[279,1107]],[141,[279,1107]]]),
      24, keys([[43,0],[49,100],[132,100],[141,0]]), keys([[43,0],[65,0],[107,130],[141,130]])),
    layer(0, 'Pip dances and taps the knitted toy', 39, 135, {
      refId:'dance-motion', w:720,h:720, st:offset+16, ks:ks(danceSpot,41,[368,641],
        keys([[39,0],[45,100],[123,100],[135,0]])),
    }),
    ...walkCels(12,45,out,-1,94,keys([[12,0],[23,100],[39,100],[45,0]])),
    ...walkCels(126,174,home,1,94,keys([[126,0],[135,100],[162,100],[174,0]])),
    typingCel('break 4',0,24,keys([[0,100],[24,0]])),
    sitIn(160,189),
    parkedLaptop(20,171),
    squash(163),
    shadow(24,164,[...out,...home]),
  ];
});

animate('relax', 178, () => [
  body(relax, 12, 156, [183,956], keys([[12,[65,64,100]],[52,[65,65.1,100]],[97,[65,64,100]],[143,[65,65.1,100]],[156,[65,64,100]]]),
    keys([[12,0],[24,100],[145,100],[156,0]])),
  typingCel('break 3', 0, 22, keys([[0,100],[22,0]])),
  settling(149, 178),
  squash(14),
]);

const composition = {
  v:'5.12.2',nm:'Study Together break activities',fr:30,ip:0,op:offset,w:1024,h:1536,ddd:0,
  assets:[...art.values()], layers:layers.map((item,index)=>({...item,ind:index+1})),
};
await fs.writeFile(path.join(dir,'activities.json'),JSON.stringify(composition));
await fs.writeFile(path.join(dir,'ranges.json'),JSON.stringify(ranges,null,2)+'\n');
