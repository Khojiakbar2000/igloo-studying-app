import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/** Pause the ambient clocks offscreen, in the background, or when motion is reduced. */
export function useHomeMotion(enabled = true) {
 const systemReduced = useReducedMotion();
 const [reduced,setReduced]=useState(systemReduced);
 const [foreground,setForeground]=useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
 const [visible,setVisible]=useState(Platform.OS!=='web'||typeof document==='undefined'||!document.hidden);
 useEffect(()=>{
  void AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(()=>undefined);
  const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);
  const app=AppState.addEventListener('change',state=>setForeground(state==='active'));
  const visibility=()=>setVisible(!document.hidden);
  if(Platform.OS==='web'&&typeof document!=='undefined')document.addEventListener('visibilitychange',visibility);
  return()=>{motion.remove();app.remove();if(Platform.OS==='web'&&typeof document!=='undefined')document.removeEventListener('visibilitychange',visibility);};
 },[]);
 return enabled && !reduced && foreground && visible;
}
