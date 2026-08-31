import type {
  AudioAssetDefinition,
  AudioCue,
  ProceduralAudioFallback,
} from '../assets/assetTypes';
import { AUDIO_ASSETS_BY_CUE } from '../data/assets';
import type { SaveData } from '../types/gameTypes';

export type SoundEffect = Exclude<AudioCue, 'limbo-ambience'>;

/** The small media-element surface used by the runtime and its deterministic tests. */
export interface AudioFilePlayer {
  loop: boolean;
  preload: string;
  volume: number;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: 'ended' | 'error', listener: () => void): void;
  removeEventListener(type: 'ended' | 'error', listener: () => void): void;
}

export interface AudioSystemRuntime {
  now(): number;
  createContext(): AudioContext | undefined;
  createFilePlayer(sourceUrl: string): AudioFilePlayer | undefined;
  warn(message: string, error?: unknown): void;
  maxActiveFileEffects: number;
}

export interface AudioSystemOptions {
  definitions?: ReadonlyMap<AudioCue, AudioAssetDefinition>;
  runtime?: Partial<AudioSystemRuntime>;
}

interface ActiveFileEffect {
  player: AudioFilePlayer;
  baseGain: number;
  dispose(stop: boolean): void;
}

interface ActiveFileAmbience {
  player: AudioFilePlayer;
  dispose(): void;
}

const DEFAULT_MAX_ACTIVE_FILE_EFFECTS = 24;

const DEFAULT_RUNTIME: AudioSystemRuntime = {
  now: () => performance.now(),
  createContext: () => {
    if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
      return undefined;
    }
    return new AudioContext();
  },
  createFilePlayer: (sourceUrl) => {
    if (typeof Audio === 'undefined') {
      return undefined;
    }
    return new Audio(sourceUrl) as AudioFilePlayer;
  },
  warn: (message, error) => console.warn(message, error),
  maxActiveFileEffects: DEFAULT_MAX_ACTIVE_FILE_EFFECTS,
};

export class AudioSystem {
  private context?: AudioContext;
  private ambientGain?: GainNode;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientFile?: ActiveFileAmbience;
  private readonly activeFileEffects = new Set<ActiveFileEffect>();
  private readonly failedSourceWarnings = new Set<string>();
  private readonly lastPlayedAt = new Map<SoundEffect, number>();
  private readonly definitions: ReadonlyMap<AudioCue, AudioAssetDefinition>;
  private readonly runtime: AudioSystemRuntime;
  private settings: SaveData['settings'] = {
    screenShake: true,
    particles: true,
    masterVolume: 0.75,
    musicVolume: 0.35,
    effectsVolume: 0.7,
  };

  constructor(options: AudioSystemOptions = {}) {
    this.definitions = options.definitions ?? AUDIO_ASSETS_BY_CUE;
    this.runtime = { ...DEFAULT_RUNTIME, ...options.runtime };
    this.runtime.maxActiveFileEffects = Math.max(
      1,
      Math.floor(this.runtime.maxActiveFileEffects),
    );
  }

  configure(settings: SaveData['settings']): void {
    this.settings = settings;
    if (this.context && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume(), this.context.currentTime, 0.08);
    }
    if (this.ambientFile) {
      this.ambientFile.player.volume = this.ambientVolume();
    }
    for (const playback of this.activeFileEffects) {
      playback.player.volume = this.effectVolume(playback.baseGain);
    }
  }

  play(effect: SoundEffect): void {
    if (this.settings.masterVolume <= 0 || this.settings.effectsVolume <= 0) {
      return;
    }
    const definition = this.definitions.get(effect);
    const fallback = definition?.developmentFallback;
    if (!definition || !fallback || fallback.generator !== 'web-audio-tone') {
      return;
    }
    const now = this.runtime.now();
    const lastPlayedAt = this.lastPlayedAt.get(effect);
    if (lastPlayedAt !== undefined && now - lastPlayedAt < (fallback.cooldownMs ?? 0)) {
      return;
    }
    this.lastPlayedAt.set(effect, now);

    if (definition.source && this.playFileEffect(definition)) {
      return;
    }
    this.playProceduralEffect(fallback);
  }

  startAmbience(): void {
    if (this.ambientFile || this.ambientOscillators.length > 0 || this.settings.musicVolume <= 0) {
      return;
    }
    const definition = this.definitions.get('limbo-ambience');
    if (!definition) {
      return;
    }
    if (definition.source && this.playFileAmbience(definition)) {
      return;
    }
    this.startProceduralAmbience(definition.developmentFallback);
  }

  stopAmbience(): void {
    this.ambientFile?.dispose();
    this.ambientFile = undefined;
    for (const oscillator of this.ambientOscillators) {
      oscillator.stop();
      oscillator.disconnect();
    }
    this.ambientOscillators = [];
    this.ambientGain?.disconnect();
    this.ambientGain = undefined;
  }

  private playFileEffect(definition: AudioAssetDefinition): boolean {
    const source = definition.source;
    if (!source) {
      return false;
    }

    let player: AudioFilePlayer | undefined;
    try {
      player = this.runtime.createFilePlayer(source.url);
    } catch (error) {
      this.handleFileEffectFailure(definition, error);
      return true;
    }
    if (!player) {
      return false;
    }

    player.preload = 'auto';
    player.loop = definition.loop;
    player.volume = this.effectVolume(definition.developmentFallback.gain);

    const playback: ActiveFileEffect = {
      player,
      baseGain: definition.developmentFallback.gain,
      dispose: () => undefined,
    };
    let active = true;
    const dispose = (stop: boolean): void => {
      if (!active) {
        return;
      }
      active = false;
      player.removeEventListener('ended', onEnded);
      player.removeEventListener('error', onError);
      this.activeFileEffects.delete(playback);
      if (stop) {
        this.stopFilePlayer(player);
      }
    };
    const onEnded = (): void => dispose(false);
    const onError = (): void => {
      dispose(true);
      this.handleFileEffectFailure(definition);
    };
    playback.dispose = dispose;
    player.addEventListener('ended', onEnded);
    player.addEventListener('error', onError);
    this.activeFileEffects.add(playback);
    this.trimActiveFileEffects();

    try {
      void player.play().catch((error: unknown) => {
        if (!active) {
          return;
        }
        dispose(true);
        this.handleFileEffectFailure(definition, error);
      });
    } catch (error) {
      dispose(true);
      this.handleFileEffectFailure(definition, error);
    }
    return true;
  }

  private playFileAmbience(definition: AudioAssetDefinition): boolean {
    const source = definition.source;
    if (!source) {
      return false;
    }

    let player: AudioFilePlayer | undefined;
    try {
      player = this.runtime.createFilePlayer(source.url);
    } catch (error) {
      this.handleFileAmbienceFailure(definition, error);
      return true;
    }
    if (!player) {
      return false;
    }

    player.preload = 'auto';
    player.loop = definition.loop;
    player.volume = this.ambientVolume();
    const playback: ActiveFileAmbience = {
      player,
      dispose: () => undefined,
    };
    let active = true;
    const dispose = (): void => {
      if (!active) {
        return;
      }
      active = false;
      player.removeEventListener('error', onError);
      this.stopFilePlayer(player);
      if (this.ambientFile === playback) {
        this.ambientFile = undefined;
      }
    };
    const onError = (): void => {
      if (!active) {
        return;
      }
      dispose();
      this.handleFileAmbienceFailure(definition);
    };
    playback.dispose = dispose;
    player.addEventListener('error', onError);
    this.ambientFile = playback;

    try {
      void player.play().catch((error: unknown) => {
        if (!active) {
          return;
        }
        dispose();
        this.handleFileAmbienceFailure(definition, error);
      });
    } catch (error) {
      dispose();
      this.handleFileAmbienceFailure(definition, error);
    }
    return true;
  }

  private playProceduralEffect(definition: ProceduralAudioFallback): void {
    if (definition.generator !== 'web-audio-tone') {
      return;
    }
    const context = this.unlock();
    if (!context) {
      return;
    }
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const duration = definition.durationSeconds ?? 0.1;
    oscillator.type = definition.oscillator;
    oscillator.frequency.setValueAtTime(definition.frequencyHz, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      definition.endFrequencyHz ?? definition.frequencyHz,
      start + duration,
    );
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(this.effectVolume(definition.gain), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect();
      gain.disconnect();
    }, { once: true });
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private startProceduralAmbience(definition: ProceduralAudioFallback): void {
    if (definition.generator !== 'web-audio-ambience') {
      return;
    }
    const context = this.unlock();
    if (!context) {
      return;
    }
    this.ambientGain = context.createGain();
    this.ambientGain.gain.setValueAtTime(this.ambientVolume(), context.currentTime);
    this.ambientGain.connect(context.destination);
    for (const frequency of [definition.frequencyHz, definition.endFrequencyHz ?? definition.frequencyHz]) {
      const oscillator = context.createOscillator();
      oscillator.type = definition.oscillator;
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.connect(this.ambientGain);
      oscillator.start();
      this.ambientOscillators.push(oscillator);
    }
  }

  private handleFileEffectFailure(definition: AudioAssetDefinition, error?: unknown): void {
    this.reportFileFailure(definition, error);
    this.playProceduralEffect(definition.developmentFallback);
  }

  private handleFileAmbienceFailure(definition: AudioAssetDefinition, error?: unknown): void {
    this.reportFileFailure(definition, error);
    if (!this.ambientFile && this.ambientOscillators.length === 0) {
      this.startProceduralAmbience(definition.developmentFallback);
    }
  }

  private reportFileFailure(definition: AudioAssetDefinition, error?: unknown): void {
    const source = definition.source;
    if (!source) {
      return;
    }
    const key = `${definition.id}|${source.url}`;
    if (this.failedSourceWarnings.has(key)) {
      return;
    }
    this.failedSourceWarnings.add(key);
    this.runtime.warn(
      `[AudioSystem] Could not play ${definition.id} from ${source.filePath}; using its procedural fallback.`,
      error,
    );
  }

  private trimActiveFileEffects(): void {
    while (this.activeFileEffects.size > this.runtime.maxActiveFileEffects) {
      const oldest = this.activeFileEffects.values().next().value;
      if (!oldest) {
        return;
      }
      oldest.dispose(true);
    }
  }

  private stopFilePlayer(player: AudioFilePlayer): void {
    player.pause();
    try {
      player.currentTime = 0;
    } catch {
      // Some browsers reject seeking before metadata has loaded. Pausing is sufficient cleanup.
    }
  }

  private unlock(): AudioContext | undefined {
    this.context ??= this.runtime.createContext();
    if (this.context?.state === 'suspended') {
      void this.context.resume();
    }
    return this.context;
  }

  private effectVolume(gain: number): number {
    return this.clampVolume(gain * this.settings.masterVolume * this.settings.effectsVolume);
  }

  private ambientVolume(): number {
    const fallback = this.definitions.get('limbo-ambience')?.developmentFallback;
    return this.clampVolume((fallback?.gain ?? 0) * this.settings.masterVolume * this.settings.musicVolume);
  }

  private clampVolume(value: number): number {
    return Math.min(1, Math.max(0, value));
  }
}

export const audio = new AudioSystem();
