import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import type { CSSProperties } from 'react';
import { StyleSheet } from 'react-native';
import type { LottiePlayerHandle, LottiePlayerProps } from './StudyTogetherLottiePlayer.types';

const StudyTogetherLottiePlayer = forwardRef<LottiePlayerHandle, LottiePlayerProps>(function StudyTogetherLottiePlayer({ source, style, autoPlay = false, loop = false, progress, onLoaded, onFailure, onFinish }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const animation = useRef<AnimationItem | null>(null);
  const callbacks = useRef({ onLoaded, onFailure, onFinish });
  const latest = useRef({ autoPlay, loop, progress });
  callbacks.current = { onLoaded, onFailure, onFinish };
  latest.current = { autoPlay, loop, progress };

  useImperativeHandle(ref, () => ({
    play: (startFrame, endFrame) => {
      const player = animation.current;
      if (!player) return;
      if (startFrame !== undefined && endFrame !== undefined) player.playSegments([startFrame, endFrame], true);
      else player.play();
    },
    pause: () => animation.current?.pause(),
    resume: () => animation.current?.play(),
  }), []);

  useEffect(() => {
    if (!host.current) return undefined;
    let player: AnimationItem;
    try {
      player = lottie.loadAnimation({
        container: host.current,
        renderer: 'svg',
        loop: latest.current.loop,
        autoplay: false,
        animationData: source,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true },
      });
    } catch (error) {
      callbacks.current.onFailure?.(error instanceof Error ? error.message : String(error));
      return undefined;
    }
    animation.current = player;
    const loaded = () => {
      const state = latest.current;
      if (state.progress !== undefined) player.goToAndStop(Math.max(0, Math.min(1, state.progress)) * player.totalFrames, true);
      else if (state.autoPlay) player.play();
      callbacks.current.onLoaded?.();
    };
    const complete = () => callbacks.current.onFinish?.(false);
    const failed = () => callbacks.current.onFailure?.('Lottie data could not be loaded.');
    player.addEventListener('DOMLoaded', loaded);
    player.addEventListener('complete', complete);
    player.addEventListener('data_failed', failed);
    return () => {
      player.removeEventListener('DOMLoaded', loaded);
      player.removeEventListener('complete', complete);
      player.removeEventListener('data_failed', failed);
      player.destroy();
      if (animation.current === player) animation.current = null;
    };
  }, [source]);

  useEffect(() => {
    const player = animation.current;
    if (player && progress !== undefined) player.goToAndStop(Math.max(0, Math.min(1, progress)) * player.totalFrames, true);
  }, [progress]);

  const flattened = StyleSheet.flatten(style) as CSSProperties | undefined;
  return <div ref={host} aria-hidden="true" style={{ overflow: 'hidden', ...flattened }} />;
});

export default StudyTogetherLottiePlayer;
export type { LottiePlayerHandle } from './StudyTogetherLottiePlayer.types';
