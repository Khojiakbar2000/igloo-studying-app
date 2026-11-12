import React, { useCallback, useEffect, useRef } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { Egg } from './SceneArt';

const hatcheryAsset = require('../../assets/animations/penguin-hatchery-warm.riv');

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
  const notified = useRef(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  // Metro maps bundled .riv assets to URL strings on web.
  const source = typeof hatcheryAsset === 'string' ? hatcheryAsset : Image.resolveAssetSource(hatcheryAsset)?.uri;
  const onRiveReady = useCallback(() => {
    if (notified.current) return;
    notified.current = true;
    onReadyRef.current();
  }, []);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const onLoadError = useCallback(() => { setLoadFailed(true); onRiveReady(); }, [onRiveReady]);
  const { rive, RiveComponent } = useRive({
    src: source,
    artboard: 'PenguinHatchery',
    stateMachine: 'PenguinHatchery',
    autoplay: true,
    onRiveReady,
    onLoadError,
  });
  const tapOne = useStateMachineInput(rive, 'PenguinHatchery', 'tapOne');
  const tapTwo = useStateMachineInput(rive, 'PenguinHatchery', 'tapTwo');
  const hatch = useStateMachineInput(rive, 'PenguinHatchery', 'hatch');

  useEffect(() => { if (!source || reducedMotion) onRiveReady(); }, [onRiveReady, reducedMotion, source]);

  useEffect(() => {
    if (!rive || !playHatchSequence || reducedMotion || !tapOne || !tapTwo || !hatch) return;
    tapOne.fire();
    const second = window.setTimeout(() => tapTwo.fire(), 820);
    const third = window.setTimeout(() => hatch.fire(), 1_950);
    return () => { window.clearTimeout(second); window.clearTimeout(third); };
  }, [hatch, playHatchSequence, reducedMotion, rive, tapOne, tapTwo]);

  useEffect(() => {
    if (!rive || playHatchSequence || reducedMotion) return;
    if (tapStep === 1) tapOne?.fire();
    if (tapStep === 2) tapTwo?.fire();
    if (tapStep === 3) hatch?.fire();
  }, [hatch, playHatchSequence, reducedMotion, rive, tapOne, tapStep, tapTwo]);

  return (
    <View style={[styles.wrap, style]} accessible accessibilityRole="image" accessibilityLabel="A penguin egg shaking and cracking open">
      {(!rive || !source || reducedMotion || loadFailed) && tapStep < 3 && <View pointerEvents="none" style={styles.fallback}><Egg size={214} cracks={tapStep} /></View>}
      {source && !reducedMotion && !loadFailed && <RiveComponent aria-label="Animated penguin egg" style={riveStyles} />}
    </View>
  );
}

const riveStyles = { width: '100%', height: '100%', display: 'block' } as React.CSSProperties;
const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  fallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
