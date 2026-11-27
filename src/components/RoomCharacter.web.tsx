import type { WardrobeLayout } from '../home/state';
import { ChairEquipment } from '../wardrobe/ChairEquipment';
import { chairArt, performanceFrames } from '../wardrobe/chairArt';
import React, { useEffect, useRef, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';


const seatedRive = require('../../assets/animations/igloo-penguin-seated.riv');
const seatedImage = require('../../assets/characters/penguin/poses/seated.png');

const walkFrames = [
  require('../../assets/animations/igloo-penguin-walk/frame-01.png'),
  require('../../assets/animations/igloo-penguin-walk/frame-02.png'),
  require('../../assets/animations/igloo-penguin-walk/frame-03.png'),
  require('../../assets/animations/igloo-penguin-walk/frame-04.png'),
];

const allPerformanceFrames = performanceFrames;

export function RoomCharacter({
  idleEyes,
  walking = false,
  performanceFrame = null,
  celebrate = false,
  onPerformanceReady,
  equipped,
  reducedMotion = false,
  style,
}: {
  idleEyes?: React.ReactNode;
  walking?: boolean;
  performanceFrame?: number | null;
  celebrate?: boolean;
  onPerformanceReady?: () => void;
  equipped?: WardrobeLayout;
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [walkFrame, setWalkFrame] = useState(0);
  const [riveReady, setRiveReady] = useState(false);
  const [preloadedFrameCount, setPreloadedFrameCount] = useState(0);
  const preloadedFrames = useRef(new Set<number>());
  const breath = useSharedValue(1);
  const walkTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const walkedIn = useRef(false);
  const celebrated = useRef(false);
  const source = typeof seatedRive === 'string' ? seatedRive : Image.resolveAssetSource(seatedRive)?.uri;
  const { rive, RiveComponent } = useRive({
    src: source,
    artboard: 'Character',
    stateMachine: 'Character',
    autoplay: !reducedMotion,
  });
  const happyTrigger = useStateMachineInput(rive, 'Character', 'happy');
  const idleStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: breath.value }] }));

  useEffect(() => {
    if (celebrate && !celebrated.current && happyTrigger) {
      happyTrigger.fire();
      celebrated.current = true;
    }
    if (!celebrate) celebrated.current = false;
  }, [celebrate, happyTrigger]);

  useEffect(() => {
    if (walking || performanceFrame !== null || reducedMotion) {
      cancelAnimation(breath);
      breath.value = 1;
      return;
    }
    breath.value = withRepeat(
      withSequence(
        withTiming(0.99, { duration: 1_450, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1_850, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => cancelAnimation(breath);
  }, [walking, performanceFrame, reducedMotion, breath]);

  useEffect(() => {
    if (!walking || reducedMotion) {
      if (walkTimer.current) clearInterval(walkTimer.current);
      walkTimer.current = null;
      return;
    }
    walkTimer.current = setInterval(() => setWalkFrame((frame) => (frame + 1) % walkFrames.length), 145);
    return () => {
      if (walkTimer.current) clearInterval(walkTimer.current);
      walkTimer.current = null;
    };
  }, [walking, reducedMotion]);

  useEffect(() => {
    if (walking) walkedIn.current = true;
    else if (walkedIn.current && !reducedMotion && happyTrigger) {
      happyTrigger.fire();
      walkedIn.current = false;
    }
  }, [walking, reducedMotion, happyTrigger]);

  useEffect(() => {
    if (rive) setRiveReady(true);
  }, [rive]);

  useEffect(() => {
    if (onPerformanceReady && preloadedFrameCount === allPerformanceFrames.length) onPerformanceReady();
  }, [onPerformanceReady, preloadedFrameCount]);

  const markPreloaded = (index: number) => {
    if (preloadedFrames.current.has(index)) return;
    preloadedFrames.current.add(index);
    setPreloadedFrameCount(preloadedFrames.current.size);
  };

  const performanceDescription = performanceFrame === null
    ? 'Pip is seated and relaxed.'
    : performanceFrame < 3
      ? 'Pip notices the chair and turns to look.'
      : performanceFrame < 7
        ? 'Pip waddles toward the chair.'
        : performanceFrame === 7
          ? 'Pip pauses and prepares to hop.'
          : performanceFrame < 11
            ? 'Pip hops onto the chair and lands.'
            : 'Pip settles into a comfortable seat.';

  return (
    <View accessibilityLabel={performanceDescription} style={[styles.character, style]}>
      {onPerformanceReady && <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.preload}>
        {allPerformanceFrames.map((_, index) => <Image key={index} source={chairArt(index, equipped?.neck)} resizeMode="contain" style={styles.preloadImage} onLoad={() => markPreloaded(index)} onError={() => markPreloaded(index)} />)}
      </View>}
      <Animated.View style={[StyleSheet.absoluteFill, idleStyle]}>
      {performanceFrame !== null || (!walking && !!equipped?.head) || (reducedMotion && equipped)
          ? <ChairEquipment frame={reducedMotion ? 13 : performanceFrame ?? 13} equipped={equipped ?? {}} eyes={idleEyes} />
          : walking && !reducedMotion
          ? <Image source={walkFrames[walkFrame]} resizeMode="contain" style={styles.fill as StyleProp<ImageStyle>} />
          : reducedMotion || !riveReady
            ? <Image source={seatedImage} resizeMode="contain" style={styles.fill as StyleProp<ImageStyle>} />
            : source && <RiveComponent style={{ display: 'block', width: '100%', height: '100%' }} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  character: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  fill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  preload: { position: 'absolute', width: 1, height: 1, left: -2, top: -2, opacity: 0, overflow: 'hidden' },
  preloadImage: { position: 'absolute', width: 1, height: 1 },
});
