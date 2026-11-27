import { StyleSheet } from 'react-native';

// Interface palette. Artwork and persisted appearance choices keep their authored colors.
export const colors = {
  ivory: '#F3F7FB',
  cream: '#FFFCF6',
  paper: '#FFFCF6',
  snow: '#F8FCFF',
  ink: '#293B50',
  charcoal: '#293B50',
  muted: '#60758C',
  primary: '#4C72B8',
  primaryPressed: '#3C5F9E',
  primaryInk: '#FFFFFF',
  onPrimary: '#FFFFFF',
  blue: '#739CE8',
  periwinkle: '#829BE8',
  iceBlue: '#A8D8F0',
  ice: '#EDF4FA',
  peach: '#FFD8C2',
  terracotta: '#C68465',
  honey: '#F3C978',
  gold: '#F3C978',
  goldInk: '#795A20',
  goldWash: '#FFF0D3',
  coral: '#A95549',
  roseWash: '#FFF0E9',
  line: '#DCE6EE',
  shadow: '#293B50',
  scrim: 'rgba(41, 59, 80, 0.54)',
  link: '#416496',
  success: '#D4EEE6',
  // Compatibility names keep existing callers on the centralized winter palette.
  forest: '#416496',
  sage: '#A8D8F0',
  teal: '#739CE8',
  tealDark: '#416496',
  tealWash: '#EDF4FA',
};

export const todayColors = {
  ink: colors.ink,
  primary: colors.primary,
  onPrimary: colors.onPrimary,
  muted: colors.muted,
  progress: colors.iceBlue,
  paper: colors.paper,
  line: colors.line,
  wash: colors.ice,
  snow: colors.ivory,
  link: colors.link,
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radii = { control: 14, card: 22, scene: 24, pill: 999 };
export const metrics = { hit: 44, button: 48, header: 60, nav: 64, icon: 22, appWidth: 430 };
/** Shared Reanimated timing and spring values for the native winter UI. */
export const motion = {
  quick: 140,
  standard: 240,
  entrance: 340,
  progress: 420,
  easing: [0.22, 1, 0.36, 1] as const,
  spring: { damping: 18, stiffness: 260, mass: 0.7 },
};
export const type = StyleSheet.create({
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.8 },
  compactDisplay: { fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.6 },
  heading: { fontSize: 21, lineHeight: 27, fontWeight: '800', letterSpacing: -0.4 },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  eyebrow: { fontSize: 10, lineHeight: 15, fontWeight: '800', letterSpacing: 1.2 },
});

export const ui = StyleSheet.create({
  card: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.card, padding: space.lg,
  },
  control: {
    borderRadius: radii.control, minHeight: metrics.hit, minWidth: metrics.hit,
    paddingHorizontal: space.md, alignItems: 'center', justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary },
  secondary: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  selected: { backgroundColor: colors.ice, borderColor: colors.primary },
  field: {
    minHeight: metrics.hit, borderRadius: radii.control, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.snow, paddingHorizontal: space.md, color: colors.ink, ...type.body,
  },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.55 },
  dialog: {
    width: '100%', maxWidth: metrics.appWidth, maxHeight: '100%', overflow: 'hidden',
    borderRadius: radii.scene, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper,
  },
  shade: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.lg, backgroundColor: colors.scrim },
});
