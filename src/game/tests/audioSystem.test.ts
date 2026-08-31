import { describe, expect, it, vi } from 'vitest';
import type { AudioAssetDefinition, AudioCue } from '../assets/assetTypes';
import { AUDIO_ASSET_MANIFEST } from '../data/assets';
import { AudioSystem, type AudioFilePlayer } from '../systems/AudioSystem';

type AudioSettings = Parameters<AudioSystem['configure']>[0];
type FileEvent = 'ended' | 'error';

class FakeFilePlayer implements AudioFilePlayer {
  loop = false;
  preload = '';
  volume = 1;
  currentTime = 12;
  playCalls = 0;
  pauseCalls = 0;
  private readonly listeners: Record<FileEvent, Set<() => void>> = {
    ended: new Set(),
    error: new Set(),
  };

  constructor(private readonly playResult: () => Promise<void> = () => Promise.resolve()) {}

  play(): Promise<void> {
    this.playCalls += 1;
    return this.playResult();
  }

  pause(): void {
    this.pauseCalls += 1;
  }

  addEventListener(type: FileEvent, listener: () => void): void {
    this.listeners[type].add(listener);
  }

  removeEventListener(type: FileEvent, listener: () => void): void {
    this.listeners[type].delete(listener);
  }

  emit(type: FileEvent): void {
    for (const listener of [...this.listeners[type]]) {
      listener();
    }
  }
}

interface FakeOscillator {
  type: OscillatorType;
  frequency: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
}

interface FakeGain {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    setTargetAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

function createContextHarness(): {
  context: AudioContext;
  oscillators: FakeOscillator[];
  gains: FakeGain[];
} {
  const oscillators: FakeOscillator[] = [];
  const gains: FakeGain[] = [];
  const context = {
    currentTime: 4,
    state: 'running',
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: vi.fn(() => {
      const oscillator: FakeOscillator = {
        type: 'sine',
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        addEventListener: vi.fn(),
      };
      oscillators.push(oscillator);
      return oscillator as unknown as OscillatorNode;
    }),
    createGain: vi.fn(() => {
      const gain: FakeGain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          setTargetAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      gains.push(gain);
      return gain as unknown as GainNode;
    }),
  } as unknown as AudioContext;
  return { context, oscillators, gains };
}

function definitionsWithSources(cues: readonly AudioCue[]): ReadonlyMap<AudioCue, AudioAssetDefinition> {
  const sourced = new Set(cues);
  return new Map(AUDIO_ASSET_MANIFEST.map((definition) => [
    definition.cue,
    sourced.has(definition.cue)
      ? {
          ...definition,
          source: {
            kind: 'file' as const,
            filePath: `assets/audio/${definition.cue}.ogg`,
            url: `/built/${definition.cue}.ogg`,
          },
        }
      : definition,
  ]));
}

function settings(overrides: Partial<AudioSettings> = {}): AudioSettings {
  return {
    screenShake: true,
    particles: true,
    masterVolume: 0.75,
    musicVolume: 0.35,
    effectsVolume: 0.7,
    ...overrides,
  };
}

describe('AudioSystem manifest playback', () => {
  it('plays an imported SFX source and keeps its volume synchronized with settings', () => {
    const player = new FakeFilePlayer();
    const context = createContextHarness();
    const createFilePlayer = vi.fn(() => player);
    const createContext = vi.fn(() => context.context);
    const system = new AudioSystem({
      definitions: definitionsWithSources(['button']),
      runtime: { now: () => 0, createFilePlayer, createContext },
    });

    system.play('button');

    expect(createFilePlayer).toHaveBeenCalledWith('/built/button.ogg');
    expect(player.playCalls).toBe(1);
    expect(player.preload).toBe('auto');
    expect(player.loop).toBe(false);
    expect(player.volume).toBeCloseTo(0.045 * 0.75 * 0.7);
    expect(createContext).not.toHaveBeenCalled();

    system.configure(settings({ masterVolume: 0.5, effectsVolume: 0.4 }));
    expect(player.volume).toBeCloseTo(0.045 * 0.5 * 0.4);

    player.emit('ended');
    const volumeAtCleanup = player.volume;
    system.configure(settings({ masterVolume: 1, effectsVolume: 1 }));
    expect(player.volume).toBe(volumeAtCleanup);
  });

  it('keeps unsourced cues on their procedural fallback', () => {
    const context = createContextHarness();
    const createFilePlayer = vi.fn(() => new FakeFilePlayer());
    const system = new AudioSystem({
      runtime: {
        now: () => 1_000,
        createFilePlayer,
        createContext: () => context.context,
      },
    });

    system.play('button');

    expect(createFilePlayer).not.toHaveBeenCalled();
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.start).toHaveBeenCalledWith(4);
    expect(context.oscillators[0]?.stop).toHaveBeenCalledWith(4.1);
  });

  it('falls back after file errors and warns only once per manifest source', async () => {
    const context = createContextHarness();
    const players: FakeFilePlayer[] = [];
    let now = 1_000;
    const warn = vi.fn();
    const system = new AudioSystem({
      definitions: definitionsWithSources(['button']),
      runtime: {
        now: () => now,
        warn,
        createContext: () => context.context,
        createFilePlayer: () => {
          const player = new FakeFilePlayer(() => Promise.reject(new Error('decode failed')));
          players.push(player);
          return player;
        },
      },
    });

    system.play('button');
    await Promise.resolve();
    expect(context.oscillators).toHaveLength(1);
    expect(players[0]?.pauseCalls).toBe(1);
    expect(players[0]?.currentTime).toBe(0);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain('assets/audio/button.ogg');

    now = 1_100;
    system.play('button');
    await Promise.resolve();
    expect(context.oscillators).toHaveLength(2);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('bounds simultaneous file effects by stopping the oldest player', () => {
    const players: FakeFilePlayer[] = [];
    const system = new AudioSystem({
      definitions: definitionsWithSources(['button', 'dash', 'soul-bolt']),
      runtime: {
        now: () => 1_000,
        maxActiveFileEffects: 2,
        createFilePlayer: () => {
          const player = new FakeFilePlayer();
          players.push(player);
          return player;
        },
      },
    });

    system.play('button');
    system.play('dash');
    system.play('soul-bolt');

    expect(players).toHaveLength(3);
    expect(players[0]?.pauseCalls).toBe(1);
    expect(players[0]?.currentTime).toBe(0);
    expect(players[1]?.pauseCalls).toBe(0);
    expect(players[2]?.pauseCalls).toBe(0);
  });

  it('loops imported ambience, updates music volume, and falls back after a file error', () => {
    const player = new FakeFilePlayer();
    const context = createContextHarness();
    const warn = vi.fn();
    const system = new AudioSystem({
      definitions: definitionsWithSources(['limbo-ambience']),
      runtime: {
        warn,
        createFilePlayer: () => player,
        createContext: () => context.context,
      },
    });

    system.startAmbience();
    expect(player.loop).toBe(true);
    expect(player.playCalls).toBe(1);
    expect(player.volume).toBeCloseTo(0.018 * 0.75 * 0.35);
    expect(context.oscillators).toHaveLength(0);

    system.configure(settings({ masterVolume: 0.5, musicVolume: 0.2 }));
    expect(player.volume).toBeCloseTo(0.018 * 0.5 * 0.2);

    player.emit('error');
    expect(player.pauseCalls).toBe(1);
    expect(context.oscillators).toHaveLength(2);
    expect(warn).toHaveBeenCalledOnce();

    system.stopAmbience();
    expect(context.oscillators.every(({ stop, disconnect }) => (
      stop.mock.calls.length === 1 && disconnect.mock.calls.length === 1
    ))).toBe(true);
    expect(context.gains[0]?.disconnect).toHaveBeenCalledOnce();
  });
});
