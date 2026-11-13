import React, { useEffect } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const seatedImage = require('../../assets/characters/penguin/poses/seated.png');
const walkFrame = require('../../assets/animations/igloo-penguin-walk/frame-01.png');
const performanceFrames = [
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_00.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair_01.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_02.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair_03.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_04.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair_05.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_06.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair_07.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_08.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair_09.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair_10.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair-contact-v2.png'),
  require('../../assets/animations/pip-chair-performance/frames/pip-chair-settle-v2.png'), require('../../assets/animations/pip-chair-performance/frames/pip-chair-rest-v2.png'),
];

/** Static-platform fallback; web and native use their Rive-enabled platform files. */
export function RoomCharacter({
  walking = false,
  performanceFrame = null,
  reducedMotion = false,
  onPerformanceReady,
  style,
}: {
  walking?: boolean;
  performanceFrame?: number | null;
  celebrate?: boolean;
  onPerformanceReady?: () => void;
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  useEffect(() => { onPerformanceReady?.(); }, [onPerformanceReady]);

  return (
    <View accessibilityLabel="Pip seated in the igloo room" style={[styles.character, style]}>
      <Image source={performanceFrame !== null && !reducedMotion ? performanceFrames[performanceFrame] : walking && !reducedMotion ? walkFrame : seatedImage} resizeMode="contain" style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({ character: { width: '100%', height: '100%' } });
