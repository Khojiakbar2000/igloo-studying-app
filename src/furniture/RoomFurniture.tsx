import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { AWARDS, studyMilestones } from '../awards/progression';
import { usePomodoro } from '../state/PomodoroContext';
import { usePipReactions } from '../character/reactions/PipReactionsProvider';
import { FurnitureHotspot, useFurniture } from './Furniture';
import { boxStyle, canPerformFurnitureActivity, type Bounds, type FurnitureId } from './catalog';

type Action = () => void;

export function FurnitureLink({ id, action, state, disabled }: { id: FurnitureId; action: Action; state?: string; disabled?: boolean }) {
  useFurniture(id, action, { state, disabled });
  return null;
}

export function Bookshelf({ bounds, secondaryBounds }: { bounds?: Bounds; secondaryBounds?: Bounds }) {
  const { timer } = usePomodoro();
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(20);
  const progress = useMemo(() => studyMilestones(timer.sessions).progress, [timer.sessions]);
  const sessions = useMemo(() => timer.sessions.flatMap(session => {
    const { time } = studyMilestones([session]).progress;
    return time ? [{ session, time }] : [];
  }).sort((a, b) => b.session.endedAt - a.session.endedAt), [timer.sessions]);
  const earned = AWARDS.filter(award => timer.awards.unlocked[award.id] !== undefined);
  const bookMotion = useSharedValue(0);
  const reduced = useReducedMotion();
  const booksStyle = useAnimatedStyle(() => ({ transform: [{ translateX: bookMotion.value }] }));
  const show = () => {
    setLimit(20);
    setOpen(true);
    if (!reduced) bookMotion.value = withSequence(withTiming(-4, { duration: 130 }), withTiming(0, { duration: 330 }));
  };
  const status = `${progress.sessions} completed sessions`;
  return <>
    {bounds ? <>
      {progress.sessions > 0 && <View pointerEvents="none" style={[styles.bookSpot, boxStyle(bounds)]}>
        <Animated.View style={[styles.books, booksStyle]}>
          {['#9c5659', '#d2a36b', '#545d8f', '#8f6ca0', '#a86f50'].slice(0, Math.min(5, 1 + Math.floor(progress.time / 3_600_000))).map(color =>
            <View key={color} style={[styles.book, { backgroundColor: color }]} />)}
        </Animated.View>
      </View>}
      <FurnitureHotspot id="bookshelf" bounds={bounds} onPress={show} state={status} />
      {secondaryBounds && <FurnitureHotspot id="bookshelf" bounds={secondaryBounds} onPress={show} state={status} registered={false} />}
    </> : <FurnitureLink id="bookshelf" action={show} state={status} />}
    {open && <Modal transparent visible onRequestClose={() => setOpen(false)}>
      <View style={styles.shade}>
        <Pressable accessible={false} onPress={() => setOpen(false)} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={styles.panel}>
          <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>Study history</Text>
            <Pressable accessibilityLabel="Close study history" accessibilityRole="button" onPress={() => setOpen(false)} style={styles.button}><Text style={styles.close}>×</Text></Pressable>
          </View>
          <Text style={styles.summary}>{Math.floor(progress.time / 3_600_000)}h {Math.floor(progress.time / 60_000) % 60}m focused · {status}</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <Text style={styles.heading}>Living Awards</Text>
            <Text style={styles.note}>{earned.map(award => award.name).join(' · ') || 'Your awards will appear here as you study.'}</Text>
            <Text style={styles.heading}>Completed sessions</Text>
            {sessions.length === 0 && <Text style={styles.note}>Finish a focus session to add your first entry.</Text>}
            {sessions.slice(0, limit).map(({ session, time }) => <View key={session.id} style={styles.entry}>
              <View style={styles.entryCopy}><Text style={styles.heading}>{session.goalTitle || 'Focus session'}</Text>
                <Text style={styles.note}>{new Date(session.endedAt).toLocaleDateString()}</Text></View>
              <Text style={styles.note}>{Math.floor(time / 60_000)} min</Text>
            </View>)}
            {limit < sessions.length && <Pressable accessibilityRole="button" onPress={() => setLimit(limit + 20)} style={styles.button}><Text style={styles.heading}>Show more sessions</Text></Pressable>}
          </ScrollView>
        </View>
      </View>
    </Modal>}
  </>;
}

type RestAction = 'sit' | 'relax' | 'stretch' | 'nap';
const restOptions: { id: RestAction; label: string }[] = [
  { id: 'sit', label: 'Sit' }, { id: 'relax', label: 'Relax' }, { id: 'stretch', label: 'Stretch' }, { id: 'nap', label: 'Nap' },
];

export function SofaActions({ open, onClose, onSelect, queued, onCancel }: {
  open: boolean; onClose: Action; onSelect: (action: RestAction) => void; queued?: string | null; onCancel?: Action;
}) {
  const { timer } = usePomodoro();
  if (!open) return null;
  const allowed = canPerformFurnitureActivity(timer.mode, timer.status);
  return <View style={styles.restPanel}>
    <View style={styles.header}><Text accessibilityRole="header" style={styles.miniTitle}>Sofa</Text>
      <Pressable accessibilityLabel="Close sofa actions" accessibilityRole="button" onPress={onClose} style={styles.button}><Text style={styles.close}>×</Text></Pressable>
    </View>
    {!allowed && <Text style={styles.note}>Pip will take a breather when the timer allows.</Text>}
    <View style={styles.options}>{restOptions.map(({ id, label }) => <Pressable key={id} accessibilityRole="button" onPress={() => onSelect(id)} style={styles.choice}><Text style={styles.heading}>{label}</Text></Pressable>)}</View>
    {queued && <Pressable accessibilityRole="button" onPress={onCancel} style={styles.button}><Text style={styles.note}>Cancel queued {queued}</Text></Pressable>}
  </View>;
}

const walk = [
  require('../../assets/animations/igloo-penguin-walk/frame-01.png'),
  require('../../assets/animations/igloo-penguin-walk/frame-02.png'),
  require('../../assets/animations/igloo-penguin-walk/frame-03.png'),
  require('../../assets/animations/igloo-penguin-walk/frame-04.png'),
];
const blanket = require('../../assets/animations/study-together-breaks/nap.png');

export function BedPip({ resting, onHome, original }: { resting: boolean; onHome: Action; original: boolean }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const breath = useSharedValue(0);
  const [phase, setPhase] = useState<'walk' | 'sleep'>('walk');
  const [frame, setFrame] = useState(0);
  const callback = React.useRef(onHome);
  callback.current = onHome;
  useEffect(() => {
    setPhase('walk');
    progress.value = withTiming(resting ? 1 : 0, { duration: reduced ? 0 : 1750 });
    const settle = setTimeout(() => { if (resting) setPhase('sleep'); else callback.current(); }, reduced ? 0 : 1750);
    return () => clearTimeout(settle);
  }, [progress, reduced, resting]);
  useEffect(() => {
    if (reduced) return;
    const tick = setInterval(() => {
      if (phase === 'walk') setFrame(old => (old + 1) % walk.length);
      else breath.value = withSequence(withTiming(1, { duration: 850 }), withTiming(0, { duration: 850 }));
    }, phase === 'walk' ? 140 : 2200);
    return () => clearInterval(tick);
  }, [breath, phase, reduced]);
  const position = useAnimatedStyle(() => {
    // From the chair, follow the clear aisle, then turn left toward the bed.
    const t = progress.value;
    const x = t < .49 ? 49 - t * 13 : 42.63 - (t - .49) * (original ? 49 : 53);
    const y = t < .49 ? 49 + t * 51 : 74 + (t - .49) * (original ? 2 : 8);
    return { left: `${x}%`, top: `${y}%`, transform: [{ scaleY: 1 + breath.value * .019 }] };
  });
  return <Animated.View pointerEvents="none" accessibilityLabel={phase === 'sleep' ? 'Pip asleep under a blanket' : 'Pip walking'} style={[styles.bedPip, position]}>
    <Image source={phase === 'sleep' ? blanket : walk[frame]} resizeMode="contain" style={styles.fill} />
    {phase === 'sleep' && <Text style={styles.zzz}>z z z</Text>}
  </Animated.View>;
}

export function useFurnitureRest(available: boolean) {
  const { timer } = usePomodoro();
  const { requestRestReaction } = usePipReactions();
  const [bed, setBed] = useState<'away' | 'returning' | null>(null);
  const [queued, setQueued] = useState<RestAction | 'bed' | null>(null);
  const allowed = canPerformFurnitureActivity(timer.mode, timer.status);
  useEffect(() => {
    if (!available) { setBed(null); return; }
    if (!allowed) {
      if (bed === 'away') setBed('returning');
      return;
    }
    if (!queued || bed === 'returning') return;
    setQueued(null);
    if (queued === 'nap' || queued === 'bed') setBed('away');
    else if (bed === 'away') setBed('returning');
    else requestRestReaction(queued === 'stretch' ? 'stretch' : queued === 'sit' ? 'smile' : 'look');
  }, [allowed, available, bed, queued, requestRestReaction]);
  return { bed, queued, queue: setQueued, onHome: () => setBed(null), wake: () => setBed(value => value ? 'returning' : null) };
}

const styles = StyleSheet.create({
  shade: { flex: 1, backgroundColor: '#251f38a0', justifyContent: 'center', alignItems: 'center', padding: 15 },
  panel: { width: '100%', maxWidth: 420, maxHeight: '82%', borderRadius: 18, backgroundColor: '#fff3e1', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontFamily: 'serif', fontWeight: '700', color: '#523646' },
  close: { fontSize: 23, color: '#714836' },
  button: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  summary: { color: '#78534a', marginBottom: 10 },
  scroll: { flexGrow: 0 },
  content: { gap: 7, paddingBottom: 10 },
  heading: { color: '#513949', fontSize: 15, fontWeight: '800' },
  note: { color: '#775651', fontSize: 13, lineHeight: 19 },
  entry: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#ead6c1', paddingVertical: 9 },
  entryCopy: { flex: 1, gap: 3 },
  bookSpot: { position: 'absolute', zIndex: 4, justifyContent: 'center', alignItems: 'center' },
  books: { flexDirection: 'row', gap: 2, marginTop: '32%' },
  book: { width: 4, height: 12, borderRadius: 1, borderBottomWidth: 2, borderColor: '#f9d79a' },
  restPanel: { position: 'absolute', zIndex: 17, bottom: '2%', left: '6%', right: '6%', paddingHorizontal: 12, paddingBottom: 11, borderRadius: 16, backgroundColor: '#fae9d0', borderColor: '#be916f', borderWidth: 1 },
  miniTitle: { color: '#543647', fontFamily: 'serif', fontSize: 20, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  choice: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, backgroundColor: '#eed0b1', borderRadius: 9 },
  bedPip: { position: 'absolute', zIndex: 8, width: '16%', height: '15%' },
  fill: { width: '100%', height: '100%' },
  zzz: { position: 'absolute', right: 0, top: 0, color: '#cfdefd', fontWeight: '800' },
});
