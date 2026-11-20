import sharp from 'sharp';import fs from 'node:fs/promises';
const dir='assets/experiments/pip-lottie-wave';
// Only reveal the generated repair around the removed flipper; retain source elsewhere.
const mask=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1176" height="1337"><rect x="164" y="755" width="484" height="261" rx="20" fill="white"/></svg>')).blur(5).png().toBuffer();
const patch=await sharp(dir+'/torso-underpaint-v2.png').composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
await sharp('assets/animations/pip-sofa-study/source/baseline.png').composite([{input:patch}]).png().toFile(dir+'/body-v2.png');
const params={};for(const [key,name]of [['body','body-v2'],['flipper','flipper']])params[key]=(await sharp(dir+'/'+name+'.png').resize({width:470}).png().toBuffer()).toString('base64');
await fs.writeFile(dir+'/creator-params-v2.json',JSON.stringify(params));
