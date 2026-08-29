import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import chainLightning from '../vfx/effects/chain-lightning.vvfx-runtime.json';
import { createVvfxCatalog } from '../vfx/VvfxCatalog';
import {
  VvfxSystem,
  type VvfxLogger,
  type VvfxRuntimeAdapter,
} from '../vfx/VvfxSystem';

class FakeSceneEvents {
  private readonly listeners = new Map<string, Set<() => void>>();

  once(event: string, listener: () => void): this {
    const onceListener = () => {
      this.off(event, onceListener);
      listener();
    };
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(onceListener);
    this.listeners.set(event, listeners);
    return this;
  }

  off(event: string, listener: () => void): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string): void {
    for (const listener of [...(this.listeners.get(event) ?? [])]) {
      listener();
    }
  }
}

function createFakeScene(): { scene: Phaser.Scene; events: FakeSceneEvents } {
  const events = new FakeSceneEvents();
  return {
    scene: { events } as unknown as Phaser.Scene,
    events,
  };
}

function createRuntime() {
  const handle = { destroy: vi.fn() };
  const loadAssets = vi
    .fn<VvfxRuntimeAdapter['loadAssets']>()
    .mockResolvedValue(undefined);
  const play = vi.fn<VvfxRuntimeAdapter['play']>().mockResolvedValue(handle);
  return {
    handle,
    runtime: { loadAssets, play } satisfies VvfxRuntimeAdapter,
  };
}

function createLogger() {
  return {
    warn: vi.fn(),
    error: vi.fn(),
  } satisfies VvfxLogger;
}

function chainCatalog() {
  return createVvfxCatalog({
    './effects/chain-lightning.vvfx-runtime.json': chainLightning,
  });
}

function nonBeamCatalog() {
  const catalog = chainCatalog();
  const entry = catalog.effects.get('chain-lightning')!;
  return {
    issues: [],
    effects: new Map([
      ['chain-lightning', { ...entry, supportsEndpoints: false }],
    ]),
  };
}

describe('VvfxSystem', () => {
  it('preloads each export once and keeps gameplay calls fire-and-forget', async () => {
    const { scene } = createFakeScene();
    const { runtime } = createRuntime();
    const system = new VvfxSystem(scene, {
      catalog: chainCatalog(),
      runtime,
      logger: createLogger(),
    });

    await Promise.all([system.preload(), system.preload()]);
    expect(runtime.loadAssets).toHaveBeenCalledTimes(1);

    expect(system.spawnAt('chain-lightning', { x: 12, y: 34 })).toBe(true);
    await vi.waitFor(() => expect(runtime.play).toHaveBeenCalledTimes(1));
    expect(runtime.loadAssets).toHaveBeenCalledTimes(1);
    expect(runtime.play.mock.calls[0]?.[2]).toMatchObject({
      originX: 12,
      originY: 34,
      baseDepth: 32,
    });
  });

  it('warns once and uses a midpoint fallback for a non-Beam export', async () => {
    const { scene } = createFakeScene();
    const { runtime } = createRuntime();
    const logger = createLogger();
    const system = new VvfxSystem(scene, {
      catalog: nonBeamCatalog(),
      runtime,
      logger,
    });

    expect(
      system.spawnBetween('chain-lightning', {
        start: { x: 10, y: 20 },
        end: { x: 50, y: 80 },
        maxDurationMs: 500,
      }),
    ).toBe(true);
    await vi.waitFor(() => expect(runtime.play).toHaveBeenCalledTimes(1));
    expect(runtime.play.mock.calls[0]?.[2]).toMatchObject({
      originX: 30,
      originY: 50,
      maxDurationMs: 500,
    });
    expect(runtime.play.mock.calls[0]?.[2]).not.toHaveProperty('beamEndpoints');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('no Beam layer'),
    );

    system.spawnBetween('chain-lightning', {
      start: { x: 0, y: 0 },
      end: { x: 100, y: 100 },
    });
    await vi.waitFor(() => expect(runtime.play).toHaveBeenCalledTimes(2));
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('passes world-space endpoints only for a Beam-capable export', async () => {
    const { scene } = createFakeScene();
    const { runtime } = createRuntime();
    const system = new VvfxSystem(scene, {
      catalog: chainCatalog(),
      runtime,
      logger: createLogger(),
    });

    expect(
      system.spawnBetween('chain-lightning', {
        start: { x: 15, y: 25 },
        end: { x: 90, y: 120 },
        baseDepth: 40,
        beamFit: 'crop',
        beamThicknessScale: 0.67,
        maxDurationMs: 500,
      }),
    ).toBe(true);
    await vi.waitFor(() => expect(runtime.play).toHaveBeenCalledTimes(1));
    expect(runtime.play.mock.calls[0]?.[2]).toMatchObject({
      originX: 15,
      originY: 25,
      baseDepth: 40,
      beamEndpoints: {
        startX: 15,
        startY: 25,
        endX: 90,
        endY: 120,
      },
      beamFit: 'crop',
      beamThicknessScale: 0.67,
      maxDurationMs: 500,
    });
  });

  it('deduplicates missing-effect errors and destroys active effects on shutdown', async () => {
    const { scene, events } = createFakeScene();
    const { runtime, handle } = createRuntime();
    const logger = createLogger();
    const system = new VvfxSystem(scene, {
      catalog: chainCatalog(),
      runtime,
      logger,
    });

    expect(system.spawnAt('missing', { x: 0, y: 0 })).toBe(false);
    expect(system.spawnAt('missing', { x: 0, y: 0 })).toBe(false);
    expect(logger.error).toHaveBeenCalledTimes(1);

    system.spawnAt('chain-lightning', { x: 0, y: 0 });
    await vi.waitFor(() => expect(runtime.play).toHaveBeenCalledTimes(1));
    events.emit('shutdown');
    expect(handle.destroy).toHaveBeenCalledTimes(1);
  });

  it('forgets completed effects before scene shutdown', async () => {
    const { scene, events } = createFakeScene();
    const { runtime, handle } = createRuntime();
    const system = new VvfxSystem(scene, {
      catalog: chainCatalog(),
      runtime,
      logger: createLogger(),
    });

    system.spawnAt('chain-lightning', { x: 0, y: 0 });
    await vi.waitFor(() => expect(runtime.play).toHaveBeenCalledTimes(1));
    runtime.play.mock.calls[0]?.[2]?.onComplete?.();
    events.emit('shutdown');

    expect(handle.destroy).not.toHaveBeenCalled();
  });
});
