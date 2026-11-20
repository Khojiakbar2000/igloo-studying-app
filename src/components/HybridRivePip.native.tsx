import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RiveRef } from 'rive-react-native';
import { Direction, LoopMode } from 'rive-react-native';

const asset = require('../../assets/animations/experiments/rive-pip-prototype/pip-seated-rig-aligned.riv');
let RiveView: React.ComponentType<any> | null = null;
try {
  RiveView = (require('rive-react-native') as typeof import('rive-react-native')).default;
} catch {
  // The existing Expo Go fallback cannot load native Rive; use a development build for this preview.
}

export function HybridRivePip({ active, onReady, onReactionStarted, onError }: {
  active: boolean; onReady: () => void; onReactionStarted: () => void; onError: (message: string) => void;
}) {
  const ref = useRef<RiveRef>(null);
  const callbacks = useRef({ onReady, onReactionStarted, onError });
  const activeRef = useRef(active);
  const readyOnce = useRef(false);
  const startedOnce = useRef(false);
  callbacks.current = { onReady, onReactionStarted, onError };
  activeRef.current = active;

  useEffect(() => {
    if (!readyOnce.current || !ref.current) return;
    if (!active) {
      startedOnce.current = false;
      ref.current.pause();
      return;
    }
    if (startedOnce.current) return;
    startedOnce.current = true;
    ref.current.play('Character', LoopMode.Loop, Direction.Auto, true);
    ref.current.fireState('Character', 'happy');
    callbacks.current.onReactionStarted();
  }, [active]);

  if (!RiveView) return <View style={styles.fallback}><Text style={styles.message}>Use a Rive-enabled development build for this native preview.</Text></View>;
  return <RiveView
    ref={ref}
    source={asset}
    artboardName="Character"
    stateMachineName="Character"
    autoplay
    onPlay={() => {
      if (!readyOnce.current) {
        readyOnce.current = true;
        callbacks.current.onReady();
      }
      if (!activeRef.current) ref.current?.pause();
    }}
    onError={(error: { message?: string }) => callbacks.current.onError(error.message ?? 'The seated Rive file failed to load.')}
    style={StyleSheet.absoluteFill}
  />;
}

const styles = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', padding: 12 },
  message: { textAlign: 'center', color: '#A3463D', fontSize: 11 },
});
