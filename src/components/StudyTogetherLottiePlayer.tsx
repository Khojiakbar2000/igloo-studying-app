import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import LottieView from 'lottie-react-native';
import type { LottiePlayerHandle, LottiePlayerProps } from './StudyTogetherLottiePlayer.types';

const StudyTogetherLottiePlayer = forwardRef<LottiePlayerHandle, LottiePlayerProps>(function StudyTogetherLottiePlayer({ source, style, autoPlay, loop, progress, onLoaded, onFailure, onFinish }, ref) {
  const player = useRef<LottieView>(null);
  useImperativeHandle(ref, () => ({
    play: (startFrame, endFrame) => player.current?.play(startFrame, endFrame),
    pause: () => player.current?.pause(),
    resume: () => player.current?.resume(),
  }), []);
  return <LottieView ref={player} source={source} autoPlay={autoPlay} loop={loop} progress={progress} resizeMode="contain" style={style} onAnimationLoaded={onLoaded} onAnimationFailure={onFailure} onAnimationFinish={onFinish} />;
});

export default StudyTogetherLottiePlayer;
export type { LottiePlayerHandle } from './StudyTogetherLottiePlayer.types';
