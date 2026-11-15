import React, { memo, useEffect, useRef, useState } from 'react';
import { Asset } from 'expo-asset';
import { Image, LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { STUDY_TOGETHER_SCENE } from '../scenes/studyTogetherArtContract';
import type { PenguinCustomization, ScarfColor } from '../character/penguinCustomization';
import { PipAccessoryLayer } from './PipAccessoryLayer';
import { WindowStormOverlay } from './WindowStormOverlay';
import { StudyWindowView } from './StudyWindowView';
import { WINDOW_OPENING, type StudyWindowScene } from '../scenes/studyWindowScenes';
import { StudyRoomEnvironment } from './StudyRoomEnvironment';
import type { StudyRoomId } from '../scenes/studyRooms';

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
const decodedFrames: HTMLImageElement[] = [];

async function preloadCel(source: number) {
  const asset = Asset.fromModule(source);
  await asset.downloadAsync();
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const image = new window.Image();
    image.src = asset.uri;
    if (typeof image.decode === 'function') await image.decode();
    else await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Study frame failed to preload')); });
    decodedFrames.push(image);
    return;
  }
  await Image.prefetch(asset.localUri ?? asset.uri);
}

function StudyActivity({ activity, playing, reducedMotion, scale, left, top, customization }: {
  activity: StudyActivityConfig; playing: boolean; reducedMotion: boolean | null; scale: number;
  left: (x: number) => number; top: (y: number) => number;
  customization: PenguinCustomization;
}) {
  const [frame, setFrame] = useState(activity.startFrame);
  useEffect(() => {
    if (!playing || reducedMotion) return undefined;
    let current = activity.startFrame;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      current = (current + 1) % activity.frames.length;
      setFrame(current);
      timer = setTimeout(advance, exposureFrames[current] * 1000 / activity.fps);
    };
    timer = setTimeout(advance, activity.startDelay + exposureFrames[current] * 1000 / activity.fps);
    return () => clearTimeout(timer);
  }, [activity, playing, reducedMotion]);

  const box = activity;
  const source = activity.id === 'typing' && customization.scarf !== 'teal'
    ? scarfFrames[customization.scarf][frame]
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

/** Four complete Synfig cels are preloaded once; each persistent image advances on its own staggered loop. */
export function StudyTogetherCharacters({ customization = { scarf: 'teal', glasses: false, headphones: false }, windowStorm = false, windowScene, roomId }: { customization?: PenguinCustomization; windowStorm?: boolean; windowScene?: StudyWindowScene; roomId?: StudyRoomId }) {
  const reducedMotion = useReducedMotion();
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [initialFramesReady, setInitialFramesReady] = useState(false);
  const [allFramesReady, setAllFramesReady] = useState(false);

  useEffect(() => {
    let active = true;
    const flatFrames = [
      ...activities.flatMap((activity) => activity.frames.filter((_, index) => index !== activity.startFrame)),
      ...scarfFrames.berry, ...scarfFrames.lilac,
    ];
    const load = async () => {
      await Promise.all(activities.map((activity) => preloadCel(activity.frames[activity.startFrame])));
      if (active) setInitialFramesReady(true);
      for (let start = 0; start < flatFrames.length; start += 12) {
        const batch = flatFrames.slice(start, start + 12);
        await Promise.all(batch.map(preloadCel));
      }
      if (active) setAllFramesReady(true);
    };
    load().catch(() => { if (active) setInitialFramesReady(true); });
    return () => { active = false; decodedFrames.length = 0; };
  }, []);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFrameSize((current) => current.width === width && current.height === height ? current : { width, height });
  };
  const scale = frameSize.width && frameSize.height ? Math.min(frameSize.width / ARTBOARD_WIDTH, frameSize.height / ARTBOARD_HEIGHT) : 0;
  const left = (x: number) => x * scale + (frameSize.width - ARTBOARD_WIDTH * scale) / 2;
  const top = (y: number) => y * scale + (frameSize.height - ARTBOARD_HEIGHT * scale) / 2;
  const bounds = (box: { x: number; y: number; width: number; height: number }) => ({ left: left(box.x), top: top(box.y), width: box.width * scale, height: box.height * scale });
  const hasPanoramicWindow = windowStorm || Boolean(windowScene);

  return <View pointerEvents="none" onLayout={onLayout} style={StyleSheet.absoluteFill}>
    {roomId ? <View style={[styles.positioned, { zIndex: 0 }, bounds({ x: 0, y: 0, width: ARTBOARD_WIDTH, height: ARTBOARD_HEIGHT })]}><StudyRoomEnvironment roomId={roomId} windowScene={windowScene ?? 'blizzard'} /></View> : <>
      <Image accessibilityLabel={hasPanoramicWindow ? `Warm igloo room with a panoramic ${windowScene ?? 'blizzard'} window` : 'Original igloo room background'} source={hasPanoramicWindow ? stormRoom : room} resizeMode="stretch" style={styles.fullLayer} />
      {windowScene && windowScene !== 'blizzard' ? <View style={[styles.positioned, { zIndex: 1 }, bounds(WINDOW_OPENING)]}><StudyWindowView scene={windowScene} /></View> : hasPanoramicWindow && <WindowStormOverlay />}
    </>}
    <Image accessibilityLabel="Fluffy study sofa" source={sofa} resizeMode="stretch" style={[styles.positioned, styles.sofaLayer, bounds(sofaBounds)]} />
    {initialFramesReady && activities.map((activity) => <StableStudyActivity
      key={activity.id} activity={activity} playing={allFramesReady} reducedMotion={reducedMotion}
      scale={scale} left={left} top={top} customization={customization}
    />)}
  </View>;
}

const styles = StyleSheet.create({
  fullLayer: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 0 },
  positioned: { position: 'absolute' },
  sofaLayer: { zIndex: 2 },
  characterLayer: { zIndex: 3 },
  accessoryLayer: { zIndex: 4 },
});
