import Phaser from 'phaser';
import type { EnemyDefinition, WeaponId } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';
import { isPointInScytheSweep, type ScytheSweepProfile } from './scytheRules';

interface ActiveScytheWake {
  x: number;
  y: number;
  radius: number;
  weaponId: WeaponId;
  damageScale: number;
  profile: ScytheSweepProfile;
  activatesAt: number;
  expiresAt: number;
  hit: Set<Phaser.Physics.Arcade.Image>;
  visual: Phaser.GameObjects.Container;
}

type DamageEnemy = (
  sprite: Phaser.Physics.Arcade.Image,
  definition: EnemyDefinition,
  weaponId: WeaponId,
  damageScale: number,
) => void;

export class ScytheWakeSystem {
  private readonly wakes: ActiveScytheWake[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly enemies: EnemySystem,
    private readonly damageEnemy: DamageEnemy,
  ) {}

  spawn(
    x: number,
    y: number,
    radius: number,
    weaponId: WeaponId,
    damageScale: number,
    profile: ScytheSweepProfile,
  ): void {
    if (damageScale <= 0) {
      return;
    }
    const visual = this.createVisual(x, y, radius, profile);
    const now = this.scene.time.now;
    this.wakes.push({
      x,
      y,
      radius,
      weaponId,
      damageScale,
      profile: { ...profile },
      activatesAt: now + 180,
      expiresAt: now + 1050,
      hit: new Set(),
      visual,
    });
  }

  update(time: number): void {
    for (let index = this.wakes.length - 1; index >= 0; index -= 1) {
      const wake = this.wakes[index];
      if (!wake) {
        continue;
      }
      if (time >= wake.expiresAt) {
        wake.visual.destroy();
        this.wakes.splice(index, 1);
        continue;
      }
      if (time < wake.activatesAt) {
        continue;
      }
      this.enemies.forEach((enemy, definition) => {
        if (
          wake.hit.has(enemy) ||
          !isPointInScytheSweep(
            wake.x,
            wake.y,
            enemy.x,
            enemy.y,
            wake.radius,
            wake.profile,
            definition.radius * 0.35,
          )
        ) {
          return;
        }
        wake.hit.add(enemy);
        this.damageEnemy(enemy, definition, wake.weaponId, wake.damageScale);
      });
    }
  }

  private createVisual(
    x: number,
    y: number,
    radius: number,
    profile: ScytheSweepProfile,
  ): Phaser.GameObjects.Container {
    const container = this.scene.add
      .container(x, y)
      .setDepth(17)
      .setAlpha(0.42)
      .setRotation(profile.fullCircle ? 0 : profile.facingAngle);
    const bladeAngles = profile.fullCircle
      ? Array.from({ length: 8 }, (_, index) => (index * Math.PI) / 4)
      : [-Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2];
    for (const angle of bladeAngles) {
      const blade = this.scene.add
        .image(Math.cos(angle) * radius * 0.82, Math.sin(angle) * radius * 0.82, 'weapon-bone-scythe')
        .setDisplaySize(58, 58)
        .setRotation(angle + Math.PI / 2)
        .setAlpha(0.82);
      container.add(blade);
    }
    this.scene.tweens.add({
      targets: container,
      alpha: 0.06,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 1050,
      ease: 'Sine.Out',
    });
    return container;
  }
}
