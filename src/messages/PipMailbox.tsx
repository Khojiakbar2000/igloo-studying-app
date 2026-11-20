import { useCompanionName, usePrimaryStudyTopic } from '../onboarding/ProfileProvider';
import { useFurniture } from '../furniture/Furniture';
import { roomBox } from '../furniture/catalog';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHomeMotionState } from '../home/useHomeMotion';
import { usePomodoro } from '../state/PomodoroContext';
import { usePipReactions } from '../character/reactions/PipReactionsProvider';
import { unreadLetters, type PipLetter } from './pipMessages';

const pipDoodle = require('../../assets/illustrations/today-goals/pip-face-cutout.png');
const mailboxArt = require('../../assets/environments/igloo/pip-mailbox.png');
const ONBOARDING_KEY = 'igloo.onboarding.v2';
const categoryName: Record<PipLetter['category'], string> = {
  welcome:'Welcome', encouragement:'A little cheer', achievement:'Celebration', daily:'Daily hello', weather:'Weather note',
  break:'Rest & breaks', funny:'Penguin thoughts', friendship:'Friendship', milestone:'Milestone', surprise:'Surprise',
};
const dateLabel = (time: number) => new Date(time).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });

export function PipMailbox({ visible, onOpenTimer, onOpenCoffeeMachine, menuOnly = false }: { menuOnly?: boolean; visible: boolean; onOpenTimer: () => void; onOpenCoffeeMachine: () => void }) {
  const companion=useCompanionName();
  const studyTopic=usePrimaryStudyTopic();
  const { timer, hydrated, syncPipMessages, updatePipLetter } = usePomodoro();
  const { requestRestReaction } = usePipReactions();
  const { active, reduced } = useHomeMotionState(visible);
  const [name, setName] = useState<string | null>(null);
  const [rainyScene, setRainyScene] = useState(false);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Favorites'>('All');
  const [revealed, setRevealed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const envelope = useRef(new Animated.Value(0)).current;
  const unfold = useRef(new Animated.Value(0)).current;
  const mailboxMotion = useRef(new Animated.Value(0)).current;
  const visited = useRef(false);
  const previousUnread = useRef(0);
  const petIds = timer.home.pets.adopted.join('|');
  const letters = useMemo(() => [...timer.home.mailbox.letters].sort((a,b) => b.createdAt-a.createdAt), [timer.home.mailbox.letters]);
  const unread = unreadLetters(timer.home.mailbox);
  const selected = letters.find(letter => letter.id === selectedId);
  const filteredLetters = letters.filter(letter =>
    filter === 'All' || (filter === 'Unread' ? letter.readAt === null : letter.favorite),
  );
  const studying = timer.mode === 'focus' && timer.status === 'running';

  useEffect(() => {
    let alive = true;
    void Promise.all([AsyncStorage.getItem(ONBOARDING_KEY), AsyncStorage.getItem('igloo.study-room.v1')]).then(([raw, room]) => {
      if (!alive) return;
      setRainyScene(room === 'cafe');
      try { const value = raw ? JSON.parse(raw) : null; setName(typeof value?.userName === 'string' ? value.userName.trim().slice(0,24) : ''); }
      catch { setName(''); }
    }).catch(() => { if (alive) setName(''); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!hydrated || name === null || visited.current) return;
    visited.current = true;
    syncPipMessages('visit', name, rainyScene, studyTopic);
  }, [hydrated, name, rainyScene, studyTopic, syncPipMessages]);

  useEffect(() => {
    if (!hydrated || name === null) return;
    syncPipMessages('activity', name, rainyScene, studyTopic);
  }, [hydrated, name, petIds, rainyScene, studyTopic, syncPipMessages, timer.awards, timer.discoveries, timer.home.snowfall, timer.sessions]);

  useEffect(() => {
    if (unread > previousUnread.current && active && !studying && timer.status !== 'paused') requestRestReaction('wave');
    previousUnread.current = unread;
  }, [active, requestRestReaction, studying, timer.status, unread]);

  useLayoutEffect(() => {
    if (!open || selectedId === null) return;
    envelope.setValue(0);
    unfold.setValue(reduced ? 1 : 0);
    if (reduced) {
      setRevealed(true);
      return;
    }
    const animation = Animated.sequence([
      Animated.timing(envelope, { toValue: 1, duration: 230, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(unfold, { toValue: 1, duration: 230, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => { if (finished) setRevealed(true); });
    return () => animation.stop();
  }, [envelope, open, reduced, selectedId, unfold]);

  useEffect(() => {
    if (open && active && revealed && selectedId !== null) updatePipLetter(selectedId, 'read');
  }, [active, open, revealed, selectedId, updatePipLetter]);

  const react = (reaction: 'smile' | 'celebrate') => {
    if (active && !studying && timer.status !== 'paused') requestRestReaction(reaction);
  };
  const read = (letter: PipLetter) => {
    setRevealed(false);
    setSelectedId(letter.id);
    react('smile');
  };
  const close = () => {
    setOpen(false);
    setSelectedId(null);
    setRevealed(false);
  };
  const answer = (letter: PipLetter, choice: 'yes' | 'later') => {
    updatePipLetter(letter.id, choice);
    react(choice === 'yes' ? 'celebrate' : 'smile');
    close();
    if (choice === 'yes' && letter.reply === 'study') onOpenTimer();
    if (choice === 'yes' && letter.reply === 'cocoa') onOpenCoffeeMachine();
  };
  const openMailbox = () => {
    const letter = letters.find(item => item.readAt === null) ?? letters[0];
    setFilter('All');
    setOpen(true);
    if (letter) read(letter);
    if (!reduced) Animated.sequence([
      Animated.timing(mailboxMotion, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(mailboxMotion, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const pressMailbox = useFurniture('mailbox', openMailbox, { disabled: !hydrated, state: unread ? `${unread} unread` : 'No unread letters',
    bounds: menuOnly ? undefined : roomBox(78, 20, 19, 16) });
  return <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
    {!menuOnly && <Animated.View style={[styles.mailbox, { transform:[{translateY:mailboxMotion.interpolate({inputRange:[0,1],outputRange:[0,-5]})},{rotate:mailboxMotion.interpolate({inputRange:[0,1],outputRange:['0deg','-2deg']})}] }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={unread ? `${companion}’s mailbox, ${unread} unread ${unread === 1 ? 'letter' : 'letters'}` : `${companion}’s mailbox, ${letters.length} ${letters.length === 1 ? 'letter' : 'letters'}`}
        accessibilityHint={`Open ${companion}’s handwritten letters`} disabled={!hydrated} onPress={pressMailbox} style={StyleSheet.absoluteFill}>
        <Image source={mailboxArt} resizeMode="contain" style={styles.mailboxArt} />
        {unread > 0 && <View pointerEvents="none" style={styles.newMailGlow}><View style={styles.newMailDot} /></View>}
        {unread > 0 && <View style={styles.count}><Text style={styles.countText}>{unread > 9 ? '9+' : unread}</Text></View>}
      </Pressable>
    </Animated.View>}
    {open && <Modal transparent visible onRequestClose={close} animationType={reduced ? 'none' : 'fade'}>
      <View style={styles.overlay}>
        <Pressable accessible={false} onPress={close} style={StyleSheet.absoluteFill} />
        <View style={styles.panel} accessibilityViewIsModal>
          <View style={styles.toolbar}>
            {selected ? (
              <Pressable accessibilityRole="button" onPress={() => { setSelectedId(null); setRevealed(false); }} style={styles.toolbarButton}>
                <Text style={styles.toolbarText}>‹ All letters{unread > 0 ? ` · ${unread} new` : ''}</Text>
              </Pressable>
            ) : <Text accessibilityRole="header" style={styles.archiveTitle}>{companion}’s letters</Text>}
            <Pressable accessibilityRole="button" accessibilityLabel="Close mailbox" onPress={close} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {selected ? (
            <View style={styles.reader}>
              <ScrollView key={selected.id} style={styles.scroll} contentContainerStyle={styles.paperContent}>
                <Animated.View
                  accessibilityElementsHidden={!revealed}
                  importantForAccessibility={revealed ? 'auto' : 'no-hide-descendants'}
                  pointerEvents={revealed ? 'auto' : 'none'}
                  style={{ opacity: unfold, transform: [{ translateY: unfold.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}
                >
                  <View style={styles.letterhead}>
                    <View style={styles.letterMeta}>
                      <Text style={styles.category}>{categoryName[selected.category]}</Text>
                      <Text style={styles.date}>{dateLabel(selected.createdAt)}</Text>
                    </View>
                    <View style={styles.stamp} pointerEvents="none" accessible={false}>
                      <Image source={pipDoodle} resizeMode="contain" style={styles.stampImage} />
                    </View>
                  </View>
                  <Text accessibilityRole="header" style={styles.title}>{selected.title}</Text>
                  <Text selectable style={styles.body}>{selected.body.replace(/your Pip\./g, () => `your ${companion}.`)}</Text>
                  <Text style={styles.signature}>Your friend,{'\n'}{companion}</Text>
                  {selected.reply && !selected.replyChoice && <View style={styles.replies}>
                    <Text style={styles.replyPrompt}>{selected.reply === 'study' ? 'Should we study together today?' : 'Would you like some hot chocolate?'}</Text>
                    <View style={styles.replyRow}>
                      <Pressable accessibilityRole="button" onPress={() => answer(selected, 'yes')} style={({ pressed }) => [styles.replyYes, pressed && styles.pressed]}>
                        <Text style={styles.replyYesText}>{selected.reply === 'study' ? 'Open focus timer' : 'Yes, please!'}</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" onPress={() => answer(selected, 'later')} style={({ pressed }) => [styles.replyLater, pressed && styles.pressed]}>
                        <Text style={styles.replyLaterText}>{selected.reply === 'study' ? 'Maybe later' : 'Not now'}</Text>
                      </Pressable>
                    </View>
                  </View>}
                  {selected.replyChoice && <Text style={styles.replySaved}>You replied {selected.replyChoice === 'yes' ? 'yes' : 'maybe later'}.</Text>}
                </Animated.View>
              </ScrollView>
              {!revealed && !reduced && <View pointerEvents="none" style={styles.envelopeStage}>
                <Animated.View style={{
                  opacity: unfold.interpolate({ inputRange: [0, .85, 1], outputRange: [1, 0, 0] }),
                  transform: [{ translateY: envelope.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                }}>
                  <Svg width={144} height={100} viewBox="0 0 200 136">
                    <Path d="M8 30Q8 20 18 20h164q10 0 10 10v94H8z" fill="#e8c294" stroke="#9c6648" strokeWidth="3" />
                    <Path d="M9 122l67-53m115 53l-67-53" fill="none" stroke="#be946d" strokeWidth="3" />
                    <Path d="M9 25l84 65q7 5 14 0l84-65" fill="#f7deb6" stroke="#9c6648" strokeWidth="3" />
                    <Circle cx="100" cy="87" r="13" fill="#a6453d" />
                    <Path d="M94 86q2-5 6 0 4-5 6 0 0 4-6 8-6-4-6-8" fill="#fce2bb" />
                  </Svg>
                </Animated.View>
              </View>}
              <View style={styles.readerFooter}>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: selected.favorite, disabled: !revealed }} disabled={!revealed}
                  onPress={() => updatePipLetter(selected.id, 'favorite')} style={({ pressed }) => [styles.save, selected.favorite && styles.saved, pressed && styles.pressed]}>
                  <Text style={styles.saveText}>{selected.favorite ? '★  Favorited' : '☆  Favorite letter'}</Text>
                </Pressable>
              </View>
            </View>
          ) : <>
            <View style={styles.filters}>
              {(['All', 'Unread', 'Favorites'] as const).map(item => (
                <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)}
                  style={({ pressed }) => [styles.filter, filter === item && styles.filterActive, pressed && styles.pressed]}>
                  <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}{item === 'Unread' && unread > 0 ? ` (${unread})` : ''}</Text>
                </Pressable>
              ))}
            </View>
            <ScrollView key={filter} style={styles.scroll} contentContainerStyle={styles.archiveContent}>
              {filteredLetters.length === 0 && <Text style={styles.empty}>
                {filter === 'Unread' ? 'You’re all caught up.' : filter === 'Favorites' ? 'Favorite a letter to keep it here.' : 'Your first letter from Pip will appear here.'}
              </Text>}
              {filteredLetters.map(letter => (
                <Pressable key={letter.id} accessibilityRole="button"
                  accessibilityLabel={`${letter.title}, ${dateLabel(letter.createdAt)}${letter.readAt === null ? ', unread' : ''}${letter.favorite ? ', favorite' : ''}`}
                  onPress={() => read(letter)} style={({ pressed }) => [styles.archiveRow, pressed && styles.pressed]}>
                  <View style={[styles.mailMark, letter.readAt === null && styles.mailMarkNew]}><Text style={styles.mailGlyph}>{letter.favorite ? '★' : '✉'}</Text></View>
                  <View style={styles.archiveLabel}>
                    <Text style={styles.archiveLetterTitle}>{letter.title}</Text>
                    <Text style={styles.date}>{dateLabel(letter.createdAt)}</Text>
                  </View>
                  {letter.readAt === null && <Text style={styles.newLabel}>New</Text>}
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>}
        </View>
      </View>
    </Modal>}
  </View>;
}

const styles = StyleSheet.create({
  mailbox: { position: 'absolute', right: '3%', top: '20%', width: '19%', height: '16%', zIndex: 12, minWidth: 48, minHeight: 50 },
  mailboxArt: { width: '100%', height: '100%' },
  newMailGlow: { position: 'absolute', right: '18%', top: '14%', width: 22, height: 22, borderRadius: 12, backgroundColor: 'rgba(255,215,120,.35)', alignItems: 'center', justifyContent: 'center' },
  newMailDot: { width: 8, height: 8, borderRadius: 5, backgroundColor: '#FFE08B', borderColor: '#FFF0C0', borderWidth: 1.5 },
  count: { position: 'absolute', right: '2%', top: '4%', minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#9F3B35', borderWidth: 1, borderColor: '#FFF0D3' },
  countText: { color: '#FFF9E8', fontSize: 11, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(28,23,38,.57)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  panel: { width: '100%', maxWidth: 460, height: 590, maxHeight: '92%', backgroundColor: '#F8EBD8', borderColor: '#BE946D', borderWidth: 1, borderRadius: 18, overflow: 'hidden', shadowColor: '#302233', shadowOpacity: .3, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  toolbar: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#DFC8AA' },
  toolbarButton: { minHeight: 44, justifyContent: 'center', paddingRight: 8 },
  toolbarText: { color: '#784637', fontSize: 15, fontWeight: '700' },
  archiveTitle: { color: '#472E29', fontSize: 22, fontFamily: 'serif', fontWeight: '700' },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#784637', fontSize: 29, lineHeight: 32 },
  reader: { flex: 1, backgroundColor: '#FFF7E9' },
  scroll: { flex: 1 },
  paperContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  letterhead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  letterMeta: { flex: 1, gap: 4 },
  category: { color: '#8D473B', fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  date: { color: '#705949', fontSize: 13, lineHeight: 18 },
  stamp: { width: 54, height: 58, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3E0CA', borderWidth: 1, borderStyle: 'dashed', borderColor: '#A77B66', borderRadius: 3, transform: [{ rotate: '7deg' }] },
  stampImage: { width: 42, height: 44 },
  title: { color: '#472E29', fontFamily: 'serif', fontSize: 28, fontWeight: '700', marginTop: 12, marginBottom: 16 },
  body: { color: '#49362F', fontFamily: 'serif', fontSize: 19, lineHeight: 29 },
  signature: { color: '#8D4236', fontFamily: 'serif', fontSize: 19, lineHeight: 26, fontStyle: 'italic', marginTop: 22 },
  readerFooter: { borderTopWidth: 1, borderTopColor: '#DFC8AA', paddingHorizontal: 16, paddingVertical: 8, alignItems: 'flex-end' },
  save: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10 },
  saved: { backgroundColor: '#F1D9BC' },
  saveText: { color: '#824234', fontSize: 14, fontWeight: '700' },
  replies: { borderTopWidth: 1, borderTopColor: '#DFC8AA', marginTop: 24, paddingTop: 16, gap: 10 },
  replyPrompt: { color: '#634437', fontSize: 15, lineHeight: 21, fontWeight: '600' },
  replyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  replyYes: { minHeight: 44, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#894638' },
  replyYesText: { color: '#FFF4E1', fontSize: 14, fontWeight: '700' },
  replyLater: { minHeight: 44, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5E5D1' },
  replyLaterText: { color: '#704537', fontSize: 14, fontWeight: '700' },
  replySaved: { color: '#705949', fontSize: 13, marginTop: 18 },
  pressed: { opacity: .72 },
  envelopeStage: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12 },
  filter: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 8 },
  filterActive: { backgroundColor: '#F0D7BC' },
  filterText: { color: '#6B5244', fontSize: 14, fontWeight: '600' },
  filterTextActive: { color: '#783D31', fontWeight: '800' },
  archiveContent: { paddingHorizontal: 16, paddingBottom: 16 },
  archiveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#DFC8AA' },
  mailMark: { width: 36, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: '#F1E0CA' },
  mailMarkNew: { backgroundColor: '#F0CDB9' },
  mailGlyph: { color: '#824234', fontSize: 16 },
  archiveLabel: { flex: 1, gap: 4 },
  archiveLetterTitle: { color: '#472E29', fontSize: 16, fontWeight: '700' },
  newLabel: { color: '#8E3E32', fontSize: 12, fontWeight: '800' },
  chevron: { color: '#8E5747', fontSize: 22 },
  empty: { color: '#705949', fontSize: 15, lineHeight: 22, paddingVertical: 18 },
});
