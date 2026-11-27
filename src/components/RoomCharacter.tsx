import type { WardrobeLayout } from '../home/state';
import { ChairEquipment } from '../wardrobe/ChairEquipment';
import React, { useEffect } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';


const seatedImage = require('../../assets/characters/penguin/poses/seated.png');
const walkFrame = require('../../assets/animations/igloo-penguin-walk/frame-01.png');



/** Static-platform fallback; web and native use their Rive-enabled platform files. */
export function RoomCharacter({
  idleEyes,
  walking = false,
  performanceFrame = null,
  reducedMotion = false,
  onPerformanceReady,
  equipped,
  style,
}: {
  idleEyes?: React.ReactNode;
  walking?: boolean;
  performanceFrame?: number | null;
  celebrate?: boolean;
  onPerformanceReady?: () => void;
  equipped?: WardrobeLayout;
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  useEffect(() => { onPerformanceReady?.(); }, [onPerformanceReady]);

  return (
    <View accessibilityLabel="Pip seated in the igloo room" style={[styles.character, style]}>
      {performanceFrame !== null || (!walking && !!equipped?.head) || (reducedMotion && equipped)
        ? <ChairEquipment frame={reducedMotion ? 13 : performanceFrame ?? 13} equipped={equipped ?? {}} eyes={idleEyes} />
        : <Image source={walking && !reducedMotion ? walkFrame : seatedImage} resizeMode="contain" style={StyleSheet.absoluteFill} />}
    </View>
  );
}

const styles = StyleSheet.create({ character: { width: '100%', height: '100%' } });
