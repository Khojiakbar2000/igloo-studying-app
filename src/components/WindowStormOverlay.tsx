import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottiePlayer from './StudyTogetherLottiePlayer';
import { useReducedMotion } from 'react-native-reanimated';

const storm = require('../../assets/animations/study-together-window/window-blizzard.json');

export function WindowStormOverlay() {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <LottiePlayer source={storm} autoPlay loop style={StyleSheet.absoluteFill} />
  </View>;
}

