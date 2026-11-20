import type { Sound } from './sounds';

export interface Voice {
  start(): void;
  setVolume(volume: number): void;
  release(): void;
  setMediaControls?(active: boolean, onPause?: () => void, onPlay?: () => void): void;
  setPaused?(paused: boolean): void;
}

export interface VoiceBackend {
  unlock(): Promise<void>;
  load(sound: Sound): Promise<Voice>;
  dispose(): void;
}
