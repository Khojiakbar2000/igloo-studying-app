import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as NativeAnimated, Image, ImageBackground, KeyboardAvoidingView, PanResponder,
  Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { Easing, FadeIn, FadeInUp, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { Penguin } from '../components/Penguin';
import { IglooChairJourney } from '../components/IglooChairJourney';
import type { CharacterAction, CharacterEmotion, OnboardingChapter } from '../character/CharacterBehaviorController';
import { useCharacterBehavior } from '../character/CharacterBehaviorController';
import { RiveHatchery } from '../components/RiveHatchery';
import { Egg, Igloo, TimerRing } from '../components/SceneArt';
import { constructionProgress } from '../state/timer';
import { usePomodoro } from '../state/PomodoroContext';

const ARCTIC = require('../../assets/environments/arctic/hatch-onboarding.png');
const ARCTIC_TWILIGHT = require('../../assets/environments/arctic/arctic-twilight.png');
const IGLOO_INTERIOR = require('../../assets/environments/igloo/igloo-interior-master.png');
const IGLOO_EXTERIOR = require('../../assets/environments/igloo/igloo-exterior-master.png');
const IGLOO_STAGES = [
  require('../../assets/illustrations/igloo/stages/igloo-stage-1.jpg'),
  require('../../assets/illustrations/igloo/stages/igloo-stage-2.jpg'),
  require('../../assets/illustrations/igloo/stages/igloo-stage-3.jpg'),
  require('../../assets/illustrations/igloo/stages/igloo-stage-4.jpg'),
  require('../../assets/illustrations/igloo/stages/igloo-stage-5.jpg'),
];
const ONBOARDING_KEY = 'igloo.onboarding.v2';

export type PreviewStage = 'onboarding' | 'egg' | 'hatching' | 'celebration' | 'name' | 'penguin-name' | 'personality' | 'activity' | 'home' | 'build' | 'progress' | 'duration' | 'commitment' | 'focus' | 'completion' | null;
type Step = 'intro' | 'egg' | 'hatching' | 'celebration' | 'userName' | 'penguinName' | 'personality' | 'activity' | 'discovery' | 'tutorial' | 'progress' | 'duration' | 'commitment' | 'firstFocus' | 'focusRunning' | 'completion';
type Activity = 'Studying' | 'Coding' | 'Reading' | 'Writing' | 'Something else';
type SavedOnboarding = { step: Step; userName: string; penguinName: string; activity: Activity; duration: number; placedBlock: boolean };

const blank: SavedOnboarding = { step: 'intro', userName: '', penguinName: '', activity: 'Studying', duration: 25, placedBlock: false };
const previewSteps: Partial<Record<Exclude<PreviewStage, null>, Step>> = {
  egg: 'egg', hatching: 'hatching', celebration: 'celebration', name: 'userName', 'penguin-name': 'penguinName',
  personality: 'personality', activity: 'activity', home: 'discovery', build: 'tutorial', progress: 'progress', duration: 'duration', commitment: 'commitment', focus: 'firstFocus', completion: 'completion',
};
const chapterForStep: Record<Step, OnboardingChapter> = {
  intro: 1, egg: 1, hatching: 1, celebration: 1, userName: 2, penguinName: 2,
  personality: 3, activity: 4, discovery: 5, tutorial: 6, progress: 7, duration: 8,
  commitment: 9, firstFocus: 10, focusRunning: 10, completion: 10,
};
const chapterPerformance: Record<Step, { emotion: CharacterEmotion; action: CharacterAction; dialogue: string }> = {
  intro: { emotion: 'curious', action: 'approach', dialogue: 'Hey! I’m in here…' },
  egg: { emotion: 'surprised', action: 'react', dialogue: 'Did you see that egg move?' },
  hatching: { emotion: 'surprised', action: 'hatch', dialogue: 'One second…!' },
  celebration: { emotion: 'excited', action: 'celebrate', dialogue: 'You found me!' },
  userName: { emotion: 'happy', action: 'wave', dialogue: 'Hi! What should I call you?' },
  penguinName: { emotion: 'curious', action: 'react', dialogue: 'I don’t have a name yet…' },
  personality: { emotion: 'curious', action: 'discover', dialogue: 'Wait… what is that?' },
  activity: { emotion: 'thinking', action: 'react', dialogue: 'What are we working on today?' },
  discovery: { emotion: 'surprised', action: 'discover', dialogue: 'We could make a cozy home here!' },
  tutorial: { emotion: 'playful', action: 'carry', dialogue: 'You place this one. I’ll bring the next!' },
  progress: { emotion: 'proud', action: 'react', dialogue: 'Every focused minute adds a little more.' },
  duration: { emotion: 'thinking', action: 'react', dialogue: 'Pick a pace that feels kind today.' },
  commitment: { emotion: 'encouraging', action: 'wave', dialogue: 'One small step, together.' },
  firstFocus: { emotion: 'excited', action: 'reach', dialogue: 'I’ll get our study space ready.' },
  focusRunning: { emotion: 'focused', action: 'study', dialogue: 'Okay. One page at a time.' },
  completion: { emotion: 'proud', action: 'celebrate', dialogue: 'Look what we made!' },
};

export function OnboardingFlow({ previewStage, onComplete }: { previewStage: PreviewStage; onComplete: () => void }) {
  const { timer, hydrated: timerHydrated, startFocus, pause, start, setFocusMinutes } = usePomodoro();
  const preview = previewStage !== null;
  const reducedMotion = useReducedMotion();
  const initialStep = previewStage && previewStage !== 'onboarding' ? previewSteps[previewStage] ?? 'intro' : 'intro';
  const [data, setData] = useState<SavedOnboarding>({ ...blank, step: initialStep });
  const [hydrated, setHydrated] = useState(preview);
  const [eggReady, setEggReady] = useState(false);
  const [penguinVisible, setPenguinVisible] = useState(initialStep === 'celebration' || initialStep === 'userName' || initialStep === 'penguinName');
  const [personalityDiscovered, setPersonalityDiscovered] = useState(false);
  const [customName, setCustomName] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [buildStage, setBuildStage] = useState(0);
  const [dragComplete, setDragComplete] = useState(false);
  const [sessionStartTotal, setSessionStartTotal] = useState<number | null>(null);
  const drag = useRef(new NativeAnimated.ValueXY()).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const locked = useRef(false);
  const activeStep = data.step;
  const chapter = chapterForStep[activeStep];
  const { behavior, perform, reset: resetCharacter } = useCharacterBehavior(chapter);
  const setStep = (step: Step) => setData((current) => ({ ...current, step }));
  const setValue = <K extends keyof SavedOnboarding>(key: K, value: SavedOnboarding[K]) => setData((current) => ({ ...current, [key]: value }));
  const focusTime = Math.ceil(timer.remainingMs / 1000);
  const focusLabel = `${String(Math.floor(focusTime / 60)).padStart(2, '0')}:${String(focusTime % 60).padStart(2, '0')}`;
  const progress = useMemo(() => constructionProgress(timer.focusTotalMs), [timer.focusTotalMs]);
  const stepIndex = useMemo(() => ({ intro: 0, egg: 0, hatching: 0, celebration: 0, userName: 1, penguinName: 1, personality: 2, activity: 3, discovery: 4, tutorial: 5, progress: 6, duration: 7, commitment: 8, firstFocus: 9, focusRunning: 9, completion: 9 }[activeStep]), [activeStep]);

  useEffect(() => {
    resetCharacter(chapter);
    perform({ chapter, ...chapterPerformance[activeStep], priority: 4 });
  }, [activeStep, chapter, perform, resetCharacter]);

  useEffect(() => {
    if (preview) { setHydrated(true); return; }
    let alive = true;
    AsyncStorage.getItem(ONBOARDING_KEY).then((raw) => {
      if (!alive) return;
      if (raw) {
        try {
          const saved = { ...blank, ...JSON.parse(raw) } as SavedOnboarding;
          // If the app closed during hatching, let the user tap through that beat again.
          if (saved.step === 'hatching') saved.step = 'egg';
          setData(saved);
        } catch { setData(blank); }
      }
      setHydrated(true);
    }).catch(() => { if (alive) setHydrated(true); });
    return () => { alive = false; };
  }, [preview]);

  useEffect(() => {
    if (preview || !hydrated || activeStep === 'focusRunning') return;
    const saved = { ...data, step: activeStep === 'hatching' ? 'egg' : activeStep };
    void AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(saved)).catch(() => undefined);
  }, [activeStep, data, hydrated, preview]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (activeStep !== 'hatching' || previewStage !== 'hatching' || !eggReady) return;
    setEggTap(1);
    const crackTwo = setTimeout(() => setEggTap(2), 820);
    const breakShell = setTimeout(() => setEggTap(3), 1_950);
    const appear = setTimeout(() => setPenguinVisible(true), 3_050);
    const happy = setTimeout(() => perform({ emotion: 'happy', action: 'react', dialogue: 'Here I am!', priority: 5, durationMs: 1_100 }), 4_250);
    const celebrate = setTimeout(() => setStep('celebration'), 5_400);
    timers.current.push(crackTwo, breakShell, appear, happy, celebrate);
  }, [activeStep, eggReady, previewStage, perform]);

  useEffect(() => {
    if (activeStep === 'progress') setBuildStage(1);
  }, [activeStep]);

  useEffect(() => {
    if (activeStep === 'focusRunning' && sessionStartTotal !== null && timer.focusTotalMs > sessionStartTotal) setStep('completion');
  }, [activeStep, sessionStartTotal, timer.focusTotalMs]);

  useEffect(() => {
    if (!timerHydrated || activeStep !== 'firstFocus' || !['running', 'paused'].includes(timer.status) || timer.mode !== 'focus') return;
    setSessionStartTotal(timer.focusTotalMs);
    setStep('focusRunning');
  }, [activeStep, timer.focusTotalMs, timer.mode, timer.status, timerHydrated]);

  const celebrate = (dialogue = 'Yes!') => perform({ emotion: 'excited', action: 'celebrate', dialogue, priority: 5, durationMs: 1_350 });
  const nextStep = (step: Step) => setStep(step);
  const startEggStory = () => setStep('egg');
  const backStep: Partial<Record<Step, Step>> = {
    egg: 'intro', userName: 'celebration', penguinName: 'userName', personality: 'penguinName', activity: 'personality',
    discovery: 'activity', tutorial: 'discovery', progress: 'tutorial', duration: 'progress', commitment: 'duration', firstFocus: 'commitment',
  };

  const tapEgg = () => {
    if (activeStep !== 'egg' || !eggReady || locked.current) return;
    const next = Math.min(3, data.step === 'egg' ? eggTapRef.current + 1 : 1);
    eggTapRef.current = next;
    locked.current = true;
    setEggTap(next);
    if (next < 3) {
      const id = setTimeout(() => { locked.current = false; }, next === 1 ? 790 : 1_180);
      timers.current.push(id);
      return;
    }
    setStep('hatching');
    timers.current.push(setTimeout(() => {
      setPenguinVisible(true);
      timers.current.push(setTimeout(() => perform({ emotion: 'surprised', action: 'react', dialogue: 'Oh! Hello there!', priority: 5, durationMs: 1_100 }), reducedMotion ? 0 : 1_180));
    }, reducedMotion ? 260 : 1_080));
    timers.current.push(setTimeout(() => {
      setStep('celebration');
      if (!preview) void AsyncStorage.setItem('igloo.has-hatched.v1', 'true').catch(() => undefined);
    }, reducedMotion ? 1_350 : 4_000));
  };

  const eggTapRef = useRef(0);
  const [eggTap, setEggTap] = useState(0);
  useEffect(() => { if (activeStep === 'intro') { eggTapRef.current = 0; setEggTap(0); } }, [activeStep]);
  const choosePenguinName = (name: string) => { setValue('penguinName', name); setCustomName(false); celebrate(`${name}? I love it!`); };
  const discoverPersonality = () => {
    if (personalityDiscovered) return;
    setPersonalityDiscovered(true);
    perform({ emotion: 'playful', action: 'reach', dialogue: 'It rolls! I want to see where it goes.', priority: 5, durationMs: 1_700 });
  };
  const placeBlock = () => {
    if (dragComplete) return;
    setDragComplete(true);
    setValue('placedBlock', true);
    NativeAnimated.spring(drag, { toValue: { x: 95, y: -62 }, useNativeDriver: false, damping: 12, stiffness: 125 }).start();
    perform({ emotion: 'proud', action: 'place', dialogue: 'It fits! I’ll bring the next one.', priority: 5, durationMs: 1_700 });
  };
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !dragComplete,
    onMoveShouldSetPanResponder: (_, gesture) => !dragComplete && (Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4),
    onPanResponderMove: NativeAnimated.event([null, { dx: drag.x, dy: drag.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -48 && gesture.dx > 10) placeBlock();
      else NativeAnimated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: false, damping: 13, stiffness: 130 }).start();
    },
  }), [drag, dragComplete]);

  const startSession = () => {
    if (!timerHydrated) return;
    if (preview && previewStage !== 'focus') { nextStep('completion'); return; }
    setSessionStartTotal(timer.focusTotalMs);
    startFocus(data.duration);
    setStep('focusRunning');
  };

  if (!hydrated) return <View style={styles.loading}><Text style={styles.brand}>IGLOO</Text></View>;

  const tapsRemaining = Math.max(0, 3 - eggTap);
  const titleByStep: Record<Step, string> = {
    intro: 'There’s someone\nwaiting for you…', egg: 'Someone special\nis on the way.', hatching: 'The shell is\nopening…', celebration: '',
    userName: 'A new little friend!', penguinName: 'I don’t have a\nname yet…', personality: 'Curiosity is a kind of magic.', activity: 'What will we\nfocus on first?',
    discovery: 'Look what we\ncould build!', tutorial: 'Can you help me?', progress: 'One session at a\ntime, we’ll build it.',
    duration: 'How long should\nwe start with?', commitment: 'We can begin gently.', firstFocus: 'Ready when\nyou are.', focusRunning: 'I’m right here.', completion: 'You did\namazing!'
  };
  const detailByStep: Record<Step, string> = {
    intro: 'A tiny friend is waiting in the snow.', egg: eggTap === 0 ? 'Tap below and see who’s waiting inside.' : eggTap === 1 ? 'A little crack appeared. Tap once more to widen it.' : 'It’s wobbling! One last tap and we’ll meet.',
    hatching: 'A tiny penguin is almost here.', celebration: 'Your little study buddy is ready to meet you.', userName: 'I’m so glad you came. What should I call you? (You can skip.)',
    penguinName: data.penguinName ? `${data.penguinName}? I love it!` : data.userName ? `Nice to meet you, ${data.userName}! Will you give me a name?` : 'Will you give me a name?',
    personality: personalityDiscovered ? 'It rolls! I want to see where it goes.' : 'I found a strange snowball. Want to see what it does?',
    activity: data.activity === 'Studying' ? 'Your penguin will keep you company.' : `I’d love to focus on ${data.activity.toLowerCase()} with you.`, discovery: 'Our very own igloo, one snowy block at a time.',
    tutorial: 'Drag the snow block onto the little foundation.', progress: 'Focused minutes build the igloo, even across different days.',
    duration: 'Short sessions count too. Pick what feels kind today.', commitment: 'No streaks or pressure. Just one small step, if today is a good day.', firstFocus: 'I’ll get my books ready and sit beside you.', focusRunning: 'A quiet stretch of focus, together.', completion: `Look, we’ve built ${Math.floor(progress.minutes)} focused minutes together.`
  };

  const renderHeader = () => <View style={styles.header}>
    <View style={styles.headerTop}>
      <View style={styles.headerIdentity}>
        {backStep[activeStep] && <Pressable accessibilityRole="button" accessibilityLabel="Back to previous step" onPress={() => setStep(backStep[activeStep]!)} style={styles.backButton}><Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>Back</Text></Pressable>}
        <View><Text style={styles.brand}>IGLOO</Text><Text style={styles.chapter}>{activeStep === 'completion' ? 'SETUP COMPLETE' : `CHAPTER ${stepIndex + 1} OF 10`}</Text></View>
      </View>
    </View>
    <View accessibilityRole="progressbar" accessibilityLabel="Onboarding progress" accessibilityValue={{ min: 1, max: 10, now: stepIndex + 1, text: `Step ${stepIndex + 1} of 10` }} style={styles.progressTrack}>{Array.from({ length: 10 }, (_, i) => <View key={i} style={[styles.progressSegment, i <= stepIndex && styles.progressActive]} />)}</View>
  </View>;

  const renderPenguin = (size = 222, emotion: CharacterEmotion = behavior.emotion, action: CharacterAction = behavior.action, showDialogue = true) => <View style={{ width: size, height: size * 1.08, alignItems: 'center', justifyContent: 'center' }}><Penguin emotion={emotion} action={action} hatching={activeStep === 'hatching'} reducedMotion={reducedMotion} onPress={() => perform({ emotion: 'curious', action: 'react', dialogue: 'Hmm?', priority: 5, durationMs: 1_000 })} style={{ width: size, height: size * 1.08 }} />{showDialogue && behavior.dialogue ? <View pointerEvents="none" style={styles.speechBubble}><Text style={styles.speechText}>{behavior.dialogue}</Text></View> : null}</View>;
  const renderShell = () => <View style={styles.eggScene}><View style={styles.eggHalo} /><Pressable accessibilityRole="button" accessibilityLabel={eggTap === 0 ? 'Tap egg to hatch your penguin' : `Tap egg, ${tapsRemaining} taps remaining`} accessibilityState={{ disabled: activeStep !== 'egg' || !eggReady }} disabled={activeStep !== 'egg' || !eggReady} onPress={tapEgg} style={styles.eggTarget}><RiveHatchery tapStep={eggTap} playHatchSequence={previewStage === 'hatching'} reducedMotion={reducedMotion} onReady={() => setEggReady(true)} style={styles.eggRive} /></Pressable>{activeStep === 'hatching' && penguinVisible && <Animated.View entering={reducedMotion ? undefined : FadeInUp.duration(330)} style={styles.emergingPenguin}>{renderPenguin(204, behavior.emotion, behavior.action)}</Animated.View>}</View>;

  const renderScene = () => {
    if (['intro', 'egg', 'hatching'].includes(activeStep)) return renderShell();
    if (activeStep === 'celebration') return <View style={styles.characterScene}>{renderPenguin(248, 'excited', 'celebrate')}<Text style={styles.achievementTitle}>You hatched a penguin!</Text></View>;
    if (activeStep === 'userName') return <View style={styles.characterScene}>{renderPenguin(176)}<View style={styles.inputWrap}><TextInput value={data.userName} onChangeText={(value) => setValue('userName', value.slice(0, 24))} placeholder="Your name or nickname" placeholderTextColor="#93A8B2" autoCapitalize="words" returnKeyType="done" maxLength={24} style={styles.textInput} accessibilityLabel="Your name or nickname" /></View></View>;
    if (activeStep === 'penguinName') return <View style={styles.characterScene}>{renderPenguin(164)}<View style={styles.nameGrid}>{['Pipo', 'Mochi', 'Pebble', 'Bobo'].map((name) => <Choice key={name} label={name} selected={data.penguinName === name} onPress={() => choosePenguinName(name)} />)}</View>{customName && <TextInput value={data.penguinName} onChangeText={(value) => setValue('penguinName', value.slice(0, 18))} placeholder="A name you love" placeholderTextColor="#93A8B2" autoCapitalize="words" maxLength={18} style={[styles.textInput, { width: '100%' }]} accessibilityLabel="Custom penguin name" />}<Pressable onPress={() => { setCustomName((value) => !value); setValue('penguinName', ''); }}><Text style={styles.linkText}>{customName ? 'Choose a suggestion' : 'Choose my own'}</Text></Pressable></View>;
    if (activeStep === 'personality') return <View style={styles.personalityScene}><View style={styles.personalityMascot}>{renderPenguin(174, personalityDiscovered ? 'playful' : 'curious', personalityDiscovered ? 'reach' : 'discover')}</View><Text style={styles.objectPrompt}>{personalityDiscovered ? 'A tiny rolling experiment!' : 'A snowball with a little blue sparkle.'}</Text><Pressable accessibilityRole="button" accessibilityLabel={personalityDiscovered ? 'Snowball rolled. Tap again to see it roll' : 'Tap the unusual snowball'} onPress={discoverPersonality} style={({ pressed }) => [styles.snowball, pressed && styles.choicePressed]}><Snowball /></Pressable></View>;
    if (activeStep === 'activity') return <View style={styles.activityScene}><View style={styles.activityMascot}>{renderPenguin(148, behavior.emotion, behavior.action)}<ActivityProp activity={data.activity} /></View><View style={styles.activityChoices}>{(['Studying', 'Coding', 'Reading', 'Writing', 'Something else'] as Activity[]).map((activity) => <Choice key={activity} label={activity} selected={data.activity === activity} onPress={() => { setValue('activity', activity); const reactions: Record<Activity, { emotion: CharacterEmotion; dialogue: string }> = { Studying: { emotion: 'focused', dialogue: 'I’ll bring my little book.' }, Coding: { emotion: 'curious', dialogue: 'Ooh, what do those keys do?' }, Reading: { emotion: 'happy', dialogue: 'A cozy page sounds lovely.' }, Writing: { emotion: 'thinking', dialogue: 'Let’s make a story together.' }, 'Something else': { emotion: 'encouraging', dialogue: 'Tell me about it as we go.' } }; perform({ ...reactions[activity], action: 'react', priority: 5, durationMs: 1_600 }); }} icon={<ActivityIcon activity={activity} />} />)}</View></View>;
    if (activeStep === 'discovery') return <View style={styles.worldScene}><Image source={IGLOO_EXTERIOR} resizeMode="stretch" style={styles.worldSceneImage} /><View pointerEvents="none" style={styles.worldDialogue}><Text style={styles.speechText}>{behavior.dialogue}</Text></View><View style={styles.worldPenguin}>{renderPenguin(90, 'surprised', 'discover', false)}</View><Text style={styles.worldCaption}>OUR FIRST LITTLE HOME</Text></View>;
    if (activeStep === 'tutorial') return <View style={styles.buildScene}><View style={styles.foundation}><Igloo stage={1} width={210} /></View><View style={styles.buildingCompanion}>{renderPenguin(126, dragComplete ? 'proud' : 'playful', dragComplete ? 'place' : 'carry')}</View><View style={styles.blockInstruction}><Text style={styles.blockInstructionText}>{dragComplete ? 'A perfect fit!' : 'Place the block here'}</Text></View><NativeAnimated.View {...panResponder.panHandlers} style={[styles.draggableBlock, { transform: [...drag.getTranslateTransform(), { rotate: '-5deg' }] }]}><SnowBlock /></NativeAnimated.View><Pressable style={styles.accessiblePlace} onPress={placeBlock} accessibilityRole="button"><Text style={styles.linkText}>Place the block without dragging</Text></Pressable></View>;
    if (activeStep === 'progress') return <View style={styles.progressScene}><Animated.View key={buildStage} entering={reducedMotion ? undefined : FadeIn.duration(220)} style={styles.progressIllustration}><Image source={IGLOO_STAGES[buildStage - 1]} resizeMode="stretch" style={styles.progressIllustrationImage} /><View pointerEvents="none" style={styles.stageDialogue}><Text style={styles.speechText}>{behavior.dialogue}</Text></View><View style={styles.stagePenguin}>{renderPenguin(76, buildStage === 5 ? 'proud' : 'playful', buildStage === 5 ? 'celebrate' : 'carry', false)}</View></Animated.View><View style={styles.milestones}>{[[10, 'First blocks'], [25, 'Foundation'], [40, 'Walls'], [50, 'Dome'], [60, 'First home']].map(([min, label], index) => <Pressable key={String(min)} accessibilityRole="button" accessibilityState={{ selected: buildStage === index + 1 }} onPress={() => setBuildStage(index + 1)} style={styles.milestone}><View style={[styles.milestoneDot, buildStage >= index + 1 && styles.milestoneDone]} /><Text style={[styles.milestoneText, buildStage === index + 1 && styles.milestoneTextDone]}>{min} min · {label}</Text></Pressable>)}</View></View>;
    if (activeStep === 'duration') return <View style={styles.durationScene}>{renderPenguin(174, behavior.emotion, behavior.action)}<View style={styles.durationChoices}>{[[15, 'A little start'], [25, 'Just right'], [50, 'Deep focus']].map(([minutes, mood]) => <Choice key={String(minutes)} label={`${minutes} minutes`} detail={String(mood)} selected={selectedDuration === minutes} onPress={() => { setSelectedDuration(Number(minutes)); setValue('duration', Number(minutes)); const reaction: Record<number, { emotion: CharacterEmotion; dialogue: string }> = { 15: { emotion: 'happy', dialogue: 'A small start is a lovely start.' }, 25: { emotion: 'excited', dialogue: 'Twenty-five minutes. We’ve got this!' }, 50: { emotion: 'proud', dialogue: 'A long stretch. I’ll settle in beside you.' } }; perform({ ...reaction[Number(minutes)], action: 'react', priority: 5, durationMs: 1_600 }); }} />)}</View></View>;
    if (activeStep === 'commitment') return <View style={styles.characterScene}>{renderPenguin(220, 'encouraging', 'wave')}<View style={styles.commitmentCard}><Text style={styles.commitmentLine}>We’ll start when you’re ready.</Text><Text style={styles.commitmentNote}>No streaks. No pressure. Just a little time together.</Text></View></View>;
    if (activeStep === 'firstFocus' || activeStep === 'focusRunning') return <View style={styles.focusScene}><View style={styles.focusRoom}><Image source={IGLOO_INTERIOR} resizeMode="stretch" style={styles.focusRoomImage} /><IglooChairJourney reducedMotion={reducedMotion} /><View pointerEvents="none" style={styles.focusDialogue}><Text style={styles.speechText}>{behavior.dialogue}</Text></View></View><View style={styles.focusTimerRow}><TimerRing progress={timer.durationMs ? 1 - timer.remainingMs / timer.durationMs : 0} size={70} /><Text style={styles.focusDigits}>{activeStep === 'focusRunning' ? focusLabel : `${String(data.duration).padStart(2, '0')}:00`}</Text></View><Text style={styles.focusMode}>{activeStep === 'focusRunning' ? (timer.status === 'paused' ? 'PAUSED' : 'FOCUSING TOGETHER') : 'YOUR FIRST FOCUS SESSION'}</Text></View>;
    return <View style={styles.characterScene}>{renderPenguin(216, 'proud', 'celebrate')}<Igloo stage={progress.stage} width={170} /><Text style={styles.completionProgress}>{Math.min(60, Math.floor(progress.minutes))} / 60 focused minutes</Text></View>;
  };

  const renderFooter = () => {
    if (activeStep === 'intro') return <PrimaryButton label="LET’S MEET" onPress={startEggStory} />;
    if (activeStep === 'egg') return <Text style={styles.instruction}>TAP THE EGG · {tapsRemaining} {tapsRemaining === 1 ? 'TAP' : 'TAPS'} LEFT</Text>;
    if (activeStep === 'hatching') return <Text style={styles.instruction}>A tiny friend is finding their feet…</Text>;
    if (activeStep === 'celebration') return <PrimaryButton label="SAY HELLO" onPress={() => nextStep('userName')} />;
    if (activeStep === 'userName') return <View style={styles.footerActions}><Pressable onPress={() => { setValue('userName', ''); nextStep('penguinName'); }}><Text style={styles.linkText}>Skip</Text></Pressable><PrimaryButton label="CONTINUE" onPress={() => nextStep('penguinName')} /></View>;
    if (activeStep === 'penguinName') return <PrimaryButton label={data.penguinName ? `THAT’S ${data.penguinName.toUpperCase()}!` : 'CHOOSE A NAME'} disabled={!data.penguinName.trim()} onPress={() => nextStep('personality')} />;
    if (activeStep === 'personality') return <PrimaryButton label={personalityDiscovered ? 'LET’S EXPLORE' : 'TAP THE SNOWBALL'} disabled={!personalityDiscovered} onPress={() => nextStep('activity')} />;
    if (activeStep === 'activity') return <PrimaryButton label="LET’S BUILD" onPress={() => nextStep('discovery')} />;
    if (activeStep === 'discovery') return <PrimaryButton label="LET’S BUILD IT" onPress={() => nextStep('tutorial')} />;
    if (activeStep === 'tutorial') return <PrimaryButton label={dragComplete ? 'WE DID IT!' : 'PLACE THE BLOCK'} onPress={() => dragComplete ? nextStep('progress') : placeBlock()} />;
    if (activeStep === 'progress') return <PrimaryButton label="ONE SESSION AT A TIME" onPress={() => nextStep('duration')} />;
    if (activeStep === 'duration') return <PrimaryButton label="LET’S FOCUS" onPress={() => { setFocusMinutes(selectedDuration); nextStep('commitment'); }} />;
    if (activeStep === 'commitment') return <PrimaryButton label="LET’S BEGIN TOGETHER" onPress={() => nextStep('firstFocus')} />;
    if (activeStep === 'firstFocus') return <View style={styles.footerStack}><PrimaryButton label={timerHydrated ? 'START FOCUS' : 'PREPARING TIMER'} disabled={!timerHydrated} onPress={startSession} /><Pressable accessibilityRole="button" onPress={onComplete} style={styles.footerLink}><Text style={styles.linkText}>Skip focus for now</Text></Pressable></View>;
    if (activeStep === 'focusRunning') return <View style={styles.footerStack}><PrimaryButton label={timer.status === 'running' ? 'PAUSE' : 'RESUME'} onPress={() => timer.status === 'running' ? pause() : start()} /><Pressable accessibilityRole="button" onPress={onComplete} style={styles.footerLink}><Text style={styles.linkText}>Go to Today · timer keeps running</Text></Pressable></View>;
    return <PrimaryButton label="GO TO TODAY" onPress={onComplete} />;
  };

  const withMessage = activeStep === 'celebration' || activeStep === 'userName' || activeStep === 'penguinName' || activeStep === 'personality' || activeStep === 'activity' || activeStep === 'discovery' || activeStep === 'tutorial' || activeStep === 'progress' || activeStep === 'duration' || activeStep === 'commitment' || activeStep === 'firstFocus' || activeStep === 'focusRunning' || activeStep === 'completion';
  const title = activeStep === 'celebration' ? titleByStep.celebration : titleByStep[activeStep];

  const sceneHasOwnArtwork = activeStep === 'discovery' || activeStep === 'progress';
  const background = ['discovery', 'firstFocus', 'focusRunning', 'progress'].includes(activeStep) ? ARCTIC_TWILIGHT : ['tutorial', 'commitment'].includes(activeStep) ? ARCTIC_TWILIGHT : ARCTIC;
  return <SafeAreaView style={styles.safe}>
    {!sceneHasOwnArtwork && <ImageBackground source={background} resizeMode="cover" style={StyleSheet.absoluteFill} />}
    <Snowfall reducedMotion={reducedMotion} />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {renderHeader()}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {activeStep === 'egg' || activeStep === 'hatching' ? <View style={styles.topCopy}><Text style={styles.headline}>{title}</Text><Text style={styles.detail}>{detailByStep[activeStep]}</Text></View> : null}
        {activeStep === 'celebration' ? <View style={styles.topCopy}><Text style={styles.detail}>{detailByStep.celebration}</Text></View> : null}
        {withMessage && activeStep !== 'celebration' ? <View style={styles.topCopy}><Text style={styles.headline}>{title}</Text><Text style={styles.detail}>{detailByStep[activeStep]}</Text></View> : null}
        {activeStep === 'intro' ? <View style={styles.topCopy}><Text style={styles.headline}>{title}</Text><Text style={styles.detail}>{detailByStep.intro}</Text></View> : null}
        <Animated.View entering={reducedMotion || ['discovery', 'progress', 'firstFocus', 'focusRunning'].includes(activeStep) ? undefined : FadeInUp.duration(260)} style={styles.stage}>{renderScene()}</Animated.View>
        {activeStep === 'completion' ? <View style={styles.completionCopy}><Text style={styles.headline}>{title}</Text><Text style={styles.detail}>{detailByStep.completion}</Text></View> : null}
      </ScrollView>
      <View style={styles.footer}>{renderFooter()}</View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primary, disabled && styles.primaryDisabled, pressed && !disabled && styles.primaryPressed]}><Text style={styles.primaryText}>{label}</Text><Text style={styles.arrow}>↗</Text></Pressable>;
}

function Choice({ label, detail, selected, onPress, icon }: { label: string; detail?: string; selected: boolean; onPress: () => void; icon?: React.ReactNode }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.choicePressed]}>{icon ? <View style={styles.choiceIcon}>{icon}</View> : null}<View style={{ flex: 1 }}><Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>{detail ? <Text style={styles.choiceDetail}>{detail}</Text> : null}</View>{selected && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}</Pressable>;
}

function ActivityIcon({ activity }: { activity: Activity }) {
  const common = { stroke: '#4C7480', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return <Svg width={25} height={25} viewBox="0 0 28 28">
    {activity === 'Studying' || activity === 'Reading' ? <><Path d="M4 6.5c4-1.3 7-1 10 1v15c-3-2-6-2.3-10-1Z" {...common} /><Path d="M24 6.5c-4-1.3-7-1-10 1v15c3-2 6-2.3 10-1Z" {...common} /><Path d="M7 10h4m-4 4h4m6-4h4m-4 4h4" {...common} /></> : null}
    {activity === 'Coding' ? <><Rect x="3.5" y="5" width="21" height="14" rx="2.5" {...common} /><Path d="m11 9-3 3 3 3m6-6 3 3-3 3m-2-7-2 8M10 23h8m-4-4v4" {...common} /></> : null}
    {activity === 'Writing' ? <><Path d="m6 21 3.2-.7 12.6-12.6a2.3 2.3 0 0 0-3.3-3.3L5.9 17Z" {...common} /><Path d="m16.9 6.8 3.3 3.3M5.8 21h16" {...common} /></> : null}
    {activity === 'Something else' ? <><Circle cx="6" cy="14" r="1.4" fill="#4C7480" /><Circle cx="14" cy="14" r="1.4" fill="#4C7480" /><Circle cx="22" cy="14" r="1.4" fill="#4C7480" /></> : null}
  </Svg>;
}

function ActivityProp({ activity }: { activity: Activity }) {
  if (activity === 'Something else') return null;
  return <View pointerEvents="none" style={styles.prop}><ActivityIcon activity={activity} /></View>;
}

function SnowBlock() {
  return <Svg width={84} height={62} viewBox="0 0 84 62"><Path d="M9 11 23 4l51 6-13 9-51-2Z" fill="#FFFFFF" /><Path d="M10 17 61 19v34l-52-2Z" fill="#D9EEF5" stroke="#9ABCCA" strokeWidth="2" /><Path d="m61 19 13-9v35l-13 8Z" fill="#BCD9E3" stroke="#9ABCCA" strokeWidth="2" /><Path d="m17 24 22 1M17 31l14 1" stroke="#F7FCFE" strokeWidth="3" strokeLinecap="round" /></Svg>;
}

function Snowball() {
  return <Svg width={66} height={66} viewBox="0 0 66 66"><Circle cx="33" cy="35" r="23" fill="#F9FEFF" stroke="#9EC3CE" strokeWidth="2" /><Ellipse cx="25" cy="23" rx="7" ry="4" fill="#FFFFFF" opacity=".85" /><Path d="M33 23v24m-10-12h20m-17-7 14 14m0-14L26 42" stroke="#B8D8DF" strokeWidth="2" strokeLinecap="round" /><Path d="m13 7 2.5 5L21 14.5 15.5 17 13 22l-2.5-5-5.5-2.5 5.5-2.5Z" fill="#E4B86A" /></Svg>;
}

function Snowfall({ reducedMotion }: { reducedMotion: boolean }) {
  const flakes = [{ left: '12%', top: '18%', size: 4, delay: 0 }, { left: '28%', top: '8%', size: 3, delay: 850 }, { left: '70%', top: '15%', size: 4, delay: 1_400 }, { left: '88%', top: '34%', size: 3, delay: 450 }, { left: '53%', top: '11%', size: 3, delay: 1_900 }];
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>{flakes.map((flake, index) => <Flake key={index} {...flake} reducedMotion={reducedMotion} />)}</View>;
}

function Flake({ left, top, size, delay, reducedMotion }: { left: string; top: string; size: number; delay: number; reducedMotion: boolean }) {
  const progress = useSharedValue(0);
  useEffect(() => { if (!reducedMotion) progress.value = withRepeat(withTiming(1, { duration: 5_800 + delay, easing: Easing.linear }), -1); }, [delay, progress, reducedMotion]);
  const style = useAnimatedStyle(() => ({ opacity: reducedMotion ? .58 : interpolate(progress.value, [0, .12, .84, 1], [0, .74, .55, 0]), transform: [{ translateY: reducedMotion ? 0 : progress.value * 88 }] }));
  return <Animated.View style={[styles.flake, { left: left as `${number}%`, top: top as `${number}%`, width: size, height: size }, style]} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', overflow: 'hidden', backgroundColor: '#E9F6FA' }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E9F6FA' },
  header: { paddingHorizontal: 24, paddingTop: 9, paddingBottom: 10 }, headerTop: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 }, backButton: { minWidth: 66, height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingRight: 5 }, backArrow: { color: '#476772', fontSize: 26, lineHeight: 30, fontWeight: '400' }, backText: { color: '#476772', fontSize: 12, fontWeight: '700' }, brand: { color: '#3C5A66', fontSize: 12, fontWeight: '900', letterSpacing: 3.5 }, chapter: { color: '#7B969F', fontSize: 9, letterSpacing: 1.1, fontWeight: '800', marginTop: 4 }, progressTrack: { width: '100%', flexDirection: 'row', gap: 4, marginTop: 10 }, progressSegment: { flex: 1, height: 5, borderRadius: 4, backgroundColor: '#BDCED2' }, progressActive: { backgroundColor: '#567C86' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 12 }, topCopy: { paddingTop: 22, minHeight: 104 }, headline: { color: '#172A32', fontSize: 29, lineHeight: 34, fontWeight: '800', letterSpacing: -.8 }, detail: { color: '#536E78', fontSize: 14, lineHeight: 20, marginTop: 7, maxWidth: 325 }, stage: { flex: 1, minHeight: 365, alignItems: 'center', justifyContent: 'center' }, footer: { paddingHorizontal: 22, paddingTop: 9, paddingBottom: 16, minHeight: 87, justifyContent: 'flex-end' },
  eggScene: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }, eggHalo: { position: 'absolute', width: 235, height: 235, borderRadius: 120, backgroundColor: '#FFF7E4', opacity: .47, top: '29%' }, eggTarget: { width: 285, height: 335, alignItems: 'center', justifyContent: 'center' }, eggRive: { width: '100%', height: '100%' }, emergingPenguin: { position: 'absolute', bottom: 3, left: 0, right: 0, alignItems: 'center', justifyContent: 'flex-end' },
  characterScene: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 11 }, speechBubble: { position: 'absolute', top: -13, right: -24, maxWidth: 190, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#DDE7DC', zIndex: 5 }, speechText: { color: '#3F626C', fontSize: 12, fontWeight: '700', lineHeight: 16 }, commitmentCard: { width: '100%', borderRadius: 19, padding: 15, backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#DCE7DF' }, commitmentLine: { color: '#355760', fontSize: 16, fontWeight: '800', textAlign: 'center' }, commitmentNote: { color: '#738B91', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 5 }, achievementTitle: { color: '#172A32', fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 4 }, inputWrap: { width: '100%', maxWidth: 340, marginTop: 6 }, textInput: { minHeight: 54, borderRadius: 17, backgroundColor: '#F9FDFE', borderWidth: 1, borderColor: '#D7E8EC', paddingHorizontal: 16, color: '#1C343C', fontSize: 15 },
  nameGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 3 }, choice: { minHeight: 52, flexGrow: 1, flexBasis: '42%', borderRadius: 17, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: '#F9FDFE', borderWidth: 1, borderColor: '#DCEBF0', flexDirection: 'row', alignItems: 'center', gap: 11 }, choiceSelected: { backgroundColor: '#E5F3F4', borderColor: '#86B4B8' }, choicePressed: { transform: [{ scale: .98 }] }, choiceIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#EAF4F5', alignItems: 'center', justifyContent: 'center' }, choiceLabel: { color: '#314E58', fontSize: 14, fontWeight: '700' }, choiceLabelSelected: { color: '#2F6971' }, choiceDetail: { color: '#8298A0', fontSize: 10, marginTop: 2 }, check: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#6D9CA0', alignItems: 'center', justifyContent: 'center' }, checkText: { color: '#F8FDFC', fontSize: 11, fontWeight: '900' }, linkText: { color: '#507680', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  personalityScene: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8 }, personalityMascot: { height: 214, justifyContent: 'center' }, objectPrompt: { color: '#587680', fontSize: 12, fontWeight: '700', textAlign: 'center' }, snowball: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', borderRadius: 40, backgroundColor: '#F7FCFC', borderWidth: 1, borderColor: '#D7E8E9' },
  activityScene: { width: '100%', flex: 1, justifyContent: 'center' }, activityMascot: { alignItems: 'center', justifyContent: 'center', height: 186 }, prop: { position: 'absolute', right: '22%', bottom: 20, width: 41, height: 41, borderRadius: 14, backgroundColor: '#EFF7F3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D4E4DC' }, activityChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  worldScene: { width: '90%', maxWidth: 370, aspectRatio: 941 / 1672, alignSelf: 'center', overflow: 'hidden', borderRadius: 22 }, worldSceneImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' }, worldDialogue: { position: 'absolute', top: 18, right: 14, maxWidth: 170, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFDF7EE', borderWidth: 1, borderColor: '#DDE7DC' }, worldPenguin: { position: 'absolute', bottom: '24%', left: '4%' }, worldCaption: { position: 'absolute', bottom: 15, alignSelf: 'center', color: '#526D7D', fontSize: 9, letterSpacing: 1.6, fontWeight: '900', textAlign: 'center' }, stagePenguin: { position: 'absolute', bottom: '14%', left: '7%' },
  buildScene: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: 320 }, foundation: { position: 'absolute', top: 55 }, buildingCompanion: { position: 'absolute', left: 0, bottom: 31, zIndex: 2 }, blockInstruction: { position: 'absolute', top: 12, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: '#F9FDFDBB' }, blockInstructionText: { color: '#587680', fontSize: 11, fontWeight: '700' }, draggableBlock: { position: 'absolute', left: 28, bottom: 46, width: 84, height: 62, zIndex: 3, alignItems: 'center', justifyContent: 'center', elevation: 5 }, accessiblePlace: { position: 'absolute', bottom: 5 },
  progressScene: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: 360 }, progressIllustration: { position: 'relative', width: '64%', maxWidth: 260, aspectRatio: 386 / 781, alignSelf: 'center', borderRadius: 20, overflow: 'hidden' }, progressIllustrationImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' }, stageDialogue: { position: 'absolute', top: 14, left: 12, maxWidth: 130, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#FFFDF7EE', borderWidth: 1, borderColor: '#DDE7DC', zIndex: 2 }, stagePenguin: { position: 'absolute', bottom: '13%', left: '5%' }, milestones: { width: '82%', marginTop: 12, gap: 7 }, milestone: { flexDirection: 'row', gap: 9, alignItems: 'center' }, milestoneDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CFDEE2' }, milestoneDone: { backgroundColor: '#70A7A3' }, milestoneText: { color: '#83979F', fontSize: 11 }, milestoneTextDone: { color: '#42656E', fontWeight: '700' },
  durationScene: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }, durationChoices: { width: '100%', gap: 8, marginTop: -7 }, focusScene: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 10 }, focusRoom: { width: '88%', maxWidth: 350, aspectRatio: 2 / 3, alignSelf: 'center', overflow: 'hidden', borderRadius: 20 }, focusRoomImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' }, focusDialogue: { position: 'absolute', top: 18, left: 12, maxWidth: 150, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFDF7EE', borderWidth: 1, borderColor: '#DDE7DC', zIndex: 3 }, focusCompanion: { position: 'absolute', top: '48%', left: '31%' }, focusTimerRow: { flexDirection: 'row', alignItems: 'center', gap: 18 }, focusDigits: { color: '#1E3A43', fontSize: 36, fontWeight: '300', letterSpacing: -1.7, fontVariant: ['tabular-nums'] }, focusMode: { color: '#6F8992', fontSize: 10, fontWeight: '900', letterSpacing: 1.6 }, completionProgress: { color: '#597680', fontSize: 12, fontWeight: '800' }, completionCopy: { paddingTop: 3, paddingBottom: 6 },
  instruction: { color: '#58747E', textAlign: 'center', fontSize: 11, fontWeight: '900', letterSpacing: 1.2, paddingVertical: 12 }, footerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }, footerStack: { gap: 8 }, footerLink: { minHeight: 36, alignItems: 'center', justifyContent: 'center' }, primary: { minHeight: 58, borderRadius: 19, backgroundColor: '#3C5A66', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18, shadowColor: '#355660', shadowOpacity: .14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 }, primaryDisabled: { opacity: .4 }, primaryPressed: { transform: [{ scale: .985 }], opacity: .9 }, primaryText: { color: '#F7FCFA', fontWeight: '900', fontSize: 12, letterSpacing: 1.35 }, arrow: { color: '#D5EEE9', fontSize: 17, marginTop: -2 }, flake: { position: 'absolute', borderRadius: 6, backgroundColor: '#F8FEFF' },
});
