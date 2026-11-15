// Run once against the isolated pip-dance.cv mesh scene.
const mesh='meshShape#1';
const comp=api.getActiveComp();
api.set(comp,{resolution:[1440,1440],fps:30,startFrame:0,endFrame:119,playbackStart:0,playbackEnd:119});
api.set('footageShape#1',{hidden:true});
api.set(mesh,{scale:[0.86,0.86],highQualityTriangulation:true});
const vertices=[];
// Triangulated texture puppet. Dense enough to keep the laptop region rigid.
for(let row=0;row<=12;row++)for(let col=0;col<=10;col++){
 const x=-588+1176*col/10,y=-668.5+1337*row/12;
 const idx=api.addArrayIndex(mesh,'meshVertex');
 // API returns an array index, not an attribute path.
 const n=Number.isFinite(Number(idx))?Number(idx):vertices.length;
 const prefix='meshVertex.'+n;
 api.set(mesh,{[prefix+'.bindPosition']:[x,y]});
 vertices.push({x,y,prefix});
}
console.log(JSON.stringify({vertices:vertices.length,first:vertices[0]}));
const smooth=(a,b,x)=>{let t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
for(let f=0;f<=120;f+=5){
 const phase=2*Math.PI*f/30;
 // Two beats per second, alternating left/right across a one-second phrase.
 const sway=Math.sin(phase),beat=Math.sin(phase*2),bounce=(1-Math.cos(phase*2))*0.5;
 const headAngle=0.065*sway;
 const neck={x:-140,y:-65};
 const values={};
 for(const v of vertices){
  const {x,y,prefix}=v;
  const head=smooth(-100,190,y)*(1-smooth(200,400,x));
  const hx=x-neck.x,hy=y-neck.y;
  let dx=head*(Math.cos(headAngle)*hx-Math.sin(headAngle)*hy-hx);
  let dy=head*(Math.sin(headAngle)*hx+Math.cos(headAngle)*hy-hy+12*bounce);
  // A pin field keeps the MacBook screen and keyboard planar.
  const laptop=smooth(-40,160,x)*(1-smooth(-20,100,y))*smooth(-500,-370,y);
  const flipper=Math.exp(-(((x+170)/170)**2+((y+205)/105)**2));
  dx+=flipper*20*beat;dy+=flipper*18*bounce;
  const scarf=Math.exp(-(((x+440)/115)**2+((y+170)/190)**2));
  dx+=scarf*14*Math.sin(phase-0.45);
  const feet=1-smooth(-570,-430,y);
  dy+=feet*(x<30?Math.max(0,sway):Math.max(0,-sway))*26;
  dx*=1-laptop;dy*=1-laptop;
  values[prefix+'.offset.x']=dx;values[prefix+'.offset.y']=dy;
 }
 api.keyframe(mesh,f,values);
 if(f<120)for(const key of Object.keys(values))api.magicEasing(mesh,key,f,'SlowInSlowOut');
 api.keyframe(mesh,f,{'position.x':14*sway,'position.y':18*bounce,'rotation.z':1.6*sway});
 if(f<120)for(const key of ['position.x','position.y','rotation.z'])api.magicEasing(mesh,key,f,'SlowInSlowOut');
}
api.setFrame(0);
api.setGenerator('renderQueueItem#1','generator','renderMP4');
api.set('renderQueueItem#1',{fileName:'pip-dance',resolutionScale:50,canvaUpload:false,upload:false});
api.saveSceneAs('/Users/aaaaa/Desktop/penguin/experiments/cavalry-pip-study/pip-dance.cv');
api.render('renderQueueItem#1');
