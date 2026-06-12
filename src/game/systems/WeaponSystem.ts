import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';
import { COLORS } from '../constants';
import { WEAPONS } from '../data/weapons';
import type { EnemyDefinition, WeaponId, WeaponRuntimeState } from '../types/gameTypes';
import { audio } from './AudioSystem';
import { calculateDamage } from './DamageSystem';
import type { EnemySystem } from './EnemySystem';
import type { JuiceSystem } from './JuiceSystem';
import type { RunState } from './RunState';
import { WeaponEvolutionSystem } from './WeaponEvolutionSystem';
import type { PowerupSystem } from './PowerupSystem';
import { WeaponSynergySystem } from './WeaponSynergySystem';
import { CrimsonOrbitSystem } from './CrimsonOrbitSystem';
import { calculateBloodletterThrow, getBloodletterThrowAngles } from './weaponRules';
import { WeaponUpgradeEffectSystem } from './WeaponUpgradeEffectSystem';

interface ProjectileRuntime {
  weaponId: WeaponId;
  pierceRemaining: number;
  expiresAt: number;
  hit: Set<Phaser.Physics.Arcade.Image>;
  returnAt?: number;
  returning?: boolean;
  outboundExhausted?: boolean;
}

export interface WeaponCooldownState {
  durationMs: number;
  remainingMs: number;
  ratio: number;
  ready: boolean;
}

export class WeaponSystem {
  private readonly projectiles: Phaser.Physics.Arcade.Group;
  private readonly projectileRuntime = new Map<Phaser.Physics.Arcade.Image, ProjectileRuntime>();
  private readonly nextFire = new Map<WeaponId, number>();
  private readonly evolutions: WeaponEvolutionSystem;
  private readonly synergies: WeaponSynergySystem;
  private readonly crimsonOrbit: CrimsonOrbitSystem;
  private readonly upgradeEffects: WeaponUpgradeEffectSystem;
  private crimsonOrbitActive = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly enemies: EnemySystem,
    private readonly run: RunState,
    private readonly juice: JuiceSystem,
    private readonly powerups: PowerupSystem,
  ) {
    this.projectiles = scene.physics.add.group();
    this.evolutions = new WeaponEvolutionSystem(scene, enemies, run, juice);
    this.synergies = new WeaponSynergySystem(run);
    this.crimsonOrbit = new CrimsonOrbitSystem(scene, player, enemies);
    this.upgradeEffects = new WeaponUpgradeEffectSystem(scene, player, enemies, run, juice);
  }

  update(time: number): void {
    const bloodletterState = this.run.weaponStates.get('bloodletter-axe');
    const orbitActive = Boolean(bloodletterState && this.evolutions.isEvolved('bloodletter-axe'));
    if (orbitActive && !this.crimsonOrbitActive) {
      this.destroyProjectilesForWeapon('bloodletter-axe');
      this.nextFire.delete('bloodletter-axe');
    }
    this.crimsonOrbit.update(
      time,
      orbitActive ? bloodletterState : undefined,
      this.effectiveAttackSpeed(),
      (enemy, definition, damageScale) => this.damageEnemy(enemy, definition, 'bloodletter-axe', damageScale),
    );
    this.crimsonOrbitActive = orbitActive;

    for (const weaponId of this.run.weapons) {
      if (weaponId === 'bloodletter-axe' && orbitActive) {
        continue;
      }
      const state = this.run.getWeaponState(weaponId);
      if (time >= (this.nextFire.get(weaponId) ?? 0)) {
        this.nextFire.set(weaponId, time + this.effectiveCooldown(state));
        this.fire(weaponId, state, time);
      }
    }
    this.updateProjectiles(time);
  }

  getCooldownState(id: WeaponId, time: number): WeaponCooldownState {
    if (id === 'bloodletter-axe' && this.evolutions.isEvolved(id)) {
      return { durationMs: 0, remainingMs: 0, ratio: 0, ready: true };
    }
    const durationMs = this.effectiveCooldown(this.run.getWeaponState(id));
    const remainingMs = Math.max(0, (this.nextFire.get(id) ?? 0) - time);
    return {
      durationMs,
      remainingMs,
      ratio: Phaser.Math.Clamp(remainingMs / durationMs, 0, 1),
      ready: remainingMs <= 0,
    };
  }

  reduceCooldowns(amountMs: number): void {
    for (const [id, nextFireAt] of this.nextFire) {
      this.nextFire.set(id, Math.max(this.scene.time.now, nextFireAt - amountMs));
    }
  }

  getActiveSynergies(): string[] {
    return this.synergies.active().map((synergy) => synergy.name.toUpperCase());
  }

  private fire(id: WeaponId, state: WeaponRuntimeState, time: number): void {
    const behavior = WEAPONS[id].behavior;
    if (behavior === 'scythe') {
      this.fireBoneScythe(id, state);
    } else if (behavior === 'sigil') {
      this.fireHellfire(id, state);
    } else if (behavior === 'fan-projectile') {
      this.fireFanProjectiles(id, state, time);
    } else if (behavior === 'returning-projectile') {
      this.fireReturningProjectile(id, state, time);
    } else if (behavior === 'chain-strike') {
      this.fireChainStrike(id, state);
    } else if (behavior === 'radial-projectile') {
      this.fireRadialProjectiles(id, state, time);
    } else if (behavior === 'pulse') {
      this.firePulse(id, state);
    } else {
      this.fireTargetedProjectiles(id, state, time);
    }
  }

  private fireTargetedProjectiles(id: WeaponId, state: WeaponRuntimeState, time: number): void {
    const definition = WEAPONS[id];
    const excluded = new Set<Phaser.Physics.Arcade.Image>();
    audio.play(id === 'grave-lance' ? 'scythe' : 'soul-bolt');

    for (let targetIndex = 0; targetIndex < Math.floor(state.stats.targetCount); targetIndex += 1) {
      const target = this.enemies.findNearest(this.player.x, this.player.y, state.stats.range, excluded);
      if (!target) {
        return;
      }
      excluded.add(target);
      const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
      for (let index = 0; index < Math.floor(state.stats.projectileCount); index += 1) {
        const offset = (index - (state.stats.projectileCount - 1) / 2) * 0.14;
        this.createProjectile(id, definition.texture, state, baseAngle + offset, time);
      }
    }
  }

  private fireRadialProjectiles(id: WeaponId, state: WeaponRuntimeState, time: number): void {
    audio.play('soul-bolt');
    const count = Math.max(1, Math.floor(state.stats.projectileCount));
    const rotationOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    for (let index = 0; index < count; index += 1) {
      this.createProjectile(id, WEAPONS[id].texture, state, rotationOffset + (index / count) * Math.PI * 2, time);
    }
    this.juice.ring(this.player.x, this.player.y, 54, COLORS.void, 240);
  }

  private fireFanProjectiles(id: WeaponId, state: WeaponRuntimeState, time: number): void {
    const target = this.enemies.findNearest(this.player.x, this.player.y, state.stats.range);
    if (!target) {
      return;
    }
    audio.play('soul-bolt');
    const count = Math.max(1, Math.floor(state.stats.projectileCount));
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    const spread = Math.min(0.78, 0.16 * (count - 1));
    for (let index = 0; index < count; index += 1) {
      const ratio = count === 1 ? 0.5 : index / (count - 1);
      this.createProjectile(id, WEAPONS[id].texture, state, baseAngle - spread / 2 + ratio * spread, time);
    }
    this.juice.ring(this.player.x, this.player.y, 46, COLORS.gold, 180);
  }

  private fireReturningProjectile(id: WeaponId, state: WeaponRuntimeState, time: number): void {
    const target = this.enemies.findNearest(this.player.x, this.player.y, state.stats.range);
    if (!target) {
      return;
    }
    audio.play('scythe');
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    for (const angle of getBloodletterThrowAngles(baseAngle, state.stats.projectileCount)) {
      this.createProjectile(id, WEAPONS[id].texture, state, angle, time);
    }
  }

  private fireChainStrike(id: WeaponId, state: WeaponRuntimeState): void {
    const excluded = new Set<Phaser.Physics.Arcade.Image>();
    const count = Math.max(1, Math.floor(state.stats.targetCount));
    let struck = false;
    for (let index = 0; index < count; index += 1) {
      const target = this.enemies.findNearest(this.player.x, this.player.y, state.stats.range, excluded);
      if (!target) {
        break;
      }
      const definition = this.enemies.getDefinition(target);
      if (!definition) {
        continue;
      }
      struck = true;
      excluded.add(target);
      this.juice.ring(target.x, target.y, 44, COLORS.soul, 180);
      this.damageEnemy(target, definition, id);
      this.afterAreaAttack(id, target.x, target.y, state.stats.area);
    }
    if (struck) {
      audio.play('soul-bolt');
      this.juice.ring(this.player.x, this.player.y, 58, COLORS.void, 220);
    }
  }

  private createProjectile(
    id: WeaponId,
    texture: string,
    state: WeaponRuntimeState,
    angle: number,
    time: number,
  ): void {
    const projectile = this.projectiles.create(this.player.x, this.player.y, texture) as Phaser.Physics.Arcade.Image;
    projectile
      .setDisplaySize(state.stats.projectileSize, state.stats.projectileSize)
      .setDepth(30)
      .setRotation(angle)
      .setBlendMode(Phaser.BlendModes.ADD);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * state.stats.projectileSpeed,
      Math.sin(angle) * state.stats.projectileSpeed,
    );
    const bloodletter = id === 'bloodletter-axe' ? calculateBloodletterThrow(state.stats) : undefined;
    this.projectileRuntime.set(projectile, {
      weaponId: id,
      pierceRemaining: Math.floor(state.stats.pierce),
      expiresAt: time + (bloodletter?.lifetimeMs ?? 1800),
      hit: new Set(),
      returnAt: bloodletter ? time + bloodletter.outboundDurationMs : undefined,
      returning: false,
      outboundExhausted: false,
    });
  }

  private fireBoneScythe(id: WeaponId, state: WeaponRuntimeState): void {
    const radius = state.stats.area;
    audio.play('scythe');
    this.juice.ring(this.player.x, this.player.y, radius, COLORS.pale, 360);
    this.juice.ring(this.player.x, this.player.y, radius * 0.72, COLORS.soul, 300);

    const sweep = this.scene.add.container(this.player.x, this.player.y).setDepth(32).setAlpha(0.95);
    const crescent = this.scene.add.graphics();
    crescent.lineStyle(13, COLORS.pale, 0.72);
    crescent.beginPath();
    crescent.arc(0, 0, radius * 0.88, -0.92, 0.92);
    crescent.strokePath();
    crescent.lineStyle(4, COLORS.soul, 0.95);
    crescent.beginPath();
    crescent.arc(0, 0, radius * 0.76, -1.02, 1.02);
    crescent.strokePath();
    sweep.add(crescent);
    for (let index = 0; index < 3; index += 1) {
      const blade = this.scene.add
        .image(radius * (0.55 + index * 0.16), 0, 'icon-sword')
        .setDisplaySize(72 - index * 8, 72 - index * 8)
        .setRotation(Math.PI / 2)
        .setTint(index === 0 ? COLORS.pale : COLORS.soul)
        .setAlpha(1 - index * 0.2)
        .setBlendMode(Phaser.BlendModes.ADD);
      sweep.add(blade);
    }
    this.scene.tweens.add({
      targets: sweep,
      angle: 330,
      alpha: 0,
      duration: 380,
      ease: 'Cubic.Out',
      onComplete: () => sweep.destroy(),
    });
    this.damageArea(this.player.x, this.player.y, radius, id);
    this.afterAreaAttack(id, this.player.x, this.player.y, radius);
  }

  private fireHellfire(id: WeaponId, state: WeaponRuntimeState): void {
    const target = this.enemies.findNearest(this.player.x, this.player.y, state.stats.range);
    if (!target) {
      return;
    }
    const x = target.x;
    const y = target.y;
    const radius = state.stats.area;
    const sigil = this.scene.add
      .image(x, y, WEAPONS[id].texture)
      .setDisplaySize(radius * 0.78, radius * 0.78)
      .setAlpha(0.35)
      .setTint(COLORS.hellfire)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(18);
    this.scene.tweens.add({
      targets: sigil,
      angle: 140,
      scaleX: sigil.scaleX * 1.35,
      scaleY: sigil.scaleY * 1.35,
      alpha: 0.72,
      duration: 620,
      ease: 'Sine.In',
    });
    this.juice.ring(x, y, radius * 0.82, COLORS.hellfire, 650);
    this.scene.time.delayedCall(620, () => {
      sigil.destroy();
      audio.play('hellfire');
      this.juice.ring(x, y, radius, COLORS.hellfire, 260);
      this.juice.heavyImpact();
      this.damageArea(x, y, radius, id);
      this.afterAreaAttack(id, x, y, radius);
    });
  }

  private firePulse(id: WeaponId, state: WeaponRuntimeState): void {
    audio.play('hellfire');
    const radius = state.stats.area;
    const x = this.player.x;
    const y = this.player.y;
    this.juice.ring(x, y, radius, COLORS.hellfire, 520);
    this.scene.time.delayedCall(260, () => {
      this.damageArea(x, y, radius, id);
      this.afterAreaAttack(id, x, y, radius);
    });
  }

  private updateProjectiles(time: number): void {
    for (const [projectile, runtime] of this.projectileRuntime) {
      if (!projectile.active || time >= runtime.expiresAt) {
        this.destroyProjectile(projectile);
        continue;
      }
      if (runtime.returnAt !== undefined && time >= runtime.returnAt) {
        if (!runtime.returning) {
          runtime.returning = true;
          runtime.outboundExhausted = false;
          runtime.pierceRemaining = Math.floor(this.run.getWeaponState(runtime.weaponId).stats.pierce);
          if (this.evolutions.isEvolved(runtime.weaponId)) {
            runtime.hit.clear();
          }
        }
        const angle = Phaser.Math.Angle.Between(projectile.x, projectile.y, this.player.x, this.player.y);
        const speed = this.run.getWeaponState(runtime.weaponId).stats.projectileSpeed;
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        projectile.rotation += 0.24;
        if (Phaser.Math.Distance.Between(projectile.x, projectile.y, this.player.x, this.player.y) < 42) {
          this.destroyProjectile(projectile);
          continue;
        }
      }
      let shouldDestroy = false;
      this.enemies.forEach((enemy, definition) => {
        if (
          shouldDestroy ||
          runtime.hit.has(enemy) ||
          (runtime.outboundExhausted && !runtime.returning) ||
          Phaser.Math.Distance.Between(projectile.x, projectile.y, enemy.x, enemy.y) >
            definition.radius + projectile.displayWidth * 0.35
        ) {
          return;
        }
        runtime.hit.add(enemy);
        const result = this.damageEnemy(enemy, definition, runtime.weaponId);
        this.afterProjectileImpact(runtime.weaponId, enemy, result.killed, runtime.hit);
        if (runtime.pierceRemaining <= 0) {
          if (runtime.returnAt !== undefined && !runtime.returning) {
            runtime.outboundExhausted = true;
          } else {
            shouldDestroy = true;
          }
        } else {
          runtime.pierceRemaining -= 1;
        }
      });
      if (shouldDestroy) {
        this.destroyProjectile(projectile);
      }
    }
  }

  private damageEnemy(
    sprite: Phaser.Physics.Arcade.Image,
    definition: EnemyDefinition,
    weaponId: WeaponId,
    damageScale = 1,
  ): { killed: boolean } {
    const state = this.run.getWeaponState(weaponId);
    const result = calculateDamage({
      baseDamage: state.stats.damage,
      damageMultiplier: this.run.stats.damage * this.synergies.damageMultiplier(weaponId),
      critChance: Math.min(
        BALANCE.maxCritChance,
        this.run.stats.critChance +
          state.stats.critChance +
          this.powerups.critChanceBonus() +
          this.synergies.critChanceBonus(weaponId),
      ),
      critMultiplier: this.run.stats.critDamage + state.stats.critDamage,
      bossMultiplier: this.run.stats.bossDamage,
      targetIsBoss: definition.boss,
    });
    const applied = this.enemies.damage(sprite, Math.max(1, Math.round(result.amount * damageScale)), result.critical);
    this.run.recordWeaponHit(weaponId, applied.dealt, applied.killed, result.critical, Boolean(definition.boss));
    return { killed: applied.killed };
  }

  private damageArea(x: number, y: number, radius: number, weaponId: WeaponId, damageScale = 1): void {
    this.enemies.forEach((enemy, definition) => {
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) {
        this.damageEnemy(enemy, definition, weaponId, damageScale);
      }
    });
  }

  private afterAreaAttack(id: WeaponId, x: number, y: number, radius: number): void {
    this.upgradeEffects.afterAreaAttack(id, x, y, radius, (...args) => this.damageArea(...args));
    this.evolutions.afterAreaAttack(id, x, y, radius, (...args) => this.damageArea(...args));
  }

  private afterProjectileImpact(
    id: WeaponId,
    impact: Phaser.Physics.Arcade.Image,
    killed: boolean,
    alreadyHit: Set<Phaser.Physics.Arcade.Image>,
  ): void {
    this.upgradeEffects.afterProjectileImpact(id, impact, alreadyHit, (...args) => this.damageEnemy(...args));
    this.evolutions.afterProjectileImpact(
      id,
      impact,
      killed,
      alreadyHit,
      (...args) => this.damageEnemy(...args),
      (...args) => this.damageArea(...args),
    );
  }

  private effectiveCooldown(state: WeaponRuntimeState): number {
    return state.stats.cooldownMs / this.effectiveAttackSpeed();
  }

  private effectiveAttackSpeed(): number {
    return Math.min(
      BALANCE.maxAttackSpeedMultiplier,
      this.run.stats.attackSpeed * this.powerups.attackSpeedMultiplier(),
    );
  }

  private destroyProjectile(projectile: Phaser.Physics.Arcade.Image): void {
    this.projectileRuntime.delete(projectile);
    projectile.destroy();
  }

  private destroyProjectilesForWeapon(id: WeaponId): void {
    for (const [projectile, runtime] of this.projectileRuntime) {
      if (runtime.weaponId === id) {
        this.destroyProjectile(projectile);
      }
    }
  }
}
