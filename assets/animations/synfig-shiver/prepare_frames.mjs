import fs from 'node:fs/promises';
import sharp from 'sharp';
const base='assets/animations/synfig-shiver';
const sheet=`${base}/source/pip-shiver-16-sequence-02.png`;
const master='assets/characters/penguin/igloo-penguin-front-gaze.png';
const out=`${base}/frames`;
const source=await sharp(sheet).metadata();
const cellWidth=source.width/4, cellHeight=source.height/4;
const target=500, scale=1.35, scaledWidth=Math.round(cellWidth*scale), scaledHeight=Math.round(cellHeight*scale);
const left=Math.round((target-scaledWidth)/2);
const standard=await sharp(master).trim({background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer({resolveWithObject:true});
const neutral=await sharp({create:{width:target,height:target,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
  .composite([{input:await sharp(standard.data).resize({height:420}).png().toBuffer(),left:108,top:40}]).png().toBuffer();
await sharp(neutral).png().toFile(`${out}/pip-shiver_00.png`);
for (let frame=1;frame<=14;frame++) {
  const cell=frame; const col=cell%4,row=Math.floor(cell/4);
  const x0=Math.round(col*cellWidth), x1=Math.round((col+1)*cellWidth);
  const y0=Math.round(row*cellHeight), y1=Math.round((row+1)*cellHeight);
  const crop=await sharp(sheet).extract({left:x0,top:y0,width:x1-x0,height:y1-y0}).resize({width:scaledWidth,height:scaledHeight,fit:'fill'}).png().toBuffer();
  await sharp({create:{width:target,height:target,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:crop,left,top:38}]).png().toFile(`${out}/pip-shiver_${String(frame).padStart(2,'0')}.png`);
}
await sharp(neutral).png().toFile(`${out}/pip-shiver_15.png`);
// The model leaves a few disconnected slivers from adjacent sheet cells. Keep the largest
// connected character silhouette, then translate the intact drawing to one foot baseline.
for(let i=1;i<15;i++) {
 const file=`${out}/pip-shiver_${String(i).padStart(2,'0')}.png`;
 const {data,info}=await sharp(file).raw().toBuffer({resolveWithObject:true});
 const seen=new Uint8Array(info.width*info.height),components=[];
 for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
  const start=y*info.width+x;
  if(seen[start]||data[start*4+3]===0) continue;
  let stack=[start],pixels=[],maxY=y;seen[start]=1;
  while(stack.length) {
   const p=stack.pop(),px=p%info.width,py=(p/info.width)|0;pixels.push(p);maxY=Math.max(maxY,py);
   for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
    const nx=px+dx,ny=py+dy;if(nx<0||ny<0||nx>=info.width||ny>=info.height)continue;
    const q=ny*info.width+nx;if(!seen[q]&&data[q*4+3]>0){seen[q]=1;stack.push(q);}
   }
  }
  components.push({pixels,maxY});
 }
 components.sort((a,b)=>b.pixels.length-a.pixels.length);
 const main=components[0];
 for(const component of components.slice(1)) {
  const intentionalSnowflake=i>=12&&i<=14&&component.pixels.length>=1200;
  if(!intentionalSnowflake) for(const p of component.pixels) data[p*4+3]=0;
 }
 const offset=459-main.maxY,shiftedData=new Uint8Array(data.length);
 for(let y=0;y<info.height;y++) {
  const dy=y+offset;if(dy<0||dy>=info.height)continue;
  const row=data.subarray(y*info.width*4,(y+1)*info.width*4);
  shiftedData.set(row,dy*info.width*4);
 }
 await sharp(shiftedData,{raw:info}).png().toFile(file);
}
const composites=[];
for(let i=0;i<16;i++) {
 const input=await sharp(`${out}/pip-shiver_${String(i).padStart(2,'0')}.png`).resize(220,220,{fit:'contain',background:'#FFFFFF'}).flatten({background:'#FFFFFF'}).png().toBuffer();
 composites.push({input,left:(i%4)*220,top:Math.floor(i/4)*220});
}
await sharp({create:{width:880,height:880,channels:3,background:'#FFFFFF'}}).composite(composites).png().toFile(`${base}/contact-sheet.png`);
await fs.writeFile(`${base}/frame-prep.json`,JSON.stringify({sourceSheet:'source/pip-shiver-16-sequence-02.png',baseline:master,frameCount:16,cellGrid:[4,4],commonSheetScale:scale,canvas:[500,500],footBaseline:460,framesPerSecond:12,extraComponents:['snowflake accents retained for cells 13–15 (source frames 12–14)']},null,2)+'\n');
console.log(JSON.stringify({source:[source.width,source.height],cell:[cellWidth,cellHeight],scaled:[scaledWidth,scaledHeight],output:[target,target]}));
