import { ProfileProvider, useCompanionName, useStudyProfile } from './src/onboarding/ProfileProvider';
import { FirstStudyDay } from './src/onboarding/FirstStudyDay';
import { StudyProfileScreen } from './src/profile/StudyProfileScreen';
import { BEATS } from './src/onboarding/profile';
import { localDateKey } from './src/state/dailyGoals';
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
import {
  Image, ImageBackground, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { PomodoroProvider, usePomodoro } from './src/state/PomodoroContext';
import { AmbientSoundProvider } from './src/ambient/AmbientSoundProvider';
import { AmbientSoundPanel, AmbientSoundTrigger } from './src/ambient/AmbientSoundControls';
import { constructionProgress } from './src/state/timer';
import { pendingGoalSession } from './src/state/dailyGoals';
import { TodaysGoals, FocusGoalPicker, GoalSessionReview, DailyFocusSummary, TodayGoalCelebration } from './src/components/TodayGoals';
import { colors, radii } from './src/theme';
import { SnowDots, TimerRing } from './src/components/SceneArt';
import { PenguinProvider } from './src/components/Penguin';
import { WinterWorld } from './src/home/winter/WinterWorld';
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
import { DEFAULT_PENGUIN_CUSTOMIZATION, type PenguinCustomization, type ScarfColor } from './src/character/penguinCustomization';

const BG = require('./assets/environments/arctic/arctic-twilight-mobile.jpg');
const INTERIOR = require('./assets/environments/igloo/igloo-interior-mobile.jpg');
type Screen = 'home' | 'igloo' | 'friends' | 'profile' | 'customize' | 'wardrobe';

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
    return preview === 'study-together' ? 'friends' : preview === 'igloo-room' ? 'igloo' : 'home';
  });
  const [nativeOnboardingPreview,setNativeOnboardingPreview]=useState(false);
  const [previewCompleted, setPreviewCompleted] = useState(false);
  const [customization, setCustomization] = useState<PenguinCustomization>(DEFAULT_PENGUIN_CUSTOMIZATION);
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
  const showOnboarding = !profile.completed || (previewMode && !previewCompleted);
  useEffect(() => {
    AsyncStorage.getItem('igloo.pip-customization.v1').then((stored) => {
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<PenguinCustomization>;
      setCustomization({
        scarf: parsed.scarf === 'berry' || parsed.scarf === 'lilac' ? parsed.scarf : 'teal',
        glasses: parsed.glasses === true,
        headphones: parsed.headphones === true,
      });
    }).catch(() => undefined);
  }, []);
  const saveCustomization = (value: PenguinCustomization) => {
    setCustomization(value);
    void AsyncStorage.setItem('igloo.pip-customization.v1', JSON.stringify(value)).catch(() => undefined);
  };
  if (showIglooRoomPreview) return <MainApp screen={screen} setScreen={setScreen} customization={customization} onCustomizationChange={saveCustomization} />;
  if (showStudyTogetherPreview) return <MainApp screen={screen} setScreen={setScreen} customization={customization} onCustomizationChange={saveCustomization} />;
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'winter-home') return <MainApp screen="home" setScreen={setScreen} customization={customization} onCustomizationChange={saveCustomization} />;
  if (showTodayGoalsPreview) return <MainApp screen={screen} setScreen={setScreen} customization={customization} onCustomizationChange={saveCustomization} />;
  if (showCustomizationPreview) return <MainApp screen="customize" setScreen={setScreen} customization={customization} onCustomizationChange={saveCustomization} />;
  if (showWardrobePreview) return <MainApp screen="wardrobe" setScreen={setScreen} customization={customization} onCustomizationChange={saveCustomization} wardrobeDemo />;
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
            setScreen('igloo');
            if(previewMode){setPreviewCompleted(true);setNativeOnboardingPreview(false);}
          }} />
        : <>
          <MainApp screen={screen} setScreen={setScreen} customization={customization} onCustomizationChange={saveCustomization}
            onPreviewOnboarding={__DEV__ ? () => {
              if (typeof window !== 'undefined') window.location.assign('?preview=onboarding');
              else { setPreviewCompleted(false); setNativeOnboardingPreview(true); }
            } : undefined} />
          {!previewMode && <FirstStudyDay onExplore={()=>setScreen('igloo')} enabled={screen === 'home' || screen === 'igloo' || screen === 'friends'} />}
        </>}
    </>
  </DevPreviewRouter>;
}

function MainApp({ screen, setScreen, customization, onCustomizationChange, wardrobeDemo = false, onPreviewOnboarding }: { screen: Screen; setScreen: (screen: Screen) => void; customization: PenguinCustomization; onCustomizationChange: (value: PenguinCustomization) => void; wardrobeDemo?: boolean; onPreviewOnboarding?: () => void }) {
  const { timer } = usePomodoro();
  const [openCoffeeFromMail, setOpenCoffeeFromMail] = useState(false);
  const [revealTimer, setRevealTimer] = useState(false);
  const [showWindow, setShowWindow] = useState(false);
  const [homeRequest, setHomeRequest] = useState<'bed' | 'decorate' | 'help' | null>(null);
  const [wardrobeBack, setWardrobeBack] = useState<'igloo' | 'friends' | 'profile'>('igloo');
  const wearingScarf = timer.home.wardrobe.equipped.neck;
  const wearingGlasses = timer.home.wardrobe.equipped.face === 'round-glasses';
  const roomCustomization = useMemo(() => ({
    ...customization,
    scarf: wearingScarf === 'scarf-berry' ? 'berry' as const : wearingScarf === 'scarf-lavender' ? 'lilac' as const : customization.scarf,
    glasses: customization.glasses || wearingGlasses,
  }), [customization, wearingScarf, wearingGlasses]);
  const openTimer = () => { setRevealTimer(true); setScreen('home'); };
  const openWardrobe = () => { setWardrobeBack(screen === 'friends' || screen === 'profile' ? screen : 'igloo'); setScreen('wardrobe'); };
  const openCoffee = () => { setOpenCoffeeFromMail(true); setScreen('friends'); };
  const { width: viewportWidth } = useWindowDimensions();
  const desktopPreview = viewportWidth > 500;
  const coffee = useCoffeeOrder(timer.mode, timer.status, screen === 'friends');
  const breaks = useBreakActivities(timer, screen === 'friends', coffee);
  const immersiveWorld = screen === 'home' || screen === 'igloo' || screen === 'friends';
  return <View style={styles.appViewport}>
    <View style={[styles.appShellFrame, desktopPreview && styles.appShellFramePreview]}>
    {screen === 'igloo' ? <Svg pointerEvents="none" width="100%" height="100%" style={styles.snowBackdrop}>
      <Defs>
        <LinearGradient id="iglooIce" x1="0" y1="0" x2="0.9" y2="1"><Stop offset="0" stopColor="#b5aee0"/><Stop offset="0.46" stopColor="#c5b6e0"/><Stop offset="1" stopColor="#a7b5df"/></LinearGradient>
        <RadialGradient id="iglooWarm" cx="65%" cy="37%" rx="65%" ry="48%"><Stop offset="0" stopColor="#f8d6bd" stopOpacity=".54"/><Stop offset="1" stopColor="#f8d6bd" stopOpacity="0"/></RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#iglooIce)"/>
      <Rect width="100%" height="100%" fill="url(#iglooWarm)"/>
    </Svg> : immersiveWorld && <><ImageBackground source={BG} resizeMode="cover" style={styles.snowBackdrop} imageStyle={styles.snowBackdropImage} /><View pointerEvents="none" style={styles.snowBackdropWash} /></>}
    <FurnitureController key={screen}>
    <SafeAreaView style={[styles.appShell, immersiveWorld && styles.appShellImmersive]} edges={screen === 'igloo' ? [] : ['top', 'left', 'right', 'bottom']}>
      {screen === 'home' && <HomeScreen customization={roomCustomization} revealTimer={revealTimer} onTimerRevealed={() => setRevealTimer(false)} onGoFriends={() => setScreen('friends')} onOpenAward={() => setScreen('igloo')} onEnteredHome={() => { if (!pendingGoalSession(timer)) setScreen('igloo'); }} />}
      {screen === 'igloo' && <CustomizableHome customization={roomCustomization} onOpenWardrobe={openWardrobe} onOpenTimer={openTimer} onOpenCoffeeMachine={openCoffee}
        onOpenWindow={() => { setShowWindow(true); setScreen('friends'); }} request={homeRequest} onRequestHandled={() => setHomeRequest(null)} />}
      {screen === 'wardrobe' && <PipWardrobeScreen demoMode={wardrobeDemo} backLabel={wardrobeBack === 'friends' ? 'Back to Study Together' : wardrobeBack === 'profile' ? 'Back to You' : 'Back to My Igloo'} onBack={() => setScreen(wardrobeBack)} />}
      {screen === 'friends' && <FriendsScreen customization={roomCustomization} coffee={coffee} breaks={breaks} openCoffeeFromMail={openCoffeeFromMail} onCoffeeOpened={() => setOpenCoffeeFromMail(false)}
        openWindowFromHome={showWindow} onWindowOpened={() => setShowWindow(false)} onOpenTimer={openTimer} onOpenWardrobe={openWardrobe}
        onGiftPlaced={() => setScreen('igloo')} onBed={() => { setHomeRequest('bed'); setScreen('igloo'); }} onCustomizeFurniture={() => { setHomeRequest('decorate'); setScreen('igloo'); }} />}
      {screen === 'profile' && <StudyProfileScreen customization={customization} onWardrobe={openWardrobe} onAccessories={() => setScreen('customize')}
        onIgloo={() => setScreen('igloo')} onHelp={() => { setHomeRequest('help'); setScreen('igloo'); }} onPreviewOnboarding={onPreviewOnboarding} />}
      {screen === 'customize' && <CustomizationScreen customization={customization} onChange={onCustomizationChange} onBack={() => setScreen('profile')} />}
      <AmbientSoundPanel />
      <BottomNav screen={screen === 'wardrobe' ? wardrobeBack === 'profile' ? 'profile' : 'igloo' : screen === 'customize' ? 'profile' : screen}
        setScreen={setScreen} immersive={immersiveWorld} floating={screen === 'igloo'} />
    </SafeAreaView>
    </FurnitureController>
    </View>
  </View>;
}

function HomeScreen({ customization, revealTimer, onTimerRevealed, onGoFriends, onEnteredHome, onOpenAward }: { customization: PenguinCustomization; revealTimer: boolean; onTimerRevealed: () => void; onGoFriends: () => void; onEnteredHome: () => void; onOpenAward: () => void }) {
  const { timer, hydrated, start, pause, finish, setFocusMinutes, startFocus } = usePomodoro();
  const { width, height } = useWindowDimensions();
  const heroHeight = Math.max(330, Math.min(440, width * 0.9, height * 0.5));
  const { progress, stage, minutes, completed } = constructionProgress(timer.focusTotalMs);
  const [worldVisible,setWorldVisible] = useState(true);
  const [reviewProgress,setReviewProgress] = useState<number|null>(null);
  const winterReview = __DEV__ && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'winter-home';
  const time = Math.ceil(timer.remainingMs / 1000);
  const timeLabel = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
  const modeTitle = timer.mode === 'focus' ? 'FOCUS TIME' : timer.mode === 'shortBreak' ? 'SHORT BREATHER' : 'LONG BREATHER';
  const isRunning = timer.status === 'running';
  const scrollRef = useRef<ScrollView>(null);
  const contentTop = useRef<number | null>(null);
  const timerTop = useRef<number | null>(null);
  const revealPendingTimer = () => {
    if (!revealTimer || contentTop.current === null || timerTop.current === null || !scrollRef.current) return;
    scrollRef.current.scrollTo({ y: Math.max(0, contentTop.current + timerTop.current - 12), animated: false });
    onTimerRevealed();
  };
  return <View style={styles.homeViewport}><ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" scrollEventThrottle={100} onScroll={event => {const visible=event.nativeEvent.contentOffset.y<350;setWorldVisible(previous=>previous===visible?previous:visible);}}>
    <View style={[styles.homeHero, { height: heroHeight }]}>

      <View style={styles.homeHead}>
        <View><Text style={styles.homeBrand}>IGLOO</Text><Text style={styles.homeGreeting}>A calmer kind of focus</Text></View>
        <Pressable onPress={onGoFriends} style={styles.friendShortcut} accessibilityLabel="Open friends">
          <View style={styles.friendDot} /><Text style={styles.friendCount}>1</Text>
        </Pressable>
      </View>
      <View style={styles.worldScene}>
        <WinterWorld customization={customization} progress={winterReview && reviewProgress!==null?reviewProgress:progress} active={worldVisible} onEnteredHome={winterReview?undefined:onEnteredHome}/>
      </View>
    </View>

    {winterReview&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:5,padding:10}}>{[0,.2,.35,.5,.7,.9,1].map(p=><Pressable key={p} accessibilityRole="button" onPress={()=>setReviewProgress(p)} style={{padding:9,backgroundColor:'#e7eff3',borderRadius:9}}><Text>{Math.round(p*100)}%</Text></Pressable>)}<Pressable onPress={()=>setReviewProgress(null)} style={{padding:9}}><Text>Live study progress</Text></Pressable></View>}
    <View style={styles.contentStack} onLayout={event => { contentTop.current = event.nativeEvent.layout.y; revealPendingTimer(); }}>
      {__DEV__ && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'pip-reactions' && <StudyTogetherAnimationDebugger />}
      <View style={styles.progressCard}>
        <View style={styles.rowBetween}>
          <View><Text style={styles.eyebrow}>OUR IGLOO</Text><Text style={styles.cardTitle}>{completed ? 'Home, sweet home' : `${Math.floor(minutes)} of 60 minutes`}</Text></View>
          <View style={styles.progressBadge}><Text style={styles.progressBadgeText}>{Math.round(progress * 100)}%</Text></View>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(2, progress * 100)}%` }]} /></View>
        <View style={styles.rowBetween}><Text style={styles.progressHint}>{completed ? 'You made a warm little place.' : ['A blank patch of snow', 'First snow blocks!', 'A sturdy foundation', 'The walls are rising', 'The dome is taking shape', 'Your igloo is complete'][stage]}</Text><Text style={styles.progressMinutes}>{Math.max(0, 60 - Math.floor(minutes))} min left</Text></View>
      </View>

      <TodaysGoals />
      <View style={styles.timerCard} onLayout={event => { timerTop.current = event.nativeEvent.layout.y; revealPendingTimer(); }}>
        <View style={styles.rowBetween}>
          <View><Text style={styles.eyebrow}>{modeTitle}</Text><Text style={styles.timerHelper}>{timer.mode === 'focus' ? 'One gentle step at a time' : 'Rest is part of the rhythm'}</Text></View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {!worldVisible && <View style={{ width: 58, height: 67 }}>
              <SeatedPipReactions customization={customization} alwaysStudying allowAmbientCoffee={false} />
            </View>}
            <TimerRing size={58} progress={timer.durationMs ? 1 - timer.remainingMs / timer.durationMs : 0} />
          </View>
        </View>
        <FocusGoalPicker />
        <AmbientSoundTrigger placement="timer" />
        <View style={styles.timerControlsRow}>
          <Text style={styles.timerDigits}>{timeLabel}</Text>
          <View style={styles.timerButtons}>
            <Pressable disabled={!hydrated} accessibilityRole="button" accessibilityState={{ disabled: !hydrated }} onPress={isRunning ? pause : start} style={({ pressed }) => [styles.timerMainButton, pressed && styles.pressed, !hydrated && { opacity: 0.5 }]}>
              <Text style={styles.timerMainButtonText}>{isRunning ? 'PAUSE' : timer.status === 'paused' ? 'RESUME' : timer.mode === 'focus' ? 'START FOCUS' : 'START BREAK'}</Text>
            </Pressable>
            {(timer.status === 'running' || timer.status === 'paused') && <Pressable onPress={finish} style={styles.finishButton}><Text style={styles.finishText}>FINISH</Text></Pressable>}
          </View>
        </View>
        <View style={styles.timerFooter}>
          {timer.mode === 'focus' && timer.status === 'idle' ? <View style={styles.durationControl}>
            <Pressable accessibilityLabel="Shorten focus session" onPress={() => setFocusMinutes(timer.focusMinutes - 5)} style={styles.durationButton}><Text style={styles.durationSymbol}>−</Text></Pressable>
            <Text style={styles.durationLabel}>{timer.focusMinutes} min focus</Text>
            <Pressable accessibilityLabel="Extend focus session" onPress={() => setFocusMinutes(timer.focusMinutes + 5)} style={styles.durationButton}><Text style={styles.durationSymbol}>+</Text></Pressable>
          </View> : timer.mode === 'focus' ? <Text style={styles.durationLabel}>{timer.durationMs / 60_000} min focus</Text> : <Pressable onPress={() => startFocus()} style={styles.switchFocus}><Text style={styles.switchFocusText}>BACK TO FOCUS</Text></Pressable>}
          <Text style={styles.sessionCount}>{timer.completedSessions} {timer.completedSessions === 1 ? 'session' : 'sessions'} complete</Text>
        </View>
        {timer.awards.pending.length > 0 && !(timer.mode === 'focus' && timer.status !== 'idle') &&
          <Pressable accessibilityRole="button" onPress={onOpenAward} style={styles.switchFocus}>
            <Text style={styles.switchFocusText}>✦ A gift is waiting in My Igloo</Text>
          </Pressable>}
      </View>
      <View style={styles.snowflakePill}><Text style={styles.snowflakePillCount}>❄ {timer.home.snowflakes === Infinity ? 'Unlimited' : timer.home.snowflakes} Snowflakes</Text>{timer.home.snowflakes !== Infinity && <Text style={styles.snowflakePillHint}>Earned by focusing</Text>}</View>
      <GoalSessionReview />
      <DailyFocusSummary />
      <Text style={styles.encouragement}>{completed ? 'You brought a little warmth into the world.' : 'No rush. Your penguin is happy you’re here.'}</Text>
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

function StudyControl({ icon, label, onPress, compact = false }: {
  icon: keyof typeof studyIcons; label: string; onPress: () => void; compact?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => [compact ? styles.studyHeaderIcon : styles.roomTool, pressed && styles.pressed]}>
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#4d536c" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round">
      <Path d={studyIcons[icon]} />
    </Svg>
    {!compact && <Text style={styles.roomToolLabel}>{label}</Text>}
  </Pressable>;
}

function FriendsScreen({ customization, coffee, breaks, openCoffeeFromMail, onCoffeeOpened, openWindowFromHome, onWindowOpened, onOpenTimer, onOpenWardrobe, onBed, onCustomizeFurniture, onGiftPlaced }: {
  customization: PenguinCustomization; coffee: ReturnType<typeof useCoffeeOrder>; breaks: ReturnType<typeof useBreakActivities>;
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
  const drinkStatus = coffeeStatus(coffee);
  const roomWidth = Math.min(430, width - 12, pageHeight ? Math.max(160, (pageHeight - 108) * 2 / 3) : 320);
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
    <View style={styles.studyHeader}>
      <Text accessibilityRole="header" style={styles.studyTitle}>Study Together</Text>
      <View style={styles.studyHeaderActions}>
        <StudyControl compact icon="friends" label="Friends" onPress={() => setFriendsOpen(value => !value)} />
        <StudyControl compact icon="settings" label="Room settings" onPress={() => {
          setFriendsOpen(false);
          breaks.setMenu(false);
          setOpenControls(value => value === 'scenery' ? null : 'scenery');
        }} />
      </View>
      {friendsOpen && <View style={styles.studyNotice}><Text accessibilityLiveRegion="polite" style={styles.studyNoticeText}>Invitations are not available yet.</Text></View>}
    </View>
    <View style={{ width: roomWidth, alignSelf: 'center' }} onLayout={event => { roomBounds.current=event.nativeEvent.layout; }}>
      <View testID="study-room-scene" style={styles.sharedRoomArtFrame} onLayout={event=>{artBounds.current=event.nativeEvent.layout;}}>
        <StudyTogetherLottieCharacters customization={customization} roomId={roomId} windowScene={windowScene} lighting={timer.home.lighting} reactToPomodoro
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

function CustomizationScreen({ customization, onChange, onBack }: { customization: PenguinCustomization; onChange: (value: PenguinCustomization) => void; onBack: () => void }) {
  const companion=useCompanionName();
  const setScarf = (scarf: ScarfColor) => onChange({ ...customization, scarf });
  const toggle = (key: 'glasses' | 'headphones') => onChange({ ...customization, [key]: !customization[key] });
  return <ScrollView style={styles.profileScreen} contentContainerStyle={styles.customizationContent} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.accessoryBack}><Text style={styles.accessoryTitle}>‹ Back to You</Text></Pressable>
    <View style={styles.profileHead}><Text style={styles.eyebrow}>A LITTLE PERSONAL TOUCH</Text><Text style={styles.screenTitle}>{companion}’s accessories</Text><Text style={styles.screenSubtitle}>Your choices follow {companion} into My Igloo and Study Together.</Text></View>
    <View style={styles.customizationPreview}><StudyTogetherLottieCharacters customization={customization} /></View>
    <View style={styles.customizationCard}>
      <Text style={styles.eyebrow}>SCARF COLOR</Text>
      <View style={styles.customChoiceRow}>{([
        ['teal', 'Ocean teal', '#4C9994'], ['berry', 'Berry rose', '#C76482'], ['lilac', 'Soft lilac', '#9582BD'],
      ] as [ScarfColor, string, string][]).map(([id, label, color]) => <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Choose ${label} scarf`} accessibilityState={{ selected: customization.scarf === id }} onPress={() => setScarf(id)} style={[styles.colorChoice, customization.scarf === id && styles.colorChoiceActive]}><View style={[styles.colorSwatch, { backgroundColor: color }]} /><Text style={[styles.colorChoiceText, customization.scarf === id && styles.choiceActiveText]}>{label}</Text></Pressable> )}</View>
      <Text style={[styles.eyebrow, { marginTop: 22 }]}>ACCESSORIES</Text>
      {(['glasses', 'headphones'] as const).map((key) => <Pressable key={key} accessibilityRole="switch" accessibilityLabel={`Toggle ${key}`} accessibilityState={{ checked: customization[key] }} onPress={() => toggle(key)} style={styles.accessoryToggle}><View><Text style={styles.accessoryTitle}>{key === 'glasses' ? 'Round reading glasses' : 'Cozy headphones'}</Text><Text style={styles.accessorySub}>{customization[key] ? `${companion} is wearing them` : 'Tap to add them'}</Text></View><View style={[styles.toggleTrack, customization[key] && styles.toggleTrackOn]}><View style={[styles.toggleThumb, customization[key] && styles.toggleThumbOn]} /></View></Pressable>)}
    </View>
    <View style={styles.savedNote}><Text style={styles.savedNoteText}>Saved automatically for both rooms</Text></View>
  </ScrollView>;
}

function BottomNav({ screen, setScreen, immersive = false, floating = false }: { screen: Screen; setScreen: (screen: Screen) => void; immersive?: boolean; floating?: boolean }) {
  const insets = useSafeAreaInsets();
  const tabs: { id: Screen; label: string }[] = [
    { id: 'home', label: 'Today' }, { id: 'igloo', label: 'Igloo' }, { id: 'friends', label: 'Friends' }, { id: 'profile', label: 'You' },
  ];
  return <View accessibilityRole="tablist" accessibilityLabel="Main navigation" style={[styles.bottomNav, immersive && styles.bottomNavImmersive, floating && styles.bottomNavFloating, floating && {bottom: Math.max(10, insets.bottom)}]}>{tabs.map((tab) => {
    const active = screen === tab.id;
    return <Pressable key={tab.id} onPress={() => setScreen(tab.id)} style={[styles.navItem, active && styles.navItemActive, floating && active && styles.navItemActiveIgloo]} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected: active }}>
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
  studyHeader: { height: 50, marginHorizontal: 14, zIndex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  studyTitle: { color: '#393e56', fontSize: 22, fontWeight: '800', letterSpacing: -.6 },
  studyHeaderActions: { flexDirection: 'row', gap: 6 },
  studyHeaderIcon: { width: 44, height: 44, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f2f9c4' },
  roomTools: { alignSelf: 'center', flexDirection: 'row', marginTop: 5, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 17, backgroundColor: '#f6f2fae8', borderWidth: 1, borderColor: '#faf5ed', boxShadow: '0px 4px 12px #52496622' },
  roomTool: { minWidth: 56, minHeight: 44, paddingHorizontal: 3, borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 2 },
  roomToolLabel: { color: '#4d536c', fontSize: 10, fontWeight: '800' },
  studyStatus: { position: 'absolute', top: 8, alignSelf: 'center', maxWidth: '94%', borderRadius: 13, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#faf3e7ed' },
  studyNotice: { position: 'absolute', top: 48, right: 0, padding: 12, borderRadius: 13, backgroundColor: '#faf3e7', boxShadow: '0px 4px 14px #52496633' },
  studyNoticeText: { color: '#4d435b', fontSize: 13 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ice }, loadingMark: { color: colors.tealDark, fontSize: 15, fontWeight: '900', letterSpacing: 5 },
  welcome: { position: 'relative', flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', overflow: 'hidden', backgroundColor: colors.ice }, celebration: { backgroundColor: '#EDF2F1' }, naming: { backgroundColor: colors.ice }, celebrationContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingTop: 16 }, celebrationPenguin: { height: 238, width: 248, alignItems: 'center', justifyContent: 'center' }, celebrationPenguinImage: { width: 190, height: 220 }, namingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 34 }, namingPenguin: { width: 280, height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, celebrationTitle: { color: '#172328', fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -1, textAlign: 'center', marginTop: 4 }, celebrationSubtitle: { color: '#61757B', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, maxWidth: 300 }, celebrationBottom: { paddingHorizontal: 24, paddingBottom: 18 }, hatchBackground: { width: '100%', height: '100%' }, backgroundImage: { width: '100%' }, welcomeTop: { paddingHorizontal: 25, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, brand: { color: '#3C5A66', fontSize: 12, fontWeight: '900', letterSpacing: 3.8 }, progressDots: { flexDirection: 'row', gap: 6, alignItems: 'center' }, progressDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: '#B7C7CE' }, progressDotActive: { width: 20, backgroundColor: '#597783' }, welcomeCopy: { paddingHorizontal: 26, paddingTop: 30 },
  welcomeTitle: { color: '#1A2327', fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -1.1 }, welcomeSub: { color: '#57666C', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 290 },
  hatchStage: { position: 'relative', flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 270, marginTop: -3 }, welcomeGlow: { position: 'absolute', width: 230, height: 230, borderRadius: 120, backgroundColor: '#FFF9E9', opacity: .52, top: '32%' }, eggTouchTarget: { width: 286, height: 372, alignItems: 'center', justifyContent: 'center' }, eggArt: { width: '100%', height: '100%' }, hatchPenguin: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'flex-end' }, hatchPenguinImage: { width: 190, height: 220 },
  welcomeBottom: { paddingHorizontal: 25, paddingBottom: 18, minHeight: 88, justifyContent: 'flex-end' }, welcomeCaption: { textAlign: 'center', color: '#526F7C', fontSize: 14, lineHeight: 21, marginBottom: 14 }, snowflake: { position: 'absolute', borderRadius: 6, backgroundColor: '#FFFFFF' }, primaryButton: { height: 58, borderRadius: 19, backgroundColor: '#3C5A66', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#3C5A66', shadowOpacity: .16, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  primaryButtonText: { color: '#F7FCFA', fontWeight: '800', fontSize: 12, letterSpacing: 1.5 }, buttonArrow: { color: '#D5EEE9', fontSize: 18, marginTop: -2 }, pressed: { transform: [{ scale: .98 }], opacity: .92 }, softFoot: { textAlign: 'center', color: '#8CA2AF', fontSize: 11, marginTop: 13 },
  appShellFrame: { flex: 1, width: '100%', maxWidth: 430, minWidth: 0, alignSelf: 'center', position: 'relative', overflow: 'hidden', backgroundColor: '#F7FBFD' }, appShellFramePreview: { borderRadius: 26, borderWidth: 1, borderColor: 'rgba(85, 111, 126, 0.12)' },
  appViewport: { flex: 1, width: '100%', minWidth: 0, alignSelf: 'stretch', position: 'relative', overflow: 'hidden', backgroundColor: '#D8EDF6' }, snowBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 0 }, snowBackdropImage: { width: '100%', height: '100%' }, snowBackdropWash: { ...StyleSheet.absoluteFillObject, zIndex: 0, backgroundColor: 'rgba(236, 247, 250, 0.12)' }, appShell: { flex: 1, width: '100%', maxWidth: 430, minWidth: 0, flexShrink: 1, alignSelf: 'center', backgroundColor: '#F7FBFD' }, appShellImmersive: { backgroundColor: 'transparent' }, homeViewport: { flex: 1, width: '100%', minWidth: 0, backgroundColor: 'transparent' }, scroll: { flex: 1, width: '100%', minWidth: 0, backgroundColor: 'transparent' }, homeContent: { paddingBottom: 18, backgroundColor: 'transparent' }, homeHero: { width: '100%', overflow: 'visible', backgroundColor: 'transparent' }, homeHead: { zIndex: 2, paddingTop: 12, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, homeBrand: { color: colors.tealDark, fontSize: 12, fontWeight: '900', letterSpacing: 3.4 }, homeGreeting: { color: '#6D8797', fontSize: 11, marginTop: 4 }, friendShortcut: { height: 40, minWidth: 48, paddingHorizontal: 11, borderRadius: 20, backgroundColor: '#F9FDFFDD', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#FFFFFF' }, friendDot: { width: 8, height: 8, borderRadius: 5, backgroundColor: '#82B696' }, friendCount: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  worldScene: { position: 'absolute', left: 0, right: 0, top: 92, bottom: 16 }, iglooPosition: { position: 'absolute', right: 18, bottom: 58, opacity: .92 }, heroPenguin: { marginBottom: 0 }, worldCaption: { position: 'absolute', bottom: 12, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F7FCFFCC' }, worldCaptionText: { color: '#678294', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  contentStack: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 16, marginTop: -20, gap: 12 }, progressCard: { backgroundColor: 'rgba(250, 253, 252, 0.88)', borderRadius: radii.card, padding: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.74)', shadowColor: '#7893A3', shadowOpacity: .13, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { fontSize: 9, fontWeight: '900', color: colors.teal, letterSpacing: 1.45 }, cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 4, letterSpacing: -.3 }, progressBadge: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#EEF7F8', alignItems: 'center', justifyContent: 'center' }, progressBadgeText: { color: colors.tealDark, fontSize: 12, fontWeight: '900' }, progressTrack: { height: 7, backgroundColor: '#EAF2F5', borderRadius: 5, overflow: 'hidden', marginTop: 14 }, progressFill: { height: '100%', borderRadius: 5, backgroundColor: '#75A9A4' }, progressHint: { color: '#7890A0', fontSize: 11, marginTop: 9 }, progressMinutes: { color: '#97AAB4', fontSize: 10, fontWeight: '700' }, snowflakePill: { alignSelf: 'center', width: '94%', maxWidth: 560, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 17, backgroundColor: 'rgba(252, 253, 249, 0.82)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', shadowColor: '#7893A3', shadowOpacity: .08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 }, snowflakePillCount: { color: colors.tealDark, fontSize: 12, fontWeight: '800' }, snowflakePillHint: { color: '#7890A0', fontSize: 10, fontWeight: '600' },
  timerCard: { backgroundColor: 'rgba(248, 253, 252, 0.9)', borderRadius: radii.card, padding: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.78)', shadowColor: '#7893A3', shadowOpacity: .1, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, elevation: 2 }, timerHelper: { color: '#7890A0', fontSize: 11, marginTop: 5 }, timerControlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }, timerDigits: { color: colors.ink, fontSize: 42, fontWeight: '300', letterSpacing: -2.5, fontVariant: ['tabular-nums'] }, timerButtons: { alignItems: 'flex-end', gap: 7 }, timerMainButton: { minWidth: 116, height: 42, borderRadius: 15, backgroundColor: colors.tealDark, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, timerMainButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 10, letterSpacing: 1.1 }, finishButton: { paddingHorizontal: 14, height: 30, justifyContent: 'center' }, finishText: { color: '#89A0AA', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, timerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#DDE9EA', marginTop: 10 }, durationControl: { flexDirection: 'row', alignItems: 'center', gap: 9 }, durationButton: { width: 27, height: 27, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, durationSymbol: { color: colors.tealDark, fontSize: 17, lineHeight: 20 }, durationLabel: { color: '#617B86', fontSize: 10, fontWeight: '800' }, sessionCount: { color: '#9AAEB5', fontSize: 10 }, switchFocus: { paddingVertical: 5 }, switchFocusText: { color: colors.tealDark, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, encouragement: { textAlign: 'center', color: '#8AA0AE', fontSize: 11, paddingVertical: 4 },
  bottomNav: { height: 72, borderTopWidth: 1, borderTopColor: '#E7EEF1', backgroundColor: '#FBFDFD', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, paddingBottom: 3 }, bottomNavImmersive: { backgroundColor: 'rgba(247, 252, 252, 0.52)', borderTopColor: 'rgba(255, 255, 255, 0.38)' }, bottomNavFloating: { position: 'absolute', left: 12, right: 12, bottom: 10, height: 62, borderRadius: 20, backgroundColor: 'rgba(241, 236, 250, 0.88)', borderWidth: 1, borderTopColor: 'rgba(255,255,255,0.72)', borderColor: 'rgba(255,255,255,0.58)', paddingBottom: 0, shadowColor:'#514168',shadowOpacity:.15,shadowRadius:14,shadowOffset:{width:0,height:5},elevation:5 }, navItem: { flex: 1, minHeight: 54, marginHorizontal: 3, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3 }, navItemActive: { backgroundColor: '#E8F3F1' }, navItemActiveIgloo:{backgroundColor:'rgba(255,255,255,.56)'}, navLabel: { color: '#879BA6', fontSize: 10, fontWeight: '600' }, navLabelActive: { color: colors.tealDark, fontWeight: '800' },
  secondaryScreen: { flex: 1, paddingHorizontal: 20, paddingTop: 26 }, secondaryHeader: { marginBottom: 16 }, screenTitle: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -.9, marginTop: 7 }, screenSubtitle: { color: '#526D7C', fontSize: 13, marginTop: 8 }, iglooScreen: { flex: 1, backgroundColor: 'transparent' }, iglooContent: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 22, paddingBottom: 26 }, iglooArtFrame: { width: '100%', maxWidth: 390, aspectRatio: 2 / 3, borderRadius: 22, overflow: 'hidden', flexShrink: 0 }, iglooArtImage: { width: '100%', height: '100%' }, iglooProgress: { width: '100%', maxWidth: 390, padding: 17, marginTop: 14, borderRadius: 22, backgroundColor: '#FFFDF8E8', borderWidth: 1, borderColor: '#E5E9E8' }, decorationRow: { flexDirection: 'row', gap: 8, width: '100%', maxWidth: 390, marginTop: 12 }, decoration: { flex: 1, minHeight: 98, borderRadius: 19, backgroundColor: '#FFFFFFE8', padding: 10, alignItems: 'center', justifyContent: 'center' }, decorationLocked: { opacity: .62 }, decorationDot: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#EEF3F5', alignItems: 'center', justifyContent: 'center' }, decorationDotOpen: { backgroundColor: '#EFF6E9' }, decorationGlyph: { color: colors.tealDark, fontWeight: '800' }, decorationLabel: { textAlign: 'center', color: colors.ink, fontSize: 9, fontWeight: '700', marginTop: 6 }, decorationStatus: { color: '#91A6AF', fontSize: 8, fontWeight: '900', marginTop: 4, letterSpacing: .8 },
  friendsScreen: { flex: 1, backgroundColor: 'transparent' },
  friendsContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 3 },
  sharedRoomArtFrame: { width: '100%', position: 'relative', aspectRatio: 2 / 3, borderRadius: 16, overflow: 'hidden', backgroundColor: '#DCEAF1' },
  profileScreen: { flex: 1, backgroundColor: '#F7FBFD' }, profileHead: { marginTop: 10, marginBottom: 15 },
  accessoryBack: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 7 },
  customizationContent: { padding: 16, paddingBottom: 28 }, customizationPreview: { width: '100%', maxWidth: 260, aspectRatio: 2 / 3, alignSelf: 'center', overflow: 'hidden', borderRadius: 24, backgroundColor: '#DCEAF1', borderWidth: 1, borderColor: '#E3EAEA' }, customizationCard: { marginTop: 14, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 22 }, customChoiceRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, colorChoice: { flex: 1, minHeight: 67, backgroundColor: '#F7FAFA', borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: '#ECF1F1', paddingHorizontal: 3 }, colorChoiceActive: { borderColor: '#8AB3AB', backgroundColor: '#F0F8F5' }, colorSwatch: { width: 20, height: 20, borderRadius: 7, borderWidth: 2, borderColor: '#FFFFFF' }, colorChoiceText: { fontSize: 9, fontWeight: '700', color: '#718A95', textAlign: 'center' }, choiceActiveText: { color: colors.tealDark }, accessoryToggle: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEF2F3', paddingVertical: 10 }, accessoryTitle: { color: colors.ink, fontSize: 12, fontWeight: '700' }, accessorySub: { color: '#93A4AC', fontSize: 10, marginTop: 3 }, toggleTrack: { width: 44, height: 26, borderRadius: 14, backgroundColor: '#DDE5E7', padding: 3, justifyContent: 'center' }, toggleTrackOn: { backgroundColor: '#6AA29A' }, toggleThumb: { width: 20, height: 20, borderRadius: 11, backgroundColor: '#FFFFFF', shadowColor: '#294C50', shadowOpacity: .12, shadowRadius: 3, elevation: 1 }, toggleThumbOn: { alignSelf: 'flex-end' }, savedNote: { alignItems: 'center', padding: 14 }, savedNoteText: { color: '#8299A1', fontSize: 10, fontWeight: '700' },
});
