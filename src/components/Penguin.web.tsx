import React, { useEffect, useRef } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import Animated from 'react-native-reanimated';
import { usePenguinMotion } from './usePenguinMotion';
import type { CharacterAction, CharacterEmotion } from '../character/CharacterBehaviorController';
import { penguinPoseAssets } from './penguinPoseAssets';

const penguinRive = require('../../assets/animations/igloo-penguin-companion-v2.riv');
const penguinImage = require('../../assets/characters/penguin/igloo-penguin-front-gaze.png');

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
  const happyFired = useRef(false);
  const motionStyle = usePenguinMotion(hatching, action);
  // Metro maps bundled .riv assets to URL strings on web.
  const source = typeof penguinRive === 'string' ? penguinRive : Image.resolveAssetSource(penguinRive)?.uri;
  const { rive, RiveComponent } = useRive({
    src: source,
    artboard: 'Character',
    stateMachine: 'Character',
    autoplay: true,
  });
  const happyTrigger = useStateMachineInput(rive, 'Character', 'happy');

  useEffect(() => {
    if (!happy) {
      happyFired.current = false;
      return;
    }
    if (!happyTrigger || happyFired.current) return;
    happyTrigger.fire();
    happyFired.current = true;
  }, [happy, happyTrigger]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Say hello to the penguin"
      onPress={() => { onPress?.(); if (!onPress) happyTrigger?.fire(); }}
      style={[styles.wrap, { width: size, height: size * 1.1 }, style]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, motionStyle]}>
        {(action !== 'idle' || !rive) && <Image source={action === 'idle' ? penguinImage : penguinPoseAssets[emotion]} resizeMode="contain" style={[StyleSheet.absoluteFill, styles.imageFill]} />}
        {action === 'idle' && source && <RiveComponent style={{ ...riveStyles, width: size, height: size * 1.1 }} />}
      </Animated.View>
      {friend && <View style={styles.friendClip}><View style={styles.clipGleam} /></View>}
    </Pressable>
  );
}

const riveStyles = { display: 'block' } as React.CSSProperties;

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 0, borderWidth: 0, backgroundColor: 'transparent' },
  imageFill: { width: '100%', height: '100%' },
  friendClip: { position: 'absolute', right: '24%', top: '15%', width: 15, height: 10, borderRadius: 7, backgroundColor: '#CBB5DA', transform: [{ rotate: '-22deg' }], borderWidth: 1, borderColor: '#A995BE' },
  clipGleam: { position: 'absolute', top: 2, left: 3, width: 4, height: 2, borderRadius: 2, backgroundColor: '#F9F0FF' },
});
