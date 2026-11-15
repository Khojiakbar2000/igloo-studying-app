const sharp=require('sharp'),fs=require('fs'),path=require('path');
// Deterministic chroma-key cleanup and alignment; all creative artwork comes from ImageGen.
async function processItem(file,id,cell){
 let input=sharp(file);if(cell)input=input.extract(cell);const png=await input.png().toBuffer();
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=0,bottom=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const n=(y*info.width+x)*4;const d=Math.hypot(255-data[n],data[n+1],255-data[n+2]);const chroma=Math.min(data[n],data[n+2])-data[n+1];
    const keyed=chroma>75 && Math.abs(data[n]-data[n+2])<100;
    const shadow=keyed && Math.abs(data[n]-data[n+2])<22;
    const a=keyed ? (shadow ? Math.max(0,1-Math.max(data[n],data[n+2])/255) : 0) : Math.min(1,Math.max(0,(d-80)/105));
    if(shadow){data[n]=0;data[n+1]=0;data[n+2]=0;}data[n+3]=Math.round(a*255);if(a>.1){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}if(a>0&&a<1){for(let c=0;c<3;c++)data[n+c]=Math.max(0,Math.min(255,Math.round((data[n+c]-(1-a)*(c===1?0:255))/a)));}}
 if(left>=right||top>=bottom)throw Error('No sprite in '+id);
 const raw=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).extract({left,top,width:right-left+1,height:bottom-top+1}).png().toBuffer();
 await sharp(raw).resize({width:700,height:700,fit:'inside',withoutEnlargement:true}).png().toFile(path.join(__dirname,'items',id+'.png'));
 return {id,bounds:{left,top,right,bottom}};
}
module.exports={processItem};
if(require.main===module)processItem(process.argv[2],process.argv[3]).then(console.log);
