import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';
import { ARENA_HEIGHT, ARENA_WIDTH, COLORS } from '../constants';
import type { JuiceSystem } from './JuiceSystem';
import { canSpawnChest, scheduleNextChestSpawn, shouldDespawnChest } from './chestRules';

interface ChestRuntime {
  sprite: Phaser.Physics.Arcade.Image;
  expiresAt: number;
}

export interface ChestObjective {
  angle: number;
  distance: number;
  remainingMs: number;
}

export interface ChestSystemEvents {
  onSpawn?: () => void;
  onOpen?: () => void;
  onExpire?: () => void;
}

export class ChestSystem {
  private readonly chests = new Set<ChestRuntime>();
  private currentElapsedMs = 0;
  private nextSpawnTime = scheduleNextChestSpawn(
    0,
    Phaser.Math.Between(BALANCE.firstChestSpawnDelayMs.min, BALANCE.firstChestSpawnDelayMs.max),
  );

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly juice: JuiceSystem,
    private readonly onOpenChest: (x: number, y: number) => void,
    private readonly events: ChestSystemEvents = {},
  ) {}

  update(elapsedMs: number): void {
    this.currentElapsedMs = elapsedMs;
    if (elapsedMs >= this.nextSpawnTime) {
      this.nextSpawnTime = scheduleNextChestSpawn(
        elapsedMs,
        Phaser.Math.Between(BALANCE.chestSpawnDelayMs.min, BALANCE.chestSpawnDelayMs.max),
      );
      this.spawnChest(elapsedMs);
    }

    const expired: ChestRuntime[] = [];
    for (const chest of this.chests) {
      if (!chest.sprite.active) {
        expired.push(chest);
        continue;
      }

      const distance = Phaser.Math.Distance.Between(chest.sprite.x, chest.sprite.y, this.player.x, this.player.y);

      if (distance < 36) {
        this.openChest(chest);
        expired.push(chest);
        continue;
      }

      if (shouldDespawnChest(elapsedMs, chest.expiresAt)) {
        this.scene.tweens.add({
          targets: chest.sprite,
          alpha: 0,
          duration: 500,
          onComplete: () => this.destroyChest(chest),
        });
        this.events.onExpire?.();
        expired.push(chest);
      }
    }

    for (const chest of expired) {
      this.chests.delete(chest);
    }
  }

  spawnNow(elapsedMs = this.currentElapsedMs): boolean {
    if (!canSpawnChest(this.chests.size)) {
      return false;
    }

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(BALANCE.chestMinPlayerDistance, BALANCE.chestMaxPlayerDistance);
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 90, ARENA_WIDTH - 90);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 90, ARENA_HEIGHT - 90);

    const sprite = this.scene.physics.add.image(x, y, 'reliquary-chest') as Phaser.Physics.Arcade.Image;
    sprite.setDisplaySize(68, 58).setDepth(16);
    this.scene.tweens.add({
      targets: sprite,
      scaleX: sprite.scaleX * 1.07,
      scaleY: sprite.scaleY * 1.07,
      yoyo: true,
      repeat: -1,
      duration: 850,
      ease: 'Sine.InOut',
    });
    this.juice.ring(x, y, 68, COLORS.gold, 700);

    this.chests.add({
      sprite,
      expiresAt: elapsedMs + BALANCE.chestLifetimeMs,
    });
    this.events.onSpawn?.();
    return true;
  }

  private openChest(chest: ChestRuntime): void {
    const { x, y } = chest.sprite;
    this.juice.ring(chest.sprite.x, chest.sprite.y, 74, COLORS.gold, 400);
    this.juice.heavyImpact();

    this.animateOpen(chest);
    this.events.onOpen?.();
    this.onOpenChest(x, y);
  }

  clearAll(): void {
    for (const chest of this.chests) {
      this.destroyChest(chest);
    }
    this.chests.clear();
  }

  openNearest(): boolean {
    const chest = this.getNearestChest();
    if (!chest) {
      return false;
    }
    this.chests.delete(chest);
    this.openChest(chest);
    return true;
  }

  getObjective(elapsedMs = this.currentElapsedMs): ChestObjective | undefined {
    const chest = this.getNearestChest();
    return chest
      ? {
          angle: Phaser.Math.Angle.Between(this.player.x, this.player.y, chest.sprite.x, chest.sprite.y),
          distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, chest.sprite.x, chest.sprite.y),
          remainingMs: Math.max(0, chest.expiresAt - elapsedMs),
        }
      : undefined;
  }

  count(): number {
    return this.chests.size;
  }

  private spawnChest(time: number): void {
    this.spawnNow(time);
  }

  private getNearestChest(): ChestRuntime | undefined {
    return [...this.chests]
      .filter((chest) => chest.sprite.active)
      .sort(
        (left, right) =>
          Phaser.Math.Distance.Squared(this.player.x, this.player.y, left.sprite.x, left.sprite.y) -
          Phaser.Math.Distance.Squared(this.player.x, this.player.y, right.sprite.x, right.sprite.y),
      )[0];
  }

  private destroyChest(chest: ChestRuntime): void {
    this.scene.tweens.killTweensOf(chest.sprite);
    chest.sprite.destroy();
  }

  private animateOpen(chest: ChestRuntime): void {
    this.scene.tweens.killTweensOf(chest.sprite);
    chest.sprite.setTint(0xdaf7ff);
    this.scene.tweens.add({
      targets: chest.sprite,
      angle: 4,
      x: chest.sprite.x + 4,
      yoyo: true,
      repeat: 2,
      duration: 55,
      onComplete: () => {
        this.scene.tweens.add({
          targets: chest.sprite,
          y: chest.sprite.y - 14,
          scaleX: chest.sprite.scaleX * 1.12,
          scaleY: chest.sprite.scaleY * 0.35,
          alpha: 0,
          duration: 260,
          ease: 'Cubic.In',
          onComplete: () => this.destroyChest(chest),
        });
      },
    });
  }
}
