import React, { useEffect } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { PenguinCustomization } from '../character/penguinCustomization';
import { PipAccessoryLayer } from './PipAccessoryLayer';

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
const customPerformanceFrames = {
  berry: [
    require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-00.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-01.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-02.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-03.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-04.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-05.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-06.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-07.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-08.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-09.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-10.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-11.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-12.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/berry/frame-13.png'),
  ],
  lilac: [
    require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-00.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-01.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-02.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-03.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-04.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-05.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-06.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-07.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-08.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-09.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-10.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-11.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-12.png'), require('../../assets/animations/pip-customization/my-igloo/scarves/lilac/frame-13.png'),
  ],
};

/** Static-platform fallback; web and native use their Rive-enabled platform files. */
export function RoomCharacter({
  idleEyes,
  walking = false,
  performanceFrame = null,
  reducedMotion = false,
  onPerformanceReady,
  customization,
  style,
}: {
  idleEyes?: React.ReactNode;
  walking?: boolean;
  performanceFrame?: number | null;
  celebrate?: boolean;
  onPerformanceReady?: () => void;
  customization?: PenguinCustomization;
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  useEffect(() => { onPerformanceReady?.(); }, [onPerformanceReady]);

  return (
    <View accessibilityLabel="Pip seated in the igloo room" style={[styles.character, style]}>
      <Image source={performanceFrame !== null && !reducedMotion
        ? customization?.scarf === 'teal' || !customization ? performanceFrames[performanceFrame] : customPerformanceFrames[customization.scarf][performanceFrame]
        : reducedMotion && customization ? (customization.scarf === 'teal' ? performanceFrames[13] : customPerformanceFrames[customization.scarf][13]) : walking && !reducedMotion ? walkFrame : seatedImage} resizeMode="contain" style={StyleSheet.absoluteFill} />
      {idleEyes}
      {(performanceFrame === 13 || reducedMotion) && customization?.glasses && <PipAccessoryLayer kind="glasses" style="my-igloo" />}
      {(performanceFrame === 13 || reducedMotion) && customization?.headphones && <PipAccessoryLayer kind="headphones" style="my-igloo" />}
    </View>
  );
}

const styles = StyleSheet.create({ character: { width: '100%', height: '100%' } });
