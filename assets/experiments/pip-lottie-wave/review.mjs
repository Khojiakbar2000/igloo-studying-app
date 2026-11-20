import sharp from 'sharp';
const dir='assets/experiments/pip-lottie-wave';
const original=await sharp('assets/animations/pip-sofa-study/source/baseline.png').resize({width:470}).png().toBuffer();
const left=await sharp({create:{width:680,height:650,channels:4,background:'#f0f2f0'}}).composite([{input:original,left:155,top:63}]).png().toBuffer();
await sharp({create:{width:1360,height:700,channels:4,background:'#f0f2f0'}}).composite([{input:left,left:0,top:40},{input:dir+'/wave-still.png',left:680,top:40},{input:Buffer.from('<svg width="1360" height="40"><text x="340" y="28" text-anchor="middle" font-family="Arial" font-size="20">Approved original</text><text x="1020" y="28" text-anchor="middle" font-family="Arial" font-size="20">Wave attempt: visible shoulder patch</text></svg>'),left:0,top:0}]).png().toFile(dir+'/comparison.png');
