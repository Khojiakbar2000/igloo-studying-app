import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Image as SvgImage } from 'react-native-svg';
import type { WardrobeLayout } from '../home/state';
import { bodyFittings } from './fitting';
import { chairAnchors } from './poseAnchors';
import { chairArt } from './chairArt';

export function ChairEquipment({ frame, equipped, eyes }: { frame: number; equipped: WardrobeLayout; eyes?: React.ReactNode }) {
  const fits = bodyFittings(equipped, 'chair', chairAnchors[frame], false, String(frame));
  const render = (behind: boolean) => (
    <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 480 560" style={StyleSheet.absoluteFill}>
      {fits.filter((item) => item.behind === behind).map((item) =>
        <SvgImage key={item.id} href={item.art.p} x={item.x - item.width / 2} y={item.y - item.height / 2}
          width={item.width} height={item.height} preserveAspectRatio="none"
          rotation={item.rotation} originX={item.x} originY={item.y} />)}
    </Svg>
  );
  return <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="pip-chair-outfit">
    {render(true)}
    <Image source={chairArt(frame, equipped.neck)} resizeMode="contain" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
    {eyes}
    {render(false)}
  </View>;
}
