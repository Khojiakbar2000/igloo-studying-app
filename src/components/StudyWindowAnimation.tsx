import React, { useEffect, useRef } from 'react';
import { AppState, StyleSheet } from 'react-native';
import LottiePlayer from './StudyTogetherLottiePlayer';
import { useReducedMotion } from 'react-native-reanimated';

type Props = { source: React.ComponentProps<typeof LottiePlayer>['source'] };

export function StudyWindowAnimation({ source }: Props) {
  const reducedMotion = useReducedMotion();
  const animation = useRef<{play:(start?:number,end?:number)=>void;pause:()=>void;resume:()=>void}>(null);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !reducedMotion) animation.current?.resume();
      else animation.current?.pause();
    });
    return () => subscription.remove();
  }, [reducedMotion]);
  if (reducedMotion) return null;
  return <LottiePlayer ref={animation} source={source} autoPlay loop style={StyleSheet.absoluteFill} />;
}
