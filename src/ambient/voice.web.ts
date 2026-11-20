import { Asset } from 'expo-asset';
import type { VoiceBackend } from './voice.types';

export function createVoiceBackend(): VoiceBackend {
  let context: AudioContext | undefined;
  return {
    async unlock() {
      if (typeof window === 'undefined') return;
      context ??= new AudioContext();
      if (context.state !== 'running') await context.resume();
    },
    async load(sound) {
      const audio = context;
      if (!audio) throw new Error('Tap Play mix to enable audio.');
      const response = await fetch(Asset.fromModule(sound.source).uri);
      if (!response.ok) throw new Error('Audio file unavailable.');
      const buffer = await audio.decodeAudioData(await response.arrayBuffer());
      if (audio.state === 'closed') throw new Error('Audio session closed.');
      const source = audio.createBufferSource();
      const gain = audio.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(audio.destination);
      let started = false;
      return {
        start() { source.start(); started = true; },
        setVolume(volume) { gain.gain.setTargetAtTime(volume, audio.currentTime, 0.012); },
        release() {
          if (started) source.stop();
          source.disconnect();
          gain.disconnect();
        },
      };
    },
    dispose() {
      if (context && context.state !== 'closed') void context.close().catch(() => undefined);
      context = undefined;
    },
  };
}
