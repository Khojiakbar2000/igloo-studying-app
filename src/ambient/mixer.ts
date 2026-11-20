import { createVoiceBackend } from './voice';
import { MAX_TRACKS, soundById, type SoundId } from './sounds';
import type { Voice } from './voice.types';

type Track = {
  voice?: Voice;
  level: number;
  from: number;
  target: number;
  changedAt: number;
  duration: number;
};

export class AmbientMixer {
  private backend = createVoiceBackend();
  private tracks = new Map<SoundId, Track>();
  private desired = new Map<SoundId, number>();
  private failed = new Set<SoundId>();
  private timer?: ReturnType<typeof setInterval>;
  private primary?: Voice;
  private pausedByMedia = false;
  private disposed = false;
  private fade = 400;

  constructor(
    private reportError: (message: string) => void,
    private reportMediaPause: (paused: boolean) => void,
  ) {}

  unlock() { return this.backend.unlock(); }

  resumeFromMediaPause() {
    this.primary?.setPaused?.(false);
    this.mirrorPause(false);
  }

  setMix(desired: Map<SoundId, number>, fade = 400) {
    this.desired = desired;
    this.fade = fade;
    for (const id of this.failed) if (!desired.has(id)) this.failed.delete(id);
    this.reconcile();
  }

  private reconcile() {
    if (this.disposed) return;
    const now = Date.now();
    for (const [id, track] of this.tracks) {
      if (!track.voice && !this.desired.has(id)) {
        this.tracks.delete(id);
        continue;
      }
      const target = this.desired.get(id) ?? 0;
      if (track.target === target) continue;
      track.from = track.level;
      track.target = target;
      track.changedAt = now;
      track.duration = this.fade;
    }
    for (const [id, level] of this.desired) {
      if (this.tracks.size === MAX_TRACKS) break;
      if (!this.tracks.has(id) && !this.failed.has(id)) this.load(id, level);
    }
    this.syncMediaControls();
    this.timer ??= setInterval(this.tick, 32);
  }

  private load(id: SoundId, level: number) {
    const track: Track = { level: 0, from: 0, target: level, changedAt: Date.now(), duration: this.fade };
    this.tracks.set(id, track);
    void this.backend.load(soundById(id)).then(voice => {
      if (this.disposed || this.tracks.get(id) !== track) {
        voice.release();
        return;
      }
      track.voice = voice;
      track.changedAt = Date.now();
      if (!this.pausedByMedia) voice.start();
      this.reconcile();
    }).catch(() => {
      if (this.tracks.get(id) !== track) return;
      track.voice?.release();
      this.tracks.delete(id);
      this.failed.add(id);
      this.reportError(`Couldn’t play ${soundById(id).label}. Turn it off and back on to retry.`);
      this.reconcile();
    });
  }

  private syncMediaControls() {
    if (!this.tracks.size && this.pausedByMedia) this.mirrorPause(false);
    const next = [...this.tracks].find(([id, track]) => this.desired.has(id) && track.voice)?.[1].voice
      ?? [...this.tracks.values()].find(track => track.level > 0 && track.voice)?.voice;
    if (next === this.primary) return;
    this.primary?.setMediaControls?.(false);
    this.primary = next;
    next?.setMediaControls?.(true, () => this.mirrorPause(true), () => this.mirrorPause(false));
  }

  private mirrorPause(paused: boolean) {
    if (paused === this.pausedByMedia) return;
    this.pausedByMedia = paused;
    this.reportMediaPause(paused);
    this.tracks.forEach(({ voice }) => {
      if (voice !== this.primary) voice?.setPaused?.(paused);
    });
  }

  private tick = () => {
    let fading = false;
    let released = false;
    for (const [id, track] of this.tracks) {
      if (!track.voice) continue;
      const progress = Math.min(1, (Date.now() - track.changedAt) / track.duration);
      fading ||= progress < 1 && track.from !== track.target;
      const level = track.from + (track.target - track.from) * progress;
      if (level !== track.level) track.voice.setVolume(level);
      track.level = level;
      if (level === 0 && !this.desired.has(id)) {
        if (track.voice === this.primary) {
          this.primary.setMediaControls?.(false);
          this.primary = undefined;
        }
        track.voice.release();
        this.tracks.delete(id);
        released = true;
      }
    }
    if (!fading) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    if (released) this.reconcile();
  };

  dispose() {
    this.disposed = true;
    clearInterval(this.timer);
    this.primary?.setMediaControls?.(false);
    this.tracks.forEach(track => track.voice?.release());
    this.tracks.clear();
    this.backend.dispose();
  }
}
