import { Chevron, IconButton, Segmented } from '../ui/Controls';
import { Overlay } from '../ui/Overlay';
import { colors, type, ui } from '../theme';
import { useCompanionName } from '../onboarding/ProfileProvider';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { AnimationObject } from 'lottie-react-native';
import { usePomodoro } from '../state/PomodoroContext';
import { useHomeMotionState } from '../home/useHomeMotion';
import { usePipReactions } from '../character/reactions/PipReactionsProvider';
import { StudyRoomPerformance } from '../components/StudyRoomPerformance';
import { useFurniture } from '../furniture/Furniture';
import { boxStyle, roomBox, type Bounds } from '../furniture/catalog';
import { IGLOO_FURNITURE } from '../study-together/iglooLayout';
import { gardenMotion } from '../garden/motion';
import { BODIES, GIFT_ART, LIDS, PLATFORM } from './art';
import { COLORS, eligiblePool, RARITIES, REWARDS, rewardById, type Rarity, type Reward } from './catalog';
import { GIFTS, nextReward, pendingGifts, type Claim, type GiftId } from './progression';

const animationData: AnimationObject[] = [
  require('../../assets/environments/igloo/gifts/open-0.json'),
  require('../../assets/environments/igloo/gifts/open-1.json'),
  require('../../assets/environments/igloo/gifts/open-2.json'),
  require('../../assets/environments/igloo/gifts/open-3.json'),
];
const coin = require('../../assets/environments/igloo/awards/focus-explorer.png');
function milestonePreview(hours: number) {
  return pendingGifts(Array.from({ length: hours }, (_, index) => {
    const startedAt = index * 3_600_000 + 1;
    const endedAt = startedAt + 3_600_000;
    return { id: `preview-${index}`, startedAt, endedAt, date: '2026-01-01', completed: true,
      focusMs: 3_600_000, spans: [{ start: startedAt, end: endedAt }], goalId: null, goalTitle: null, review: null };
  }), {});
}
const categories = ['All', 'Furniture', 'Accessories', 'Decorations', 'Special'] as const;
type Category = typeof categories[number];
type Reveal = { rarity: Rarity; claim: Claim; preview?: boolean };

function Box({ rarity }: { rarity: Rarity }) {
  const index = RARITIES.indexOf(rarity);
  return <View pointerEvents="none" style={styles.box}>
    <Image source={BODIES[index]} resizeMode="contain" style={styles.boxBody} />
    <Image source={LIDS[index]} resizeMode="contain" style={styles.boxLid} />
  </View>;
}

export function GiftDecorAnimation({ id, active }: { id: string; active: boolean }) {
  const reward = rewardById(id);
  const effect = id === 'gift-globe' ? 'snow' : 'sparkle';
  const source = useMemo(() => reward?.animated && active
    ? gardenMotion(effect, COLORS[RARITIES.indexOf(reward.rarity)]) as unknown as AnimationObject : null, [active, effect, reward]);
  return source ? <StudyRoomPerformance source={source} motion loop /> : null;
}

const belongsTo = (reward: Reward, home: ReturnType<typeof usePomodoro>['timer']['home']) =>
  reward.wardrobe ? home.wardrobe.owned.includes(reward.wardrobe) : home.owned.includes(reward.id);

export function MysteryGifts({ visible, shared = false, menuOnly = false, onPlaced, placement }: {
  visible: boolean; placement?: Bounds; shared?: boolean; menuOnly?: boolean; onPlaced?: () => void;
}) {
  const companion=useCompanionName();
  const { timer, hydrated, claimGift, savedGifts, storageError, retrySave, equipFurniture, equipWardrobeItem, arrangeHome } = usePomodoro();
  const { cue, requestRestReaction } = usePipReactions();
  const { active, reduced, motion } = useHomeMotionState(visible);
  const [open, setOpen] = useState(false);
  const [waiting, setWaiting] = useState<GiftId | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [playing, setPlaying] = useState(false);
  const [category, setCategory] = useState<Category>('All');
  const [tab, setTab] = useState<'gifts' | 'collection'>('gifts');
  const [testingHours, setTestingHours] = useState<number | null>(null);
  const devMilestones = useMemo(() => __DEV__ && testingHours !== null ? milestonePreview(testingHours) : [], [testingHours]);
  const [selected, setSelected] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [celebrate, setCelebrate] = useState<Rarity | null>(null);
  const noticed = useRef<GiftId | null>(null);
  const pending = useMemo(() => pendingGifts(timer.sessions, timer.home.gifts), [timer.sessions, timer.home.gifts]);
  const next = pending[0];
  const activeStudy = timer.mode === 'focus' && timer.status === 'running';
  const allowed = active && !activeStudy && timer.status !== 'paused';
  const bounds = placement ?? (shared ? IGLOO_FURNITURE.gifts : roomBox(49, 83, 16, 11));
  const opening = useMemo(() => reveal ? JSON.parse(JSON.stringify(animationData[RARITIES.indexOf(reveal.rarity)])) as AnimationObject : null, [reveal]);
  const show = useFurniture('gifts', () => {
    setTab(next || waiting ? 'gifts' : 'collection');
    setSelected(null);
    setAnnouncement('');
    setOpen(true);
  }, { bounds: menuOnly ? undefined : bounds, disabled: !hydrated || !visible, state: pending.length ? `${pending.length} waiting` : 'No gifts waiting' });

  useEffect(() => {
    if (!next || !allowed || reduced || open || cue || timer.mode === 'focus' || noticed.current === next.id) return;
    const delay = setTimeout(() => { noticed.current = next.id; requestRestReaction('look'); }, 3600);
    return () => clearTimeout(delay);
  }, [allowed, cue, next, open, reduced, requestRestReaction, timer.mode]);

  const finish = useCallback(() => {
    if (!reveal) return;
    setPlaying(false);
    if (!reveal.preview) setCelebrate(reveal.rarity);
  }, [reveal]);

  useEffect(() => {
    if (!waiting || !savedGifts[waiting]) return;
    const gift = GIFTS.find(entry => entry.id === waiting)!;
    const claim = savedGifts[waiting]!;
    setWaiting(null);
    if (!open) return;
    setReveal({ rarity: gift.rarity, claim });
    setPlaying(motion);
    if (allowed && motion) requestRestReaction('look');
    if (!reduced && allowed && !motion) setCelebrate(gift.rarity);
  }, [allowed, motion, open, reduced, requestRestReaction, savedGifts, waiting]);

  useEffect(() => {
    if (!allowed || cue || !celebrate || reduced) return;
    requestRestReaction('celebrate');
    setCelebrate(null);
  }, [allowed, celebrate, cue, reduced, requestRestReaction]);

  useEffect(() => {
    if (playing && reduced) finish();
  }, [finish, playing, reduced]);

  const close = () => { setOpen(false); setReveal(null); setPlaying(false); setWaiting(null); };
  const openNext = () => {
    if (!next || waiting || !hydrated || activeStudy) return;
    setWaiting(next.id);
    claimGift(next.id);
  };
  const equip = (reward: Reward) => {
    if (!belongsTo(reward, timer.home)) return;
    if (reward.wardrobe) {
      equipWardrobeItem(reward.wardrobe);
      setAnnouncement(`${companion} is wearing ${reward.name.toLowerCase()}.`);
    } else {
      equipFurniture(reward.id);
      if (timer.home.originalRoom) arrangeHome('fallback');
      setAnnouncement(`${reward.name} is placed in My Igloo.`);
      if (shared && onPlaced) { close(); onPlaced(); }
    }
  };
  const reward = reveal?.claim && 'rewardId' in reveal.claim ? rewardById(reveal.claim.rewardId) : undefined;
  const details = selected ? rewardById(selected) : undefined;
  const showing = reveal ? reward : details;
  const owned = showing && belongsTo(showing, timer.home);
  const alreadyPlaced = showing?.slot && timer.home.equipped[showing.slot] === showing.id;
  const alreadyEquipped = showing?.wardrobe ? Object.values(timer.home.wardrobe.equipped).includes(showing.wardrobe) : false;
  const action = showing?.wardrobe ? 'Equip' : 'Place in My Igloo';

  return <>
    {!menuOnly && <Pressable accessibilityRole="button" accessibilityLabel={next ? `Mystery Gifts, ${pending.length} waiting` : 'Mystery Gifts'}
      disabled={!hydrated || !visible} onPress={() => { show(); if (!activeStudy) openNext(); }} style={[styles.trigger, shared && styles.sharedTrigger, boxStyle(bounds)]}>
      <Image accessible={false} source={PLATFORM} style={styles.platform} resizeMode="contain" />
      {next && <>
        <View pointerEvents="none" style={[styles.waitingGlow, { backgroundColor: COLORS[RARITIES.indexOf(next.rarity)] }]} />
        <View pointerEvents="none" style={styles.miniBox}><Box rarity={next.rarity} /></View>
        <View pointerEvents="none" style={styles.badge}><Text style={styles.badgeText}>{pending.length}</Text></View>
      </>}
    </Pressable>}
    {open && <Overlay transparent visible animationType={reduced ? 'none' : 'fade'} onRequestClose={close}>
      <View style={styles.shade}>
        <Pressable accessible={false} onPress={close} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={styles.panel}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>Mystery Gifts</Text>
            <IconButton label="Close Mystery Gifts" onPress={close}><Chevron direction="close" /></IconButton>
          </View>
          {!reveal && <View style={styles.tabs}>
            <Segmented label="Gift collection" value={tab} onChange={nextTab => { setTab(nextTab); setSelected(null); }}
              options={[{ id: 'gifts', label: pending.length ? `Gifts (${pending.length})` : 'Gifts' }, { id: 'collection', label: 'Collection' }]} />
          </View>}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {reveal ? <>
              <View style={styles.stage}>
                {!playing && <>
                  <View style={styles.displayGlow} />
                  <Image accessible={false} source={BODIES[RARITIES.indexOf(reveal.rarity)]} resizeMode="contain" style={styles.openChest} />
                </>}
                {playing && opening
                  ? <StudyRoomPerformance source={opening} motion={motion} onFinish={finish} testID="mystery-gift-opening" />
                  : <Animated.View entering={reduced ? undefined : FadeInUp.duration(440)} style={styles.heroArt}>
                    <Image accessible={false} source={reward ? GIFT_ART[reward.art] : coin} style={styles.fill} resizeMode="contain" />
                    {reward && <GiftDecorAnimation id={reward.id} active={motion} />}
                  </Animated.View>}
              </View>
              {playing
                ? <Button label="Skip reveal" onPress={finish} />
                : <>
                  <Text style={styles.kicker}>{reveal.preview ? 'Preview · ' : ''}{reveal.rarity}</Text>
                  <Text accessibilityLiveRegion="polite" style={styles.rewardTitle}>{reward?.name ?? ('snowflakes' in reveal.claim ? `${reveal.claim.snowflakes} Snowflakes` : '')}</Text>
                  {!reveal.preview && reward && <Button label={alreadyPlaced ? 'Placed' : alreadyEquipped ? 'Equipped' : action} disabled={!owned || alreadyPlaced === true || alreadyEquipped} onPress={() => equip(reward)} primary />}
                  <Button label={pending.length ? 'See next gift' : 'See collection'} onPress={() => { setReveal(null); setTab(pending.length ? 'gifts' : 'collection'); }} />
                </>}
            </> : tab === 'gifts' ? <>
              <View style={styles.stage}>
                <Image accessible={false} source={PLATFORM} resizeMode="contain" style={styles.heroPlatform} />
                {next && <View style={styles.heroBox}><Box rarity={next.rarity} /></View>}
              </View>
              {next && !waiting && <><Text style={styles.kicker}>{next.rarity} gift</Text><Text style={styles.rewardTitle}>{next.label}</Text></>}
              {!next && !waiting && <Text style={styles.copy}>Your next gift will arrive when you reach a study milestone.</Text>}
              {waiting ? <>
                <Text accessibilityLiveRegion="polite" style={styles.copy}>{storageError ? 'The gift couldn’t be saved. Retry to continue.' : 'Saving your gift…'}</Text>
                {storageError && <Button label="Retry saving gift" onPress={retrySave} primary />}
              </> : next && <Button label={activeStudy ? "Open after focus" : "Open gift"} disabled={activeStudy} onPress={openNext} primary />}
              <Text style={styles.rule}>Gifts are free. Each tier always awards the first unowned item in its fixed order. Once you own the whole tier, it awards Snowflakes.</Text>
              <View style={styles.milestones}>{GIFTS.map(gift => <View key={gift.id} style={styles.milestone}>
                <Text style={styles.copy}>{gift.label}</Text><Text style={styles.kicker}>{timer.home.gifts[gift.id] ? 'Opened' : pending.some(item => item.id === gift.id) ? 'Ready' : gift.rarity}</Text>
              </View>)}</View>
              {__DEV__ && <View style={styles.debug}>
                <Text style={styles.copy}>Gift previews don’t change your saved rewards.</Text>
                {RARITIES.map(rarity => <Button key={rarity} label={`Preview ${rarity} gift`} onPress={() => {
                  const gift = GIFTS.find(entry => entry.rarity === rarity)!;
                  setReveal({ rarity, claim: nextReward(gift, [], []), preview: true }); setPlaying(motion);
                }} />)}
                <Text style={styles.rule}>Previews assume an empty collection.</Text>
                <View style={styles.filters}>{[0, 1, 3, 5, 10, 25, 50, 100].map(hours => <Button key={hours}
                  label={`Simulate ${hours}h`} selected={testingHours === hours} onPress={() => setTestingHours(hours)} />)}</View>
                {testingHours !== null && <Text style={styles.rule}>{devMilestones.length} preview milestones ready.
                  {devMilestones.map(gift => ` ${gift.label}.`).join('')}</Text>}
                <Button label="Inspect collection" onPress={() => setTab('collection')} />
              </View>}
            </> : <>
              <View style={styles.filters}>{categories.map(item => <Button key={item} label={item} selected={category === item}
                onPress={() => {setCategory(item);setSelected(null);}} />)}</View>
              {details && <View style={styles.detail}>
                <View style={styles.detailArt}><Image accessible={false} source={GIFT_ART[details.art]} resizeMode="contain" style={styles.fill} />
                  {owned && <GiftDecorAnimation id={details.id} active={motion} />}
                </View>
                <Text style={styles.kicker}>{details.rarity} · {owned ? 'Owned' : 'Locked'}</Text>
                <Text style={styles.rewardTitle}>{details.name}</Text>
                {owned ? <Button label={alreadyPlaced ? 'Placed' : alreadyEquipped ? 'Equipped' : action} disabled={alreadyPlaced === true || alreadyEquipped} onPress={() => equip(details)} primary />
                  : <Text style={styles.rule}>Eligible for {details.rarity.toLowerCase()} gifts. Pool position {eligiblePool(details.rarity).findIndex(item => item.id === details.id) + 1}.</Text>}
              </View>}
              <View style={styles.grid}>{REWARDS.filter(item => category === 'All' || item.category === category).map(item => {
                const unlocked = belongsTo(item, timer.home);
                return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.name}, ${unlocked ? 'owned' : 'locked'}`}
                  accessibilityState={{ selected: selected === item.id }} onPress={() => setSelected(item.id)} style={[styles.tile, selected === item.id && styles.selected]}>
                  <Image accessible={false} source={GIFT_ART[item.art]} resizeMode="contain" style={[styles.tileArt, !unlocked && styles.locked]} />
                  <Text style={styles.tileName}>{item.name}</Text>
                  <Text style={styles.tileRarity}>{item.rarity}{unlocked ? '' : ' · Locked'}</Text>
                </Pressable>;
              })}</View>
            </>}
            {!!announcement && <Text accessibilityLiveRegion="polite" style={styles.copy}>{announcement}</Text>}
          </ScrollView>
        </View>
      </View>
    </Overlay>}
  </>;
}

function Button({ label, onPress, primary, selected, disabled }: {
  label: string; onPress: () => void; primary?: boolean; selected?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, (primary || selected) && styles.primary, pressed && styles.pressed, disabled && styles.disabled]}>
    <Text style={[styles.buttonText, (primary || selected) && styles.primaryText]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  trigger: { position:'absolute', zIndex: 8, minWidth:44, minHeight:44 },
  sharedTrigger: { minWidth: 0, minHeight: 0 },
  platform: { position:'absolute', width:'100%', height:'80%', bottom:0 },
  miniBox: { position:'absolute', left:'14%', top:'6%', width:'60%', height:'66%' },
  box: { width:'100%', height:'100%' },
  boxBody: { position:'absolute', width:'100%', height:'76%', bottom:0 },
  boxLid: { position:'absolute', left:'-2%', width:'104%', height:'67%', top:'-10%' },
  waitingGlow: { position:'absolute', left:'15%', right:'15%', top:'20%', bottom:'17%', opacity:.22, borderRadius:30 },
  badge: { position:'absolute', top:0, right:0, borderRadius:12, minWidth:19, height:19, backgroundColor:'#8d473d', alignItems:'center', justifyContent:'center' },
  badgeText:{ color:'#fff1d5', fontSize:11, fontWeight:'800' },
  shade:{ ...ui.shade, backgroundColor: 'transparent' },
  panel:{ ...ui.dialog, height:660, maxHeight:'91%' },
  header:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingLeft:20, paddingRight:10, paddingTop:5 },
  title:{ ...type.heading, color: colors.ink },
  close:{ width:44, height:44, alignItems:'center', justifyContent:'center' },
  closeText:{ color:'#7f5140', fontSize:29 },
  tabs:{ paddingHorizontal:14, paddingVertical:7 },
  scroll:{ flex:1 }, content:{ padding:16, gap:10 },
  stage:{ position:'relative', height:250, borderRadius:19, overflow:'hidden', backgroundColor:colors.link, alignItems:'center', justifyContent:'center' },
  heroPlatform:{ position:'absolute', width:'76%', height:'90%', bottom:'-14%' },
  heroBox:{ position:'absolute', width:'48%', height:'57%', left:'21%', bottom:'29%' },
  heroArt:{ width:'61%', height:'60%', position:'absolute', top:'10%' }, openChest:{ position:'absolute', bottom:'4%', width:'37%', height:'36%', opacity:.9 }, fill:{ width:'100%', height:'100%' },
  displayGlow:{ position:'absolute', width:178, height:178, borderRadius:100, opacity:.27, backgroundColor:'#E9B968' },
  kicker:{ color:'#885147', fontSize:11, fontWeight:'800', letterSpacing:1, textTransform:'uppercase' },
  rewardTitle:{ ...type.heading, color: colors.ink },
  copy:{ color:'#553e45', fontSize:14, lineHeight:20 },
  rule:{ color:'#755a56', fontSize:12, lineHeight:17 },
  milestones:{ borderTopWidth:1, borderColor:'#ead2b7' },
  milestone:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:6, borderBottomWidth:1, borderColor:'#ead2b7', paddingVertical:8 },
  button:{ ...ui.control, ...ui.secondary },
  buttonText:{ ...type.label, color:colors.ink },
  primary:{ ...ui.primary }, primaryText:{ color:colors.primaryInk }, pressed:{ opacity:.75 }, disabled:{ opacity:.55 },
  filters:{ flexDirection:'row', flexWrap:'wrap', gap:6 },
  detail:{ gap:7, padding:12, borderRadius:14, backgroundColor:'#f3e1cc' },
  detailArt:{ width:'100%', height:135 }, grid:{ flexDirection:'row', flexWrap:'wrap', gap:6 },
  tile:{ width:'48%', borderWidth:1, borderColor:'#e7cbb0', borderRadius:12, backgroundColor:'#fae9d5', padding:7, gap:5 },
  selected:{ borderColor:colors.link, backgroundColor:'#f6dbca' },
  tileArt:{ width:'100%', height:78 }, locked:{ opacity:.42 },
  tileName:{ color:colors.ink, fontSize:13, fontWeight:'800' }, tileRarity:{ color:'#755856', fontSize:11 },
  debug:{ borderTopWidth:1, borderColor:'#e7cbb0', paddingTop:8, gap:6 },
});
