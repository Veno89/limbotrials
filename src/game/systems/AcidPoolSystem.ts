import Phaser from 'phaser';
import type { EnemyDefinition, WeaponId } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';
import type { StatusEffectSystem } from './StatusEffectSystem';
import type { AcidPoolProfile } from './acidPoolRules';

type DamageEnemy = (
  sprite: Phaser.Physics.Arcade.Image,
  definition: EnemyDefinition,
  weaponId: WeaponId,
  damageScale: number,
) => { killed: boolean };

interface AcidPoolRuntime {
  x: number;
  y: number;
  weaponId: WeaponId;
  profile: AcidPoolProfile;
  nextTickAt: number;
  expiresAt: number;
  pool: Phaser.GameObjects.Arc;
  bottle: Phaser.GameObjects.Image;
}

export class AcidPoolSystem {
  private readonly pools: AcidPoolRuntime[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly enemies: EnemySystem,
    private readonly statuses: StatusEffectSystem,
    private readonly damageEnemy: DamageEnemy,
  ) {}

  spawn(x: number, y: number, weaponId: WeaponId, profile: AcidPoolProfile): void {
    const pool = this.scene.add
      .circle(x, y, profile.radius, 0x1f8d37, 0.22)
      .setStrokeStyle(2, 0x51d96b, 0.72)
      .setDepth(17)
      .setBlendMode(Phaser.BlendModes.ADD);
    const bottle = this.scene.add
      .image(x, y, 'weapon-poison-flask')
      .setDisplaySize(20, 20)
      .setAlpha(0.72)
      .setDepth(18);
    this.scene.tweens.add({
      targets: pool,
      alpha: 0.1,
      scaleX: 1.08,
      scaleY: 1.08,
      yoyo: true,
      repeat: -1,
      duration: 640,
      ease: 'Sine.InOut',
    });
    this.pools.push({
      x,
      y,
      weaponId,
      profile,
      nextTickAt: this.scene.time.now + profile.tickIntervalMs,
      expiresAt: this.scene.time.now + profile.durationMs,
      pool,
      bottle,
    });
  }

  update(time: number): void {
    for (let index = this.pools.length - 1; index >= 0; index -= 1) {
      const pool = this.pools[index]!;
      if (time >= pool.expiresAt) {
        this.destroyPool(index);
        continue;
      }
      while (time >= pool.nextTickAt) {
        this.tick(pool);
        pool.nextTickAt += pool.profile.tickIntervalMs;
      }
    }
  }

  private tick(pool: AcidPoolRuntime): void {
    this.enemies.forEach((enemy, definition) => {
      if (
        Phaser.Math.Distance.Between(pool.x, pool.y, enemy.x, enemy.y) >
        pool.profile.radius + definition.radius * 0.45
      ) {
        return;
      }
      const result = this.damageEnemy(enemy, definition, pool.weaponId, pool.profile.damageScale);
      if (!result.killed && pool.profile.appliesPoison && enemy.active) {
        this.statuses.applyToEnemy(enemy, 'poison', {
          sourceWeaponId: pool.weaponId,
          damagePerTick: pool.profile.poisonDamagePerTick,
        });
      }
    });
  }

  private destroyPool(index: number): void {
    const [pool] = this.pools.splice(index, 1);
    if (!pool) {
      return;
    }
    pool.pool.destroy();
    pool.bottle.destroy();
  }
}
