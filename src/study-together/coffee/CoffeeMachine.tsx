import { useFurniture } from '../../furniture/Furniture';
import { pixelBox } from '../../furniture/catalog';
import { usePomodoro } from '../../state/PomodoroContext';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import type { AnimationObject } from 'lottie-react-native';
import { StudyRoomPerformance } from '../../components/StudyRoomPerformance';
import { useAmbientSound } from '../../ambient/AmbientSoundProvider';
import { prepareAudioSession } from '../../ambient/audioSession';
import { useHomeMotionState } from '../../home/useHomeMotion';
import { BREW_MS, DRINKS, findDrink, type DrinkId } from './order';
import { COFFEE_STATION, IGLOO_COFFEE_OFFSET } from '../iglooLayout';
import type { useCoffeeOrder } from './useCoffeeOrder';

const machineArt = require('../../../assets/environments/study-together/coffee/machine.png');
const cups = {
  coffee: require('../../../assets/environments/study-together/coffee/coffee.png'),
  cocoa: require('../../../assets/environments/study-together/coffee/cocoa.png'),
  tea: require('../../../assets/environments/study-together/coffee/tea.png'),
  milk: require('../../../assets/environments/study-together/coffee/milk.png'),
};
const audio = require('../../../assets/audio/study-together-coffee/brew.wav');
const brew = require('../../../assets/animations/study-together-coffee/brew.json');
const waiting = require('../../../assets/animations/study-together-coffee/waiting.json');
const service = require('../../../assets/animations/study-together-coffee/serve.json');
const drinkArt = require('../../../assets/animations/study-together-coffee/drink-art.json');

type Template = typeof brew;
type Controller = ReturnType<typeof useCoffeeOrder>;
type Position = number[];
type PositionKey = { s?: Position; e?: Position };
type PositionTrack = { a: number; k: Position | PositionKey[] };
type DrinkLayer = { nm: string; ks?: { p?: PositionTrack }; shapes?: Array<{ ty: string }> };
const sceneBox = (x: number, y: number, w: number, h: number) => ({
  left: `${x / 1024 * 100}%` as const, top: `${y / 1536 * 100}%` as const,
  width: `${w / 1024 * 100}%` as const, height: `${h / 1536 * 100}%` as const,
});

function rgb(hex: string) {
  return [1, 3, 5].map(pos => parseInt(hex.slice(pos, pos + 2), 16) / 255).concat(1);
}

function withDrink(source: Template, drink: DrinkId, igloo: boolean, serving = false): AnimationObject {
  // Lottie Web annotates the composition it loads. Each order gets fresh layer data.
  const layers = JSON.parse(JSON.stringify(source.layers)) as DrinkLayer[];
  if (igloo) {
    const move = ([x, y, ...rest]: Position) => {
      // Blend the collection path into the new tray anchor while holding the sofa poses in place.
      const weight = serving ? Math.min(1, Math.max(0, (y - 980) / 130)) : 1;
      return [x + IGLOO_COFFEE_OFFSET.x * weight, y + IGLOO_COFFEE_OFFSET.y * weight, ...rest];
    };
    for (const layer of layers) {
      const position = layer.ks?.p;
      if (!position) continue;
      if (position.a === 0) position.k = move(position.k as Position);
      else for (const key of position.k as PositionKey[]) {
        if (key.s) key.s = move(key.s);
        if (key.e) key.e = move(key.e);
      }
    }
  }
  return {
    ...source,
    assets: source.assets.map((asset: { id: string }) => {
      if (asset.id === 'drink-cup') return drinkArt.mugs[drink];
      if (asset.id === 'drink-sip') return drinkArt.sipCels[drink];
      return asset;
    }),
    layers: layers.map(layer => layer.nm !== 'drink stream' ? layer : {
      ...layer,
      shapes: layer.shapes?.map(shape => shape.ty === 'st' ? { ...shape, c: { a: 0, k: rgb(findDrink(drink).color) } } : shape),
    }),
  };
}

export function coffeeStatus(coffee: Controller) {
  const order = coffee.order;
  if (!order) return coffee.enjoyed ? `Pip enjoyed ${findDrink(coffee.enjoyed).label.toLowerCase()}.` : null;
  const name = findDrink(order.drink).label;
  if (order.phase === 'brewing') return `Preparing ${name}…`;
  if (order.phase === 'serving') return `Pip is collecting ${name.toLowerCase()}.`;
  return coffee.eligible ? `${name} is ready for Pip.` : `${name} is ready. Pip will collect it at break time.`;
}

export function CoffeeMachine({ coffee, igloo, menuOpen, onMenuChange, onPerformanceVisibility }: {
  coffee: Controller;
  igloo: boolean;
  menuOpen: boolean;
  onMenuChange: (open: boolean) => void;
  onPerformanceVisibility: (visible: boolean) => void;
}) {
  const { timer } = usePomodoro();
  const { prefs } = useAmbientSound();
  const sound = useAudioPlayer(audio);
  const { motion, reduced, active } = useHomeMotionState();
  const { place, order, finish, enjoyed } = coffee;
  const [runningArt, setRunningArt] = useState<number | null>(null);
  const served = useRef<number | null>(null);
  const drink = order?.drink;
  const volume = prefs.muted || !timer.home.furnitureSounds ? 0 : prefs.master * 0.48;

  useEffect(() => { void prepareAudioSession().catch(() => undefined); }, []);
  useEffect(() => { sound.volume = volume; }, [sound, volume]);
  useEffect(() => {
    if (!active) sound.pause();
  }, [active, sound]);

  const ready = order?.phase === 'ready';
  const brewing = order?.phase === 'brewing';
  const serving = order?.phase === 'serving';
  const servingVisible = serving && !reduced && runningArt === order.id;
  const onServiceLoaded = useCallback(() => {
    if (serving) {
      setRunningArt(order.id);
      onPerformanceVisibility(true);
    }
  }, [onPerformanceVisibility, order?.id, serving]);

  useEffect(() => {
    if (serving) {
      onPerformanceVisibility(servingVisible);
      return () => onPerformanceVisibility(false);
    }
    onPerformanceVisibility(false);
  }, [onPerformanceVisibility, serving, servingVisible]);

  const endService = useCallback(() => {
    if (!serving || served.current === order.id) return;
    served.current = order.id;
    setRunningArt(null);
    onPerformanceVisibility(false);
    finish(order.id);
  }, [finish, onPerformanceVisibility, order?.id, serving]);

  useEffect(() => {
    if (!serving || !reduced || !active) return;
    const timer = setTimeout(endService, 650);
    return () => clearTimeout(timer);
  }, [active, endService, reduced, serving]);

  const brewSource = useMemo(() => drink && brewing ? withDrink(brew, drink, igloo) : null, [brewing, drink, igloo]);
  const waitingSource = useMemo(() => drink && ready ? withDrink(waiting, drink, igloo) : null, [drink, ready, igloo]);
  const serveSource = useMemo(() => drink && serving ? withDrink(service, drink, igloo, true) : null, [drink, igloo, serving]);

  const select = (id: DrinkId) => {
    if (!place(id)) return;
    onMenuChange(false);
    sound.volume = volume;
    if (volume > 0) {
      void sound.seekTo(0).catch(() => undefined);
      sound.play();
    }
  };

  const offset = igloo ? IGLOO_COFFEE_OFFSET : { x: 0, y: 0 };
  const station = { ...COFFEE_STATION, x: COFFEE_STATION.x + offset.x, y: COFFEE_STATION.y + offset.y };
  const press = useFurniture('coffee', () => onMenuChange(!menuOpen), {
    disabled: !!order, state: order?.phase ?? (menuOpen ? 'Open' : 'Ready'),
    bounds: pixelBox(station),
  });
  return <>
    <Pressable testID="coffee-machine" accessibilityRole="button"
      accessibilityLabel={order ? `Coffee machine, ${coffeeStatus(coffee)}` : 'Coffee machine'}
      accessibilityState={{ expanded: menuOpen, busy: brewing || serving, disabled: !!order }}
      disabled={!!order} onPress={press}
      style={({ pressed }) => [styles.station, sceneBox(station.x, station.y, station.width, station.height), pressed && styles.pressed]}>
      <Image accessible={false} source={machineArt} style={styles.fill} resizeMode="stretch" fadeDuration={0} />
      {(brewing || ready) && <View pointerEvents="none" style={styles.lamp} />}
    </Pressable>

    {brewSource && !reduced && order && <StudyRoomPerformance style={styles.performance} key={`brew-${order.id}`} source={brewSource} motion={motion}
      elapsedMs={Math.min(BREW_MS, Date.now() - order.startedAt)} />}
    {waitingSource && !reduced && <StudyRoomPerformance style={styles.performance} source={waitingSource} motion={motion} loop />}
    {drink && ((reduced && (brewing || ready || serving)) || (serving && !servingVisible)) &&
      <StillCup drink={drink} x={450 + offset.x} y={1216 + offset.y} />}
    {serveSource && !reduced && order && <StudyRoomPerformance style={styles.performance} key={`serve-${order.id}`} source={serveSource} motion={motion}
      onLoaded={onServiceLoaded} onFinish={endService} testID="coffee-service" />}
    {!order && enjoyed && <StillCup drink={enjoyed} x={108} y={947} />}

    {menuOpen && !order && <View accessibilityLabel="Choose a hot drink" style={styles.menu}>
      <View style={styles.menuTop}>
        <Text style={styles.menuTitle}>Hot drinks</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close drink menu" onPress={() => onMenuChange(false)} style={styles.close}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
      <View style={styles.keys}>
        {DRINKS.map(({ id, label }) => <Pressable key={id} accessibilityRole="button" accessibilityLabel={label}
          onPress={() => select(id)} style={({ pressed }) => [styles.key, pressed && styles.pressed]}>
          <Image source={cups[id]} accessible={false} style={styles.cupIcon} resizeMode="contain" />
          <Text style={styles.keyLabel}>{label}</Text>
        </Pressable>)}
      </View>
    </View>}
  </>;
}

function StillCup({ drink, x, y }: { drink: DrinkId; x: number; y: number }) {
  return <View pointerEvents="none" style={[styles.cup, sceneBox(x - 18, y - 15.5, 36, 31)]}>
    <Image accessible={false} source={cups[drink]} style={[styles.fill, styles.mirror]} resizeMode="stretch" fadeDuration={0} />
  </View>;
}

const styles = StyleSheet.create({
  station: { position: 'absolute', zIndex: 8, minHeight: 44, minWidth: 44 },
  fill: { width: '100%', height: '100%' },
  mirror: { transform: [{ scaleX: -1 }] },
  lamp: { position: 'absolute', left: '47.5%', top: '27%', width: '5%', aspectRatio: 1, borderRadius: 8, backgroundColor: 'rgba(255,228,143,0.65)' },
  cup: { position: 'absolute', zIndex: 9 },
  performance: { zIndex: 9 },
  menu: { position: 'absolute', zIndex: 12, left: '5%', right: '5%', bottom: '1.5%', padding: 4, paddingHorizontal: 6,
    borderRadius: 12, backgroundColor: '#7b482c', borderWidth: 2, borderColor: '#d6a366', borderBottomColor: '#503022',
    boxShadow: '0px 4px 10px #36213275' },
  menuTop: { height: 20, paddingLeft: 4, justifyContent: 'center' },
  menuTitle: { color: '#ffe5b1', fontSize: 11, fontWeight: '800' },
  close: { position: 'absolute', right: 0, top: -9, width: 44, height: 39, alignItems: 'flex-end', paddingRight: 3, justifyContent: 'center' },
  closeText: { color: '#ffe5b1', fontSize: 20, lineHeight: 22 },
  keys: { flexDirection: 'row', gap: 3 },
  key: { flex: 1, minWidth: 0, minHeight: 51, alignItems: 'center', justifyContent: 'center', padding: 2,
    backgroundColor: '#f7dfb9', borderColor: '#dbad75', borderRadius: 6, borderWidth: 1, borderBottomWidth: 2 },
  cupIcon: { height: 24, width: 30 },
  keyLabel: { color: '#5c3322', textAlign: 'center', fontSize: 9, fontWeight: '800', lineHeight: 10 },
  pressed: { transform: [{ translateY: 1 }], opacity: 0.84 },
});
