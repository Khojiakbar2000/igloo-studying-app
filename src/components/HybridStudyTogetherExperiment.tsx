import { colors } from '../theme';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Image, Pressable, ScrollView, StyleSheet, Text, View, type AppStateStatus, type LayoutChangeEvent } from 'react-native';
import { STUDY_TOGETHER_SCENE } from '../scenes/studyTogetherArtContract';
import { STUDY_TOGETHER_BENCHMARK_ACTORS, type StudyTogetherBenchmarkActor } from './FourCharacterAnimationBenchmark';
import { HybridRivePip } from './HybridRivePip';

const room = require('../../assets/environments/igloo/study-together-layers/room-floor-background-clean.png');
const sofa = require('../../assets/environments/igloo/study-together-layers/sofa.png');
const exposures = [4,2,2,3,2,2,2,3,4,2,2,3,2,2,3,4];
type SwapKind = 'pose' | 'reaction';
type PreviewMode = 'synfig' | 'hybrid';
const seatById = STUDY_TOGETHER_SCENE.seats;

export function HybridStudyTogetherExperiment({ onExit }: { onExit?: () => void }) {
  const [mode, setMode] = useState<PreviewMode>('synfig');
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [riveReady, setRiveReady] = useState(false);
  const [riveShown, setRiveShown] = useState(false);
  const [riveActive, setRiveActive] = useState(false);
  const [typingFrozen, setTypingFrozen] = useState(false);
  const [pendingSwap, setPendingSwap] = useState(false);
  const [pendingKind, setPendingKind] = useState<SwapKind>('reaction');
  const [slowFade, setSlowFade] = useState(false);
  const [status, setStatus] = useState('Four Synfig animations are playing. Tap Pip in Hybrid mode to switch at a loop boundary.');
  const [poseWaitMs, setPoseWaitMs] = useState<number | null>(null);
  const [riveReadyMs, setRiveReadyMs] = useState<number | null>(null);
  const requestRef = useRef<SwapKind | null>(null);
  const requestAt = useRef(0);
  const mountedAt = useRef(performance.now());
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const synfigOpacity = useRef(new Animated.Value(1)).current;
  const riveOpacity = useRef(new Animated.Value(0)).current;
  const fadeDuration = slowFade ? 400 : 200;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => setAppActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => () => { if (returnTimer.current) clearTimeout(returnTimer.current); }, []);

  const onRiveReady = useCallback(() => {
    setRiveReady(true);
    setRiveReadyMs(performance.now() - mountedAt.current);
  }, []);

  const crossfadeToRive = useCallback((kind: SwapKind) => {
    setTypingFrozen(true);
    setRiveShown(true);
    setRiveActive(kind === 'reaction');
    setPendingSwap(false);
    setStatus(kind === 'reaction' ? 'Matched seated pose → Rive happy reaction (the arm does not wave yet).' : 'Matched seated pose → Rive idle.');
    Animated.parallel([
      Animated.timing(synfigOpacity, { toValue: 0, duration: fadeDuration, useNativeDriver: true }),
      Animated.timing(riveOpacity, { toValue: 1, duration: fadeDuration, useNativeDriver: true }),
    ]).start();
  }, [fadeDuration, riveOpacity, synfigOpacity]);

  const onPoseBoundary = useCallback(() => {
    const kind = requestRef.current;
    requestRef.current = null;
    setPoseWaitMs(performance.now() - requestAt.current);
    if (!kind) return;
    setTypingFrozen(true);
    setStatus('Synfig paused on typing frame 0. Waiting for the preloaded Rive view…');
    setPendingKind(kind);
    setPoseReady(true);
  }, []);

  const [poseReady, setPoseReady] = useState(false);
  useEffect(() => {
    if (!poseReady || !riveReady) return;
    crossfadeToRive(pendingKind);
    setPoseReady(false);
  }, [crossfadeToRive, pendingKind, poseReady, riveReady]);

  const requestSwap = useCallback((kind: SwapKind) => {
    if (pendingSwap || riveShown) return;
    requestAt.current = performance.now();
    requestRef.current = kind;
    setPendingKind(kind);
    setPendingSwap(true);
    setStatus('Waiting for the typing loop to reach its original first frame…');
  }, [pendingSwap, riveShown]);

  const returnToSynfig = useCallback(() => {
    if (!riveShown) return;
    if (returnTimer.current) clearTimeout(returnTimer.current);
    setRiveActive(false);
    setStatus('Crossfading back to Synfig frame 0; typing resumes after the fade.');
    Animated.parallel([
      Animated.timing(synfigOpacity, { toValue: 1, duration: fadeDuration, useNativeDriver: true }),
      Animated.timing(riveOpacity, { toValue: 0, duration: fadeDuration, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setTypingFrozen(false);
      setRiveShown(false);
      setPendingSwap(false);
      setMode('synfig');
      setStatus('Four Synfig animations are playing. Tap Pip in Hybrid mode to switch at a loop boundary.');
    });
  }, [fadeDuration, riveOpacity, riveShown, synfigOpacity]);

  const onReactionStarted = useCallback(() => {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    returnTimer.current = setTimeout(returnToSynfig, 1580);
  }, [returnToSynfig]);

  const selectSynfig = () => {
    if (riveShown) returnToSynfig();
    else {
      requestRef.current = null;
      setPendingSwap(false);
      setPoseReady(false);
      setTypingFrozen(false);
      setMode('synfig');
      setStatus('Four Synfig animations are playing. Tap Pip in Hybrid mode to switch at a loop boundary.');
    }
  };

  const startRivePreview = (kind: SwapKind) => {
    setMode('hybrid');
    if (riveShown) {
      if (kind === 'reaction') setRiveActive(true);
      else setRiveActive(false);
      return;
    }
    requestSwap(kind);
  };

  const scale = stage.width && stage.height ? Math.min(stage.width / STUDY_TOGETHER_SCENE.artboard.width, stage.height / STUDY_TOGETHER_SCENE.artboard.height) : 0;
  const xOffset = (stage.width - STUDY_TOGETHER_SCENE.artboard.width * scale) / 2;
  const yOffset = (stage.height - STUDY_TOGETHER_SCENE.artboard.height * scale) / 2;
  const bounds = (seat: { x: number; y: number; width: number; height: number }) => ({ left: xOffset + seat.x * scale, top: yOffset + seat.y * scale, width: seat.width * scale, height: seat.height * scale });
  const onLayout = (event: LayoutChangeEvent) => setStage({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height });
  const typingBounds = bounds(seatById.typing);

  return <ScrollView contentContainerStyle={styles.page}>
    {onExit && <Pressable accessibilityRole="button" onPress={onExit} style={styles.exit}><Text style={styles.exitText}>← Return to IGLOO</Text></Pressable>}
    <Text style={styles.kicker}>DEVELOPMENT ONLY · HYBRID CHARACTER PROOF</Text>
    <Text style={styles.title}>Synfig ↔ Rive on the same sofa</Text>
    <Text style={styles.subtitle}>Four current Synfig studies; one exact seated-frame Rive prototype.</Text>
    <View style={styles.controls}>
      <Control label="Original Synfig" selected={mode === 'synfig' && !riveShown} onPress={selectSynfig} />
      <Control label="Hybrid tap mode" selected={mode === 'hybrid'} onPress={() => { setMode('hybrid'); setStatus('Tap the typing penguin. It will pause on the next loop boundary before the crossfade.'); }} />
    </View>
    <View style={styles.controls}>
      <Control label="Rive seated pose" selected={riveShown && !riveActive} onPress={() => startRivePreview('pose')} />
      <Control label="Rive happy motion" selected={riveActive} onPress={() => startRivePreview('reaction')} />
      {riveShown && <Control label="Return to Synfig" selected={false} onPress={returnToSynfig} />}
    </View>
    <Pressable accessibilityRole="button" accessibilityState={{ selected: slowFade }} onPress={() => setSlowFade(value => !value)} style={[styles.slowToggle, slowFade && styles.slowToggleActive]}>
      <Text style={styles.slowText}>{slowFade ? 'Transition: 400 ms · tap for 200 ms' : 'Transition: 200 ms · tap for 400 ms'}</Text>
    </Pressable>
    <View style={styles.stageFrame}>
      <View onLayout={onLayout} style={styles.stage}>
        {scale > 0 && <>
          <Image source={room} resizeMode="stretch" style={StyleSheet.absoluteFill} />
          <Image source={sofa} resizeMode="stretch" style={[styles.positioned, { left: xOffset + STUDY_TOGETHER_SCENE.sofa.x * scale, top: yOffset + STUDY_TOGETHER_SCENE.sofa.y * scale, width: STUDY_TOGETHER_SCENE.sofa.width * scale, height: STUDY_TOGETHER_SCENE.sofa.height * scale }]} />
          {STUDY_TOGETHER_BENCHMARK_ACTORS.map(actor => <SynfigActor
            key={actor.id}
            actor={actor}
            bounds={bounds(seatById[actor.id as keyof typeof seatById])}
            active={appActive && (actor.id !== 'typing' || !typingFrozen)}
            requestRef={actor.id === 'typing' ? requestRef : undefined}
            onPoseBoundary={actor.id === 'typing' ? onPoseBoundary : undefined}
            opacity={actor.id === 'typing' ? synfigOpacity : undefined}
          />)}
          <Animated.View pointerEvents="none" style={[styles.positioned, styles.actorViewport, typingBounds, { zIndex: 5, opacity: riveOpacity }]}>
            <HybridRivePip active={riveActive && appActive} onReady={onRiveReady} onReactionStarted={onReactionStarted} onError={message => setStatus(message)} />
          </Animated.View>
          {mode === 'hybrid' && !riveShown && <Pressable accessibilityRole="button" accessibilityLabel="Tap Pip to switch from Synfig to the Rive reaction" disabled={pendingSwap} onPress={() => requestSwap('reaction')} style={[styles.tapTarget, typingBounds]} />}
        </>}
      </View>
    </View>
    <View style={styles.readout}>
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.metric}>Rive preloaded: {riveReady ? 'ready' : 'loading'}{riveReadyMs === null ? '' : ` · ${(riveReadyMs / 1000).toFixed(2)} s from screen mount`}</Text>
      <Text style={styles.metric}>Synfig → loop-boundary wait: {poseWaitMs === null ? 'not measured yet' : `${poseWaitMs.toFixed(0)} ms`}</Text>
    <Text style={styles.note}>The Rive source image is the same 430×541 Synfig typing cel, so the seated transition preserves the approved proportions and laptop pose. The current Rive happy trigger makes a small whole-character bob and head tilt; a separate flipper wave still needs layered artwork.</Text>
      <Text style={styles.note}>Rive stays preloaded and paused while Synfig types. The typing frames pause at frame 0 before the fade and resume after the return fade. Other three Synfig penguins keep studying.</Text>
    </View>
  </ScrollView>;
}

function SynfigActor({ actor, bounds, active, requestRef, onPoseBoundary, opacity }: {
  actor: StudyTogetherBenchmarkActor;
  bounds: { left: number; top: number; width: number; height: number };
  active: boolean;
  requestRef?: React.MutableRefObject<SwapKind | null>;
  onPoseBoundary?: () => void;
  opacity?: Animated.Value;
}) {
  const [frame, setFrame] = useState<number>(actor.start);
  const frameRef = useRef<number>(actor.start);
  const poseBoundaryRef = useRef(onPoseBoundary);
  poseBoundaryRef.current = onPoseBoundary;
  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      if (!alive) return;
      const next = (frameRef.current + 1) % actor.frames.length;
      frameRef.current = next;
      setFrame(next);
      if (next === actor.start && requestRef?.current) {
        poseBoundaryRef.current?.();
        return;
      }
      timer = setTimeout(advance, exposures[next] * 1000 / actor.rate);
    };
    timer = setTimeout(advance, actor.delay + exposures[frameRef.current] * 1000 / actor.rate);
    return () => { alive = false; clearTimeout(timer); };
  }, [active, actor, requestRef]);

  return <Animated.View style={[styles.positioned, styles.actorViewport, bounds, { zIndex: 3 }, opacity ? { opacity } : undefined]}>
    <Image accessibilityLabel={actor.label} source={actor.frames[frame]} resizeMode="contain" fadeDuration={0} style={styles.actorImage} />
  </Animated.View>;
}

function Control({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.control, selected && styles.controlActive]}><Text style={[styles.controlText, selected && styles.controlTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, alignItems: 'center', gap: 10, padding: 18, backgroundColor: '#EAF1F8' },
  exit: { width: '100%', maxWidth: 520, marginTop: 8 },
  exitText: { color: colors.link, fontSize: 12, fontWeight: '800' },
  kicker: { width: '100%', maxWidth: 520, marginTop: 12, color: colors.link, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { width: '100%', maxWidth: 520, color: colors.link, fontSize: 24, fontWeight: '800' },
  subtitle: { width: '100%', maxWidth: 520, color: '#71818A', fontSize: 12 },
  controls: { width: '100%', maxWidth: 520, flexDirection: 'row', gap: 7 },
  control: { minHeight: 38, flex: 1, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F1E6' },
  controlActive: { backgroundColor: colors.link },
  controlText: { textAlign: 'center', color: colors.link, fontSize: 10, fontWeight: '800' },
  controlTextActive: { color: '#FFFDF8' },
  slowToggle: { minHeight: 34, width: '100%', maxWidth: 520, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#F4F7F8' },
  slowToggleActive: { backgroundColor: colors.ice },
  slowText: { fontSize: 10, color: colors.link, fontWeight: '700' },
  stageFrame: { width: '100%', maxWidth: 420, borderRadius: 20, padding: 10, backgroundColor: '#FFFCF5' },
  stage: { position: 'relative', width: '100%', aspectRatio: STUDY_TOGETHER_SCENE.artboard.width / STUDY_TOGETHER_SCENE.artboard.height, overflow: 'hidden', borderRadius: 12, backgroundColor: '#EAF1F8' },
  positioned: { position: 'absolute' },
  actorViewport: { overflow: 'hidden' },
  actorImage: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  tapTarget: { position: 'absolute', zIndex: 7, backgroundColor: 'transparent' },
  readout: { width: '100%', maxWidth: 520, borderRadius: 17, padding: 13, backgroundColor: '#FFFCF5', gap: 6 },
  status: { color: colors.link, fontSize: 12, fontWeight: '800', lineHeight: 17 },
  metric: { color: colors.link, fontSize: 10 },
  note: { color: '#71818A', fontSize: 10, lineHeight: 15, marginTop: 3 },
});
