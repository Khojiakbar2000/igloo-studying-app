import React, { useRef, useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { RiveRef } from 'rive-react-native';

const constructionAsset = require('../../assets/animations/igloo-construction-v1.riv');
const stageOne = require('../../assets/illustrations/igloo/stages/igloo-stage-1.jpg');
let RiveView: React.ComponentType<any> | null = null;
try { RiveView = (require('rive-react-native') as typeof import('rive-react-native')).default; } catch { /* Expo Go uses the static painted fallback. */ }

export function RiveIglooConstruction({ style }: { style?: StyleProp<ViewStyle> }) {
  const riveRef = useRef<RiveRef>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!RiveView);
  return <View style={[styles.wrap, style]} accessible accessibilityRole="image" accessibilityLabel="The penguin carries a snow block and places it on the snowy ground">
    {(!ready || failed) && <Image source={stageOne} resizeMode="stretch" style={StyleSheet.absoluteFill} />}
    {RiveView && !failed && <RiveView ref={riveRef} source={constructionAsset} artboardName="IglooSnowBlockDelivery" animationName="carryAndPlace" autoplay onPlay={() => setReady(true)} onError={() => setFailed(true)} style={StyleSheet.absoluteFill} />}
  </View>;
}

const styles = StyleSheet.create({ wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' } });
