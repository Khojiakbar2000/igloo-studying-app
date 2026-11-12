import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing, interpolate, useAnimatedStyle, useReducedMotion,
  useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop,
} from 'react-native-svg';
import { Penguin } from '../components/Penguin';

const PENGUIN_WIDTH = 118;
const PENGUIN_HEIGHT = 130;

type DepthStop = 'behind' | 'overlap' | 'front';

/** A deliberately small test fixture for split-object depth ordering.
 * The chair is temporary vector geometry; it is not production environment art. */
export function IglooOcclusionPrototype() {
  const { width: viewportWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [layoutWidth, setLayoutWidth] = useState<number | null>(null);
  const availableWidth = layoutWidth ?? viewportWidth;
  const contentWidth = Math.min(availableWidth - 32, 520);
  const stageWidth = Math.min(availableWidth - 48, 420);
  const stageHeight = stageWidth / 0.76;
  const [stageSize, setStageSize] = useState({ width: stageWidth, height: stageHeight });
  const queryDepth = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('depth') : null;
  const initialDepth: DepthStop = queryDepth === 'overlap' || queryDepth === 'front' ? queryDepth : 'behind';
  const [selected, setSelected] = useState<DepthStop>(initialDepth);
  const travel = useSharedValue(initialDepth === 'behind' ? 0 : initialDepth === 'overlap' ? 0.5 : 1);
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearPhaseTimers = useCallback(() => {
    phaseTimers.current.forEach(clearTimeout);
    phaseTimers.current = [];
  }, []);
  useEffect(() => () => clearPhaseTimers(), [clearPhaseTimers]);

  const setStop = useCallback((stop: DepthStop) => {
    clearPhaseTimers();
    setSelected(stop);
    const target = stop === 'behind' ? 0 : stop === 'overlap' ? 0.5 : 1;
    travel.value = withTiming(target, {
      duration: reducedMotion ? 0 : 840,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [clearPhaseTimers, reducedMotion, travel]);

  const runTraversal = useCallback(() => {
    clearPhaseTimers();
    setSelected('behind');
    travel.value = 0;
    if (reducedMotion) {
      travel.value = 1;
      setSelected('front');
      return;
    }
    travel.value = withSequence(
      withTiming(0.5, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
    );
    phaseTimers.current = [
      setTimeout(() => setSelected('overlap'), 1500),
      setTimeout(() => setSelected('front'), 3100),
    ];
  }, [clearPhaseTimers, reducedMotion, travel]);

  const characterStyle = useAnimatedStyle(() => {
    const t = travel.value;
    const footX = interpolate(t, [0, 0.5, 1], [stageSize.width * 0.50, stageSize.width * 0.52, stageSize.width * 0.78]);
    const footY = interpolate(t, [0, 0.5, 1], [stageSize.height * 0.44, stageSize.height * 0.64, stageSize.height * 0.73]);
    return { left: footX - PENGUIN_WIDTH / 2, top: footY - PENGUIN_HEIGHT };
  }, [stageSize.height, stageSize.width]);

  const chairLeft = stageSize.width * 0.38;
  const chairTop = stageSize.height * 0.24;
  const chairWidth = stageSize.width * 0.46;
  const chairHeight = stageSize.height * 0.54;
  const chairBackLayer = <View key="chair-back" pointerEvents="none" style={[styles.chairLayer, { left: chairLeft, top: chairTop, width: chairWidth, height: chairHeight }]}><ChairBack /></View>;
  const actorLayer = <Animated.View key="actor" pointerEvents="none" style={[styles.character, characterStyle]}><View style={styles.characterShadow} /><Penguin compact style={{ width: PENGUIN_WIDTH, height: PENGUIN_HEIGHT }} /></Animated.View>;
  const chairSeatLayer = <View key="chair-seat" pointerEvents="none" style={[styles.chairLayer, { left: chairLeft, top: chairTop, width: chairWidth, height: chairHeight }]}><ChairSeat /></View>;
  const chairFrontLayer = <View key="chair-front" pointerEvents="none" style={[styles.chairLayer, { left: chairLeft, top: chairTop, width: chairWidth, height: chairHeight }]}><ChairFrontLegs /></View>;

  return (
    <ScrollView onLayout={(event) => setLayoutWidth((current) => current === event.nativeEvent.layout.width ? current : event.nativeEvent.layout.width)} style={styles.page} contentContainerStyle={styles.content}>
      <View style={[styles.header, { width: contentWidth }]}>
        <Text style={styles.eyebrow}>IGLOO · ROOM STUDY</Text>
        <Text style={styles.title}>Chair depth prototype</Text>
        <Text style={styles.subtitle}>One room-space path, with the chair split at its natural depth planes.</Text>
      </View>

      <View
        accessibilityLabel="Temporary perspective floor used to test penguin and chair depth ordering"
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setStageSize((size) => size.width === width && size.height === height ? size : { width, height });
        }}
        style={[styles.scene, { width: stageWidth, height: stageHeight }]}
      >
        {stageSize.width > 0 && <Svg width={stageSize.width} height={stageSize.height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#DDEBFA" />
              <Stop offset="1" stopColor="#B8CAE4" />
            </LinearGradient>
            <LinearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#E8F0F7" />
              <Stop offset="1" stopColor="#C8D9EB" />
            </LinearGradient>
          </Defs>
          <Rect width={stageSize.width} height={stageSize.height} fill="url(#wall)" />
          <Path d={`M0 ${stageSize.height * 0.47} Q${stageSize.width * 0.5} ${stageSize.height * 0.38} ${stageSize.width} ${stageSize.height * 0.47} L${stageSize.width} ${stageSize.height} L0 ${stageSize.height} Z`} fill="url(#floor)" />
          <Path d={`M0 ${stageSize.height * 0.47} Q${stageSize.width * 0.5} ${stageSize.height * 0.38} ${stageSize.width} ${stageSize.height * 0.47}`} fill="none" stroke="#8FA9C8" strokeWidth="2" opacity="0.55" />
          <Ellipse cx={stageSize.width * 0.61} cy={stageSize.height * 0.70} rx={stageSize.width * 0.32} ry={stageSize.height * 0.11} fill="#8DA7C6" opacity="0.13" />
          {[0, 1, 2, 3].map((index) => <Path key={index} d={`M${stageSize.width * (0.12 + index * 0.2)} ${stageSize.height * 0.49} Q${stageSize.width * (0.5 + index * 0.04)} ${stageSize.height * 0.73} ${stageSize.width * (0.18 + index * 0.2)} ${stageSize.height * 0.98}`} fill="none" stroke="#9EB3CB" strokeWidth="1" opacity="0.16" />)}
          <Circle cx={stageSize.width * 0.15} cy={stageSize.height * 0.17} r={stageSize.width * 0.055} fill="#FFF7E8" opacity="0.92" />
          <Circle cx={stageSize.width * 0.15} cy={stageSize.height * 0.17} r={stageSize.width * 0.095} fill="#FFF7E8" opacity="0.2" />
        </Svg>}

        <View pointerEvents="none" style={styles.temporaryLabel}><Text style={styles.temporaryLabelText}>TEMPORARY DEPTH TEST · NOT FINAL ROOM ART</Text></View>

        {stageSize.width > 0 && <>
          {selected === 'behind' && <>{actorLayer}{chairBackLayer}{chairSeatLayer}{chairFrontLayer}</>}
          {selected === 'overlap' && <>{chairBackLayer}{chairSeatLayer}{actorLayer}{chairFrontLayer}</>}
          {selected === 'front' && <>{chairBackLayer}{chairSeatLayer}{chairFrontLayer}{actorLayer}</>}
        </>}
      </View>

      <View style={[styles.statusCard, { width: contentWidth }]}>
        <View style={styles.statusDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>{selected === 'behind' ? 'Penguin behind chair' : selected === 'overlap' ? 'Chair partly covers penguin' : 'Penguin in front of chair'}</Text>
          <Text style={styles.statusBody}>The foot anchor sets depth. Chair back, seat, and front legs sort at separate depths.</Text>
        </View>
      </View>

      <View style={[styles.controls, { width: contentWidth }]}>
        <DepthButton active={selected === 'behind'} label="Behind" onPress={() => setStop('behind')} />
        <DepthButton active={selected === 'overlap'} label="Partial cover" onPress={() => setStop('overlap')} />
        <DepthButton active={selected === 'front'} label="In front" onPress={() => setStop('front')} />
      </View>
      <Pressable accessibilityRole="button" onPress={runTraversal} style={({ pressed }) => [styles.runButton, { width: contentWidth }, pressed && styles.pressed]}>
        <Text style={styles.runButtonText}>PLAY FULL CROSSING  ↗</Text>
      </Pressable>

      <Text style={[styles.note, { width: contentWidth }]}>The real penguin Rive view moves over temporary split chair layers. This proves browser view-level occlusion ordering; the refined painted room still needs hand-separated production layers. Root motion here is a depth-test glide, not a finished walk cycle.</Text>
    </ScrollView>
  );
}

function ChairBack() {
  return <Svg viewBox="0 0 220 280" width="100%" height="100%">
    <Ellipse cx="110" cy="264" rx="76" ry="12" fill="#7891AC" opacity="0.2" />
    <Path d="M61 140 L56 245 Q56 257 65 257 Q72 257 73 246 L88 151 M155 137 L168 245 Q170 256 179 253 Q186 250 182 239 L170 133" fill="none" stroke="#7B513F" strokeWidth="16" strokeLinecap="round" />
    <Path d="M57 40 Q58 18 82 14 L145 20 Q164 25 164 48 L159 119 Q157 135 141 138 L78 133 Q60 131 59 114 Z" fill="#B67A54" stroke="#895C45" strokeWidth="5" />
    <Path d="M71 47 Q73 32 88 32 L140 37 Q151 40 151 53 L148 105 Q147 117 137 119 L83 115 Q71 113 70 102 Z" fill="#C78D63" opacity="0.75" />
    <Path d="M81 46 Q110 67 143 48 M78 76 Q111 97 148 78" fill="none" stroke="#D8A77D" strokeWidth="3" opacity="0.6" />
    <Path d="M71 131 L67 156 M153 132 L161 156" fill="none" stroke="#956449" strokeWidth="11" strokeLinecap="round" />
  </Svg>;
}

function ChairSeat() {
  return <Svg viewBox="0 0 220 280" width="100%" height="100%">
    <Path d="M39 133 Q43 119 59 119 L159 127 Q178 129 183 145 L178 163 Q174 174 157 172 L53 164 Q38 161 39 147 Z" fill="#D5A67E" stroke="#8D5F45" strokeWidth="5" />
    <Path d="M48 139 Q88 133 167 147 M50 151 Q105 146 170 158" fill="none" stroke="#E8C4A3" strokeWidth="3" opacity="0.75" />
    <Path d="M48 161 L48 188 Q49 196 58 196 L165 203" fill="none" stroke="#895D45" strokeWidth="10" strokeLinecap="round" />
  </Svg>;
}

function ChairFrontLegs() {
  return <Svg viewBox="0 0 220 280" width="100%" height="100%">
    <Path d="M59 157 L50 242 Q49 255 59 257 Q67 258 69 246 L85 162 M157 165 L166 247 Q168 259 178 257 Q187 254 183 242 L174 169" fill="none" stroke="#9B694A" strokeWidth="17" strokeLinecap="round" />
    <Path d="M65 229 L168 238" fill="none" stroke="#B67A54" strokeWidth="10" strokeLinecap="round" />
    <Path d="M54 249 L67 250 M169 250 L184 249" fill="none" stroke="#744B3A" strokeWidth="5" strokeLinecap="round" />
  </Svg>;
}

function DepthButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.depthButton, active && styles.depthButtonActive]}>
    <Text style={[styles.depthButtonText, active && styles.depthButtonTextActive]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8FA' },
  content: { alignItems: 'center', width: '100%', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 34 },
  header: { maxWidth: 520, width: '100%', marginBottom: 16 },
  eyebrow: { color: '#71889B', fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  title: { color: '#273D4B', fontSize: 28, fontWeight: '800', marginTop: 6 },
  subtitle: { color: '#668092', fontSize: 14, lineHeight: 20, marginTop: 5, maxWidth: 460 },
  scene: { position: 'relative', maxWidth: '100%', overflow: 'hidden', borderRadius: 30, backgroundColor: '#C9D8E9', borderWidth: 1, borderColor: '#D9E4EA' },
  temporaryLabel: { position: 'absolute', left: 12, top: 12, zIndex: 500, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(246,250,251,.88)' },
  temporaryLabelText: { color: '#71889B', fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  chairLayer: { position: 'absolute' },
  character: { position: 'absolute', width: PENGUIN_WIDTH, height: PENGUIN_HEIGHT, alignItems: 'center', justifyContent: 'flex-end' },
  characterShadow: { position: 'absolute', left: 21, bottom: -5, width: 54, height: 13, borderRadius: 7, backgroundColor: 'rgba(72,94,122,.19)' },
  statusCard: { maxWidth: 520, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, marginTop: 14, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2EBF0' },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D99C55' },
  statusTitle: { color: '#314B5A', fontSize: 14, fontWeight: '800' },
  statusBody: { color: '#71899A', fontSize: 12, lineHeight: 17, marginTop: 3 },
  controls: { flexDirection: 'row', gap: 8, maxWidth: 520, marginTop: 12 },
  depthButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 42, borderRadius: 13, backgroundColor: '#E9F0F3', borderWidth: 1, borderColor: '#DDE7EB' },
  depthButtonActive: { backgroundColor: '#405A69', borderColor: '#405A69' },
  depthButtonText: { color: '#506A79', fontSize: 12, fontWeight: '800' },
  depthButtonTextActive: { color: '#F6FBFC' },
  runButton: { maxWidth: 520, minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DFAF72', borderRadius: 15, marginTop: 9 },
  pressed: { opacity: 0.82 },
  runButtonText: { color: '#4B4037', fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  note: { maxWidth: 520, color: '#7A909D', fontSize: 11, lineHeight: 17, marginTop: 12 },
});
