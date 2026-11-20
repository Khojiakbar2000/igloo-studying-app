import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { AnimationObject } from 'lottie-react-native';
import LottiePlayer from './StudyTogetherLottiePlayer';
type Props={data:AnimationObject;active:boolean};
export function HomeLottie({data,active}:Props){
 const ref=useRef<{play:(start?:number,end?:number)=>void;pause:()=>void;resume:()=>void}>(null);
 const [size,setSize]=useState({width:0,height:0});
 useEffect(()=>{if(active)ref.current?.play();else ref.current?.pause();},[active,data]);
 return <View pointerEvents="none" onLayout={e=>setSize(e.nativeEvent.layout)} style={[StyleSheet.absoluteFill,{opacity:active?1:0}]}>{size.width>0&&<LottiePlayer ref={ref} source={data} loop autoPlay={active} style={{position:'absolute',width:size.width,height:size.width,top:(size.height-size.width)/2,transform:[{scaleY:size.height/size.width}]}}/>}</View>;
}
