const sharp=require('sharp'),fs=require('fs'),path=require('path');
const {processItem}=require('./process-assets.cjs');
const ts=require('typescript'),vm=require('vm');
const slotModule={exports:{}};vm.runInThisContext('(function(exports){'+ts.transpileModule(fs.readFileSync(path.join(__dirname,'../../src/home/slots.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText+'})')(slotModule.exports);
const slots=slotModule.exports.HOME_SLOTS;
const prefixSlots={bed:'bed',sofa:'sofa',rug:'rug',desk:'desk',lamp:'lighting',window:'window',skylight:'ceiling',shelf:'bookshelf','decor-painting':'wallArt','decor-plant':'plant','decor-toy':'toy','decor-books':'books','decor-tea':'tabletop'};
const sheets={
 beds:{cols:1,rows:3,ids:['bed-blue','bed-moss','bed-berry']},
 sofas:{cols:1,rows:3,ids:['sofa-cream','sofa-sage','sofa-rose']},
 rugs:{cols:1,rows:3,ids:['rug-cream','rug-teal','rug-rose']},
 desks:{cols:1,rows:3,ids:['desk-oak','desk-walnut','desk-sage']},
 fixtures:{cols:3,rows:3,ids:['lamp-lantern','lamp-birch','lamp-star','window-round','window-panorama','skylight','shelf-oak','shelf-birch']},
 decor:{cols:3,rows:2,ids:['decor-painting','decor-plant','decor-toy','decor-books','decor-tea']},
};
(async()=>{const ids=[];for(const [name,sheet] of Object.entries(sheets)){
 const file=path.join(__dirname,'raw',name+'.png'),m=await sharp(file).metadata();
 for(let i=0;i<sheet.ids.length;i++){
  const x=i%sheet.cols,y=Math.floor(i/sheet.cols);let left=Math.round(x*m.width/sheet.cols),top=Math.round(y*m.height/sheet.rows);
  let width=Math.round((x+1)*m.width/sheet.cols)-left,height=Math.round((y+1)*m.height/sheet.rows)-top;
  if(name==='rugs'){left=700;width=m.width-700;}
  if(name==='beds'){const edges=[0,500,1020,m.height];top=edges[y];height=edges[y+1]-top;}
  console.log(await processItem(file,sheet.ids[i],{left,top,width,height}));ids.push(sheet.ids[i]);
  const id=sheet.ids[i],slot=prefixSlots[id]||prefixSlots[id.split('-')[0]],box=slots[slot],out=path.join(__dirname,'items',id+'.png');
  const buffer=await sharp(out).resize(box.width*2,box.height*2,{fit:'contain',position:'bottom',background:'#00000000'}).png().toBuffer();await sharp(buffer).toFile(out);
 }
}
fs.writeFileSync(path.join(__dirname,'../../src/home/art.ts'),"import type { ImageSourcePropType } from 'react-native';\nexport const HOME_FOUNDATION = require('../../assets/home-customization/foundation.jpg');\nexport const HOME_ART: Record<string, ImageSourcePropType> = {\n"+ids.map(id=>" '"+id+"': require('../../assets/home-customization/items/"+id+".png'),").join('\n')+'\n};\n');
})().catch(e=>{console.error(e);process.exit(1)});
