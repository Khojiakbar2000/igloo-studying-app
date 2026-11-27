import { useCompanionName } from '../../onboarding/ProfileProvider';
import { Chevron, IconButton } from '../../ui/Controls';
import { SheetSurface } from '../../ui/Overlay';
import { colors, radii, type } from '../../theme';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AnimationObject } from 'lottie-react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { StudyRoomPerformance } from '../../components/StudyRoomPerformance';
import { useHomeMotionState } from '../../home/useHomeMotion';
import { BREAK_ACTIVITIES, type BreakActivity, type BreakPerformance } from './activities';

const sequence: AnimationObject = require('../../../assets/animations/study-together-breaks/activities.json');
const ranges: Record<BreakPerformance, [number, number]> = require('../../../assets/animations/study-together-breaks/ranges.json');

export function BreakActivityStage({ activity, id, onVisible, onFinish }: {
  activity: BreakPerformance; id: number; onVisible: (id: number | null) => void; onFinish: (id: number) => void;
}) {
  const { active, motion, reduced } = useHomeMotionState();
  const finish = useCallback(() => onFinish(id), [id, onFinish]);
  const loaded = useCallback(() => onVisible(id), [id, onVisible]);
  // Lottie Web adds renderer information to its input over the course of playback.
  const source = useMemo(() => JSON.parse(JSON.stringify(sequence)) as AnimationObject, []);
  useEffect(() => () => onVisible(null), [onVisible]);

  useEffect(() => {
    if (!active || !reduced) return;
    const timer = setTimeout(finish, 900);
    return () => clearTimeout(timer);
  }, [active, finish, reduced]);

  if (reduced) return null;
  return <StudyRoomPerformance source={source} motion={motion} range={ranges[activity]}
    onLoaded={loaded} onFinish={finish} style={styles.performance} testID={`break-performance-${activity}`} />;
}

export function BreakActivityMenu({ enabled, open, onOpenChange, onSelect, drinkReady }: {
  enabled: boolean; open: boolean; onOpenChange: (open: boolean) => void; onSelect: (id: BreakActivity) => void; drinkReady: boolean;
}) {
  const companion = useCompanionName();
  if (!enabled) return null;
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`${companion}’s break activities`} accessibilityState={{ expanded: open }}
      onPress={() => onOpenChange(!open)} style={styles.seat} />
    {open && <SheetSurface style={styles.menu} accessibilityLabel="Choose a break activity">
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>A little breather</Text>
          <Text style={styles.hint}>{drinkReady ? `${companion} has a warm drink waiting` : `What should ${companion} do?`}</Text>
        </View>
        <IconButton label="Close break activities" onPress={() => onOpenChange(false)}><Chevron direction="close" /></IconButton>
      </View>
      <View style={styles.choices}>
        {BREAK_ACTIVITIES.map(({ id, label }) => <Pressable key={id} accessibilityRole="button" accessibilityLabel={label}
          onPress={() => onSelect(id)} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
          <View style={[styles.medallion, id === 'drink' && drinkReady && styles.readyMedallion]}>
            <ActivityIcon id={id} />
          </View>
          <Text style={styles.label}>{label}</Text>
        </Pressable>)}
      </View>
    </SheetSurface>}
  </>;
}

function ActivityIcon({ id }: { id: BreakActivity }) {
  const ink = '#6e422c';
  const brass = '#c08a52';
  const plush = '#6f738b';
  const ice = '#a9bdde';
  if (id === 'stretch') return <Svg viewBox="0 0 32 32" width={27} height={27}>
    <Path d="M10 21C6 20 5 16 3 13M22 21c4-1 5-5 7-8" fill="none" stroke={plush} strokeWidth={4} strokeLinecap="round" />
    <Ellipse cx={16} cy={20} rx={8} ry={8} fill={plush} /><Ellipse cx={16} cy={18} rx={5} ry={5} fill="#f2d4ac" />
    <Path d="m10 8 2 3m4-7v4m6 0-2 3" stroke={brass} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>;
  if (id === 'walk') return <Svg viewBox="0 0 32 32" width={27} height={27}>
    <Ellipse cx={10} cy={21} rx={5} ry={7} fill="#d3884a" transform="rotate(24 10 21)" />
    <Ellipse cx={22} cy={11} rx={5} ry={7} fill="#d3884a" transform="rotate(24 22 11)" />
    <Path d="m5 23 8 3m5-13 7 3" stroke={ink} strokeWidth={1.3} strokeLinecap="round" opacity={.45} />
  </Svg>;
  if (id === 'drink') return <Svg viewBox="0 0 32 32" width={27} height={27}>
    <Path d="M23 13h2c6 0 5 8-2 8M8 28h17M13 9c-5-3 4-4 1-7m5 7c-4-3 5-4 2-7" stroke={ink} fill="none" strokeWidth={1.7} strokeLinecap="round" />
    <Path d="M7 13h17l-2 8c-1 5-12 5-13 0Z" fill="#cf8c7f" stroke={ink} strokeWidth={1.4} />
  </Svg>;
  if (id === 'nap') return <Svg viewBox="0 0 32 32" width={27} height={27}>
    <Path d="M20 5a11 11 0 1 0 7 16A10 10 0 0 1 20 5Z" fill="#e2a15f" stroke={ink} strokeWidth={1.2} />
    <Path d="M25 5v7m-3-3h6m-1 6h3" stroke={plush} strokeWidth={1.6} strokeLinecap="round" />
  </Svg>;
  if (id === 'window') return <Svg viewBox="0 0 32 32" width={27} height={27}>
    <Path d="M4 26V15a12 12 0 0 1 24 0v11Z" fill={ice} stroke={ink} strokeWidth={1.7} />
    <Path d="M16 4v22M4 16h24M8 23l4-4 4 4 4-5 5 5" fill="none" stroke="#f9f4ec" strokeWidth={1.4} />
  </Svg>;
  return <Svg viewBox="0 0 32 32" width={27} height={27}>
    <Circle cx={15.5} cy={18} r={9} fill="#ca8154" stroke={ink} strokeWidth={1.3} />
    <Path d="M7 16c6 7 11-8 17-1M7 21c5 5 13-7 17-2m1-11 3-3m1 6 2-1" fill="none" stroke="#f7d9ad" strokeWidth={2.4} strokeLinecap="round" />
    <Rect x={3} y={7} width={4} height={2} rx={1} fill={brass} />
  </Svg>;
}

const styles = StyleSheet.create({
  performance: { zIndex: 3 },
  seat: { position: 'absolute', left: '5.6%', top: '48%', width: '22.4%', height: '16%', minWidth: 44, minHeight: 44, zIndex: 7 },
  menu: { position: 'absolute', bottom: '2%', left: '5%', right: '5%', zIndex: 12, padding: 8 },
  header: { paddingLeft: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...type.title, color: colors.ink },
  hint: { ...type.caption, color: colors.muted, marginTop: 1 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 4 },
  choice: { width: '32%', minHeight: 59, padding: 3, alignItems: 'center', justifyContent: 'center' },
  medallion: { width: 39, height: 39, borderRadius: radii.control, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, backgroundColor: colors.ice, borderColor: colors.line },
  readyMedallion: { backgroundColor: '#ffe5a5', borderColor: '#b68339' },
  label: { color: '#623d2a', fontSize: 10, fontWeight: '800', marginTop: 3, textAlign: 'center' },
  pressed: { transform: [{ translateY: 2 }], opacity: 0.83 },
});
