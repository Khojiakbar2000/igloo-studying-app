import React, { forwardRef, type ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, metrics, motion, radii, space, todayColors, type, ui } from '../theme';
import { usePressMotion } from './usePressMotion';

type ControlProps = {
  onPress: () => void;
  disabled?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, disabled, style, variant = 'primary', trailing, winter = false }: ControlProps & {
  variant?: 'primary' | 'secondary'; trailing?: ReactNode; winter?: boolean;
}) {
  const pressMotion = usePressMotion();
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
    onPressIn={pressMotion.onPressIn} onPressOut={pressMotion.onPressOut}
    aria-disabled={disabled} accessibilityState={{ disabled }} style={({ pressed }) => [
      ui.control, styles.button, variant === 'primary' ? ui.primary : ui.secondary,
      winter && (variant === 'primary' ? styles.winterPrimary : styles.winterSecondary),
      style, pressMotion.animatedStyle, pressed && ui.pressed, disabled && ui.disabled,
    ]}>
    <Text style={[type.label, { color: variant === 'primary' ? (winter ? todayColors.onPrimary : colors.primaryInk) : (winter ? todayColors.ink : colors.ink), textAlign: 'center' }]}>{label}</Text>
    {trailing}
  </Pressable>;
}

export const IconButton = forwardRef<React.ElementRef<typeof Pressable>, ControlProps & { children: ReactNode }>(
  function IconButton({ label, children, onPress, disabled, style }, ref) {
    const pressMotion = usePressMotion();
    return <Pressable ref={ref} accessibilityRole="button" accessibilityLabel={label} aria-disabled={disabled} accessibilityState={{ disabled }}
      onPress={onPress} onPressIn={pressMotion.onPressIn} onPressOut={pressMotion.onPressOut} disabled={disabled} style={({ pressed }) => [
        ui.control, ui.secondary, styles.icon, style, pressMotion.animatedStyle, pressed && ui.pressed, disabled && ui.disabled,
      ]}>{children}</Pressable>;
  },
);

export function Chevron({ direction, color = colors.ink }: { direction: 'back' | 'forward' | 'close'; color?: string }) {
  return <Svg width={metrics.icon} height={metrics.icon} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d={direction === 'back' ? 'm15 6-6 6 6 6' : direction === 'forward' ? 'm9 6 6 6-6 6' : 'm6 6 12 12M18 6 6 18'} />
  </Svg>;
}

export function ScreenHeader({ title, leading, actions, style, titleColor }: {
  title: string; leading?: ReactNode; actions?: ReactNode; style?: StyleProp<ViewStyle>; titleColor?: string;
}) {
  const { width } = useWindowDimensions();
  return <View style={[styles.header, style]}>
    {leading}
    <Text accessibilityRole="header" style={[width < 360 ? type.compactDisplay : type.display, styles.headerTitle, titleColor && { color: titleColor }]}>{title}</Text>
    {actions && <View style={styles.actions}>{actions}</View>}
  </View>;
}

export function Balance({ amount, winter = false }: { amount: number; winter?: boolean }) {
  return <View accessibilityLabel={`${amount === Infinity ? 'Unlimited' : amount} Snowflakes`} style={[styles.balance, winter && styles.winterBalance]}>
    <Text accessible={false} style={[styles.balanceIcon, winter && styles.winterBalanceIcon]}>❄</Text>
    <Text style={[type.label, styles.balanceValue, winter && styles.winterBalanceValue]}>{amount === Infinity ? '∞' : amount}</Text>
  </View>;
}

export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: readonly { id: T; label: string }[]; value: T; onChange: (value: T) => void; label: string;
}) {
  return <View accessibilityRole="tablist" accessibilityLabel={label} style={styles.segmented}>
    {options.map(option => <Pressable key={option.id} accessibilityRole="tab" aria-selected={option.id === value} accessibilityState={{ selected: option.id === value }}
      onPress={() => onChange(option.id)} style={({ pressed }) => [
        styles.segment, option.id === value && styles.segmentSelected, pressed && ui.pressed,
      ]}>
      <Text style={[type.label, styles.segmentLabel, option.id === value && styles.segmentLabelSelected]}>{option.label}</Text>
    </Pressable>)}
  </View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[ui.card, style]}>{children}</View>;
}

export function ProgressBar({ progress, label, tone = 'teal' }: { progress: number; label: string; tone?: 'teal' | 'ice' | 'winter' }) {
  const value = Math.max(0, Math.min(100, progress * 100));
  const reducedMotion = useReducedMotion();
  const animatedValue = useSharedValue(value);
  const [trackWidth, setTrackWidth] = useState(0);
  useEffect(() => {
    animatedValue.value = reducedMotion ? value : withTiming(value, { duration: motion.progress, easing: Easing.out(Easing.cubic) });
  }, [animatedValue, reducedMotion, value]);
  const fillStyle = useAnimatedStyle(() => ({ width: trackWidth * animatedValue.value / 100 }));
  return <View accessibilityRole="progressbar" accessibilityLabel={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}
    accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
    onLayout={event => setTrackWidth(event.nativeEvent.layout.width)} style={[styles.track, tone === 'winter' && styles.winterTrack]}>
    <Animated.View style={[styles.fill, { backgroundColor: tone === 'winter' ? todayColors.progress : tone === 'ice' ? colors.iceBlue : colors.gold }, fillStyle]} />
  </View>;
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return <Card style={styles.empty}>
    <Text style={[type.title, { color: colors.ink }]}>{title}</Text>
    {detail && <Text style={[type.body, styles.emptyDetail]}>{detail}</Text>}
  </Card>;
}

const styles = StyleSheet.create({
  button: { minHeight: metrics.button, flexDirection: 'row', gap: space.sm },
  winterPrimary: { backgroundColor: todayColors.primary, borderColor: todayColors.primary },
  winterSecondary: { backgroundColor: todayColors.wash, borderColor: todayColors.line },
  winterBalance: { backgroundColor: todayColors.paper, borderWidth: 1, borderColor: todayColors.line },
  winterBalanceIcon: { color: todayColors.link },
  winterBalanceValue: { color: todayColors.ink },
  winterTrack: { backgroundColor: todayColors.wash },
  icon: { width: metrics.hit, height: metrics.hit, paddingHorizontal: 0 },
  header: { minHeight: metrics.header, flexDirection: 'row', paddingHorizontal: space.lg, paddingVertical: space.sm, alignItems: 'center', gap: space.md },
  headerTitle: { color: colors.ink, flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  balance: { minHeight: metrics.hit, borderRadius: radii.control, paddingHorizontal: space.md, backgroundColor: colors.goldWash, gap: 6, flexDirection: 'row', alignItems: 'center' },
  balanceValue: { color: colors.goldInk, fontVariant: ['tabular-nums'] },
  balanceIcon: { color: colors.goldInk, fontSize: 16 },
  segmented: { padding: 3, borderRadius: radii.control, backgroundColor: colors.ice, flexDirection: 'row', gap: space.xs },
  segment: { flex: 1, minWidth: 0, minHeight: metrics.hit, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm },
  segmentSelected: { backgroundColor: colors.paper },
  segmentLabel: { textAlign: 'center', color: colors.muted },
  segmentLabelSelected: { color: colors.ink },
  track: { height: 7, backgroundColor: colors.ice, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },
  empty: { alignItems: 'center', gap: space.xs },
  emptyDetail: { color: colors.muted, textAlign: 'center' },
});
