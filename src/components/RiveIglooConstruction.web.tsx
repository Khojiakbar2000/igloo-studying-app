import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRive } from '@rive-app/react-canvas';

const constructionAsset = require('../../assets/animations/igloo-construction-v1.riv');
const stageOne = require('../../assets/illustrations/igloo/stages/igloo-stage-1.jpg');
const riveStyle: React.CSSProperties = { width: '100%', height: '100%', display: 'block' };

export function RiveIglooConstruction({ style }: { style?: StyleProp<ViewStyle> }) {
  const [failed, setFailed] = useState(false);
  const source = typeof constructionAsset === 'string' ? constructionAsset : Image.resolveAssetSource(constructionAsset)?.uri;
  const onError = useCallback(() => setFailed(true), []);
  const { rive, RiveComponent } = useRive({ src: source, artboard: 'IglooSnowBlockDelivery', animations: 'carryAndPlace', autoplay: true, onLoadError: onError });

  return <View style={[styles.wrap, style]} accessible accessibilityRole="image" accessibilityLabel="The penguin carries a snow block and places it on the snowy ground">
    {(!rive || failed) && <Image source={stageOne} resizeMode="stretch" style={StyleSheet.absoluteFill} />}
    {rive && !failed && <RiveComponent aria-label="Penguin carries and places a snow block" style={riveStyle} />}
  </View>;
}

const styles = StyleSheet.create({ wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' } });
