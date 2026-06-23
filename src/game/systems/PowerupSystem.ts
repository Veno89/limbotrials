import Phaser from 'phaser';
import { COLORS } from '../constants';
import {
  canSpawnRandomPowerup,
  FIRST_RANDOM_POWERUP_AT_MS,
  POWERUPS,
  RANDOM_POWERUP_COOLDOWN_MS,
} from '../data/powerups';
import type { JuiceSystem } from './JuiceSystem';
import type { PickupSystem } from './PickupSystem';
import type { RunState } from './RunState';
import type { PowerupId } from '../types/gameTypes';

export interface ActiveBuffStatus {
  id: string;
  label: string;
  color: number;
  remainingMs: number;
  durationMs: number;
}

export class PowerupSystem {
  private readonly pickups = new Map<Phaser.GameObjects.Image, PowerupId>();
  private frenzyUntil = 0;
  private nextRandomDropAtMs = FIRST_RANDOM_POWERUP_AT_MS;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly run: RunState,
    private readonly souls: PickupSystem,
    private readonly juice: JuiceSystem,
    private readonly onPowerupApplied: (id: PowerupId) => void = () => undefined,
  ) {}

  trySpawn(x: number, y: number, guaranteed = false): void {
    if (!guaranteed) {
      if (!canSpawnRandomPowerup(this.run.elapsedMs, this.nextRandomDropAtMs, Math.random())) {
        return;
      }
      this.nextRandomDropAtMs = this.run.elapsedMs + RANDOM_POWERUP_COOLDOWN_MS;
    }
    const ids: readonly PowerupId[] = ['mending-soul', 'soul-vacuum', 'grave-frenzy'];
    const id = ids[Math.floor(Math.random() * ids.length)]!;
    if (id === 'mending-soul' && this.run.edicts.includes('scarcity') && Math.random() < 0.5) {
      return;
    }
    const definition = POWERUPS[id];
    this.run.balance.recordPowerupSpawn(id);
    const pickup = this.scene.add
      .image(x, y, definition.texture)
      .setDisplaySize(34, 34)
      .setDepth(31)
      .setTint(definition.color)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.pickups.set(pickup, id);
    this.scene.tweens.add({
      targets: pickup,
      scaleX: pickup.scaleX * 1.22,
      scaleY: pickup.scaleY * 1.22,
      yoyo: true,
      repeat: -1,
      duration: 360,
      ease: 'Sine.InOut',
    });
  }

  update(): void {
    for (const [pickup, id] of this.pickups) {
      if (!pickup.active) {
        this.pickups.delete(pickup);
        continue;
      }
      if (Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y) < 34) {
        this.collect(pickup, id);
      }
    }
  }

  attackSpeedMultiplier(): number {
    return this.run.elapsedMs < this.frenzyUntil ? 1.35 : 1;
  }

  critChanceBonus(): number {
    return this.run.elapsedMs < this.frenzyUntil ? 0.12 : 0;
  }

  getActiveBuffs(): ActiveBuffStatus[] {
    const definition = POWERUPS['grave-frenzy'];
    return this.run.elapsedMs < this.frenzyUntil
      ? [{
          id: definition.id,
          label: definition.name.toUpperCase(),
          color: definition.color,
          remainingMs: this.frenzyUntil - this.run.elapsedMs,
          durationMs: definition.durationMs!,
        }]
      : [];
  }

  grantNow(id: PowerupId): void {
    this.apply(id);
  }

  private collect(pickup: Phaser.GameObjects.Image, id: PowerupId): void {
    this.pickups.delete(pickup);
    pickup.destroy();
    this.run.balance.recordPowerupCollected(id, this.run.elapsedMs);
    this.apply(id);
    this.juice.ring(this.player.x, this.player.y, 88, COLORS.pale, 300);
  }

  private apply(id: PowerupId): void {
    const definition = POWERUPS[id];
    this.onPowerupApplied(id);
    if (id === 'mending-soul') {
      const healed = Math.round(this.run.resources.heal(25));
      this.juice.warning(`${definition.name.toUpperCase()}: RESTORED ${healed} HP`, '#92e6b1');
    } else if (id === 'soul-vacuum') {
      this.souls.vacuumAll();
      this.juice.warning(`${definition.name.toUpperCase()}: ${definition.pickupMessage.toUpperCase()}`, '#69d9ff');
    } else {
      this.frenzyUntil = Math.max(this.frenzyUntil, this.run.elapsedMs) + definition.durationMs!;
      this.juice.warning(
        `${definition.name.toUpperCase()}: ${definition.pickupMessage.toUpperCase()}`,
        '#f07b35',
      );
    }
  }
}
