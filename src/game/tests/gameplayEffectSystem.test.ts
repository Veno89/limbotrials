import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import {
  GameplayEffectSystem,
  type GameplayEffectFallbackHandle,
  type GameplayEffectFallbackRenderer,
} from '../vfx/GameplayEffectSystem';
import type {
  ManagedVvfxPlayback,
  VvfxManagedHandle,
  VvfxManagedState,
} from '../vfx/VvfxSystem';

class FakeSceneEvents {
  private readonly listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  on(event: string, listener: (...args: unknown[]) => void): this {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return this;
  }

  once(event: string, listener: (...args: unknown[]) => void): this {
    const wrapped = (...args: unknown[]) => {
      this.off(event, wrapped);
      listener(...args);
    };
    return this.on(event, wrapped);
  }

  off(event: string, listener: (...args: unknown[]) => void): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of [...(this.listeners.get(event) ?? [])]) {
      listener(...args);
    }
  }
}

function fakeManagedHandle(initialState: VvfxManagedState = 'playing'): VvfxManagedHandle {
  let state = initialState;
  const handle: VvfxManagedHandle = {
    accepted: true,
    ready: Promise.resolve(initialState !== 'failed'),
    get state() {
      return state;
    },
    get isPlaying() {
      return state === 'playing';
    },
    get isDestroyed() {
      return state === 'cancelled' || state === 'failed' || state === 'completed';
    },
    currentTime: 0,
    play: vi.fn((): VvfxManagedHandle => handle),
    pause: vi.fn((): VvfxManagedHandle => handle),
    restart: vi.fn((): VvfxManagedHandle => handle),
    stop: vi.fn((): VvfxManagedHandle => handle),
    setPosition: vi.fn((): VvfxManagedHandle => handle),
    setEndpoints: vi.fn((): VvfxManagedHandle => handle),
    clearEndpoints: vi.fn((): VvfxManagedHandle => handle),
    step: vi.fn((): VvfxManagedHandle => handle),
    cancel: vi.fn(() => {
      state = 'cancelled';
    }),
  };
  return handle;
}

function fakePlayback(options: { hasEffects?: boolean; handle?: VvfxManagedHandle } = {}) {
  const handle = options.handle ?? fakeManagedHandle();
  const playback = {
    hasEffect: vi.fn(() => options.hasEffects ?? true),
    supportsEndpoints: vi.fn(() => true),
    spawnAt: vi.fn(() => true),
    spawnBetween: vi.fn(() => true),
    spawnAtManaged: vi.fn(() => handle),
    spawnBetweenManaged: vi.fn(() => handle),
    getDiagnostics: vi.fn(() => ({
      pendingCount: 0,
      activeCount: 1,
      retainedCount: 0,
      totalCount: 1,
    })),
  } satisfies ManagedVvfxPlayback;
  return { playback, handle };
}

function fakeScene(): { scene: Phaser.Scene; events: FakeSceneEvents } {
  const events = new FakeSceneEvents();
  return { scene: { events } as unknown as Phaser.Scene, events };
}

function fallbackRenderer() {
  const beamHandle: GameplayEffectFallbackHandle = { destroy: vi.fn() };
  const pointHandle: GameplayEffectFallbackHandle = { destroy: vi.fn() };
  const renderer = {
    beam: vi.fn(() => beamHandle),
    point: vi.fn(() => pointHandle),
    destroy: vi.fn(),
  } satisfies GameplayEffectFallbackRenderer;
  return { renderer, beamHandle, pointHandle };
}

describe('GameplayEffectSystem', () => {
  it('uses safe code fallbacks when required runtime effects are missing', () => {
    const { scene } = fakeScene();
    const { playback } = fakePlayback({ hasEffects: false });
    const fallback = fallbackRenderer();
    const system = new GameplayEffectSystem(scene, playback, {
      fallbackRenderer: fallback.renderer,
      logger: { warn: vi.fn(), error: vi.fn() },
    });

    const effect = system.playBeam('tesla-chain', 'initialDischarge', {
      start: () => ({ x: 10, y: 20 }),
      end: () => ({ x: 30, y: 40 }),
      seed: 12,
    });

    expect(effect.usedFallback).toBe(true);
    expect(playback.spawnBetweenManaged).not.toHaveBeenCalled();
    expect(fallback.renderer.beam).toHaveBeenCalledWith(
      { x: 10, y: 20 },
      { x: 30, y: 40 },
      expect.objectContaining({ kind: 'beam' }),
      32,
      expect.any(Function),
    );
  });

  it('falls back after asynchronous runtime playback fails', async () => {
    const { scene } = fakeScene();
    const failedHandle = fakeManagedHandle('failed');
    const { playback } = fakePlayback({ hasEffects: true, handle: failedHandle });
    const fallback = fallbackRenderer();
    const system = new GameplayEffectSystem(scene, playback, {
      fallbackRenderer: fallback.renderer,
      logger: { warn: vi.fn(), error: vi.fn() },
    });

    const effect = system.playBeam('tesla-chain', 'beam', {
      start: () => ({ x: 0, y: 0 }),
      end: () => ({ x: 20, y: 0 }),
    });
    await failedHandle.ready;
    await Promise.resolve();

    expect(effect.usedFallback).toBe(true);
    expect(fallback.renderer.beam).toHaveBeenCalledTimes(1);
  });

  it('updates managed Beam endpoints and cancels when an attachment disappears', async () => {
    const { scene } = fakeScene();
    const { playback, handle } = fakePlayback();
    const fallback = fallbackRenderer();
    let start = { x: 1, y: 2 } as { x: number; y: number } | undefined;
    let end = { x: 3, y: 4 } as { x: number; y: number } | undefined;
    const system = new GameplayEffectSystem(scene, playback, {
      fallbackRenderer: fallback.renderer,
      logger: { warn: vi.fn(), error: vi.fn() },
    });

    system.playBeam('tesla-chain', 'beam', {
      start: () => start,
      end: () => end,
    });
    await handle.ready;
    start = { x: 10, y: 20 };
    end = { x: 30, y: 40 };
    system.update();

    expect(handle.setEndpoints).toHaveBeenCalledWith(10, 20, 30, 40);
    end = undefined;
    system.update();
    expect(handle.cancel).toHaveBeenCalledTimes(1);
    expect(system.getDiagnostics().semanticActiveCount).toBe(0);
  });

  it('defaults semantic gameplay effects to transient runtime handles', () => {
    const { scene } = fakeScene();
    const completed = fakeManagedHandle('completed');
    const { playback } = fakePlayback({ handle: completed });
    const system = new GameplayEffectSystem(scene, playback, {
      fallbackRenderer: fallbackRenderer().renderer,
      logger: { warn: vi.fn(), error: vi.fn() },
    });

    const effect = system.playBeam('tesla-chain', 'beam', {
      start: () => ({ x: 0, y: 0 }),
      end: () => ({ x: 20, y: 0 }),
    });
    expect(playback.spawnBetweenManaged).toHaveBeenCalledWith(
      'tesla-chain-link',
      expect.objectContaining({ retainAfterComplete: false }),
    );

    system.update();
    expect(effect.active).toBe(false);
    expect(effect.runtimeHandle).toBeUndefined();
  });

  it('retains an explicitly replayable semantic preview until cancellation', () => {
    const { scene } = fakeScene();
    const completed = fakeManagedHandle('completed');
    const { playback } = fakePlayback({ handle: completed });
    const system = new GameplayEffectSystem(scene, playback, {
      fallbackRenderer: fallbackRenderer().renderer,
      logger: { warn: vi.fn(), error: vi.fn() },
    });

    const effect = system.playBeam('tesla-chain', 'beam', {
      start: () => ({ x: 0, y: 0 }),
      end: () => ({ x: 20, y: 0 }),
      retainAfterComplete: true,
    });
    expect(playback.spawnBetweenManaged).toHaveBeenCalledWith(
      'tesla-chain-link',
      expect.objectContaining({ retainAfterComplete: true }),
    );

    system.update();
    expect(effect.active).toBe(true);
    expect(effect.runtimeHandle).toBe(completed);
    effect.runtimeHandle?.restart();
    expect(completed.restart).toHaveBeenCalledTimes(1);
    effect.cancel();
    expect(completed.cancel).toHaveBeenCalledTimes(1);
    expect(effect.active).toBe(false);
  });

  it('keeps fallback effects attached to moving points', () => {
    const { scene } = fakeScene();
    const { playback } = fakePlayback({ hasEffects: false });
    const fallback = fallbackRenderer();
    const setEndpoints = vi.fn();
    const setPosition = vi.fn();
    fallback.renderer.beam.mockReturnValue({ destroy: vi.fn(), setEndpoints });
    fallback.renderer.point.mockReturnValue({ destroy: vi.fn(), setPosition });
    const system = new GameplayEffectSystem(scene, playback, {
      fallbackRenderer: fallback.renderer,
      logger: { warn: vi.fn(), error: vi.fn() },
    });
    let start = { x: 1, y: 2 };
    let end = { x: 3, y: 4 };

    system.playBeam('tesla-chain', 'beam', {
      start: () => start,
      end: () => end,
    });
    system.playPoint('tesla-chain', 'impact', {
      point: () => end,
      follow: true,
    });
    start = { x: 10, y: 20 };
    end = { x: 30, y: 40 };
    system.update();

    expect(setEndpoints).toHaveBeenCalledWith(start, end);
    expect(setPosition).toHaveBeenCalledWith(end);
  });

  it('cancels managed and fallback effects and flushes the renderer on shutdown', () => {
    const { scene, events } = fakeScene();
    const { playback, handle } = fakePlayback();
    const fallback = fallbackRenderer();
    const system = new GameplayEffectSystem(scene, playback, {
      fallbackRenderer: fallback.renderer,
      logger: { warn: vi.fn(), error: vi.fn() },
    });
    system.playBeam('tesla-chain', 'beam', {
      start: () => ({ x: 0, y: 0 }),
      end: () => ({ x: 10, y: 0 }),
    });
    const point = system.playPoint('tesla-chain', 'impact', {
      point: () => ({ x: 10, y: 0 }),
    });

    events.emit('shutdown');

    expect(handle.cancel).toHaveBeenCalledTimes(1);
    expect(point.active).toBe(false);
    expect(fallback.pointHandle.destroy).toHaveBeenCalledTimes(1);
    expect(fallback.renderer.destroy).toHaveBeenCalledTimes(1);
  });

  it('reuses bounded default fallback objects after their tween completes', () => {
    const events = new FakeSceneEvents();
    const beamCallbacks: Array<() => void> = [];
    const pointCallbacks: Array<() => void> = [];
    const graphics = {
      clear: vi.fn(),
      setPosition: vi.fn(),
      setActive: vi.fn(),
      setVisible: vi.fn(),
      setDepth: vi.fn(),
      setAlpha: vi.fn(),
      lineStyle: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      strokePath: vi.fn(),
      destroy: vi.fn(),
    };
    for (const method of Object.keys(graphics).filter((key) => key !== 'destroy')) {
      (graphics[method as keyof typeof graphics] as ReturnType<typeof vi.fn>).mockReturnValue(graphics);
    }
    const pulse = {
      setPosition: vi.fn(),
      setRadius: vi.fn(),
      setScale: vi.fn(),
      setFillStyle: vi.fn(),
      setStrokeStyle: vi.fn(),
      setDepth: vi.fn(),
      setActive: vi.fn(),
      setVisible: vi.fn(),
      setAlpha: vi.fn(),
      destroy: vi.fn(),
    };
    for (const method of Object.keys(pulse).filter((key) => key !== 'destroy')) {
      (pulse[method as keyof typeof pulse] as ReturnType<typeof vi.fn>).mockReturnValue(pulse);
    }
    const scene = {
      events,
      add: {
        graphics: vi.fn(() => graphics),
        circle: vi.fn(() => pulse),
      },
      tweens: {
        add: vi.fn((config: { targets: unknown; onComplete: () => void }) => {
          if (config.targets === graphics) beamCallbacks.push(config.onComplete);
          if (config.targets === pulse) pointCallbacks.push(config.onComplete);
        }),
        killTweensOf: vi.fn(),
      },
    } as unknown as Phaser.Scene;
    const { playback } = fakePlayback({ hasEffects: false });
    const system = new GameplayEffectSystem(scene, playback, {
      logger: { warn: vi.fn(), error: vi.fn() },
    });

    system.playBeam('tesla-chain', 'beam', {
      start: () => ({ x: 0, y: 0 }),
      end: () => ({ x: 10, y: 0 }),
    });
    beamCallbacks.shift()?.();
    system.playBeam('tesla-chain', 'beam', {
      start: () => ({ x: 0, y: 0 }),
      end: () => ({ x: 20, y: 0 }),
    });
    system.playPoint('tesla-chain', 'impact', { point: () => ({ x: 1, y: 1 }) });
    pointCallbacks.shift()?.();
    system.playPoint('tesla-chain', 'impact', { point: () => ({ x: 2, y: 2 }) });

    expect(scene.add.graphics).toHaveBeenCalledTimes(1);
    expect(scene.add.circle).toHaveBeenCalledTimes(1);
    system.destroy();
    expect(graphics.destroy).toHaveBeenCalledTimes(1);
    expect(pulse.destroy).toHaveBeenCalledTimes(1);
  });
});
