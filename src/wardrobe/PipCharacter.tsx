import React from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import type { CharacterAction, CharacterSkinId, PipPose } from './model';
import type { WardrobeLayout } from '../home/state';
import { costumeAction } from './costumes';
import { PipWardrobePreview } from './PipWardrobePreview';

const POSE_FALLBACK: Record<PipPose, ImageSourcePropType> = {
  standing: require('../../assets/animations/pip/storybook/character/standing-fallback.png'),
  sitting: require('../../assets/characters/penguin/poses/seated.png'),
  walking: require('../../assets/animations/igloo-penguin-walk/frame-01.png'),
  sleeping: require('../../assets/characters/penguin/poses/sleepy.png'),
};

export function PipCharacter({
  pose = 'standing',
  animation = 'idle',
  costumeId,
  equipment,
  conceptImage,
  style,
}: {
  pose?: PipPose;
  animation?: CharacterAction;
  costumeId?: CharacterSkinId;
  equipment?: WardrobeLayout;
  conceptImage?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
}) {
  const equipped = equipment ?? (costumeId ? { skin: costumeId } : {});
  const hasVariant = Boolean(costumeAction(costumeId, pose, animation));
  if (pose === 'standing' && (!costumeId || hasVariant || conceptImage)) {
    return <PipWardrobePreview equipped={equipped} action={animation} pose={pose} conceptImage={conceptImage} style={style} />;
  }
  if (pose === 'standing' && costumeId) {
    // Keep the requested action animated with default Pip art when a costume
    // has no matching action variant. Never stretch another costume pose.
    const { skin: _unavailableSkin, ...compatibleEquipment } = equipped;
    return <PipWardrobePreview equipped={compatibleEquipment} action={animation} pose="standing" style={style} />;
  }
  return <View accessibilityLabel={`Pip ${pose} (default pose fallback)`} style={[styles.fallback, style]}>
    <Image source={POSE_FALLBACK[pose]} resizeMode="contain" style={StyleSheet.absoluteFill} />
  </View>;
}

const styles = StyleSheet.create({ fallback: { width: '100%', height: '100%', position: 'relative' } });
