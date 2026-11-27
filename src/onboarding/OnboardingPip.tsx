import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { CharacterAction, CharacterEmotion } from '../character/CharacterBehaviorController';
import { useHomeMotionState } from '../home/useHomeMotion';
import * as tracks from './pipStorybookMotion';

const artboard = 720;
const ground = 610;
const footBottom = 646;
const framesPerSecond = 30;
const easing = Easing.bezierFn(0.42, 0, 0.58, 1);

type Track = ReadonlyArray<readonly [frame: number, value: number]>;
function sample(keys: Track, frame: number) {
  'worklet';
  for (let index = 1; index < keys.length; index++) {
    const [endFrame, endValue] = keys[index];
    if (frame <= endFrame) {
      const [startFrame, startValue] = keys[index - 1];
      const progress = easing(Math.max(0, (frame - startFrame) / (endFrame - startFrame)));
      return startValue + (endValue - startValue) * progress;
    }
  }
  return keys[keys.length - 1][1];
}

// Positions and pivots match the storybook rig in its 720 px artboard.
const rig = {
  body: { source: require('../../assets/animations/pip/storybook/character/body.png'), x: 208, y: 80, width: 304, height: 500, pivotX: 152, pivotY: 250 },
  leftArm: { source: require('../../assets/animations/pip/storybook/character/flipper-left.png'), x: 200.25, y: 384, width: 85, height: 96, pivotX: 63.75, pivotY: 16 },
  rightArm: { source: require('../../assets/animations/pip/storybook/character/flipper-right.png'), x: 448.5, y: 384, width: 86, height: 96, pivotX: 21.5, pivotY: 16 },
  leftFoot: { source: require('../../assets/animations/pip/storybook/character/foot-left.png'), x: 290.5, y: 569, width: 49, height: 45, pivotX: 24.5, pivotY: 9 },
  rightFoot: { source: require('../../assets/animations/pip/storybook/character/foot-right.png'), x: 391, y: 569, width: 48, height: 45, pivotX: 24, pivotY: 9 },
};
const eyelids = require('../../assets/experiments/pip-storybook-correction-v1/expressions/blink-overlay.png');

function partStyle(part: typeof rig[keyof typeof rig], scale: number) {
  return {
    position: 'absolute' as const, left: part.x * scale, top: part.y * scale,
    width: part.width * scale, height: part.height * scale,
    transformOrigin: [part.pivotX * scale, part.pivotY * scale, 0],
  };
}

export function OnboardingPip({
  emotion = 'curious', action = 'idle', reactionKey, enabled = true, style,
}: {
  emotion?: CharacterEmotion;
  action?: CharacterAction;
  reactionKey?: string | number;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { motion } = useHomeMotionState(enabled);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const scale = Math.min(size.width / 390, size.height / 585);
  const breath = useSharedValue(0);
  const blink = useSharedValue(0);
  const frame = useSharedValue(90);
  const wave = action === 'wave';
  const cheer = action === 'celebrate';
  const react = action === 'react';
  const sleepy = emotion === 'sleepy';
  const playful = emotion === 'playful' || emotion === 'encouraging' || emotion === 'happy';
  const lean = playful ? -0.65 : sleepy ? -0.42 : 1;

  useEffect(() => {
    if (!motion) return;
    breath.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.linear }), -1);
    blink.value = withRepeat(withTiming(156, { duration: sleepy ? 8500 : 5200, easing: Easing.linear }), -1);
    return () => {
      cancelAnimation(breath);
      cancelAnimation(blink);
      breath.value = 0;
      blink.value = 0;
    };
  }, [blink, breath, motion, sleepy]);

  useEffect(() => {
    if (!motion || (!wave && !cheer && !react)) return;
    frame.value = 0;
    frame.value = withTiming(90, {
      duration: react ? 1300 : (90 / framesPerSecond) * 1000,
      easing: Easing.linear,
    });
    return () => {
      cancelAnimation(frame);
      frame.value = 90;
    };
  }, [cheer, frame, motion, react, reactionKey, wave]);

  const bodyMotion = useAnimatedStyle(() => {
    const inhale = motion ? (1 - Math.cos(breath.value * Math.PI * 2)) / 2 : 0;
    const current = motion ? frame.value : 90;
    return { transform: [
      { translateY: cheer ? sample(tracks.cheerLift, current) * scale : 0 },
      { rotate: `${wave ? sample(tracks.waveLean, current) : react ? lean * sample(tracks.curiousLean, current) : 0}deg` },
      { scaleX: 1 + inhale * 0.016 + (cheer ? sample(tracks.cheerWidth, current) : 0) },
      { scaleY: 1 + inhale * 0.028 + (cheer ? sample(tracks.cheerHeight, current) : 0) },
    ] };
  });
  const leftArm = useAnimatedStyle(() => ({
    transform: [{ rotate: `${motion ? wave ? sample(tracks.waveLeft, frame.value) : cheer ? sample(tracks.cheerLeft, frame.value) : 0 : 0}deg` }],
  }));
  const rightArm = useAnimatedStyle(() => ({
    transform: [{ rotate: `${motion ? wave ? sample(tracks.waveRight, frame.value) : cheer ? sample(tracks.cheerRight, frame.value) : 0 : 0}deg` }],
  }));
  const leftFoot = useAnimatedStyle(() => ({
    transform: [{ rotate: `${motion && cheer ? sample(tracks.cheerLeftFoot, frame.value) : 0}deg` }],
  }));
  const rightFoot = useAnimatedStyle(() => ({
    transform: [{ rotate: `${motion && cheer ? sample(tracks.cheerRightFoot, frame.value) : 0}deg` }],
  }));
  const paintedBlink = useAnimatedStyle(() => ({
    opacity: motion ? Math.max(
      sample(tracks.blink, blink.value),
      cheer || wave || (react && playful) ? sample(tracks.smile, frame.value) : 0,
    ) : 0,
  }));

  return <View accessible={false} pointerEvents="none" style={style} testID="onboarding-pip"
    onLayout={({ nativeEvent: { layout: { width, height } } }) => {
      setSize(current => current.width === width && current.height === height ? current : { width, height });
    }}>
    {scale > 0 && <Animated.View testID="pip-body-motion" style={[{
      position: 'absolute', width: artboard * scale, height: artboard * scale,
      left: (size.width - artboard * scale) / 2, top: size.height - footBottom * scale,
      transformOrigin: [artboard * scale / 2, ground * scale, 0],
    }, bodyMotion]}>
      <Image source={rig.body.source} style={partStyle(rig.body, scale)} resizeMode="stretch" fadeDuration={0} />
      <Animated.Image testID="pip-painted-eyelids" source={eyelids} resizeMode="stretch" fadeDuration={0}
        style={[partStyle(rig.body, scale), paintedBlink]} />
      <Animated.View testID="pip-left-flipper" style={[partStyle(rig.leftArm, scale), leftArm]}>
        <Image source={rig.leftArm.source} style={styles.part} resizeMode="stretch" fadeDuration={0} />
      </Animated.View>
      <Animated.View style={[partStyle(rig.rightArm, scale), rightArm]}>
        <Image source={rig.rightArm.source} style={styles.part} resizeMode="stretch" fadeDuration={0} />
      </Animated.View>
      <Animated.View style={[partStyle(rig.leftFoot, scale), leftFoot]}>
        <Image source={rig.leftFoot.source} style={styles.part} resizeMode="stretch" fadeDuration={0} />
      </Animated.View>
      <Animated.View style={[partStyle(rig.rightFoot, scale), rightFoot]}>
        <Image source={rig.rightFoot.source} style={styles.part} resizeMode="stretch" fadeDuration={0} />
      </Animated.View>
    </Animated.View>}
  </View>;
}

const styles = StyleSheet.create({ part: { width: '100%', height: '100%' } });
