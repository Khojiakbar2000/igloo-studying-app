import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { PipHomeIdle } from './PipHomeIdle';
import { SeatedPipReactions } from '../character/reactions/SeatedPipReactions';
import { RoomCharacter } from './RoomCharacter';
import { playPipChairPerformance } from '../character/pipChairPerformance';
import type { PenguinCustomization } from '../character/penguinCustomization';
import { HOME_CANVAS, STUDY_SEAT } from '../home/slots';

type RoomMode = 'personal' | 'study-together';
type SceneSize = { width: number; height: number };
const CHARACTER_SCALE = 0.93;
// The original laptop cel's hip contact, expressed in room coordinates.
const LAPTOP_CEL_HIPS = { x: .517, y: .64 };

export function RoomCharacterOverlay({ mode, hidden = false, onSettledChange, customization, homeIdle = false, ambientMotion = false, roomVisible = true }: { mode: RoomMode; hidden?: boolean; onSettledChange?: (settled: boolean) => void; customization?: PenguinCustomization; homeIdle?: boolean; ambientMotion?: boolean; roomVisible?: boolean }) {
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
    onSettledChange?.(false);
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
      onSettledChange?.(true);
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
        onSettledChange?.(true);
      },
    );
    return () => {
      cancelPerformance.current?.();
      cancelPerformance.current = null;
    };
  }, [mode, reducedMotion, performanceReady, size, x, y, scale, onSettledChange]);

  const walkingStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - characterWidth / 2 },
      { translateY: y.value - characterHeight / 2 },
    ],
  }));
  const characterScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const laptopSeated = mode === 'personal' && homeIdle && (performanceFrame === 13 || reducedMotion) && !hidden;
  return (
    <View pointerEvents="none" onLayout={onLayout} style={[StyleSheet.absoluteFill, styles.overlay, hidden && styles.hidden]}>
      {laptopSeated && <View style={[styles.seatContact, {
        left: size.width * STUDY_SEAT.x / HOME_CANVAS.width - size.width * .04,
        top: size.height * STUDY_SEAT.y / HOME_CANVAS.height + size.height * .033,
        width: size.width * .12, height: size.height * .012,
      }]} />}
      {mode === 'personal' && size.width > 0 && (
        <Animated.View style={[styles.walker, { width: characterWidth, height: characterHeight }, walkingStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, characterScaleStyle]}>
            {laptopSeated
              ? <View testID="igloo-seated-laptop" style={[styles.studyPose, {
                  transform: [
                    { translateX: size.width * (STUDY_SEAT.x / HOME_CANVAS.width - LAPTOP_CEL_HIPS.x) / CHARACTER_SCALE },
                    { translateY: size.height * (STUDY_SEAT.y / HOME_CANVAS.height - LAPTOP_CEL_HIPS.y) / CHARACTER_SCALE },
                  ],
                }]}><SeatedPipReactions enabled={roomVisible} customization={customization} alwaysStudying allowAmbientCoffee={false} /></View>
              : <PipHomeIdle enabled={homeIdle && performanceFrame === 13 && !hidden} motion={ambientMotion}>{eyes => <RoomCharacter
              walking={false}
              performanceFrame={reducedMotion ? null : performanceFrame}
              reducedMotion={reducedMotion}
              onPerformanceReady={markPerformanceReady}
              customization={customization}
              idleEyes={eyes}
            />}</PipHomeIdle>}
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
    <SeatPenguin left="8%" top="36%" width="26%" height="19%" fromX={startX - size.width * 0.21} fromY={startY - size.height * 0.455} delayMs={0} reducedMotion={reducedMotion} />
    <SeatPenguin left="66%" top="36%" width="26%" height="19%" fromX={startX - size.width * 0.79} fromY={startY - size.height * 0.455} delayMs={220} reducedMotion={reducedMotion} />
    <SeatPenguin left="5%" top="54%" width="31%" height="20%" fromX={startX - size.width * 0.205} fromY={startY - size.height * 0.64} delayMs={440} reducedMotion={reducedMotion} />
    <SeatPenguin left="64%" top="54%" width="31%" height="20%" fromX={startX - size.width * 0.795} fromY={startY - size.height * 0.64} delayMs={660} reducedMotion={reducedMotion} />
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
  const [settleFrame, setSettleFrame] = useState<number | null>(null);
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
    const arrive = setTimeout(() => {
      setArrived(true);
      setSettleFrame(11);
    }, delayMs + 820);
    const settle = setTimeout(() => setSettleFrame(12), delayMs + 960);
    const rest = setTimeout(() => setSettleFrame(13), delayMs + 1_100);
    const idle = setTimeout(() => setSettleFrame(null), delayMs + 1_420);
    return () => {
      if (entrance) clearTimeout(entrance);
      clearTimeout(arrive);
      clearTimeout(settle);
      clearTimeout(rest);
      clearTimeout(idle);
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
        <RoomCharacter walking={!arrived && !reducedMotion} performanceFrame={settleFrame} reducedMotion={reducedMotion} />
      </Animated.View>
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  overlay: { zIndex: 1 },
  seatContact: { position: 'absolute', borderRadius: 30, backgroundColor: '#60446126' },
  hidden: { opacity: 0 },
  studyPose: { position: 'absolute', left: '6%', width: '76%', top: '15.5%', height: '68%' },
  walker: { position: 'absolute', left: 0, top: 0, zIndex: 4 },
  seat: { position: 'absolute', zIndex: 2, alignItems: 'center', justifyContent: 'center' },
});
