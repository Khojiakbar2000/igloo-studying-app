import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import lottie from 'lottie-web';
import { useReducedMotion } from 'react-native-reanimated';

const storm = require('../../assets/animations/study-together-window/window-blizzard.json');

export function WindowStormOverlay() {
  const reducedMotion = useReducedMotion();
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || reducedMotion || !container.current) return undefined;
    const animation = lottie.loadAnimation({
      container: container.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: storm,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    return () => animation.destroy();
  }, [reducedMotion]);

  if (reducedMotion) return null;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <div ref={container} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
  </View>;
}

