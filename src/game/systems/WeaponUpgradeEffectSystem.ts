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
  SPECTRAL_CHAINS_PROCESSION_BINDINGS,
  type DelayedAreaEffect,
} from './weaponUpgradeEffectRules';
import { boneScytheBleedDamage, type StatusApplicationSource } from './statusEffectRules';
import { isPointInScytheSweep, type ScytheSweepProfile } from './scytheRules';

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
    if (id === 'hellfire-sigil' && this.run.upgrades.hasWeaponEffect('hellfire-spreading-sentence')) {
      const sourceAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, x, y);
      for (const effect of getHellfireSpreadEffects(x, y, radius, sourceAngle)) {
        this.delayedArea(id, effect, COLORS.hellfire, damageArea);
      }
    } else if (id === 'dirge-staff' && this.run.upgrades.hasWeaponEffect('dirge-staff-echoed-rites')) {
      this.delayedArea(id, getDirgeEchoEffect(x, y, radius), COLORS.soul, damageArea);
    }
  }

  afterBoneScytheAttack(
    id: WeaponId,
    x: number,
    y: number,
    radius: number,
    profile: ScytheSweepProfile,
  ): void {
    if (this.run.upgrades.hasWeaponEffect('bone-scythe-crimson-harvest')) {
      this.applyBoneScytheBleed(id, x, y, radius, profile);
    }
  }

  afterProjectileImpact(
    id: WeaponId,
    impact: Phaser.Physics.Arcade.Image,
    alreadyHit: Set<Phaser.Physics.Arcade.Image>,
    damageEnemy: DamageEnemy,
  ): void {
    if (id !== 'soul-bolt' || !this.run.upgrades.hasWeaponEffect('soul-bolt-splintering-memory')) {
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

  afterSpectralChainsAttack(
    id: WeaponId,
    alreadyHit: Set<Phaser.Physics.Arcade.Image>,
    damageEnemy: DamageEnemy,
  ): void {
    if (id !== 'spectral-chains' || !this.run.upgrades.hasWeaponEffect('spectral-chains-procession-bindings')) {
      return;
    }
    
    // Jump chains from one of the primary targets to others
    if (alreadyHit.size === 0) return;
    
    // Pick the last hit enemy as the source for the jumps or the closest one.
    // For simplicity, we just use the first one from the set.
    const origin = Array.from(alreadyHit)[0];
    if (!origin) return;

    const targets: Phaser.Physics.Arcade.Image[] = [];
    for (let index = 0; index < SPECTRAL_CHAINS_PROCESSION_BINDINGS.jumpCount; index += 1) {
      const target = this.enemies.findNearest(
        origin.x,
        origin.y,
        SPECTRAL_CHAINS_PROCESSION_BINDINGS.jumpRadius,
        alreadyHit,
      );
      if (!target) {
        break;
      }
      targets.push(target);
      alreadyHit.add(target);
    }

    if (targets.length === 0) return;

    // Last struck target in the chain
    const finalTarget = targets[targets.length - 1];
    if (!finalTarget) return;

    let currentOrigin = origin;
    for (const target of targets) {
      const definition = this.enemies.getDefinition(target);
      if (!definition) continue;
      
      this.drawSoulLash(currentOrigin.x, currentOrigin.y, target.x, target.y);
      this.juice.ring(target.x, target.y, 28, COLORS.soul, 150);
      
      const result = damageEnemy(target, definition, id, SPECTRAL_CHAINS_PROCESSION_BINDINGS.damageScale);
      
      // Briefly pull towards final struck target if not boss or elite
      if (!result.killed && !definition.boss && !definition.elite && target !== finalTarget) {
        this.enemies.pullToward(
          target,
          finalTarget.x,
          finalTarget.y,
          SPECTRAL_CHAINS_PROCESSION_BINDINGS.pullDistance
        );
      }
      
      currentOrigin = target;
    }
  }

  private applyBoneScytheBleed(
    id: WeaponId,
    x: number,
    y: number,
    radius: number,
    profile: ScytheSweepProfile,
  ): void {
    const damagePerTick = boneScytheBleedDamage(this.run.weapons.getState(id).stats.damage);
    this.enemies.forEach((enemy, definition) => {
      if (!isPointInScytheSweep(x, y, enemy.x, enemy.y, radius, profile, definition.radius * 0.5)) {
        return;
      }
      this.applyStatusToEnemy(enemy, 'bleed', {
        sourceWeaponId: id,
        damagePerTick,
      });
    });
    this.juice.ring(x, y, profile.fullCircle ? radius * 0.62 : 42, COLORS.blood, 190);
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
