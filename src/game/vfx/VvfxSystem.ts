import type Phaser from 'phaser';
import {
  loadVvfxAssets,
  playVvfx,
  type BeamEndpoints,
  type VvfxEffectOptions,
  type VvfxRuntimeDefinition,
} from '@vvfx/phaser-runtime';
import { discoveredVvfxCatalog } from './discoveredVvfxCatalog';
import type { VvfxCatalog, VvfxCatalogEntry } from './VvfxCatalog';

export interface VvfxPoint {
  readonly x: number;
  readonly y: number;
}

interface VvfxSeedOverride {
  /** Overrides the authored deterministic seed for this playback only. */
  readonly seed?: number;
}

interface VvfxManagedLifetimeOptions {
  /**
   * Keeps the underlying runtime instance after a one-shot completes so the
   * managed handle can replay it. Managed calls default to true; legacy
   * fire-and-forget calls always release on completion.
   */
  readonly retainAfterComplete?: boolean;
}

export interface VvfxSpawnAtOptions
  extends VvfxPoint,
    VvfxSeedOverride,
    VvfxManagedLifetimeOptions {
  readonly baseDepth?: number;
}

export interface VvfxSpawnBetweenOptions
  extends VvfxSeedOverride,
    VvfxManagedLifetimeOptions {
  readonly start: VvfxPoint;
  readonly end: VvfxPoint;
  readonly baseDepth?: number;
  readonly beamFit?: 'stretch' | 'crop';
  readonly beamThicknessScale?: number;
  readonly maxDurationMs?: number;
}

export interface VvfxPlayback {
  hasEffect(id: string): boolean;
  supportsEndpoints(id: string): boolean;
  spawnAt(id: string, options: VvfxSpawnAtOptions): boolean;
  spawnBetween(id: string, options: VvfxSpawnBetweenOptions): boolean;
}

export type VvfxManagedState =
  | 'pending'
  | 'playing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface VvfxManagedDiagnostics {
  readonly pendingCount: number;
  readonly activeCount: number;
  /** Completed replayable runtime instances that still require cancellation. */
  readonly retainedCount: number;
  /** Every owned runtime instance: pending, active, or completed-retained. */
  readonly totalCount: number;
}

/**
 * A stable game-side handle. Calls made while assets load are retained and
 * applied to the runtime handle as soon as playback is constructed.
 */
export interface VvfxManagedHandle {
  readonly accepted: boolean;
  readonly ready: Promise<boolean>;
  readonly state: VvfxManagedState;
  readonly isPlaying: boolean;
  readonly isDestroyed: boolean;
  readonly currentTime: number;
  play(): this;
  pause(): this;
  restart(): this;
  stop(): this;
  setPosition(x: number, y: number): this;
  setEndpoints(startX: number, startY: number, endX: number, endY: number): this;
  clearEndpoints(): this;
  step(deltaMs: number): this;
  cancel(): void;
}

export interface ManagedVvfxPlayback extends VvfxPlayback {
  spawnAtManaged(id: string, options: VvfxSpawnAtOptions): VvfxManagedHandle;
  spawnBetweenManaged(id: string, options: VvfxSpawnBetweenOptions): VvfxManagedHandle;
  getDiagnostics(): VvfxManagedDiagnostics;
}

/** The subset of the runtime effect used by the bridge and its test adapter. */
export interface VvfxRuntimeEffectHandle {
  readonly isPlaying?: boolean;
  readonly isDestroyed?: boolean;
  readonly currentTime?: number;
  play?(): unknown;
  pause?(): unknown;
  restart?(): unknown;
  stop?(): unknown;
  setPosition?(x: number, y: number): unknown;
  setEndpoints?(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    layerId?: string,
  ): unknown;
  clearEndpoints?(layerId?: string): unknown;
  update?(deltaMs: number): void;
  destroy(): void;
}

export interface VvfxRuntimeAdapter {
  loadAssets(
    scene: Phaser.Scene,
    definition: VvfxRuntimeDefinition,
    assetKeys?: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<void>;
  play(
    scene: Phaser.Scene,
    definition: VvfxRuntimeDefinition,
    options?: VvfxEffectOptions,
  ): Promise<VvfxRuntimeEffectHandle>;
}

export interface VvfxLogger {
  warn(message: string): void;
  error(message: string): void;
}

export interface VvfxSystemOptions {
  readonly catalog?: VvfxCatalog;
  readonly baseDepth?: number;
  readonly logger?: VvfxLogger;
  readonly runtime?: VvfxRuntimeAdapter;
  readonly assetKeysByEffect?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

interface ManagedPlaybackOptions extends VvfxEffectOptions {
  seed?: number;
}

const DEFAULT_RUNTIME: VvfxRuntimeAdapter = {
  loadAssets: (scene, definition, assetKeys, signal) =>
    loadVvfxAssets(scene, definition, assetKeys, signal),
  play: (scene, definition, options) => playVvfx(scene, definition, options),
};

function finitePoint(point: VvfxPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function finiteEndpoints(endpoints: BeamEndpoints | undefined): endpoints is BeamEndpoints {
  return Boolean(
    endpoints &&
      Number.isFinite(endpoints.startX) &&
      Number.isFinite(endpoints.startY) &&
      Number.isFinite(endpoints.endX) &&
      Number.isFinite(endpoints.endY),
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function normalizedSeed(seed: number | undefined): number | undefined {
  if (!Number.isFinite(seed)) {
    return undefined;
  }
  return Math.trunc(seed!);
}

class ManagedVvfxHandleImpl implements VvfxManagedHandle {
  readonly ready: Promise<boolean>;
  private resolveReady!: (ready: boolean) => void;
  private readySettled = false;
  private runtimeHandle?: VvfxRuntimeEffectHandle;
  private currentState: VvfxManagedState = 'pending';
  private pausedBeforeReady = false;
  private finishedNotified = false;

  constructor(
    readonly accepted: boolean,
    private readonly options: ManagedPlaybackOptions,
    private readonly retainAfterComplete: boolean,
    private readonly onFinished: () => void,
  ) {
    this.ready = new Promise<boolean>((resolve) => {
      this.resolveReady = resolve;
    });
  }

  get state(): VvfxManagedState {
    return this.currentState;
  }

  get isPlaying(): boolean {
    return this.runtimeHandle?.isPlaying ?? this.currentState === 'playing';
  }

  get isDestroyed(): boolean {
    return this.runtimeHandle?.isDestroyed ?? (
      this.currentState === 'completed' ||
      this.currentState === 'failed' ||
      this.currentState === 'cancelled'
    );
  }

  get currentTime(): number {
    return this.runtimeHandle?.currentTime ?? 0;
  }

  play(): this {
    if (this.currentState === 'cancelled' || this.currentState === 'failed') {
      return this;
    }
    this.pausedBeforeReady = false;
    this.options.autoplay = true;
    if (this.currentState === 'completed' && this.runtimeHandle) {
      this.currentState = 'playing';
      this.runtimeHandle.restart?.();
    } else {
      this.runtimeHandle?.play?.();
    }
    return this;
  }

  pause(): this {
    this.pausedBeforeReady = true;
    this.options.autoplay = false;
    this.runtimeHandle?.pause?.();
    return this;
  }

  restart(): this {
    if (this.currentState === 'cancelled' || this.currentState === 'failed') {
      return this;
    }
    this.pausedBeforeReady = false;
    this.options.autoplay = true;
    if (this.currentState === 'completed' && this.runtimeHandle) {
      this.currentState = 'playing';
    }
    this.runtimeHandle?.restart?.();
    return this;
  }

  stop(): this {
    this.options.autoplay = false;
    this.runtimeHandle?.stop?.();
    return this;
  }

  setPosition(x: number, y: number): this {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return this;
    }
    this.options.originX = x;
    this.options.originY = y;
    this.runtimeHandle?.setPosition?.(x, y);
    return this;
  }

  setEndpoints(startX: number, startY: number, endX: number, endY: number): this {
    const endpoints = { startX, startY, endX, endY };
    if (!finiteEndpoints(endpoints)) {
      return this;
    }
    this.options.beamEndpoints = endpoints;
    this.options.originX = startX;
    this.options.originY = startY;
    this.runtimeHandle?.setEndpoints?.(startX, startY, endX, endY);
    return this;
  }

  clearEndpoints(): this {
    delete this.options.beamEndpoints;
    this.runtimeHandle?.clearEndpoints?.();
    return this;
  }

  step(deltaMs: number): this {
    const runtimeHandle = this.runtimeHandle;
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || !runtimeHandle?.update) {
      return this;
    }
    const wasPlaying = runtimeHandle.isPlaying ?? false;
    if (this.currentState === 'completed' && this.retainAfterComplete) {
      this.currentState = 'playing';
      runtimeHandle.restart?.();
    } else if (!wasPlaying) {
      runtimeHandle.play?.();
    }
    runtimeHandle.update(deltaMs);
    if (!wasPlaying) {
      runtimeHandle.pause?.();
    }
    return this;
  }

  cancel(): void {
    if (this.currentState === 'cancelled' || this.currentState === 'failed') {
      return;
    }
    this.currentState = 'cancelled';
    this.runtimeHandle?.destroy();
    this.runtimeHandle = undefined;
    this.settleReady(false);
    this.notifyFinished();
  }

  playbackOptions(): ManagedPlaybackOptions {
    const playbackOptions: ManagedPlaybackOptions = {
      ...this.options,
      beamEndpoints: this.options.beamEndpoints
        ? { ...this.options.beamEndpoints }
        : undefined,
    };
    if (!playbackOptions.beamEndpoints) {
      delete playbackOptions.beamEndpoints;
    }
    if (playbackOptions.seed === undefined) {
      delete playbackOptions.seed;
    }
    return playbackOptions;
  }

  bind(runtimeHandle: VvfxRuntimeEffectHandle, completed: boolean): void {
    if (this.currentState === 'cancelled' || this.currentState === 'failed') {
      runtimeHandle.destroy();
      return;
    }
    this.runtimeHandle = runtimeHandle;
    this.settleReady(true);
    if (completed) {
      this.complete();
      return;
    }
    this.currentState = 'playing';
    if (this.pausedBeforeReady) {
      runtimeHandle.pause?.();
    }
  }

  complete(): void {
    if (this.currentState === 'cancelled' || this.currentState === 'failed') {
      return;
    }
    this.currentState = 'completed';
    this.settleReady(true);
    if (!this.retainAfterComplete) {
      this.runtimeHandle = undefined;
      this.notifyFinished();
    }
  }

  fail(): void {
    if (this.isTerminal()) {
      return;
    }
    this.currentState = 'failed';
    this.runtimeHandle = undefined;
    this.settleReady(false);
    this.notifyFinished();
  }

  private isTerminal(): boolean {
    return (
      this.currentState === 'completed' ||
      this.currentState === 'failed' ||
      this.currentState === 'cancelled'
    );
  }

  private settleReady(ready: boolean): void {
    if (this.readySettled) {
      return;
    }
    this.readySettled = true;
    this.resolveReady(ready);
  }

  private notifyFinished(): void {
    if (this.finishedNotified) {
      return;
    }
    this.finishedNotified = true;
    this.onFinished();
  }
}

/**
 * Scene-scoped bridge between gameplay code and drop-in Vvfx Runtime JSON.
 * Legacy calls stay fire-and-forget, while managed calls expose attachment,
 * playback, cancellation, and diagnostics without leaking raw composition into
 * weapon definitions.
 */
export class VvfxSystem implements ManagedVvfxPlayback {
  private readonly catalog: VvfxCatalog;
  private readonly baseDepth: number;
  private readonly logger: VvfxLogger;
  private readonly runtime: VvfxRuntimeAdapter;
  private readonly assetKeysByEffect: Readonly<
    Record<string, Readonly<Record<string, string>>>
  >;
  private readonly controller = new AbortController();
  private readonly preloadPromises = new Map<string, Promise<boolean>>();
  private readonly managedEffects = new Set<ManagedVvfxHandleImpl>();
  private readonly reportedMessages = new Set<string>();
  private disposed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    options: VvfxSystemOptions = {},
  ) {
    this.catalog = options.catalog ?? discoveredVvfxCatalog;
    this.baseDepth = Number.isFinite(options.baseDepth) ? options.baseDepth! : 32;
    this.logger = options.logger ?? console;
    this.runtime = options.runtime ?? DEFAULT_RUNTIME;
    this.assetKeysByEffect = options.assetKeysByEffect ?? {};

    for (const issue of this.catalog.issues) {
      this.report(
        'error',
        `catalog:${issue.sourcePath}`,
        `[VVFX] Could not register ${issue.sourcePath}: ${issue.message}`,
      );
    }
    this.scene.events.once('shutdown', this.handleSceneShutdown);
  }

  hasEffect(id: string): boolean {
    return this.catalog.effects.has(id);
  }

  supportsEndpoints(id: string): boolean {
    return this.catalog.effects.get(id)?.supportsEndpoints ?? false;
  }

  /** Preloads every embedded image once for this scene. Safe to call repeatedly. */
  async preload(): Promise<void> {
    await Promise.all(
      [...this.catalog.effects.values()].map((entry) => this.preloadEffect(entry)),
    );
  }

  spawnAt(id: string, options: VvfxSpawnAtOptions): boolean {
    return this.spawnAtInternal(id, options, false).accepted;
  }

  spawnAtManaged(id: string, options: VvfxSpawnAtOptions): VvfxManagedHandle {
    return this.spawnAtInternal(id, options, options.retainAfterComplete ?? true);
  }

  private spawnAtInternal(
    id: string,
    options: VvfxSpawnAtOptions,
    retainAfterComplete: boolean,
  ): VvfxManagedHandle {
    const entry = this.resolveEntry(id);
    if (!entry) {
      return this.rejectedHandle();
    }
    if (!finitePoint(options)) {
      this.report(
        'error',
        `invalid-point:${id}`,
        `[VVFX:${id}] Cannot play at a non-finite position.`,
      );
      return this.rejectedHandle();
    }

    return this.enqueue(
      entry,
      {
        originX: options.x,
        originY: options.y,
        baseDepth: this.resolveDepth(options.baseDepth),
        seed: normalizedSeed(options.seed),
        autoDestroy: !retainAfterComplete,
      },
      retainAfterComplete,
    );
  }

  spawnBetween(id: string, options: VvfxSpawnBetweenOptions): boolean {
    return this.spawnBetweenInternal(id, options, false).accepted;
  }

  spawnBetweenManaged(
    id: string,
    options: VvfxSpawnBetweenOptions,
  ): VvfxManagedHandle {
    return this.spawnBetweenInternal(
      id,
      options,
      options.retainAfterComplete ?? true,
    );
  }

  private spawnBetweenInternal(
    id: string,
    options: VvfxSpawnBetweenOptions,
    retainAfterComplete: boolean,
  ): VvfxManagedHandle {
    const entry = this.resolveEntry(id);
    if (!entry) {
      return this.rejectedHandle();
    }
    if (!finitePoint(options.start) || !finitePoint(options.end)) {
      this.report(
        'error',
        `invalid-endpoints:${id}`,
        `[VVFX:${id}] Cannot play between non-finite positions.`,
      );
      return this.rejectedHandle();
    }

    const baseDepth = this.resolveDepth(options.baseDepth);
    if (!entry.supportsEndpoints) {
      this.report(
        'warn',
        `point-fallback:${id}`,
        `[VVFX:${id}] This export has no Beam layer. It will play at the segment midpoint without endpoint fitting, stretching, or rotation.`,
      );
      return this.enqueue(
        entry,
        {
          originX: (options.start.x + options.end.x) / 2,
          originY: (options.start.y + options.end.y) / 2,
          baseDepth,
          maxDurationMs: options.maxDurationMs,
          seed: normalizedSeed(options.seed),
          autoDestroy: !retainAfterComplete,
        },
        retainAfterComplete,
      );
    }

    return this.enqueue(
      entry,
      {
        originX: options.start.x,
        originY: options.start.y,
        baseDepth,
        beamEndpoints: {
          startX: options.start.x,
          startY: options.start.y,
          endX: options.end.x,
          endY: options.end.y,
        },
        beamFit: options.beamFit,
        beamThicknessScale: options.beamThicknessScale,
        maxDurationMs: options.maxDurationMs,
        seed: normalizedSeed(options.seed),
        autoDestroy: !retainAfterComplete,
      },
      retainAfterComplete,
    );
  }

  getDiagnostics(): VvfxManagedDiagnostics {
    let pendingCount = 0;
    let activeCount = 0;
    let retainedCount = 0;
    for (const effect of this.managedEffects) {
      if (effect.state === 'pending') {
        pendingCount += 1;
      } else if (effect.state === 'playing') {
        activeCount += 1;
      } else if (effect.state === 'completed') {
        retainedCount += 1;
      }
    }
    return {
      pendingCount,
      activeCount,
      retainedCount,
      totalCount: pendingCount + activeCount + retainedCount,
    };
  }

  destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.scene.events.off('shutdown', this.handleSceneShutdown);
    this.controller.abort();
    for (const effect of [...this.managedEffects]) {
      try {
        effect.cancel();
      } catch (error) {
        this.report(
          'error',
          `cleanup:${errorMessage(error)}`,
          `[VVFX] An effect could not be cleaned up: ${errorMessage(error)}`,
        );
      }
    }
    this.managedEffects.clear();
  }

  private resolveEntry(id: string): VvfxCatalogEntry | undefined {
    const entry = this.catalog.effects.get(id);
    if (!entry) {
      this.report(
        'error',
        `missing:${id}`,
        `[VVFX:${id}] No ${id}.vvfx-runtime.json export was discovered.`,
      );
    }
    return entry;
  }

  private resolveDepth(depth: number | undefined): number {
    return Number.isFinite(depth) ? depth! : this.baseDepth;
  }

  private assetKeysFor(id: string): Record<string, string> {
    return { ...(this.assetKeysByEffect[id] ?? {}) };
  }

  private preloadEffect(entry: VvfxCatalogEntry): Promise<boolean> {
    const existing = this.preloadPromises.get(entry.id);
    if (existing) {
      return existing;
    }

    const loading = (async () => {
      if (this.disposed) {
        return false;
      }
      try {
        await this.runtime.loadAssets(
          this.scene,
          entry.definition,
          this.assetKeysFor(entry.id),
          this.controller.signal,
        );
        return !this.disposed;
      } catch (error) {
        if (!this.disposed && !isAbortError(error)) {
          this.report(
            'error',
            `preload:${entry.id}:${errorMessage(error)}`,
            `[VVFX:${entry.id}] Asset preload failed: ${errorMessage(error)}`,
          );
        }
        return false;
      }
    })();
    this.preloadPromises.set(entry.id, loading);
    return loading;
  }

  private enqueue(
    entry: VvfxCatalogEntry,
    options: ManagedPlaybackOptions,
    retainAfterComplete: boolean,
  ): ManagedVvfxHandleImpl {
    const handle = new ManagedVvfxHandleImpl(true, options, retainAfterComplete, () => {
      this.managedEffects.delete(handle);
    });
    this.managedEffects.add(handle);
    void this.startPlayback(entry, handle);
    return handle;
  }

  private rejectedHandle(): ManagedVvfxHandleImpl {
    const handle = new ManagedVvfxHandleImpl(false, {}, false, () => {
      this.managedEffects.delete(handle);
    });
    this.managedEffects.add(handle);
    handle.fail();
    return handle;
  }

  private async startPlayback(
    entry: VvfxCatalogEntry,
    managed: ManagedVvfxHandleImpl,
  ): Promise<void> {
    if (!(await this.preloadEffect(entry)) || this.disposed) {
      if (this.disposed) {
        managed.cancel();
      } else {
        managed.fail();
      }
      return;
    }
    if (managed.state === 'cancelled') {
      return;
    }

    let completed = false;
    try {
      const playbackOptions = managed.playbackOptions();
      const seed = playbackOptions.seed;
      delete playbackOptions.seed;
      const effect = await this.runtime.play(
        this.scene,
        seed === undefined ? entry.definition : { ...entry.definition, seed },
        {
          ...playbackOptions,
          assetKeys: this.assetKeysFor(entry.id),
          signal: this.controller.signal,
          onWarning: (message) =>
            this.report(
              'warn',
              `runtime-warning:${entry.id}:${message}`,
              `[VVFX:${entry.id}] ${message}`,
            ),
          onComplete: () => {
            completed = true;
            managed.complete();
          },
        },
      );
      if (this.disposed) {
        effect.destroy();
        managed.cancel();
      } else {
        managed.bind(effect, completed);
      }
    } catch (error) {
      if (!this.disposed && !isAbortError(error)) {
        this.report(
          'error',
          `play:${entry.id}:${errorMessage(error)}`,
          `[VVFX:${entry.id}] Playback failed: ${errorMessage(error)}`,
        );
      }
      if (this.disposed || isAbortError(error)) {
        managed.cancel();
      } else {
        managed.fail();
      }
    }
  }

  private report(level: 'warn' | 'error', key: string, message: string): void {
    if (this.reportedMessages.has(key)) {
      return;
    }
    this.reportedMessages.add(key);
    this.logger[level](message);
  }

  private readonly handleSceneShutdown = (): void => {
    this.destroy();
  };
}
