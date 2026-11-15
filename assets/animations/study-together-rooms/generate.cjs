/* Rebuild the independent environmental Lottie loops. No character data is read or changed. */
const fs = require('fs');
const path = require('path');
const manifest = require('./sprites/manifest.json');
const END = 384, W = 1024, H = 1536;
const constant = (k) => ({ a: 0, k });
const track = (keys, linear = false) => ({ a: 1, k: keys.map(([t, s], i) => ({ t, s: Array.isArray(s) ? s : [s], ...(i < keys.length - 1 ? { o: { x: linear ? 0 : .42, y: 0 }, i: { x: linear ? 1 : .58, y: 1 } } : {}) })) });
const rgba = (hex) => hex.match(/\w\w/g).map((v) => parseInt(v, 16) / 255);
const vertices = (v) => ({ c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) });
const box = (x, y, w, h) => vertices([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);

function scene(id) {
  let index = 1;
  const layers = [], assets = [], assetIds = new Set();
  const ks = (x, y) => ({ a: constant([0,0,0]), p: constant([x,y,0]), s: constant([100,100,100]), r: constant(0), o: constant(100) });
  function layer(name, x, y, extra = {}) { return { ind: index++, nm: name, ip: 0, op: END, st: 0, sr: 1, ks: ks(x,y), ...extra }; }
  function ellipse(name, x, y, w, h, color, opacity = 100) {
    const l = layer(name,x,y,{ ty:4, shapes:[{ty:'el',p:constant([0,0]),s:constant([w,h]),d:1},{ty:'fl',c:constant(rgba(color)),o:constant(100),r:1}] });
    l.ks.o = constant(opacity); layers.unshift(l); return l;
  }
  function polygon(name, points, color, opacity = 100) {
    const l = layer(name,0,0,{ty:4,shapes:[{ty:'sh',ks:constant(vertices(points))},{ty:'fl',c:constant(rgba(color)),o:constant(100),r:1}]});
    l.ks.o=constant(opacity);layers.unshift(l);return l;
  }
  function image(name, sprite, x, y, width, { bottom = false, mirrored = false } = {}) {
    const meta = manifest[sprite];
    if (!assetIds.has(sprite)) { assets.push({ id:sprite,w:meta.w,h:meta.h,e:1,p:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'sprites',sprite+'.png')).toString('base64'),u:'' });assetIds.add(sprite); }
    const l=layer(name,x,y,{ty:2,refId:sprite});
    l.ks.a=constant([meta.w/2,bottom?meta.h:meta.h/2,0]);
    const scale=width/meta.w*100;l.ks.s=constant([mirrored?-scale:scale,scale,100]);
    layers.unshift(l);return l;
  }
  function sway(l, x, y, dx=5, dy=3, angle=1) {
    l.ks.p=track([[0,[x,y,0]],[END/2,[x+dx,y+dy,0]],[END,[x,y,0]]]);
    l.ks.r=track([[0,-angle],[END/2,angle],[END,-angle]]);return l;
  }
  function fade(l, maximum=75) { l.ks.o=track([[0,0],[32,maximum],[END-32,maximum],[END,0]]);return l; }
  function drift(l,x,y,dx,dy) { l.ks.p=track([[0,[x,y,0]],[END,[x+dx,y+dy,0]]],true);return l; }
  function glow(name,x,y,w,h) { const l=ellipse(name,x,y,w,h,'FFD791',3);l.ks.o=track([[0,2],[96,6],[192,3],[288,5],[END,2]]);return l; }
  function dust(count,colour='FFE9BB',y0=120,yRange=520) {
    for(let i=0;i<count;i++){const x=65+(i*137)%900,y=y0+(i*83)%yRange;const l=ellipse('Drifting mote '+i,x,y,2+i%3,2+i%3,colour,20);drift(l,x,y,12+(i%4)*6,-24-i%5*9);fade(l,14+i%4*7);}
  }
  function clip(name, captured, mask) {
    for(const l of captured)layers.splice(layers.indexOf(l),1);
    assets.push({id:name,layers:captured});
    const l=layer(name,0,0,{ty:0,refId:name,w:W,h:H,hasMask:true,masksProperties:[{inv:false,mode:'a',pt:constant(mask),o:constant(100),x:constant(0)}]});layers.unshift(l);return l;
  }
  function fish(count, x0=180, x1=850, y0=390, ySpan=210) {
    for(let i=0;i<count;i++){
      const left=i%2===0, x=left?x0-60:x1+60, end=left?x1+60:x0-60, y=y0+(i*57)%ySpan;
      const f=image('Swimming fish '+i,left?'orange-fish':'blue-fish',x,y,26+i%3*9);
      f.ks.p=track([[0,[x,y,0]],[END/2,[(x+end)/2,y-10,0]],[END,[end,y,0]]],true);fade(f,90);
    }
  }
  function bubbles(count,x0=180,yBottom=645,yTop=340) {
    for(let i=0;i<count;i++){const x=x0+(i*89)%650;const b=ellipse('Rising bubble '+i,x,yBottom+20,3+i%4,3+i%4,'CEEFF7',45);drift(b,x,yBottom+20,12,yTop-yBottom-60);fade(b,28+i%3*10);}
  }
  function kelp(count) {
    for(let i=0;i<count;i++){const x=i%2?820-i*7:185+i*12;const k=image('Swaying aquatic plant '+i,'kelp',x,637,42+i%2*12,{bottom:true,mirrored:i%2===1});sway(k,x,637,0,0,2+i%2);k.ks.o=constant(78);}
  }
  if(id==='library') {
    dust(19);glow('Reading-lamp warmth',512,270,120,140);
    // A painted open book on the high shelf, with a cream page curling across its spine.
    image('Open shelf book','book',214,301,55);
    const page=polygon('Occasional turning page',[[213,287],[236,286],[239,308],[214,311]],'EAD7A5',0);
    const pageA=vertices([[213,287],[236,286],[239,308],[214,311]]),pageB=vertices([[212,287],[214,286],[215,310],[213,311]]),pageC=vertices([[191,288],[212,287],[213,311],[188,309]]);
    page.shapes[0].ks=track([[0,pageA],[168,pageA],[180,pageB],[194,pageC],[END,pageC]]);
    page.ks.o=track([[0,0],[166,0],[169,85],[194,85],[202,0],[END,0]]);
  }
  if(id==='cafe') {
    const rain=[];
    for(let i=0;i<36;i++){const x=173+(i*97)%665,y=385+(i*49)%260;const l=ellipse('Sliding raindrop '+i,x,y,1.5,8+i%3*5,'C4E5F3',30);drift(l,x,y,-7,40+i%3*14);fade(l,18+i%4*6);rain.push(l);}
    for(let i=0;i<2;i++){
      const car=polygon('Passing city car '+i,[[-24,5],[-23,-3],[-12,-4],[-7,-11],[10,-11],[18,-4],[25,-2],[26,5]],i?'405D70':'896F62',65);
      car.ks.p=track([[0,[i?900:130,649+i*9,0]],[END,[i?130:900,649+i*9,0]]],true);fade(car,70);rain.push(car);
      const lights=ellipse('Passing headlights '+i,0,0,12,3,'FFD6A0',60);lights.ks.p=track([[0,[i?880:155,650+i*9,0]],[END,[i?110:925,650+i*9,0]]],true);fade(lights,60);rain.push(lights);
    }
    clip('Rain and traffic beyond glass',rain,box(171,385,678,290));glow('Café pendant warmth',512,272,120,160);
  }
  if(id==='igloo')glow('Lantern breathing warmth',512,293,115,155);
  if(id==='blossom') {
    const petals=[];
    for(let i=0;i<15;i++){const x=170+(i*63)%660,y=340+(i*23)%175;const l=image('Falling blossom '+i,'petal',x,y,7+i%4*2);drift(l,x,y,32+i%4*15,130+i%3*20);l.ks.r=track([[0,-35+i*8],[END,75+i*8]],true);fade(l,70+i%3*10);petals.push(l);}
    clip('Petals on the spring breeze',petals,box(170,350,680,320));glow('Spring lantern glow',512,267,100,140);
  }
  if(id==='underwater') {
    const before=new Set(layers);fish(6,170,850,360,235);bubbles(13,175,640,310);kelp(4);
    clip('Life beyond the glass dome',layers.filter(l=>!before.has(l)),vertices([[160,110],[860,110],[910,615],[865,642],[165,642],[110,610]]));
    glow('Soft aquatic lamplight',512,275,130,150);
  }
  if(id==='cabin') {
    for(const [i,x] of [225,765].entries()){
      const branch=image('Moving pine bough '+i,'pine',x,640,120,{bottom:true,mirrored:i===1});sway(branch,x,640,1,0,1.5);
      clip('Pine window '+i,[branch],box(i?685:160,445,180,210));
    }
    const leaves=[];for(let i=0;i<6;i++){const x=i%2?730+i*18:160+i*22,y=440+i*19;const l=image('Drifting autumn leaf '+i,'leaf',x,y,10+i%3*3);drift(l,x,y,20,100);l.ks.r=track([[0,-20],[END,75]],true);fade(l,65);leaves.push(l);}clip('Forest leaves',leaves,vertices([[145,400],[350,400],[350,660],[145,660]]));
    // Low-opacity highlights sit on the illustrated fire, preserving its painted texture.
    for(let i=0;i<3;i++){const f=ellipse('Fireplace flame '+i,485+i*25,668,13+i*3,32-i*4,'FFBB52',15);f.ks.s=track([[0,[100,80,100]],[48,[85,120,100]],[96,[110,90,100]],[144,[90,115,100]],[192,[100,80,100]],[240,[85,120,100]],[288,[110,90,100]],[336,[90,115,100]],[END,[100,80,100]]]);f.ks.o=track([[0,8],[96,22],[192,9],[288,19],[END,8]]);}glow('Firelight on stone',512,668,122,100);
  }
  if(id==='observatory') {
    for(let i=0;i<28;i++){const x=110+(i*149)%805,y=40+(i*73)%520;const s=ellipse('Twinkling star '+i,x,y,2+i%3,2+i%3,'E4E9FF',30);s.ks.o=track([[0,18+i%3*6],[96+i%4*12,65+i%3*10],[END,18+i%3*6]]);sway(s,x,y,2,1,0);}
    const shooting=ellipse('Occasional shooting star',-60,80,74,1.5,'E0EAFF',0);shooting.ks.r=constant(25);shooting.ks.p=track([[0,[310,110,0]],[126,[310,110,0]],[147,[650,265,0]],[END,[650,265,0]]],true);shooting.ks.o=track([[0,0],[126,0],[129,75],[147,0],[END,0]]);
    glow('Observatory reading lamp',810,553,75,100);
  }
  if(id==='train') {
    const p='train-scenery',meta={w:480,h:170};assets.push({id:p,...meta,e:1,p:'data:image/jpeg;base64,'+fs.readFileSync(path.join(__dirname,'sprites',p+'.jpg')).toString('base64'),u:''});
    for(const [i,[x,y,w,h]] of [[166,440,201,194],[391,440,263,194],[682,440,237,194]].entries()){
      const scenery=[];const tileWidth=meta.w*h/meta.h;
      for(let j=0;j<2;j++){const l=layer('Passing snowy mountains '+i+' / '+j,x+j*tileWidth,y,{ty:2,refId:p});l.ks.s=constant([h/meta.h*100,h/meta.h*100,100]);l.ks.p=track([[0,[x+j*tileWidth,y,0]],[END,[x+(j-1)*tileWidth,y,0]]],true);layers.unshift(l);scenery.push(l);}clip('Train window '+i,scenery,box(x,y,w,h));
    }
    glow('Sleeper-car ceiling light',512,244,150,105);glow('Sleeper-car reading light',207,381,80,65);
  }
  if(id==='castle') {
    dust(17,'F2D7FF',140,430);
    for(let i=0;i<6;i++){const x=185+(i*123)%680,y=220+(i*71)%320;const c=image('Floating candle '+i,'candle',x,y,18+i%3*4);sway(c,x,y,2+i%2*3,-8-i%3*3,.8);c.ks.o=track([[0,90],[96,100],[192,92],[288,98],[END,90]]);glow('Candle shimmer '+i,x,y-14,28,36);}
  }
  if(id==='aquarium') {
    const before=new Set(layers);fish(6,160,865,400,205);bubbles(12,180,640,350);kelp(4);
    for(let i=0;i<3;i++){const x=290+i*190,y=435+i*36;const j=image('Drifting jellyfish '+i,'jellyfish',x,y,37+i*5);sway(j,x,y,12-i*3,-14,2);j.ks.o=constant(76);const s=37+i*5,base=s/manifest.jellyfish.w*100;j.ks.s=track([[0,[base,base,100]],[96,[base*1.04,base*.96,100]],[192,[base,base,100]],[288,[base*1.04,base*.96,100]],[END,[base,base,100]]]);}
    clip('Aquarium glass',layers.filter(l=>!before.has(l)),vertices([[220,357],[804,357],[869,418],[869,610],[845,635],[178,635],[151,610],[151,420]]));glow('Aquarium pendant glow',512,270,110,150);
  }
  const data={v:'5.7.4',fr:24,ip:0,op:END,w:W,h:H,nm:'IGLOO / '+id+' / environment only',ddd:0,assets,layers,meta:{author:'IGLOO',source:'ImageGen painted sprites with independent Lottie environmental motion'}};
  fs.writeFileSync(path.join(__dirname,id+'.json'),JSON.stringify(data));
  console.log(id,layers.length,'root layers',fs.statSync(path.join(__dirname,id+'.json')).size,'bytes');
}
for(const id of ['library','cafe','igloo','blossom','underwater','cabin','observatory','train','castle','aquarium'])scene(id);
