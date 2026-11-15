import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import lottie from 'lottie-web';
import { useReducedMotion } from 'react-native-reanimated';

export function StudyWindowAnimation({ source }: { source: object }) {
  const reducedMotion = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reducedMotion || !container.current) return;
    const animation = lottie.loadAnimation({ container: container.current, renderer: 'svg', loop: true, autoplay: !document.hidden, animationData: source, rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } });
    const onVisibility = () => document.hidden ? animation.pause() : animation.play();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { document.removeEventListener('visibilitychange', onVisibility); animation.destroy(); };
  }, [source, reducedMotion]);
  if (reducedMotion) return null;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}><div ref={container} style={{ position: 'absolute', inset: 0 }} /></View>;
}
