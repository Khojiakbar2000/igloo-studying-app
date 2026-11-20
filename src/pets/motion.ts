import type { AnimationObject } from 'lottie-react-native';
import type { PetId, PetMood } from './pets';

type Sprite = {id:string; w:number; h:number; u:string; e:number; p:string};
const sprites: Record<PetId, Record<string, Sprite>> = require('../../assets/animations/igloo-pets/sprites.json');
export type PetPose = PetMood | 'look' | 'feed';
export const petStill = (id: PetId, pose: PetPose) => ({uri:(sprites[id][pose==='feed'||pose==='interact'?'look':pose==='happy'?'blink':pose] ?? sprites[id].idle).p});
const ease = { i: { x:.6, y:1 }, o: { x:.4, y:0 } };
const fixed = <T,>(k:T) => ({a:0,k});
const keys = (values: [number, number[]][]) => ({a:1,k:values.map(([t,s])=>({t,s,...ease}))});
const layer = (ty:number,nm:string,ip:number,op:number,ind:number) => ({ty,nm,ip,op,ind,st:0,sr:1,ddd:0,ao:0});

export function petAnimation(pet:PetId, pose:PetPose):AnimationObject {
 const art=sprites[pet];
 const primary=art[pose==='feed'||pose==='interact'?'look':pose==='happy'?'blink':pose] ?? art.idle;
 const end=pose==='idle'?144:pose==='sleep'?94:pose==='walk'?24:72;
 const middle=Math.floor(end/2);
 const hop=pose==='play'?21:pose==='happy'?9:pose==='walk'?(pet==='bunny'?12:5):0;
 const turn=pose==='play'?(pet==='seal'?15:9):pose==='interact'?5:pose==='feed'?-15:0;
 const makeImage=(sprite:Sprite,start:number,stop:number,ind:number)=>({
   ...layer(2,sprite.id,start,stop,ind),refId:sprite.id,
   ks:{
    p:keys([[0,[100,171,0]],[middle,[100,171-hop+(pose==='feed'?5:0),0]],[end,[100,171,0]]]),
    a:fixed([sprite.w/2,sprite.h-1,0]),
    s:keys([[0,[100,100,100]],[middle,[101,pose==='sleep'?96:103,100]],[end,[100,100,100]]]),
    r:keys([[0,[0]],[middle,[turn]],[end,[0]]]),o:fixed(100),
   },
 });
 const frames=pose==='idle' ? [makeImage(primary,0,68,1),makeImage(art.blink,68,73,2),makeImage(primary,73,107,3),makeImage(art.look,107,129,4),makeImage(primary,129,end,5)] : [makeImage(primary,0,end,1)];
 return {v:'5.7.0',fr:24,ip:0,op:end,w:200,h:190,nm:pose,assets:pose==='idle'?[primary,art.blink,art.look]:[primary],layers:frames} as AnimationObject;
}
