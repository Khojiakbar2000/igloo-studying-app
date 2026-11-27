import React, { useMemo } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import type { AnimationObject } from 'lottie-react-native';
import type { CharacterAction } from './model';
import type { WardrobeLayout } from '../home/state';
import { WinterLottie } from '../home/winter/WinterLottie';
import { ChairEquipment } from './ChairEquipment';
import { fitStudy } from './lottieEquipment';
import { PipWardrobePreview } from './PipWardrobePreview';

export type FittingPose = 'standing' | 'sitting' | 'laptop';
export type FittingAction = CharacterAction | 'blink' | 'look' | 'stretch';
const typing: AnimationObject = require('../../assets/animations/study-together-lottie/lottie/typing.json');
const { segments } = require('../../assets/animations/study-together-lottie/lottie/typing.segments.json');
const laptopActions: Partial<Record<FittingAction, [number, number]>> = {
  idle: segments.study,
  wave: segments.actions.wave,
  blink: segments.reactions.blink,
  look: segments.reactions.look,
  stretch: segments.actions.stretch,
  celebrate: segments.actions.celebrate,
};

export function PipCharacter({ pose, animation, equipment, conceptImage, style, motion }: {
  pose: FittingPose; animation: FittingAction; equipment: WardrobeLayout;
  conceptImage?: ImageSourcePropType; style?: StyleProp<ViewStyle>; motion: boolean;
}) {
  if (pose === 'standing') return <PipWardrobePreview equipped={equipment} action={animation === 'blink' || animation === 'look' || animation === 'stretch' ? 'idle' : animation} conceptImage={conceptImage} style={style} motion={motion} />;
  return <View testID="pip-wardrobe-preview" style={[styles.stage, style]}>
    {conceptImage ? <Image source={conceptImage} resizeMode="contain" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} /> :
      pose === 'sitting' ? <ChairEquipment frame={13} equipped={equipment} /> :
        <StudyPreview outfit={equipment} motion={motion} action={animation} />}
  </View>;
}

function StudyPreview({ outfit, motion, action }: { outfit: WardrobeLayout; motion: boolean; action: FittingAction }) {
  const source = useMemo(() => {
    const [ip, op] = laptopActions[action] ?? segments.study;
    return fitStudy({ ...typing, ip, op, layers: typing.layers.filter((layer) => layer.ip < op && layer.op > ip) }, outfit);
  }, [action, outfit]);
  return <WinterLottie data={source} timeline={'laptop-' + action} playing={motion} progress={motion ? undefined : 0} />;
}

const styles = StyleSheet.create({ stage: { aspectRatio: 1, position: 'relative' } });
