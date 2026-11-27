import { colors } from '../theme';
import React, { useCallback, useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRive } from '@rive-app/react-canvas';

const tealFile = require('../../assets/animations/experiments/rive-pip-prototype/pip-rig-v2.riv');
const pinkFile = require('../../assets/animations/experiments/rive-pip-prototype/pip-rig-pink.riv');

export function RiveAnimationPreview({
  animation,
  scarfVariant,
  onVisible,
  onError,
}: {
  animation: 'idle' | 'studying' | 'celebrate';
  scarfVariant: 'teal' | 'pink';
  onVisible: () => void;
  onError: (message: string) => void;
}) {
  const asset = scarfVariant === 'pink' ? pinkFile : tealFile;
  const source = typeof asset === 'string' ? asset : Image.resolveAssetSource(asset)?.uri;
  const onVisibleRef = useRef(onVisible);
  const onErrorRef = useRef(onError);
  const reported = useRef(false);
  onVisibleRef.current = onVisible;
  onErrorRef.current = onError;
  const handleReady = useCallback(() => {
    if (reported.current) return;
    reported.current = true;
    onVisibleRef.current();
  }, []);
  const handleError = useCallback(() => onErrorRef.current('Rive file loading failed.'), []);
  const { RiveComponent } = useRive({
    src: source,
    artboard: 'Pip',
    animations: animation,
    autoplay: true,
    onRiveReady: handleReady,
    onLoadError: handleError,
  });
  if (!source) return <View style={styles.fallback}><Text style={styles.message}>The bundled Rive preview file could not be resolved.</Text></View>;
  return <RiveComponent aria-label={`Pip ${animation} with ${scarfVariant} scarf`} style={canvasStyle} />;
}

const canvasStyle: React.CSSProperties = { width: '100%', height: '100%', display: 'block' };

const styles = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { textAlign: 'center', color: colors.link, fontSize: 13, lineHeight: 19 },
});
