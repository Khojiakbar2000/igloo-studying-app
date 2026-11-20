import React, { useCallback, useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

const asset = require('../../assets/animations/experiments/rive-pip-prototype/pip-seated-rig-aligned.riv');

export function HybridRivePip({ active, onReady, onReactionStarted, onError }: {
  active: boolean; onReady: () => void; onReactionStarted: () => void; onError: (message: string) => void;
}) {
  const source = typeof asset === 'string' ? asset : Image.resolveAssetSource(asset)?.uri;
  const callbacks = useRef({ onReady, onReactionStarted, onError });
  const readyOnce = useRef(false);
  const startedOnce = useRef(false);
  callbacks.current = { onReady, onReactionStarted, onError };
  const ready = useCallback((runtime: import('@rive-app/react-canvas').Rive) => {
    if (readyOnce.current) return;
    readyOnce.current = true;
    runtime.play('Character');
    window.requestAnimationFrame(() => {
      runtime.pause('Character');
      callbacks.current.onReady();
    });
  }, []);
  const loadError = useCallback(() => callbacks.current.onError('The seated Rive file failed to load.'), []);
  const { rive, RiveComponent } = useRive({
    src: source,
    artboard: 'Character',
    stateMachine: 'Character',
    autoplay: false,
    onRiveReady: ready,
    onLoadError: loadError,
  });
  const reaction = useStateMachineInput(rive, 'Character', 'happy');

  React.useEffect(() => {
    if (!rive) return;
    if (!active) {
      startedOnce.current = false;
      rive.pause();
      return;
    }
    if (!reaction || startedOnce.current) return;
    startedOnce.current = true;
    rive.play('Character');
    reaction.fire();
    callbacks.current.onReactionStarted();
  }, [active, reaction, rive]);

  if (!source) return <View style={styles.fallback}><Text style={styles.message}>Could not resolve the seated Rive asset.</Text></View>;
  return <RiveComponent aria-label="Pip seated in the Rive interaction prototype" style={canvasStyle} />;
}

const canvasStyle: React.CSSProperties = { width: '100%', height: '100%', display: 'block' };
const styles = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', padding: 12 },
  message: { textAlign: 'center', color: '#A3463D', fontSize: 11 },
});
