import { usePomodoro } from '../../state/PomodoroContext';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { AnimationObject } from 'lottie-react-native';
import LottiePlayer, { type LottiePlayerHandle } from '../../components/StudyTogetherLottiePlayer';
import { fitStudy } from '../../wardrobe/lottieEquipment';
import type { WardrobeLayout } from '../../home/state';
import { useHomeMotionState } from '../../home/useHomeMotion';
import { usePipReactions } from './PipReactionsProvider';
import { nextFocusReaction, nextPipClip, REACTION_LABELS, type PipClip, type PipReaction } from './pipReactions';

const tealSource: AnimationObject = require('../../../assets/animations/study-together-lottie/lottie/typing.json');
const { segments } = require('../../../assets/animations/study-together-lottie/lottie/typing.segments.json');
const fallback = require('../../../assets/animations/pip-sofa-study/frames/pip-typing_00.png');
type Range = [number, number];

const clips: Record<PipClip, Range> = {
  study: segments.study,
  idle: [segments.study[0], segments.study[0] + 1],
  rest: segments.actions.break,
  'rest-hold': [segments.actions.break[1] - 2, segments.actions.break[1] - 1],
  wake: segments.wake,
  excited: segments.reactions.excited,
  blink: segments.reactions.blink,
  look: segments.reactions.look,
  smile: segments.reactions.smile,
  bored: segments.actions.bored,
  stretch: segments.actions.stretch,
  yawn: segments.actions.yawn,
  celebrate: segments.actions.celebrate,
  coffee: segments.actions.drink,
  wave: segments.actions.wave,
};

const isHold = (clip: PipClip) => clip === 'idle' || clip === 'rest-hold';

type Props = {
  enabled?: boolean;
  equipped?: WardrobeLayout;
  onAvailable?: () => void;
  allowAmbientCoffee?: boolean;
  alwaysStudying?: boolean;
};

export function SeatedPipReactions(props: Props) {
  const { timer } = usePomodoro();
  const outfit = props.equipped ?? timer.home.wardrobe.equipped;
  const source = useMemo(() => fitStudy(tealSource, outfit), [outfit]);
  // A new composition must initialize its segment playback from its own load event.
  return <SeatedAnimation key={JSON.stringify(outfit)} {...props} source={source} />;
}

function SeatedAnimation({ enabled = true, onAvailable, allowAmbientCoffee = true, alwaysStudying = false, source }: Props & { source: AnimationObject }) {
  const state = usePipReactions();
  const { motion, reduced } = useHomeMotionState(enabled);
  const player = useRef<LottiePlayerHandle>(null);
  const shown = useRef<PipClip | null>(null);
  const playingCue = useRef<number | null>(null);
  const consumed = useRef<number | null>(null);
  const queued = useRef<PipReaction | null>(null);
  const previousAmbient = useRef<PipReaction | null>(null);
  const coffeeTaken = useRef(false);
  const resting = useRef(false);
  const [clip, setClip] = useState<PipClip | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef({ state, motion });
  latest.current = { state, motion };

  const play = useCallback((next: PipClip, cue: number | null = null) => {
    playingCue.current = cue;
    shown.current = next;
    setClip(next);
    latest.current.state.reportClip(next);
    player.current?.play(...clips[next]);
  }, []);

  const advance = useCallback(() => {
    const { state: current, motion: canMove } = latest.current;
    if (!canMove) return;
    const selection = {
      phase: alwaysStudying ? 'study' as const : current.phase, resting: resting.current,
      cue: current.cue?.id === consumed.current ? null : current.cue,
      ambient: queued.current, coffeeAllowed: current.coffeeAllowed,
    };
    let { clip: next, cueId } = nextPipClip(selection);
    if (cueId !== null && !current.claimCue(cueId)) {
      consumed.current = cueId;
      ({ clip: next, cueId } = nextPipClip({ ...selection, cue: null }));
    }
    if (next === 'wake') resting.current = false;
    queued.current = null;
    if (cueId !== null) consumed.current = cueId;
    if (!isHold(next) || shown.current !== next) play(next, cueId);
  }, [alwaysStudying, play]);

  const complete = useCallback((cancelled: boolean) => {
    if (cancelled || !latest.current.motion) return;
    const current = shown.current;
    if (!current) return;
    if (current === 'rest') resting.current = true;
    if (isHold(current)) player.current?.pause();
    if (__DEV__ && current in REACTION_LABELS) latest.current.state.reportFinished(current as PipReaction);
    if (playingCue.current !== null) {
      latest.current.state.finishCue(playingCue.current);
      playingCue.current = null;
    }
    advance();
  }, [advance]);

  useEffect(() => {
    if (!ready || failed || !motion) return;
    if (shown.current && !isHold(shown.current)) player.current?.resume();
    else advance();
    return () => player.current?.pause();
  }, [advance, failed, motion, ready]);

  useEffect(() => {
    queued.current = null;
    if (!state.coffeeAllowed) coffeeTaken.current = false;
    if (ready && motion && (!shown.current || isHold(shown.current))) advance();
  }, [advance, motion, ready, state.phase, state.cue, state.coffeeAllowed]);

  useEffect(() => {
    if ((!ready && !failed) || (motion && !failed) || !enabled || (!reduced && !failed)) return;
    const hold = !alwaysStudying && state.phase === 'rest' ? 'rest-hold' : 'idle';
    shown.current = null;
    playingCue.current = null;
    resting.current = hold === 'rest-hold';
    setClip(null);
    state.reportClip(hold);
    if (state.cue) state.finishCue(state.cue.id);
    return undefined;
  }, [alwaysStudying, enabled, failed, motion, ready, reduced, state.cue, state.finishCue, state.phase, state.reportClip]);

  useEffect(() => {
    if (!motion || !ready || failed || state.cue || !clip) return;
    if (clip === 'study' && (state.phase === 'study' || alwaysStudying)) {
      const task = setTimeout(() => {
        const reaction = nextFocusReaction(state.phase === 'study' && state.hasExtendedFocus(), previousAmbient.current);
        previousAmbient.current = reaction;
        queued.current = reaction;
      }, 9_000 + Math.random() * 16_000);
      return () => clearTimeout(task);
    }
    if (clip === 'rest-hold' && allowAmbientCoffee && state.coffeeAllowed && !coffeeTaken.current) {
      const task = setTimeout(() => {
        coffeeTaken.current = true;
        if (Math.random() < 0.65) {
          queued.current = 'coffee';
          advance();
        }
      }, 14_000 + Math.random() * 26_000);
      return () => clearTimeout(task);
    }
    return undefined;
  }, [advance, allowAmbientCoffee, alwaysStudying, clip, failed, motion, ready, state.coffeeAllowed, state.cue, state.hasExtendedFocus, state.phase]);

  useEffect(() => {
    if (!enabled || state.cue || state.phase === 'study') return;
    if (failed || ((motion || reduced) && ready && (reduced || (clip && isHold(clip))))) onAvailable?.();
  }, [clip, enabled, failed, motion, onAvailable, ready, reduced, state.cue, state.phase]);

  useEffect(() => () => {
    const started = playingCue.current;
    if (started !== null) latest.current.state.finishCue(started);
  }, []);

  const staticFrame = clips[!alwaysStudying && state.phase === 'rest' ? 'rest-hold' : 'idle'][0];
  return <View pointerEvents="none" accessibilityLabel="Pip seated with a laptop" testID="pip-laptop-outfit" style={StyleSheet.absoluteFill}>
    {(!ready || failed) && <Image source={fallback} resizeMode="contain" style={StyleSheet.absoluteFill} />}
    {!failed && <LottiePlayer ref={player} source={source} style={StyleSheet.absoluteFill}
      progress={reduced ? staticFrame / source.op : undefined}
      onLoaded={() => setReady(true)} onFailure={() => setFailed(true)} onFinish={complete} />}
  </View>;
}
