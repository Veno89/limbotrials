import Phaser from 'phaser';
import { COLORS } from '../constants';
import type { JuiceSystem } from '../systems/JuiceSystem';
import { lootArcPoint, type Point } from './lootRevealMath';

export interface LootReveal {
  texture: string;
  label: string;
  color: number;
}

export class LootRevealSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly juice: JuiceSystem,
  ) {}

  reveal(x: number, y: number, reward: LootReveal): void {
    const start = { x, y: y - 12 };
    const trail = this.scene.add.graphics().setDepth(74);
    const back = this.scene.add
      .circle(0, 0, 27, 0x05090c, 0.92)
      .setStrokeStyle(2, reward.color, 0.9);
    const icon = this.scene.add.image(0, 0, reward.texture).setDisplaySize(34, 34);
    const orbit = this.createOrbit(reward.color);
    const root = this.scene.add.container(start.x, start.y, [back, icon, orbit]).setDepth(76).setScale(0.3);
    const trailPoints: Point[] = [start];
    const progress = { value: 0 };

    this.burstSoulLock(x, y, reward.color);
    this.scene.tweens.add({
      targets: root,
      scale: 1,
      duration: 180,
      ease: 'Back.Out',
    });
    this.scene.tweens.add({
      targets: progress,
      value: 1,
      delay: 140,
      duration: 780,
      ease: 'Cubic.InOut',
      onUpdate: () => {
        const target = { x: this.player.x, y: this.player.y - 6 };
        const point = lootArcPoint(start, target, progress.value);
        root.setPosition(point.x, point.y);
        orbit.rotation = progress.value * Math.PI * 5;
        root.setScale(0.8 + Math.sin(progress.value * Math.PI) * 0.35);
        trailPoints.push(point);
        if (trailPoints.length > 13) {
          trailPoints.shift();
        }
        this.drawTrail(trail, trailPoints, reward.color);
      },
      onComplete: () => {
        trail.destroy();
        root.destroy();
        this.juice.ring(this.player.x, this.player.y, 68, reward.color, 320);
        this.showReceipt(reward);
      },
    });
  }

  private createOrbit(color: number): Phaser.GameObjects.Container {
    const shards = [0, 1, 2].map((index) => {
      const angle = (index / 3) * Math.PI * 2;
      return this.scene.add
        .rectangle(Math.cos(angle) * 34, Math.sin(angle) * 34, 7, 7, index === 0 ? COLORS.gold : color, 0.95)
        .setRotation(Math.PI / 4);
    });
    return this.scene.add.container(0, 0, shards);
  }

  private burstSoulLock(x: number, y: number, color: number): void {
    this.juice.ring(x, y, 78, COLORS.gold, 420);
    this.juice.ring(x, y, 54, color, 300);
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      const shard = this.scene.add
        .rectangle(x, y, 8, 8, index % 2 === 0 ? COLORS.gold : color, 0.95)
        .setRotation(Math.PI / 4)
        .setDepth(75);
      this.scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * 62,
        y: y + Math.sin(angle) * 62,
        angle: 180,
        alpha: 0,
        scale: 0.25,
        duration: 480,
        ease: 'Cubic.Out',
        onComplete: () => shard.destroy(),
      });
    }
  }

  private drawTrail(graphics: Phaser.GameObjects.Graphics, points: Point[], color: number): void {
    graphics.clear();
    if (points.length < 2) {
      return;
    }
    graphics.lineStyle(7, color, 0.12);
    graphics.beginPath();
    graphics.moveTo(points[0]!.x, points[0]!.y);
    for (const point of points.slice(1)) {
      graphics.lineTo(point.x, point.y);
    }
    graphics.strokePath();
    graphics.lineStyle(2, 0xdaf7ff, 0.75);
    graphics.beginPath();
    graphics.moveTo(points[0]!.x, points[0]!.y);
    for (const point of points.slice(1)) {
      graphics.lineTo(point.x, point.y);
    }
    graphics.strokePath();
  }

  private showReceipt(reward: LootReveal): void {
    const receipt = this.scene.add
      .text(this.player.x, this.player.y - 70, reward.label.toUpperCase(), {
        fontFamily: 'Cinzel, serif',
        fontSize: '14px',
        color: '#eef7fa',
        stroke: '#020405',
        strokeThickness: 5,
        backgroundColor: '#071014cc',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(78);
    this.scene.tweens.add({
      targets: receipt,
      y: receipt.y - 30,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.Out',
      onComplete: () => receipt.destroy(),
    });
  }
}
