import type Phaser from 'phaser';
import { COLORS } from '../../constants';
import type { WeaponId, WeaponRuntimeState } from '../../types/gameTypes';
import { audio } from '../AudioSystem';
import type { WeaponContext } from './WeaponContext';

export function fireChainStrike(
  context: WeaponContext,
  id: WeaponId,
  state: WeaponRuntimeState,
): void {
  const excluded = new Set<Phaser.Physics.Arcade.Image>();
  const count = Math.max(1, Math.floor(state.stats.targetCount));
  let struck = false;
  for (let index = 0; index < count; index += 1) {
    const target = context.enemies.findNearest(
      context.player.x,
      context.player.y,
      state.stats.range,
      excluded,
    );
    if (!target) {
      break;
    }
    const definition = context.enemies.getDefinition(target);
    if (!definition) {
      continue;
    }
    struck = true;
    excluded.add(target);
    context.juice.ring(target.x, target.y, 44, COLORS.soul, 180);
    context.damageArea(target.x, target.y, 0, id);
    context.afterAreaAttack(id, target.x, target.y, state.stats.area);
  }
  if (struck) {
    audio.play('soul-bolt');
    context.juice.ring(context.player.x, context.player.y, 58, COLORS.void, 220);
  }
}
