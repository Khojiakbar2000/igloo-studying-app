import React,{useEffect,useRef}from'react';
import {StyleSheet,View}from'react-native';
import lottie,{type AnimationItem}from'lottie-web';
export function HomeLottie({data,active}:{data:object;active:boolean}){
 const container=useRef<HTMLDivElement>(null),player=useRef<AnimationItem|null>(null);
 const activeRef=useRef(active);activeRef.current=active;
 useEffect(()=>{if(!container.current)return;const animation=lottie.loadAnimation({container:container.current,renderer:'svg',loop:true,autoplay:activeRef.current,animationData:data,rendererSettings:{preserveAspectRatio:'none'}});player.current=animation;return()=>{animation.destroy();player.current=null;};},[data]);
 useEffect(()=>{if(active)player.current?.play();else player.current?.pause();},[active,data]);
 return <View pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:active?1:0}]}><div ref={container} aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/></View>;
}
