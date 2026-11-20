import fs from 'node:fs/promises';import crypto from 'node:crypto';import path from 'node:path';
const root=path.resolve('assets/animations/pip');const source=path.resolve('assets/experiments/pip-lottie-dance');
const names={body:'body',leftArm:'flipper-left',rightArm:'flipper-right',leftFoot:'foot-left',rightFoot:'foot-right'};
const hashes={};for(const [old,name]of Object.entries(names)){const b=await fs.readFile(path.join(source,old+'.png'));await fs.writeFile(path.join(root,'character',name+'.png'),b);hashes[name]=crypto.createHash('sha256').update(b).digest('hex');}
await fs.copyFile(path.join(source,'source-sheet.png'),path.join(root,'workspace','source-sheet.png'));
const original=JSON.parse(await fs.readFile(path.join(source,'pip-dance.json'),'utf8'));
const fixed=v=>({a:0,k:v});
function track(keys){if(keys.at(-1)[0]===2.99)keys.splice(keys.length-1,0,[2.9,structuredClone(keys.at(-1)[1])]);return {a:1,k:keys.map(([seconds,value],i)=>({t:seconds*30,s:Array.isArray(value)?value:[value],...(i<keys.length-1?{o:{x:.42,y:0},i:{x:.58,y:1}}:{})}))};}
function base(name,duration){const a=structuredClone(original);a.nm='Pip '+name;a.op=duration*30;a.ip=0;for(const l of a.layers){l.ip=0;l.op=a.op;l.st=0;l.ks.r=fixed(0);l.ks.sk=fixed(0);l.ks.s=fixed([100,100]);}const root=a.layers.find(l=>l.ind===6);root.nm='Pip reusable motion controller';root.ks.p=fixed([360,610]);return a;}
function layer(a,n){return a.layers.find(l=>l.nm===n)}
const wave=base('wave',3);
layer(wave,'leftArm').ks.r=track([[0,0],[.2,-5],[.62,132],[.86,112],[1.1,145],[1.35,112],[1.6,142],[1.84,117],[2.08,134],[2.55,0],[2.75,-2],[2.99,0]]);
layer(wave,'rightArm').ks.r=track([[0,0],[.62,-7],[1.84,-7],[2.55,0],[2.99,0]]);
layer(wave,'Pip reusable motion controller').ks.r=track([[0,0],[.62,2],[1.84,1],[2.55,0],[2.99,0]]);
const dance=structuredClone(original);dance.nm='Pip dance';dance.layers.find(l=>l.ind===6).nm='Pip reusable motion controller';
for(const l of dance.layers){l.ks.sk=fixed(0);l.ks.s=l.ind===6?track([[0,[100,100]],[.25,[102,98]],[.8,[100,100]],[4.55,[102,98]],[4.85,[98,102]],[5.15,[103,97]],[5.45,[100,100]],[5.99,[100,100]]]):fixed([100,100]);if(['leftArm','rightArm'].includes(l.nm))l.ks.r.k[0].s=[0];}
const celebrate=base('celebrate',3),rig=layer(celebrate,'Pip reusable motion controller');
rig.ks.p=track([[0,[360,610]],[.2,[360,610]],[.48,[360,614]],[.68,[360,563]],[.92,[360,549]],[1.16,[360,573]],[1.35,[360,613]],[1.55,[360,609]],[1.8,[360,610]],[2.99,[360,610]]]);
rig.ks.s=track([[0,[100,100]],[.2,[100,100]],[.48,[105,94]],[.68,[97,104]],[.92,[100,100]],[1.16,[99,102]],[1.35,[106,94]],[1.55,[99,101]],[1.8,[100,100]],[2.99,[100,100]]]);
layer(celebrate,'leftArm').ks.r=track([[0,0],[.2,-5],[.48,20],[.68,125],[.92,137],[1.16,129],[1.35,110],[1.6,119],[1.9,92],[2.35,0],[2.6,-3],[2.99,0]]);
layer(celebrate,'rightArm').ks.r=track([[0,0],[.2,5],[.48,-20],[.68,-125],[.92,-137],[1.16,-129],[1.35,-110],[1.6,-119],[1.9,-92],[2.35,0],[2.6,3],[2.99,0]]);
layer(celebrate,'leftFoot').ks.r=track([[0,0],[.48,0],[.72,-15],[.88,12],[1.04,-12],[1.2,8],[1.32,0],[2.99,0]]);
layer(celebrate,'rightFoot').ks.r=track([[0,0],[.48,0],[.72,15],[.88,-12],[1.04,12],[1.2,-8],[1.32,0],[2.99,0]]);
for(const [name,a]of Object.entries({wave,dance,celebrate})){await fs.writeFile(path.join(root,'lottie',name+'.json'),JSON.stringify(a));}
const pivots=original.layers.filter(l=>l.ty===2).map(l=>({layer:l.nm,asset:l.refId,anchor:l.ks.a.k,position:l.ks.p.k}));
await fs.writeFile(path.join(root,'workspace','character-manifest.json'),JSON.stringify({reference:'assets/animations/pip-sofa-study/source/baseline.png',source:'assets/experiments/pip-lottie-dance',characterHashes:hashes,pivots,framing:{width:720,height:720,fps:30,background:'#f0f2f0'},animations:{wave:3,dance:6,celebrate:3}},null,2));
console.log('Created wave, dance, celebrate using the preserved five-image rig.');
