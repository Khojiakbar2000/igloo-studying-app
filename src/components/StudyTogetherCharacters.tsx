import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Asset } from 'expo-asset';
import { Animated, AppState, Image, LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { STUDY_TOGETHER_SCENE } from '../scenes/studyTogetherArtContract';
import type { PenguinCustomization, ScarfColor } from '../character/penguinCustomization';
import { PipAccessoryLayer } from './PipAccessoryLayer';
import { WindowStormOverlay } from './WindowStormOverlay';
import { StudyWindowView } from './StudyWindowView';
import { WINDOW_OPENING, type StudyWindowScene } from '../scenes/studyWindowScenes';
import { StudyRoomEnvironment } from './StudyRoomEnvironment';
import type { StudyRoomId } from '../scenes/studyRooms';
import { shouldAdvanceStudyLoop, type PenguinActivity, type PenguinAction } from '../study-together/penguinAnimation';

const room = require('../../assets/environments/igloo/study-together-layers/room-floor-background-clean.png');
const stormRoom = require('../../assets/environments/igloo/study-together-layers/room-floor-background-blizzard.jpg');
const sofa = require('../../assets/environments/igloo/study-together-layers/sofa.png');
const exposureFrames = [4, 2, 2, 3, 2, 2, 2, 3, 4, 2, 2, 3, 2, 2, 3, 4];
const frameSets = {
  typing: [
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_000.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_004.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_006.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_008.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_011.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_013.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_015.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_017.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_020.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_024.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_026.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_028.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_031.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_033.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_035.png'),
    require('../../assets/animations/pip-sofa-study/exports/pip-typing_038.png'),
  ],
  reading: [
    require('../../assets/animations/study-together-reading/exports/pip-reading_000.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_004.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_006.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_008.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_011.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_013.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_015.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_017.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_020.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_024.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_026.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_028.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_031.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_033.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_035.png'),
    require('../../assets/animations/study-together-reading/exports/pip-reading_038.png'),
  ],
  writing: [
    require('../../assets/animations/study-together-writing/exports/pip-writing_000.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_004.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_006.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_008.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_011.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_013.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_015.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_017.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_020.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_024.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_026.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_028.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_031.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_033.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_035.png'),
    require('../../assets/animations/study-together-writing/exports/pip-writing_038.png'),
  ],
  headphones: [
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_000.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_004.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_006.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_008.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_011.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_013.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_015.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_017.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_020.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_024.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_026.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_028.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_031.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_033.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_035.png'),
    require('../../assets/animations/study-together-headphones/exports/pip-headphones_038.png'),
  ],
} as const;

const scarfFrames: Record<Exclude<ScarfColor, 'teal'>, readonly number[]> = {
  berry: [
    require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-00.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-01.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-02.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-03.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-04.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-05.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-06.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-07.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-08.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-09.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-10.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-11.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-12.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-13.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-14.png'), require('../../assets/animations/pip-customization/study-together/scarves/berry/frame-15.png'),
  ],
  lilac: [
    require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-00.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-01.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-02.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-03.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-04.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-05.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-06.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-07.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-08.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-09.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-10.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-11.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-12.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-13.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-14.png'), require('../../assets/animations/pip-customization/study-together/scarves/lilac/frame-15.png'),
  ],
};

const seatedActionFrames: Partial<Record<PenguinAction, readonly number[]>> = {
  drink: [require('../../assets/animations/study-together-actions/coffee/frames/frame-00.png'), require('../../assets/animations/study-together-actions/coffee/frames/frame-01.png'), require('../../assets/animations/study-together-actions/coffee/frames/frame-02.png'), require('../../assets/animations/study-together-actions/coffee/frames/frame-03.png')],
  bored: [require('../../assets/animations/study-together-actions/bored/frames/frame-00.png'), require('../../assets/animations/study-together-actions/bored/frames/frame-01.png'), require('../../assets/animations/study-together-actions/bored/frames/frame-02.png'), require('../../assets/animations/study-together-actions/bored/frames/frame-03.png')],
  stretch: [require('../../assets/animations/study-together-actions/stretch/frames/frame-00.png'), require('../../assets/animations/study-together-actions/stretch/frames/frame-01.png'), require('../../assets/animations/study-together-actions/stretch/frames/frame-02.png'), require('../../assets/animations/study-together-actions/stretch/frames/frame-03.png')],
  wave: [require('../../assets/animations/study-together-actions/wave/frames/frame-00.png'), require('../../assets/animations/study-together-actions/wave/frames/frame-01.png'), require('../../assets/animations/study-together-actions/wave/frames/frame-02.png'), require('../../assets/animations/study-together-actions/wave/frames/frame-03.png')],
  break: [require('../../assets/animations/study-together-actions/break/frames/frame-00.png'), require('../../assets/animations/study-together-actions/break/frames/frame-01.png'), require('../../assets/animations/study-together-actions/break/frames/frame-02.png')],
  yawn: [require('../../assets/animations/study-together-actions/yawn/frames/frame-00.png'), require('../../assets/animations/study-together-actions/yawn/frames/frame-01.png'), require('../../assets/animations/study-together-actions/yawn/frames/frame-02.png'), require('../../assets/animations/study-together-actions/yawn/frames/frame-03.png')],
  celebrate: [require('../../assets/animations/study-together-actions/celebrate/frames/frame-00.png'), require('../../assets/animations/study-together-actions/celebrate/frames/frame-01.png'), require('../../assets/animations/study-together-actions/celebrate/frames/frame-02.png'), require('../../assets/animations/study-together-actions/celebrate/frames/frame-03.png')],
};
const actionTiming: Partial<Record<PenguinAction, { frameMs: number; sequence?: readonly number[]; hold: boolean }>> = {
  drink: { frameMs: 520, hold: false },
  bored: { frameMs: 430, hold: false },
  stretch: { frameMs: 460, hold: false },
  wave: { frameMs: 340, sequence: [0, 1, 2, 1, 2, 3], hold: false },
  break: { frameMs: 520, hold: true },
  yawn: { frameMs: 390, sequence: [0, 1, 2, 1, 3], hold: false },
  celebrate: { frameMs: 400, sequence: [0, 1, 2, 1, 3], hold: false },
};

type StudyActivityConfig = { id: string; label: string; frames: readonly number[]; fps: number; startDelay: number; startFrame: number; x: number; y: number; width: number; height: number };
const activities: StudyActivityConfig[] = [
  { id: 'typing', label: 'Pip typing on the MacBook integrated into his lap', frames: frameSets.typing, ...STUDY_TOGETHER_SCENE.seats.typing },
  { id: 'reading', label: 'Pip reading an open book held in his flippers', frames: frameSets.reading, ...STUDY_TOGETHER_SCENE.seats.reading },
  { id: 'writing', label: 'Pip writing in a notebook with a pencil held in his flipper', frames: frameSets.writing, ...STUDY_TOGETHER_SCENE.seats.writing },
  { id: 'headphones', label: 'Pip studying a tablet with headphones', frames: frameSets.headphones, ...STUDY_TOGETHER_SCENE.seats.headphones },
];
const ARTBOARD_WIDTH = STUDY_TOGETHER_SCENE.artboard.width;
const ARTBOARD_HEIGHT = STUDY_TOGETHER_SCENE.artboard.height;
const sofaBounds = STUDY_TOGETHER_SCENE.sofa;
async function preloadCel(source: number): Promise<HTMLImageElement | null> {
  const asset = Asset.fromModule(source);
  await asset.downloadAsync();
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const image = new window.Image();
    image.src = asset.uri;
    if (typeof image.decode === 'function') await image.decode();
    else await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Study frame failed to preload')); });
    return image;
  }
  await Image.prefetch(asset.localUri ?? asset.uri);
  return null;
}

type CelCache = Map<number, Promise<HTMLImageElement | null>>;
function preloadCachedCel(source: number, cache: CelCache) {
  const existing = cache.get(source);
  if (existing) return existing;
  const request = preloadCel(source);
  cache.set(source, request);
  request.catch(() => { if (cache.get(source) === request) cache.delete(source); });
  return request;
}

function StudyActivity({ activity, playing, pauseAtBoundary = false, reducedMotion, scale, left, top, customization, displayedScarf, onLoopBoundary }: {
  activity: StudyActivityConfig; playing: boolean; pauseAtBoundary?: boolean; reducedMotion: boolean | null; scale: number;
  left: (x: number) => number; top: (y: number) => number;
  customization: PenguinCustomization; displayedScarf: ScarfColor;
  onLoopBoundary?: () => void;
}) {
  const [frame, setFrame] = useState(activity.startFrame);
  const currentFrame = useRef(activity.startFrame);
  const boundaryCallback = useRef(onLoopBoundary);
  boundaryCallback.current = onLoopBoundary;
  const remainingMs = useRef<number | null>(null);
  const scheduledAt = useRef<number | null>(null);
  useEffect(() => {
    if (reducedMotion) return undefined;
    if (!playing && (!pauseAtBoundary || currentFrame.current === activity.startFrame)) {
      if (pauseAtBoundary && currentFrame.current === activity.startFrame) boundaryCallback.current?.();
      return undefined;
    }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (delay: number) => {
      remainingMs.current = delay;
      scheduledAt.current = Date.now();
      timer = setTimeout(() => {
        scheduledAt.current = null;
        const next = (currentFrame.current + 1) % activity.frames.length;
        currentFrame.current = next;
        setFrame(next);
        if (!playing && pauseAtBoundary && next === activity.startFrame) boundaryCallback.current?.();
        if (!playing && pauseAtBoundary && next === activity.startFrame) {
          remainingMs.current = null;
          return;
        }
        schedule(exposureFrames[next] * 1000 / activity.fps);
      }, delay);
    };
    const delay = remainingMs.current ?? activity.startDelay + exposureFrames[currentFrame.current] * 1000 / activity.fps;
    schedule(delay);
    return () => {
      clearTimeout(timer);
      if (scheduledAt.current !== null && remainingMs.current !== null) {
        remainingMs.current = Math.max(0, remainingMs.current - (Date.now() - scheduledAt.current));
      }
      scheduledAt.current = null;
    };
  }, [activity, pauseAtBoundary, playing, reducedMotion]);

  const box = activity;
  const source = activity.id === 'typing' && displayedScarf !== 'teal'
    ? scarfFrames[displayedScarf][frame]
    : activity.frames[frame];
  const characterBounds = {
    left: left(box.x), top: top(box.y), width: box.width * scale, height: box.height * scale,
  };
  return <>
    <Image accessibilityLabel={activity.label} source={source} resizeMode="contain" fadeDuration={0} style={[styles.positioned, styles.characterLayer, characterBounds]} />
    {activity.id === 'typing' && (customization.glasses || customization.headphones) && <View pointerEvents="none" style={[styles.positioned, styles.accessoryLayer, characterBounds]}>
      {customization.glasses && <PipAccessoryLayer kind="glasses" />}
      {customization.headphones && <PipAccessoryLayer kind="headphones" />}
    </View>}
  </>;
}
const StableStudyActivity = memo(StudyActivity);

/** Four Synfig loops remain the base scene; authored full-character action cels temporarily cover the local typing seat. */
export function StudyTogetherCharacters({ customization = { scarf: 'teal', glasses: false, headphones: false }, windowStorm = false, windowScene, roomId, localActivity, localAction = null, onLocalActionComplete }: { customization?: PenguinCustomization; windowStorm?: boolean; windowScene?: StudyWindowScene; roomId?: StudyRoomId; localActivity?: PenguinActivity; localAction?: PenguinAction | null; onLocalActionComplete?: (action: PenguinAction) => void }) {
  const reducedMotion = useReducedMotion();
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [initialFramesReady, setInitialFramesReady] = useState(false);
  const [displayedScarf, setDisplayedScarf] = useState<ScarfColor>('teal');
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const celCache = useRef<CelCache>(new Map());
  const [activeAction, setActiveAction] = useState<PenguinAction | null>(null);
  const [actionFrame, setActionFrame] = useState(0);
  const actionOpacity = useRef(new Animated.Value(0)).current;
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionRequestVersion = useRef(0);
  const activeActionRef = useRef<PenguinAction | null>(null);
  const requestedActionRef = useRef(localAction);
  const actionFinishedRef = useRef(false);
  const loopBoundaryRef = useRef(false);
  const completionCallbackRef = useRef(onLocalActionComplete);
  requestedActionRef.current = localAction;
  completionCallbackRef.current = onLocalActionComplete;

  const finishActionRef = useRef<(action: PenguinAction, notify: boolean) => void>(() => {});
  finishActionRef.current = (action, notify) => {
    if (activeActionRef.current !== action) return;
    if (actionTimer.current) clearTimeout(actionTimer.current);
    actionTimer.current = null;
    Animated.timing(actionOpacity, { toValue: 0, duration: 170, useNativeDriver: Platform.OS !== 'web' }).start(({ finished }) => {
      if (!finished || activeActionRef.current !== action) return;
      activeActionRef.current = null;
      loopBoundaryRef.current = false;
      setActiveAction(null);
      if (notify) completionCallbackRef.current?.(action);
    });
  };

  const startAction = useCallback((action: PenguinAction) => {
    const sourceFrames = seatedActionFrames[action];
    const timing = actionTiming[action];
    if (!sourceFrames?.length || !timing) return;
    if (actionTimer.current) clearTimeout(actionTimer.current);
    activeActionRef.current = action;
    actionFinishedRef.current = false;
    setActiveAction(action);
    const sequence = timing.sequence ?? sourceFrames.map((_, index) => index);
    let position = 0;
    setActionFrame(sequence[0]);
    actionOpacity.setValue(0);
    Animated.timing(actionOpacity, { toValue: 1, duration: 150, useNativeDriver: Platform.OS !== 'web' }).start();
    const advance = () => {
      actionTimer.current = setTimeout(() => {
        if (position + 1 < sequence.length) {
          position += 1;
          setActionFrame(sequence[position]);
          advance();
          return;
        }
        if (timing.hold) return;
        actionFinishedRef.current = true;
        if (loopBoundaryRef.current) finishActionRef.current(action, true);
      }, reducedMotion ? timing.frameMs * sequence.length : timing.frameMs);
    };
    advance();
  }, [actionOpacity, reducedMotion]);
  const startActionRef = useRef(startAction);
  startActionRef.current = startAction;

  useEffect(() => {
    const version = ++actionRequestVersion.current;
    if (actionTimer.current) clearTimeout(actionTimer.current);
    actionTimer.current = null;
    if (!localAction) {
      const active = activeActionRef.current;
      if (active) finishActionRef.current(active, false);
      return () => { actionRequestVersion.current += 1; };
    }
    if (activeActionRef.current === localAction) return () => { actionRequestVersion.current += 1; };
    const frames = seatedActionFrames[localAction];
    if (!frames) return () => { actionRequestVersion.current += 1; };
    // Warm the selected action in the background, but never hold its visual start on a decode promise.
    void Promise.all(frames.map(source => preloadCachedCel(source, celCache.current))).catch(() => undefined);
    if (actionRequestVersion.current === version && requestedActionRef.current === localAction) startActionRef.current(localAction);
    return () => { actionRequestVersion.current += 1; };
  }, [localAction, onLocalActionComplete]);

  const onActionLoopBoundary = useCallback(() => {
    loopBoundaryRef.current = true;
    const active = activeActionRef.current;
    if (active && active !== 'break' && actionFinishedRef.current) finishActionRef.current(active, true);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setAppActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => () => { celCache.current.clear(); }, []);

  useEffect(() => {
    let active = true;
    const firstFrameFallback = setTimeout(() => { if (active) setInitialFramesReady(true); }, 1200);
    const activityFrames = [
      ...activities.flatMap((activity) => activity.frames.filter((_, index) => index !== activity.startFrame)),
    ];
    const load = async () => {
      // Prepare each actor's first three distinct drawings before starting the shared scene.
      const firstFrames = activities.flatMap(activity => [0, 1, 2].map(offset => activity.frames[(activity.startFrame + offset) % activity.frames.length]));
      if (customization.scarf !== 'teal') { const frames = scarfFrames[customization.scarf]; firstFrames.push(...[0,1,2].map(offset => frames[(activities[0].startFrame + offset) % frames.length])); }
      await Promise.all([...new Set(firstFrames)].map(source => preloadCachedCel(source, celCache.current)));
      if (active) { clearTimeout(firstFrameFallback); setInitialFramesReady(true); }
      if (!active) return;
      // Only load the requested alternate scarf, and have it ready before swapping the typing cel.
      if (customization.scarf !== 'teal') {
        const selectedFrames = scarfFrames[customization.scarf];
        for (let start = 0; start < selectedFrames.length; start += 4) {
          if (!active) return;
          await Promise.all(selectedFrames.slice(start, start + 4).map(source => preloadCachedCel(source, celCache.current)));
          if (!active) return;
          if (start + 4 < selectedFrames.length) await new Promise<void>(resolve => setTimeout(resolve, 32));
        }
      }
      if (active) setDisplayedScarf(customization.scarf);
      // Warm the remaining studying cels in small batches. Cached first poses are not requested again.
      const remaining = activityFrames.filter(source => !firstFrames.includes(source));
      for (let start = 0; start < remaining.length; start += 4) {
        if (!active) return;
        await Promise.all(remaining.slice(start, start + 4).map(source => preloadCachedCel(source, celCache.current)));
        if (!active) return;
        if (start + 4 < remaining.length) await new Promise<void>(resolve => setTimeout(resolve, 32));
      }
    };
    load().catch(() => { if (active) { clearTimeout(firstFrameFallback); setInitialFramesReady(true); } });
    return () => { active = false; clearTimeout(firstFrameFallback); };
  }, [customization.scarf]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFrameSize((current) => current.width === width && current.height === height ? current : { width, height });
  };
  const scale = frameSize.width && frameSize.height ? Math.min(frameSize.width / ARTBOARD_WIDTH, frameSize.height / ARTBOARD_HEIGHT) : 0;
  const hasPanoramicWindow = windowStorm || Boolean(windowScene);

  const left = useCallback((x: number) => x * scale + (frameSize.width - ARTBOARD_WIDTH * scale) / 2, [frameSize.width, scale]);
  const top = useCallback((y: number) => y * scale + (frameSize.height - ARTBOARD_HEIGHT * scale) / 2, [frameSize.height, scale]);
  const bounds = useCallback((box: { x: number; y: number; width: number; height: number }) => ({ left: left(box.x), top: top(box.y), width: box.width * scale, height: box.height * scale }), [left, scale, top]);

  return <View pointerEvents="none" onLayout={onLayout} style={StyleSheet.absoluteFill}>
    {roomId ? <View style={[styles.positioned, { zIndex: 0 }, bounds({ x: 0, y: 0, width: ARTBOARD_WIDTH, height: ARTBOARD_HEIGHT })]}><StudyRoomEnvironment roomId={roomId} windowScene={windowScene ?? 'blizzard'} /></View> : <>
      <Image accessibilityLabel={hasPanoramicWindow ? `Warm igloo room with a panoramic ${windowScene ?? 'blizzard'} window` : 'Original igloo room background'} source={hasPanoramicWindow ? stormRoom : room} resizeMode="stretch" style={styles.fullLayer} />
      {windowScene && windowScene !== 'blizzard' ? <View style={[styles.positioned, { zIndex: 1 }, bounds(WINDOW_OPENING)]}><StudyWindowView scene={windowScene} /></View> : hasPanoramicWindow && <WindowStormOverlay />}
    </>}
    <Image accessibilityLabel="Fluffy study sofa" source={sofa} resizeMode="stretch" style={[styles.positioned, styles.sofaLayer, bounds(sofaBounds)]} />
    {initialFramesReady && activities.map((activity) => {
      const localSeat = activity.id === 'typing';
      const playing = initialFramesReady && appActive && (!localSeat || ((localAction === null) && (localActivity === undefined || shouldAdvanceStudyLoop(localActivity))));
      return <StableStudyActivity
        key={activity.id} activity={activity} playing={playing}
        pauseAtBoundary={localSeat && localAction !== null && appActive || localSeat && localActivity !== undefined && !shouldAdvanceStudyLoop(localActivity) && appActive}
        reducedMotion={reducedMotion} displayedScarf={displayedScarf}
        scale={scale} left={left} top={top} customization={customization}
        onLoopBoundary={localSeat ? onActionLoopBoundary : undefined}
      />;
    })}
    {activeAction && seatedActionFrames[activeAction] && <Animated.Image
      accessibilityLabel={`Pip ${activeAction}`} source={seatedActionFrames[activeAction]![actionFrame]}
      resizeMode="contain" fadeDuration={0}
      style={[styles.positioned, styles.actionLayer, bounds(STUDY_TOGETHER_SCENE.seats.typing), { opacity: actionOpacity }]}
    />}
    {activeAction && (customization.glasses || customization.headphones) && <Animated.View pointerEvents="none" style={[styles.positioned, styles.actionAccessories, bounds(STUDY_TOGETHER_SCENE.seats.typing), { opacity: actionOpacity }]}>
      {customization.glasses && <PipAccessoryLayer kind="glasses" />}
      {customization.headphones && <PipAccessoryLayer kind="headphones" />}
    </Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  fullLayer: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 0 },
  positioned: { position: 'absolute' },
  sofaLayer: { zIndex: 2 },
  characterLayer: { zIndex: 3 },
  accessoryLayer: { zIndex: 4 },
  actionLayer: { zIndex: 5 },
  actionAccessories: { zIndex: 6 },
});
