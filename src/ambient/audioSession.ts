import { setAudioModeAsync } from 'expo-audio';

let setup: Promise<void> | undefined;

export function prepareAudioSession() {
  setup ??= setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
  }).catch(error => {
    setup = undefined;
    throw error;
  });
  return setup;
}
