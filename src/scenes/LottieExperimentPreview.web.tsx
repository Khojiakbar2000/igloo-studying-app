import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import lottie from 'lottie-web';

const animationData = require('../../assets/animations/pip-sofa-study/lottie-experiment.json');

export function LottieExperimentPreview() {
  const container = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState('Loading Lottie…');

  useEffect(() => {
    if (!container.current) return;
    const animation = lottie.loadAnimation({
      container: container.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    animation.addEventListener('DOMLoaded', () => setStatus('Lottie is playing'));
    animation.addEventListener('data_failed', () => setStatus('Lottie data failed to load'));
    return () => animation.destroy();
  }, []);

  return <View style={styles.page}>
    <Text style={styles.kicker}>ISOLATED LOTTIE EXPERIMENT</Text>
    <Text style={styles.title}>Pip, studying</Text>
    <Text style={styles.subtitle}>Three second loop · Creator export · Programmatic berry scarf recolor · Glasses on</Text>
    <View style={styles.stage}>
      <div ref={container} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </View>
    <Text style={styles.status}>{status}</Text>
    <Text style={styles.note}>This preview uses the approved sofa study baseline. No Synfig or Study Together animation files are loaded here.</Text>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaf5f7', padding: 24, gap: 8 },
  kicker: { color: '#4e777e', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: '#18383d', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#557176', fontSize: 13, textAlign: 'center' },
  stage: { width: '86%', maxWidth: 420, height: '70%', maxHeight: 520, borderRadius: 24, overflow: 'hidden', backgroundColor: '#f8fbfb', marginTop: 12 },
  status: { color: '#708589', fontSize: 11 },
  note: { maxWidth: 440, color: '#708589', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
});
