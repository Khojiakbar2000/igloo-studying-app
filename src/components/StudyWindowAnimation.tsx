import React, { useEffect, useRef } from 'react';
import { AppState, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useReducedMotion } from 'react-native-reanimated';

type Props = { source: React.ComponentProps<typeof LottieView>['source'] };

export function StudyWindowAnimation({ source }: Props) {
  const reducedMotion = useReducedMotion();
  const animation = useRef<LottieView>(null);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !reducedMotion) animation.current?.resume();
      else animation.current?.pause();
    });
    return () => subscription.remove();
  }, [reducedMotion]);
  if (reducedMotion) return null;
  return <LottieView ref={animation} source={source} autoPlay loop resizeMode="contain" style={StyleSheet.absoluteFill} />;
}
