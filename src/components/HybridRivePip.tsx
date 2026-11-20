import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function HybridRivePip({ onError }: { active: boolean; onReady: () => void; onReactionStarted: () => void; onError: (message: string) => void }) {
  void onError;
  return <View style={styles.fallback}><Text style={styles.message}>Rive preview is unavailable on this platform.</Text></View>;
}

const styles = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  message: { textAlign: 'center', color: '#52777A', fontSize: 12 },
});
