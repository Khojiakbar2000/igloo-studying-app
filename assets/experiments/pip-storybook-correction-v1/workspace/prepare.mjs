import sharp from 'sharp';import fs from 'node:fs/promises';
const dir='assets/experiments/pip-storybook-correction-v1';
const {data,info}=await sharp(dir+'/source/layer-sheet.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=3;i<data.length;i+=4)data[i]=data[i]<180?0:Math.min(255,(data[i]-180)*255/55);const clean=await sharp(data,{raw:info}).png().toBuffer();
const boxes={body:[0,0,740,1024,500],'flipper-left':[790,270,320,340,96],'flipper-right':[1180,270,340,340,96],'foot-left':[870,710,190,160,45],'foot-right':[1200,710,200,160,45]};const dimensions={};
for(const [name,[left,top,width,height,target]]of Object.entries(boxes)){const b=await sharp(clean).extract({left,top,width,height}).png().toBuffer();const cropped=await sharp(b).trim({threshold:10}).png().toBuffer();const out=await sharp(cropped).resize({height:target}).png().toBuffer();await fs.writeFile(dir+'/character/'+name+'.png',out);const m=await sharp(out).metadata();dimensions[name]={width:m.width,height:m.height};}
await fs.writeFile(dir+'/workspace/dimensions.json',JSON.stringify(dimensions,null,2));console.log(dimensions);
