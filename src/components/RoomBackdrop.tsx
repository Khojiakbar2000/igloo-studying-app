import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/** Preloaded room images crossfade independently of the character foreground. */
export function RoomBackdrop({ source, label }: { source: ImageSourcePropType; label: string }) {
  const [back, setBack] = useState(source);
  const [front, setFront] = useState({ source, label });
  const current = useRef(source);
  const opacity = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (current.current === source) { if (reducedMotion) opacity.setValue(1); return; }
    setBack(current.current); setFront({ source, label }); current.current = source;
    opacity.setValue(reducedMotion ? 1 : 0);
    const transition = Animated.timing(opacity, { toValue: 1, duration: reducedMotion ? 0 : 260, useNativeDriver: true });
    transition.start(({ finished }) => { if (finished) setBack(source); });
    return () => transition.stop();
  }, [source, label, reducedMotion, opacity]);
  return <>
    <Image source={back} accessible={false} resizeMode="stretch" fadeDuration={0} style={styles.image} />
    <Animated.Image accessibilityLabel={front.label} source={front.source} resizeMode="stretch" fadeDuration={0} style={[styles.image, { opacity }]} />
  </>;
}
const styles = StyleSheet.create({ image: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' } });
