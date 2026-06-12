import Phaser from 'phaser';
import type { PlayerStats } from '../types/gameTypes';

interface PickupRuntime {
  xp: number;
  souls: number;
}

export const MAX_SOUL_PICKUPS = 90;

export class PickupSystem {
  private readonly group: Phaser.Physics.Arcade.Group;
  private readonly pickups = new Map<Phaser.Physics.Arcade.Image, PickupRuntime>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly stats: PlayerStats,
    private readonly onCollect: (xp: number, souls: number) => void,
  ) {
    this.group = scene.physics.add.group();
  }

  spawn(x: number, y: number, xp: number, souls: number): void {
    if (this.pickups.size >= MAX_SOUL_PICKUPS) {
      const target = this.findNearestPickup(x, y);
      if (target) {
        const runtime = this.pickups.get(target)!;
        runtime.xp += xp;
        runtime.souls += souls;
        const size = Math.min(30, 18 + Math.log2(runtime.xp + runtime.souls + 1) * 2);
        target.setDisplaySize(size, size);
        return;
      }
    }
    const pickup = this.group.create(x, y, 'soul') as Phaser.Physics.Arcade.Image;
    pickup.setDisplaySize(18, 18).setDepth(14).setBlendMode(Phaser.BlendModes.ADD);
    this.pickups.set(pickup, { xp, souls });
    this.scene.tweens.add({
      targets: pickup,
      scaleX: pickup.scaleX * 1.2,
      scaleY: pickup.scaleY * 1.2,
      yoyo: true,
      repeat: -1,
      duration: 420,
      ease: 'Sine.InOut',
    });
  }

  update(): void {
    for (const [pickup, runtime] of this.pickups) {
      if (!pickup.active) {
        this.pickups.delete(pickup);
        continue;
      }
      const distance = Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y);
      const body = pickup.body as Phaser.Physics.Arcade.Body;
      if (distance < this.stats.pickupRadius) {
        const angle = Phaser.Math.Angle.Between(pickup.x, pickup.y, this.player.x, this.player.y);
        const speed = 190 + (1 - distance / this.stats.pickupRadius) * 420;
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      } else {
        body.setVelocity(0, 0);
      }
      if (distance < 26) {
        this.collect(pickup, runtime);
      }
    }
  }

  collectAll(): void {
    for (const [pickup, runtime] of [...this.pickups]) {
      this.collect(pickup, runtime);
    }
  }

  count(): number {
    return this.pickups.size;
  }

  private findNearestPickup(x: number, y: number): Phaser.Physics.Arcade.Image | undefined {
    let nearest: Phaser.Physics.Arcade.Image | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const pickup of this.pickups.keys()) {
      const distance = Phaser.Math.Distance.Squared(x, y, pickup.x, pickup.y);
      if (distance < nearestDistance) {
        nearest = pickup;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  private collect(pickup: Phaser.Physics.Arcade.Image, runtime: PickupRuntime): void {
    this.onCollect(runtime.xp, runtime.souls);
    this.pickups.delete(pickup);
    pickup.destroy();
  }
}
