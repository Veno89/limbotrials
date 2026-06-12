import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';
import { COLORS } from '../constants';
import type { EnemyDefinition } from '../types/gameTypes';
import type { EnemyAbilityId } from '../types/gameTypes';
import type { JuiceSystem } from './JuiceSystem';
import { scaleThreatDamage } from './threatRules';
import { calculateBruteCharge } from './enemyAbilityRules';

interface AbilityRuntime {
  nextAbilityAt: number;
  mode: 'pursuit' | 'windup' | 'charge' | 'recovery';
  modeEndsAt: number;
  targetAngle: number;
  strafeDirection: number;
  damageMultiplier: number;
}

interface EnemyProjectileRuntime {
  expiresAt: number;
  damage: number;
  source: EnemyAbilityId;
}

interface GroundHazard {
  circle: Phaser.GameObjects.GameObject;
  x: number;
  y: number;
  radius: number;
  damage: number;
  expiresAt: number;
  source: EnemyAbilityId;
}

export interface EnemyMovementDirective {
  angle: number;
  speedMultiplier: number;
}

export class EnemyAbilitySystem {
  private readonly runtime = new Map<Phaser.Physics.Arcade.Image, AbilityRuntime>();
  private readonly projectiles: Phaser.Physics.Arcade.Group;
  private readonly projectileRuntime = new Map<Phaser.Physics.Arcade.Image, EnemyProjectileRuntime>();
  private readonly groundHazards = new Set<GroundHazard>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly juice: JuiceSystem,
    private readonly onPlayerHit: (damage: number, source: EnemyAbilityId) => void,
  ) {
    this.projectiles = scene.physics.add.group();
  }

  register(
    sprite: Phaser.Physics.Arcade.Image,
    definition: EnemyDefinition,
    damageMultiplier: number,
  ): void {
    this.runtime.set(sprite, {
      nextAbilityAt: this.scene.time.now + Phaser.Math.Between(1800, definition.elite ? 3000 : 4200),
      mode: 'pursuit',
      modeEndsAt: 0,
      targetAngle: 0,
      strafeDirection: Math.random() < 0.5 ? -1 : 1,
      damageMultiplier,
    });
  }

  unregister(sprite: Phaser.Physics.Arcade.Image): void {
    this.runtime.delete(sprite);
  }

  movementFor(
    sprite: Phaser.Physics.Arcade.Image,
    definition: EnemyDefinition,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    const runtime = this.runtime.get(sprite);
    if (!runtime) {
      return { angle: pursuitAngle, speedMultiplier: 1 };
    }

    if (definition.behavior === 'brute-charge') {
      return this.updateBrute(sprite, runtime, definition, time, pursuitAngle, distance);
    }
    if (definition.behavior === 'void-caster') {
      return this.updateVoidCaster(sprite, runtime, time, pursuitAngle, distance);
    }
    if (definition.behavior === 'screamer') {
      return this.updateScreamer(sprite, runtime, time, pursuitAngle, distance);
    }
    if (definition.behavior === 'archer') {
      return this.updateArcher(sprite, runtime, time, pursuitAngle, distance);
    }
    if (definition.behavior === 'stalker') {
      return this.updateStalker(sprite, runtime, time, pursuitAngle, distance);
    }
    if (definition.behavior === 'trail-hazard') {
      return this.updateTrailHazard(sprite, runtime, time, pursuitAngle, distance, definition.id);
    }
    if (definition.behavior === 'bomb-thrower') {
      return this.updateBombThrower(sprite, runtime, time, pursuitAngle, distance);
    }
    return { angle: pursuitAngle, speedMultiplier: 1 };
  }

  updateProjectiles(time: number): void {
    for (const [projectile, runtime] of this.projectileRuntime) {
      if (!projectile.active || time >= runtime.expiresAt) {
        this.destroyProjectile(projectile);
        continue;
      }
      if (Phaser.Math.Distance.Between(projectile.x, projectile.y, this.player.x, this.player.y) < 30) {
        this.onPlayerHit(runtime.damage, runtime.source);
        this.destroyProjectile(projectile);
      }
    }

    const expired: GroundHazard[] = [];
    for (const hazard of this.groundHazards) {
      if (time >= hazard.expiresAt) {
        hazard.circle.destroy();
        expired.push(hazard);
        continue;
      }
      if (Phaser.Math.Distance.Between(hazard.x, hazard.y, this.player.x, this.player.y) < hazard.radius) {
        this.onPlayerHit(hazard.damage, hazard.source);
      }
    }
    for (const hazard of expired) {
      this.groundHazards.delete(hazard);
    }
  }

  private updateBrute(
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    definition: EnemyDefinition,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    const charge = calculateBruteCharge(definition.speed);
    if (runtime.mode === 'pursuit' && time >= runtime.nextAbilityAt && distance < 650) {
      runtime.mode = 'windup';
      runtime.modeEndsAt = time + 650;
      runtime.targetAngle = pursuitAngle;
      runtime.nextAbilityAt = time + 5200;
      this.createChargeTelegraph(sprite, runtime.targetAngle, charge.distance);
    } else if (runtime.mode === 'windup' && time >= runtime.modeEndsAt) {
      runtime.mode = 'charge';
      runtime.modeEndsAt = time + charge.durationMs;
      this.juice.ring(sprite.x, sprite.y, 72, COLORS.enemyTelegraph, 180);
    } else if (runtime.mode === 'charge' && time >= runtime.modeEndsAt) {
      runtime.mode = 'recovery';
      runtime.modeEndsAt = time + 650;
    } else if (runtime.mode === 'recovery' && time >= runtime.modeEndsAt) {
      runtime.mode = 'pursuit';
    }

    if (runtime.mode === 'windup') {
      return { angle: runtime.targetAngle, speedMultiplier: 0 };
    }
    if (runtime.mode === 'charge') {
      return { angle: runtime.targetAngle, speedMultiplier: charge.speedMultiplier };
    }
    if (runtime.mode === 'recovery') {
      return { angle: pursuitAngle, speedMultiplier: 0.25 };
    }
    return { angle: pursuitAngle, speedMultiplier: 1 };
  }

  private updateVoidCaster(
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    if (time >= runtime.nextAbilityAt && distance < 720) {
      runtime.nextAbilityAt = time + Phaser.Math.Between(2800, 3500);
      this.telegraphVoidOrb(sprite, runtime.damageMultiplier);
    }
    if (distance < 260) {
      return { angle: pursuitAngle + Math.PI, speedMultiplier: 0.9 };
    }
    if (distance > 430) {
      return { angle: pursuitAngle, speedMultiplier: 0.78 };
    }
    return { angle: pursuitAngle + runtime.strafeDirection * Math.PI * 0.5, speedMultiplier: 0.72 };
  }

  private updateScreamer(
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    if (time >= runtime.nextAbilityAt && distance < 520) {
      runtime.nextAbilityAt = time + Phaser.Math.Between(4700, 5600);
      this.telegraphScream(sprite, runtime.damageMultiplier);
    }
    return { angle: pursuitAngle, speedMultiplier: distance < 245 ? 0.45 : 0.82 };
  }

  private updateArcher(
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    if (time >= runtime.nextAbilityAt && distance < 780) {
      runtime.nextAbilityAt = time + Phaser.Math.Between(2400, 3100);
      this.telegraphGraveArrow(sprite, runtime.damageMultiplier);
    }
    if (distance < 330) {
      return { angle: pursuitAngle + Math.PI, speedMultiplier: 0.92 };
    }
    if (distance > 560) {
      return { angle: pursuitAngle, speedMultiplier: 0.72 };
    }
    return { angle: pursuitAngle + runtime.strafeDirection * Math.PI * 0.5, speedMultiplier: 0.58 };
  }

  private updateStalker(
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    if (runtime.mode === 'pursuit' && time >= runtime.nextAbilityAt && distance < 520) {
      runtime.mode = 'windup';
      runtime.modeEndsAt = time + 320;
      runtime.targetAngle = pursuitAngle;
      runtime.nextAbilityAt = time + Phaser.Math.Between(3000, 3800);
      this.juice.ring(sprite.x, sprite.y, 48, COLORS.void, 300);
    } else if (runtime.mode === 'windup' && time >= runtime.modeEndsAt) {
      runtime.mode = 'charge';
      runtime.modeEndsAt = time + 460;
    } else if (runtime.mode === 'charge' && time >= runtime.modeEndsAt) {
      runtime.mode = 'recovery';
      runtime.modeEndsAt = time + 420;
    } else if (runtime.mode === 'recovery' && time >= runtime.modeEndsAt) {
      runtime.mode = 'pursuit';
    }

    if (runtime.mode === 'windup') {
      return { angle: runtime.targetAngle, speedMultiplier: 0.1 };
    }
    if (runtime.mode === 'charge') {
      return { angle: runtime.targetAngle, speedMultiplier: 4.8 };
    }
    if (runtime.mode === 'recovery') {
      return { angle: pursuitAngle, speedMultiplier: 0.45 };
    }
    return { angle: pursuitAngle, speedMultiplier: distance > 230 ? 1.22 : 0.75 };
  }

  private createChargeTelegraph(sprite: Phaser.Physics.Arcade.Image, angle: number, distance: number): void {
    const line = this.scene.add
      .rectangle(sprite.x, sprite.y, distance, 66, COLORS.enemyTelegraph, 0.12)
      .setOrigin(0, 0.5)
      .setRotation(angle)
      .setDepth(17)
      .setStrokeStyle(2, COLORS.enemyTelegraph, 0.8);
    this.scene.tweens.add({
      targets: line,
      alpha: 0.42,
      yoyo: true,
      repeat: 2,
      duration: 105,
      onComplete: () => line.destroy(),
    });
  }

  private telegraphVoidOrb(sprite: Phaser.Physics.Arcade.Image, damageMultiplier: number): void {
    this.juice.ring(sprite.x, sprite.y, 58, COLORS.enemyTelegraph, 430);
    this.scene.time.delayedCall(420, () => {
      if (!sprite.active) {
        return;
      }
      const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
      const projectile = this.projectiles.create(sprite.x, sprite.y, 'projectile-void') as Phaser.Physics.Arcade.Image;
      projectile.setDisplaySize(34, 34).setDepth(28).setTint(COLORS.enemyProjectile).setBlendMode(Phaser.BlendModes.ADD);
      const body = projectile.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250);
      this.projectileRuntime.set(projectile, {
        expiresAt: this.scene.time.now + 3200,
        damage: scaleThreatDamage(13, damageMultiplier),
        source: 'void-orb',
      });
    });
  }

  private telegraphGraveArrow(sprite: Phaser.Physics.Arcade.Image, damageMultiplier: number): void {
    const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
    const line = this.scene.add
      .rectangle(sprite.x, sprite.y, 620, 18, COLORS.enemyProjectile, 0.1)
      .setOrigin(0, 0.5)
      .setRotation(angle)
      .setDepth(17)
      .setStrokeStyle(1, COLORS.enemyProjectile, 0.7);
    this.scene.tweens.add({
      targets: line,
      alpha: 0.38,
      yoyo: true,
      repeat: 2,
      duration: 90,
      onComplete: () => line.destroy(),
    });
    this.scene.time.delayedCall(420, () => {
      if (!sprite.active) {
        return;
      }
      const shotAngle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
      const projectile = this.projectiles.create(
        sprite.x,
        sprite.y,
        'projectile-laser',
      ) as Phaser.Physics.Arcade.Image;
      projectile
        .setDisplaySize(42, 16)
        .setDepth(28)
        .setRotation(shotAngle)
        .setTint(COLORS.enemyProjectile)
        .setBlendMode(Phaser.BlendModes.ADD);
      const body = projectile.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(shotAngle) * 420, Math.sin(shotAngle) * 420);
      this.projectileRuntime.set(projectile, {
        expiresAt: this.scene.time.now + 2600,
        damage: scaleThreatDamage(12, damageMultiplier),
        source: 'grave-arrow',
      });
    });
  }

  private telegraphScream(sprite: Phaser.Physics.Arcade.Image, damageMultiplier: number): void {
    const x = sprite.x;
    const y = sprite.y;
    const radius = 225;
    this.juice.ring(x, y, radius, COLORS.enemyTelegraph, 900);
    this.scene.time.delayedCall(880, () => {
      if (!sprite.active) {
        return;
      }
      this.juice.ring(x, y, radius, COLORS.enemyProjectileGlow, 180);
      this.juice.heavyImpact();
      if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < radius) {
        this.onPlayerHit(scaleThreatDamage(17, damageMultiplier), 'scream');
      }
    });
  }

  private createGroundHazard(
    x: number,
    y: number,
    radius: number,
    duration: number,
    damage: number,
    source: EnemyAbilityId,
  ): void {
    if (this.groundHazards.size >= BALANCE.maxActiveHazards) {
      return;
    }
    const isFire = source === 'fire-flask';
    const color = isFire ? COLORS.hellfire : 0x4f7d3b;
    const alpha = 0.18;
    const ring = this.scene.add.circle(x, y, radius, color, alpha)
      .setStrokeStyle(2, COLORS.enemyTelegraph, 0.8)
      .setDepth(15);

    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      delay: duration - 300,
      duration: 300,
      onComplete: () => {
        ring.destroy();
      },
    });

    this.groundHazards.add({
      circle: ring,
      x,
      y,
      radius,
      damage,
      expiresAt: this.scene.time.now + duration,
      source,
    });
  }

  private updateTrailHazard(
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    time: number,
    pursuitAngle: number,
    _distance: number,
    enemyId: string,
  ): EnemyMovementDirective {
    if (time >= runtime.nextAbilityAt) {
      const isDefiler = enemyId === 'grave-defiler';
      const radius = isDefiler ? 48 : 32;
      const duration = isDefiler ? 4500 : 3000;
      const damage = isDefiler ? 12 : 8;

      runtime.nextAbilityAt = time + 600;
      this.createGroundHazard(
        sprite.x,
        sprite.y,
        radius,
        duration,
        scaleThreatDamage(damage, runtime.damageMultiplier),
        'plague-trail',
      );
    }
    return { angle: pursuitAngle, speedMultiplier: 1.0 };
  }

  private updateBombThrower(
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    if (time >= runtime.nextAbilityAt && distance < 680) {
      runtime.nextAbilityAt = time + Phaser.Math.Between(3200, 4000);
      this.telegraphFireFlask(sprite, runtime.damageMultiplier);
    }
    if (distance < 300) {
      return { angle: pursuitAngle + Math.PI, speedMultiplier: 0.95 };
    }
    if (distance > 500) {
      return { angle: pursuitAngle, speedMultiplier: 0.75 };
    }
    return { angle: pursuitAngle + runtime.strafeDirection * Math.PI * 0.5, speedMultiplier: 0.6 };
  }

  private telegraphFireFlask(sprite: Phaser.Physics.Arcade.Image, damageMultiplier: number): void {
    const targetX = this.player.x;
    const targetY = this.player.y;
    const delay = 1200;
    const radius = 64;

    const telegraph = this.scene.add.circle(targetX, targetY, radius, COLORS.enemyTelegraph, 0.08)
      .setStrokeStyle(1.5, COLORS.enemyTelegraph, 0.7)
      .setDepth(15);

    this.scene.tweens.add({
      targets: telegraph,
      alpha: 0.22,
      yoyo: true,
      repeat: -1,
      duration: 200,
    });

    const flask = this.scene.physics.add.image(sprite.x, sprite.y, 'projectile-void');
    flask.setDisplaySize(20, 20)
      .setTint(COLORS.hellfire)
      .setDepth(28);

    const travelTime = delay;
    const vx = (targetX - sprite.x) / (travelTime / 1000);
    const vy = (targetY - sprite.y) / (travelTime / 1000);
    const body = flask.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);

    this.scene.tweens.add({
      targets: flask,
      angle: 360,
      duration: travelTime,
    });

    this.scene.time.delayedCall(delay, () => {
      telegraph.destroy();
      flask.destroy();

      this.juice.ring(targetX, targetY, radius, COLORS.hellfire, 240);

      if (Phaser.Math.Distance.Between(targetX, targetY, this.player.x, this.player.y) < radius) {
        this.onPlayerHit(scaleThreatDamage(16, damageMultiplier), 'fire-flask');
      }

      this.createGroundHazard(
        targetX,
        targetY,
        radius,
        3000,
        scaleThreatDamage(7, damageMultiplier),
        'fire-flask',
      );
    });
  }

  private destroyProjectile(projectile: Phaser.Physics.Arcade.Image): void {
    this.projectileRuntime.delete(projectile);
    projectile.destroy();
  }
}
