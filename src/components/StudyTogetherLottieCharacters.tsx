import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import type { AnimationObject } from 'lottie-react-native';
import StudyTogetherLottiePlayer, { type LottiePlayerHandle } from './StudyTogetherLottiePlayer';
import Reanimated, { useAnimatedStyle, useSharedValue, withSequence, withTiming, useReducedMotion } from 'react-native-reanimated';
import { STUDY_TOGETHER_SCENE } from '../scenes/studyTogetherArtContract';
import { WindowStormOverlay } from './WindowStormOverlay';
import { StudyWindowView } from './StudyWindowView';
import { WINDOW_OPENING, type StudyWindowScene } from '../scenes/studyWindowScenes';
import { StudyRoomEnvironment } from './StudyRoomEnvironment';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import type { StudyRoomId } from '../scenes/studyRooms';
import { SeatedPipReactions } from '../character/reactions/SeatedPipReactions';
import { useHomeMotion } from '../home/useHomeMotion';
import type { PenguinAction } from '../study-together/penguinAnimation';
import { DEFAULT_LIGHTING, type RoomLighting } from '../home/lighting';

const room = require('../../assets/environments/igloo/study-together-layers/room-floor-background-warm-nordic.jpg');
const stormRoom = require('../../assets/environments/igloo/study-together-layers/room-floor-background-warm-nordic.jpg');
const sofa = require('../../assets/environments/igloo/study-together-layers/sofa-warm-nordic.png');

type ActorId = 'typing' | 'reading' | 'writing' | 'headphones';
type GuestClip = 'study' | 'bored' | 'drink' | 'stretch' | 'wave' | 'yawn';
type FrameRange = [number, number];
type CompositionSegments = { segments: { study: FrameRange; actions: Record<Exclude<PenguinAction, 'study'>, FrameRange>; wake: FrameRange } };
type SeatBounds = { x: number; y: number; width: number; height: number };

const actorAssets: Record<ActorId, {
  id: ActorId; label: string; source: AnimationObject; segments: CompositionSegments;
  seat: SeatBounds; fallback: number;
}> = {
  typing: {
    id: 'typing', label: 'Pip typing on the MacBook',
    source: require('../../assets/animations/study-together-lottie/lottie/typing.json') as AnimationObject,
    segments: require('../../assets/animations/study-together-lottie/lottie/typing.segments.json') as CompositionSegments,
    seat: STUDY_TOGETHER_SCENE.seats.typing,
    fallback: require('../../assets/animations/pip-sofa-study/frames/pip-typing_00.png'),
  },
  reading: {
    id: 'reading', label: 'Pip reading a book',
    source: require('../../assets/animations/study-together-lottie/lottie/reading.json') as AnimationObject,
    segments: require('../../assets/animations/study-together-lottie/lottie/reading.segments.json') as CompositionSegments,
    seat: STUDY_TOGETHER_SCENE.seats.reading,
    fallback: require('../../assets/animations/study-together-reading/frames/pip-reading_00.png'),
  },
  writing: {
    id: 'writing', label: 'Pip writing in a notebook',
    source: require('../../assets/animations/study-together-lottie/lottie/writing.json') as AnimationObject,
    segments: require('../../assets/animations/study-together-lottie/lottie/writing.segments.json') as CompositionSegments,
    seat: STUDY_TOGETHER_SCENE.seats.writing,
    fallback: require('../../assets/animations/study-together-writing/frames/pip-writing_00.png'),
  },
  headphones: {
    id: 'headphones', label: 'Pip studying on a tablet with headphones',
    source: require('../../assets/animations/study-together-lottie/lottie/headphones.json') as AnimationObject,
    segments: require('../../assets/animations/study-together-lottie/lottie/headphones.segments.json') as CompositionSegments,
    seat: STUDY_TOGETHER_SCENE.seats.headphones,
    fallback: require('../../assets/animations/study-together-headphones/frames/pip-headphones_00.png'),
  },
};
const ACTORS: readonly ActorId[] = ['typing', 'reading', 'writing', 'headphones'];
const GUEST_ACTIONS: readonly Exclude<GuestClip, 'study'>[] = ['drink', 'bored', 'stretch', 'wave', 'yawn'];
const ARTBOARD_WIDTH = STUDY_TOGETHER_SCENE.artboard.width;
const ARTBOARD_HEIGHT = STUDY_TOGETHER_SCENE.artboard.height;

const StaticOrGuest = memo(function StaticOrGuest({ actor, active, reduced, animate }: {
  actor: (typeof actorAssets)[ActorId]; active: boolean; reduced: boolean; animate: boolean;
}) {
  const player = useRef<LottiePlayerHandle>(null);
  const next = useRef<GuestClip>('study');
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const playNext = useCallback(() => {
    if (!active || !animate) return;
    const clip = next.current;
    next.current = 'study';
    const range = clip === 'study' ? actor.segments.segments.study : actor.segments.segments.actions[clip];
    player.current?.play(...range);
  }, [active, actor, animate]);

  useEffect(() => {
    if (!loaded || failed) return;
    if (active && animate) playNext();
    else player.current?.pause();
  }, [active, animate, failed, loaded, playNext]);

  useEffect(() => {
    if (!active || !animate || failed || !loaded) return;
    const schedule = () => setTimeout(() => {
      next.current = GUEST_ACTIONS[Math.floor(Math.random() * GUEST_ACTIONS.length)];
      timer = schedule();
    }, 50_000 + Math.random() * 55_000);
    let timer = schedule();
    return () => clearTimeout(timer);
  }, [active, animate, failed, loaded]);

  if (failed) return <Image accessibilityLabel={actor.label} source={actor.fallback} resizeMode="contain" style={StyleSheet.absoluteFill} />;
  return <StudyTogetherLottiePlayer ref={player} source={actor.source} style={StyleSheet.absoluteFill}
    progress={reduced || !animate ? 0 : undefined} onLoaded={() => setLoaded(true)} onFailure={() => setFailed(true)}
    onFinish={cancelled => { if (!cancelled) playNext(); }} />;
});

export function StudyTogetherLottieCharacters({ windowStorm = false, windowScene, roomId, reactToPomodoro = false, coffeePerformance = false, coffeeReserved = false, onPipAvailable, breakStage, cushionPulse = 0, lighting = DEFAULT_LIGHTING }: {
  windowStorm?: boolean; windowScene?: StudyWindowScene;
  roomId?: StudyRoomId; reactToPomodoro?: boolean; coffeePerformance?: boolean; coffeeReserved?: boolean; onPipAvailable?: () => void; breakStage?: React.ReactNode; cushionPulse?: number;
  lighting?: RoomLighting;
}) {
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const active = useHomeMotion();
  const reducedMotion = useReducedMotion();

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFrameSize(current => current.width === width && current.height === height ? current : { width, height });
  }, []);
  const scale = frameSize.width && frameSize.height ? Math.min(frameSize.width / ARTBOARD_WIDTH, frameSize.height / ARTBOARD_HEIGHT) : 0;
  const left = useCallback((x: number) => x * scale + (frameSize.width - ARTBOARD_WIDTH * scale) / 2, [frameSize.width, scale]);
  const top = useCallback((y: number) => y * scale + (frameSize.height - ARTBOARD_HEIGHT * scale) / 2, [frameSize.height, scale]);
  const bounds = useCallback((box: { x: number; y: number; width: number; height: number }) => ({ left: left(box.x), top: top(box.y), width: box.width * scale, height: box.height * scale }), [left, scale, top]);
  const cushion = useSharedValue(0);
  const cushionStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cushion.value }, { scaleY: 1 - cushion.value * .012 }] }));
  useEffect(() => {
    if (!cushionPulse || reducedMotion) return;
    cushion.value = withSequence(withTiming(2, { duration: 130 }), withTiming(0, { duration: 300 }));
  }, [cushion, cushionPulse, reducedMotion]);
  const hasPanoramicWindow = windowStorm || Boolean(windowScene);

  return <View pointerEvents="none" onLayout={onLayout} style={StyleSheet.absoluteFill}>
    {roomId ? <View style={[styles.positioned, { zIndex: 0 }, bounds({ x: 0, y: 0, width: ARTBOARD_WIDTH, height: ARTBOARD_HEIGHT })]}><StudyRoomEnvironment roomId={roomId} windowScene={windowScene ?? 'blizzard'} lighting={lighting} /></View> : <>
      <Image accessibilityLabel={hasPanoramicWindow ? `Warm igloo room with a panoramic ${windowScene ?? 'blizzard'} window` : 'Original igloo room background'} source={hasPanoramicWindow ? stormRoom : room} resizeMode="stretch" style={styles.fullLayer} />
      {windowScene && windowScene !== 'blizzard' ? <View style={[styles.positioned, { zIndex: 1 }, bounds(WINDOW_OPENING)]}><StudyWindowView scene={windowScene} /></View> : hasPanoramicWindow && <WindowStormOverlay />}
    </>}
    <Reanimated.Image accessibilityLabel="Fluffy study sofa" source={sofa} resizeMode="stretch" style={[styles.positioned, styles.sofaLayer, bounds(STUDY_TOGETHER_SCENE.sofa), cushionStyle]} />
    {breakStage}
    {ACTORS.map(id => <View key={id} testID={reactToPomodoro ? `study-seat-${id}` : undefined} style={[styles.positioned, styles.characterLayer, bounds(actorAssets[id].seat), id === 'typing' && coffeePerformance && styles.behindPerformance]}>
      {id === 'typing'
        ? <SeatedPipReactions alwaysStudying={!reactToPomodoro} allowAmbientCoffee={false} enabled={scale > 0 && !coffeeReserved} onAvailable={onPipAvailable} />
        : <StaticOrGuest actor={actorAssets[id]} active={active} reduced={reducedMotion} animate />}
    </View>)}
    {roomId === 'igloo' && (lighting.sources.lamp || lighting.sources.lantern || lighting.sources.fireplace || lighting.sources.fairy) && <View pointerEvents="none" style={[styles.positioned, styles.characterLight, bounds(actorAssets.typing.seat)]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100"><Defs><RadialGradient id="pip-room-light"><Stop offset="0" stopColor={lighting.preset === 'magical' ? '#E9B968' : lighting.sources.fireplace && !lighting.sources.lamp && !lighting.sources.lantern ? '#FF9B4D' : '#FFD890'} stopOpacity={.15 * lighting.brightness}/><Stop offset="1" stopColor="#FFD890" stopOpacity="0"/></RadialGradient></Defs><Circle cx="50" cy="50" r="48" fill="url(#pip-room-light)" /></Svg>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  fullLayer: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 0 },
  positioned: { position: 'absolute' },
  sofaLayer: { zIndex: 2 },
  characterLayer: { zIndex: 3 },
  characterLight: { zIndex: 5, opacity: 1 },
  behindPerformance: { opacity: 0 },
});
