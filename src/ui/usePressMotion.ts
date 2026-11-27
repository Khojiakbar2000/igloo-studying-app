import { useCallback } from 'react';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion } from '../theme';

/** Small tactile press response shared by primary and icon controls. */
export function usePressMotion() {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const onPressIn = useCallback(() => {
    if (!reducedMotion) scale.value = withSpring(0.975, motion.spring);
  }, [reducedMotion, scale]);
  const onPressOut = useCallback(() => {
    if (!reducedMotion) scale.value = withSpring(1, motion.spring);
  }, [reducedMotion, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return { onPressIn, onPressOut, animatedStyle };
}
