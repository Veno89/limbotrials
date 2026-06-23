import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';
import { COLORS } from '../constants';
import type { EnemyDefinition } from '../types/gameTypes';
import type { EnemyAbilityId } from '../types/gameTypes';
import type { JuiceSystem } from './JuiceSystem';
import type { DeathEchoProfile } from './deathEchoRules';
import type { EnemyAbilityContext, AbilityRuntime, EnemyProjectileRuntime, GroundHazard, EnemyMovementDirective } from './enemies/EnemyAbilityContext';
import { ENEMY_BEHAVIORS } from './enemies/EnemyBehaviors';

export class EnemyAbilitySystem implements EnemyAbilityContext {
  private readonly runtime = new Map<Phaser.Physics.Arcade.Image, AbilityRuntime>();
  public readonly projectiles: Phaser.Physics.Arcade.Group;
  public readonly projectileRuntime = new Map<Phaser.Physics.Arcade.Image, EnemyProjectileRuntime>();
  public readonly groundHazards = new Set<GroundHazard>();

  constructor(
    public readonly scene: Phaser.Scene,
    public readonly player: Phaser.Physics.Arcade.Image,
    public readonly juice: JuiceSystem,
    private readonly _onPlayerHit: (damage: number, source: EnemyAbilityId) => void,
    private readonly _getDeathEchoProfile: () => DeathEchoProfile | undefined = () => undefined,
  ) {
    this.projectiles = scene.physics.add.group();
  }

  onPlayerHit(damage: number, source: EnemyAbilityId): void {
    this._onPlayerHit(damage, source);
  }

  getDeathEchoProfile(): DeathEchoProfile | undefined {
    return this._getDeathEchoProfile();
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
      specialIndex: 0,
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

    const behaviorName = definition.behavior;
    const behavior = ENEMY_BEHAVIORS[behaviorName];
    if (behavior) {
      return behavior.movementFor(this, sprite, runtime, definition, time, pursuitAngle, distance);
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

  createGroundHazard(
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

  private destroyProjectile(projectile: Phaser.Physics.Arcade.Image): void {
    this.projectileRuntime.delete(projectile);
    projectile.setActive(false).setVisible(false);
  }
}
