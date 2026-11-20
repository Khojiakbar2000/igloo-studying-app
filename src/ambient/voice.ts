import { createAudioPlayer } from 'expo-audio';
import { prepareAudioSession } from './audioSession';
import type { VoiceBackend } from './voice.types';

export function createVoiceBackend(): VoiceBackend {
  return {
    unlock: prepareAudioSession,
    async load(sound) {
      await prepareAudioSession();
      const player = createAudioPlayer(sound.source, { keepAudioSessionActive: true, updateInterval: 250 });
      player.loop = true;
      player.volume = 0;
      let observer: ReturnType<typeof player.addListener> | undefined;
      return {
        start: () => player.play(),
        setVolume: volume => { player.volume = volume; },
        setPaused: paused => { if (paused) player.pause(); else player.play(); },
        setMediaControls(active, onPause, onPlay) {
          observer?.remove();
          observer = undefined;
          player.setActiveForLockScreen(active, active ? { title: 'Igloo ambience', artist: 'IGLOO' } : undefined);
          if (active) {
            let wasPlaying = player.playing;
            observer = player.addListener('playbackStatusUpdate', status => {
              if (!status.isLoaded || status.isBuffering || status.playing === wasPlaying) return;
              wasPlaying = status.playing;
              if (wasPlaying) onPlay?.(); else onPause?.();
            });
          }
        },
        release() {
          observer?.remove();
          player.pause();
          player.remove();
        },
      };
    },
    dispose() {},
  };
}
