import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { boxStyle, type Bounds } from '../furniture/catalog';
import { fittedSprite, panoramaBounds } from './panorama';
import { PANORAMA_FOOTPRINTS } from './panoramaArt';

export function PanoramaSprite({ id, source, box, z, shadow, children, onError }: {
  id: string; source: number; box: Bounds; z: number; shadow?: boolean; children?: React.ReactNode; onError?: () => void;
}) {
  const footprint = PANORAMA_FOOTPRINTS[id];
  const imageBox = footprint ? fittedSprite(box, footprint) : box;
  return <>
    {shadow && <View pointerEvents="none" style={[
      styles.position, boxStyle(panoramaBounds({ x: box.x + box.width * 0.06, y: box.y + box.height - 16, width: box.width * 0.9, height: 28 })),
      { zIndex: 1 },
    ]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
        <Defs><RadialGradient id={`floor-shadow-${id}`}><Stop offset="0" stopColor="#4d345c" stopOpacity=".34" /><Stop offset="1" stopColor="#4d345c" stopOpacity="0" /></RadialGradient></Defs>
        <Ellipse cx="50" cy="20" rx="50" ry="20" fill={`url(#floor-shadow-${id})`} />
      </Svg>
    </View>}
    <View pointerEvents="none" testID={`my-igloo-sprite-${id}`} style={[styles.position, boxStyle(panoramaBounds(imageBox)), { zIndex: z }]}>
      <Image accessible={false} source={source} resizeMode={footprint ? 'stretch' : 'contain'} fadeDuration={0} onError={onError} style={styles.fill} />
      {children}
    </View>
  </>;
}

const styles = StyleSheet.create({
  position: { position: 'absolute' },
  fill: { width: '100%', height: '100%' },
});
