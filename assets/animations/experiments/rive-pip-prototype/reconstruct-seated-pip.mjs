import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('assets/animations/experiments/rive-pip-prototype');
const source = path.resolve('assets/animations/pip-sofa-study/source/baseline.png');
const outSvg = path.join(root, 'layered-seated-pip.svg');
const outPreview = path.join(root, 'layered-seated-pip-comparison.png');
const outLayers = path.join(root, 'layered-seated-pip-layers.png');
const width = 588;
const colors = 256;

const regionPolys = {
  head: [[135,595],[130,455],[170,320],[255,210],[335,155],[350,85],[430,30],[575,12],[715,60],[815,155],[855,290],[863,448],[830,590],[760,684],[642,730],[450,730],[310,695],[210,650]],
  scarf: [[0,555],[190,555],[410,585],[640,585],[730,635],[720,815],[630,865],[420,865],[245,840],[0,820]],
  farFlipper: [[550,755],[605,728],[659,731],[708,765],[746,818],[774,879],[781,924],[765,954],[735,962],[702,943],[673,909],[645,870],[618,833],[584,801]],
  nearFlipper: [[183,780],[216,764],[264,765],[327,783],[397,805],[465,831],[524,858],[575,888],[608,921],[622,954],[614,981],[592,1000],[559,1007],[518,997],[468,981],[412,959],[356,934],[304,909],[257,881],[220,850],[194,820]],
  feet: [[405,1110],[980,1110],[1010,1337],[390,1337]],
  laptopScreen: [[742,682],[1176,610],[1176,1082],[710,1098]],
  laptopDeck: [[304,850],[800,803],[980,1058],[308,1110]],
};

function inPoly(x, y, p) {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi) inside = !inside;
  }
  return inside;
}

const clamp01 = n => Math.max(0, Math.min(1, n));
function hueSat(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}

const quantized = await sharp(source).resize({ width }).png({ palette: true, colours: colors, dither: 0 }).toBuffer();
const { data, info } = await sharp(quantized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height, scale = w / 1176;
const sourceScale = 1176 / w;
const palette = [];
const paletteMap = new Map();
const colorIndex = new Uint16Array(w * h).fill(65535);
const labels = new Int16Array(w * h).fill(-1);
const labelNames = ['underlay-detail', 'body', 'head', 'eyes-left', 'beak', 'scarf', 'flipper-far', 'flipper-near', 'feet', 'laptop-deck', 'laptop-screen', 'eyes-right'];
const pixelsByLabel = [];
const keyForColor = (r, g, b, a) => `${r},${g},${b},${a}`;
for (let i = 0, p = 0; i < data.length; i += 4, p++) {
  const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
  if (a < 208) continue;
  const key = keyForColor(r,g,b,a);
  let ci = paletteMap.get(key);
  if (ci === undefined) { ci = palette.length; paletteMap.set(key, ci); palette.push([r,g,b,a]); }
  colorIndex[p] = ci;
}
const ellipses = [
  {name:'eyes', cx:541, cy:533, rx:76, ry:88},
  {name:'eyes', cx:759, cy:535, rx:59, ry:83},
];
const inEllipse = (x,y,e) => ((x-e.cx)**2/(e.rx**2) + (y-e.cy)**2/(e.ry**2)) <= 1;
for (let py=0; py<h; py++) for (let px=0; px<w; px++) {
  const p=py*w+px, ci=colorIndex[p];
  if (ci===65535 || !palette[ci]) continue;
  const sx=(px+0.5)*sourceScale, sy=(py+0.5)*sourceScale;
  const [r,g,b,a]=palette[ci], [hue,sat,val]=hueSat(r,g,b);
  let layer=1;
  const inScarf=sy>540&&sy<1040&&sx<760&&inPoly(sx,sy,regionPolys.scarf);
  const orange=hue>=8&&hue<=52&&sat>0.25;
  const screen=inPoly(sx,sy,regionPolys.laptopScreen)&&sat<0.42&&val>0.20;
  const deck=inPoly(sx,sy,regionPolys.laptopDeck)&&sat<0.48&&val>0.18;
  if (sy>1120&&orange&&sx>390) layer=8;
  else if (sx>580&&sx<780&&sy>520&&sy<735&&orange) layer=4;
  else if (inEllipse(sx,sy,ellipses[0])&&sy<650&&sx>430) layer=3;
  else if (inEllipse(sx,sy,ellipses[1])&&sy<650&&sx>650) layer=11;
  else if (inScarf&&hue>=135&&hue<=225&&sat>0.08) layer=5;
  else if (inPoly(sx,sy,regionPolys.nearFlipper)&&sy>760&&sat<0.55&&val<0.75) layer=7;
  else if (inPoly(sx,sy,regionPolys.farFlipper)&&sy>720&&sat<0.55&&val<0.75) layer=6;
  else if (screen) layer=10;
  else if (deck) layer=9;
  else if (inPoly(sx,sy,regionPolys.head)&&sy<740) layer=2;
  else layer=1;
  const combined = layer*palette.length+ci;
  labels[p]=combined;
  (pixelsByLabel[combined]??=[]).push(p);
}

function rectRuns(predicate, keyFor) {
  const rectsByKey=new Map();let previous=new Map();
  for(let y=0;y<h;y++){
    const current=new Map();let x=0;
    while(x<w){
      const p=y*w+x;
      if(!predicate(p)){x++;continue;}
      const key=keyFor(p);let end=x+1;
      while(end<w&&predicate(y*w+end)&&keyFor(y*w+end)===key)end++;
      const runKey=`${key}:${x}:${end}`;
      let rect=previous.get(runKey);
      if(rect)rect.height++;
      else {rect={x,y,width:end-x,height:1};if(!rectsByKey.has(key))rectsByKey.set(key,[]);rectsByKey.get(key).push(rect);}
      current.set(runKey,rect);x=end;
    }
    previous=current;
  }
  return rectsByKey;
}
function rectanglesPath(rects) {
  return rects.map(r=>`M${(r.x*sourceScale).toFixed(1)} ${(r.y*sourceScale).toFixed(1)}h${(r.width*sourceScale).toFixed(1)}v${(r.height*sourceScale).toFixed(1)}h-${(r.width*sourceScale).toFixed(1)}Z`).join('');
}
const layerRuns=rectRuns(p=>labels[p]>=0,p=>String(labels[p]));
const grouped=[];
for(const [labelText,rects] of layerRuns){
  const label=Number(labelText), layer=(label/palette.length)|0, ci=label%palette.length;
  const [r,g,b]=palette[ci];
  const fill=`#${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
  (grouped[layer]??=[]).push(`<path d="${rectanglesPath(rects)}" fill="${fill}"/>`);
}
const colorsUsed=grouped.reduce((sum,g)=>sum+(g?.length||0),0);
const silhouetteRuns=rectRuns(p=>labels[p]>=0,()=> 'silhouette').get('silhouette')||[];
const silhouettePath=rectanglesPath(silhouetteRuns);

const gradients=`<defs>
 <radialGradient id="underbody" cx="42%" cy="35%" r="72%"><stop stop-color="#545168"/><stop offset=".52" stop-color="#34354d"/><stop offset="1" stop-color="#202339"/></radialGradient>
 <radialGradient id="underhead" cx="42%" cy="30%" r="75%"><stop stop-color="#55546c"/><stop offset=".6" stop-color="#34354e"/><stop offset="1" stop-color="#26283d"/></radialGradient>
 </defs>`;
const bodyUnderlay=`<g id="body-underlay" inkscape:groupmode="layer" inkscape:label="Body · complete hidden geometry" clip-path="url(#silhouetteClip)">
 <path d="M154 704 C141 789 153 1032 179 1120 C205 1203 286 1244 401 1243 C470 1242 520 1196 567 1190 C623 1191 694 1241 811 1228 C908 1218 954 1164 943 1077 C930 975 903 847 843 775 C799 723 727 706 674 724 C558 686 407 688 318 707 C256 701 195 695 154 704 Z" fill="url(#underbody)"/>
 </g><g id="head-underlay" inkscape:groupmode="layer" inkscape:label="Head · complete hidden geometry" clip-path="url(#silhouetteClip)">
 <path d="M146 557 C130 446 151 333 224 231 C270 165 345 128 364 81 C390 17 491 1 581 16 C687 33 785 112 834 222 C875 314 879 450 842 559 C812 653 746 715 667 739 C553 766 382 733 285 690 C204 653 161 610 146 557 Z" fill="url(#underhead)"/>
 </g>`;
const layerMarkup=i=>(grouped[i]||[]).join('');
const groups=[
 `<g id="body" inkscape:groupmode="layer" inkscape:label="Body · torso and belly">${layerMarkup(1)}</g>`,
 `<g id="flipper-far" inkscape:groupmode="layer" inkscape:label="Flipper · far side">${layerMarkup(6)}</g>`,
 `<g id="feet" inkscape:groupmode="layer" inkscape:label="Feet">${layerMarkup(8)}</g>`,
 `<g id="scarf" inkscape:groupmode="layer" inkscape:label="Scarf · knit and tails">${layerMarkup(5)}</g>`,
 `<g id="head" inkscape:groupmode="layer" inkscape:label="Head · seated pose">
   <g id="head-shell" inkscape:label="Head shell and face patch">${layerMarkup(2)}</g>
   <g id="eyes" inkscape:label="Eyes">
     <g id="eye-left" inkscape:label="Eye · left">${layerMarkup(3)}</g>
     <g id="eye-right" inkscape:label="Eye · right">${layerMarkup(11)}</g>
   </g>
   <g id="beak" inkscape:label="Beak">${layerMarkup(4)}</g>
 </g>`,
 `<g id="laptop-deck" inkscape:groupmode="layer" inkscape:label="Study prop · keyboard deck">${layerMarkup(9)}</g>`,
 `<g id="flipper-near" inkscape:groupmode="layer" inkscape:label="Flipper · near side">${layerMarkup(7)}</g>`,
 `<g id="laptop-screen" inkscape:groupmode="layer" inkscape:label="Study prop · screen">${layerMarkup(10)}</g>`,
].join('\n');
const svg=`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="1176" height="1337" viewBox="0 0 1176 1337">
 <title>Pip — layered seated study character</title><desc>Static editable vector reconstruction traced from the approved seated Pip reference. Layers are named in the Inkscape layer panel. No animation is included.</desc>
 ${gradients.replace('</defs>',`<clipPath id="silhouetteClip"><path d="${silhouettePath}" fill-rule="evenodd"/></clipPath></defs>`)}${bodyUnderlay}${groups}
</svg>`;
await fs.writeFile(outSvg,svg);
const render=await sharp(Buffer.from(svg)).png().toBuffer();
await sharp(render).resize({width:430}).png().toFile(path.join(root,'layered-seated-pip-render.png'));
const original=await sharp(source).resize({width:430}).png().toBuffer();
const rendered=await sharp(render).resize({width:430}).png().toBuffer();
const labelSvg=Buffer.from(`<svg width="900" height="550" xmlns="http://www.w3.org/2000/svg"><rect width="900" height="550" fill="#edf2f7"/><text x="220" y="36" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#304650">APPROVED ORIGINAL</text><text x="680" y="36" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#304650">LAYERED VECTOR RECONSTRUCTION</text></svg>`);
const pair=await sharp({create:{width:900,height:550,channels:4,background:'#edf2f7'}}).composite([
 {input:labelSvg,left:0,top:0},{input:original,left:5,top:50},{input:rendered,left:455,top:50}
]).png().toBuffer();
await fs.writeFile(outPreview,pair);
const ids=['body-underlay','head-underlay','body','head-shell','eye-left','eye-right','beak','scarf','flipper-far','flipper-near','feet','laptop-deck','laptop-screen'];
const previewDir=path.join(root,'layer-previews');
await fs.mkdir(previewDir,{recursive:true});
for(let k=0;k<ids.length;k++){
 const selected=ids[k];
 const headPart=['head-shell','eye-left','eye-right','beak'].includes(selected);
 const hidden=ids.filter(id=>id!==selected).map(id=>`#${id}{display:none}`).join('');
 const headVisibility=headPart?`#head{display:inline} #head-shell{${selected==='head-shell'?'':'display:none'}} #eye-left{${selected==='eye-left'?'':'display:none'}} #eye-right{${selected==='eye-right'?'':'display:none'}} #beak{${selected==='beak'?'':'display:none'}}`:'';
 const showBodyUnderlay=selected==='body-underlay'||selected==='body';
 const showHeadUnderlay=selected==='head-underlay'||selected==='head-shell';
 const underlayVisibility=showBodyUnderlay?'#body-underlay{display:inline}':'#body-underlay{display:none}';
 const headUnderlayVisibility=showHeadUnderlay?'#head-underlay{display:inline}':'#head-underlay{display:none}';
 const isolated=svg.replace(' <title>',` <rect width="1176" height="1337" fill="#f6f3ec"/> <title>`).replace('</svg>',`<style>${hidden} ${headVisibility} ${headPart?'':'#head{display:none}'} ${underlayVisibility} ${headUnderlayVisibility}</style></svg>`);
 const png=await sharp(Buffer.from(isolated)).resize({width:190,height:238,fit:'contain',background:'#f6f3ec'}).flatten({background:'#f6f3ec'}).png().toBuffer();
 await fs.writeFile(path.join(previewDir,`${ids[k]}.png`),png);
}
// Build a predictable contact sheet with SVG cards instead of ImageMagick's
// default montage padding (which can introduce black bars around transparent
// previews on some versions).
const columns=4, cardW=205, cardH=270, gap=12, rows=Math.ceil(ids.length/columns);
const sheetW=columns*cardW+(columns+1)*gap, sheetH=rows*cardH+(rows+1)*gap;
const sheetParts=[];
for(let k=0;k<ids.length;k++){
 const col=k%columns,row=Math.floor(k/columns),left=gap+col*(cardW+gap),top=gap+row*(cardH+gap);
 const title=ids[k].replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());
 const cardSvg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cardW}" height="${cardH}"><rect width="100%" height="100%" rx="12" fill="#fffaf0"/><rect x="7" y="7" width="191" height="232" rx="8" fill="#f6f3ec"/><text x="${cardW/2}" y="257" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="600" fill="#51483e">${title}</text></svg>`);
 sheetParts.push({input:cardSvg,left,top});
 sheetParts.push({input:path.join(previewDir,`${ids[k]}.png`),left:left+7,top:top+7});
}
await sharp({create:{width:sheetW,height:sheetH,channels:4,background:'#e7dfcf'}}).composite(sheetParts).png().toFile(outLayers);
console.log(JSON.stringify({source,w,h,colors:palette.length,pathCount:colorsUsed,svgBytes:Buffer.byteLength(svg),outSvg,outPreview,previewDir,outLayers}));
