import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { RoomCharacter } from './RoomCharacter';
import { playPipChairPerformance } from '../character/pipChairPerformance';

type RoomMode = 'personal' | 'study-together';
type SceneSize = { width: number; height: number };
const CHARACTER_SCALE = 0.93;

export function RoomCharacterOverlay({ mode }: { mode: RoomMode }) {
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState<SceneSize>({ width: 0, height: 0 });
  const [performanceFrame, setPerformanceFrame] = useState<number | null>(null);
  const [performanceReady, setPerformanceReady] = useState(false);
  const markPerformanceReady = useCallback(() => setPerformanceReady(true), []);
  const cancelPerformance = useRef<(() => void) | null>(null);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(CHARACTER_SCALE);
  const characterWidth = size.width * 0.46;
  const characterHeight = size.height * 0.43;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  useEffect(() => {
    if (mode !== 'personal' || size.width === 0 || size.height === 0) return;
    // Floor anchors are keyed to each drawing so foot contacts and travel stay together.
    const path = [
      [0.24, 0.47], [0.24, 0.47], [0.24, 0.47],
      [0.28, 0.49], [0.34, 0.505], [0.41, 0.525], [0.47, 0.54],
      [0.51, 0.55], [0.52, 0.535], [0.55, 0.535],
      [0.57, 0.56], [0.57, 0.56], [0.57, 0.56], [0.57, 0.56],
    ] as const;
    const chairX = size.width * 0.57;
    const chairY = size.height * 0.56;

    if (reducedMotion) {
      x.value = chairX;
      y.value = chairY;
      scale.value = CHARACTER_SCALE;
      setPerformanceFrame(null);
      return;
    }

    x.value = size.width * path[0][0];
    y.value = size.height * path[0][1];
    scale.value = CHARACTER_SCALE;
    if (!performanceReady) return;
    cancelPerformance.current?.();
    cancelPerformance.current = playPipChairPerformance(
      (frame) => {
        setPerformanceFrame(frame);
        x.value = size.width * path[frame][0];
        y.value = size.height * path[frame][1];
        scale.value = CHARACTER_SCALE;
      },
      () => {
        // Hold the drawn seated key pose to avoid a scale/shape pop into the limited idle rig.
        setPerformanceFrame(13);
      },
    );
    return () => {
      cancelPerformance.current?.();
      cancelPerformance.current = null;
    };
  }, [mode, reducedMotion, performanceReady, size, x, y, scale]);

  const walkingStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - characterWidth / 2 },
      { translateY: y.value - characterHeight / 2 },
    ],
  }));
  const characterScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View pointerEvents="none" onLayout={onLayout} style={[StyleSheet.absoluteFill, styles.overlay]}>
      {mode === 'personal' && size.width > 0 && (
        <Animated.View style={[styles.walker, { width: characterWidth, height: characterHeight }, walkingStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, characterScaleStyle]}>
            <RoomCharacter
              walking={false}
              performanceFrame={reducedMotion ? null : performanceFrame}
              reducedMotion={reducedMotion}
              onPerformanceReady={markPerformanceReady}
            />
          </Animated.View>
        </Animated.View>
      )}
      {mode === 'study-together' && size.width > 0 && (
        <StudySeatCharacters size={size} reducedMotion={reducedMotion} />
      )}
    </View>
  );
}

function StudySeatCharacters({ size, reducedMotion }: { size: SceneSize; reducedMotion: boolean }) {
  const startX = size.width * 0.12;
  const startY = size.height * 0.4;
  return <>
    <SeatPenguin left="6%" top="34%" width="25%" height="17%" fromX={startX - size.width * 0.185} fromY={startY - size.height * 0.425} delayMs={0} reducedMotion={reducedMotion} />
    <SeatPenguin left="69%" top="34%" width="25%" height="17%" fromX={startX - size.width * 0.815} fromY={startY - size.height * 0.425} delayMs={220} reducedMotion={reducedMotion} />
    <SeatPenguin left="2%" top="53%" width="34%" height="21%" fromX={startX - size.width * 0.19} fromY={startY - size.height * 0.635} delayMs={440} reducedMotion={reducedMotion} />
    <SeatPenguin left="64%" top="53%" width="34%" height="21%" fromX={startX - size.width * 0.81} fromY={startY - size.height * 0.635} delayMs={660} reducedMotion={reducedMotion} />
  </>;
}

function SeatPenguin({
  left,
  top,
  width,
  height,
  fromX,
  fromY,
  delayMs,
  reducedMotion,
}: {
  left: `${number}%`;
  top: `${number}%`;
  width: `${number}%`;
  height: `${number}%`;
  fromX: number;
  fromY: number;
  delayMs: number;
  reducedMotion: boolean;
}) {
  const [visible, setVisible] = useState(reducedMotion || delayMs === 0);
  const [arrived, setArrived] = useState(reducedMotion);
  const x = useSharedValue(reducedMotion ? 0 : fromX);
  const y = useSharedValue(reducedMotion ? 0 : fromY);
  const approachStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      setArrived(true);
      return;
    }
    setVisible(delayMs === 0);
    setArrived(false);
    const entrance = delayMs > 0 ? setTimeout(() => setVisible(true), delayMs) : undefined;
    const arrive = setTimeout(() => setArrived(true), delayMs + 820);
    return () => {
      if (entrance) clearTimeout(entrance);
      clearTimeout(arrive);
    };
  }, [delayMs, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      x.value = 0;
      y.value = 0;
      return;
    }
    x.value = fromX;
    y.value = fromY;
    if (visible) {
      x.value = withTiming(0, { duration: 820, easing: Easing.out(Easing.cubic) });
      y.value = withTiming(0, { duration: 820, easing: Easing.out(Easing.cubic) });
    }
  }, [fromX, fromY, reducedMotion, visible, x, y]);

  return visible ? (
    <View style={[styles.seat, { left, top, width, height }]}>
      <Animated.View style={[StyleSheet.absoluteFill, approachStyle]}>
        <RoomCharacter walking={!arrived && !reducedMotion} reducedMotion={reducedMotion} />
      </Animated.View>
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  overlay: { zIndex: 1 },
  walker: { position: 'absolute', left: 0, top: 0, zIndex: 4 },
  seat: { position: 'absolute', zIndex: 2, alignItems: 'center', justifyContent: 'center' },
});
