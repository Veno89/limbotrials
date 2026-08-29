import { COLORS } from '../../constants';
import type { WeaponId, WeaponRuntimeState } from '../../types/gameTypes';
import type { WeaponContext } from './WeaponContext';

export const METEOR_IMPACT_DELAY_MS = 450;

export function fireMeteorHammer(
  context: WeaponContext,
  id: WeaponId,
  state: WeaponRuntimeState,
): void {
  const target = context.enemies.findNearest(
    context.player.x,
    context.player.y,
    state.stats.range,
  );
  if (!target) {
    return;
  }

  const angle = Math.atan2(
    target.y - context.player.y,
    target.x - context.player.x,
  );
  context.damageArc(
    context.player.x,
    context.player.y,
    state.stats.range,
    id,
    angle,
    Math.PI / 2,
  );

  const meteorX = target.x;
  const meteorY = target.y;
  context.vfx.spawnAt('meteor-strike', {
    x: meteorX,
    y: meteorY,
    baseDepth: 60,
  });

  context.scene.time.delayedCall(METEOR_IMPACT_DELAY_MS, () => {
    if (!context.player.active) {
      return;
    }
    context.juice.ring(
      meteorX,
      meteorY,
      state.stats.area,
      COLORS.hellfire,
      METEOR_IMPACT_DELAY_MS,
    );
    context.juice.heavyImpact();
    context.impactFragments.spawn({ x: meteorX, y: meteorY, preset: 'meteor' });
    context.damageArea(meteorX, meteorY, state.stats.area, id);
    context.hazardZones.spawn(meteorX, meteorY, id, {
      radius: state.stats.area,
      durationMs: 4000,
      tickIntervalMs: 500,
      damageScale: 0.5,
      color: COLORS.hellfire,
      strokeColor: 0xd94545,
      statusEffect: {
        id: 'burn',
        damagePerTick: 4,
      },
      visualPreset: 'burning-ground',
    });
  });
}
