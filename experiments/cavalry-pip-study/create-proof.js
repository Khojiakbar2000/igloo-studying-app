// Technical proof only: whole-artwork breathing and attached vector glasses.
// This is not the finished character rig.
const pip='footageShape#1';
const created=[];
for(const spec of [{name:'Glasses — left lens',x:-38,y:106,rx:68,ry:82},{name:'Glasses — right lens',x:164,y:103,rx:47,ry:68}]){
 const id=api.primitive('ellipse',spec.name);created.push(id);
 api.set(id,{'generator.radius':[spec.rx,spec.ry],position:[spec.x,spec.y],'stroke.strokeColor':'#583d31','stroke.strokeWidth':8,drawOnTopOfParent:true});
 api.setFill(id,false);api.setStroke(id,true);api.parent(id,pip);
}
const bridge=api.primitive('rectangle','Glasses — bridge');created.push(bridge);
api.set(bridge,{'generator.dimensions':[92,8],position:[72,132],'material.materialColor':'#583d31',drawOnTopOfParent:true});api.parent(bridge,pip);
for(const [f,sx,sy,rot] of [[0,1,1,0],[22,1.002,1.005,-0.15],[45,1,1,0],[67,1.002,1.005,0.12],[90,1,1,0]]){
 api.keyframe(pip,f,{'scale.x':sx,'scale.y':sy,'rotation.z':rot});
 if(f<90)for(const attr of ['scale.x','scale.y','rotation.z'])api.magicEasing(pip,attr,f,'SlowInSlowOut');
}
api.setFrame(0);
const q='renderQueueItem#1';
api.set(q,{filePath:'/Users/aaaaa/Desktop/penguin/experiments/cavalry-pip-study',fileName:'pip-technical-proof',resolutionScale:50,canvaUpload:false,upload:false,frameRangeMode:0});
api.saveSceneAs('/Users/aaaaa/Desktop/penguin/experiments/cavalry-pip-study/pip-study.cv');
console.log(JSON.stringify({created,queue:q}));
api.render(q);
