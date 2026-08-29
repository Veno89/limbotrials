import type Phaser from 'phaser';
import { COLORS } from '../../constants';
import { WEAPONS } from '../../data/weapons';
import type {
  EnemyDefinition,
  WeaponBeamVfxDefinition,
  WeaponId,
  WeaponRuntimeState,
} from '../../types/gameTypes';
import { audio } from '../AudioSystem';
import type { WeaponContext } from './WeaponContext';

interface TeslaSegment {
  start: { x: number; y: number };
  startTarget?: Phaser.Physics.Arcade.Image;
  startTargetDefinition?: EnemyDefinition;
  target: Phaser.Physics.Arcade.Image;
  targetDefinition: EnemyDefinition;
}

export function fireTeslaCoil(
  context: WeaponContext,
  id: WeaponId,
  state: WeaponRuntimeState,
): void {
  const vfx = WEAPONS[id].vfx;
  if (!vfx) {
    return;
  }

  const excluded = new Set<Phaser.Physics.Arcade.Image>();
  const segments: TeslaSegment[] = [];
  const targetCount = Math.max(1, Math.floor(state.stats.targetCount));
  let origin = { x: context.player.x, y: context.player.y };
  let originTarget: Phaser.Physics.Arcade.Image | undefined;
  let originTargetDefinition: EnemyDefinition | undefined;

  for (let index = 0; index < targetCount; index += 1) {
    const target = context.enemies.findNearest(
      origin.x,
      origin.y,
      index === 0 ? state.stats.range : state.stats.area,
      excluded,
    );
    if (!target) {
      break;
    }
    excluded.add(target);
    const targetDefinition = context.enemies.getDefinition(target);
    if (!targetDefinition) {
      continue;
    }

    segments.push({
      start: origin,
      startTarget: originTarget,
      startTargetDefinition: originTargetDefinition,
      target,
      targetDefinition,
    });
    origin = { x: target.x, y: target.y };
    originTarget = target;
    originTargetDefinition = targetDefinition;
  }

  const first = segments[0];
  if (!first) {
    return;
  }

  strikeSegment(context, id, state, vfx.attack, first);
  segments.slice(1).forEach((segment, index) => {
    context.scene.time.delayedCall(
      vfx.chainStartDelayMs + index * vfx.chainStepDelayMs,
      () => strikeSegment(context, id, state, vfx.chain, segment),
    );
  });

  audio.play('soul-bolt');
  context.juice.ring(context.player.x, context.player.y, 58, COLORS.void, 220);
}

function strikeSegment(
  context: WeaponContext,
  id: WeaponId,
  state: WeaponRuntimeState,
  effect: WeaponBeamVfxDefinition,
  segment: TeslaSegment,
): void {
  const currentDefinition = context.enemies.getDefinition(segment.target);
  if (
    !segment.target.active ||
    !currentDefinition ||
    currentDefinition !== segment.targetDefinition
  ) {
    return;
  }

  const currentStartDefinition = segment.startTarget
    ? context.enemies.getDefinition(segment.startTarget)
    : undefined;
  const hasLiveOriginalStart = Boolean(
    segment.startTarget?.active &&
    currentStartDefinition === segment.startTargetDefinition,
  );
  const start = hasLiveOriginalStart && segment.startTarget
    ? { x: segment.startTarget.x, y: segment.startTarget.y }
    : segment.start;
  const end = { x: segment.target.x, y: segment.target.y };

  context.vfx.spawnBetween(effect.effectId, {
    start,
    end,
    beamFit: effect.beamFit,
    beamThicknessScale: effect.thicknessScale,
    maxDurationMs: effect.maxDurationMs,
  });
  context.juice.ring(end.x, end.y, 44, COLORS.soul, 180);
  context.damageEnemy(segment.target, currentDefinition, id);
  context.afterAreaAttack(id, end.x, end.y, state.stats.area);
}
