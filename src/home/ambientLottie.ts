// Small vector-only loops for the existing Lottie runtime. No raster sequences or particles.
const value = (k: any) => ({a:0,k});
const key = (t:number,s:any) => ({t,s,o:{x:1,y:1},i:{x:0,y:0}});
const animated = (frames:any[]) => ({a:1,k:frames});
const transform = (p:any = value([0,0]),o:any = value(100)) => ({a:value([0,0]),p,s:value([100,100]),r:value(0),o});
function polygon(points:number[][], closed=true) {return {v:points,i:points.map(()=>[0,0]),o:points.map(()=>[0,0]),c:closed};}
function masks(shape:'round'|'arch') {
 const k=.5522848,r=49;
 const circle={v:[[50,1],[99,50],[50,99],[1,50]],i:[[-r*k,0],[0,-r*k],[r*k,0],[0,r*k]],o:[[r*k,0],[0,r*k],[-r*k,0],[0,-r*k]],c:true};
 const arch={v:[[2,98],[2,43],[50,2],[98,43],[98,98]],i:[[0,0],[0,0],[-26,0],[0,-23],[0,0]],o:[[0,0],[0,-23],[26,0],[0,0],[0,0]],c:true};
 const mask=(mode:string,path:any)=>({inv:false,mode,pt:value(path),o:value(100),x:value(0)});
 return [mask('a',shape==='round'?circle:arch),... (shape==='round'?[47]:[31,65]).map(x=>mask('s',polygon([[x,0],[x+5,0],[x+5,100],[x,100]]))),...(shape==='round'?[mask('s',polygon([[0,48],[100,48],[100,54],[0,54]]))]:[])];
}
const comp=(name:string,duration:number,layers:any[],assets:any[]=[])=>({v:'5.7.0',fr:24,ip:0,op:duration,w:100,h:100,nm:name,ddd:0,assets,layers});
const shapeLayer=(ind:number,name:string,shapes:any[],duration:number,ks:any=transform())=>({ddd:0,ty:4,ind,nm:name,sr:1,ks,ao:0,ip:0,op:duration,st:0,bm:0,shapes});
const fill=(color:number[],opacity=100)=>({ty:'fl',c:value(color),o:value(opacity),r:1});
const cache=new Map<string,ReturnType<typeof comp>>();
export function snowAnimation(shape:'round'|'arch') {
 const cached=cache.get(shape);if(cached)return cached;
 const flakes=Array.from({length:16},(_,i)=>{
  const phase=((i*37+11)%100)/100,x=8+(i*29)%86,y=-8+phase*116,exit=(1-phase)*144;
  const p=animated([key(0,[x,y]),key(exit,[x+18*(1-phase),108]),key(exit+.01,[x-18*phase,-8]),key(144,[x,y])]);
  return shapeLayer(i+1,'Snow '+i,[{ty:'el',p:value([0,0]),s:value([i%3===0?1.8:1,i%3===0?1.8:1]),d:1},fill([.92,.97,1],i%3===0?78:50)],144,transform(p));
 });
 const precomp={ddd:0,ty:0,ind:1,nm:'Snow behind glass',refId:'flakes',sr:1,ks:transform(),ao:0,ip:0,op:144,st:0,bm:0,w:100,h:100,hasMask:true,masksProperties:masks(shape)};
 const result=comp('My Igloo · gentle snowfall',144,[precomp],[{id:'flakes',w:100,h:100,layers:flakes}]);cache.set(shape,result);return result;
}
export function gustAnimation(shape:'round'|'arch') {
 const id='gust-'+shape,cached=cache.get(id);if(cached)return cached;
 const layers=Array.from({length:5},(_,i)=>shapeLayer(i+1,'Occasional snowdrift '+i,[{ty:'el',p:value([0,0]),s:value([16+i*3,.5]),d:1},fill([.9,.96,1],32)],1440,transform(animated([key(0,[-30,12+i*17]),key(1032,[-30,12+i*17]),key(1200,[135,20+i*15]),key(1440,[135,20+i*15])]),animated([key(0,[0]),key(1032,[0]),key(1070,[65]),key(1160,[30]),key(1200,[0]),key(1440,[0])]))));
 const precomp={ddd:0,ty:0,ind:1,nm:'Drifting snow behind glass',refId:'gusts',sr:1,ks:transform(),ip:0,op:1440,st:0,w:100,h:100,hasMask:true,masksProperties:masks(shape)};
 const result=comp('My Igloo · occasional wind',1440,[precomp],[{id:'gusts',w:100,h:100,layers}]);cache.set(id,result);return result;
}
export const STEAM_ANIMATION=comp('My Igloo · tea steam',120,Array.from({length:3},(_,i)=>shapeLayer(i+1,'Tea wisp '+i,[{ty:'sh',ks:value(polygon([[0,18],[2,10],[-2,2],[0,-6]],false))},{ty:'st',c:value([1,.96,.85]),o:value(55),w:value(2),lc:2,lj:2}],120,transform(animated([key(0,[28+i*22,98]),key(120,[24+i*24,15])]),animated([key(0,[0]),key(20,[50]),key(78,[28]),key(120,[0])])))));
