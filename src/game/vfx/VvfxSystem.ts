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

export interface VvfxSpawnAtOptions extends VvfxPoint {
  readonly baseDepth?: number;
}

export interface VvfxSpawnBetweenOptions {
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

interface VvfxEffectHandle {
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
  ): Promise<VvfxEffectHandle>;
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

const DEFAULT_RUNTIME: VvfxRuntimeAdapter = {
  loadAssets: (scene, definition, assetKeys, signal) =>
    loadVvfxAssets(scene, definition, assetKeys, signal),
  play: (scene, definition, options) => playVvfx(scene, definition, options),
};

function finitePoint(point: VvfxPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * Scene-scoped bridge between gameplay code and drop-in Vvfx Runtime JSON.
 * Calls are intentionally fire-and-forget: startup and playback failures are
 * reported in one place instead of leaking promises into weapon behaviors.
 */
export class VvfxSystem implements VvfxPlayback {
  private readonly catalog: VvfxCatalog;
  private readonly baseDepth: number;
  private readonly logger: VvfxLogger;
  private readonly runtime: VvfxRuntimeAdapter;
  private readonly assetKeysByEffect: Readonly<
    Record<string, Readonly<Record<string, string>>>
  >;
  private readonly controller = new AbortController();
  private readonly preloadPromises = new Map<string, Promise<boolean>>();
  private readonly activeEffects = new Set<VvfxEffectHandle>();
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
    const entry = this.resolveEntry(id);
    if (!entry) {
      return false;
    }
    if (!finitePoint(options)) {
      this.report(
        'error',
        `invalid-point:${id}`,
        `[VVFX:${id}] Cannot play at a non-finite position.`,
      );
      return false;
    }

    this.enqueue(entry, {
      originX: options.x,
      originY: options.y,
      baseDepth: this.resolveDepth(options.baseDepth),
    });
    return true;
  }

  spawnBetween(id: string, options: VvfxSpawnBetweenOptions): boolean {
    const entry = this.resolveEntry(id);
    if (!entry) {
      return false;
    }
    if (!finitePoint(options.start) || !finitePoint(options.end)) {
      this.report(
        'error',
        `invalid-endpoints:${id}`,
        `[VVFX:${id}] Cannot play between non-finite positions.`,
      );
      return false;
    }

    const baseDepth = this.resolveDepth(options.baseDepth);
    if (!entry.supportsEndpoints) {
      this.report(
        'warn',
        `point-fallback:${id}`,
        `[VVFX:${id}] This export has no Beam layer. It will play at the segment midpoint without endpoint fitting, stretching, or rotation.`,
      );
      this.enqueue(entry, {
        originX: (options.start.x + options.end.x) / 2,
        originY: (options.start.y + options.end.y) / 2,
        baseDepth,
        maxDurationMs: options.maxDurationMs,
      });
      return true;
    }

    const beamEndpoints: BeamEndpoints = {
      startX: options.start.x,
      startY: options.start.y,
      endX: options.end.x,
      endY: options.end.y,
    };
    this.enqueue(entry, {
      originX: options.start.x,
      originY: options.start.y,
      baseDepth,
      beamEndpoints,
      beamFit: options.beamFit,
      beamThicknessScale: options.beamThicknessScale,
      maxDurationMs: options.maxDurationMs,
    });
    return true;
  }

  destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.scene.events.off('shutdown', this.handleSceneShutdown);
    this.controller.abort();
    for (const effect of this.activeEffects) {
      try {
        effect.destroy();
      } catch (error) {
        this.report(
          'error',
          `cleanup:${errorMessage(error)}`,
          `[VVFX] An effect could not be cleaned up: ${errorMessage(error)}`,
        );
      }
    }
    this.activeEffects.clear();
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

  private resolveDepth(value: number | undefined): number {
    return value !== undefined && Number.isFinite(value) ? value : this.baseDepth;
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

  private enqueue(entry: VvfxCatalogEntry, options: VvfxEffectOptions): void {
    void this.startPlayback(entry, options);
  }

  private async startPlayback(
    entry: VvfxCatalogEntry,
    options: VvfxEffectOptions,
  ): Promise<void> {
    if (!(await this.preloadEffect(entry)) || this.disposed) {
      return;
    }

    let effect: VvfxEffectHandle | undefined;
    let completed = false;
    try {
      effect = await this.runtime.play(this.scene, entry.definition, {
        ...options,
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
          if (effect) {
            this.activeEffects.delete(effect);
          }
        },
      });
      if (this.disposed) {
        effect.destroy();
      } else if (!completed) {
        this.activeEffects.add(effect);
      }
    } catch (error) {
      if (!this.disposed && !isAbortError(error)) {
        this.report(
          'error',
          `play:${entry.id}:${errorMessage(error)}`,
          `[VVFX:${entry.id}] Playback failed: ${errorMessage(error)}`,
        );
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
