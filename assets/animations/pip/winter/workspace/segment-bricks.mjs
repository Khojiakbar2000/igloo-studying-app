// Seeded edge-aware segmentation along the painted mortar, without new dependencies.
import sharp from 'sharp';
export async function segment(data,info){
const {width:W,height:H}=info,N=W*H;
const smooth=await sharp(data,{raw:info}).blur(2).raw().toBuffer();
const seeds=[[55,340],[112,343],[279,363],[374,346],[498,327],[564,322],[75,282],[124,258],[178,300],[275,291],[356,267],[450,260],[530,258],[134,221],[195,207],[251,224],[318,214],[407,200],[497,205],[163,180],[214,160],[292,146],[390,153],[466,151],[226,116],[317,104],[390,96],[336,59]];
const labels=new Int16Array(N).fill(-1),dist=new Float64Array(N).fill(Infinity);const heap=[];
function push(v){heap.push(v);let i=heap.length-1;while(i){let p=(i-1)>>1;if(heap[p][0]<=v[0])break;heap[i]=heap[p];i=p;}heap[i]=v;}
function pop(){const v=heap[0],last=heap.pop();if(heap.length){let i=0;while(2*i+1<heap.length){let j=2*i+1;if(j+1<heap.length&&heap[j+1][0]<heap[j][0])j++;if(heap[j][0]>=last[0])break;heap[i]=heap[j];i=j;}heap[i]=last;}return v;}
seeds.forEach(([x,y],label)=>{const p=y*W+x;if(data[p*4+3]>100){dist[p]=0;labels[p]=label;push([0,p,label]);}});
while(heap.length){const [d,p,label]=pop();if(d>dist[p])continue;const x=p%W,y=(p/W)|0;for(const q of [x?p-1:-1,x<W-1?p+1:-1,y?p-W:-1,y<H-1?p+W:-1]){if(q<0||data[q*4+3]<1)continue;let edge=0;for(let c=0;c<3;c++)edge+=Math.abs(smooth[p*4+c]-smooth[q*4+c]);const cost=d+1+edge*.6;if(cost<dist[q]){dist[q]=cost;labels[q]=label;push([cost,q,label]);}}}
// Attach disconnected antialias islands to their closest painted brick.
for(let p=0;p<N;p++){if(data[p*4+3]&&labels[p]<0){const x=p%W,y=(p/W)|0;let best=Infinity;seeds.forEach(([sx,sy],i)=>{const d=(x-sx)**2+(y-sy)**2;if(d<best){best=d;labels[p]=i;}});}}
const pieces=seeds.map(([sx,sy],label)=>({label,sx,sy,x:W,y:H,maxX:0,maxY:0,area:0,entrance:sx<290&&sy>200,order:1000-sy+sx/10000}));for(let p=0;p<N;p++){const l=labels[p];if(l<0||!data[p*4+3])continue;const b=pieces[l],x=p%W,y=(p/W)|0;b.x=Math.min(b.x,x);b.y=Math.min(b.y,y);b.maxX=Math.max(b.maxX,x);b.maxY=Math.max(b.maxY,y);b.area++;}
return {labels,pieces:pieces.filter(p=>p.area).map(p=>({...p,width:p.maxX-p.x+1,height:p.maxY-p.y+1})).sort((a,b)=>a.order-b.order)};
}
