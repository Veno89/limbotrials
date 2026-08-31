import type Phaser from 'phaser';
import type { GameplayEffectSequenceId } from '../types/gameTypes';
import {
  getGameplayEffectSequence,
  validateGameplayEffectRegistry,
  type BeamFallbackDefinition,
  type GameplayEffectRole,
  type GameplayEffectRoleDefinition,
  type PulseFallbackDefinition,
} from './GameplayEffectRegistry';
import type {
  ManagedVvfxPlayback,
  VvfxLogger,
  VvfxManagedDiagnostics,
  VvfxManagedHandle,
  VvfxPoint,
} from './VvfxSystem';

export type GameplayEffectAnchor = () => VvfxPoint | undefined;

export interface GameplayEffectBeamOptions {
  readonly start: GameplayEffectAnchor;
  readonly end: GameplayEffectAnchor;
  readonly seed?: number;
  /** Retains an authored runtime instance for preview replay. Defaults false. */
  readonly retainAfterComplete?: boolean;
}

export interface GameplayEffectPointOptions {
  readonly point: GameplayEffectAnchor;
  readonly follow?: boolean;
  readonly seed?: number;
  /** Retains an authored runtime instance for preview replay. Defaults false. */
  readonly retainAfterComplete?: boolean;
}

export interface GameplayEffectHandle {
  readonly active: boolean;
  readonly usedFallback: boolean;
  readonly runtimeHandle: VvfxManagedHandle | undefined;
  cancel(): void;
}

export interface GameplayEffectDiagnostics extends VvfxManagedDiagnostics {
  readonly semanticActiveCount: number;
  readonly fallbackActiveCount: number;
}

export interface GameplayEffectPlayback {
  playBeam(
    sequenceId: GameplayEffectSequenceId,
    role: GameplayEffectRole,
    options: GameplayEffectBeamOptions,
  ): GameplayEffectHandle;
  playPoint(
    sequenceId: GameplayEffectSequenceId,
    role: GameplayEffectRole,
    options: GameplayEffectPointOptions,
  ): GameplayEffectHandle;
  getDiagnostics(): GameplayEffectDiagnostics;
}

export interface GameplayEffectFallbackHandle {
  destroy(): void;
  setPosition?(point: VvfxPoint): void;
  setEndpoints?(start: VvfxPoint, end: VvfxPoint): void;
}

export interface GameplayEffectFallbackRenderer {
  beam(
    start: VvfxPoint,
    end: VvfxPoint,
    definition: BeamFallbackDefinition,
    depth: number,
    onComplete: () => void,
  ): GameplayEffectFallbackHandle;
  point(
    point: VvfxPoint,
    definition: PulseFallbackDefinition,
    depth: number,
    onComplete: () => void,
  ): GameplayEffectFallbackHandle;
  destroy?(): void;
}

export interface GameplayEffectSystemOptions {
  readonly logger?: VvfxLogger;
  readonly fallbackRenderer?: GameplayEffectFallbackRenderer;
}

function finitePoint(point: VvfxPoint | undefined): point is VvfxPoint {
  return Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y));
}

class PhaserFallbackRenderer implements GameplayEffectFallbackRenderer {
  private static readonly MAX_IDLE_PER_KIND = 48;
  private readonly idleBeams: Phaser.GameObjects.Graphics[] = [];
  private readonly idlePulses: Phaser.GameObjects.Arc[] = [];
  private readonly activeBeams = new Set<Phaser.GameObjects.Graphics>();
  private readonly activePulses = new Set<Phaser.GameObjects.Arc>();

  constructor(private readonly scene: Phaser.Scene) {}

  beam(
    start: VvfxPoint,
    end: VvfxPoint,
    definition: BeamFallbackDefinition,
    depth: number,
    onComplete: () => void,
  ): GameplayEffectFallbackHandle {
    const line = this.idleBeams.pop() ?? this.scene.add.graphics();
    line
      .clear()
      .setPosition(0, 0)
      .setActive(true)
      .setVisible(true)
      .setDepth(depth)
      .setAlpha(definition.alpha);
    this.activeBeams.add(line);
    const draw = (currentStart: VvfxPoint, currentEnd: VvfxPoint) => {
      line.clear();
      line.lineStyle(definition.width, definition.color, 1);
      line.beginPath();
      line.moveTo(currentStart.x, currentStart.y);
      line.lineTo(currentEnd.x, currentEnd.y);
      line.strokePath();
    };
    draw(start, end);
    let released = false;
    const release = () => {
      if (released) {
        return;
      }
      released = true;
      this.scene.tweens.killTweensOf(line);
      this.activeBeams.delete(line);
      line.clear().setActive(false).setVisible(false);
      if (this.idleBeams.length < PhaserFallbackRenderer.MAX_IDLE_PER_KIND) {
        this.idleBeams.push(line);
      } else {
        line.destroy();
      }
      onComplete();
    };
    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: definition.durationMs,
      ease: 'Cubic.Out',
      onComplete: release,
    });
    return { destroy: release, setEndpoints: draw };
  }

  point(
    point: VvfxPoint,
    definition: PulseFallbackDefinition,
    depth: number,
    onComplete: () => void,
  ): GameplayEffectFallbackHandle {
    const pulse = this.idlePulses.pop() ?? this.scene.add.circle(0, 0, 2);
    pulse
      .setPosition(point.x, point.y)
      .setRadius(Math.max(2, definition.radius * 0.22))
      .setScale(1)
      .setFillStyle(definition.color, definition.alpha)
      .setStrokeStyle(2, definition.color, Math.min(1, definition.alpha + 0.35))
      .setDepth(depth)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1);
    this.activePulses.add(pulse);
    let released = false;
    const release = () => {
      if (released) {
        return;
      }
      released = true;
      this.scene.tweens.killTweensOf(pulse);
      this.activePulses.delete(pulse);
      pulse.setActive(false).setVisible(false).setAlpha(0).setScale(1);
      if (this.idlePulses.length < PhaserFallbackRenderer.MAX_IDLE_PER_KIND) {
        this.idlePulses.push(pulse);
      } else {
        pulse.destroy();
      }
      onComplete();
    };
    this.scene.tweens.add({
      targets: pulse,
      displayWidth: definition.radius * 2,
      displayHeight: definition.radius * 2,
      alpha: 0,
      duration: definition.durationMs,
      ease: 'Cubic.Out',
      onComplete: release,
    });
    return {
      destroy: release,
      setPosition: (nextPoint) => {
        pulse.setPosition(nextPoint.x, nextPoint.y);
      },
    };
  }

  destroy(): void {
    for (const beam of [...this.activeBeams, ...this.idleBeams]) {
      this.scene.tweens.killTweensOf(beam);
      beam.destroy();
    }
    for (const pulse of [...this.activePulses, ...this.idlePulses]) {
      this.scene.tweens.killTweensOf(pulse);
      pulse.destroy();
    }
    this.activeBeams.clear();
    this.activePulses.clear();
    this.idleBeams.length = 0;
    this.idlePulses.length = 0;
  }
}

class GameplayEffectInvocation implements GameplayEffectHandle {
  private currentRuntimeHandle?: VvfxManagedHandle;
  private fallbackHandle?: GameplayEffectFallbackHandle;
  private currentActive = true;
  private fallbackUsed = false;

  constructor(
    readonly retainAfterComplete: boolean,
    private readonly onCancel: () => void,
  ) {}

  get active(): boolean {
    return this.currentActive;
  }

  get usedFallback(): boolean {
    return this.fallbackUsed;
  }

  get runtimeHandle(): VvfxManagedHandle | undefined {
    return this.currentRuntimeHandle;
  }

  bindRuntime(handle: VvfxManagedHandle): void {
    this.currentRuntimeHandle = handle;
  }

  bindFallback(handle: GameplayEffectFallbackHandle): void {
    this.fallbackUsed = true;
    this.fallbackHandle = handle;
  }

  setFallbackPosition(point: VvfxPoint): void {
    this.fallbackHandle?.setPosition?.(point);
  }

  setFallbackEndpoints(start: VvfxPoint, end: VvfxPoint): void {
    this.fallbackHandle?.setEndpoints?.(start, end);
  }

  finish(): void {
    this.currentActive = false;
    this.currentRuntimeHandle = undefined;
    this.fallbackHandle = undefined;
  }

  cancel(): void {
    if (!this.currentActive) {
      return;
    }
    this.currentActive = false;
    this.currentRuntimeHandle?.cancel();
    this.fallbackHandle?.destroy();
    this.currentRuntimeHandle = undefined;
    this.fallbackHandle = undefined;
    this.onCancel();
  }
}

interface TrackedInvocation {
  readonly invocation: GameplayEffectInvocation;
  readonly role: GameplayEffectRoleDefinition;
  readonly point?: GameplayEffectAnchor;
  readonly start?: GameplayEffectAnchor;
  readonly end?: GameplayEffectAnchor;
  readonly followPoint: boolean;
}

/**
 * Resolves semantic gameplay roles to authored runtime effects. Missing or
 * failed exports degrade to bounded Phaser primitives without affecting combat.
 */
export class GameplayEffectSystem implements GameplayEffectPlayback {
  private readonly logger: VvfxLogger;
  private readonly fallbackRenderer: GameplayEffectFallbackRenderer;
  private readonly tracked = new Map<GameplayEffectInvocation, TrackedInvocation>();
  private readonly fallbackInvocations = new Set<GameplayEffectInvocation>();
  private disposed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly vvfx: ManagedVvfxPlayback,
    options: GameplayEffectSystemOptions = {},
  ) {
    this.logger = options.logger ?? console;
    this.fallbackRenderer = options.fallbackRenderer ?? new PhaserFallbackRenderer(scene);
    for (const issue of validateGameplayEffectRegistry(vvfx)) {
      this.logger[issue.severity](issue.message);
    }
    this.scene.events.on('update', this.handleSceneUpdate);
    this.scene.events.once('shutdown', this.handleSceneShutdown);
  }

  playBeam(
    sequenceId: GameplayEffectSequenceId,
    roleName: GameplayEffectRole,
    options: GameplayEffectBeamOptions,
  ): GameplayEffectHandle {
    const role = getGameplayEffectSequence(sequenceId).roles[roleName];
    const invocation = this.createInvocation(Boolean(options.retainAfterComplete));
    if (this.disposed || role.placement !== 'beam') {
      if (role.placement !== 'beam') {
        this.logger.warn(`[Effects:${sequenceId}/${roleName}] A point role was requested as a Beam.`);
      }
      invocation.cancel();
      return invocation;
    }

    const start = options.start();
    const end = options.end();
    if (!finitePoint(start) || !finitePoint(end)) {
      invocation.cancel();
      return invocation;
    }
    this.tracked.set(invocation, {
      invocation,
      role,
      start: options.start,
      end: options.end,
      followPoint: false,
    });

    const runtimeId = role.runtimeEffectId;
    if (
      runtimeId &&
      this.vvfx.hasEffect(runtimeId) &&
      this.vvfx.supportsEndpoints(runtimeId)
    ) {
      const handle = this.vvfx.spawnBetweenManaged(runtimeId, {
        start,
        end,
        baseDepth: role.baseDepth,
        beamFit: role.beamFit,
        beamThicknessScale: role.beamThicknessScale,
        maxDurationMs: role.maxDurationMs,
        seed: options.seed,
        retainAfterComplete: invocation.retainAfterComplete,
      });
      invocation.bindRuntime(handle);
      void handle.ready.then((ready) => {
        if (!ready && invocation.active) {
          this.renderBeamFallback(invocation, role, start, end);
        }
      });
    } else {
      this.renderBeamFallback(invocation, role, start, end);
    }
    return invocation;
  }

  playPoint(
    sequenceId: GameplayEffectSequenceId,
    roleName: GameplayEffectRole,
    options: GameplayEffectPointOptions,
  ): GameplayEffectHandle {
    const role = getGameplayEffectSequence(sequenceId).roles[roleName];
    const invocation = this.createInvocation(Boolean(options.retainAfterComplete));
    if (this.disposed || role.placement !== 'point') {
      if (role.placement !== 'point') {
        this.logger.warn(`[Effects:${sequenceId}/${roleName}] A Beam role was requested as a point.`);
      }
      invocation.cancel();
      return invocation;
    }

    const point = options.point();
    if (!finitePoint(point)) {
      invocation.cancel();
      return invocation;
    }
    this.tracked.set(invocation, {
      invocation,
      role,
      point: options.point,
      followPoint: Boolean(options.follow),
    });

    const runtimeId = role.runtimeEffectId;
    if (runtimeId && this.vvfx.hasEffect(runtimeId)) {
      const handle = this.vvfx.spawnAtManaged(runtimeId, {
        ...point,
        baseDepth: role.baseDepth,
        seed: options.seed,
        retainAfterComplete: invocation.retainAfterComplete,
      });
      invocation.bindRuntime(handle);
      void handle.ready.then((ready) => {
        if (!ready && invocation.active) {
          this.renderPointFallback(invocation, role, point);
        }
      });
    } else {
      this.renderPointFallback(invocation, role, point);
    }
    return invocation;
  }

  getDiagnostics(): GameplayEffectDiagnostics {
    const raw = this.vvfx.getDiagnostics();
    return {
      ...raw,
      semanticActiveCount: this.tracked.size,
      fallbackActiveCount: this.fallbackInvocations.size,
    };
  }

  update(): void {
    if (this.disposed) {
      return;
    }
    for (const [invocation, tracked] of [...this.tracked]) {
      if (!invocation.active) {
        this.tracked.delete(invocation);
        this.fallbackInvocations.delete(invocation);
        continue;
      }
      const runtime = invocation.runtimeHandle;
      if (runtime?.state === 'completed' && !invocation.retainAfterComplete) {
        invocation.finish();
        this.tracked.delete(invocation);
        continue;
      }
      if (tracked.start && tracked.end) {
        const start = tracked.start();
        const end = tracked.end();
        if (!finitePoint(start) || !finitePoint(end)) {
          invocation.cancel();
          continue;
        }
        runtime?.setEndpoints(start.x, start.y, end.x, end.y);
        invocation.setFallbackEndpoints(start, end);
      } else if (tracked.followPoint && tracked.point) {
        const point = tracked.point();
        if (!finitePoint(point)) {
          invocation.cancel();
          continue;
        }
        runtime?.setPosition(point.x, point.y);
        invocation.setFallbackPosition(point);
      }
    }
  }

  destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.scene.events.off('update', this.handleSceneUpdate);
    this.scene.events.off('shutdown', this.handleSceneShutdown);
    for (const invocation of [...this.tracked.keys()]) {
      invocation.cancel();
    }
    this.tracked.clear();
    this.fallbackInvocations.clear();
    this.fallbackRenderer.destroy?.();
  }

  private createInvocation(retainAfterComplete: boolean): GameplayEffectInvocation {
    const invocation = new GameplayEffectInvocation(retainAfterComplete, () => {
      this.tracked.delete(invocation);
      this.fallbackInvocations.delete(invocation);
    });
    return invocation;
  }

  private renderBeamFallback(
    invocation: GameplayEffectInvocation,
    role: GameplayEffectRoleDefinition,
    start: VvfxPoint,
    end: VvfxPoint,
  ): void {
    if (!invocation.active || role.fallback.kind !== 'beam') {
      return;
    }
    this.fallbackInvocations.add(invocation);
    invocation.bindFallback(
      this.fallbackRenderer.beam(start, end, role.fallback, role.baseDepth, () => {
        this.fallbackInvocations.delete(invocation);
        invocation.finish();
        this.tracked.delete(invocation);
      }),
    );
  }

  private renderPointFallback(
    invocation: GameplayEffectInvocation,
    role: GameplayEffectRoleDefinition,
    point: VvfxPoint,
  ): void {
    if (!invocation.active || role.fallback.kind !== 'pulse') {
      return;
    }
    this.fallbackInvocations.add(invocation);
    invocation.bindFallback(
      this.fallbackRenderer.point(point, role.fallback, role.baseDepth, () => {
        this.fallbackInvocations.delete(invocation);
        invocation.finish();
        this.tracked.delete(invocation);
      }),
    );
  }

  private readonly handleSceneUpdate = (): void => {
    this.update();
  };

  private readonly handleSceneShutdown = (): void => {
    this.destroy();
  };
}
