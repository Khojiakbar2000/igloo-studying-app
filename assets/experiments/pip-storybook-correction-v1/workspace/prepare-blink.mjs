import sharp from 'sharp';import fs from 'node:fs/promises';
const dir='assets/experiments/pip-storybook-correction-v1';
const resized=await sharp(dir+'/source/blink-source.png').resize(304,500,{fit:'fill'}).png().toBuffer();
const mask=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="304" height="500"><ellipse cx="105" cy="194" rx="43" ry="36" fill="white"/><ellipse cx="232" cy="182" rx="36" ry="33" fill="white"/></svg>')).blur(1.2).png().toBuffer();
await sharp(resized).composite([{input:mask,blend:'dest-in'}]).png().toFile(dir+'/expressions/blink-overlay.png');
await sharp(dir+'/character/body.png').composite([{input:dir+'/expressions/blink-overlay.png'}]).png().toFile(dir+'/expressions/closed-eyes-body.png');
await fs.copyFile(dir+'/character/body.png',dir+'/expressions/cold-hopeful-open.png');
