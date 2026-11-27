import { Chevron, IconButton } from '../ui/Controls';
import { Overlay } from '../ui/Overlay';
import { colors, type, ui } from '../theme';
import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import { useAmbientSound } from '../ambient/AmbientSoundProvider';
import { prepareAudioSession } from '../ambient/audioSession';
import { usePomodoro } from '../state/PomodoroContext';
import { boxStyle, FURNITURE, intersects, type Bounds, type FurnitureId } from './catalog';

type Entry = { id: FurnitureId; bounds?: Bounds; state: string; disabled: boolean; activate: () => void };
type Controller = {
  register: (entry: Entry) => () => void;
  activate: (id: FurnitureId, action: () => void) => void;
  entries: Entry[];
  last: { id: FurnitureId; serial: number } | null;
  shapes: boolean;
  setShapes: (value: boolean) => void;
  observeActivation: (listener: (id: FurnitureId) => void) => () => void;
};
const Context = createContext<Controller | null>(null);
const click = require('../../assets/audio/igloo-window/latch.wav');

export function FurnitureController({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [last, setLast] = useState<Controller['last']>(null);
  const [shapes, setShapes] = useState(false);
  const sound = useAudioPlayer(click);
  const { prefs } = useAmbientSound();
  const { timer } = usePomodoro();
  const soundEnabled = timer.home.furnitureSounds && !prefs.muted && prefs.master > 0;
  const serial = useRef(0);
  const observers = useRef(new Set<(id: FurnitureId) => void>());
  const observeActivation = useCallback((listener: (id: FurnitureId) => void) => {
    observers.current.add(listener);
    return () => { observers.current.delete(listener); };
  }, []);
  const register = useCallback((entry: Entry) => {
    setEntries(current => [...current.filter(item => item.id !== entry.id), entry]);
    return () => setEntries(current => current.filter(item => item !== entry));
  }, []);
  const activate = useCallback((id: FurnitureId, action: () => void) => {
    setLast({ id, serial: ++serial.current });
    observers.current.forEach(listener => listener(id));
    if (soundEnabled && id !== 'coffee') {
      sound.volume = prefs.master * .11;
      void prepareAudioSession().then(() => sound.seekTo(0)).then(() => sound.play()).catch(() => undefined);
    }
    action();
  }, [prefs.master, sound, soundEnabled]);
  const value = useMemo(() => ({ register, activate, entries, last, shapes, setShapes, observeActivation }), [register, activate, entries, last, shapes, observeActivation]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useFurnitureController = () => useContext(Context);

export function useFurniture(id: FurnitureId, action: () => void, options: {
  bounds?: Bounds; disabled?: boolean; state?: string; registered?: boolean;
} = {}) {
  const context = useFurnitureController();
  const register = context?.register;
  const activate = context?.activate;
  const { bounds, disabled = false, state = 'Ready', registered = true } = options;
  const handler = useRef(action);
  handler.current = action;
  const press = useCallback(() => {
    if (disabled) return;
    if (activate) activate(id, () => handler.current());
    else handler.current();
  }, [activate, disabled, id]);
  useLayoutEffect(() => {
    if (registered) return register?.({ id, bounds, disabled, state, activate: press });
  }, [register, id, bounds?.x, bounds?.y, bounds?.width, bounds?.height, disabled, registered, state, press]);
  return press;
}

export function FurnitureHotspot({ id, bounds, onPress, disabled, state, registered }: {
  id: FurnitureId; bounds: Bounds; onPress: () => void; disabled?: boolean; state?: string; registered?: boolean;
}) {
  const progress = useSharedValue(0);
  const reduced = useReducedMotion();
  const feedback = useAnimatedStyle(() => ({ opacity: progress.value * .68, transform: [{ translateY: progress.value * -4 }, { scaleX: 1 + progress.value * .08 }] }));
  const press = useFurniture(id, () => {
    if (!reduced) progress.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 300 }));
    onPress();
  }, { bounds, disabled, state, registered });
  return <Pressable accessibilityRole="button" accessibilityLabel={FURNITURE[id].label}
    accessibilityHint={FURNITURE[id].action} disabled={disabled} onPress={press} style={[styles.hotspot, boxStyle(bounds)]}>
    <Animated.View pointerEvents="none" style={[styles.feedback, feedback]} />
  </Pressable>;
}

export function FurnitureBounds() {
  const controller = useFurnitureController();
  if (!__DEV__ || !controller?.shapes) return null;
  const bounded = controller.entries.filter(entry => entry.bounds);
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.debugLayer]}>
    {bounded.map(entry => {
      const overlap = bounded.some(other => other !== entry && intersects(entry.bounds!, other.bounds!));
      return <View key={entry.id} style={[styles.outline, boxStyle(entry.bounds!), overlap && styles.overlap]}>
        <Text style={styles.debugLabel}>{entry.id}</Text>
      </View>;
    })}
  </View>;
}

export function FurnitureDirectory({ onCustomize, renderTrigger, showDebugControls = true }: {
  onCustomize: () => void;
  renderTrigger?: (open: () => void) => React.ReactNode;
  showDebugControls?: boolean;
}) {
  const controller = useFurnitureController();
  const { timer, setFurnitureSounds } = usePomodoro();
  const [open, setOpen] = useState(false);
  if (!controller) return null;
  const entries = [...controller.entries].sort((a, b) => Object.keys(FURNITURE).indexOf(a.id) - Object.keys(FURNITURE).indexOf(b.id));
  const conflicts = entries.flatMap((entry, i) => entries.slice(i + 1)
    .filter(other => entry.bounds && other.bounds && intersects(entry.bounds, other.bounds))
    .map(other => `${entry.id} / ${other.id}`));
  return <>
    {renderTrigger ? renderTrigger(() => setOpen(true)) :
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={styles.link}><Text style={styles.linkText}>Explore furniture</Text></Pressable>}
    {open && <Overlay visible transparent onRequestClose={() => setOpen(false)}>
      <View style={styles.shade}>
        <Pressable accessible={false} onPress={() => setOpen(false)} style={StyleSheet.absoluteFill} />
        <View style={styles.panel} accessibilityViewIsModal>
          <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Around the Igloo</Text>
            <IconButton label="Close furniture" onPress={() => setOpen(false)}><Chevron direction="close" /></IconButton>
          </View>
          <ScrollView style={styles.scroll}>
            {entries.map(entry => <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`Use ${FURNITURE[entry.id].label}`} disabled={entry.disabled}
              onPress={() => {setOpen(false);entry.activate();}} style={[styles.row, entry.disabled && styles.disabled]}>
              <Text style={styles.symbol}>{FURNITURE[entry.id].symbol}</Text><View style={styles.copy}>
                <Text style={styles.name}>{FURNITURE[entry.id].label}</Text><Text style={styles.note}>{FURNITURE[entry.id].action}</Text>
                {__DEV__ && controller.shapes && <Text style={styles.note}>{entry.state}{entry.bounds ? ' · Room target' : ' · Menu access'}</Text>}
              </View>
            </Pressable>)}
            <Pressable accessibilityRole="button" style={styles.row} onPress={() => {setOpen(false);onCustomize();}}><Text style={styles.name}>Customize furniture</Text></Pressable>
            <Pressable accessibilityRole="switch" accessibilityState={{ checked: timer.home.furnitureSounds }} style={styles.row}
              onPress={() => setFurnitureSounds(!timer.home.furnitureSounds)}><Text style={styles.name}>Furniture sounds · {timer.home.furnitureSounds ? 'On' : 'Off'}</Text></Pressable>
            {__DEV__ && showDebugControls && <Pressable accessibilityRole="button" style={styles.row} onPress={() => {controller.setShapes(!controller.shapes);setOpen(false);}}>
              <Text style={styles.name}>{controller.shapes ? 'Hide' : 'Show'} furniture touch boundaries</Text>
            </Pressable>}
            {__DEV__ && controller.shapes && <Text style={styles.note}>{conflicts.length ? `Overlapping targets: ${conflicts.join(', ')}` : 'No plotted targets overlap.'}{controller.last ? ` Last action: ${controller.last.id}.` : ''}</Text>}
          </ScrollView>
        </View>
      </View>
    </Overlay>}
  </>;
}

const styles = StyleSheet.create({
  hotspot: { position: 'absolute', zIndex: 5, minWidth: 35, minHeight: 35 },
  feedback: { position: 'absolute', bottom: '12%', left: '22%', right: '22%', height: 4, borderRadius: 5, backgroundColor: '#ffe1a3' },
  debugLayer: { zIndex: 35 },
  outline: { position: 'absolute', borderWidth: 1, borderColor: colors.iceBlue, backgroundColor: '#A8D8F022' },
  overlap: { backgroundColor: '#ff927a65', borderColor: '#ff765c' },
  debugLabel: { color: '#fff4e0', backgroundColor: colors.ink, fontSize: 9, alignSelf: 'flex-start' },
  link: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 12, backgroundColor: '#f2dec3' },
  linkText: { color: '#6b453f', fontWeight: '800' },
  shade: { ...ui.shade, backgroundColor: 'transparent' },
  panel: { ...ui.dialog, maxHeight: '84%', padding: 15 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...type.heading, color: colors.ink },
  close: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  closeText: { color: '#6b453f', fontSize: 24 },
  scroll: { flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 54, paddingVertical: 6, borderTopWidth: 1, borderColor: '#ead5bb' },
  disabled: { opacity: .53 },
  symbol: { width: 24, textAlign: 'center', color: '#965f44', fontSize: 20 },
  copy: { flex: 1 }, name: { color: '#523746', fontWeight: '700', fontSize: 15 }, note: { color: '#755a55', fontSize: 12 },
});
