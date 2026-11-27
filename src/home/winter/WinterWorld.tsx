import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SeatedPipReactions } from '../../character/reactions/SeatedPipReactions';
import { WinterEnvironment } from './WinterEnvironment';
import { WinterLottie } from './WinterLottie';
import { useCompanionName } from '../../onboarding/ProfileProvider';
import { radii, todayColors, type } from '../../theme';
import { useHomeMotion } from '../useHomeMotion';
import { constructionFrame } from './construction';

const construction = require('../../../assets/animations/pip/winter/lottie/igloo-construction.json');
// Preview the intended shape before focus places the first block, with the door unlit.
const plannedIglooFrame = 293 / 300;
const messages = [
  "I'm working right beside you!",
  'One little step at a time.',
  'This is a lovely place to focus.',
  'Every focused minute helps build our home.',
];

export function WinterWorld({ progress, active = true, onEnteredHome }: {
  progress: number;
  active?: boolean;
  onEnteredHome?: () => void;
}) {
  const motion = useHomeMotion(active);
  const companion = useCompanionName();
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
    <View pointerEvents="none" style={styles.iglooShadow} />
    <View testID="winter-igloo" pointerEvents="none" style={[styles.igloo, progress === 0 && styles.iglooPlan]}>
      <WinterLottie data={construction} playing={false} progress={progress === 0 ? plannedIglooFrame : constructionFrame(progress) / 300} />
    </View>
    {progress >= 1 && <View pointerEvents="none" style={styles.lightSpill} />}
    <View pointerEvents="none" style={styles.pipShadow} />
    <View testID="winter-pip-studying" style={styles.seated}>
      <SeatedPipReactions enabled={active} allowAmbientCoffee={false} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Say hello to ${companion}`} accessibilityHint="Hear a friendly message"
        onPress={() => say(progress >= 1 ? 'It’s so cozy in here. Thank you!' : messages[count.current++ % messages.length])}
        style={StyleSheet.absoluteFill} />
    </View>
    {bubble && <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.bubble, bubbleStyle]}>
      <Text style={styles.bubbleText}>{bubble}</Text><View style={styles.bubbleTail} />
    </Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  scene: { flex: 1, position: 'relative', overflow: 'visible' },
  seated: { position: 'absolute', left: '4%', bottom: '9%', width: '24%', aspectRatio: 430 / 541, zIndex: 4 },
  pipShadow: { position: 'absolute', left: '7%', bottom: '9%', width: '18%', height: 9, borderRadius: 100, backgroundColor: '#8499B4', opacity: 0.25 },
  igloo: { position: 'absolute', width: '103%', aspectRatio: 640 / 427, right: '-5%', bottom: 0 },
  iglooPlan: { opacity: 0.28 },
  iglooShadow: { position: 'absolute', right: '3%', bottom: '8%', width: '76%', height: '8%', borderRadius: 100, backgroundColor: '#7795B7', opacity: 0.18 },
  lightSpill: { position: 'absolute', left: '24%', bottom: '8%', width: '25%', height: 10, borderRadius: 80, backgroundColor: '#FFE1A6', opacity: 0.24 },
  bubble: { position: 'absolute', left: '4%', bottom: '57%', maxWidth: '60%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.control, backgroundColor: todayColors.paper, borderWidth: 1, borderColor: todayColors.line, zIndex: 10 },
  bubbleText: { ...type.caption, color: todayColors.ink, fontWeight: '600' },
  bubbleTail: { position: 'absolute', bottom: -5, left: 34, width: 10, height: 10, backgroundColor: todayColors.paper, transform: [{ rotate: '45deg' }] },
});
