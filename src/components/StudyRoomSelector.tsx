import { useFurniture } from '../furniture/Furniture';
import { boxStyle, roomBox } from '../furniture/catalog';
import { IGLOO_FURNITURE } from '../study-together/iglooLayout';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { STUDY_ROOMS, studyRoom, type StudyRoomId } from '../scenes/studyRooms';
import { STUDY_WINDOW_SCENES, WINDOW_ART, type StudyWindowScene } from '../scenes/studyWindowScenes';
import LottiePlayer from './StudyTogetherLottiePlayer';
import Slider from '@react-native-community/slider';
import { LIGHTING_LABELS, LIGHTING_PRESETS, LIGHT_SOURCES, type LightSource, type LightingPreset, type RoomLighting } from '../home/lighting';

const closedArt = require('../../assets/environments/study-together/scenery-console-closed-warm-nordic.png');
const lidArt = require('../../assets/environments/study-together/scenery-console-lid-warm-nordic.png');
const glassArt = require('../../assets/environments/study-together/scenery-console-glass-warm-nordic.png');
const baseArt = require('../../assets/environments/study-together/scenery-console-base-warm-nordic.png');
const ignition = require('../../assets/animations/study-together-rooms/console-ignition.json');
const blizzardThumbnail = studyRoom('igloo').thumbnail;
type Mode = 'rooms' | 'window' | 'lighting';

type Props = {
  expanded?: boolean;
  windowRequest?: number;
  onExpandedChange?: (open: boolean) => void;
  selected: StudyRoomId;
  pending: StudyRoomId | null;
  error: string | null;
  onChange: (id: StudyRoomId) => void;
  windowScene: StudyWindowScene;
  onWindowChange: (id: StudyWindowScene) => void;
  lighting: RoomLighting;
  onLightingPreset: (preset: LightingPreset) => void;
  onLightingBrightness: (value: number) => void;
  onToggleLight: (source: LightSource) => void;
};

export function StudyRoomSelector({ selected, pending, error, onChange, windowScene, onWindowChange, lighting, onLightingPreset, onLightingBrightness, onToggleLight, expanded, onExpandedChange, windowRequest = 0 }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = expanded ?? internalOpen;
  const setOpen = onExpandedChange ?? setInternalOpen;
  const [mode, setMode] = useState<Mode>('window');
  const [pulse, setPulse] = useState(0);
  const [showPresets, setShowPresets] = useState(false);
  const travel = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();
  const choices = mode === 'rooms'
    ? STUDY_ROOMS.map(room => ({
      id: room.id, label: room.label, thumbnail: room.thumbnail,
      active: selected === room.id,
      choose: () => onChange(room.id),
    }))
    : STUDY_WINDOW_SCENES.map(scene => ({
      id: scene.id,
      label: scene.id === 'zombies' ? 'Zombies' : scene.id === 'spaceship' ? 'Cosmic Ship' : scene.label,
      thumbnail: scene.id === 'blizzard' ? blizzardThumbnail : WINDOW_ART[scene.id],
      active: selected === 'igloo' && windowScene === scene.id,
      choose: () => onWindowChange(scene.id),
    }));
  const tunedId = mode === 'rooms' ? pending ?? selected : windowScene;
  const tunedIndex = Math.max(0, choices.findIndex(choice => choice.id === tunedId));
  const tuned = choices[tunedIndex];

  useEffect(() => {
    const animation = Animated.timing(travel, {
      toValue: open ? 1 : 0,
      duration: reducedMotion ? 0 : 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [open, reducedMotion, travel]);

  const signal = () => setPulse(value => value + 1);
  const toggle = () => {
    setOpen(!open);
    setShowPresets(false);
    if (!open) signal();
  };
  const consoleBounds = selected === 'igloo' ? IGLOO_FURNITURE.console : roomBox(59, 81, 31, 12);
  const openConsole = useFurniture('scenery', toggle, { state: open ? 'Open' : 'Closed', bounds: consoleBounds });
  useEffect(() => {
    if (windowRequest > 0) {
      setMode('window');
      setShowPresets(false);
      signal();
    }
  }, [windowRequest]);
  const changeMode = (next: Mode) => {
    if (mode === next) return;
    setMode(next);
    setShowPresets(false);
    signal();
  };
  const tune = (index: number) => {
    choices[(index + choices.length) % choices.length].choose();
    setShowPresets(false);
    signal();
  };

  return <>
    <Animated.View
      pointerEvents={open ? 'none' : 'auto'}
      accessibilityElementsHidden={open}
      aria-hidden={open}
      importantForAccessibility={open ? 'no-hide-descendants' : 'auto'}
      style={[styles.rest, selected === 'igloo' && [styles.iglooRest, boxStyle(consoleBounds)],
        { opacity: travel.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0, 0] }) }]}
    >
      <Pressable accessibilityRole="button" accessibilityLabel="Open scenery console" accessibilityState={{ expanded: false }}
        disabled={open} onPress={openConsole} style={({ pressed }) => [styles.fill, pressed && styles.pressed]}>
        <Image source={closedArt} resizeMode="contain" fadeDuration={0} style={styles.fill} />
      </Pressable>
    </Animated.View>

    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      accessibilityElementsHidden={!open}
      aria-hidden={!open}
      importantForAccessibility={!open ? 'no-hide-descendants' : 'auto'}
      style={[styles.machine, { opacity: travel, transform: [
        { translateY: travel.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) },
        { scaleX: travel.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) },
        { scaleY: travel.interpolate({ inputRange: [0, 1], outputRange: [0.77, 1] }) },
      ] }]}
    >
      <Animated.View pointerEvents="none" style={[styles.lid, {
        transform: [
          { translateY: travel.interpolate({ inputRange: [0, 1], outputRange: [9, 0] }) },
          { scaleY: travel.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) },
        ],
      }]}>
        <Image source={lidArt} resizeMode="stretch" fadeDuration={0} style={styles.fill} />
      </Animated.View>
      <Image source={glassArt} resizeMode="stretch" fadeDuration={0} style={styles.glassArt} />
      <View pointerEvents="none" style={styles.faceplate} />
      <Image source={baseArt} resizeMode="stretch" fadeDuration={0} style={styles.base} />
      {open && <>
        <View style={styles.controls}>
          <View style={styles.rocker}>
            {(['rooms', 'window', 'lighting'] as const).map(item => <Pressable
              key={item} accessibilityRole="button" accessibilityState={{ selected: mode === item }}
              onPress={() => changeMode(item)} style={styles.modeTarget}>
              {({ pressed }) => <View style={[styles.brass, styles.modeKey, mode === item && styles.modeActive, pressed && styles.pressed]}>
                <View style={[styles.indicator, mode === item && styles.indicatorOn]} />
                <Text style={styles.brassText}>{item === 'rooms' ? 'Rooms' : item === 'window' ? 'Window' : 'Light'}</Text>
              </View>}
            </Pressable>)}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Fold shut scenery console" onPress={toggle} style={styles.latchTarget}>
            {({ pressed }) => <View style={[styles.brass, styles.latch, pressed && styles.pressed]}>
              <Text style={styles.brassText}>Fold shut</Text>
            </View>}
          </Pressable>
        </View>

        <View style={styles.instrument}>
          {mode === 'lighting' ? <ScrollView style={styles.lightScreen} contentContainerStyle={styles.lightContent} nestedScrollEnabled showsVerticalScrollIndicator>
            <Text style={styles.lightHeading}>ROOM ATMOSPHERE</Text>
            <View style={styles.lightPresets}>{LIGHTING_PRESETS.map(preset => <Pressable key={preset} accessibilityRole="button" accessibilityState={{ selected: lighting.preset === preset }} onPress={() => onLightingPreset(preset)} style={[styles.lightPreset, lighting.preset === preset && styles.lightPresetActive]}><Text numberOfLines={1} style={styles.lightPresetText}>{LIGHTING_LABELS[preset]}</Text></Pressable>)}</View>
            <Text style={styles.lightHeading}>BRIGHTNESS · {Math.round(lighting.brightness * 100)}%</Text>
            <Slider accessibilityLabel="Room brightness" minimumValue={.2} maximumValue={1} value={lighting.brightness} onValueChange={onLightingBrightness} minimumTrackTintColor="#F8D38C" maximumTrackTintColor="#76523A" thumbTintColor="#FFE7AC" style={styles.brightnessSlider} />
            <Text style={styles.lightHeading}>ROOM LIGHTS</Text>
            <View style={styles.lightPresets}>{LIGHT_SOURCES.map((source: LightSource) => <Pressable key={source} accessibilityRole="switch" accessibilityLabel={`Toggle ${source}`} accessibilityState={{ checked: lighting.sources[source] }} onPress={() => onToggleLight(source)} style={[styles.lightPreset, lighting.sources[source] && styles.lightPresetActive]}><Text style={styles.lightPresetText}>{source === 'lamp' ? 'Study lamp' : source === 'lantern' ? 'Lantern' : source === 'fairy' ? 'Fairy lights' : 'Fireplace'}</Text></Pressable>)}</View>
          </ScrollView> : <>
          <View style={styles.screen}>
            {showPresets ? <ScrollView style={styles.screenContent} nestedScrollEnabled showsVerticalScrollIndicator>
              {choices.map((choice, index) => <Pressable key={choice.id}
                accessibilityRole="button" accessibilityState={{ selected: choice.active }}
                onPress={() => tune(index)}
                style={({ pressed }) => [styles.preset, choice.active && styles.presetActive, pressed && styles.pressed]}>
                <Text style={styles.presetText}>{choice.label}</Text>
              </Pressable>)}
            </ScrollView> : <View style={styles.screenContent}>
              <Image accessible={false} source={tuned.thumbnail} resizeMode="cover" fadeDuration={0} style={styles.preview} />
            </View>}
            <View style={styles.tuner}>
              <TuningButton direction={-1} onPress={() => tune(tunedIndex - 1)} />
              <Pressable accessibilityRole="button" accessibilityLabel={showPresets ? 'Return to scenery preview' : `Choose scenery, current preset: ${tuned.label}`}
                accessibilityState={{ expanded: showPresets, busy: pending !== null }}
                onPress={() => setShowPresets(value => !value)}
                style={({ pressed }) => [styles.nameplate, pressed && styles.nameplatePressed]}>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.name}>{showPresets ? 'Back to preview' : tuned.label}</Text>
                <Text style={styles.chevron}>{showPresets ? '⌃' : '⌄'}</Text>
              </Pressable>
              <TuningButton direction={1} onPress={() => tune(tunedIndex + 1)} />
            </View>
          </View>
          </>}
        </View>
        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      </>}
      {open && pulse > 0 && !reducedMotion && <View pointerEvents="none" style={styles.flare}>
        <LottiePlayer key={pulse} source={ignition} autoPlay style={StyleSheet.absoluteFill} />
      </View>}
    </Animated.View>
  </>;
}

function TuningButton({ direction, onPress }: { direction: -1 | 1; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={direction === -1 ? 'Previous scenery' : 'Next scenery'}
    onPress={onPress} style={styles.tuningTarget}>
    {({ pressed }) => <View style={[styles.brass, styles.tuningKey, pressed && styles.pressed]}>
      <Text style={styles.tuningGlyph}>{direction === -1 ? '‹' : '›'}</Text>
    </View>}
  </Pressable>;
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  rest: { position: 'absolute', zIndex: 10, right: '10%', bottom: '7%', width: '31%', aspectRatio: 718 / 430, minHeight: 44 },
  iglooRest: { right: undefined, bottom: undefined, minHeight: 0 },
  machine: { position: 'absolute', zIndex: 11, left: '1%', right: '1%', bottom: '1%', height: '35%' },
  lid: { position: 'absolute', left: 0, width: '100%', top: 0, height: '21%' },
  glassArt: { position: 'absolute', left: 0, width: '100%', top: '21%', height: '65%' },
  base: { position: 'absolute', left: 0, width: '100%', bottom: 0, height: '14%' },
  faceplate: { position: 'absolute', left: '9%', right: '9%', top: '21%', bottom: '13%', borderRadius: 14,
    backgroundColor: '#53301f', borderColor: '#c68a46', borderWidth: 2 },
  controls: { position: 'absolute', top: 0, left: '13%', right: '13%', height: '24%',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  rocker: { flexDirection: 'row', gap: 1 },
  modeTarget: { minWidth: 50, minHeight: 44, justifyContent: 'center' },
  latchTarget: { minWidth: 57, minHeight: 44, justifyContent: 'center' },
  brass: { backgroundColor: '#d7a563', borderColor: '#f4ce91', borderBottomColor: '#81502c',
    borderWidth: 1, borderBottomWidth: 3, alignItems: 'center', justifyContent: 'center' },
  modeKey: { height: 23, borderRadius: 5, flexDirection: 'row', gap: 4 },
  modeActive: { backgroundColor: '#ffe1a1' },
  indicator: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#99613b' },
  indicatorOn: { backgroundColor: '#b7551c', borderWidth: 1, borderColor: '#f18426' },
  brassText: { color: '#442610', fontSize: 10, fontWeight: '900' },
  latch: { height: 23, borderRadius: 5, paddingHorizontal: 4, backgroundColor: '#c69456' },
  instrument: { position: 'absolute', left: '13%', right: '13%', top: '23%', bottom: '15%' },
  tuningTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  tuningKey: { width: 27, height: 27, borderRadius: 14 },
  tuningGlyph: { color: '#5b3218', fontSize: 23, lineHeight: 23, fontWeight: '800' },
  screen: { flex: 1, minWidth: 0, alignSelf: 'stretch', borderRadius: 8, overflow: 'hidden', backgroundColor: '#3c241c',
    borderColor: '#dbaf71', borderWidth: 2 },
  screenContent: { flex: 1, minHeight: 0, backgroundColor: '#3c241c' },
  preview: { width: '100%', height: '100%' },
  tuner: { flexDirection: 'row', backgroundColor: '#b57d48', borderTopColor: '#a87139', borderTopWidth: 1 },
  nameplate: { flex: 1, minHeight: 44, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5, gap: 5, backgroundColor: '#f2d49a' },
  nameplatePressed: { backgroundColor: '#d5a969' },
  name: { color: '#4e2b16', fontSize: 11, fontWeight: '900', flexShrink: 1 },
  chevron: { color: '#75441f', fontSize: 13 },
  preset: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#916443' },
  presetActive: { backgroundColor: '#754929' },
  presetText: { color: '#ffe8bd', fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.86, transform: [{ translateY: 2 }] },
  flare: { position: 'absolute', width: 32, height: 32, left: '50%', bottom: '9%', transform: [{ translateX: -16 }, { translateY: 16 }] },
  error: { position: 'absolute', bottom: 1, left: '13%', right: '13%', color: '#ffe3a7', fontSize: 9, textAlign: 'center' },
  lightScreen: { flex: 1, borderRadius: 8, backgroundColor: '#543a2c', borderColor: '#dbaf71', borderWidth: 2 },
  lightContent: { padding: 8, gap: 5 },
  lightHeading: { color: '#ffdfa4', fontSize: 9, fontWeight: '900', letterSpacing: .4, marginTop: 2 },
  lightPresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  lightPreset: { minHeight: 32, minWidth: '30%', maxWidth: '49%', justifyContent: 'center', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: '#79553b', borderWidth: 1, borderColor: '#b88753' },
  lightPresetActive: { backgroundColor: '#d7a563', borderColor: '#ffe3aa' },
  lightPresetText: { color: '#ffedcc', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  brightnessSlider: { height: 27, marginHorizontal: 4 },
});
