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
import type { ActiveBuffStatus, PowerupSystem } from './PowerupSystem';
import { WeaponSynergySystem } from './WeaponSynergySystem';
import { CrimsonOrbitSystem } from './CrimsonOrbitSystem';
import { calculateBloodletterThrow, getBloodletterThrowAngles } from './weaponRules';
import { WeaponUpgradeEffectSystem } from './WeaponUpgradeEffectSystem';
import type { ConditionalUpgradeSystem } from './ConditionalUpgradeSystem';
import type { StatusEffectSystem } from './StatusEffectSystem';
import { AcidPoolSystem } from './AcidPoolSystem';
import {
  poisonFlaskImpactRadius,
  poisonFlaskPoolProfile,
  poisonFlaskTravelMs,
} from './acidPoolRules';
import {
  boneScytheConditionalDamageScale,
  crookedReachDamageScale,
  crookedReachPullDistance,
  isPointInScytheSweep,
  type ScytheSweepProfile,
} from './scytheRules';
import { ScytheWakeSystem } from './ScytheWakeSystem';
import { BoneScytheTalentRuntimeSystem } from './BoneScytheTalentRuntimeSystem';
import { ScytheProcessionSystem } from './ScytheProcessionSystem';

interface ProjectileRuntime {
  weaponId: WeaponId;
  pierceRemaining: number;
  expiresAt: number;
  hit: Set<Phaser.Physics.Arcade.Image>;
  landingX?: number;
  landingY?: number;
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
  private readonly acidPools: AcidPoolSystem;
  private readonly scytheWakes: ScytheWakeSystem;
  private readonly scytheTalents: BoneScytheTalentRuntimeSystem;
  private readonly scytheProcessions: ScytheProcessionSystem;
  private crimsonOrbitActive = false;
  private scytheFacingAngle = Math.PI / 2;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly enemies: EnemySystem,
    private readonly run: RunState,
    private readonly juice: JuiceSystem,
    private readonly powerups: PowerupSystem,
    private readonly conditionalUpgrades: ConditionalUpgradeSystem,
    private readonly statuses: StatusEffectSystem,
  ) {
    this.projectiles = scene.physics.add.group();
    this.evolutions = new WeaponEvolutionSystem(scene, enemies, run, juice);
    this.synergies = new WeaponSynergySystem(run);
    this.crimsonOrbit = new CrimsonOrbitSystem(scene, player, enemies);
    this.acidPools = new AcidPoolSystem(
      scene,
      enemies,
      statuses,
      (...args) => this.damageEnemy(...args),
    );
    this.scytheWakes = new ScytheWakeSystem(
      scene,
      enemies,
      (...args) => this.damageEnemy(...args),
    );
    this.scytheTalents = new BoneScytheTalentRuntimeSystem(
      () => this.scene.time.now,
      juice,
      () => ({ x: player.x, y: player.y }),
    );
    this.scytheProcessions = new ScytheProcessionSystem(
      scene,
      enemies,
      (...args) => this.damageEnemy(...args),
    );
    this.upgradeEffects = new WeaponUpgradeEffectSystem(
      scene,
      player,
      enemies,
      run,
      juice,
      (...args) => this.statuses.applyToEnemy(...args),
    );
  }

  update(time: number): void {
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (playerBody.velocity.lengthSq() > 1) {
      this.scytheFacingAngle = Math.atan2(playerBody.velocity.y, playerBody.velocity.x);
    }
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
    this.acidPools.update(time);
    this.scytheWakes.update(time);
    this.scytheProcessions.update(time);
  }

  getMoveSpeedMultiplier(): number {
    return this.scytheTalents.moveSpeedMultiplier();
  }

  getActiveTalentBuffs(): ActiveBuffStatus[] {
    return this.scytheTalents.getActiveBuffs();
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
    } else if (behavior === 'lobbed-projectile') {
      this.firePoisonFlask(id, state, time);
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

  private firePoisonFlask(id: WeaponId, state: WeaponRuntimeState, time: number): void {
    const target = this.enemies.findNearest(this.player.x, this.player.y, state.stats.range);
    if (!target) {
      return;
    }
    audio.play('hellfire');
    const count = Math.max(1, Math.floor(state.stats.projectileCount));
    for (let index = 0; index < count; index += 1) {
      const scatterAngle = count === 1 ? 0 : (index / count) * Math.PI * 2;
      const scatter = count === 1 ? 0 : 42;
      this.createLobbedProjectile(
        id,
        state,
        target.x + Math.cos(scatterAngle) * scatter,
        target.y + Math.sin(scatterAngle) * scatter,
        time,
      );
    }
    this.juice.ring(this.player.x, this.player.y, 46, 0x51d96b, 190);
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

  private createLobbedProjectile(
    id: WeaponId,
    state: WeaponRuntimeState,
    landingX: number,
    landingY: number,
    time: number,
  ): void {
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, landingX, landingY);
    const travelMs = poisonFlaskTravelMs(
      Phaser.Math.Distance.Between(this.player.x, this.player.y, landingX, landingY),
      state.stats.projectileSpeed,
    );
    const projectile = this.projectiles.create(
      this.player.x,
      this.player.y,
      WEAPONS[id].texture,
    ) as Phaser.Physics.Arcade.Image;
    projectile
      .setDisplaySize(state.stats.projectileSize, state.stats.projectileSize)
      .setDepth(30)
      .setRotation(angle)
      .setBlendMode(Phaser.BlendModes.ADD);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    const seconds = travelMs / 1000;
    body.setVelocity((landingX - this.player.x) / seconds, (landingY - this.player.y) / seconds);
    this.projectileRuntime.set(projectile, {
      weaponId: id,
      pierceRemaining: 0,
      expiresAt: time + travelMs,
      hit: new Set(),
      landingX,
      landingY,
    });
  }

  private fireBoneScythe(id: WeaponId, state: WeaponRuntimeState): void {
    const radius = state.stats.area;
    const talents = this.run.getBoneScytheTalentProfile();
    const profile: ScytheSweepProfile = {
      facingAngle: this.scytheFacingAngle,
      fullCircle: talents.fullCircle,
    };
    audio.play('scythe');
    this.juice.ring(this.player.x, this.player.y, 42, COLORS.blood, 220);
    const sweep = this.scene.add
      .container(this.player.x, this.player.y)
      .setDepth(32)
      .setAlpha(0.95)
      .setRotation(profile.facingAngle - Math.PI / 2);
    const bladeOffsets = profile.fullCircle ? [0, Math.PI] : [0, -0.16, -0.32];
    bladeOffsets.forEach((angle, index) => {
      const blade = this.scene.add
        .image(Math.cos(angle) * radius * 0.68, Math.sin(angle) * radius * 0.68, WEAPONS[id].texture)
        .setDisplaySize(index === 0 || profile.fullCircle ? 96 : 82, index === 0 || profile.fullCircle ? 96 : 82)
        .setRotation(angle + Math.PI / 2)
        .setAlpha(index === 0 || profile.fullCircle ? 1 : 0.24 / index);
      sweep.add(blade);
    });
    this.scene.tweens.add({
      targets: sweep,
      rotation: sweep.rotation + (profile.fullCircle ? Math.PI * 2 : Math.PI),
      alpha: 0,
      duration: profile.fullCircle ? 430 : 320,
      ease: 'Cubic.Out',
      onComplete: () => sweep.destroy(),
    });
    const hitCount = this.damageScytheSweep(this.player.x, this.player.y, radius, id, 1, profile);
    const reapOutcome = this.scytheTalents.recordReap(hitCount, talents);
    if (reapOutcome.graveProcessionTriggered) {
      this.scytheProcessions.spawn(
        this.player.x,
        this.player.y,
        profile.facingAngle,
        radius,
        id,
        0.75,
      );
    }
    this.upgradeEffects.afterBoneScytheAttack(id, this.player.x, this.player.y, radius, profile);
    this.scytheWakes.spawn(
      this.player.x,
      this.player.y,
      radius,
      id,
      talents.wakeDamageScale,
      profile,
    );
    this.afterAreaAttack(id, this.player.x, this.player.y, radius, profile);
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
      if (!projectile.active) {
        this.destroyProjectile(projectile);
        continue;
      }
      if (time >= runtime.expiresAt) {
        if (runtime.landingX !== undefined && runtime.landingY !== undefined) {
          this.landPoisonFlask(runtime, runtime.landingX, runtime.landingY, true);
        }
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
        if (runtime.weaponId === 'poison-flask') {
          this.landPoisonFlask(runtime, enemy.x, enemy.y, false);
          shouldDestroy = true;
          return;
        }
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
      damageMultiplier:
        this.run.stats.damage *
        this.synergies.damageMultiplier(weaponId) *
        this.conditionalUpgrades.damageMultiplier(definition, this.scene.time.now),
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

  private damageScytheSweep(
    x: number,
    y: number,
    radius: number,
    weaponId: WeaponId,
    damageScale: number,
    profile: ScytheSweepProfile,
  ): number {
    const talents = this.run.getBoneScytheTalentProfile();
    let hitCount = 0;
    let pullVisualCount = 0;
    this.enemies.forEach((enemy, definition) => {
      if (isPointInScytheSweep(x, y, enemy.x, enemy.y, radius, profile, definition.radius * 0.35)) {
        hitCount += 1;
        const health = this.enemies.getHealth(enemy);
        const healthRatio = health && health.max > 0 ? health.current / health.max : 1;
        const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
        const pullDistance = crookedReachPullDistance(distance, radius, talents.crookedReachRanks);
        const result = this.damageEnemy(
          enemy,
          definition,
          weaponId,
          damageScale *
            boneScytheConditionalDamageScale(healthRatio, talents) *
            crookedReachDamageScale(distance, radius, talents.crookedReachRanks),
        );
        if (!result.killed && !definition.boss && pullDistance > 0) {
          const startX = enemy.x;
          const startY = enemy.y;
          this.enemies.pullToward(enemy, x, y, pullDistance);
          if (pullVisualCount < 8) {
            this.drawCrookedReachPull(startX, startY, enemy.x, enemy.y, weaponId);
            pullVisualCount += 1;
          }
        }
        if (!result.killed && talents.consumeBleed) {
          this.consumeBleed(enemy, definition, weaponId);
        }
      }
    });
    return hitCount;
  }

  private drawCrookedReachPull(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    weaponId: WeaponId,
  ): void {
    const blade = this.scene.add
      .image(startX, startY, WEAPONS[weaponId].texture)
      .setDisplaySize(46, 46)
      .setDepth(34)
      .setRotation(Phaser.Math.Angle.Between(startX, startY, endX, endY) + Math.PI / 2);
    this.scene.tweens.add({
      targets: blade,
      x: endX,
      y: endY,
      rotation: blade.rotation + 0.7,
      alpha: 0,
      duration: 190,
      ease: 'Cubic.In',
      onComplete: () => blade.destroy(),
    });
  }

  private consumeBleed(
    enemy: Phaser.Physics.Arcade.Image,
    definition: EnemyDefinition,
    fallbackWeaponId: WeaponId,
  ): void {
    const consumed = this.statuses.consumeFromEnemy(enemy, 'bleed');
    if (!consumed) {
      return;
    }
    const result = this.enemies.damage(enemy, consumed.damage, false);
    this.run.recordWeaponHit(
      consumed.sourceWeaponId ?? fallbackWeaponId,
      result.dealt,
      result.killed,
      false,
      Boolean(definition.boss),
    );
    this.juice.ring(enemy.x, enemy.y, 32, 0x9f1f2d, 180);
  }

  private landPoisonFlask(runtime: ProjectileRuntime, x: number, y: number, impactDamage: boolean): void {
    const state = this.run.getWeaponState(runtime.weaponId);
    this.juice.ring(x, y, state.stats.area, 0x51d96b, 260);
    if (impactDamage) {
      this.damageArea(x, y, poisonFlaskImpactRadius(state.stats), runtime.weaponId);
    }
    this.acidPools.spawn(
      x,
      y,
      runtime.weaponId,
      poisonFlaskPoolProfile(state.stats, this.evolutions.isEvolved(runtime.weaponId)),
    );
  }

  private afterAreaAttack(
    id: WeaponId,
    x: number,
    y: number,
    radius: number,
    scytheProfile?: ScytheSweepProfile,
  ): void {
    const damageArea = scytheProfile
      ? (areaX: number, areaY: number, areaRadius: number, weaponId: WeaponId, damageScale: number) =>
          this.damageScytheSweep(areaX, areaY, areaRadius, weaponId, damageScale, scytheProfile)
      : (...args: Parameters<WeaponSystem['damageArea']>) => this.damageArea(...args);
    this.upgradeEffects.afterAreaAttack(id, x, y, radius, damageArea);
    this.evolutions.afterAreaAttack(
      id,
      x,
      y,
      radius,
      damageArea,
      scytheProfile
        ? (visualX, visualY, visualRadius, color) =>
            this.drawScytheEcho(visualX, visualY, visualRadius, color, scytheProfile)
        : undefined,
    );
  }

  private drawScytheEcho(
    x: number,
    y: number,
    radius: number,
    _color: number,
    profile: ScytheSweepProfile,
  ): void {
    const root = this.scene.add
      .container(x, y)
      .setDepth(31)
      .setRotation(profile.facingAngle - Math.PI / 2);
    const blade = this.scene.add
      .image(radius * 0.7, 0, WEAPONS['bone-scythe'].texture)
      .setDisplaySize(88, 88)
      .setRotation(Math.PI / 2);
    root.add(blade);
    this.scene.tweens.add({
      targets: root,
      rotation: root.rotation + (profile.fullCircle ? Math.PI * 2 : Math.PI),
      alpha: 0,
      duration: 280,
      onComplete: () => root.destroy(),
    });
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
