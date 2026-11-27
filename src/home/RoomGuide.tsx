import { Button, Chevron, IconButton } from '../ui/Controls';
import { colors, space, type, ui } from '../theme';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useFurnitureController } from '../furniture/Furniture';
import { boxStyle, FURNITURE, type Bounds, type FurnitureId } from '../furniture/catalog';
import { usePipReactions } from '../character/reactions/PipReactionsProvider';

type Target = FurnitureId | 'decorate' | 'light';
type Step = { target: Target; line: string };
const chapters: { title: string; steps: Step[] }[] = [
  { title: 'Get comfortable', steps: [
    { target: 'desk', line: 'Tap the study desk to open the timer. Choose a length and press Start focus when you’re ready.' },
    { target: 'window', line: 'Want a different view? Tap the window and pick your scenery!' },
    { target: 'wardrobe', line: 'You can dress me up! I love cozy outfits!' },
  ] },
  { title: 'Explore your home', steps: [
    { target: 'coffee', line: 'Need a little break? Let’s make something warm at the coffee machine in Study Together!' },
    { target: 'pets', line: 'Our little friends live here! Tap to say hello!' },
    { target: 'garden', line: 'Every time you study, our magical garden grows!' },
    { target: 'radio', line: 'Rain sounds? White noise? Pick your favorite study atmosphere!' },
    { target: 'light', line: 'Tap the lights to make our home extra cozy!' },
  ] },
  { title: 'Make it yours', steps: [
    { target: 'awards', line: 'Look! We can keep our achievements here!' },
    { target: 'mailbox', line: 'Sometimes I’ll leave you little letters!' },
    { target: 'decorate', line: 'You can decorate our home however you like!' },
    { target: 'gifts', line: 'Finished focus sessions count toward milestones. When you earn a gift, it’ll be waiting here!' },
  ] },
];
type Progress = {
  invited: boolean; skipped: boolean; completed: number[]; discovered: string[];
  dismissed: string[]; active: { chapter: number; step: number } | null; paused?: boolean;
};
const initial: Progress = { invited: false, skipped: false, completed: [], discovered: [], dismissed: [], active: null };
const storageKey = 'igloo.room-guide.v1';
let latest: Progress | undefined;
let writes = Promise.resolve();

export function useRoomGuide({ ready, snowyIgloo, focusing, sessions, tip, directory, openFurniture }: {
  ready: boolean; snowyIgloo: boolean; focusing: boolean; sessions: number;
  tip?: { id: string; line: string }[]; directory: React.ReactNode; openFurniture?: () => void;
}) {
  const furniture = useFurnitureController();
  const { requestRestReaction } = usePipReactions();
  const [progress, setProgress] = useState<Progress | null>(latest ?? null);
  const [help, setHelp] = useState(false);
  const [showObjects, setShowObjects] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [finished, setFinished] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (latest) return;
    let mounted = true;
    void AsyncStorage.getItem(storageKey).then(raw => {
      if (!mounted) return;
      if (!latest) {
        try { latest = raw ? { ...initial, ...JSON.parse(raw) } : initial; }
        catch { latest = initial; }
      }
      setProgress(latest!);
    }).catch(() => { if (mounted) setProgress(latest ?? initial); });
    return () => { mounted = false; };
  }, []);

  function update(change: (state: Progress) => Progress) {
    const next = change(latest ?? initial);
    latest = next;
    setProgress(next);
    const snapshot = JSON.stringify(next);
    writes = writes.then(() => AsyncStorage.setItem(storageKey, snapshot)).catch(() => undefined);
  }

  const active = progress?.active;
  const step = active && !progress?.paused ? chapters[active.chapter]?.steps[active.step] : undefined;
  const canHighlight = ready && !focusing && !help;
  const available = ready && snowyIgloo && !!progress && !focusing;
  const following = available && !help && !!step;
  const entries = furniture?.entries ?? [];
  const find = (target: Target) => entries.find(entry => !entry.disabled &&
    (target === 'light' ? entry.id === 'lamp' || entry.id === 'lantern' : entry.id === target));
  const targetEntry = step && find(step.target);
  const show = canHighlight && showObjects;
  const hint = available && !help && !progress?.invited && !progress?.discovered.includes('desk') && !step ? find('desk') : undefined;
  const highlighted = following ? targetEntry : hint;
  const highlights = show && snowyIgloo
    ? entries.flatMap(entry => !entry.disabled && entry.bounds ? [{ bounds: entry.bounds }] : [])
    : highlighted?.bounds ? [{ bounds: highlighted.bounds, label: FURNITURE[highlighted.id].label }] : [];

  const onActivation = useRef<(id: FurnitureId | 'decorate') => void>(() => undefined);
  onActivation.current = id => {
    const current = latest;
    if (!current || !ready || !snowyIgloo) return;
    const isTarget = step && (step.target === id || (step.target === 'light' && (id === 'lamp' || id === 'lantern')));
    if (current.discovered.includes(id) && (!isTarget || !available)) return;
    update(state => {
      const discovered = state.discovered.includes(id) ? state.discovered : [...state.discovered, id];
      if (!isTarget || !available || !active) return { ...state, discovered };
      const complete = active.step + 1 >= chapters[active.chapter].steps.length;
      return { ...state, discovered,
        active: complete ? null : { ...active, step: active.step + 1 },
        completed: complete ? [...new Set([...state.completed, active.chapter])] : state.completed };
    });
    if (isTarget && available && active) {
      const complete = active.step + 1 >= chapters[active.chapter].steps.length;
      if (complete) setFinished(true);
      if (targetEntry?.bounds && id !== 'desk' && id !== 'window') requestRestReaction(complete ? 'celebrate' : 'smile');
    }
  };
  useLayoutEffect(() => furniture?.observeActivation(id => onActivation.current(id)), [furniture?.observeActivation]);

  const inviting = available && !progress?.invited;
  useEffect(() => {
    if (inviting) requestRestReaction('wave');
  }, [inviting, requestRestReaction]);
  useEffect(() => {
    if (!showObjects) return;
    if (!ready || focusing) {
      setShowObjects(false);
      return;
    }
    const timeout = setTimeout(() => setShowObjects(false), 4500);
    return () => clearTimeout(timeout);
  }, [showObjects, ready, focusing, snowyIgloo]);

  const offer = progress?.invited && !progress.skipped && !active
    ? [1, 2].find(chapter => sessions >= chapter && !progress.completed.includes(chapter) &&
        !progress.dismissed.includes('chapter-' + chapter)) : undefined;
  const start = (chapter: number) => {
    setFinished(false);
    setHelp(false);
    setShowObjects(false);
    update(state => ({ ...state, invited: true, paused: false, active: { chapter, step: 0 } }));
    requestRestReaction('look');
  };
  const dismiss = (id: string) => update(state => ({ ...state, dismissed: [...state.dismissed, id] }));
  const action = (label: string, press: () => void, primary = false) =>
    <Button key={label} label={label} onPress={press} variant={primary ? 'primary' : 'secondary'} />;
  const showTip = available && !active && !inviting && offer === undefined
    ? tip?.find(item => !progress?.dismissed.includes(item.id)) : undefined;
  const line = available && (inviting ? 'Welcome home! 🐧 Want me to show you around?'
    : step?.line ?? (finished ? 'That’s our tour for now! See you around the Igloo.'
    : offer !== undefined ? 'Want to see a little more of our Igloo?' : showTip?.line ?? ''));
  const panel = <>
    {help && <View style={styles.bubble}>
      <View style={styles.helpHeading}><Text style={styles.helpTitle}>Igloo help</Text><IconButton label="Close Igloo help" onPress={() => setHelp(false)}><Chevron direction="close" /></IconButton></View>
      {available && <>
        {action('Continue room tour', () => {
          if (active) {
            update(state => ({ ...state, paused: false }));
            setHelp(false);
          } else start(offer ?? Math.max(0, chapters.findIndex((_, i) => !progress!.completed.includes(i) && i <= sessions)));
        })}
        {action('Replay tutorial', () => setExplanation('chapters'))}
      </>}
      {ready && !focusing && action('Show interactive objects', () => { setShowObjects(true); setHelp(false); })}
      {action('How studying works', () => setExplanation('Tap the desk, pick a duration and press Start focus. You can pause or resume from the timer.'))}
      {action('How rewards work', () => setExplanation('Completed focus sessions earn Snowflakes and count toward awards and gifts. Check the gift chest when a reward is ready.'))}
      {directory}
      {explanation === 'chapters' ? available && chapters.map((chapter, i) => action(chapter.title, () => start(i))) : !!explanation && <Text style={styles.line}>{explanation}</Text>}
    </View>}
    {!help && !!line && <View style={styles.bubble} accessibilityLiveRegion="polite">
      {step && active && <Text style={styles.step}>{chapters[active.chapter].title} · {active.step + 1} of {chapters[active.chapter].steps.length}</Text>}
      <Text style={styles.line}>{line}</Text>
      <View style={styles.actions}>
        {inviting && <>{action('Show me!', () => start(0), true)}{action('I’ll explore myself', () => update(state => ({ ...state, invited: true, skipped: true })))}</>}
        {step && <>
          {targetEntry && !targetEntry.bounds && action('Open ' + FURNITURE[targetEntry.id].label, targetEntry.activate, true)}
          {step.target === 'decorate' && openFurniture && action('Open furniture', () => {
            onActivation.current('decorate');
            openFurniture();
          }, true)}
          {action('Pause tour', () => update(state => ({ ...state, paused: true })))}
        </>}
        {!step && finished && action('Lovely!', () => setFinished(false))}
        {!step && !finished && offer !== undefined && <>{action(chapters[offer].title, () => start(offer))}{action('Later', () => dismiss('chapter-' + offer))}</>}
        {!finished && showTip && action('Got it', () => dismiss(showTip.id))}
      </View>
    </View>}
  </>;
  return { panel: help || line ? panel : null, highlights, following, target: following && !show ? targetEntry?.bounds : undefined,
    decorating: following && step?.target === 'decorate', wardrobe: following && step?.target === 'wardrobe',
    onDecorate: () => onActivation.current('decorate'), onWardrobe: () => onActivation.current('wardrobe'),
    toggleHelp: () => { setHelp(value => !value); setShowObjects(false); setExplanation(''); },
    helpOpen: help, showingObjects: show, reduced };
}

export function RoomGuideHighlights({ highlights, reduced, dim = false }: {
  highlights: { bounds: Bounds; label?: string; labelInside?: boolean }[]; reduced: boolean; dim?: boolean;
}) {
  if (!highlights.length) return null;
  const target = dim && highlights.length === 1 ? highlights[0].bounds : undefined;
  const shade = target ? [
    { x: 0, y: 0, width: 100, height: target.y },
    { x: 0, y: target.y, width: target.x, height: target.height },
    { x: target.x + target.width, y: target.y, width: 100 - target.x - target.width, height: target.height },
    { x: 0, y: target.y + target.height, width: 100, height: 100 - target.y - target.height },
  ] : [];
  return <View testID="room-guide-highlights" pointerEvents="none" aria-hidden importantForAccessibility="no-hide-descendants" style={styles.highlights}>
    {shade.map((box, i) => <View key={i} style={[styles.dim, boxStyle(box)]} />)}
    {highlights.map(({ bounds }, i) => <Animated.View key={i} entering={reduced ? undefined : FadeIn.duration(220)}
      style={[styles.glow, boxStyle(bounds)]} />)}
    {highlights.map(({ bounds, label, labelInside }) => label && <View key={label} style={[styles.markerAnchor, boxStyle(bounds)]}>
      <View style={[styles.marker, labelInside ? styles.markerInside : styles.markerAbove, bounds.x >= 75 && styles.markerRight]}>
        <Text numberOfLines={1} style={styles.markerText}>{label}</Text>
      </View>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  bubble: { ...ui.card, padding: space.md, gap: space.xs },
  helpHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  helpTitle: { ...type.title, color: colors.ink },
  line: { ...type.body, color: colors.ink },
  step: { ...type.caption, color: colors.goldInk },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs },
  highlights: { ...StyleSheet.absoluteFillObject, zIndex: 40 },
  dim: { position: 'absolute', backgroundColor: '#29223c30' },
  glow: { position: 'absolute', borderWidth: 2, borderRadius: 10, borderColor: colors.gold, backgroundColor: '#e9b96822' },
  markerAnchor: { position: 'absolute' },
  marker: { position: 'absolute', left: 0, borderRadius: 8, paddingHorizontal: space.sm, paddingVertical: 3, backgroundColor: colors.goldWash },
  markerAbove: { bottom: '100%' },
  markerInside: { bottom: 4, left: 4 },
  markerRight: { left: undefined, right: 0 },
  markerText: { ...type.caption, color: colors.ink },
});
