// Deterministic eye-region extraction. The approved base character is never overwritten.
const sharp=require('sharp'),path=require('path');
(async()=>{
 const source=await sharp(path.join(__dirname,'source/blink.png')).resize(480,560).ensureAlpha().raw().toBuffer();
 const output=Buffer.alloc(480*560*4);
 for(let y=205;y<277;y++)for(let x=160;x<322;x++){
  const left=x<245,cx=left?199:289,cy=left?244:238,rx=left?31:28,ry=29;
  const distance=Math.hypot((x-cx)/rx,(y-cy)/ry);
  if(x>=225&&x<=273&&y>=240)continue;
  const alpha=Math.min(1,Math.max(0,(1-distance)*14));if(!alpha)continue;
  const sx=x-(left?1:0),sy=y+(left?5:6),n=(y*480+x)*4,m=(sy*480+sx)*4;
  output[n]=source[m];output[n+1]=source[m+1];output[n+2]=source[m+2];output[n+3]=Math.round(alpha*source[m+3]);
 }
 await sharp(output,{raw:{width:480,height:560,channels:4}}).png().toFile(path.join(__dirname,'blink-eyes.png'));
 await sharp(path.join(__dirname,'../pip-chair-performance/frames/pip-chair-rest-v2.png')).composite([{input:path.join(__dirname,'blink-eyes.png')}]).png().toFile('/private/tmp/pip-home-blink-check.png');
})().catch(e=>{console.error(e);process.exit(1)});
