import type Phaser from 'phaser';
import { WEAPONS } from '../../data/weapons';
import type {
  EnemyDefinition,
  WeaponId,
  WeaponRuntimeState,
} from '../../types/gameTypes';
import type { GameplayEffectHandle } from '../../vfx/GameplayEffectSystem';
import {
  getGameplayEffectSequence,
  type GameplayEffectRole,
  type GameplayEffectSequenceDefinition,
} from '../../vfx/GameplayEffectRegistry';
import type { VvfxPoint } from '../../vfx/VvfxSystem';
import { audio } from '../AudioSystem';
import type {
  WeaponAttachmentPointName,
  WeaponContext,
  WeaponSequenceController,
} from './WeaponContext';
import {
  planTeslaChain,
  type TeslaChainCandidate,
  type TeslaChainSegment,
} from './teslaChainRules';

interface TeslaTargetSnapshot {
  readonly sprite: Phaser.Physics.Arcade.Image;
  readonly definition: EnemyDefinition;
  readonly spawnGeneration: number;
}

function roleSeed(baseSeed: number, segmentIndex: number, role: GameplayEffectRole): number {
  let hash = (baseSeed ^ Math.imul(segmentIndex + 1, 0x9e3779b1)) >>> 0;
  for (let index = 0; index < role.length; index += 1) {
    hash ^= role.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

class TeslaChainSequence implements WeaponSequenceController {
  private nextSegmentIndex = 0;
  private cancelled = false;
  private readonly activeEffects = new Set<GameplayEffectHandle>();

  constructor(
    private readonly context: WeaponContext,
    private readonly weaponId: WeaponId,
    private readonly state: WeaponRuntimeState,
    private readonly presentation: GameplayEffectSequenceDefinition,
    private readonly segments: readonly TeslaChainSegment<TeslaTargetSnapshot>[],
    private readonly startedAt: number,
    private readonly seed: number,
  ) {}

  update(time: number): boolean {
    if (this.cancelled) {
      return false;
    }
    while (
      this.nextSegmentIndex < this.segments.length &&
      time >= this.dueAt(this.nextSegmentIndex)
    ) {
      const segment = this.segments[this.nextSegmentIndex]!;
      if (!this.strike(segment)) {
        this.cancel();
        return false;
      }
      this.nextSegmentIndex += 1;
    }
    return this.nextSegmentIndex < this.segments.length;
  }

  cancel(): void {
    if (this.cancelled) {
      return;
    }
    this.cancelled = true;
    for (const effect of this.activeEffects) {
      effect.cancel();
    }
    this.activeEffects.clear();
  }

  private dueAt(segmentIndex: number): number {
    if (segmentIndex === 0) {
      return this.startedAt;
    }
    return (
      this.startedAt +
      this.presentation.timing.chainStartDelayMs +
      (segmentIndex - 1) * this.presentation.timing.chainStepDelayMs
    );
  }

  private strike(segment: TeslaChainSegment<TeslaTargetSnapshot>): boolean {
    const startAnchor = segment.source
      ? this.enemyAnchor(segment.source.target, 'chain-source')
      : this.playerAnchor('weapon-origin');
    const endAnchor = this.enemyAnchor(segment.target.target, 'chain-target');
    const start = startAnchor();
    const end = endAnchor();
    if (!start || !end) {
      return false;
    }
    const maximumRange = segment.index === 0
      ? this.state.stats.range
      : this.state.stats.area;
    if (
      Math.hypot(end.x - start.x, end.y - start.y) > maximumRange
    ) {
      return false;
    }

    const beamRole: GameplayEffectRole =
      segment.index === 0 ? 'initialDischarge' : 'beam';
    this.remember(
      this.context.effects.playBeam(this.presentation.id, beamRole, {
        start: startAnchor,
        end: endAnchor,
        seed: roleSeed(this.seed, segment.index, beamRole),
      }),
    );

    const impactPoint = { ...end };
    this.remember(
      this.context.effects.playPoint(this.presentation.id, 'targetElectricity', {
        point: () => impactPoint,
        seed: roleSeed(this.seed, segment.index, 'targetElectricity'),
      }),
    );
    this.remember(
      this.context.effects.playPoint(this.presentation.id, 'impact', {
        point: () => impactPoint,
        seed: roleSeed(this.seed, segment.index, 'impact'),
      }),
    );

    this.context.damageEnemy(
      segment.target.target.sprite,
      segment.target.target.definition,
      this.weaponId,
    );
    this.context.afterAreaAttack(
      this.weaponId,
      impactPoint.x,
      impactPoint.y,
      this.state.stats.area,
    );

    if (segment.index === this.segments.length - 1) {
      this.remember(
        this.context.effects.playPoint(this.presentation.id, 'finalChain', {
          point: () => impactPoint,
          seed: roleSeed(this.seed, segment.index, 'finalChain'),
        }),
      );
      if (this.segments.length >= this.presentation.feedback.heavyImpactAtTargets) {
        this.context.juice.heavyImpact();
      }
    }
    return true;
  }

  private playerAnchor(name: WeaponAttachmentPointName): () => VvfxPoint | undefined {
    let lastPoint: VvfxPoint | undefined;
    return () => {
      if (this.context.player.active) {
        lastPoint = this.context.attachmentPoint(this.context.player, name);
      }
      return lastPoint;
    };
  }

  private enemyAnchor(
    snapshot: TeslaTargetSnapshot,
    name: WeaponAttachmentPointName,
  ): () => VvfxPoint | undefined {
    let lastPoint: VvfxPoint | undefined;
    return () => {
      const currentDefinition = this.context.enemies.getDefinition(snapshot.sprite);
      const currentSpawnGeneration = this.context.enemies.getSpawnGeneration(snapshot.sprite);
      if (
        snapshot.sprite.active &&
        currentSpawnGeneration === snapshot.spawnGeneration &&
        currentDefinition &&
        currentDefinition === snapshot.definition
      ) {
        lastPoint = this.context.attachmentPoint(snapshot.sprite, name);
      }
      // Freeze at the last valid anchor instead of following a pooled sprite.
      // A newly scheduled downstream segment creates a fresh provider and thus
      // still cancels if its source or target has already disappeared.
      return lastPoint;
    };
  }

  private remember(effect: GameplayEffectHandle): void {
    if (effect.active) {
      this.activeEffects.add(effect);
    }
  }
}

export function fireTeslaCoil(
  context: WeaponContext,
  id: WeaponId,
  state: WeaponRuntimeState,
): void {
  const presentationId = WEAPONS[id].presentationId;
  if (!presentationId) {
    return;
  }
  const presentation = getGameplayEffectSequence(presentationId);
  const origin = context.attachmentPoint(context.player, 'weapon-origin');
  const candidates: Array<TeslaChainCandidate<TeslaTargetSnapshot>> = [];
  context.enemies.forEach((sprite, definition) => {
    const spawnGeneration = context.enemies.getSpawnGeneration(sprite);
    if (spawnGeneration === undefined) {
      return;
    }
    candidates.push({
      target: { sprite, definition, spawnGeneration },
      position: context.attachmentPoint(sprite, 'chain-target'),
      stableId: context.targetIdentity(sprite),
    });
  });

  const segments = planTeslaChain(origin, candidates, {
    initialRange: state.stats.range,
    hopRange: state.stats.area,
    maxTargets: state.stats.targetCount,
    repeatPolicy: presentation.targeting.repeatPolicy,
  });
  if (segments.length === 0) {
    return;
  }

  const sequence = new TeslaChainSequence(
    context,
    id,
    state,
    presentation,
    segments,
    context.scene.time.now,
    context.nextEffectSeed(presentation.id),
  );
  audio.play(presentation.feedback.audioCue);
  if (sequence.update(context.scene.time.now)) {
    context.trackSequence(sequence);
  }
}
