const id=params.scene;
const c=creator.createComp(660,234,24,0,8);
creator.setName(c,"Study Together / "+id);
creator.focusOn(c);
creator.setBackgroundColor({red:0,green:0,blue:0,alpha:0});
const rgba=(r,g,b,a=1)=>({red:r,green:g,blue:b,alpha:a});
function group(name,x,y){const g=creator.createGroup(c,x,y);creator.setName(g,name);return g;}
function ellipse(g,x,y,w,h,color){const s=creator.insertEllipse(c,x,y,w,h,color);creator.setParent(s,g);return s;}
function rect(g,x,y,w,h,color){const s=creator.insertRect(c,x,y,w,h,color);creator.setParent(s,g);return s;}
function move(g,keys,ease="inOut"){creator.animate(g,PropertyType.Position,keys,{ease});}
if(id==="aquarium"){
 for(let i=0;i<3;i++){
  const g=group("swimming-fish-"+i,i===1?740:-80,80+i*39);
  if(i===1)creator.setStaticVec2(g,PropertyType.Scale,{x:-1,y:1});
  const col=[rgba(.96,.65,.28),rgba(.44,.82,.86),rgba(.98,.62,.53)][i];
  ellipse(g,0,0,34-i*4,16-i,col);ellipse(g,-20+i*2,-4,13,8,col);ellipse(g,-20+i*2,4,13,8,col);
  ellipse(g,10-i, -2,3,3,rgba(.10,.22,.29));
  move(g,[[0,{x:i===1?740:-80,y:80+i*39}],[4,{x:330,y:74+i*39}],[8,{x:i===1?-80:740,y:80+i*39}]],"linear");
 }
 for(let i=0;i<7;i++){
  const x=65+i*89,g=group("rising-bubble-"+i,x,250);
  ellipse(g,0,0,4+i%3,4+i%3,rgba(.75,.94,.98,.55));
  move(g,[[0,{x,y:250+i*7}],[8,{x:x+14,y:-30}]],"linear");
 }
}else if(id==="zombies"){
 for(let i=0;i<3;i++){
  const g=group("distant-shambler-"+i,210+i*125,198);
  const ink=rgba(.12,.20,.21,.8);
  ellipse(g,0,-20,7,8,ink);ellipse(g,0,-9,10,19,ink);
  const arm=ellipse(g,-7,-10,4,14,ink);creator.setRotation(arm,-.5);
  const arm2=ellipse(g,8,-9,4,15,ink);creator.setRotation(arm2,.65);
  ellipse(g,-3,4,4,14,ink);ellipse(g,4,5,4,14,ink);
  move(g,[[0,{x:210+i*125,y:198}],[2,{x:214+i*125,y:196}],[4,{x:219+i*125,y:198}],[6,{x:214+i*125,y:196}],[8,{x:210+i*125,y:198}]]);
 }
 for(let i=0;i<3;i++){const g=group("distant-mist-"+i,80+i*230,150+i*12);ellipse(g,0,0,170,10,rgba(.64,.77,.74,.12));move(g,[[0,{x:80+i*230,y:150+i*12}],[4,{x:110+i*230,y:144+i*12}],[8,{x:80+i*230,y:150+i*12}]]);}
}else if(id==="beach"){
 for(let i=0;i<5;i++){
  const g=group("soft-wave-"+i,95+i*125,147+i*12);
  ellipse(g,0,0,95-i*7,2,rgba(.98,.96,.84,.5));
  move(g,[[0,{x:95+i*125,y:147+i*12}],[4,{x:114+i*125,y:151+i*12}],[8,{x:95+i*125,y:147+i*12}]]);
  creator.setOpacity(g,.18,{from:.18,to:.65,start:0,end:4});creator.setOpacity(g,.18,{from:.65,to:.18,start:4,end:8});
 }
 const g=group("distant-gull",200,60); const a=ellipse(g,-4,0,10,2,rgba(.27,.36,.40));creator.setRotation(a,.3);const b=ellipse(g,4,0,10,2,rgba(.27,.36,.40));creator.setRotation(b,-.3);
 move(g,[[0,{x:-30,y:60}],[4,{x:330,y:45}],[8,{x:690,y:60}]],"linear");
}else{
 for(let i=0;i<18;i++){
  const x=18+(i*137)%640,y=10+(i*61)%150,g=group("star-"+i,x,y);
  ellipse(g,0,0,2+i%2,2+i%2,rgba(.83,.93,.99));
  creator.setOpacity(g,.2,{from:.2,to:.85,start:0,end:3+i%3});
  creator.setOpacity(g,.2,{from:.85,to:.2,start:3+i%3,end:8});
  if(id==="spaceship")move(g,[[0,{x,y}],[4,{x:x-11,y:y+5}],[8,{x,y}]],"linear");
 }
 if(id==="spaceship"){
  for(let i=0;i<4;i++){const g=group("passing-stardust-"+i,700,20+i*55);ellipse(g,0,0,26,1,rgba(.64,.87,.99,.4));move(g,[[0,{x:700+i*90,y:20+i*55}],[8,{x:-80,y:48+i*55}]],"linear");}
 }else{
  const g=group("orbital-satellite",0,70);rect(g,0,0,5,5,rgba(.77,.84,.9));rect(g,-7,0,7,3,rgba(.32,.54,.76));rect(g,7,0,7,3,rgba(.32,.54,.76));move(g,[[0,{x:-30,y:70}],[8,{x:690,y:50}]],"linear");
 }
}
creator.focusOn(c);
return creator.export("study-window-"+id+".json","lottie");
