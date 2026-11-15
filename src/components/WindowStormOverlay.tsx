import React from 'react';
import { StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useReducedMotion } from 'react-native-reanimated';

const storm = require('../../assets/animations/study-together-window/window-blizzard.json');

export function WindowStormOverlay() {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;
  return <LottieView
    pointerEvents="none"
    source={storm}
    autoPlay
    loop
    resizeMode="contain"
    style={StyleSheet.absoluteFill}
  />;
}

