import type { SaveData } from '../types/gameTypes';

export type SoundEffect =
  | 'button'
  | 'dash'
  | 'soul-bolt'
  | 'scythe'
  | 'hellfire'
  | 'pickup'
  | 'hurt'
  | 'level-up'
  | 'boss'
  | 'shield'
  | 'victory';

interface ToneDefinition {
  frequency: number;
  endFrequency: number;
  duration: number;
  gain: number;
  type: OscillatorType;
  cooldownMs: number;
}

const TONES: Record<SoundEffect, ToneDefinition> = {
  button: { frequency: 170, endFrequency: 245, duration: 0.08, gain: 0.045, type: 'sine', cooldownMs: 50 },
  dash: { frequency: 145, endFrequency: 55, duration: 0.14, gain: 0.07, type: 'triangle', cooldownMs: 120 },
  'soul-bolt': { frequency: 480, endFrequency: 225, duration: 0.1, gain: 0.025, type: 'triangle', cooldownMs: 80 },
  scythe: { frequency: 130, endFrequency: 48, duration: 0.23, gain: 0.065, type: 'sawtooth', cooldownMs: 300 },
  hellfire: { frequency: 82, endFrequency: 36, duration: 0.38, gain: 0.08, type: 'sawtooth', cooldownMs: 300 },
  pickup: { frequency: 680, endFrequency: 1080, duration: 0.07, gain: 0.025, type: 'sine', cooldownMs: 55 },
  hurt: { frequency: 110, endFrequency: 43, duration: 0.22, gain: 0.09, type: 'square', cooldownMs: 250 },
  'level-up': { frequency: 390, endFrequency: 920, duration: 0.35, gain: 0.07, type: 'sine', cooldownMs: 500 },
  boss: { frequency: 58, endFrequency: 31, duration: 0.7, gain: 0.11, type: 'sawtooth', cooldownMs: 700 },
  shield: { frequency: 460, endFrequency: 720, duration: 0.3, gain: 0.055, type: 'sine', cooldownMs: 500 },
  victory: { frequency: 260, endFrequency: 640, duration: 0.8, gain: 0.08, type: 'triangle', cooldownMs: 1000 },
};

class AudioSystem {
  private context?: AudioContext;
  private ambientGain?: GainNode;
  private ambientOscillators: OscillatorNode[] = [];
  private readonly lastPlayedAt = new Map<SoundEffect, number>();
  private settings: SaveData['settings'] = {
    screenShake: true,
    particles: true,
    masterVolume: 0.75,
    musicVolume: 0.35,
    effectsVolume: 0.7,
  };

  configure(settings: SaveData['settings']): void {
    this.settings = settings;
    if (this.context && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume(), this.context.currentTime, 0.08);
    }
  }

  play(effect: SoundEffect): void {
    if (this.settings.masterVolume <= 0 || this.settings.effectsVolume <= 0) {
      return;
    }
    const definition = TONES[effect];
    const now = performance.now();
    if (now - (this.lastPlayedAt.get(effect) ?? 0) < definition.cooldownMs) {
      return;
    }
    this.lastPlayedAt.set(effect, now);

    const context = this.unlock();
    if (!context) {
      return;
    }
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = definition.type;
    oscillator.frequency.setValueAtTime(definition.frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(definition.endFrequency, start + definition.duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(this.effectVolume(definition.gain), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + definition.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + definition.duration + 0.02);
  }

  startAmbience(): void {
    if (this.ambientOscillators.length > 0 || this.settings.musicVolume <= 0) {
      return;
    }
    const context = this.unlock();
    if (!context) {
      return;
    }
    this.ambientGain = context.createGain();
    this.ambientGain.gain.setValueAtTime(this.ambientVolume(), context.currentTime);
    this.ambientGain.connect(context.destination);
    for (const frequency of [43, 65]) {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.connect(this.ambientGain);
      oscillator.start();
      this.ambientOscillators.push(oscillator);
    }
  }

  stopAmbience(): void {
    for (const oscillator of this.ambientOscillators) {
      oscillator.stop();
      oscillator.disconnect();
    }
    this.ambientOscillators = [];
    this.ambientGain?.disconnect();
    this.ambientGain = undefined;
  }

  private unlock(): AudioContext | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
    return this.context;
  }

  private effectVolume(gain: number): number {
    return gain * this.settings.masterVolume * this.settings.effectsVolume;
  }

  private ambientVolume(): number {
    return 0.018 * this.settings.masterVolume * this.settings.musicVolume;
  }
}

export const audio = new AudioSystem();
