import React, { useEffect, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const WALK_FRAMES = [
  require('../../assets/animations/igloo-penguin-walk/frame-01.png'),
  require('../../assets/animations/igloo-penguin-walk/frame-02.png'),
  require('../../assets/animations/igloo-penguin-walk/frame-03.png'),
  require('../../assets/animations/igloo-penguin-walk/frame-04.png'),
];
const SEATED_POSE = require('../../assets/characters/penguin/poses/seated.png');

type ActingPhase = 'walking' | 'climbing' | 'seated';

/** Pip makes one purposeful entrance, then settles into the chair beside the user. */
export function IglooChairJourney({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const [phase, setPhase] = useState<ActingPhase>(reducedMotion ? 'seated' : 'walking');
  const [frame, setFrame] = useState(0);
  const [roomSize, setRoomSize] = useState({ width: 350, height: 525 });
  const journey = useSharedValue(reducedMotion ? 2 : 0);

  useEffect(() => {
    if (reducedMotion) {
      journey.value = 2;
      setPhase('seated');
      return;
    }
    if (phase !== 'walking') return;
    const frameTimer = setInterval(() => setFrame((current) => (current + 1) % WALK_FRAMES.length), 135);
    journey.value = withTiming(1, { duration: 2350, easing: Easing.inOut(Easing.cubic) }, (finished) => {
      if (!finished) return;
      runOnJS(setPhase)('climbing');
      journey.value = withTiming(2, { duration: 610, easing: Easing.out(Easing.back(1.25)) }, (climbed) => {
        if (climbed) runOnJS(setPhase)('seated');
      });
    });
    return () => clearInterval(frameTimer);
  }, [reducedMotion, phase, journey]);

  const motionStyle = useAnimatedStyle(() => {
    // Positions are normalized to the 2:3 room illustration. Pip starts by the
    // entrance, crosses the open floor, then climbs to the chair's visible seat.
    const x = interpolate(journey.value, [0, 0.33, 0.68, 1, 2], [0.08, 0.14, 0.22, 0.23, 0.38]);
    const y = interpolate(journey.value, [0, 0.33, 0.68, 1, 2], [0.22, 0.30, 0.36, 0.40, 0.31]);
    const bob = journey.value < 1 ? Math.sin(journey.value * Math.PI * 16) * 2.5 : 0;
    const hop = journey.value >= 1 && journey.value <= 2 ? -Math.sin((journey.value - 1) * Math.PI) * 10 : 0;
    const turn = journey.value < 1 ? Math.sin(journey.value * Math.PI * 8) * 2.2 : 0;
    return {
      transform: [
        { translateX: x * roomSize.width },
        { translateY: y * roomSize.height + bob + hop },
        { rotate: `${turn}deg` },
        { scale: journey.value >= 1 && journey.value <= 2 ? 1 + Math.sin((journey.value - 1) * Math.PI) * 0.035 : 1 },
      ],
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width && height) setRoomSize({ width, height });
  };

  return (
    <View pointerEvents="none" onLayout={onLayout} style={StyleSheet.absoluteFill}>
      <Animated.View accessibilityLabel={phase === 'seated' ? 'Pip is sitting on the chair' : 'Pip is walking to the chair'} style={[styles.actor, motionStyle]}>
        {phase === 'seated'
          ? <Image source={SEATED_POSE} resizeMode="contain" style={styles.art} />
          : <Image source={WALK_FRAMES[frame]} resizeMode="contain" style={styles.art} />}
        <View pointerEvents="none" style={styles.groundingShadow} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  actor: { position: 'absolute', left: 0, top: 0, width: 122, height: 136, zIndex: 2, alignItems: 'center', justifyContent: 'center' },
  art: { width: '100%', height: '100%' },
  groundingShadow: { position: 'absolute', bottom: 4, width: 48, height: 9, borderRadius: 99, backgroundColor: '#3F426B26', zIndex: -1 },
});
