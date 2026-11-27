import type { WardrobeLayout } from '../home/state';
import { ChairEquipment } from '../wardrobe/ChairEquipment';
import { chairArt, performanceFrames } from '../wardrobe/chairArt';
import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { RiveRef } from 'rive-react-native';
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

let RiveView: React.ComponentType<any> | null = null;
try {
  RiveView = (require('rive-react-native') as typeof import('rive-react-native')).default;
} catch {
  // Expo Go can still show the same seated character as a static fallback.
}

export function RoomCharacter({
  idleEyes,
  equipped,
  walking = false,
  performanceFrame = null,
  celebrate = false,
  onPerformanceReady,
  reducedMotion = false,
  style,
}: {
  idleEyes?: React.ReactNode;
  equipped?: WardrobeLayout;
  walking?: boolean;
  performanceFrame?: number | null;
  celebrate?: boolean;
  onPerformanceReady?: () => void;
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const riveRef = useRef<RiveRef>(null);
  const [walkFrame, setWalkFrame] = useState(0);
  const [riveReady, setRiveReady] = useState(false);
  const [riveFailed, setRiveFailed] = useState(!RiveView);
  const breath = useSharedValue(1);
  const walkTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const walkedIn = useRef(false);
  const idleStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: breath.value }] }));

  useEffect(() => {
    if (celebrate && !reducedMotion && riveReady) riveRef.current?.fireState('Character', 'happy');
  }, [celebrate, reducedMotion, riveReady]);

  useEffect(() => {
    if (!onPerformanceReady) return;
    let active = true;
    const sources = performanceFrames
      .map((_, index) => Image.resolveAssetSource(chairArt(index, equipped?.neck))?.uri)
      .filter((uri): uri is string => Boolean(uri));
    Promise.allSettled(sources.map((uri) => Image.prefetch(uri))).then(() => {
      if (active) onPerformanceReady();
    });
    return () => { active = false; };
  }, [onPerformanceReady, equipped?.neck]);

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
    else if (walkedIn.current && !reducedMotion && riveReady) {
      riveRef.current?.fireState('Character', 'happy');
      walkedIn.current = false;
    }
  }, [walking, reducedMotion, riveReady]);

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
      <Animated.View style={[StyleSheet.absoluteFill, idleStyle]}>
        {performanceFrame !== null || (!walking && !!equipped?.head) || (reducedMotion && equipped)
          ? <ChairEquipment frame={reducedMotion ? 13 : performanceFrame ?? 13} equipped={equipped ?? {}} eyes={idleEyes} />
          : walking && !reducedMotion
          ? <Image source={walkFrames[walkFrame]} resizeMode="contain" style={styles.imageFill} />
          : (reducedMotion || riveFailed || !RiveView || !riveReady)
            ? <Image source={seatedImage} resizeMode="contain" style={styles.imageFill} />
            : null}
        {RiveView && !riveFailed && !reducedMotion && !walking && performanceFrame === null && (
          <RiveView
            ref={riveRef}
            source={seatedRive}
            artboardName="Character"
            stateMachineName="Character"
            autoplay
            onPlay={() => setRiveReady(true)}
            onError={() => setRiveFailed(true)}
            style={StyleSheet.absoluteFill}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  character: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  imageFill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
});
