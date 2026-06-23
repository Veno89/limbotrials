import Phaser from 'phaser';
import type { PlayerStats } from '../types/gameTypes';
import {
  magnetAttractionSpeed,
  PICKUP_COLLECTION_DISTANCE,
  pickupDisplaySize,
  vacuumMotionProfile,
  vacuumStartDelay,
} from './pickupAttractionRules';

interface PickupVacuumRuntime {
  startAt: number;
  seed: number;
}

interface PickupRuntime {
  xp: number;
  souls: number;
  displaySize: number;
  vacuum?: PickupVacuumRuntime;
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
        runtime.displaySize = pickupDisplaySize(runtime.xp + runtime.souls);
        target.setDisplaySize(runtime.displaySize, runtime.displaySize);
        return;
      }
    }
    const pickup = this.group.get(x, y, 'pickup-xp') as Phaser.Physics.Arcade.Image;
    pickup.setActive(true).setVisible(true).setAlpha(1);
    const body = pickup.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
    const displaySize = pickupDisplaySize(xp + souls);
    pickup.setDisplaySize(displaySize, displaySize).setDepth(14).setBlendMode(Phaser.BlendModes.ADD);
    this.pickups.set(pickup, { xp, souls, displaySize });
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
    const time = this.scene.time.now;
    for (const [pickup, runtime] of this.pickups) {
      if (!pickup.active) {
        this.pickups.delete(pickup);
        continue;
      }
      const distance = Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y);
      const body = pickup.body as Phaser.Physics.Arcade.Body;
      const angle = Phaser.Math.Angle.Between(pickup.x, pickup.y, this.player.x, this.player.y);
      if (runtime.vacuum && time >= runtime.vacuum.startAt) {
        const profile = vacuumMotionProfile(distance, time - runtime.vacuum.startAt, runtime.vacuum.seed);
        body.setVelocity(
          Math.cos(angle + profile.angleOffset) * profile.speed,
          Math.sin(angle + profile.angleOffset) * profile.speed,
        );
        pickup
          .setDisplaySize(runtime.displaySize * profile.scale, runtime.displaySize * profile.scale)
          .setRotation(pickup.rotation + 0.08);
      } else if (runtime.vacuum) {
        body.setVelocity(0, 0);
      } else if (distance < this.stats.pickupRadius) {
        const speed = magnetAttractionSpeed(distance, this.stats.pickupRadius);
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      } else {
        body.setVelocity(0, 0);
      }
      if (distance < PICKUP_COLLECTION_DISTANCE) {
        this.collect(pickup, runtime);
      }
    }
  }

  vacuumAll(): void {
    const ordered = [...this.pickups.entries()].sort(
      ([first], [second]) =>
        Phaser.Math.Distance.Squared(first.x, first.y, this.player.x, this.player.y) -
        Phaser.Math.Distance.Squared(second.x, second.y, this.player.x, this.player.y),
    );
    ordered.forEach(([pickup, runtime], index) => {
      if (runtime.vacuum) {
        return;
      }
      this.scene.tweens.killTweensOf(pickup);
      pickup.setDisplaySize(runtime.displaySize, runtime.displaySize);
      runtime.vacuum = {
        startAt: this.scene.time.now + vacuumStartDelay(index),
        seed: index * 0.73,
      };
    });
  }

  collectAllImmediately(): void {
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
    this.scene.tweens.killTweensOf(pickup);
    this.group.killAndHide(pickup);
  }
}
