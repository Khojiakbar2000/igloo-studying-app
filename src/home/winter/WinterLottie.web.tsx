import React, { useEffect, useRef } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import type { WinterLottieProps } from './WinterLottie.types';

type LoadedPlayer = { animation: AnimationItem; container: HTMLDivElement; timeline?: string };

function dispose(player: LoadedPlayer) {
  player.animation.destroy();
  player.container.remove();
}

export function WinterLottie(props: WinterLottieProps) {
  const host = useRef<HTMLDivElement>(null);
  const active = useRef<LoadedPlayer>(null);
  const latest = useRef(props);
  latest.current = props;

  const sync = () => {
    const animation = active.current?.animation;
    const { playing, progress } = latest.current;
    if (!animation) return;
    if (progress !== undefined) {
      animation.goToAndStop(Math.max(0, Math.min(1, progress)) * (animation.totalFrames - 1), true);
    } else if (playing) {
      animation.play();
    } else {
      animation.pause();
    }
  };

  useEffect(() => () => {
    if (active.current) dispose(active.current);
    active.current = null;
  }, []);

  useEffect(() => {
    if (!host.current) return;
    const { data, loop = true, timeline } = latest.current;
    if (!timeline && active.current) {
      dispose(active.current);
      active.current = null;
    }
    const container = document.createElement('div');
    Object.assign(container.style, { position: 'absolute', inset: '0', visibility: 'hidden' });
    host.current.append(container);
    const animation = lottie.loadAnimation({
      container, animationData: JSON.parse(JSON.stringify(data)), renderer: 'svg', autoplay: false, loop,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    const incoming = { animation, container, timeline };
    let promoted = false;

    const loaded = () => {
      const previous = active.current;
      if (timeline && previous?.timeline === timeline && latest.current.progress === undefined) {
        animation.goToAndStop(previous.animation.currentRawFrame, true);
      }
      promoted = true;
      active.current = incoming;
      container.style.visibility = 'visible';
      if (previous) dispose(previous);
      sync();
      latest.current.onLoaded?.();
    };
    const completed = () => {
      if (active.current === incoming) latest.current.onFinish?.();
    };
    const failed = () => latest.current.onError?.();
    animation.addEventListener('DOMLoaded', loaded);
    animation.addEventListener('complete', completed);
    animation.addEventListener('data_failed', failed);
    return () => {
      if (!promoted) dispose(incoming);
      else if (active.current === incoming) {
        animation.removeEventListener('DOMLoaded', loaded);
        animation.removeEventListener('complete', completed);
        animation.removeEventListener('data_failed', failed);
      }
    };
  }, [props.data, props.loop, props.timeline]);

  useEffect(sync, [props.playing, props.progress]);

  return <div ref={host} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}
