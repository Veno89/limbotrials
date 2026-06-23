import Phaser from 'phaser';
import type { EnemyDefinition, WeaponId } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';

interface ActiveProcession {
  x: number;
  y: number;
  angle: number;
  radius: number;
  speed: number;
  travelled: number;
  maxDistance: number;
  weaponId: WeaponId;
  damageScale: number;
  hit: Set<Phaser.Physics.Arcade.Image>;
  visual: Phaser.GameObjects.Container;
}

type DamageEnemy = (
  sprite: Phaser.Physics.Arcade.Image,
  definition: EnemyDefinition,
  weaponId: WeaponId,
  damageScale: number,
) => void;

export class ScytheProcessionSystem {
  private readonly processions: ActiveProcession[] = [];
  private lastUpdateAt = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly enemies: EnemySystem,
    private readonly damageEnemy: DamageEnemy,
  ) {}

  spawn(
    x: number,
    y: number,
    angle: number,
    radius: number,
    weaponId: WeaponId,
    damageScale: number,
  ): void {
    this.processions.push({
      x,
      y,
      angle,
      radius,
      speed: 410,
      travelled: 0,
      maxDistance: Math.max(420, radius * 3.2),
      weaponId,
      damageScale,
      hit: new Set(),
      visual: this.createVisual(x, y, angle, radius),
    });
  }

  update(time: number): void {
    const deltaSeconds = this.lastUpdateAt > 0 ? Math.min(0.05, (time - this.lastUpdateAt) / 1000) : 0;
    this.lastUpdateAt = time;
    for (let index = this.processions.length - 1; index >= 0; index -= 1) {
      const procession = this.processions[index];
      if (!procession) {
        continue;
      }
      const movement = procession.speed * deltaSeconds;
      procession.x += Math.cos(procession.angle) * movement;
      procession.y += Math.sin(procession.angle) * movement;
      procession.travelled += movement;
      procession.visual
        .setPosition(procession.x, procession.y)
        .setRotation(procession.visual.rotation + deltaSeconds * 8.5);
      this.damageNearby(procession);
      if (procession.travelled >= procession.maxDistance) {
        procession.visual.destroy();
        this.processions.splice(index, 1);
      }
    }
  }

  private damageNearby(procession: ActiveProcession): void {
    const hitRadius = procession.radius * 0.62;
    this.enemies.forEach((enemy, definition) => {
      if (
        procession.hit.has(enemy) ||
        Phaser.Math.Distance.Between(procession.x, procession.y, enemy.x, enemy.y) >
          hitRadius + definition.radius * 0.35
      ) {
        return;
      }
      procession.hit.add(enemy);
      this.damageEnemy(enemy, definition, procession.weaponId, procession.damageScale);
    });
  }

  private createVisual(
    x: number,
    y: number,
    angle: number,
    radius: number,
  ): Phaser.GameObjects.Container {
    const root = this.scene.add.container(x, y).setDepth(30).setRotation(angle).setAlpha(0.96);
    const blade = this.scene.add
      .image(0, 0, 'weapon-bone-scythe')
      .setDisplaySize(Math.max(92, radius * 0.78), Math.max(92, radius * 0.78));
    const afterimage = this.scene.add
      .image(-16, 0, 'weapon-bone-scythe')
      .setDisplaySize(Math.max(80, radius * 0.68), Math.max(80, radius * 0.68))
      .setAlpha(0.24);
    root.add([afterimage, blade]);
    this.scene.tweens.add({
      targets: root,
      alpha: 0.42,
      yoyo: true,
      repeat: -1,
      duration: 180,
      ease: 'Sine.InOut',
    });
    return root;
  }
}
