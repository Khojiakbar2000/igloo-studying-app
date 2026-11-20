import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { AnimationObject } from 'lottie-react-native';
import LottiePlayer, { type LottiePlayerHandle } from './StudyTogetherLottiePlayer';

export function StudyRoomPerformance({ source, motion, loop = false, elapsedMs = 0, range, onLoaded, onFinish, style, testID }: {
  source: AnimationObject;
  motion: boolean;
  loop?: boolean;
  elapsedMs?: number;
  range?: readonly [number, number];
  onLoaded?: () => void;
  onFinish?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const player = useRef<LottiePlayerHandle>(null);
  const initial = useRef(elapsedMs);
  const [loaded, setLoaded] = useState(false);
  const started = useRef(false);
  const first = range?.[0] ?? 0;
  const last = range?.[1] ?? source.op;

  useEffect(() => {
    if (!loaded) return;
    if (!motion) {
      player.current?.pause();
      return;
    }
    if (started.current) {
      player.current?.resume();
      return;
    }
    started.current = true;
    onLoaded?.();
    if (range || initial.current) {
      const offset = Math.floor(initial.current * source.fr / 1000);
      player.current?.play(Math.min(last - 1, first + offset), last);
    } else {
      player.current?.play();
    }
  }, [first, last, loaded, motion, onLoaded, range, source]);

  useEffect(() => {
    if (!motion || !onFinish) return;
    const timeout = setTimeout(onFinish, loaded ? ((last - first) / source.fr) * 1000 + 1500 : 6500);
    return () => clearTimeout(timeout);
  }, [first, last, loaded, motion, onFinish, source]);

  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]} testID={testID}>
    <LottiePlayer ref={player} source={source} style={StyleSheet.absoluteFill} loop={loop}
      onLoaded={() => setLoaded(true)}
      onFailure={() => onFinish?.()}
      onFinish={cancelled => { if (!cancelled) onFinish?.(); }} />
  </View>;
}
