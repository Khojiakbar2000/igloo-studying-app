import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, Path } from 'react-native-svg';
import { WINDOW_ART, WINDOW_CLIP, WINDOW_MOTION, type IllustratedWindowScene } from '../scenes/studyWindowScenes';
import { StudyWindowAnimation } from './StudyWindowAnimation';

export function StudyWindowView({ scene }: { scene: IllustratedWindowScene }) {
  const clip = `window-${useId().replace(/:/g, '')}`;
  // The aquarium illustration is overscanned to keep its outer trim out of our ice frame.
  const overscan = scene === 'aquarium' ? { x: -53, y: -19, width: 766, height: 272 } : { x: 0, y: 0, width: 660, height: 234 };
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg width="100%" height="100%" viewBox="0 0 660 234">
      <Defs><ClipPath id={clip}><Path d={WINDOW_CLIP} /></ClipPath></Defs>
      <SvgImage href={WINDOW_ART[scene]} {...overscan} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`} />
    </Svg>
    <StudyWindowAnimation key={scene} source={WINDOW_MOTION[scene]} />
  </View>;
}
