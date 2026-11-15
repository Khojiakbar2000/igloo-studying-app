import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { STUDY_ROOMS, studyRoom, type StudyRoomId } from '../scenes/studyRooms';
import { STUDY_WINDOW_SCENES, type StudyWindowScene } from '../scenes/studyWindowScenes';
import { StudyWindowSelector } from './StudyWindowSelector';

type Props = { selected: StudyRoomId; pending: StudyRoomId | null; error: string | null; onChange: (id: StudyRoomId) => void; windowScene: StudyWindowScene; onWindowChange: (id: StudyWindowScene) => void };

export function StudyRoomSelector({ selected, pending, error, onChange, windowScene, onWindowChange }: Props) {
  const [windows, setWindows] = useState(true);
  const rail = useRef<ScrollView>(null);
  const rotation = useRef(new Animated.Value(0)).current;
  const turns = useRef(0);
  const reducedMotion = useReducedMotion();
  const showWindows = windows;
  const currentWindow = STUDY_WINDOW_SCENES.find((scene) => scene.id === windowScene)!;
  const cycle = () => {
    turns.current += 60;
    Animated.timing(rotation, { toValue: turns.current, duration: reducedMotion ? 0 : 160, useNativeDriver: true }).start();
    if (showWindows) {
      const index = selected === 'igloo' || pending === 'igloo' ? STUDY_WINDOW_SCENES.findIndex((scene) => scene.id === windowScene) : -1;
      onWindowChange(STUDY_WINDOW_SCENES[(index + 1) % STUDY_WINDOW_SCENES.length].id);
    } else {
      const index = STUDY_ROOMS.findIndex((room) => room.id === (pending ?? selected));
      onChange(STUDY_ROOMS[(index + 1) % STUDY_ROOMS.length].id);
    }
  };
  useEffect(() => {
    rail.current?.scrollTo({ x: Math.max(0, STUDY_ROOMS.findIndex((room) => room.id === selected) * 89 - 89), animated: false });
  }, [selected, showWindows]);
  return <View style={styles.panel} accessibilityLabel="Interactive scenery machine">
    <View pointerEvents="none" style={StyleSheet.absoluteFill}><Image accessible={false} source={require('../../assets/environments/study-together/scenery-machine.png')} resizeMode="stretch" fadeDuration={0} style={styles.machineArt} /></View>
    <View style={styles.header}>
      <View style={styles.modes}>
        <Pressable accessibilityRole="button" accessibilityLabel="Show room choices" accessibilityState={{ selected: !windows }} onPress={() => setWindows(false)} style={({ pressed }) => [styles.mode, !windows && styles.modeActive, pressed && styles.pressed]}><Text style={[styles.modeText, !windows && styles.modeTextActive]}>Rooms</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Show window scenarios" accessibilityState={{ selected: windows }} onPress={() => setWindows(true)} style={({ pressed }) => [styles.mode, windows && styles.modeActive, pressed && styles.pressed]}><Text style={[styles.modeText, windows && styles.modeTextActive]}>Window</Text></Pressable>
      </View>
      <View style={styles.display}>
        <View style={styles.displayHeader}><View style={[styles.led, { backgroundColor: pending || (windows && selected !== 'igloo') ? '#E5B85E' : '#A0D5AC' }]} /><Text style={styles.displayTitle}>{windows ? 'IGLOO WINDOW' : '10 STUDY SPOTS'}</Text></View>
        <Text accessibilityLiveRegion="polite" numberOfLines={1} style={styles.displayText}>{pending ? 'Opening…' : windows ? selected === 'igloo' ? currentWindow.label : 'Choose a view' : studyRoom(selected).label}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={windows ? 'Turn dial to next window scenario' : 'Turn dial to next study room'} accessibilityHint={windows ? 'Opens the next panoramic window preset in Snowy Igloo' : 'Opens the next illustrated study room'} onPress={cycle} style={({ pressed }) => [styles.dial, pressed && styles.pressed]}>
        <Animated.View style={[styles.dialFace, { transform: [{ rotate: rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }] }]}><View style={styles.dialNeedle} /></Animated.View>
      </Pressable>
    </View>
    <View style={styles.controls}>
    {showWindows ? <StudyWindowSelector embedded active={selected === 'igloo'} selected={windowScene} onChange={onWindowChange} /> : <ScrollView ref={rail} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {STUDY_ROOMS.map((room) => <Pressable key={room.id} accessibilityRole="button" accessibilityLabel={`Choose ${room.label}`} accessibilityState={{ selected: selected === room.id, busy: pending === room.id }} onPress={() => onChange(room.id)} style={({ pressed }) => [styles.card, selected === room.id && styles.selected, pressed && { opacity: 0.75 }]}>
        <Image source={room.thumbnail} resizeMode="cover" fadeDuration={0} style={styles.thumbnail} />
        <Text numberOfLines={2} style={[styles.name, selected === room.id && styles.selectedText]}>{pending === room.id ? 'Opening…' : room.label}</Text>
        {selected === room.id && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
      </Pressable>)}
    </ScrollView>}
    </View>
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', zIndex: 10, left: '3%', right: '3%', bottom: '0.8%', paddingTop: 8, paddingBottom: 14, paddingHorizontal: 18 },
  machineArt: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 7, height: 44 },
  modes: { flexDirection: 'row', gap: 3 },
  mode: { minWidth: 44, minHeight: 44, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderBottomWidth: 3, borderColor: '#8B7856', backgroundColor: '#294D49' },
  modeActive: { backgroundColor: '#E8C48A', borderColor: '#AC8652' },
  modeText: { color: '#E5D7B9', fontSize: 9, fontWeight: '800' },
  modeTextActive: { color: '#493A2A' },
  display: { flex: 1, minWidth: 0, paddingHorizontal: 6, paddingVertical: 5, backgroundColor: '#122E2D', borderRadius: 6, borderWidth: 1, borderColor: '#8B805B' },
  displayHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  displayTitle: { color: '#A7BEA4', fontSize: 6, letterSpacing: 0.5, fontWeight: '700' },
  displayText: { color: '#E3EFCB', fontSize: 9, fontWeight: '700' },
  led: { width: 4, height: 4, borderRadius: 3 },
  dial: { width: 44, height: 44, padding: 4, backgroundColor: '#B88E55', borderRadius: 24, borderWidth: 2, borderColor: '#E9CE94', borderBottomColor: '#8D673F' },
  dialFace: { flex: 1, borderRadius: 20, backgroundColor: '#2F5149', borderWidth: 2, borderColor: '#687D5E', alignItems: 'center' },
  dialNeedle: { width: 3, height: 10, marginTop: 2, backgroundColor: '#F0D492', borderRadius: 2 },
  controls: { minHeight: 94, justifyContent: 'center' },
  pressed: { opacity: 0.9, transform: [{ translateY: 1 }] },
  rail: { gap: 7, paddingBottom: 1 },
  card: { width: 82, padding: 3, borderRadius: 10, borderWidth: 2, borderColor: '#E1CDB2', backgroundColor: '#FFF7E9' },
  selected: { borderColor: '#456F72', backgroundColor: '#456F72' },
  thumbnail: { width: 72, height: 46, borderRadius: 5 },
  name: { color: '#614C38', fontSize: 9, lineHeight: 12, fontWeight: '700', height: 26, paddingTop: 3, textAlign: 'center' },
  selectedText: { color: '#F5FCF8' },
  check: { position: 'absolute', top: 5, right: 5, width: 15, height: 15, backgroundColor: '#456F72', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#F5FCF8', fontSize: 10, fontWeight: '800' },
  error: { color: '#944C3D', fontSize: 10, marginTop: 6 },
});
