import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { RiveRef } from 'rive-react-native';
import { Egg } from './SceneArt';

const hatcheryRive = require('../../assets/animations/penguin-hatchery-warm.riv');

let RiveView: React.ComponentType<any> | null = null;
try {
  RiveView = (require('rive-react-native') as typeof import('rive-react-native')).default;
} catch {
  // Expo Go has no native Rive module, so the SVG egg remains available.
}

export function RiveHatchery({
  tapStep,
  playHatchSequence = false,
  reducedMotion = false,
  style,
  onReady,
}: {
  tapStep: number;
  playHatchSequence?: boolean;
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
  onReady: () => void;
}) {
  const riveRef = useRef<RiveRef>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!RiveView);
  const notified = useRef(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const notifyReady = () => {
    if (notified.current) return;
    notified.current = true;
    onReadyRef.current();
  };

  useEffect(() => {
    if (!RiveView) notifyReady();
  }, []);

  useEffect(() => {
    if (!ready || failed || !playHatchSequence || reducedMotion) return;
    riveRef.current?.fireState('PenguinHatchery', 'tapOne');
    const second = setTimeout(() => riveRef.current?.fireState('PenguinHatchery', 'tapTwo'), 820);
    const third = setTimeout(() => riveRef.current?.fireState('PenguinHatchery', 'hatch'), 1_950);
    return () => { clearTimeout(second); clearTimeout(third); };
  }, [failed, playHatchSequence, ready, reducedMotion]);

  useEffect(() => {
    if (!ready || failed || playHatchSequence || reducedMotion) return;
    const inputName = tapStep === 1 ? 'tapOne' : tapStep === 2 ? 'tapTwo' : tapStep === 3 ? 'hatch' : null;
    if (inputName) riveRef.current?.fireState('PenguinHatchery', inputName);
  }, [failed, playHatchSequence, ready, reducedMotion, tapStep]);

  return (
    <View style={[styles.wrap, style]} accessible accessibilityRole="image" accessibilityLabel="A penguin egg shaking and cracking open">
      {(failed || !ready || reducedMotion) && <View pointerEvents="none" style={styles.fallback}><Egg size={214} cracks={tapStep} /></View>}
      {RiveView && !failed && !reducedMotion && (
        <RiveView
          ref={riveRef}
          source={hatcheryRive}
          artboardName="PenguinHatchery"
          stateMachineName="PenguinHatchery"
          autoplay
          onPlay={() => { setReady(true); notifyReady(); }}
          onError={() => { setFailed(true); notifyReady(); }}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  fallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
