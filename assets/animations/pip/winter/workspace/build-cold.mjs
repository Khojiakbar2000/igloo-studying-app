import sharp from 'sharp';import fs from 'node:fs/promises';
const dir='assets/animations/pip/winter';
await sharp(dir+'/workspace/cold-body-source.png').resize(345,471,{fit:'fill'}).png().toFile(dir+'/character/body-cold.png');
const source=JSON.parse(await fs.readFile('assets/animations/pip/lottie/wave.json','utf8'));
const fixed=k=>({a:0,k});const track=keys=>({a:1,k:keys.map(([t,s],i)=>({t:t*30,s:Array.isArray(s)?s:[s],...(i<keys.length-1?{o:{x:.42,y:0},i:{x:.58,y:1}}:{})}))});
const coldBytes=await fs.readFile(dir+'/character/body-cold.png');const originalBody=source.assets.find(a=>a.id===source.layers.find(l=>l.nm==='body').refId);
const faceMask=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="345" height="471"><ellipse cx="232" cy="211" rx="112" ry="78" fill="white"/></svg>');
for(const name of ['cold','hopeful','curious','happy','excited']){const bytes=['happy','excited','curious'].includes(name)?Buffer.from(originalBody.p.split(',')[1],'base64'):coldBytes;await sharp(bytes).composite([{input:faceMask,blend:'dest-in'}]).png().toFile(dir+'/expressions/'+name+'.png');}
function make(name,duration){const a=structuredClone(source);a.nm='Pip '+name;a.op=duration*30;const root=a.layers.find(l=>l.ind===6);root.nm='Pip winter controller';for(const l of a.layers){l.ip=0;l.op=a.op;l.ks.r=fixed(0);l.ks.s=fixed([100,100]);}root.ks.p=fixed([360,610]);a.assets.find(x=>x.id===originalBody.id).p='data:image/png;base64,'+coldBytes.toString('base64');return a;}
const cold=make('cold',8),get=(a,n)=>a.layers.find(l=>l.nm===n),root=get(cold,'Pip winter controller');
const shakes=[[0,[360,610]],[.6,[360,610]]];for(const start of [.9,3.5,6.1]){for(let j=0;j<9;j++)shakes.push([start+j*.075,[360+(j===8?0:(j%2?1.8:-1.8)),610+(j%2?-.7:0)]]);}shakes.push([7.95,[360,610]]);root.ks.p=track(shakes);root.ks.r=track([[0,-1],[1.7,-1],[2.7,2],[3.3,0],[5.3,-1],[6.7,-1],[7.95,-1]]);
get(cold,'leftArm').ks.r=track([[0,-77],[1.8,-77],[2.1,-86],[2.35,-72],[2.6,-86],[2.85,-72],[3.1,-77],[5,-77],[5.5,-93],[5.9,-77],[7.95,-77]]);
get(cold,'rightArm').ks.r=track([[0,77],[1.8,77],[2.1,72],[2.35,86],[2.6,72],[2.85,86],[3.1,77],[5,77],[5.5,86],[5.9,77],[7.95,77]]);
get(cold,'leftFoot').ks.r=track([[0,0],[2,0],[2.5,-7],[3,0],[5,0],[5.5,-6],[6,0],[7.95,0]]);get(cold,'rightFoot').ks.r=track([[0,0],[3.5,0],[4,-7],[4.5,0],[6.8,0],[7.3,6],[7.95,0]]);
// Shape breath clouds are independent transparent ellipse layers, not frame sprites.
for(const [i,start]of [1.4,4.4,6.7].entries()){cold.layers.unshift({ddd:0,ind:20+i,ty:4,nm:'Soft breath '+i,ip:0,op:240,st:0,ks:{a:fixed([0,0]),p:track([[0,[455,328]],[start,[455,328]],[start+1,[493,310]],[7.99,[493,310]]]),s:track([[0,[20,20]],[start,[20,20]],[start+1,[100,100]],[7.99,[100,100]]]),o:track([[0,0],[start,0],[start+.15,36],[start+1,0],[7.99,0]]),r:fixed(0)},shapes:[{ty:'el',p:fixed([0,0]),s:fixed([40,22]),nm:'Condensation'},{ty:'fl',c:fixed([.95,.98,1,1]),o:fixed(100),r:1,nm:'Soft white'}]});}

// Slow blinks close quickly, pause briefly, and reopen gently.
for(const [i,x]of [390,475].entries()){cold.layers.unshift({ddd:0,ind:30+i,ty:4,parent:6,nm:'Slow eyelid '+i,ip:0,op:240,st:0,ks:{a:fixed([0,0]),p:fixed([x-360,284-610]),s:track([[0,[100,0]],[2.9,[100,0]],[3.03,[100,100]],[3.13,[100,100]],[3.35,[100,0]],[6.9,[100,0]],[7.03,[100,100]],[7.13,[100,100]],[7.35,[100,0]],[7.99,[100,0]]]),o:fixed(100),r:fixed(0)},shapes:[{ty:'el',p:fixed([0,0]),s:fixed([i===0?52:45,43]),nm:'Lid'},{ty:'fl',c:fixed([1,.87,.75,1]),o:fixed(100),r:1}]});}

for(const [i,x]of [390,475].entries())cold.layers.unshift({ddd:0,ind:40+i,ty:4,parent:6,nm:'Closed eye curve '+i,ip:0,op:240,st:0,ks:{a:fixed([0,0]),p:fixed([x-360,285-610]),s:fixed([100,100]),r:fixed(0),o:track([[0,0],[3,0],[3.04,100],[3.17,100],[3.32,0],[7,0],[7.04,100],[7.17,100],[7.32,0],[7.99,0]])},shapes:[{ty:'sh',ks:fixed({v:[[-18,0],[0,6],[18,0]],i:[[0,0],[-6,0],[-5,3]],o:[[5,3],[6,0],[0,0]],c:false})},{ty:'st',c:fixed([.22,.14,.12,1]),o:fixed(100),w:fixed(2),lc:2,lj:2}]});
for(const [name,a]of [['pip-cold',cold]])await fs.writeFile(dir+'/lottie/'+name+'.json',JSON.stringify(a));
// Short, distinct one-shots share the same worried body and attachment points.
for(const [name,left,right]of [['hopeful-wave',110,25],['scarf-tuck',-95,80],['curious-look',-65,60]]){const a=make(name,3);get(a,'leftArm').ks.r=track([[0,-77],[.6,left],[1,left-15],[1.35,left],[1.7,left-10],[2.6,-77],[2.99,-77]]);get(a,'rightArm').ks.r=track([[0,77],[.6,right],[1.7,right],[2.6,77],[2.99,77]]);get(a,'Pip winter controller').ks.r=track([[0,0],[.6,name==='curious-look'?-7:2],[1.7,name==='curious-look'?-7:2],[2.6,0],[2.99,0]]);await fs.writeFile(dir+'/lottie/'+name+'.json',JSON.stringify(a));}
console.log('Cold idle and three reaction clips authored from the existing five-layer rig.');
