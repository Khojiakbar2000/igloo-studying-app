import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { CharacterAction, CharacterEmotion } from '../character/CharacterBehaviorController';
import { penguinPoseAssets } from './penguinPoseAssets';

export function PenguinProvider({ children }: { children: React.ReactNode }) { return <>{children}</>; }

const penguinImage = require('../../assets/characters/penguin/igloo-penguin.png');

export function Penguin({ style, compact = false, friend = false, emotion = 'curious', action = 'idle' }: { style?: object; compact?: boolean; friend?: boolean; happy?: boolean; hatching?: boolean; emotion?: CharacterEmotion; action?: CharacterAction; reducedMotion?: boolean; onPress?: () => void }) {
  const size = compact ? 118 : 232;
  return (
    <View style={[styles.wrap, { width: size, height: size * 1.1 }, style]}>
      <Image source={action === 'idle' ? penguinImage : penguinPoseAssets[emotion]} resizeMode="contain" style={[StyleSheet.absoluteFill, styles.imageFill]} />
      {friend && <View style={styles.friendClip}><View style={styles.clipGleam} /></View>}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center' }, imageFill: { width: '100%', height: '100%' }, friendClip: { position: 'absolute', right: '24%', top: '15%', width: 15, height: 10, borderRadius: 7, backgroundColor: '#E9B968', transform: [{ rotate: '-22deg' }], borderWidth: 1, borderColor: '#806329' }, clipGleam: { position: 'absolute', top: 2, left: 3, width: 4, height: 2, borderRadius: 2, backgroundColor: '#FFF8ED' } });
