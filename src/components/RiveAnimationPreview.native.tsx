import { colors } from '../theme';
import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const tealFile = require('../../assets/animations/experiments/rive-pip-prototype/pip-rig-v2.riv');
const pinkFile = require('../../assets/animations/experiments/rive-pip-prototype/pip-rig-pink.riv');

let RiveView: React.ComponentType<any> | null = null;
try {
  RiveView = (require('rive-react-native') as typeof import('rive-react-native')).default;
} catch {
  // Expo Go has no native Rive module; the comparison stays available in web and dev builds.
}

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
  const file = scarfVariant === 'pink' ? pinkFile : tealFile;
  const notified = useRef(false);
  if (!RiveView) {
    return <View style={styles.fallback}><Text style={styles.message}>Use the web preview or a Rive-enabled development build to view this prototype.</Text></View>;
  }
  return (
    <RiveView
      key={`${animation}-${scarfVariant}`}
      source={file}
      artboardName="Pip"
      animationName={animation}
      autoplay
      onPlay={() => { if (!notified.current) { notified.current = true; onVisible(); } }}
      onError={(error: { message?: string }) => onError(error.message ?? 'Rive playback failed.')}
      style={StyleSheet.absoluteFill}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { textAlign: 'center', color: colors.link, fontSize: 13, lineHeight: 19 },
});
