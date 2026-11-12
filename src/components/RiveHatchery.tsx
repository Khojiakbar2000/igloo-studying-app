import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Egg } from './SceneArt';

export function RiveHatchery({
  tapStep,
  playHatchSequence = false,
  reducedMotion = false,
  style,
  onReady,
}: {
  tapStep: number;
  playHatchSequence?: boolean;
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
  onReady: () => void;
}) {
  const opacity = useSharedValue(1);
  const eggStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => {
    opacity.value = withTiming(tapStep === 3 && !playHatchSequence ? 0 : 1, { duration: tapStep === 3 && !playHatchSequence ? 560 : 180 });
  }, [opacity, playHatchSequence, tapStep]);

  return (
    <View style={[styles.wrap, style]} accessible accessibilityRole="image" accessibilityLabel="A little egg with a crack appearing"> 
      <Animated.View style={eggStyle}><Egg size={214} cracks={tapStep} /></Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center' } });
