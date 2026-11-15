import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function LottieExperimentPreview() {
  return <View style={styles.page}>
    <Text style={styles.title}>Open this experiment in Expo Web</Text>
    <Text style={styles.note}>The Creator export is played with lottie-web in the web preview.</Text>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaf5f7', padding: 24, gap: 8 },
  title: { color: '#18383d', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  note: { maxWidth: 440, color: '#708589', fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
