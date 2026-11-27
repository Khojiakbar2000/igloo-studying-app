import { ProfileProvider, useCompanionName, useStudyProfile } from './src/onboarding/ProfileProvider';
import { FirstStudyDay } from './src/onboarding/FirstStudyDay';
import { StudyProfileScreen } from './src/profile/StudyProfileScreen';
import { BEATS } from './src/onboarding/profile';
import { localDateKey } from './src/state/dailyGoals';
import { pendingGifts } from './src/gifts/progression';
import { MysteryGifts } from './src/gifts/MysteryGifts';
import { FurnitureBounds, FurnitureController, FurnitureDirectory, FurnitureHotspot, useFurnitureController } from './src/furniture/Furniture';
import { Bookshelf, FurnitureLink, SofaActions } from './src/furniture/RoomFurniture';
import { canPerformFurnitureActivity, roomBox } from './src/furniture/catalog';
import { PipMailbox } from './src/messages/PipMailbox';
import { LivingAwards } from './src/awards/LivingAwards';
import { WinterGarden } from './src/garden/WinterGarden';
import { WindowSurpriseDebug, useWindowSurprises } from './src/window-surprises/WindowSurprises';
import { PetCorner } from './src/pets/PetCorner';
import { IGLOO_FURNITURE } from './src/study-together/iglooLayout';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Animated, { Easing, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import {
  BackHandler, Image, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { PomodoroProvider, usePomodoro } from './src/state/PomodoroContext';
import { AmbientSoundProvider } from './src/ambient/AmbientSoundProvider';
import { AmbientSoundPanel, AmbientSoundTrigger } from './src/ambient/AmbientSoundControls';
import { iglooConstruction } from './src/state/timer';
import { TodaysGoals, FocusGoalPicker, GoalSessionReview, DailyFocusSummary, TodayGoalCelebration } from './src/components/TodayGoals';
import { colors, metrics, motion, radii, space, todayColors, type, ui } from './src/theme';
import { Balance, Button, Chevron, IconButton, ProgressBar, ScreenHeader } from './src/ui/Controls';
import { BottomNav, type TabId } from './src/ui/BottomNav';
import { TimerRing } from './src/components/SceneArt';
import { PenguinProvider } from './src/components/Penguin';
import { WinterWorld } from './src/home/winter/WinterWorld';
import { winterStage } from './src/home/winter/construction';
import { OnboardingFlow, type PreviewStage } from './src/onboarding/OnboardingFlow';
import { DevPreviewRouter } from './src/experiments/DevPreviewRouter';
import { StudyTogetherLottieCharacters } from './src/components/StudyTogetherLottieCharacters';
import { CoffeeMachine, coffeeStatus } from './src/study-together/coffee/CoffeeMachine';
import { useCoffeeOrder } from './src/study-together/coffee/useCoffeeOrder';
import { BreakActivityMenu, BreakActivityStage } from './src/study-together/breaks/BreakActivities';
import { useBreakActivities } from './src/study-together/breaks/useBreakActivities';
import { activityInfo } from './src/study-together/breaks/activities';
import { StudyRoomSelector } from './src/components/StudyRoomSelector';
import { useAmbientSound } from './src/ambient/AmbientSoundProvider';
import { useStudyRooms } from './src/state/useStudyRooms';
import { PipReactionsProvider, usePipReactions } from './src/character/reactions/PipReactionsProvider';
import { SeatedPipReactions } from './src/character/reactions/SeatedPipReactions';
import { StudyTogetherAnimationDebugger } from './src/components/StudyTogetherAnimationDebugger';
import { CustomizableHome } from './src/components/CustomizableHome';
import { PipWardrobeScreen } from './src/wardrobe/PipWardrobeScreen';
import type { StudyWindowScene } from './src/scenes/studyWindowScenes';

const BG = require('./assets/environments/arctic/arctic-twilight-mobile.jpg');
type Screen = TabId | 'wardrobe';

export default function App() {
  return <SafeAreaProvider><PenguinProvider><PomodoroProvider><ProfileProvider><AmbientSoundProvider><PipReactionsProvider><IglooApp /></PipReactionsProvider></AmbientSoundProvider></ProfileProvider></PomodoroProvider></PenguinProvider></SafeAreaProvider>;
}

function IglooApp() {
  const { profile, ready, error, retryLoad }=useStudyProfile();
  const { importStudyPlan, startFocus, selectGoal, setFocusMinutes, timer, storageError, retrySave }=usePomodoro();
  const imported=useRef<string|null>(null);
  useEffect(()=>{
    if(!ready||!profile.completed||!profile.usePlan||!profile.planStart)return;
    const key=JSON.stringify([profile.planStart,profile.plan]);
    if(imported.current===key)return;
    imported.current=key;
    importStudyPlan(profile.plan,profile.planStart);
  },[importStudyPlan,profile.completed,profile.plan,profile.planStart,profile.usePlan,ready]);
  const [screen, setScreen] = useState<Screen>(() => {
    if (typeof window === 'undefined') return 'home';
    const preview = new URLSearchParams(window.location.search).get('preview');
    return preview === 'study-together' ? 'friends' : preview === 'igloo-room' ? 'igloo' : preview === 'pip-wardrobe' ? 'wardrobe' : 'home';
  });
  const [nativeOnboardingPreview,setNativeOnboardingPreview]=useState(false);
  const [previewCompleted, setPreviewCompleted] = useState(false);
  const previewStage: PreviewStage = nativeOnboardingPreview ? 'onboarding' : (() => {
    if (!__DEV__ || typeof window === 'undefined') return null;
    const stage = new URLSearchParams(window.location.search).get('preview');
    const known: PreviewStage[] = [...BEATS,'onboarding', 'egg', 'hatching', 'celebration', 'penguin-name', 'personality', 'activity', 'home', 'build', 'progress', 'duration', 'commitment', 'focus', 'completion'];
    return known.includes(stage as PreviewStage) ? stage as PreviewStage : null;
  })();
  const previewMode = previewStage !== null;
  const showIglooRoomPreview = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('preview') === 'igloo-room';
  const showStudyTogetherPreview = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('preview') === 'study-together';
  const showTodayGoalsPreview = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('preview') === 'today-goals';
  const showCustomizationPreview = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('preview') === 'penguin-customization';
  const showWardrobePreview = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('preview') === 'pip-wardrobe';
  const showYouPreview = __DEV__ && typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('preview') === 'you';
  const showOnboarding = !profile.completed || (previewMode && !previewCompleted);
  if (showIglooRoomPreview) return <MainApp screen={screen} setScreen={setScreen} />;
  if (showStudyTogetherPreview) return <MainApp screen={screen} setScreen={setScreen} />;
  if (showYouPreview) return <MainApp screen="profile" setScreen={setScreen} />;
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'winter-home') return <MainApp screen="home" setScreen={setScreen} />;
  if (showTodayGoalsPreview) return <MainApp screen={screen} setScreen={setScreen} />;
  if (showCustomizationPreview) return <MainApp screen="wardrobe" setScreen={setScreen} />;
  if (showWardrobePreview) return <MainApp screen={screen} setScreen={setScreen}
    wardrobeDemo={new URLSearchParams(window.location.search).get('demo') === '1'} />;
  if (!ready) return <View style={styles.loading}><Text style={styles.loadingMark}>IGLOO</Text>
    {(error || storageError) && <Pressable accessibilityRole="button" onPress={storageError ? retrySave : retryLoad} style={{padding:16}}>
      <Text>Couldn’t load your Igloo. Tap to retry.</Text>
    </Pressable>}
  </View>;
  return <DevPreviewRouter>
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.ice} />
      {showOnboarding
        ? <OnboardingFlow key={previewStage ?? 'first-run'} previewStage={previewStage} onComplete={(destination, completed) => {
            if(!previewMode && completed.usePlan && completed.planStart) {
              importStudyPlan(completed.plan,completed.planStart);
              if(destination==='focus')selectGoal(`igloo-plan-${localDateKey()}`);
            }
            if(!previewMode&&timer.status==='idle') {
              if(destination==='focus')startFocus(completed.sessionMinutes);
              else if(timer.mode==='focus')setFocusMinutes(completed.sessionMinutes);
            }
            setScreen(destination === 'focus' && !previewMode ? 'home' : 'igloo');
            if(previewMode){setPreviewCompleted(true);setNativeOnboardingPreview(false);}
          }} />
        : <>
          <MainApp screen={screen} setScreen={setScreen}
            onPreviewOnboarding={__DEV__ ? () => {
              if (typeof window !== 'undefined') window.location.assign('?preview=onboarding');
              else { setPreviewCompleted(false); setNativeOnboardingPreview(true); }
            } : undefined} />
          {!previewMode && <FirstStudyDay onExplore={()=>setScreen('igloo')} enabled={screen === 'home' || screen === 'igloo' || screen === 'friends'} />}
        </>}
    </>
  </DevPreviewRouter>;
}

function MainApp({ screen, setScreen, wardrobeDemo = false, onPreviewOnboarding }: { screen: Screen; setScreen: (screen: Screen) => void; wardrobeDemo?: boolean; onPreviewOnboarding?: () => void }) {
  const { timer } = usePomodoro();
  const [openCoffeeFromMail, setOpenCoffeeFromMail] = useState(false);
  const [revealTimer, setRevealTimer] = useState(false);
  const [showWindow, setShowWindow] = useState(false);
  const [homeRequest, setHomeRequest] = useState<'bed' | 'decorate' | 'help' | null>(null);
  const [wardrobeBack, setWardrobeBack] = useState<'igloo' | 'friends' | 'profile'>('igloo');
  const openTimer = () => { setRevealTimer(true); setScreen('home'); };
  const openWardrobe = () => { setWardrobeBack(screen === 'friends' || screen === 'profile' ? screen : 'igloo'); setScreen('wardrobe'); };
  const openCoffee = () => { setOpenCoffeeFromMail(true); setScreen('friends'); };
  useEffect(() => {
    if (screen !== 'wardrobe') return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => { setScreen(wardrobeBack); return true; });
    return () => listener.remove();
  }, [screen, setScreen, wardrobeBack]);
  const { width: viewportWidth } = useWindowDimensions();
  const desktopPreview = viewportWidth > 500;
  const reducedMotion = useReducedMotion();
  const coffee = useCoffeeOrder(timer.mode, timer.status, screen === 'friends');
  const breaks = useBreakActivities(timer, screen === 'friends', coffee);
  const immersiveWorld = screen === 'home' || screen === 'igloo' || screen === 'friends';
  return <View style={[styles.appViewport, screen === 'home' && styles.todayViewport]}>
    <View style={[styles.appShellFrame, desktopPreview && styles.appShellFramePreview, screen === 'home' && styles.todayShell]}>
    {screen === 'igloo' ? <Svg pointerEvents="none" width="100%" height="100%" style={styles.snowBackdrop}>
      <Defs>
        <LinearGradient id="iglooIce" x1="0" y1="0" x2="0.9" y2="1"><Stop offset="0" stopColor={colors.iceBlue}/><Stop offset="0.52" stopColor={colors.snow}/><Stop offset="1" stopColor="#C2DFE4"/></LinearGradient>
        <RadialGradient id="iglooWarm" cx="65%" cy="37%" rx="65%" ry="48%"><Stop offset="0" stopColor={colors.peach} stopOpacity=".31"/><Stop offset="1" stopColor={colors.peach} stopOpacity="0"/></RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#iglooIce)"/>
      <Rect width="100%" height="100%" fill="url(#iglooWarm)"/>
    </Svg> : screen === 'friends' && <><ImageBackground source={BG} resizeMode="cover" style={styles.snowBackdrop} imageStyle={styles.snowBackdropImage} /><View pointerEvents="none" style={styles.snowBackdropWash} /></>}
    <FurnitureController key={screen}>
    <SafeAreaView style={[styles.appShell, immersiveWorld && styles.appShellImmersive]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.shellContent} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View key={screen} entering={reducedMotion ? undefined : FadeInDown.duration(motion.entrance).easing(Easing.out(Easing.cubic))} style={styles.activeScreen}>
        {screen === 'home' && <HomeScreen revealTimer={revealTimer} onTimerRevealed={() => setRevealTimer(false)} onGoFriends={() => setScreen('friends')} onOpenAward={() => setScreen('igloo')} />}
        {screen === 'igloo' && <CustomizableHome onOpenWardrobe={openWardrobe} onOpenTimer={openTimer} onOpenCoffeeMachine={openCoffee}
          onOpenWindow={() => { setShowWindow(true); setScreen('friends'); }} request={homeRequest} onRequestHandled={() => setHomeRequest(null)} />}
        {screen === 'wardrobe' && <PipWardrobeScreen demoMode={wardrobeDemo} backLabel={wardrobeBack === 'friends' ? 'Back to Study Together' : wardrobeBack === 'profile' ? 'Back to You' : 'Back to My Igloo'} onBack={() => setScreen(wardrobeBack)} />}
        {screen === 'friends' && <FriendsScreen coffee={coffee} breaks={breaks} openCoffeeFromMail={openCoffeeFromMail} onCoffeeOpened={() => setOpenCoffeeFromMail(false)}
          openWindowFromHome={showWindow} onWindowOpened={() => setShowWindow(false)} onOpenTimer={openTimer} onOpenWardrobe={openWardrobe}
          onGiftPlaced={() => setScreen('igloo')} onBed={() => { setHomeRequest('bed'); setScreen('igloo'); }} onCustomizeFurniture={() => { setHomeRequest('decorate'); setScreen('igloo'); }} />}
        {screen === 'profile' && <StudyProfileScreen onWardrobe={openWardrobe}
          onIgloo={() => setScreen('igloo')} onHelp={() => { setHomeRequest('help'); setScreen('igloo'); }} onPreviewOnboarding={onPreviewOnboarding} />}
      </Animated.View>
      <AmbientSoundPanel winter={screen === 'home'} />
      <BottomNav active={screen === 'wardrobe' ? wardrobeBack : screen} onChange={setScreen} />
      </KeyboardAvoidingView>
    </SafeAreaView>
    </FurnitureController>
    </View>
  </View>;
}

function HomeScreen({ revealTimer, onTimerRevealed, onGoFriends, onOpenAward }: { revealTimer: boolean; onTimerRevealed: () => void; onGoFriends: () => void; onOpenAward: () => void }) {
  const { timer, hydrated, start, pause, finish, setFocusMinutes, prepareFocus } = usePomodoro();
  const { width, height } = useWindowDimensions();
  const sceneWidth = Math.min(width, metrics.appWidth);
  const heroHeight = Math.round(Math.min(sceneWidth * 0.68, height * 0.36));
  const { progress, minutes, completed } = iglooConstruction(timer);
  const [worldVisible,setWorldVisible] = useState(true);
  const [reviewProgress,setReviewProgress] = useState<number|null>(null);
  const winterReview = __DEV__ && typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('preview') === 'winter-home'
    && new URLSearchParams(window.location.search).get('debug') === 'winter-review';
  const giftWaiting = useMemo(() => pendingGifts(timer.sessions, timer.home.gifts).length > 0, [timer.sessions, timer.home.gifts]);
  const time = Math.ceil(timer.remainingMs / 1000);
  const timeLabel = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
  const modeTitle = timer.mode === 'focus' ? 'Focus session' : timer.mode === 'shortBreak' ? 'Short break' : 'Long break';
  const isRunning = timer.status === 'running';
  const scrollRef = useRef<ScrollView>(null);
  const contentTop = useRef<number | null>(null);
  const timerTop = useRef<number | null>(null);
  const goalsTop = useRef(0);
  const showGoals = () => scrollRef.current?.scrollTo({ y: (contentTop.current ?? 0) + goalsTop.current, animated: true });
  const revealPendingTimer = () => {
    if (!revealTimer || contentTop.current === null || timerTop.current === null || !scrollRef.current) return;
    scrollRef.current.scrollTo({ y: Math.max(0, contentTop.current + timerTop.current - 12), animated: false });
    onTimerRevealed();
  };
  const sceneProgress = winterReview && reviewProgress !== null ? reviewProgress : progress;
  const sceneStage = winterStage(sceneProgress);
  return <View style={styles.homeViewport}><ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" scrollEventThrottle={100} onScroll={event => {
    setWorldVisible(event.nativeEvent.contentOffset.y < heroHeight + metrics.header);
  }}>
    <View style={styles.homeHero}>
      <Image source={BG} accessible={false} resizeMode="stretch" style={[styles.todayBackdrop, { height: sceneWidth * 1.5 }]} />
      <ScreenHeader title="Today" titleColor={todayColors.ink} actions={<>
        <Balance amount={timer.home.snowflakes} winter />
        <StudyControl compact winter icon="friends" label="Open friends" onPress={onGoFriends} />
      </>} />
      <View style={{ height: heroHeight }}><WinterWorld progress={sceneProgress} active={worldVisible} /></View>
      <View style={styles.construction}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open My Igloo. ${sceneStage}`} onPress={onOpenAward}
          style={({ pressed }) => [styles.constructionLink, pressed && ui.pressed]}>
          <Text style={styles.constructionStage}>{sceneStage}</Text>
          <Text style={styles.progressMinutes}>{completed ? 'Complete' : `${Math.floor(minutes)} / 60 min`}</Text>
          <Chevron direction="forward" color={todayColors.link} />
        </Pressable>
        <ProgressBar progress={progress} label="Igloo construction" tone="winter" />
      </View>
    </View>

    {winterReview&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:5,padding:10}}>{[0,.2,.35,.5,.7,.9,1].map(p=><Pressable key={p} accessibilityRole="button" onPress={()=>setReviewProgress(p)} style={{padding:9,backgroundColor:'#e7eff3',borderRadius:9}}><Text>{Math.round(p*100)}%</Text></Pressable>)}<Pressable onPress={()=>setReviewProgress(null)} style={{padding:9}}><Text>Live study progress</Text></Pressable></View>}
    <View style={styles.contentStack} onLayout={event => { contentTop.current = event.nativeEvent.layout.y; revealPendingTimer(); }}>
      {__DEV__ && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'pip-reactions' && <StudyTogetherAnimationDebugger />}
      <View testID="focus-timer" style={[ui.card, styles.timerCard]} onLayout={event => { timerTop.current = event.nativeEvent.layout.y; revealPendingTimer(); }}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{modeTitle}</Text>
          {!worldVisible && <View style={styles.timerPip}><SeatedPipReactions allowAmbientCoffee={false} /></View>}
          <AmbientSoundTrigger placement="timer" />
        </View>
        <View style={styles.timerControlsRow}>
          <View style={styles.timerReading}>
            <Text style={[styles.timerDigits, width < 360 && styles.timerDigitsSmall]} accessibilityLabel={`${Math.floor(time / 60)} minutes ${time % 60} seconds remaining`}>{timeLabel}</Text>
            {timer.status !== 'idle' && <TimerRing size={30} color={todayColors.progress} progress={timer.durationMs ? 1 - timer.remainingMs / timer.durationMs : 0} />}
          </View>
          {timer.mode === 'focus' && timer.status === 'idle' && <View style={styles.durationControl}>
            <IconButton label="Shorten focus session" style={styles.todayIcon} disabled={!hydrated || timer.focusMinutes <= 10} onPress={() => setFocusMinutes(timer.focusMinutes - 5)}><Text style={styles.durationSymbol}>−</Text></IconButton>
            <Text style={styles.durationLabel}>{timer.focusMinutes} min</Text>
            <IconButton label="Extend focus session" style={styles.todayIcon} disabled={!hydrated || timer.focusMinutes >= 60} onPress={() => setFocusMinutes(timer.focusMinutes + 5)}><Text style={styles.durationSymbol}>+</Text></IconButton>
          </View>}
        </View>
        <View style={styles.timerButtons}>
          <Button winter label={isRunning ? 'Pause' : timer.status === 'paused' ? 'Resume' : timer.mode === 'focus' ? 'Start focus' : 'Start break'} disabled={!hydrated} onPress={isRunning ? pause : start} style={styles.focusAction} />
          {timer.status !== 'idle' && <Button winter label="Finish" variant="secondary" onPress={finish} />}
          {timer.mode !== 'focus' && timer.status === 'idle' && <Button winter label="Back to focus" variant="secondary" onPress={prepareFocus} />}
        </View>
        <FocusGoalPicker onAddGoal={showGoals} />
        {(timer.awards.pending.length > 0 || giftWaiting) && !(timer.mode === 'focus' && timer.status !== 'idle') &&
          <Pressable accessibilityRole="button" onPress={onOpenAward} style={styles.switchFocus}>
            <Text style={styles.switchFocusText}>{giftWaiting ? 'A gift is waiting in My Igloo' : 'A new award is ready in My Igloo'}</Text>
          </Pressable>}
      </View>

      <GoalSessionReview />
      <DailyFocusSummary />
      <View onLayout={event => { goalsTop.current = event.nativeEvent.layout.y; }}><TodaysGoals /></View>
    </View>
  </ScrollView><TodayGoalCelebration /></View>;
}

const studyIcons = {
  friends: 'M15 20H3v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2ZM12 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM16 5a3 3 0 0 1 0 6m2 3a4 4 0 0 1 3 4v2',
  settings: 'M4 6h5m4 0h7M4 12h10m4 0h2M4 18h3m4 0h9M9 4v4m5 2v4m-7 2v4',
  window: 'M4 20V9a8 8 0 0 1 16 0v11H4Zm8-19v19M4 10h16',
  decorate: 'M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M5 18v2m14-2v2M3 12h4v3h10v-3h4v6H3Z',
  sounds: 'M9 18V6l11-3v12M9 18c0 3-6 4-6 1s6-4 6-1Zm11-3c0 3-6 4-6 1s6-4 6-1Z',
  journal: 'M3 5q5-2 9 1 4-3 9-1v14q-5-2-9 1-4-3-9-1V5Zm9 1v14',
};

function StudyControl({ icon, label, onPress, compact = false, winter = false }: {
  icon: keyof typeof studyIcons; label: string; onPress: () => void; compact?: boolean; winter?: boolean;
}) {
  const glyph = <Svg width={metrics.icon} height={metrics.icon} viewBox="0 0 24 24" fill="none"
    stroke={winter ? todayColors.ink : colors.ink} strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round"><Path d={studyIcons[icon]} /></Svg>;
  if (compact) return <IconButton label={label} onPress={onPress} style={winter && styles.todayHeaderIcon}>{glyph}</IconButton>;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => [styles.roomTool, pressed && ui.pressed]}>{glyph}<Text style={styles.roomToolLabel}>{label}</Text></Pressable>;
}

function FriendsScreen({ coffee, breaks, openCoffeeFromMail, onCoffeeOpened, openWindowFromHome, onWindowOpened, onOpenTimer, onOpenWardrobe, onBed, onCustomizeFurniture, onGiftPlaced }: {
  coffee: ReturnType<typeof useCoffeeOrder>; breaks: ReturnType<typeof useBreakActivities>;
  openCoffeeFromMail: boolean; onCoffeeOpened: () => void; openWindowFromHome: boolean; onWindowOpened: () => void;
  onOpenTimer: () => void; onOpenWardrobe: () => void; onBed: () => void; onGiftPlaced: () => void; onCustomizeFurniture: () => void;
}) {
  const companion=useCompanionName();
  const { timer, setLightingPreset, setLightingBrightness, toggleRoomLight } = usePomodoro();
  const ambientAudio = useAmbientSound();
  const { width } = useWindowDimensions();
  const [pageHeight, setPageHeight] = useState(0);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const debug = __DEV__ && typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('debug') : null;
  const [openControls, setOpenControls] = useState<'coffee' | 'scenery' | 'lighting' | 'sofa' | null>(null);
  const [windowRequest, setWindowRequest] = useState(0);
  const [cushionPulse, setCushionPulse] = useState(0);
  const { requestRestReaction } = usePipReactions();
  const lastFurniture = useFurnitureController()?.last;
  useEffect(() => {
    if (!lastFurniture) return;
    const id = lastFurniture.id;
    if (id !== 'sofa' && id !== 'coffee' && id !== 'scenery' && id !== 'window') setOpenControls(null);
    breaks.setMenu(false);
  }, [lastFurniture, breaks.setMenu]);
  const openWindow = () => { setOpenControls('scenery'); setWindowRequest(value => value + 1); };
  useEffect(() => { if (openWindowFromHome) { openWindow(); onWindowOpened(); } }, [openWindowFromHome, onWindowOpened]);
  const [coffeePerformance, setCoffeePerformance] = useState(false);
  const [visibleBreak, setVisibleBreak] = useState<number | null>(null);
  const playingBreak = breaks.performance;
  const [roomVisible, setRoomVisible] = useState(true);
  const roomBounds = useRef({ y: 0, height: 0 });
  const artBounds = useRef({ y: 0, height: 0 });
  const [windowVisible, setWindowVisible] = useState(true);
  const drinkStatus = coffeeStatus(coffee, companion);
  const roomWidth = Math.min(430, width - 28, pageHeight ? Math.max(160, (pageHeight - 132) * 2 / 3) : 320);
  const [windowScene, setWindowScene] = useState<StudyWindowScene>('blizzard');
  useEffect(() => { if (openCoffeeFromMail) { setOpenControls('coffee'); onCoffeeOpened(); } }, [openCoffeeFromMail, onCoffeeOpened]);
  const { roomId, pendingRoom, error, chooseRoom } = useStudyRooms();
  const scroll = useRef<ScrollView>(null);
  const surprises = useWindowSurprises(roomId === 'igloo' ? windowScene : null, windowVisible,
    !!playingBreak || coffee.order?.phase === 'serving');
  const selectWindow = (scene: StudyWindowScene) => { setWindowScene(scene); chooseRoom('igloo'); };
  const toggleLight = (source: 'lamp' | 'lantern' | 'fairy' | 'fireplace') => {
    if (source === 'fireplace' && !timer.home.lighting.sources.fireplace) ambientAudio.unlockAudio();
    toggleRoomLight(source);
  };
  return <ScrollView ref={scroll} style={styles.friendsScreen} contentContainerStyle={styles.friendsContent} showsVerticalScrollIndicator={false}
    onLayout={event => setPageHeight(event.nativeEvent.layout.height)}
    scrollEventThrottle={200} onScroll={({nativeEvent:{contentOffset,layoutMeasurement}}) => {
      const {y,height}=roomBounds.current;
      setRoomVisible(contentOffset.y < y+height && contentOffset.y+layoutMeasurement.height > y);
      const art = artBounds.current;
      const top = y+art.y+art.height*402/1536;
      const bottom = top+art.height*234/1536;
      setWindowVisible(contentOffset.y < bottom && contentOffset.y+layoutMeasurement.height > top);
    }}>
    <ScreenHeader title="Study Together" actions={<>
        <StudyControl compact icon="friends" label="Friends" onPress={() => setFriendsOpen(value => !value)} />
        <StudyControl compact icon="settings" label="Room settings" onPress={() => {
          setFriendsOpen(false);
          breaks.setMenu(false);
          setOpenControls(value => value === 'scenery' ? null : 'scenery');
        }} />
    </>} />
    {friendsOpen && <View style={styles.studyNotice}><Text accessibilityLiveRegion="polite" style={styles.studyNoticeText}>Invitations are not available yet.</Text></View>}
    <View style={{ width: roomWidth, alignSelf: 'center' }} onLayout={event => { roomBounds.current=event.nativeEvent.layout; }}>
      <View testID="study-room-scene" style={styles.sharedRoomArtFrame} onLayout={event=>{artBounds.current=event.nativeEvent.layout;}}>
        <StudyTogetherLottieCharacters roomId={roomId} windowScene={windowScene} lighting={timer.home.lighting} reactToPomodoro
          coffeePerformance={coffeePerformance || (playingBreak !== null && visibleBreak === playingBreak.id)}
          cushionPulse={cushionPulse}
          coffeeReserved={coffee.order?.phase === 'serving' || !!playingBreak} onPipAvailable={breaks.onPipAvailable}
          breakStage={playingBreak && <BreakActivityStage key={playingBreak.id} id={playingBreak.id} activity={playingBreak.activity}
            onVisible={setVisibleBreak} onFinish={breaks.finish} />} />
        <Bookshelf bounds={roomId === 'igloo' ? roomBox(11.7, 29, 9, 15) : undefined}
          secondaryBounds={roomId === 'igloo' ? roomBox(87, 28.5, 11, 16) : undefined} />
        <FurnitureHotspot id="sofa" bounds={roomBox(55.5, 63, 24, 5.5)} onPress={() => {
          setOpenControls(value => value === 'sofa' ? null : 'sofa');
          setCushionPulse(value => value + 1);
        }} state={breaks.queued ? `Queued: ${breaks.queued}` : playingBreak ? `${companion} is resting` : 'Ready'} />
        {roomId === 'igloo' ? <>
          <FurnitureHotspot id="window" bounds={roomBox(23, 26, 54, 16)} onPress={openWindow} state={windowScene} />
          <FurnitureHotspot id="lantern" bounds={roomBox(43.9, 13.6, 12.2, 10.4)} onPress={() => toggleLight('lantern')} state={timer.home.lighting.sources.lantern ? 'On' : 'Off'} />
          <FurnitureHotspot id="lamp" bounds={roomBox(77, 36.7, 10, 6.4)} onPress={() => toggleLight('lamp')} state={timer.home.lighting.sources.lamp ? 'On' : 'Off'} />
          <FurnitureHotspot id="fireplace" bounds={IGLOO_FURNITURE.fireplaceTarget} onPress={() => toggleLight('fireplace')} state={timer.home.lighting.sources.fireplace ? 'On' : 'Off'} />
          <FurnitureLink id="fairy" action={() => toggleLight('fairy')} state={timer.home.lighting.sources.fairy ? 'On' : 'Off'} />
        </> : <FurnitureLink id="window" action={openWindow} state={windowScene} />}
        <FurnitureLink id="wardrobe" action={onOpenWardrobe} />
        <FurnitureLink id="desk" action={onOpenTimer} />
        <FurnitureLink id="bed" action={onBed} />
        <LivingAwards visible={roomVisible} settled={false} menuOnly />
        <PipMailbox visible={roomVisible} onOpenTimer={onOpenTimer} onOpenCoffeeMachine={() => setOpenControls('coffee')} menuOnly />
        <SofaActions open={openControls === 'sofa'} onClose={() => setOpenControls(null)} queued={breaks.queued} onCancel={breaks.cancelQueued}
          onSelect={action => {
            setOpenControls(null);
            if (action === 'sit' && canPerformFurnitureActivity(timer.mode, timer.status)) {
              setCushionPulse(value => value + 1);
              requestRestReaction('smile');
            } else {
              breaks.queue(action === 'nap' ? 'nap' : action === 'stretch' ? 'stretch' : 'relax');
            }
          }} />
        <BreakActivityMenu enabled={breaks.canAsk} open={breaks.menu}
          onOpenChange={open => { if (open) setOpenControls(null); breaks.setMenu(open); }}
          onSelect={breaks.queue} drinkReady={coffee.order?.phase === 'ready'} />
        <CoffeeMachine coffee={coffee} igloo={roomId === 'igloo'} menuOpen={openControls === 'coffee'}
          onMenuChange={open => { if (open) breaks.setMenu(false); setOpenControls(open ? 'coffee' : null); }} onPerformanceVisibility={setCoffeePerformance} />
        {surprises.stage}
        <PetCorner room={roomId === 'igloo' ? 'studyIgloo' : 'shared'} visible={roomVisible} pipBusy={!!playingBreak || coffee.order?.phase === 'serving'} pipMoving={playingBreak?.activity === 'walk' || playingBreak?.activity === 'window' || coffee.order?.phase === 'serving'} />
        <WinterGarden shared menuOnly={roomId !== 'igloo'} visible={roomVisible} busy={!!playingBreak || coffee.order?.phase === 'serving'} />
        <MysteryGifts shared visible={roomVisible} menuOnly={roomId !== 'igloo'} onPlaced={onGiftPlaced} />
        <AmbientSoundTrigger placement={roomId === 'igloo' ? 'studyIgloo' : 'shared'} />
        <StudyRoomSelector windowRequest={windowRequest} expanded={openControls === 'scenery' || openControls === 'lighting'} onExpandedChange={open => { if (open) breaks.setMenu(false); setOpenControls(open ? 'scenery' : null); }} selected={roomId} pending={pendingRoom} error={error} onChange={chooseRoom} windowScene={windowScene} onWindowChange={selectWindow} lighting={timer.home.lighting} onLightingPreset={setLightingPreset} onLightingBrightness={setLightingBrightness} onToggleLight={toggleLight} />
        <FurnitureBounds />
      </View>
      <View style={styles.roomTools}>
        <StudyControl icon="window" label="Window" onPress={openWindow} />
        <FurnitureDirectory onCustomize={onCustomizeFurniture} showDebugControls={debug === 'furniture'} renderTrigger={open => <StudyControl icon="decorate" label="Decorate" onPress={open} />} />
        <StudyControl icon="sounds" label="Sounds" onPress={() => { ambientAudio.unlockAudio(); ambientAudio.setOpen(true); }} />
        <StudyControl icon="journal" label="Journal" onPress={surprises.showJournal} />
      </View>
      {(breaks.queued || playingBreak || drinkStatus) && <View pointerEvents="none" style={styles.studyStatus}>
        <Text accessibilityLiveRegion="polite" style={styles.studyNoticeText}>
          {playingBreak ? activityInfo(playingBreak.activity).status.replace(/^Pip(?= )/, () => companion) : drinkStatus || `${companion}’s ${breaks.queued} is queued.`}
        </Text>
      </View>}
      {timer.mode === 'focus' && timer.status !== 'idle' && <Button label="Open active focus timer" variant="secondary" onPress={onOpenTimer} style={styles.roomFocusLink} />}
      {surprises.journal}
    </View>
    {debug === 'window-surprises' && <WindowSurpriseDebug onPreview={event=>{
      selectWindow(event.scene);
      scroll.current?.scrollTo({y:Math.max(0,roomBounds.current.y-12),animated:false});
      setWindowVisible(true);
      surprises.preview(event);
    }} />}
    {debug === 'pip-reactions' && <StudyTogetherAnimationDebugger />}
  </ScrollView>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ice },
  loadingMark: { ...type.eyebrow, color: colors.primary, letterSpacing: 4 },
  appViewport: { flex: 1, backgroundColor: colors.iceBlue },
  appShellFrame: { flex: 1, width: '100%', maxWidth: metrics.appWidth, alignSelf: 'center', position: 'relative', overflow: 'hidden', backgroundColor: colors.ice },
  appShellFramePreview: { borderRadius: radii.scene, borderWidth: 1, borderColor: colors.line },
  appShell: { flex: 1, backgroundColor: colors.ice },
  shellContent: { flex: 1, minHeight: 0 },
  activeScreen: { flex: 1, minHeight: 0 },
  appShellImmersive: { backgroundColor: 'transparent' },
  snowBackdrop: { ...StyleSheet.absoluteFillObject },
  snowBackdropImage: { width: '100%', height: '100%' },
  snowBackdropWash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(248, 252, 255, 0.25)' },
  todayViewport: { backgroundColor: '#E3EDF6' },
  todayShell: { backgroundColor: todayColors.snow, borderColor: todayColors.line },
  todayBackdrop: { position: 'absolute', top: 0, width: '100%' },
  todayIcon: { backgroundColor: todayColors.wash, borderColor: todayColors.line },
  todayHeaderIcon: { backgroundColor: todayColors.paper, borderColor: todayColors.line },
  homeViewport: { flex: 1, minWidth: 0 },
  scroll: { flex: 1 },
  homeContent: { paddingBottom: space.xl },
  homeHero: { width: '100%', position: 'relative', overflow: 'hidden' },
  contentStack: { width: '100%', alignSelf: 'center', paddingHorizontal: space.lg, paddingTop: space.md, gap: space.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  cardTitle: { ...type.title, color: todayColors.ink },
  progressMinutes: { ...type.caption, color: todayColors.muted },
  construction: { marginHorizontal: space.lg, paddingHorizontal: space.md, paddingBottom: space.sm, backgroundColor: todayColors.paper, borderWidth: 1, borderColor: todayColors.line, borderRadius: radii.control },
  constructionLink: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: metrics.hit },
  constructionStage: { ...type.label, color: todayColors.ink, flex: 1, minWidth: 0 },
  timerCard: { gap: space.xs, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.xs, borderColor: todayColors.line, backgroundColor: todayColors.paper },
  timerPip: { width: 45, height: 50, position: 'absolute', right: 51, top: -8 },
  timerControlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm },
  timerReading: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  timerDigits: { fontSize: 36, lineHeight: 43, fontWeight: '800', color: todayColors.ink, fontVariant: ['tabular-nums'], letterSpacing: -1.4 },
  timerDigitsSmall: { fontSize: 32, lineHeight: 39 },
  durationControl: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  durationSymbol: { ...type.heading, color: todayColors.ink },
  durationLabel: { ...type.label, color: todayColors.ink },
  timerButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  focusAction: { flexGrow: 1 },
  switchFocus: { minHeight: metrics.hit, alignSelf: 'flex-start', justifyContent: 'center' },
  switchFocusText: { ...type.label, color: todayColors.link },
  friendsScreen: { flex: 1 },
  friendsContent: { flexGrow: 1, paddingBottom: space.md },
  sharedRoomArtFrame: { width: '100%', position: 'relative', aspectRatio: 2 / 3, borderRadius: radii.scene, overflow: 'hidden', backgroundColor: colors.iceBlue },
  roomTools: { alignSelf: 'center', flexDirection: 'row', marginTop: space.sm, padding: space.xs, borderRadius: radii.control, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  roomTool: { minWidth: 60, minHeight: metrics.hit, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', gap: 2 },
  roomFocusLink: { alignSelf: 'center', marginTop: space.sm },
  roomToolLabel: { ...type.caption, color: colors.ink },
  studyStatus: { position: 'absolute', top: 8, alignSelf: 'center', maxWidth: '94%', borderRadius: radii.control, paddingHorizontal: space.md, paddingVertical: space.xs, backgroundColor: colors.paper },
  studyNotice: { alignSelf: 'flex-end', marginHorizontal: space.lg, marginBottom: space.sm, padding: space.md, borderRadius: radii.control, backgroundColor: colors.paper },
  studyNoticeText: { ...type.caption, color: colors.ink },
});
