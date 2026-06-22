import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig';
import { ARENA_HEIGHT, ARENA_WIDTH, COLORS } from '../constants';
import type { JuiceSystem } from './JuiceSystem';
import {
  scheduleNextShopCheck,
  shouldSpawnShop,
} from './shopRules';

interface ShopRuntime {
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  expiresAt: number;
  requiresExit: boolean;
}

export interface ShopObjective {
  angle: number;
  distance: number;
  remainingMs: number;
}

export interface ShopSystemEvents {
  onSpawn?: () => void;
  onOpen?: () => boolean;
  onExpire?: () => void;
}

export class ShopSystem {
  private active?: ShopRuntime;
  private currentElapsedMs = 0;
  private nextCheckAt = scheduleNextShopCheck(
    0,
    Phaser.Math.Between(BALANCE.firstShopCheckDelayMs.min, BALANCE.firstShopCheckDelayMs.max),
  );

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly juice: JuiceSystem,
    private readonly events: ShopSystemEvents,
  ) {}

  update(elapsedMs: number): void {
    this.currentElapsedMs = elapsedMs;
    if (!this.active && elapsedMs >= this.nextCheckAt) {
      this.nextCheckAt = scheduleNextShopCheck(
        elapsedMs,
        Phaser.Math.Between(BALANCE.shopCheckDelayMs.min, BALANCE.shopCheckDelayMs.max),
      );
      if (shouldSpawnShop(Math.random(), BALANCE.shopSpawnChance)) {
        this.spawnNow(elapsedMs);
      }
    }

    const shop = this.active;
    if (!shop) {
      return;
    }
    if (!shop.sprite.active) {
      this.active = undefined;
      return;
    }

    const distance = Phaser.Math.Distance.Between(shop.sprite.x, shop.sprite.y, this.player.x, this.player.y);
    if (distance > 105) {
      shop.requiresExit = false;
    }
    if (distance < 78 && !shop.requiresExit) {
      shop.requiresExit = Boolean(this.events.onOpen?.());
    }
    if (elapsedMs >= shop.expiresAt) {
      this.expire(shop);
    }
  }

  spawnNow(elapsedMs = this.currentElapsedMs): boolean {
    if (this.active) {
      return false;
    }
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(BALANCE.shopMinPlayerDistance, BALANCE.shopMaxPlayerDistance);
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 110, ARENA_WIDTH - 110);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 100, ARENA_HEIGHT - 100);
    const shadow = this.scene.add.ellipse(x, y + 45, 130, 34, 0x010203, 0.62).setDepth(14);
    const sprite = this.scene.add.image(x, y, 'shop-building').setDisplaySize(148, 136).setDepth(16);
    const label = this.scene.add
      .text(x, y - 84, 'BLOOD MARKET', {
        fontFamily: 'Cinzel, serif',
        fontSize: '13px',
        color: '#e1b1a5',
        stroke: '#020405',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(17);
    sprite.setData('shop-shadow', shadow);
    this.scene.tweens.add({
      targets: [sprite, label],
      y: '-=4',
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.InOut',
    });
    this.juice.ring(x, y, 92, COLORS.blood, 760);
    this.active = {
      sprite,
      label,
      expiresAt: elapsedMs + BALANCE.shopLifetimeMs,
      requiresExit: false,
    };
    this.events.onSpawn?.();
    return true;
  }

  getObjective(elapsedMs = this.currentElapsedMs): ShopObjective | undefined {
    const shop = this.active;
    return shop
      ? {
          angle: Phaser.Math.Angle.Between(this.player.x, this.player.y, shop.sprite.x, shop.sprite.y),
          distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, shop.sprite.x, shop.sprite.y),
          remainingMs: Math.max(0, shop.expiresAt - elapsedMs),
        }
      : undefined;
  }

  clear(): void {
    if (this.active) {
      this.destroy(this.active);
      this.active = undefined;
    }
  }

  private expire(shop: ShopRuntime): void {
    this.events.onExpire?.();
    this.scene.tweens.add({
      targets: [shop.sprite, shop.label, shop.sprite.getData('shop-shadow')],
      alpha: 0,
      duration: 500,
      onComplete: () => this.destroy(shop),
    });
    this.active = undefined;
  }

  private destroy(shop: ShopRuntime): void {
    this.scene.tweens.killTweensOf(shop.sprite);
    this.scene.tweens.killTweensOf(shop.label);
    const shadow = shop.sprite.getData('shop-shadow') as Phaser.GameObjects.Ellipse | undefined;
    shadow?.destroy();
    shop.sprite.destroy();
    shop.label.destroy();
  }
}
