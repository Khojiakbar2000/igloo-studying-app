import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = import.meta.dirname;
const hold = k => ({ a: 0, k });
const smooth = ([t, s]) => ({ t, s, i: { x: [.65], y: [1] }, o: { x: [.3], y: [0] } });
const track = keys => ({ a: 1, k: keys.map(smooth) });
const canvas = 320;
const elements = new Map();
async function asset(id, file, size = 225) {
  const { data, info } = await sharp(path.resolve(root,file)).resize({ width: size, height: size, fit: 'inside' })
    .png({ palette: true, quality: 86 }).toBuffer({ resolveWithObject: true });
  elements.set(id, { id, w: info.width, h: info.height, u: '', p: 'data:image/png;base64,' + data.toString('base64'), e: 1 });
}
for(const [i,id] of ['egg','crack','shell','wave','heart','joy'].entries()) await asset(id,`story-${i}.png`);
await asset('notebook','prop-0.png',120);
await asset('clock','prop-7.png',120);
await asset('door','door.png',115);
for(let i=1;i<=4;i++) await asset(`walk${i}`,`../../animations/igloo-penguin-walk/frame-0${i}.png`,110);

const point = (x,y) => [x,y,0];
const scale = (x,y=x) => [x,y,100];
function image(refId, ip, op, position, sizing, rotation=hold(0), opacity=hold(100)) {
  const art=elements.get(refId);
  return { ty:2, refId, ip, op, st:0, sr:1, ks:{
    a:hold([art.w/2,art.h,0]), p:position, s:sizing, r:rotation,o:opacity,
  } };
}
function sparkles(start,length,count) {
  return Array.from({length:count},(_,i)=>{
    const t=start+i%4*3, end=Math.min(length-1,t+29), x=40+((i*49)%240),y=80+((i*29)%167);
    return {ty:4,ip:t,op:end+1,sr:1,st:0,ks:{
      a:hold(point(0,0)),p:track([[t,point(160,183)],[end,point(x,y)]]),r:hold(0),s:hold(scale(100)),
      o:track([[t,[0]],[t+7,[85]],[end,[0]]]),
    },shapes:[
      {ty:'el',p:hold([0,0]),s:hold([i%2?4:7,i%2?4:7])},
      {ty:'fl',c:hold(i%2?[.99,.89,.64,1]:[.89,.96,1,1]),o:hold(100),r:1},
    ]};
  });
}
const pos = (x,y)=>hold(point(x,y));
const size = value=>hold(scale(value));
const wobble=track([[0,[0]],[5,[-8]],[12,[6]],[19,[-3]],[27,[0]]]);
const bounce=track([[0,point(157,280)],[13,point(157,225)],[29,point(157,281)],[36,point(157,273)],[43,point(157,280)]]);
const tracks = {
  crack: { length:30, layers:[image('egg',0,13,pos(160,280),size(88),wobble),image('crack',13,30,pos(160,280),size(88),wobble)] },
  shake: { length:34, layers:[image('crack',0,34,pos(160,280),track([[0,scale(88)],[8,scale(91,84)],[17,scale(84,93)],[32,scale(88)]]),wobble)] },
  hatch: { length:92, layers:[
    ...sparkles(57,92,13),
    image('shell',32,92,pos(160,284),size(91)),
    image('wave',23,92,track([[23,point(159,327)],[36,point(159,285)],[53,point(159,266)],[61,point(159,275)],[91,point(159,275)]]),
      track([[23,scale(54)],[34,scale(54)],[55,scale(85)],[91,scale(85)]]),
      track([[55,[0]],[64,[-4]],[76,[3]],[90,[0]]]),track([[23,[0]],[32,[100]]])),
    image('crack',0,32,pos(160,280),size(88),wobble,track([[20,[100]],[32,[0]]])),
  ] },
  heart: {length:72,layers:[...sparkles(25,72,5),image('heart',0,72,pos(160,280),
    track([[0,scale(94)],[18,scale(100,97)],[32,scale(96,101)],[51,scale(99,99)],[70,scale(98)]]),
    track([[0,[0]],[24,[-4]],[52,[3]],[71,[0]]]))]},
  name: {length:43,layers:[...sparkles(8,43,6),image('joy',0,43,bounce,size(85),
    track([[0,[0]],[14,[-4]],[30,[2]],[42,[0]]]))]},
  joy: { length:83,layers:[...sparkles(14,83,16),image('joy',0,83,bounce,size(91),
    track([[0,[0]],[15,[-5]],[30,[0]],[44,[6]],[57,[-5]],[69,[4]],[82,[0]]]))]},
  notebook: { length:62,layers:[
    image('notebook',0,62,pos(218,284),track([[0,scale(52)],[18,scale(112)],[29,scale(100)],[61,scale(100)]]),
      track([[0,[-19]],[21,[9]],[60,[2]]])),
    image('wave',0,62,pos(136,278),size(79),track([[0,[0]],[22,[3]],[60,[0]]])),
  ]},
  clock: {length:58,layers:[
    image('clock',0,58,pos(224,278),size(94),track([[0,[0]],[10,[-14]],[19,[9]],[28,[-5]],[38,[0]],[57,[0]]])),
    image('wave',0,58,pos(137,282),size(79)),
  ]},
  enter: {length:104,layers:[
    {ty:4,ip:18,op:89,sr:1,st:0,ks:{a:hold(point(0,0)),p:pos(112,228),r:hold(0),s:track([[18,scale(54)],[38,scale(104)],[71,scale(125)]]),o:track([[18,[0]],[37,[67]],[63,[38]],[85,[0]]])},
      shapes:[{ty:'el',p:hold([0,0]),s:hold([118,51])},{ty:'gf',o:hold(100),r:1,t:2,s:hold([0,0]),e:hold([59,10]),h:hold(0),a:hold(0),g:{p:2,k:hold([0,1,.76,.37,1,.99,.55,.28,0,.6,1,0])}}]},
    image('door',0,42,track([[0,point(115,242)],[19,point(115,242)],[39,point(84,240)]]),
      track([[0,scale(75,65)],[18,scale(75,65)],[38,scale(0,65)]]),hold(0),track([[0,[100]],[34,[100]],[41,[0]]])),
    ...sparkles(28,78,8),
    ...Array.from({length:12},(_,i)=>{
      const t=32+i*5;
      return image(`walk${i%4+1}`,t,t+5,track([[32,point(221,285)],[92,point(112,234)]]),
        track([[32,scale(-89,89)],[86,scale(-64,64)]]),hold(0),track([[32,[100]],[74,[100]],[92,[0]]]));
    }),
    image('wave',0,32,pos(221,285),size(48),track([[0,[0]],[12,[-5]],[22,[5]],[31,[0]]])),
  ]},
};
for(const [name, clip] of Object.entries(tracks)){
  const used=[...new Set(clip.layers.flatMap(item=>item.refId?[item.refId]:[]))];
  const data={v:'5.7.4',w:name==='enter'?400:canvas,h:canvas,fr:30,ip:0,op:clip.length,ddd:0,assets:used.map(id=>elements.get(id)),
    layers:clip.layers.map((item,index)=>({...item,ind:index+1}))};
  await fs.writeFile(path.join(root,`${name}.json`),JSON.stringify(data));
}
