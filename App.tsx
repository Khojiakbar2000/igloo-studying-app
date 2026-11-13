import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Image, ImageBackground, Pressable, ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { PomodoroProvider, usePomodoro } from './src/state/PomodoroContext';
import { constructionProgress } from './src/state/timer';
import { colors, radii } from './src/theme';
import { Igloo, SnowDots, TimerRing } from './src/components/SceneArt';
import { Penguin, PenguinProvider } from './src/components/Penguin';
import { RoomCharacterOverlay } from './src/components/RoomCharacterOverlay';
import { OnboardingFlow, type PreviewStage } from './src/onboarding/OnboardingFlow';
import { IglooOcclusionPrototype } from './src/scenes/IglooOcclusionPrototype';

const BG = require('./assets/environments/arctic/arctic-twilight-mobile.jpg');
const INTERIOR = require('./assets/environments/igloo/igloo-interior-mobile.jpg');
const MY_IGLOO_ROOM = require('./assets/environments/igloo/concepts/my-igloo-clean-plate.png');
const STUDY_TOGETHER_ROOM = require('./assets/environments/igloo/concepts/study-together-clean-plate.png');
const ONBOARDING_COMPLETE_KEY = 'igloo.onboarding-complete.v2';
type Screen = 'home' | 'igloo' | 'friends' | 'profile';

export default function App() {
  return <SafeAreaProvider><PenguinProvider><PomodoroProvider><IglooApp /></PomodoroProvider></PenguinProvider></SafeAreaProvider>;
}

function IglooApp() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [previewCompleted, setPreviewCompleted] = useState(false);
  const previewStage: PreviewStage = (() => {
    if (typeof window === 'undefined') return null;
    const stage = new URLSearchParams(window.location.search).get('preview');
    const known: PreviewStage[] = ['onboarding', 'egg', 'hatching', 'celebration', 'name', 'penguin-name', 'personality', 'activity', 'home', 'build', 'progress', 'duration', 'commitment', 'focus', 'completion'];
    return known.includes(stage as PreviewStage) ? stage as PreviewStage : null;
  })();
  const previewMode = previewStage !== null;
  const showOcclusionPrototype = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('preview') === 'igloo-occlusion';
  const showIglooRoomPreview = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('preview') === 'igloo-room';
  const showStudyTogetherPreview = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('preview') === 'study-together';
  const showOnboarding = !onboardingComplete || (previewMode && !previewCompleted);
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY).then((complete) => {
      setOnboardingComplete(complete === 'true');
    }).catch(() => setOnboardingComplete(false));
  }, []);
  if (showOcclusionPrototype) return <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}><IglooOcclusionPrototype /></SafeAreaView>;
  if (showIglooRoomPreview) return <MainApp screen="igloo" setScreen={setScreen} />;
  if (showStudyTogetherPreview) return <MainApp screen="friends" setScreen={setScreen} />;
  if (onboardingComplete === null) return <View style={styles.loading}><Text style={styles.loadingMark}>IGLOO</Text></View>;
  return <>
    <StatusBar barStyle="dark-content" backgroundColor={colors.ice} />
    {showOnboarding
      ? <OnboardingFlow key={previewStage ?? 'first-run'} previewStage={previewStage} onComplete={() => {
          if (!previewMode) void AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true').catch(() => undefined);
          setOnboardingComplete(true);
          setPreviewCompleted(true);
        }} />
      : <MainApp screen={screen} setScreen={setScreen} />}
  </>;
}

function MainApp({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  const { timer } = usePomodoro();
  const previouslyComplete = useRef(constructionProgress(timer.focusTotalMs).completed);
  useEffect(() => {
    const isComplete = constructionProgress(timer.focusTotalMs).completed;
    if (isComplete && !previouslyComplete.current) setScreen('igloo');
    previouslyComplete.current = isComplete;
  }, [timer.focusTotalMs, setScreen]);
  return <SafeAreaView style={styles.appShell} edges={['top', 'left', 'right', 'bottom']}>
    {screen === 'home' && <HomeScreen onGoFriends={() => setScreen('friends')} />}
    {screen === 'igloo' && <IglooScreen />}
    {screen === 'friends' && <FriendsScreen />}
    {screen === 'profile' && <ProfileScreen />}
    <BottomNav screen={screen} setScreen={setScreen} />
  </SafeAreaView>;
}

function HomeScreen({ onGoFriends }: { onGoFriends: () => void }) {
  const { timer, start, pause, finish, setFocusMinutes, startFocus } = usePomodoro();
  const { progress, stage, minutes, completed } = constructionProgress(timer.focusTotalMs);
  const time = Math.ceil(timer.remainingMs / 1000);
  const timeLabel = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
  const modeTitle = timer.mode === 'focus' ? 'FOCUS TIME' : timer.mode === 'shortBreak' ? 'SHORT BREATHER' : 'LONG BREATHER';
  const isRunning = timer.status === 'running';
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
    <ImageBackground source={BG} resizeMode="cover" style={styles.homeHero} imageStyle={styles.heroImage}>
      <SnowDots />
      <View style={styles.homeHead}>
        <View><Text style={styles.homeBrand}>IGLOO</Text><Text style={styles.homeGreeting}>A calmer kind of focus</Text></View>
        <Pressable onPress={onGoFriends} style={styles.friendShortcut} accessibilityLabel="Open friends">
          <View style={styles.friendDot} /><Text style={styles.friendCount}>1</Text>
        </Pressable>
      </View>
      <View style={styles.worldScene}>
        <View style={styles.iglooPosition}><Igloo stage={stage} width={154} /></View>
        <Penguin style={styles.heroPenguin} />
        <View style={styles.worldCaption}><Text style={styles.worldCaptionText}>{completed ? 'OUR COZY LITTLE HOME' : stage === 0 ? 'A home is waiting to be built' : 'A little more snow, a little more home'}</Text></View>
      </View>
    </ImageBackground>

    <View style={styles.contentStack}>
      <View style={styles.progressCard}>
        <View style={styles.rowBetween}>
          <View><Text style={styles.eyebrow}>OUR IGLOO</Text><Text style={styles.cardTitle}>{completed ? 'Home, sweet home' : `${Math.floor(minutes)} of 60 minutes`}</Text></View>
          <View style={styles.progressBadge}><Text style={styles.progressBadgeText}>{Math.round(progress * 100)}%</Text></View>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(2, progress * 100)}%` }]} /></View>
        <View style={styles.rowBetween}><Text style={styles.progressHint}>{completed ? 'You made a warm little place.' : ['A blank patch of snow', 'First snow blocks!', 'A sturdy foundation', 'The walls are rising', 'The dome is taking shape', 'Your igloo is complete'][stage]}</Text><Text style={styles.progressMinutes}>{Math.max(0, 60 - Math.floor(minutes))} min left</Text></View>
      </View>

      <View style={styles.timerCard}>
        <View style={styles.rowBetween}>
          <View><Text style={styles.eyebrow}>{modeTitle}</Text><Text style={styles.timerHelper}>{timer.mode === 'focus' ? 'One gentle step at a time' : 'Rest is part of the rhythm'}</Text></View>
          <TimerRing size={58} progress={timer.durationMs ? 1 - timer.remainingMs / timer.durationMs : 0} />
        </View>
        <View style={styles.timerControlsRow}>
          <Text style={styles.timerDigits}>{timeLabel}</Text>
          <View style={styles.timerButtons}>
            <Pressable onPress={isRunning ? pause : start} style={({ pressed }) => [styles.timerMainButton, pressed && styles.pressed]}>
              <Text style={styles.timerMainButtonText}>{isRunning ? 'PAUSE' : timer.status === 'paused' ? 'RESUME' : timer.mode === 'focus' ? 'START FOCUS' : 'START BREAK'}</Text>
            </Pressable>
            {(timer.status === 'running' || timer.status === 'paused') && <Pressable onPress={finish} style={styles.finishButton}><Text style={styles.finishText}>FINISH</Text></Pressable>}
          </View>
        </View>
        <View style={styles.timerFooter}>
          {timer.mode === 'focus' && timer.status !== 'running' ? <View style={styles.durationControl}>
            <Pressable accessibilityLabel="Shorten focus session" onPress={() => setFocusMinutes(timer.focusMinutes - 5)} style={styles.durationButton}><Text style={styles.durationSymbol}>−</Text></Pressable>
            <Text style={styles.durationLabel}>{timer.focusMinutes} min focus</Text>
            <Pressable accessibilityLabel="Extend focus session" onPress={() => setFocusMinutes(timer.focusMinutes + 5)} style={styles.durationButton}><Text style={styles.durationSymbol}>+</Text></Pressable>
          </View> : <Pressable onPress={() => startFocus()} style={styles.switchFocus}><Text style={styles.switchFocusText}>BACK TO FOCUS</Text></Pressable>}
          <Text style={styles.sessionCount}>{timer.completedSessions} {timer.completedSessions === 1 ? 'session' : 'sessions'} complete</Text>
        </View>
      </View>
      <Text style={styles.encouragement}>{completed ? 'You brought a little warmth into the world.' : 'No rush. Your penguin is happy you’re here.'}</Text>
    </View>
  </ScrollView>;
}

function IglooScreen() {
  const { timer } = usePomodoro();
  const { minutes, progress, completed } = constructionProgress(timer.focusTotalMs);
  return <ScrollView style={styles.iglooScreen} contentContainerStyle={styles.iglooContent} showsVerticalScrollIndicator={false}>
    <View style={styles.secondaryHeader}><Text style={styles.eyebrow}>MY IGLOO · ART PREVIEW</Text><Text style={styles.screenTitle}>{completed ? 'Home, sweet home' : 'A room to grow into'}</Text><Text style={styles.screenSubtitle}>A lived-in little home for Pip, imagined in the IGLOO world.</Text></View>
    <View style={[styles.iglooArtFrame, { position: 'relative' }]}><Image accessibilityLabel="Illustrated igloo home with a bed, desk, books, lantern, personal mug, and snowy window" source={MY_IGLOO_ROOM} resizeMode="cover" style={[StyleSheet.absoluteFill, styles.iglooArtImage]} /><RoomCharacterOverlay mode="personal" /></View>
    <View style={styles.iglooProgress}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{Math.floor(minutes)} / 60 focused minutes</Text><Text style={styles.progressBadgeText}>{Math.round(progress * 100)}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(2, progress * 100)}%` }]} /></View><Text style={styles.progressHint}>Your focus progress is tracked here. This illustration is a concept preview.</Text></View>
  </ScrollView>;
}

function FriendsScreen() {
  return <ScrollView style={styles.friendsScreen} contentContainerStyle={styles.friendsContent} showsVerticalScrollIndicator={false}>
    <View style={styles.secondaryHeader}><Text style={styles.eyebrow}>A SHARED PLACE TO FOCUS</Text><Text style={styles.screenTitle}>Study together</Text><Text style={styles.screenSubtitle}>A spacious winter room designed for four friends.</Text></View>
    <View style={styles.roomCard}>
      <View style={styles.roomStatus}><View style={styles.conceptDot} /><Text style={styles.roomStatusText}>ROOM CONCEPT · 4 SEATS</Text></View>
      <View style={[styles.sharedRoomArtFrame, { position: 'relative' }]}><Image accessibilityLabel="Illustrated four-seat igloo study room with a panoramic window, bookshelves, and lantern" source={STUDY_TOGETHER_ROOM} resizeMode="cover" style={styles.sharedRoomArt} /><RoomCharacterOverlay mode="study-together" /></View>
      <View style={styles.roomBottom}><View><Text style={styles.roomTitle}>Four seats, one cozy room</Text><Text style={styles.timerHelper}>A visual concept for future shared sessions.</Text></View></View>
    </View>
    <Pressable style={styles.inviteButton} onPress={() => Alert.alert('Study Together preview', 'Invites and live shared sessions are not connected yet.')}><Text style={styles.invitePlus}>＋</Text><Text style={styles.inviteLabel}>INVITES COMING SOON</Text></Pressable>
    <Text style={styles.privacyNote}>This screen shows the room concept. Live multiplayer is not available yet.</Text>
  </ScrollView>;
}

function ProfileScreen() {
  const { timer, setFocusMinutes } = usePomodoro();
  const { minutes, progress } = constructionProgress(timer.focusTotalMs);
  return <ScrollView style={styles.profileScreen} contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
    <View style={styles.profileHead}><Text style={styles.eyebrow}>YOUR LITTLE WORLD</Text><Text style={styles.screenTitle}>A cozy check-in</Text></View>
    <View style={styles.profileHero}><Penguin compact /><View><Text style={styles.profileName}>You & Pip</Text><Text style={styles.profileSub}>Finding a rhythm together</Text></View></View>
    <View style={styles.statsRow}><Stat value={`${Math.floor(timer.focusTotalMs / 3_600_000)}h ${Math.floor((timer.focusTotalMs % 3_600_000) / 60_000)}m`} label="FOCUSED" /><Stat value={String(timer.completedSessions)} label="SESSIONS" /><Stat value={`${Math.round(progress * 100)}%`} label="IGLOO" /></View>
    <View style={styles.profileCard}><Text style={styles.eyebrow}>YOUR IGLOO</Text><View style={styles.profileProgressRow}><Igloo stage={constructionProgress(timer.focusTotalMs).stage} width={72} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{Math.floor(minutes)} focused minutes</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(2, progress * 100)}%` }]} /></View><Text style={styles.progressHint}>Every minute makes it warmer.</Text></View></View></View>
    <View style={styles.profileCard}><Text style={styles.eyebrow}>FOCUS PREFERENCE</Text><Text style={styles.cardTitle}>Session length</Text><View style={styles.preferenceRow}>{[25, 45, 60].map((value) => <Pressable key={value} onPress={() => setFocusMinutes(value)} style={[styles.preference, timer.focusMinutes === value && styles.preferenceActive]}><Text style={[styles.preferenceText, timer.focusMinutes === value && styles.preferenceTextActive]}>{value} min</Text></Pressable>)}</View></View>
    <Text style={styles.profileFoot}>Gentle progress, always. Pip’s home is safe here.</Text>
  </ScrollView>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  const tabs: { id: Screen; label: string }[] = [
    { id: 'home', label: 'Today' }, { id: 'igloo', label: 'Igloo' }, { id: 'friends', label: 'Friends' }, { id: 'profile', label: 'You' },
  ];
  return <View accessibilityRole="tablist" accessibilityLabel="Main navigation" style={styles.bottomNav}>{tabs.map((tab) => {
    const active = screen === tab.id;
    return <Pressable key={tab.id} onPress={() => setScreen(tab.id)} style={[styles.navItem, active && styles.navItemActive]} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected: active }}>
      <NavIcon id={tab.id} active={active} /><Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
    </Pressable>;
  })}</View>;
}

function NavIcon({ id, active }: { id: Screen; active: boolean }) {
  const stroke = active ? colors.tealDark : '#99AFC0';
  return <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {id === 'home' && <><Path d="m3.5 10 8.5-6.5 8.5 6.5" /><Path d="M5.5 9v10.5h13V9M9.5 19.5v-6h5v6" /></>}
    {id === 'igloo' && <><Path d="M3 18a9 9 0 0 1 18 0Z" /><Path d="M9 18v-3a3 3 0 0 1 6 0v3M7 12h10M12 9V6" /></>}
    {id === 'friends' && <><Circle cx="9" cy="8" r="3" /><Circle cx="17" cy="9" r="2.5" /><Path d="M3.5 19c.4-3 2.2-4.5 5.5-4.5s5 1.5 5.5 4.5M14 15c3.7-.8 6 .6 6.5 3" /></>}
    {id === 'profile' && <><Circle cx="12" cy="7.5" r="3.5" /><Path d="M4.5 20c.5-4.1 3-6.2 7.5-6.2s7 2.1 7.5 6.2" /></>}
  </Svg>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ice }, loadingMark: { color: colors.tealDark, fontSize: 15, fontWeight: '900', letterSpacing: 5 },
  welcome: { position: 'relative', flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', overflow: 'hidden', backgroundColor: colors.ice }, celebration: { backgroundColor: '#EDF2F1' }, naming: { backgroundColor: colors.ice }, celebrationContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingTop: 16 }, celebrationPenguin: { height: 238, width: 248, alignItems: 'center', justifyContent: 'center' }, celebrationPenguinImage: { width: 190, height: 220 }, namingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 34 }, namingPenguin: { width: 280, height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, celebrationTitle: { color: '#172328', fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -1, textAlign: 'center', marginTop: 4 }, celebrationSubtitle: { color: '#61757B', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, maxWidth: 300 }, celebrationBottom: { paddingHorizontal: 24, paddingBottom: 18 }, hatchBackground: { width: '100%', height: '100%' }, backgroundImage: { width: '100%' }, welcomeTop: { paddingHorizontal: 25, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, brand: { color: '#3C5A66', fontSize: 12, fontWeight: '900', letterSpacing: 3.8 }, progressDots: { flexDirection: 'row', gap: 6, alignItems: 'center' }, progressDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: '#B7C7CE' }, progressDotActive: { width: 20, backgroundColor: '#597783' }, welcomeCopy: { paddingHorizontal: 26, paddingTop: 30 },
  welcomeTitle: { color: '#1A2327', fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -1.1 }, welcomeSub: { color: '#57666C', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 290 },
  hatchStage: { position: 'relative', flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 270, marginTop: -3 }, welcomeGlow: { position: 'absolute', width: 230, height: 230, borderRadius: 120, backgroundColor: '#FFF9E9', opacity: .52, top: '32%' }, eggTouchTarget: { width: 286, height: 372, alignItems: 'center', justifyContent: 'center' }, eggArt: { width: '100%', height: '100%' }, hatchPenguin: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'flex-end' }, hatchPenguinImage: { width: 190, height: 220 },
  welcomeBottom: { paddingHorizontal: 25, paddingBottom: 18, minHeight: 88, justifyContent: 'flex-end' }, welcomeCaption: { textAlign: 'center', color: '#526F7C', fontSize: 14, lineHeight: 21, marginBottom: 14 }, snowflake: { position: 'absolute', borderRadius: 6, backgroundColor: '#FFFFFF' }, primaryButton: { height: 58, borderRadius: 19, backgroundColor: '#3C5A66', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#3C5A66', shadowOpacity: .16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  primaryButtonText: { color: '#F7FCFA', fontWeight: '800', fontSize: 12, letterSpacing: 1.5 }, buttonArrow: { color: '#D5EEE9', fontSize: 18, marginTop: -2 }, pressed: { transform: [{ scale: .98 }], opacity: .92 }, softFoot: { textAlign: 'center', color: '#8CA2AF', fontSize: 11, marginTop: 13 },
  appShell: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: '#F7FBFD' }, scroll: { flex: 1 }, homeContent: { paddingBottom: 18 }, homeHero: { width: '100%', height: 385, overflow: 'hidden', backgroundColor: '#D8EDF6' }, heroImage: { opacity: .96, width: '100%', height: '100%' }, homeHead: { zIndex: 2, paddingTop: 12, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, homeBrand: { color: colors.tealDark, fontSize: 12, fontWeight: '900', letterSpacing: 3.4 }, homeGreeting: { color: '#6D8797', fontSize: 11, marginTop: 4 }, friendShortcut: { height: 40, minWidth: 48, paddingHorizontal: 11, borderRadius: 20, backgroundColor: '#F9FDFFDD', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#FFFFFF' }, friendDot: { width: 8, height: 8, borderRadius: 5, backgroundColor: '#82B696' }, friendCount: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  worldScene: { position: 'absolute', left: 0, right: 0, top: 80, bottom: 0, alignItems: 'center', justifyContent: 'flex-end' }, iglooPosition: { position: 'absolute', right: 18, bottom: 58, opacity: .92 }, heroPenguin: { marginBottom: 0 }, worldCaption: { position: 'absolute', bottom: 12, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F7FCFFCC' }, worldCaptionText: { color: '#678294', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  contentStack: { paddingHorizontal: 16, marginTop: -20, gap: 12 }, progressCard: { backgroundColor: '#FFFFFF', borderRadius: radii.card, padding: 18, shadowColor: '#7893A3', shadowOpacity: .08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { fontSize: 9, fontWeight: '900', color: colors.teal, letterSpacing: 1.45 }, cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 4, letterSpacing: -.3 }, progressBadge: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#EEF7F8', alignItems: 'center', justifyContent: 'center' }, progressBadgeText: { color: colors.tealDark, fontSize: 12, fontWeight: '900' }, progressTrack: { height: 7, backgroundColor: '#EAF2F5', borderRadius: 5, overflow: 'hidden', marginTop: 14 }, progressFill: { height: '100%', borderRadius: 5, backgroundColor: '#75A9A4' }, progressHint: { color: '#7890A0', fontSize: 11, marginTop: 9 }, progressMinutes: { color: '#97AAB4', fontSize: 10, fontWeight: '700' },
  timerCard: { backgroundColor: '#EFF7F8', borderRadius: radii.card, padding: 18, borderWidth: 1, borderColor: '#E2EFF1' }, timerHelper: { color: '#7890A0', fontSize: 11, marginTop: 5 }, timerControlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }, timerDigits: { color: colors.ink, fontSize: 42, fontWeight: '300', letterSpacing: -2.5, fontVariant: ['tabular-nums'] }, timerButtons: { alignItems: 'flex-end', gap: 7 }, timerMainButton: { minWidth: 116, height: 42, borderRadius: 15, backgroundColor: colors.tealDark, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, timerMainButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 10, letterSpacing: 1.1 }, finishButton: { paddingHorizontal: 14, height: 30, justifyContent: 'center' }, finishText: { color: '#89A0AA', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, timerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#DDE9EA', marginTop: 10 }, durationControl: { flexDirection: 'row', alignItems: 'center', gap: 9 }, durationButton: { width: 27, height: 27, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, durationSymbol: { color: colors.tealDark, fontSize: 17, lineHeight: 20 }, durationLabel: { color: '#617B86', fontSize: 10, fontWeight: '800' }, sessionCount: { color: '#9AAEB5', fontSize: 10 }, switchFocus: { paddingVertical: 5 }, switchFocusText: { color: colors.tealDark, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, encouragement: { textAlign: 'center', color: '#8AA0AE', fontSize: 11, paddingVertical: 4 },
  bottomNav: { height: 72, borderTopWidth: 1, borderTopColor: '#E7EEF1', backgroundColor: '#FBFDFD', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, paddingBottom: 3 }, navItem: { flex: 1, minHeight: 54, marginHorizontal: 3, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3 }, navItemActive: { backgroundColor: '#E8F3F1' }, navLabel: { color: '#879BA6', fontSize: 10, fontWeight: '600' }, navLabelActive: { color: colors.tealDark, fontWeight: '800' },
  secondaryScreen: { flex: 1, paddingHorizontal: 20, paddingTop: 26 }, secondaryHeader: { marginBottom: 16 }, screenTitle: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -.9, marginTop: 7 }, screenSubtitle: { color: '#6E8796', fontSize: 13, marginTop: 8 }, iglooScreen: { flex: 1, backgroundColor: '#EAF1F8' }, iglooContent: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 22, paddingBottom: 26 }, iglooArtFrame: { width: '100%', maxWidth: 390, aspectRatio: 2 / 3, borderRadius: 22, overflow: 'hidden', flexShrink: 0 }, iglooArtImage: { width: '100%', height: '100%' }, iglooProgress: { width: '100%', maxWidth: 390, padding: 17, marginTop: 14, borderRadius: 22, backgroundColor: '#FFFDF8', borderWidth: 1, borderColor: '#E5E9E8' }, decorationRow: { flexDirection: 'row', gap: 8, width: '100%', maxWidth: 390, marginTop: 12 }, decoration: { flex: 1, minHeight: 98, borderRadius: 19, backgroundColor: '#FFFFFFE8', padding: 10, alignItems: 'center', justifyContent: 'center' }, decorationLocked: { opacity: .62 }, decorationDot: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#EEF3F5', alignItems: 'center', justifyContent: 'center' }, decorationDotOpen: { backgroundColor: '#EFF6E9' }, decorationGlyph: { color: colors.tealDark, fontWeight: '800' }, decorationLabel: { textAlign: 'center', color: colors.ink, fontSize: 9, fontWeight: '700', marginTop: 6 }, decorationStatus: { color: '#91A6AF', fontSize: 8, fontWeight: '900', marginTop: 4, letterSpacing: .8 },
  friendsScreen: { flex: 1, backgroundColor: '#EDF3F5' }, friendsContent: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 28 }, roomCard: { backgroundColor: '#FFFDF9', borderRadius: 26, padding: 14, marginTop: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E9EA' }, roomStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2, paddingBottom: 11 }, conceptDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: '#D8A964' }, roomStatusText: { color: '#6B8B8F', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, sharedRoomArtFrame: { width: '100%', aspectRatio: 2 / 3, borderRadius: 17, overflow: 'hidden', backgroundColor: '#DCEAF1' }, sharedRoomArt: { width: '100%', height: '100%' }, roomBottom: { marginTop: 6, borderTopWidth: 1, borderTopColor: '#E7EEF0', paddingTop: 13 }, roomTitle: { color: colors.ink, fontWeight: '800', fontSize: 14 }, inviteButton: { backgroundColor: colors.tealDark, borderRadius: 18, height: 53, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, invitePlus: { color: '#D5EEE9', fontSize: 17 }, inviteLabel: { color: '#FFFFFF', fontWeight: '900', fontSize: 10, letterSpacing: 1.2 }, privacyNote: { textAlign: 'center', color: '#7891A0', fontSize: 10, lineHeight: 16, marginTop: 14, paddingHorizontal: 14 },
  profileScreen: { flex: 1, backgroundColor: '#F7FBFD' }, profileContent: { padding: 20, paddingBottom: 28 }, profileHead: { marginTop: 10, marginBottom: 15 }, profileHero: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#EAF5F8', borderRadius: 26, padding: 13 }, profileName: { color: colors.ink, fontSize: 17, fontWeight: '800' }, profileSub: { color: '#728D9B', fontSize: 11, marginTop: 4 }, statsRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, stat: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 17, alignItems: 'center' }, statValue: { color: colors.ink, fontWeight: '800', fontSize: 18 }, statLabel: { color: '#91A5B1', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 5 }, profileCard: { marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 23, padding: 17 }, profileProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }, preferenceRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, preference: { flex: 1, height: 38, borderRadius: 13, backgroundColor: '#F0F5F6', alignItems: 'center', justifyContent: 'center' }, preferenceActive: { backgroundColor: '#E1F0ED' }, preferenceText: { color: '#7D949F', fontSize: 11, fontWeight: '700' }, preferenceTextActive: { color: colors.tealDark }, profileFoot: { textAlign: 'center', color: '#8FA3AE', fontSize: 10, marginTop: 18 },
});
