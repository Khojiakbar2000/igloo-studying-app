const sharp=require('sharp'),fs=require('fs'),vm=require('vm'),ts=require('typescript'),path=require('path');
function load(name){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../../src/home',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;vm.runInThisContext('(function(exports){'+code+'})')(module.exports);return module.exports;}
const {HOME_SLOTS}=load('slots'),{HOME_CATALOG}=load('catalog');
(async()=>{
 for(let variant=0;variant<3;variant++){
 const groups={};for(const item of HOME_CATALOG)(groups[item.slot]??=[]).push(item);
 const layers=[];
 for(const [slot,box]of Object.entries(HOME_SLOTS).sort((a,b)=>a[1].z-b[1].z)){
  if(variant===0&&['ceiling','plant','wallArt','toy','books','tabletop'].includes(slot))continue;
  const item=groups[slot]?.[Math.min(variant,(groups[slot]?.length??1)-1)];if(!item)continue;
  layers.push({input:await sharp(path.join(__dirname,'items',item.id+'.png')).resize(box.width,box.height,{fit:'contain',background:'#00000000',position:'bottom'}).png().toBuffer(),left:box.x,top:box.y});
 }
 const pip=await sharp(path.join(__dirname,'../animations/pip-chair-performance/frames/pip-chair-rest-v2.png')).resize(471,660,{fit:'contain',background:'#00000000'}).resize(438,614).png().toBuffer();
 layers.push({input:pip,left:365,top:553});
 await sharp(path.join(__dirname,'foundation.jpg')).composite(layers).png().toBuffer().then(buffer=>sharp(buffer).resize(768,1152).png().toFile('/private/tmp/home-room-'+variant+'.png'));
 }
})().catch(e=>{console.error(e);process.exit(1)});
