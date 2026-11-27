import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import type { RiveRef } from 'rive-react-native';
import { usePenguinMotion } from './usePenguinMotion';
import type { CharacterAction, CharacterEmotion } from '../character/CharacterBehaviorController';
import { penguinPoseAssets } from './penguinPoseAssets';

const penguinRive = require('../../assets/animations/igloo-penguin-companion-v2.riv');
const penguinImage = require('../../assets/characters/penguin/igloo-penguin-front-gaze.png');

let RiveView: React.ComponentType<any> | null = null;
try {
  RiveView = (require('rive-react-native') as typeof import('rive-react-native')).default;
} catch {
  // Expo Go does not include this native module. The matching illustration remains visible.
}

export function PenguinProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Penguin({
  style,
  compact = false,
  friend = false,
  happy = false,
  hatching = false,
  emotion = happy ? 'happy' : 'curious',
  action = hatching ? 'hatch' : 'idle',
  reducedMotion = false,
  onPress,
}: {
  style?: object;
  compact?: boolean;
  friend?: boolean;
  happy?: boolean;
  hatching?: boolean;
  emotion?: CharacterEmotion;
  action?: CharacterAction;
  reducedMotion?: boolean;
  onPress?: () => void;
}) {
  const size = compact ? 118 : 232;
  const riveRef = useRef<RiveRef>(null);
  const systemReducedMotion = useReducedMotion();
  const motionEnabled = !reducedMotion && !systemReducedMotion;
  const motionStyle = usePenguinMotion(hatching, action, motionEnabled);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!RiveView);
  const happyFired = useRef(false);

  useEffect(() => {
    if (!happy || !motionEnabled) {
      happyFired.current = false;
      return;
    }
    if (!ready || happyFired.current) return;
    riveRef.current?.fireState('Character', 'happy');
    happyFired.current = true;
  }, [happy, motionEnabled, ready]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Say hello to the penguin"
      onPress={() => { onPress?.(); if (!onPress && motionEnabled) riveRef.current?.fireState('Character', 'happy'); }}
      style={[styles.wrap, { width: size, height: size * 1.1 }, style]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, motionStyle]}>
        {/* Keep the illustration beneath Rive so a delayed/empty first frame
            never leaves Pip invisible. */}
        <Image source={action === 'idle' ? penguinImage : penguinPoseAssets[emotion]} resizeMode="contain" style={[StyleSheet.absoluteFill, styles.imageFill]} />
        {RiveView && !failed && action === 'idle' && (
          <RiveView
            ref={riveRef}
            source={penguinRive}
            artboardName="Character"
            stateMachineName="Character"
            autoplay={motionEnabled}
            onPlay={() => setReady(true)}
            onError={() => setFailed(true)}
            style={StyleSheet.absoluteFill}
          />
        )}
      </Animated.View>
      {friend && <View style={styles.friendClip}><View style={styles.clipGleam} /></View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 0, borderWidth: 0, backgroundColor: 'transparent' },
  imageFill: { width: '100%', height: '100%' },
  friendClip: { position: 'absolute', right: '24%', top: '15%', width: 15, height: 10, borderRadius: 7, backgroundColor: '#E9B968', transform: [{ rotate: '-22deg' }], borderWidth: 1, borderColor: '#806329' },
  clipGleam: { position: 'absolute', top: 2, left: 3, width: 4, height: 2, borderRadius: 2, backgroundColor: '#FFF8ED' },
});
