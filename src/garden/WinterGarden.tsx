import { Chevron, IconButton } from '../ui/Controls';
import { Overlay } from '../ui/Overlay';
import { colors, type, ui } from '../theme';
import { useCompanionName } from '../onboarding/ProfileProvider';
import { useFurniture } from '../furniture/Furniture';
import { boxStyle, roomBox, type Bounds } from '../furniture/catalog';
import { IGLOO_FURNITURE } from '../study-together/iglooLayout';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { AnimationObject } from 'lottie-react-native';
import { usePomodoro } from '../state/PomodoroContext';
import { useHomeMotionState } from '../home/useHomeMotion';
import { usePipReactions } from '../character/reactions/PipReactionsProvider';
import { studyMilestones } from '../awards/progression';
import { HomeLottie } from '../components/HomeLottie';
import { canPlant, DECORATIONS, minutes, PLANTS, stage, stageName, STAGES, THRESHOLDS, type Plant } from './progression';
import { gardenMotion } from './motion';

const bench = require('../../assets/environments/igloo/garden/bench.webp');
const plants = [
  require('../../assets/environments/igloo/garden/plant-0.webp'),
  require('../../assets/environments/igloo/garden/plant-1.webp'),
  require('../../assets/environments/igloo/garden/plant-2.webp'),
  require('../../assets/environments/igloo/garden/plant-3.webp'),
  require('../../assets/environments/igloo/garden/plant-4.webp'),
  require('../../assets/environments/igloo/garden/plant-5.webp'),
];
const stages = [
  require('../../assets/environments/igloo/garden/stage-0.webp'),
  require('../../assets/environments/igloo/garden/stage-1.webp'),
  require('../../assets/environments/igloo/garden/stage-2.webp'),
  require('../../assets/environments/igloo/garden/stage-3.webp'),
];
const plantArt = (plant: Plant, growth = stage(plant)) => growth === 5 ? plants[plant.kind] : stages[Math.max(0, growth - 1)];
const artHeight = (growth: number) => [15, 15, 34, 56, 72, 82][growth];
const plantSize = (growth: number) => ({ height: artHeight(growth), top: 85 - artHeight(growth) });
const ornaments = ['', '', '◈', '🏮'];
const pots = ['#a96d52', '#598097', '#777990', '#97623e'];
type Effect = 'water' | 'sparkle' | 'butterfly' | 'snow';

export function WinterGarden({ visible, shared = false, original = false, busy = false, menuOnly = false, bounds }: {
  visible: boolean; bounds?: Bounds; menuOnly?: boolean; shared?: boolean; original?: boolean; busy?: boolean;
}) {
  const companion=useCompanionName();
  const { timer, hydrated, updateGarden } = usePomodoro();
  const { requestRestReaction, cue } = usePipReactions();
  const { motion, reduced, active } = useHomeMotionState(visible);
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState(0);
  const [moving, setMoving] = useState(false);
  const [effect, setEffect] = useState<Effect | null>(null);
  const [notice, setNotice] = useState('');
  const progress = useMemo(() => studyMilestones(timer.sessions).progress, [timer.sessions]);
  const garden = timer.home.garden;
  const plant = garden.plots[slot];
  const growth = plant ? stage(plant) : 0;
  const unseen = garden.plots.findIndex(item => item && stage(item) > item.seenStage);
  const [previousStage, setPreviousStage] = useState<number | null>(null);
  const blend = useRef(new Animated.Value(1)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const readyToReact = active && !busy && !cue && timer.mode !== 'focus' && timer.status === 'running';
  const grown = unseen >= 0 && stage(garden.plots[unseen]!) === 5;
  const celebrated = useRef<Plant | null>(null);
  const hasPlants = garden.plots.some(Boolean);
  const animation = useMemo(() => effect ? gardenMotion(effect, effect === 'water' ? '#8ee3ff' : plant ? PLANTS[plant.kind].color : '#ffe2a1') as unknown as AnimationObject : null, [effect, plant?.kind]);

  useEffect(() => {
    if (!readyToReact || !hasPlants) return;
    const next = garden.plots[unseen];
    const timeout = setTimeout(() => {
      if (grown && next && celebrated.current !== next) {
        celebrated.current = next;
        requestRestReaction('celebrate');
      } else {
        requestRestReaction('look');
        if (open && plant && Math.random() < .35) setEffect('water');
      }
    }, grown && next !== celebrated.current ? 3000 : 23_000 + Math.random() * 34_000);
    return () => clearTimeout(timeout);
  }, [readyToReact, hasPlants, garden.plots, unseen, grown, open, plant, requestRestReaction]);

  useEffect(() => {
    if (!motion || !open || growth !== 5 || effect || !plant) return;
    const timeout = setTimeout(() => {
      setEffect(plant.kind === 3 ? 'snow' : plant.kind === 0 || plant.kind === 4 ? 'butterfly' : 'sparkle');
    }, 38_000 + Math.random() * 65_000);
    return () => clearTimeout(timeout);
  }, [motion, open, growth, effect, plant]);

  useEffect(() => {
    if (!open || !plant || growth <= plant.seenStage) return;
    setNotice(`${PLANTS[plant.kind].name} reached ${stageName(plant).toLowerCase()}.`);
    if (!motion) {
      if (active) updateGarden({ type: 'seen', slot });
      return;
    }
    setPreviousStage(plant.seenStage);
    blend.setValue(0);
    const animation = Animated.timing(blend, { toValue: 1, duration: 900, useNativeDriver: true });
    animation.start(({ finished }) => {
      if (!finished) return;
      setPreviousStage(null);
      setEffect('sparkle');
      updateGarden({ type: 'seen', slot });
    });
    return () => { animation.stop(); blend.setValue(1); setPreviousStage(null); };
  }, [open, slot, plant, growth, motion, active, blend, updateGarden]);

  useEffect(() => {
    if (!motion || !open || !plant || (!effect && growth !== 5)) return;
    const swing = Animated.sequence([
      Animated.timing(sway, { toValue: -1, duration: 460, useNativeDriver: true }),
      Animated.timing(sway, { toValue: 1, duration: 760, useNativeDriver: true }),
      Animated.timing(sway, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]);
    const movement = effect ? swing : Animated.loop(Animated.sequence([swing, Animated.delay(4200)]));
    movement.start();
    const timeout = effect ? setTimeout(() => setEffect(null), 1850) : undefined;
    return () => { movement.stop(); sway.setValue(0); clearTimeout(timeout); };
  }, [motion, open, effect, growth, plant, sway]);

  const inspect = (index: number) => {
    if (moving) updateGarden({ type: 'move', slot, to: index });
    setSlot(index);
    setMoving(false);
    setEffect(null);
    setNotice('');
  };
  const interact = (next: Effect) => {
    if (motion) setEffect(next);
    setNotice(next === 'water' ? 'A little drink for your plant.' : 'Your plant sways.');
  };
  const close = () => { setOpen(false); setEffect(null); setMoving(false); setNotice(''); };
  const openGarden = useFurniture('garden', () => { setSlot(unseen >= 0 ? unseen : garden.active ?? 0); setOpen(true); }, {
    disabled: !hydrated || !visible, state: unseen >= 0 ? 'New growth' : open ? 'Open' : 'Ready',
    bounds: menuOnly ? undefined : bounds ?? (shared ? IGLOO_FURNITURE.garden : original ? roomBox(79, 64, 19, 11) : roomBox(78, 57, 19, 11)),
  });
  const next = THRESHOLDS[growth];
  return <>
    {!menuOnly && <Pressable accessibilityRole="button" accessibilityLabel={unseen >= 0 ? 'Winter Garden, new growth' : 'Open Winter Garden'}
      disabled={!hydrated || !visible} onPress={openGarden}
      style={[styles.trigger, bounds ? boxStyle(bounds) : shared ? boxStyle(IGLOO_FURNITURE.garden) : original ? styles.original : styles.personal]}>
      <Image source={bench} style={styles.fill} resizeMode="contain" />
      {unseen >= 0 && <View pointerEvents="none" style={styles.badge}><Text style={styles.badgeText}>✦</Text></View>}
    </Pressable>}
    {open && <Overlay visible transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={close}>
      <View style={styles.shade}>
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={close} />
        <View accessibilityViewIsModal style={styles.panel}>
          <View style={styles.header}>
            <View><Text style={styles.kicker}>{companion}’s greenhouse</Text><Text accessibilityRole="header" style={styles.title}>Winter Garden</Text></View>
            <IconButton label="Close garden" onPress={close}><Chevron direction="close" /></IconButton>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <View style={styles.greenhouse}>
              <Image source={bench} style={styles.backdrop} resizeMode="cover" />
              <View style={styles.grid}>
                {garden.plots.map((item, i) => <Pressable key={i} accessibilityRole="button"
                  accessibilityLabel={item ? `Plot ${i + 1}, ${PLANTS[item.kind].name}, ${stageName(item)}` : `Empty plot ${i + 1}`}
                  accessibilityState={{ selected: slot === i }} onPress={() => inspect(i)} style={[styles.plot, slot === i && styles.selected]}>
                  {item ? <Image source={plantArt(item)} style={styles.thumbnail} resizeMode="contain" /> : <Text style={styles.plus}>+</Text>}
                  <View style={[styles.miniPot, { backgroundColor: pots[item?.decoration ?? 0] }]} />
                  <Text style={styles.plotLabel}>{garden.active === i ? 'Active' : `Plot ${i + 1}`}</Text>
                </Pressable>)}
              </View>
            </View>
            {moving && <Text style={styles.note}>Tap another plot to move or swap your plant.</Text>}
            {plant ? <>
              <View style={styles.inspect}>
                <View style={styles.plantStage}>
                  {previousStage !== null && <Animated.Image source={plantArt(plant, previousStage)} resizeMode="contain"
                    style={[styles.heroPlant, plantSize(previousStage), { opacity: blend.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]} />}
                  <Animated.Image source={plantArt(plant)} resizeMode="contain" style={[styles.heroPlant, plantSize(growth), {
                    opacity: blend, transform: [{ rotate: sway.interpolate({ inputRange: [-1, 1], outputRange: ['-5deg', '5deg'] }) }],
                  }]} />
                  <View style={[styles.heroPot, { backgroundColor: pots[plant.decoration] }]} />
                  <Text style={styles.ornament}>{ornaments[plant.decoration]}</Text>
                  {motion && effect === 'water' && <View pointerEvents="none" style={styles.can}>
                    <Svg width={42} height={32} viewBox="0 0 42 32">
                      <Path d="M28 10C39 2 45 16 34 20M15 13l-9 9-4-1 2 5 5 1 10-7" fill="none" stroke="#dfac76" strokeWidth={3} strokeLinecap="round" />
                      <Path d="M13 10l19-4 5 14c-3 6-16 9-20 4z" fill="#bd784b" stroke="#f3c697" strokeWidth={1.5} />
                      <Path d="M17 12l12-3M22 22l7-2" fill="none" stroke="#f3c697" strokeWidth={1.5} />
                    </Svg>
                  </View>}
                  {motion && animation && <HomeLottie data={animation} active />}
                </View>
                <View style={styles.plantInfo}>
                  <Text style={styles.name}>{PLANTS[plant.kind].name}</Text>
                  <Text style={styles.note}>{stageName(plant)} · {minutes(plant)} focus min</Text>
                  <View style={styles.track}><View style={[styles.bar, { width: `${next ? Math.min(100, minutes(plant) / next * 100) : 100}%` }]} /></View>
                  <Text style={styles.note}>{next ? `${next - minutes(plant)} min to ${STAGES[growth].toLowerCase()}` : 'Fully grown · choose another plant to grow'}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <GardenButton label="Water" onPress={() => interact('water')} />
                <GardenButton label="Touch" onPress={() => interact('sparkle')} />
                <GardenButton label={moving ? 'Cancel move' : 'Move'} onPress={() => setMoving(!moving)} />
                <GardenButton label={DECORATIONS[plant.decoration]} hint="Change planter decoration" onPress={() => updateGarden({ type: 'decorate', slot })} />
                <GardenButton label={garden.active === slot ? 'Active plant' : 'Make active'} disabled={garden.active === slot || growth === 5} onPress={() => updateGarden({ type: 'activate', slot })} />
              </View>
              <Text accessibilityLiveRegion="polite" style={styles.note}>{notice || 'Water and touch are just for fun. Finished focus sessions help plants grow.'}</Text>
            </> : <>
              <Text style={styles.name}>Choose a seed</Text>
              {PLANTS.map((item, i) => {
                const unlocked = canPlant(i, progress);
                return <Pressable key={item.name} accessibilityRole="button" disabled={!unlocked} accessibilityState={{ disabled: !unlocked }}
                  accessibilityLabel={unlocked ? `Plant ${item.name}` : `${item.name}, locked`}
                  onPress={() => updateGarden({ type: 'plant', slot, kind: i })} style={styles.seed}>
                  <Image source={plants[i]} style={styles.seedArt} resizeMode="contain" />
                  <View style={styles.plantInfo}><Text style={styles.seedName}>{item.name}</Text>
                    <Text style={styles.note}>{unlocked ? 'Plant seed' : item.hours ? `Unlocks at ${item.hours} study hours` : 'Complete your first focus session'}</Text></View>
                </Pressable>;
              })}
            </>}
          </ScrollView>
        </View>
      </View>
    </Overlay>}
  </>;
}

function GardenButton({ label, onPress, disabled, hint }: { label: string; onPress: () => void; disabled?: boolean; hint?: string }) {
  return <Pressable accessibilityRole="button" accessibilityHint={hint} accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [styles.button, pressed && { opacity: .72 }]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  trigger: { position: 'absolute', width: '19%', aspectRatio: 1.22, minWidth: 44, minHeight: 44, zIndex: 8 },
  original: { right: '2%', top: '64%' }, personal: { right: '3%', top: '57%' },
  fill: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 0, right: 0, borderRadius: 14, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#82523d' },
  badgeText: { color: '#fff2bc' },
  shade: { ...ui.shade, backgroundColor: 'transparent' },
  panel: { ...ui.dialog, maxHeight: '93%', height: 720 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 19, paddingVertical: 12 },
  kicker: { fontSize: 10, color: '#855745', fontWeight: '800', letterSpacing: 2 },
  title: { ...type.heading, color: colors.ink },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#6a453a', fontSize: 29 },
  scroll: { flex: 1 }, content: { paddingHorizontal: 16, paddingBottom: 20, gap: 11 },
  greenhouse: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#392f4c', borderWidth: 1, borderColor: '#8d674b', padding: 9 },
  backdrop: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: .25 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
  plot: { width: '31%', minHeight: 78, borderRadius: 13, borderWidth: 1, borderColor: '#dab69055', alignItems: 'center', justifyContent: 'flex-end', paddingVertical: 5, backgroundColor: '#241e369c' },
  selected: { borderColor: '#ffda9b', backgroundColor: '#62465d' },
  thumbnail: { width: '88%', height: 42 }, plus: { fontSize: 24, color: '#efd4ae' },
  miniPot: { width: 27, height: 9, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopWidth: 2, borderTopColor: '#fff2bb88' },
  plotLabel: { color: '#fff1dd', fontSize: 11, fontWeight: '700', marginTop: 3 },
  inspect: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  plantStage: { width: 110, height: 110, position: 'relative', backgroundColor: '#382e48', borderRadius: 20 },
  heroPlant: { position: 'absolute', left: 10, top: 3, width: 90, height: 82, transformOrigin: 'bottom' },
  heroPot: { position: 'absolute', top: 82, left: 34, width: 42, height: 19, borderTopWidth: 4, borderTopColor: '#fff1bd88', borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  ornament: { position: 'absolute', bottom: 6, right: 8, color: '#f0d7ff' },
  can: { position: 'absolute', top: 1, right: 4 },
  plantInfo: { flex: 1, gap: 4 }, name: { color: '#493039', fontSize: 21, fontWeight: '700' },
  track: { height: 6, borderRadius: 8, backgroundColor: '#ead8cc', overflow: 'hidden', marginVertical: 4 },
  bar: { height: '100%', backgroundColor: '#866290' },
  note: { color: '#705247', fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  button: { backgroundColor: '#eadac9', borderRadius: 10, minHeight: 44, justifyContent: 'center', paddingHorizontal: 11 },
  buttonText: { color: '#573d45', fontWeight: '700', fontSize: 13 },
  seed: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderBottomWidth: 1, borderBottomColor: '#e9d7c8', paddingBottom: 4 },
  seedArt: { width: 44, height: 44 }, seedName: { color: '#503641', fontSize: 15, fontWeight: '700' },
});
