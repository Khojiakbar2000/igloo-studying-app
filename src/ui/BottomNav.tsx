import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, metrics, radii, space, todayColors, type, ui } from '../theme';
import { usePressMotion } from './usePressMotion';

const tabs = [
  { id: 'home', label: 'Today' }, { id: 'igloo', label: 'Igloo' },
  { id: 'friends', label: 'Friends' }, { id: 'profile', label: 'You' },
] as const;
export type TabId = typeof tabs[number]['id'];

export function BottomNav({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  const winter = active === 'home';
  return <SafeAreaView edges={['bottom']} style={[styles.safe, winter && styles.winterSurface]}><View testID="main-navigation" accessibilityRole="tablist" accessibilityLabel="Main navigation" style={[styles.bar, winter && styles.winterSurface]}>
    {tabs.map(tab => <NavItem key={tab.id} id={tab.id} label={tab.label} active={tab.id === active} winter={winter} onPress={() => onChange(tab.id)} />)}
  </View></SafeAreaView>;
}

function NavItem({ id, label, active, winter, onPress }: { id: TabId; label: string; active: boolean; winter: boolean; onPress: () => void }) {
  const pressMotion = usePressMotion();
  const ink = winter ? (active ? todayColors.link : todayColors.muted) : (active ? colors.link : colors.muted);
  return <Pressable accessibilityRole="tab" accessibilityLabel={label} aria-selected={active} accessibilityState={{ selected: active }} onPress={onPress}
    onPressIn={pressMotion.onPressIn} onPressOut={pressMotion.onPressOut} style={({ pressed }) => [styles.item, active && (winter ? styles.winterActive : styles.active), pressMotion.animatedStyle, pressed && ui.pressed]}>
    <NavIcon id={id} color={ink} />
    <Text style={[type.caption, { color: ink }, active && styles.activeLabel]}>{label}</Text>
  </Pressable>;
}

function NavIcon({ id, color }: { id: TabId; color: string }) {
  return <Svg width={metrics.icon} height={metrics.icon} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {id === 'home' && <><Circle cx="12" cy="12.5" r="7.5" /><Path d="M12 9v4h3M9 2h6M18 6l1.5-1.5" /></>}
    {id === 'igloo' && <><Path d="M3 18a9 9 0 0 1 18 0Z" /><Path d="M9 18v-3a3 3 0 0 1 6 0v3M7 12h10M12 9V6" /></>}
    {id === 'friends' && <><Circle cx="9" cy="8" r="3" /><Circle cx="17" cy="9" r="2.5" /><Path d="M3.5 19c.4-3 2.2-4.5 5.5-4.5s5 1.5 5.5 4.5M14 15c3.7-.8 6 .6 6.5 3" /></>}
    {id === 'profile' && <><Circle cx="12" cy="7.5" r="3.5" /><Path d="M4.5 20c.5-4.1 3-6.2 7.5-6.2s7 2.1 7.5 6.2" /></>}
  </Svg>;
}

const styles = StyleSheet.create({
  safe: { flexShrink: 0, backgroundColor: colors.paper },
  bar: { flexShrink: 0, minHeight: metrics.nav, paddingHorizontal: space.sm, paddingVertical: 5, flexDirection: 'row', gap: space.xs, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line },
  item: { flex: 1, minWidth: 0, minHeight: 52, borderRadius: radii.control, alignItems: 'center', justifyContent: 'center', gap: 2 },
  active: { backgroundColor: colors.ice },
  activeLabel: { fontWeight: '800' },
  winterSurface: { backgroundColor: todayColors.paper, borderTopColor: todayColors.line },
  winterActive: { backgroundColor: todayColors.wash },
});
