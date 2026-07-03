import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';
import { WEAPONS } from '../data/weapons';
import type {
  EnemyDefinition,
  WeaponId,
  WeaponRuntimeState,
  StatusEffectId,
} from '../types/gameTypes';
import { calculateDamage } from './DamageSystem';
import type { EnemySystem } from './EnemySystem';
import type { JuiceSystem } from './JuiceSystem';
import type { RunState } from './RunState';
import { WeaponEvolutionSystem } from './WeaponEvolutionSystem';
import type { ActiveBuffStatus, PowerupSystem } from './PowerupSystem';
import { WeaponSynergySystem } from './WeaponSynergySystem';
import { CrimsonOrbitSystem } from './CrimsonOrbitSystem';
import { calculateBloodletterThrow } from './weaponRules';
import { WeaponUpgradeEffectSystem } from './WeaponUpgradeEffectSystem';
import type { ConditionalUpgradeSystem } from './ConditionalUpgradeSystem';
import type { StatusEffectSystem } from './StatusEffectSystem';
import { HazardZoneSystem } from './HazardZoneSystem';
import type { ImpactFragmentSystem } from './ImpactFragmentSystem';
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
import type { WeaponContext } from './weapons/WeaponContext';
import { WEAPON_BEHAVIORS } from './weapons/WeaponBehaviors';

export interface ProjectileRuntime {
  weaponId: WeaponId;
  pierceRemaining: number;
  expiresAt: number;
  hit: Set<Phaser.Physics.Arcade.Image>;
  landingX?: number;
  landingY?: number;
  returnAt?: number;
  returning?: boolean;
  outboundExhausted?: boolean;
  data?: any;
}

export interface WeaponCooldownState {
  durationMs: number;
  remainingMs: number;
  ratio: number;
  ready: boolean;
}

export class WeaponSystem implements WeaponContext {
  public readonly projectiles: Phaser.Physics.Arcade.Group;
  public readonly projectileRuntime = new Map<Phaser.Physics.Arcade.Image, ProjectileRuntime>();
  private readonly nextFire = new Map<WeaponId, number>();
  public readonly evolutions: WeaponEvolutionSystem;
  private readonly synergies: WeaponSynergySystem;
  private readonly crimsonOrbit: CrimsonOrbitSystem;
  public readonly upgradeEffects: WeaponUpgradeEffectSystem;
  public readonly hazardZones: HazardZoneSystem;
  public readonly scytheWakes: ScytheWakeSystem;
  public readonly scytheTalents: BoneScytheTalentRuntimeSystem;
  public readonly scytheProcessions: ScytheProcessionSystem;
  public readonly nearbyCache: import('./SpatialGrid').SpatialEntity[] = [];
  private crimsonOrbitActive = false;
  public scytheFacingAngle = Math.PI / 2;

  constructor(
    public readonly scene: Phaser.Scene,
    public readonly player: Phaser.Physics.Arcade.Image,
    public readonly enemies: EnemySystem,
    public readonly run: RunState,
    public readonly juice: JuiceSystem,
    private readonly powerups: PowerupSystem,
    private readonly conditionalUpgrades: ConditionalUpgradeSystem,
    private readonly statuses: StatusEffectSystem,
    public readonly impactFragments: ImpactFragmentSystem,
  ) {
    this.projectiles = scene.physics.add.group();
    this.evolutions = new WeaponEvolutionSystem(scene, enemies, run, juice);
    this.synergies = new WeaponSynergySystem(run);
    this.crimsonOrbit = new CrimsonOrbitSystem(scene, player, enemies);
    this.hazardZones = new HazardZoneSystem(
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
    const bloodletterState = this.run.weapons.states.get('bloodletter-axe');
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

    for (const weaponId of this.run.weapons.equipped) {
      if (weaponId === 'bloodletter-axe' && orbitActive) {
        continue;
      }
      const state = this.run.weapons.getState(weaponId);
      if (time >= (this.nextFire.get(weaponId) ?? 0)) {
        this.nextFire.set(weaponId, time + this.effectiveCooldown(state));
        this.fire(weaponId, state, time);
      }
    }
    this.updateProjectiles(time);
    this.hazardZones.update(time);
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
    const durationMs = this.effectiveCooldown(this.run.weapons.getState(id));
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
    const behaviorName = WEAPONS[id]?.behavior;
    if (!behaviorName) return;
    const behavior = WEAPON_BEHAVIORS[behaviorName];
    if (behavior) {
      behavior.fire(this, id, state, time);
    } else {
      WEAPON_BEHAVIORS['targeted-projectile']!.fire(this, id, state, time);
    }
  }

  private updateProjectiles(time: number): void {
    for (const [projectile, runtime] of this.projectileRuntime) {
      if (!projectile.active) {
        this.destroyProjectile(projectile);
        continue;
      }
      if (
        projectile.x < -1000 ||
        projectile.x > 5000 ||
        projectile.y < -1000 ||
        projectile.y > 5000
      ) {
        this.destroyProjectile(projectile);
        continue;
      }
      if (time >= runtime.expiresAt) {
        if (runtime.landingX !== undefined && runtime.landingY !== undefined) {
          this.landLobbedProjectile(runtime, runtime.landingX, runtime.landingY, true);
        } else if (runtime.weaponId === 'exploding-revolver') {
          this.explodeRevolver(projectile.x, projectile.y, runtime);
        }
        this.destroyProjectile(projectile);
        continue;
      }
      if (runtime.returnAt !== undefined && time >= runtime.returnAt) {
        if (!runtime.returning) {
          runtime.returning = true;
          runtime.outboundExhausted = false;
          runtime.pierceRemaining = Math.floor(this.run.weapons.getState(runtime.weaponId).stats.pierce);
          if (this.evolutions.isEvolved(runtime.weaponId)) {
            runtime.hit.clear();
          }
        }
        const angle = Phaser.Math.Angle.Between(projectile.x, projectile.y, this.player.x, this.player.y);
        const speed = this.run.weapons.getState(runtime.weaponId).stats.projectileSpeed;
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        projectile.rotation += 0.24;
        if (Phaser.Math.Distance.Between(projectile.x, projectile.y, this.player.x, this.player.y) < 42) {
          this.destroyProjectile(projectile);
          continue;
        }
      }
      
      if (runtime.weaponId === 'frozen-orb' && runtime.data) {
        runtime.data.currentRotation += runtime.data.rotationSpeed;
        const icicles = runtime.data.icicles as { sprite: Phaser.Physics.Arcade.Image, angleOffset: number }[];
        
        for (const icicle of icicles) {
          const angle = runtime.data.currentRotation + icicle.angleOffset;
          icicle.sprite.setPosition(
            projectile.x + Math.cos(angle) * runtime.data.orbitRadius,
            projectile.y + Math.sin(angle) * runtime.data.orbitRadius
          );
          
          // Check icicle collision
          const candidates = this.enemies.grid.getNearby(icicle.sprite.x, icicle.sprite.y, 80, this.nearbyCache);
          for (const entity of candidates) {
            const enemy = entity.sprite;
            const definition = entity.definition;
            if (
              time < (runtime.data.hitReadyAt.get(enemy) ?? 0) ||
              Phaser.Math.Distance.Between(icicle.sprite.x, icicle.sprite.y, enemy.x, enemy.y) >
                definition.radius + icicle.sprite.displayWidth * 0.35
            ) {
              continue;
            }
            runtime.data.hitReadyAt.set(enemy, time + 600); // 600ms cooldown per enemy for icicles
            const result = this.damageEnemy(enemy, definition, runtime.weaponId);
            this.afterProjectileImpact(runtime.weaponId, enemy, result.killed, runtime.hit);
          }
        }
        
        // Clean up stale hits periodically
        if (time % 60 === 0) {
          for (const enemy of runtime.data.hitReadyAt.keys()) {
            if (!enemy.active) {
              runtime.data.hitReadyAt.delete(enemy);
            }
          }
        }
        
        // Evolved version fires ice shards
        const state = this.run.weapons.getState(runtime.weaponId);
        if (state.level >= 7) {
          if (!runtime.data.lastShardFiredAt) runtime.data.lastShardFiredAt = time;
          if (time - runtime.data.lastShardFiredAt > 200) {
            runtime.data.lastShardFiredAt = time;
            const target = this.enemies.findNearest(projectile.x, projectile.y, 400);
            if (target) {
              const angle = Phaser.Math.Angle.Between(projectile.x, projectile.y, target.x, target.y);
              const shard = this.createProjectile(runtime.weaponId, 'projectile-laser', state, angle, time, projectile.x, projectile.y);
              shard.setDisplaySize(16, 16).setTint(0x00ffff);
            }
          }
        }
      }

      let shouldDestroy = false;
      const candidates = this.enemies.grid.getNearby(projectile.x, projectile.y, 100, this.nearbyCache);
      for (const entity of candidates) {
        const enemy = entity.sprite;
        const definition = entity.definition;
        if (
          shouldDestroy ||
          runtime.hit.has(enemy) ||
          (runtime.outboundExhausted && !runtime.returning) ||
          Phaser.Math.Distance.Between(projectile.x, projectile.y, enemy.x, enemy.y) >
            definition.radius + projectile.displayWidth * 0.35
        ) {
          continue;
        }
        runtime.hit.add(enemy);
        const result = this.damageEnemy(enemy, definition, runtime.weaponId);
        this.afterProjectileImpact(runtime.weaponId, enemy, result.killed, runtime.hit);
        if (runtime.weaponId === 'poison-flask' || runtime.weaponId === 'pouch-of-chaos') {
          this.landLobbedProjectile(runtime, enemy.x, enemy.y, false);
          shouldDestroy = true;
          continue;
        }
        if (runtime.weaponId === 'exploding-revolver') {
          this.explodeRevolver(enemy.x, enemy.y, runtime);
          shouldDestroy = true;
          continue;
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
      }
      if (shouldDestroy) {
        this.destroyProjectile(projectile);
      }
    }
  }

  public damageEnemy(
    sprite: Phaser.Physics.Arcade.Image,
    definition: EnemyDefinition,
    weaponId: WeaponId,
    damageScale = 1,
  ): { killed: boolean } {
    const state = this.run.weapons.getState(weaponId);
    const result = calculateDamage({
      baseDamage: state.stats.damage,
      damageMultiplier:
        this.run.stats.current.damage *
        this.synergies.damageMultiplier(weaponId) *
        this.conditionalUpgrades.damageMultiplier(definition, this.scene.time.now),
      critChance: Math.min(
        BALANCE.maxCritChance,
        this.run.stats.current.critChance +
          state.stats.critChance +
          this.powerups.critChanceBonus() +
          this.synergies.critChanceBonus(weaponId),
      ),
      critMultiplier: this.run.stats.current.critDamage + state.stats.critDamage,
      bossMultiplier: this.run.stats.current.bossDamage,
      targetIsBoss: definition.boss,
    });
    const applied = this.enemies.damage(sprite, Math.max(1, Math.round(result.amount * damageScale)), result.critical);
    this.run.weapons.recordHit(weaponId, applied.dealt, applied.killed, result.critical, Boolean(definition.boss));
    return { killed: applied.killed };
  }

  public createProjectile(
    id: WeaponId,
    texture: string,
    state: WeaponRuntimeState,
    angle: number,
    time: number,
    startX: number = this.player.x,
    startY: number = this.player.y,
  ): Phaser.Physics.Arcade.Image {
    const projectile = this.projectiles.get(startX, startY) as Phaser.Physics.Arcade.Image;
    projectile
      .setTexture(texture)
      .setActive(true)
      .setVisible(true)
      .setDisplaySize(state.stats.projectileSize, state.stats.projectileSize)
      .setDepth(30)
      .setRotation(angle)
      .setBlendMode(Phaser.BlendModes.ADD);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
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
    
    return projectile;
  }

  public getProjectileRuntime(projectile: Phaser.Physics.Arcade.Image): ProjectileRuntime | undefined {
    return this.projectileRuntime.get(projectile);
  }

  public createLobbedProjectile(
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
    const projectile = this.projectiles.get(
      this.player.x,
      this.player.y
    ) as Phaser.Physics.Arcade.Image;
    projectile
      .setTexture(WEAPONS[id].texture)
      .setActive(true)
      .setVisible(true)
      .setDisplaySize(state.stats.projectileSize, state.stats.projectileSize)
      .setDepth(30)
      .setRotation(angle)
      .setBlendMode(Phaser.BlendModes.ADD);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
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

  public damageArea(x: number, y: number, radius: number, weaponId: WeaponId, damageScale = 1): void {
    const candidates = this.enemies.grid.getNearby(x, y, radius, this.nearbyCache);
    for (const entity of candidates) {
      if (Phaser.Math.Distance.Between(x, y, entity.sprite.x, entity.sprite.y) <= radius) {
        this.damageEnemy(entity.sprite, entity.definition, weaponId, damageScale);
      }
    }
  }

  public damageScytheSweep(
    x: number,
    y: number,
    radius: number,
    weaponId: WeaponId,
    damageScale: number,
    profile: ScytheSweepProfile,
  ): number {
    const talents = this.run.boneScythe.getProfile();
    let hitCount = 0;
    let pullVisualCount = 0;
    const candidates = this.enemies.grid.getNearby(x, y, radius, this.nearbyCache);
    for (const entity of candidates) {
      const enemy = entity.sprite;
      const definition = entity.definition;
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
    }
    return hitCount;
  }

  public damageArc(
    x: number,
    y: number,
    radius: number,
    weaponId: WeaponId,
    facingAngle: number,
    sweepAngle: number,
  ): Set<Phaser.Physics.Arcade.Image> {
    const struck = new Set<Phaser.Physics.Arcade.Image>();
    const candidates = this.enemies.grid.getNearby(x, y, radius, this.nearbyCache);
    for (const entity of candidates) {
      const enemy = entity.sprite;
      const definition = entity.definition;
      
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distanceSq = dx * dx + dy * dy;
      const effectiveRadius = radius + definition.radius * 0.35;
      
      if (distanceSq <= effectiveRadius * effectiveRadius) {
        const angleToPoint = Math.atan2(dy, dx);
        let angleDiff = angleToPoint - facingAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) <= sweepAngle / 2) {
          struck.add(enemy);
          this.damageEnemy(enemy, definition, weaponId, 1);
        }
      }
    }
    return struck;
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
    this.run.weapons.recordHit(
      consumed.sourceWeaponId ?? fallbackWeaponId,
      result.dealt,
      result.killed,
      false,
      Boolean(definition.boss),
    );
    this.juice.ring(enemy.x, enemy.y, 32, 0x9f1f2d, 180);
  }

  private explodeRevolver(x: number, y: number, runtime: ProjectileRuntime): void {
    const state = this.run.weapons.getState(runtime.weaponId);
    this.juice.ring(x, y, state.stats.area, 0xffa500, 200);
    this.damageArea(x, y, state.stats.area, runtime.weaponId);
  }

  private landLobbedProjectile(runtime: ProjectileRuntime, x: number, y: number, impactDamage: boolean): void {
    const state = this.run.weapons.getState(runtime.weaponId);
    
    if (runtime.weaponId === 'pouch-of-chaos') {
      this.juice.ring(x, y, state.stats.area, 0x8e44ad, 260);
      if (impactDamage) {
        this.damageArea(x, y, state.stats.area, runtime.weaponId);
      }
      
      const effects: StatusEffectId[] = ['poison', 'bleed', 'burn', 'slow'];
      const effectId = effects[Phaser.Math.Between(0, effects.length - 1)]!;
      
      this.hazardZones.spawn(x, y, runtime.weaponId, {
        radius: state.stats.area,
        durationMs: 4000,
        tickIntervalMs: 500,
        damageScale: 0.5,
        color: 0x8e44ad,
        strokeColor: 0xd7bde2,
        statusEffect: {
          id: effectId,
          damagePerTick: 3,
        }
      });
      return;
    }

    this.juice.ring(x, y, state.stats.area, 0x51d96b, 260);
    if (impactDamage) {
      this.damageArea(x, y, poisonFlaskImpactRadius(state.stats), runtime.weaponId);
    }
    this.hazardZones.spawn(
      x,
      y,
      runtime.weaponId,
      {
        radius: poisonFlaskPoolProfile(state.stats, this.evolutions.isEvolved(runtime.weaponId)).radius,
        durationMs: poisonFlaskPoolProfile(state.stats, this.evolutions.isEvolved(runtime.weaponId)).durationMs,
        tickIntervalMs: poisonFlaskPoolProfile(state.stats, this.evolutions.isEvolved(runtime.weaponId)).tickIntervalMs,
        damageScale: poisonFlaskPoolProfile(state.stats, this.evolutions.isEvolved(runtime.weaponId)).damageScale,
        color: 0x1f8d37,
        strokeColor: 0x51d96b,
        texture: 'weapon-poison-flask',
        statusEffect: poisonFlaskPoolProfile(state.stats, this.evolutions.isEvolved(runtime.weaponId)).appliesPoison ? {
          id: 'poison',
          damagePerTick: poisonFlaskPoolProfile(state.stats, this.evolutions.isEvolved(runtime.weaponId)).poisonDamagePerTick,
        } : undefined,
      }
    );
  }

  public afterAreaAttack(
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
    
    if (id === 'frozen-orb') {
      this.statuses.applyToEnemy(impact, 'slow', { sourceWeaponId: id, damagePerTick: 0 });
    } else if (id === 'infernal-blunderbuss') {
      this.statuses.applyToEnemy(impact, 'burn', { sourceWeaponId: id, damagePerTick: 2 });
    }
  }

  private effectiveCooldown(state: WeaponRuntimeState): number {
    return state.stats.cooldownMs / this.effectiveAttackSpeed();
  }

  private effectiveAttackSpeed(): number {
    return Math.min(
      BALANCE.maxAttackSpeedMultiplier,
      this.run.stats.current.attackSpeed * this.powerups.attackSpeedMultiplier(),
    );
  }

  private destroyProjectile(projectile: Phaser.Physics.Arcade.Image): void {
    const runtime = this.projectileRuntime.get(projectile);
    if (runtime && runtime.data && runtime.data.icicles) {
      for (const icicle of runtime.data.icicles) {
        icicle.sprite.destroy();
      }
    }
    this.projectileRuntime.delete(projectile);
    projectile.setActive(false).setVisible(false);
  }

  private destroyProjectilesForWeapon(id: WeaponId): void {
    for (const [projectile, runtime] of this.projectileRuntime) {
      if (runtime.weaponId === id) {
        this.destroyProjectile(projectile);
      }
    }
  }
}
