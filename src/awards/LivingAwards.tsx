import { useFurniture } from '../furniture/Furniture';
import { pixelBox } from '../furniture/catalog';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePipReactions } from '../character/reactions/PipReactionsProvider';
import { StudyRoomPerformance } from '../components/StudyRoomPerformance';
import { useHomeMotionState } from '../home/useHomeMotion';
import { usePomodoro } from '../state/PomodoroContext';
import { AWARDS, findAward, milestoneText, studyMilestones, type AwardAction, type AwardId, type AwardState } from './progression';
import { CABINET, GIFT_DURATION_MS, GIFT_REVEAL_MS, giftMotion, shelfPosition, trophyMotion } from './motion';

const cabinetArt = require('../../assets/environments/igloo/awards/cabinet.png');
export const awardSprites: Record<AwardId, number> = {
  'first-steps': require('../../assets/environments/igloo/awards/first-steps.png'),
  'focus-explorer': require('../../assets/environments/igloo/awards/focus-explorer.png'),
  'dedicated-learner': require('../../assets/environments/igloo/awards/dedicated-learner.png'),
  'winter-scholar': require('../../assets/environments/igloo/awards/winter-scholar.png'),
  'focus-master': require('../../assets/environments/igloo/awards/focus-master.png'),
  'igloo-legend': require('../../assets/environments/igloo/awards/igloo-legend.png'),
  'consistency-star': require('../../assets/environments/igloo/awards/consistency-star.png'),
  'deep-focus': require('../../assets/environments/igloo/awards/deep-focus.png'),
};

export function LivingAwards({ visible, settled, menuOnly = false }: { visible: boolean; settled: boolean; menuOnly?: boolean }) {
  const { timer, hydrated, arrangeAward } = usePomodoro();
  const { cue, requestRestReaction } = usePipReactions();
  const { active, motion, reduced } = useHomeMotionState(visible);
  const [open, setOpen] = useState(false);
  const [presentation, setPresentation] = useState<AwardId | null>(null);
  const [revealed, setRevealed] = useState(false);
  const { awards } = timer;
  const pending = awards.pending[0];
  const allowed = !menuOnly && hydrated && active && settled && timer.status !== 'paused' && !(timer.mode === 'focus' && timer.status === 'running');
  const displayed = useMemo(() => awards.order.filter(id => !awards.hidden.includes(id)), [awards.hidden, awards.order]);
  const inspecting = open && visible;
  const performing = allowed && !inspecting && presentation === pending;
  const showing = performing ? presentation : null;

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  useEffect(() => {
    if (!allowed || inspecting || !pending) {
      setPresentation(null);
      setRevealed(false);
      return;
    }
    if (cue || presentation === pending) return;
    const delay = setTimeout(() => {
      setRevealed(reduced);
      if (!reduced) requestRestReaction('look');
      setPresentation(pending);
    }, 500);
    return () => clearTimeout(delay);
  }, [allowed, cue, inspecting, pending, presentation, reduced, requestRestReaction]);

  useEffect(() => {
    if (!allowed || !motion || !displayed.length || inspecting || pending || cue) return;
    const glance = setTimeout(() => requestRestReaction('look'), 32_000 + Math.random() * 38_000);
    return () => clearTimeout(glance);
  }, [allowed, cue, displayed.length, inspecting, motion, pending, requestRestReaction]);

  const reveal = useCallback(() => {
    setRevealed(true);
    if (motion) requestRestReaction('celebrate');
  }, [motion, requestRestReaction]);

  const finish = useCallback(() => {
    if (!showing) return;
    setPresentation(null);
    setRevealed(false);
    arrangeAward(showing, 'presented');
  }, [arrangeAward, showing]);

  const openCabinet = useFurniture('awards', () => { setPresentation(null); setRevealed(false); setOpen(true); }, {
    disabled: !hydrated || !visible, state: open ? 'Open' : 'Closed', bounds: menuOnly ? undefined : pixelBox(CABINET),
  });
  return <>
    {!menuOnly && <Pressable accessibilityRole="button" accessibilityLabel="Living Awards cabinet"
      accessibilityHint="Inspect your study trophies" testID="living-awards-cabinet" disabled={!hydrated}
      onPress={openCabinet} style={styles.cabinetInRoom}>
      <CabinetItems ids={displayed} state={awards} />
      {pending && !showing && <View pointerEvents="none" style={styles.readyLight} />}
    </Pressable>}
    {showing && <AwardGift key={showing} id={showing} slot={displayed.indexOf(showing)}
      motion={motion} reduced={reduced} onReveal={reveal} onFinish={finish} />}
    {showing && (revealed || reduced) && <View pointerEvents="none" style={styles.announcement}>
      <Text style={styles.announcementText} accessibilityLiveRegion="polite">{findAward(showing).name} earned</Text>
    </View>}
    {inspecting && <AwardCollection state={awards} sessions={timer.sessions} motion={motion}
      onArrange={arrangeAward} onClose={() => setOpen(false)} />}
  </>;
}

function AwardGift({ id, slot, motion, reduced, onReveal, onFinish }: {
  id: AwardId; slot: number; motion: boolean; reduced: boolean; onReveal: () => void; onFinish: () => void;
}) {
  const source = useMemo(() => giftMotion(id, slot), [id, slot]);
  const [started, setStarted] = useState(false);
  const markStarted = useCallback(() => setStarted(true), []);
  useEffect(() => {
    if (reduced) {
      const timer = setTimeout(onFinish, GIFT_DURATION_MS * .45);
      return () => clearTimeout(timer);
    }
    if (!motion || !started) return;
    const timer = setTimeout(onReveal, GIFT_REVEAL_MS);
    return () => clearTimeout(timer);
  }, [motion, onFinish, onReveal, reduced, started]);
  if (reduced) return <View pointerEvents="none" style={styles.stillGift}>
    <Image source={awardSprites[id]} style={styles.fill} resizeMode="contain" />
  </View>;
  return <StudyRoomPerformance source={source} motion={motion} onLoaded={markStarted}
    onFinish={onFinish} style={styles.gift} testID={`award-gift-${id}`} />;
}

function CabinetItems({ ids, state, selected, onChoose }: {
  ids: readonly AwardId[]; state: AwardState; selected?: AwardId; onChoose?: (id: AwardId) => void;
}) {
  return <>
    <Image accessible={false} source={cabinetArt} style={styles.fill} resizeMode="stretch" />
    {ids.map((id, index) => {
      if (!onChoose && state.pending.includes(id)) return null;
      const unlocked = state.unlocked[id] !== undefined;
      const [x,y] = shelfPosition(index);
      const placement = { left: `${(x - .083) * 100}%` as const, top: `${(y - .25) * 100}%` as const };
      const sprite = <Image source={awardSprites[id]} style={[styles.fill, !unlocked && styles.silhouette]} resizeMode="contain" />;
      return onChoose
        ? <Pressable accessibilityRole="button" accessibilityLabel={`${findAward(id).name}, ${unlocked ? 'unlocked' : 'locked'}`}
            accessibilityState={{ selected: selected === id }} key={id} onPress={() => onChoose(id)}
            style={[styles.shelfItem, placement, selected === id && styles.selected]}>
            {sprite}
            {state.hidden.includes(id) && <View style={styles.hiddenDot} />}
          </Pressable>
        : <View pointerEvents="none" style={[styles.shelfItem, placement]} key={id}>{sprite}</View>;
    })}
  </>;
}

type Sessions = ReturnType<typeof usePomodoro>['timer']['sessions'];

function AwardCollection({ state, sessions, motion, onArrange, onClose }: {
  state: AwardState; sessions: Sessions; motion: boolean; onArrange: (id: AwardId, action: AwardAction) => void; onClose: () => void;
}) {
  const { progress } = useMemo(() => studyMilestones(sessions), [sessions]);
  const locked = useMemo(() => AWARDS.filter(award => state.unlocked[award.id] === undefined), [state.unlocked]);
  const next = [...locked].sort((a, b) => progress[b.metric]/b.target - progress[a.metric]/a.target)[0];
  const [selected, setSelected] = useState<AwardId>(next?.id ?? state.order[0] ?? AWARDS[0].id);
  const award = findAward(selected);
  const date = state.unlocked[selected];
  const unlocked = date !== undefined;
  const source = useMemo(() => unlocked && motion ? trophyMotion(selected) : null, [motion, selected, unlocked]);
  const displayed = state.order.filter(id => !state.hidden.includes(id));
  const hidden = state.hidden.includes(selected);
  const index = displayed.indexOf(selected);
  const ids = [...state.order, ...locked.map(item => item.id)];
  const action = (label: string, command: AwardAction, disabled = false) =>
    <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={() => onArrange(selected, command)}
      style={[styles.action, disabled && styles.disabled]}><Text style={styles.actionText}>{label}</Text></Pressable>;

  return <Modal transparent animationType={motion ? 'fade' : 'none'} onRequestClose={onClose} visible>
    <View style={styles.modal}>
      <Pressable accessible={false} onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={styles.collection} accessibilityViewIsModal>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View><Text style={styles.eyebrow}>{state.order.length} of {AWARDS.length} earned</Text>
              <Text accessibilityRole="header" style={styles.title}>Living Awards</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close Living Awards" onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <View style={styles.cabinetClose}>
            <CabinetItems ids={ids} state={state} selected={selected} onChoose={setSelected} />
          </View>
          <View style={styles.detail}>
            <View style={styles.portrait}>
              {source
                ? <StudyRoomPerformance key={selected} source={source} motion loop testID={`trophy-motion-${selected}`} />
                : <Image source={awardSprites[selected]} style={[styles.stillPortrait, !unlocked && styles.silhouette]} resizeMode="contain" />}
            </View>
            <View style={styles.notes} accessibilityLiveRegion="polite">
              <Text style={styles.eyebrow}>{unlocked ? award.trophy : 'Locked'}</Text>
              <Text style={styles.awardName}>{award.name}</Text>
              <Text style={styles.body}>{award.description}</Text>
              <Text style={styles.progress}>{milestoneText(award, progress, unlocked)}</Text>
              {unlocked && <Text style={styles.body}>Earned {new Date(date).toLocaleDateString(undefined, {
                day: 'numeric', month: 'short', year: 'numeric',
              })}</Text>}
            </View>
          </View>
          {unlocked && <View style={styles.actions}>
            {action(hidden ? 'Show in room' : 'Hide from room', hidden ? 'show' : 'hide')}
            {!hidden && action('Move earlier', 'earlier', index <= 0)}
            {!hidden && action('Move later', 'later', index === displayed.length - 1)}
          </View>}
          {next && next.id !== selected && <Pressable accessibilityRole="button" onPress={() => setSelected(next.id)} style={styles.next}>
            <Text style={styles.eyebrow}>Closest to unlocking</Text>
            <Text style={styles.body}>{next.name} · {milestoneText(next, progress)}</Text>
          </Pressable>}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  cabinetInRoom: {
    position: 'absolute', left: `${CABINET.x / 10.24}%`, top: `${CABINET.y / 15.36}%`,
    width: `${CABINET.width / 10.24}%`, height: `${CABINET.height / 15.36}%`, minHeight: 44, zIndex: 2,
  },
  readyLight: { position: 'absolute', top: '19%', right: '16%', width: 5, height: 5, borderRadius: 4, backgroundColor: '#fff0b1' },
  cabinetClose: { width: '100%', aspectRatio: 1.7 },
  shelfItem: { position: 'absolute', width: '16.6%', height: '25%', justifyContent: 'center' },
  silhouette: { tintColor: '#432617', opacity: 0.66 },
  selected: { borderRadius: 12, backgroundColor: '#ffdc9066', borderWidth: 1, borderColor: '#fff3c4' },
  hiddenDot: { position: 'absolute', top: 3, right: 4, width: 6, height: 6, borderRadius: 6, backgroundColor: '#ebc4b2', borderWidth: 1, borderColor: '#674237' },
  gift: { zIndex: 5 },
  stillGift: { position: 'absolute', left: '22%', top: '45%', width: '16%', height: '16%', zIndex: 5 },
  announcement: { position: 'absolute', top: '32%', left: '10%', right: '10%', zIndex: 6, alignItems: 'center' },
  announcementText: { color: '#4f3026', fontSize: 13, fontWeight: '800', backgroundColor: '#fff1d2', borderRadius: 14, paddingVertical: 7, paddingHorizontal: 10, overflow: 'hidden' },
  modal: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#29334a88' },
  collection: { width: '100%', maxWidth: 450, maxHeight: '88%', borderRadius: 24, backgroundColor: '#fff3dd', borderWidth: 2, borderColor: '#bd8e62', overflow: 'hidden' },
  content: { padding: 15, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 3 },
  eyebrow: { color: '#865231', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { color: '#4d2f28', fontSize: 26, fontWeight: '900' },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1debc', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#744629', fontSize: 25 },
  detail: { flexDirection: 'row', alignItems: 'center', columnGap: 10 },
  portrait: { width: 91, height: 91, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  stillPortrait: { width: 70, height: 70 },
  notes: { flex: 1, gap: 3 },
  awardName: { color: '#54342a', fontSize: 19, fontWeight: '900' },
  body: { color: '#674e42', fontSize: 12, lineHeight: 17 },
  progress: { color: '#81501f', fontSize: 12, fontWeight: '800' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, backgroundColor: '#f2dec0', borderRadius: 20 },
  actionText: { color: '#62402e', fontSize: 12, fontWeight: '800' },
  disabled: { opacity: 0.44 },
  next: { borderTopWidth: 1, borderColor: '#d9bc9c', paddingTop: 10, minHeight: 44, gap: 2 },
});
