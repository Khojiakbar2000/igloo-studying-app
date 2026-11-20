import React,{useEffect,useRef}from'react';
import lottie,{type AnimationItem}from'lottie-web';
import type {WinterLottieProps}from'./WinterLottie.types';
export function WinterLottie(props:WinterLottieProps){
 const element=useRef<HTMLDivElement>(null),player=useRef<AnimationItem|null>(null),latest=useRef(props);latest.current=props;
 const sync=()=>{const a=player.current,p=latest.current;if(!a)return;if(p.progress!==undefined)a.goToAndStop(Math.max(0,Math.min(1,p.progress))*(a.totalFrames-1),true);else if(p.playing)a.play();else a.pause();};
 useEffect(()=>{if(!element.current)return;const p=latest.current;const a=lottie.loadAnimation({container:element.current,animationData:JSON.parse(JSON.stringify(p.data)),renderer:'svg',autoplay:false,loop:p.loop??true,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});player.current=a;a.addEventListener('DOMLoaded',()=>{sync();latest.current.onLoaded?.();});a.addEventListener('complete',()=>latest.current.onFinish?.());a.addEventListener('data_failed',()=>latest.current.onError?.());return()=>{a.destroy();player.current=null;};},[props.data,props.loop]);
 useEffect(sync,[props.playing,props.progress]);
 return <div ref={element} aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}/>;
}
