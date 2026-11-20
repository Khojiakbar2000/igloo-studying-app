import fs from 'node:fs/promises';import crypto from 'node:crypto';import sharp from 'sharp';
const root='assets/animations/pip',names=['wave','dance','celebrate'];const hash=b=>crypto.createHash('sha256').update(b).digest('hex');const report=[];
const map={body:'body',leftArm:'flipper-left',rightArm:'flipper-right',leftFoot:'foot-left',rightFoot:'foot-right'};
const reference={};for(const [layer,name]of Object.entries(map))reference[layer]=hash(await sharp(`${root}/character/${name}.png`).raw().toBuffer());
const poses=[];
for(const name of names){const a=JSON.parse(await fs.readFile(`${root}/lottie/${name}.json`));const exported=JSON.parse(await fs.readFile(`${root}/workspace/${name}-creator.json`));const images=a.layers.filter(l=>l.ty===2);const identity=[];
for(const l of images){const asset=a.assets.find(x=>x.id===l.refId);const pixels=await sharp(Buffer.from(asset.p.split(',')[1],'base64')).raw().toBuffer();identity.push({layer:l.nm,samePixels:hash(pixels)===reference[l.nm],anchor:l.ks.a.k});}
const norm=v=>Array.isArray(v)&&v.length===1?v[0]:v;
const pose=last=>a.layers.map(l=>({name:l.nm,transform:Object.fromEntries(Object.entries(l.ks).map(([k,v])=>[k,norm(v.a===1?v.k[last?v.k.length-1:0].s:v.k)]))}));const first=pose(false),last=pose(true);const samePose=JSON.stringify(first)===JSON.stringify(last);poses.push(first);
report.push({name,duration:a.op/a.fr,fps:a.fr,width:a.w,height:a.h,images:a.assets.length,identity,compatibleStartEnd:samePose,creatorLayers:exported.layers.map(x=>x.ty),unsupportedFeatures:a.layers.filter(l=>l.ef||l.masksProperties||l.tm||l.tt||l.hasMask).map(l=>l.nm),jsonBytes:(await fs.stat(`${root}/lottie/${name}.json`)).size,videoBytes:(await fs.stat(`${root}/previews/${name}.mp4`)).size});}
const sameStartPoses=poses.every(x=>JSON.stringify(x)===JSON.stringify(poses[0]));const result={sameStartPoses,animations:report};await fs.writeFile(`${root}/workspace/verification.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!sameStartPoses||report.some(x=>!x.compatibleStartEnd||x.identity.some(i=>!i.samePixels)))process.exitCode=1;
