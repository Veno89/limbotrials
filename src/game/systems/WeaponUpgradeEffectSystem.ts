import Phaser from 'phaser';
import { COLORS } from '../constants';
import type { EnemyDefinition, StatusEffectId, WeaponId } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';
import type { JuiceSystem } from './JuiceSystem';
import type { RunState } from './RunState';
import {
  getDirgeEchoEffect,
  getHellfireSpreadEffects,
  SOUL_BOLT_SPLINTERING_MEMORY,
  type DelayedAreaEffect,
} from './weaponUpgradeEffectRules';
import { boneScytheBleedDamage, type StatusApplicationSource } from './statusEffectRules';

type DamageEnemy = (
  sprite: Phaser.Physics.Arcade.Image,
  definition: EnemyDefinition,
  weaponId: WeaponId,
  damageScale: number,
) => { killed: boolean };

type DamageArea = (
  x: number,
  y: number,
  radius: number,
  weaponId: WeaponId,
  damageScale: number,
) => void;

type ApplyStatusToEnemy = (
  sprite: Phaser.Physics.Arcade.Image,
  id: StatusEffectId,
  source: StatusApplicationSource,
) => void;

export class WeaponUpgradeEffectSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly enemies: EnemySystem,
    private readonly run: RunState,
    private readonly juice: JuiceSystem,
    private readonly applyStatusToEnemy: ApplyStatusToEnemy,
  ) {}

  afterAreaAttack(id: WeaponId, x: number, y: number, radius: number, damageArea: DamageArea): void {
    if (id === 'bone-scythe' && this.run.hasWeaponEffect('bone-scythe-crimson-harvest')) {
      this.applyBoneScytheBleed(id, x, y, radius);
    }
    if (id === 'hellfire-sigil' && this.run.hasWeaponEffect('hellfire-spreading-sentence')) {
      const sourceAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, x, y);
      for (const effect of getHellfireSpreadEffects(x, y, radius, sourceAngle)) {
        this.delayedArea(id, effect, COLORS.hellfire, damageArea);
      }
    } else if (id === 'dirge-staff' && this.run.hasWeaponEffect('dirge-staff-echoed-rites')) {
      this.delayedArea(id, getDirgeEchoEffect(x, y, radius), COLORS.soul, damageArea);
    }
  }

  afterProjectileImpact(
    id: WeaponId,
    impact: Phaser.Physics.Arcade.Image,
    alreadyHit: Set<Phaser.Physics.Arcade.Image>,
    damageEnemy: DamageEnemy,
  ): void {
    if (id !== 'soul-bolt' || !this.run.hasWeaponEffect('soul-bolt-splintering-memory')) {
      return;
    }
    for (let index = 0; index < SOUL_BOLT_SPLINTERING_MEMORY.targetCount; index += 1) {
      const target = this.enemies.findNearest(
        impact.x,
        impact.y,
        SOUL_BOLT_SPLINTERING_MEMORY.range,
        alreadyHit,
      );
      if (!target) {
        return;
      }
      const definition = this.enemies.getDefinition(target);
      if (!definition) {
        continue;
      }
      alreadyHit.add(target);
      this.drawSoulLash(impact.x, impact.y, target.x, target.y);
      this.juice.ring(target.x, target.y, 34, COLORS.void, 150);
      damageEnemy(target, definition, id, SOUL_BOLT_SPLINTERING_MEMORY.damageScale);
    }
  }

  private applyBoneScytheBleed(id: WeaponId, x: number, y: number, radius: number): void {
    const damagePerTick = boneScytheBleedDamage(this.run.getWeaponState(id).stats.damage);
    this.enemies.forEach((enemy, definition) => {
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) > radius + definition.radius * 0.5) {
        return;
      }
      this.applyStatusToEnemy(enemy, 'bleed', {
        sourceWeaponId: id,
        damagePerTick,
      });
    });
    this.juice.ring(x, y, radius * 0.62, COLORS.blood, 190);
  }

  private delayedArea(id: WeaponId, effect: DelayedAreaEffect, color: number, damageArea: DamageArea): void {
    this.scene.time.delayedCall(effect.delayMs, () => {
      this.juice.ring(effect.x, effect.y, effect.radius, color, 220);
      damageArea(effect.x, effect.y, effect.radius, id, effect.damageScale);
    });
  }

  private drawSoulLash(fromX: number, fromY: number, toX: number, toY: number): void {
    const line = this.scene.add.graphics().setDepth(31);
    line.lineStyle(3, COLORS.soul, 0.9);
    line.lineBetween(fromX, fromY, toX, toY);
    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 180,
      onComplete: () => line.destroy(),
    });
  }
}
