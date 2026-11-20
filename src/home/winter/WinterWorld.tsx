import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SeatedPipReactions } from '../../character/reactions/SeatedPipReactions';
import type { PenguinCustomization } from '../../character/penguinCustomization';
import { WinterEnvironment } from './WinterEnvironment';
import { WinterLottie } from './WinterLottie';
import { useHomeMotion } from '../useHomeMotion';
import { constructionFrame, winterStage } from './construction';

const construction = require('../../../assets/animations/pip/winter/lottie/igloo-construction.json');
const messages = [
  "I'm working right beside you!",
  'One little step at a time.',
  'This is a lovely place to focus.',
  'Every focused minute helps build our home.',
];

export function WinterWorld({ progress, active = true, onEnteredHome, customization }: {
  progress: number;
  active?: boolean;
  onEnteredHome?: () => void;
  customization?: PenguinCustomization;
}) {
  const motion = useHomeMotion(active);
  const [bubble, setBubble] = useState<string | null>(null);
  const count = useRef(0);
  const previous = useRef(progress);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enteredCallback = useRef(onEnteredHome);
  enteredCallback.current = onEnteredHome;
  const bubbleOpacity = useSharedValue(0);

  const say = useCallback((message: string) => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setBubble(message);
    bubbleOpacity.value = motion ? withTiming(1, { duration: 260 }) : 1;
    bubbleTimer.current = setTimeout(() => {
      bubbleOpacity.value = withTiming(0, { duration: 300 });
      bubbleTimer.current = setTimeout(() => setBubble(null), 310);
    }, 4300);
  }, [bubbleOpacity, motion]);

  useEffect(() => {
    if (active && progress >= 1 && previous.current < 1) {
      say('A cozy little home. We built it together!');
      // Keep the original first-construction transition into the actual Igloo.
      entryTimer.current = setTimeout(() => enteredCallback.current?.(), 3000);
    }
    previous.current = progress;
  }, [active, progress, say]);

  useEffect(() => () => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    if (entryTimer.current) clearTimeout(entryTimer.current);
  }, []);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ translateY: (1 - bubbleOpacity.value) * 4 }],
  }));

  return <View testID="winter-world" style={styles.scene}>
    <WinterEnvironment active={motion} />
    {progress === 0 && <View pointerEvents="none" style={styles.outline} />}
    <View testID="winter-igloo" pointerEvents="none" style={styles.igloo}>
      <WinterLottie data={construction} playing={false} progress={constructionFrame(progress) / 300} />
    </View>
    {progress >= 1 && <View pointerEvents="none" style={styles.lightSpill} />}
    <View pointerEvents="none" style={styles.pipShadow} />
    <View testID="winter-pip-studying" style={styles.seated}>
      <SeatedPipReactions enabled={active} customization={customization} alwaysStudying allowAmbientCoffee={false} />
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Say hello to Pip studying" accessibilityHint="Pip shares a friendly message"
      onPress={() => say(progress >= 1 ? 'It’s so cozy in here. Thank you!' : messages[count.current++ % messages.length])}
      style={styles.pipHit} />
    {bubble && <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.bubble, bubbleStyle]}>
      <Text style={styles.bubbleText}>{bubble}</Text><View style={styles.bubbleTail} />
    </Animated.View>}
    <View pointerEvents="none" style={styles.caption}><Text style={styles.captionText}>{winterStage(progress)}</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  scene: { flex: 1, position: 'relative', overflow: 'visible' },
  seated: { position: 'absolute', left: '0%', bottom: 24, width: '48%', aspectRatio: 430 / 541, zIndex: 4 },
  pipHit: { position: 'absolute', left: '1%', bottom: 20, width: '48%', height: '74%', zIndex: 5 },
  pipShadow: { position: 'absolute', left: '6%', bottom: 26, width: '34%', height: 15, borderRadius: 100, backgroundColor: '#8499b4', opacity: 0.2 },
  igloo: { position: 'absolute', width: '66%', aspectRatio: 640 / 427, right: '-3%', bottom: 24 },
  outline: { position: 'absolute', right: '5%', bottom: 32, width: '49%', height: 42, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9bb8cc', borderRadius: 100, transform: [{ rotate: '-3deg' }] },
  lightSpill: { position: 'absolute', right: '16%', bottom: 25, width: '22%', height: 14, borderRadius: 80, backgroundColor: '#ffe1a6', opacity: 0.24 },
  bubble: { position: 'absolute', left: '5%', top: -5, maxWidth: '64%', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 17, backgroundColor: '#fffaf0', borderWidth: 1, borderColor: '#e0d8cc', zIndex: 10 },
  bubbleText: { fontSize: 12, lineHeight: 17, color: '#526574', fontWeight: '600' },
  bubbleTail: { position: 'absolute', bottom: -5, left: 28, width: 10, height: 10, backgroundColor: '#fffaf0', transform: [{ rotate: '45deg' }] },
  caption: { position: 'absolute', bottom: 1, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#f7fcffcc', zIndex: 6 },
  captionText: { fontSize: 10, color: '#627f91', fontWeight: '700' },
});
