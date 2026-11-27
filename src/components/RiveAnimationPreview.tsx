import { colors } from '../theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function RiveAnimationPreview({ onError }: { animation: 'idle' | 'studying' | 'celebrate'; scarfVariant: 'teal' | 'pink'; onVisible: () => void; onError: (message: string) => void }) {
  void onError;
  return <View style={styles.fallback}><Text style={styles.message}>Rive preview is unavailable on this platform.</Text></View>;
}

const styles = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { textAlign: 'center', color: colors.link, fontSize: 13, lineHeight: 19 },
});
