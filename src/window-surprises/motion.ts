import type { AnimationObject } from 'lottie-react-native';
import type { Surprise, SurpriseId } from './events';

type Sprite = { id:string; w:number; h:number; u:string; e:number; p:string };
const art:Record<SurpriseId,Sprite> = require('../../assets/animations/window-surprises/sprites.json');
export const illustration = (id:SurpriseId) => ({ uri:art[id].p });
type Point = [number, number];
type Mark = [number, Point];
const fixed = <T,>(k:T) => ({ a:0,k });
const linear = { i:{x:1,y:1},o:{x:0,y:0} };
const keys = (marks:[number,number[]][]) => ({ a:1,k:marks.map(([t,s])=>({t,s,...linear})) });
const position = (marks:Mark[]) => keys(marks.map(([t,[x,y]])=>[t,[x,y,0]]));
const layer = (ty:number,nm:string,op:number,ind:number,ip=0) => ({ty,nm,op,ind,ip,st:0,sr:1,ddd:0,ao:0});
const opaque = (windowEnd:number,fade:number) => keys([[0,[0]],[fade,[100]],[windowEnd-fade,[100]],[windowEnd,[0]]]);

const arch = {
  c:true,
  v:[[0,100],[110,12],[330,0],[550,12],[660,100],[660,212],[638,234],[22,234],[0,212]],
  i:[[0,0],[-70,12],[-90,0],[-70,-12],[0,-50],[0,0],[12,0],[0,0],[0,12]],
  o:[[0,-50],[70,-12],[90,0],[70,12],[0,0],[0,12],[0,0],[-12,0],[0,0]],
};

function masked(name:string,end:number,assets:Sprite[],layers:object[]):AnimationObject {
  return {v:'5.7.0',fr:24,ip:0,op:end,w:660,h:234,nm:name,
    assets:[...assets,{id:'masked-scene',layers}],
    layers:[{...layer(0,name,end,1),refId:'masked-scene',w:660,h:234,hasMask:true,
      masksProperties:[{inv:false,mode:'a',pt:fixed(arch),o:fixed(100),x:fixed(0)}],
      ks:{p:fixed([0,0,0]),a:fixed([0,0,0]),s:fixed([100,100,100]),o:fixed(100),r:fixed(0)}}],
  } as AnimationObject;
}

const duration = (event:Surprise) => event.rarity==='rare'?216:event.rarity==='special'?168:132;
export function flight(event:Surprise):Mark[] {
 const end=duration(event);
 switch(event.motion) {
  case 'ground':return [[0,[-45,184]],[end*.44,[281,178]],[end*.58,[363,185]],[end,[706,180]]];
  case 'sky':return [[0,[-60,43]],[end*.54,[280,82]],[end,[730,140]]];
  case 'pass':return [[0,[-75,143]],[end*.45,[300,101]],[end,[745,135]]];
  case 'approach':return [[0,[670,157]],[end*.43,[416,132]],[end*.70,[395,134]],[end,[-70,151]]];
  case 'slip':return [[0,[-45,182]],[end*.47,[345,179]],[end*.57,[406,204]],[end*.83,[447,185]],[end,[690,184]]];
  case 'dance':return [[0,[338,173]],[end*.35,[326,160]],[end*.55,[349,170]],[end*.73,[359,157]],[end,[338,173]]];
  case 'glow':return [[0,[338,113]],[end,[330,108]]];
 }
}

function actor(sprite:Sprite,end:number,path:Mark[],size:number,rotation:[number,number[]][],sizing?:[number,number[]][]) {
 return {...layer(2,sprite.id,end,1),refId:sprite.id,ks:{
   p:position(path),a:fixed([sprite.w/2,sprite.h/2,0]),s:keys(sizing??[[0,[size,size,100]],[end,[size,size,100]]]),
   r:keys(rotation),o:opaque(end,Math.min(24,end/5)),
 }};
}
function light(end:number,at:Point,rx:number,ry:number,color:number[],alpha:number,ind:number) {
 return {...layer(4,'Reflected light',end,ind),ks:{
   p:fixed([...at,0]),a:fixed([0,0,0]),s:fixed([100,100,100]),r:fixed(0),
   o:keys([[0,[0]],[end*.4,[alpha]],[end*.7,[alpha*.6]],[end,[0]]]),
 },shapes:[{ty:'el',d:1,p:fixed([0,0]),s:fixed([rx,ry])},{ty:'fl',c:fixed(color),o:fixed(100)}]};
}

export function surpriseMotion(event:Surprise) {
 const sprite=art[event.id];
 const end=duration(event);
 const wide=['aurora','nebula','sunset'].includes(event.id);
 const size=(wide?525:event.id==='baby-whale'?194:event.motion==='dance'?194:event.rarity==='rare'?126:110)/Math.max(sprite.w,sprite.h)*100;
 const turn=event.motion==='slip'?83:event.motion==='dance'?11:event.id==='ringed-planet'?22:5;
 const ground=event.motion==='ground';
 const base=[[0,[ground?0:-2]],[end*.32,[turn*.5]],[end*.56,[turn]],[end*.82,[turn*-.2]],[end,[0]]] as [number,number[]][];
 const sizing: [number,number[]][] = event.motion==='approach'
  ? [[0,[size*.6,size*.6,100]],[end*.44,[size,size,100]],[end*.70,[size,size,100]],[end,[size*.7,size*.7,100]]]
  : [[0,[size,size,100]],[end*.50,[size*(wide?1.14:1.02),size*(ground?.96:1.025),100]],[end,[size,size,100]]];
 const color=event.scene==='aquarium'?[.43,.9,1,1]:event.id==='aurora'?[.48,.95,.79,1]:[1,.73,.42,1];
 const glow=event.rarity!=='small'||event.id==='moon-orb';
 const trail=event.id==='golden-star'||event.id==='meteors';
 const facing=event.id==='baby-whale'?-1:1;
 const oriented: [number,number[]][] = sizing.map(([t,[x,y,z]])=>[t,[x*facing,y,z]]);
 const character=actor(sprite,end,flight(event),size,base,oriented);
 const echoes=trail?[{...character,ind:7,st:5,ks:{...character.ks,o:keys([[0,[0]],[35,[22]],[end-35,[16]],[end,[0]]])}}]:[];
 return masked(event.id,end,[sprite],[character,...echoes,...(glow?[light(end,[336,114],wide?640:320,wide?190:108,color,wide?14:9,8)]:[])]);
}

export function respondMotion(event:Surprise, seconds:number) {
 const points=flight(event);
 const frame=Math.max(0,Math.min(duration(event)-.001,seconds*24));
 const beforeIndex=Math.max(0,points.findIndex(([time])=>time>frame)-1);
 const [a,[x,y]]=points[beforeIndex];
 const [b,[nextX,nextY]]=points[beforeIndex+1];
 const fraction=(frame-a)/(b-a);
 const at:Point=[Math.max(75,Math.min(585,x+(nextX-x)*fraction)),Math.max(54,Math.min(181,y+(nextY-y)*fraction))];
 const end=27;
 const color=event.id==='ufo'?[.5,.95,1,1]:[1,.9,.66,1];
 const sprite=art[event.id];
 const size=(event.id==='baby-whale'?194:110)*100/Math.max(sprite.w,sprite.h);
 return masked('Response',end,[sprite],[
   light(end,[at[0]+36,at[1]-22],12,12,color,92,3),
   light(end,[at[0]-30,at[1]-27],8,8,color,75,4),
   light(end,at,128,96,color,event.id==='ufo'?36:15,5),
   actor(sprite,end,[[0,at],[12,[at[0],at[1]-7]],[end,at]],size,[[0,[0]],[8,[-11]],[18,[11]],[end,[0]]],
     event.id==='baby-whale'?[[0,[-size,size,100]],[end,[-size,size,100]]]:undefined),
 ]);
}
