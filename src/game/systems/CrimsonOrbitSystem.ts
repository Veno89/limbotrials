import Phaser from 'phaser';
import type { EnemyDefinition, WeaponRuntimeState } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';
import { calculateCrimsonOrbit } from './crimsonOrbitRules';

export type CrimsonOrbitDamageEnemy = (
  sprite: Phaser.Physics.Arcade.Image,
  definition: EnemyDefinition,
  damageScale: number,
) => { killed: boolean };

interface CrimsonOrbitVisual {
  axe: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Arc;
}

export class CrimsonOrbitSystem {
  private readonly axes: CrimsonOrbitVisual[] = [];
  private readonly hitReadyAt = new Map<Phaser.Physics.Arcade.Image, number>();
  private angle = 0;
  private lastUpdateAt?: number;
  private nextCleanupAt = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly enemies: EnemySystem,
  ) {}

  update(
    time: number,
    state: WeaponRuntimeState | undefined,
    attackSpeedMultiplier: number,
    damageEnemy: CrimsonOrbitDamageEnemy,
  ): void {
    if (!state) {
      this.deactivate();
      return;
    }

    const profile = calculateCrimsonOrbit(state.stats, attackSpeedMultiplier);
    this.syncAxes(profile.axeCount);
    const delta = this.lastUpdateAt === undefined ? 0 : Phaser.Math.Clamp(time - this.lastUpdateAt, 0, 50);
    this.lastUpdateAt = time;
    this.angle = (this.angle + profile.angularSpeed * delta) % (Math.PI * 2);

    for (let index = 0; index < this.axes.length; index += 1) {
      const visual = this.axes[index]!;
      const angle = this.angle + (index / this.axes.length) * Math.PI * 2;
      const x = this.player.x + Math.cos(angle) * profile.radius;
      const y = this.player.y + Math.sin(angle) * profile.radius;
      visual.glow
        .setPosition(x, y)
        .setDisplaySize(profile.axeSize * 1.45, profile.axeSize * 1.45)
        .setAlpha(0.13 + Math.sin(time * 0.008 + index * Math.PI) * 0.035);
      visual.axe
        .setPosition(
          x,
          y,
        )
        .setDisplaySize(profile.axeSize, profile.axeSize)
        .setRotation(angle + this.angle * 1.8 + Math.PI / 2);
    }

    this.enemies.forEach((enemy, definition) => {
      if (time < (this.hitReadyAt.get(enemy) ?? 0)) {
        return;
      }
      const struck = this.axes.some(
        ({ axe }) =>
          Phaser.Math.Distance.Between(axe.x, axe.y, enemy.x, enemy.y) <=
          profile.collisionRadius + definition.radius,
      );
      if (!struck) {
        return;
      }
      this.hitReadyAt.set(enemy, time + profile.hitCooldownMs);
      if (damageEnemy(enemy, definition, profile.damageScale).killed) {
        this.hitReadyAt.delete(enemy);
      }
    });

    if (time >= this.nextCleanupAt) {
      this.nextCleanupAt = time + 1000;
      for (const enemy of this.hitReadyAt.keys()) {
        if (!enemy.active) {
          this.hitReadyAt.delete(enemy);
        }
      }
    }
  }

  private syncAxes(count: number): void {
    while (this.axes.length < count) {
      const glow = this.scene.add
        .circle(this.player.x, this.player.y, 30, 0xa52d35, 0.14)
        .setDepth(33)
        .setBlendMode(Phaser.BlendModes.ADD);
      const axe = this.scene.add
        .image(this.player.x, this.player.y, 'weapon-bloodletter-axe')
        .setDepth(34)
        .setAlpha(0.98)
        .setTint(0xffd2d2);
      this.axes.push({ axe, glow });
    }
    while (this.axes.length > count) {
      const visual = this.axes.pop();
      visual?.axe.destroy();
      visual?.glow.destroy();
    }
  }

  private deactivate(): void {
    for (const visual of this.axes) {
      visual.axe.destroy();
      visual.glow.destroy();
    }
    this.axes.length = 0;
    this.hitReadyAt.clear();
    this.lastUpdateAt = undefined;
  }
}
