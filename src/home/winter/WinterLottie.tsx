import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import LottiePlayer from '../../components/StudyTogetherLottiePlayer';
import type { AnimationObject } from 'lottie-react-native';
import type { WinterLottieProps } from './WinterLottie.types';
export function WinterLottie({ data, playing, loop = true, progress, onFinish, onError, onLoaded }: WinterLottieProps) {
 const ref=useRef<{play:(start?:number,end?:number)=>void;pause:()=>void;resume:()=>void}>(null), latest=useRef({playing,progress}); latest.current={playing,progress};
 const sync=useCallback(()=>{if(latest.current.progress!==undefined)return;if(latest.current.playing)ref.current?.play();else ref.current?.pause();},[]);
 useEffect(sync,[playing,data,progress,sync]);
 return <LottiePlayer ref={ref} source={data as AnimationObject} autoPlay={playing && progress===undefined} loop={loop} progress={progress===undefined?undefined:Math.max(0,Math.min(1,progress))} style={StyleSheet.absoluteFill} onLoaded={()=>{sync();onLoaded?.();}} onFinish={cancelled=>{if(!cancelled)onFinish?.();}} onFailure={onError ? () => onError() : undefined}/>;
}
