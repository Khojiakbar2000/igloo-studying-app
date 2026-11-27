import React, { useMemo } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { AnimationObject } from 'lottie-react-native';
import { WinterLottie } from '../home/winter/WinterLottie';
import type { CharacterAction } from './catalog';
import type { WardrobeLayout } from '../home/state';
import { fitStanding } from './lottieEquipment';

const ACTIONS: Record<CharacterAction, AnimationObject> = {
  idle: require('../../assets/wardrobe/lottie/idle.json'),
  wave: require('../../assets/wardrobe/lottie/wave.json'),
  shiver: require('../../assets/wardrobe/lottie/shiver.json'),
  celebrate: require('../../assets/wardrobe/lottie/celebrate.json'),
};
const KNIGHT: Record<CharacterAction, AnimationObject> = {
  idle: require('../../assets/wardrobe/lottie/knight-storybook/idle.json'),
  wave: require('../../assets/wardrobe/lottie/knight-storybook/wave.json'),
  shiver: require('../../assets/wardrobe/lottie/knight-storybook/shiver.json'),
  celebrate: require('../../assets/wardrobe/lottie/knight-storybook/celebrate.json'),
};

export function PipWardrobePreview({ equipped, action, onReady, conceptImage, style, motion = true, onFinish }: {
  equipped: WardrobeLayout; action: CharacterAction; onReady?: () => void;
  conceptImage?: ImageSourcePropType; style?: StyleProp<ViewStyle>; motion?: boolean; onFinish?: () => void;
}) {
  const knight = equipped.skin === 'knight-storybook';
  const data = useMemo(() => fitStanding(knight ? KNIGHT[action] : ACTIONS[action], equipped, knight), [action, equipped, knight]);

  return <View testID="pip-wardrobe-preview" style={[styles.stage, style]}>
    {conceptImage ? <Image source={conceptImage} resizeMode="contain" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} /> :
      <WinterLottie data={data} timeline={action} playing={motion} loop={!onFinish} progress={motion ? undefined : 0} onFinish={onFinish} onLoaded={onReady} />}
  </View>;
}

const styles = StyleSheet.create({
  stage: { width: '100%', aspectRatio: 1, position: 'relative' },
});
