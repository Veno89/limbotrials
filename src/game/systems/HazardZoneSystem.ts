import Phaser from 'phaser';
import type { EnemyDefinition, StatusEffectId, WeaponId } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';
import type { StatusEffectSystem } from './StatusEffectSystem';

type DamageEnemy = (
  sprite: Phaser.Physics.Arcade.Image,
  definition: EnemyDefinition,
  weaponId: WeaponId,
  damageScale: number,
) => { killed: boolean };

export interface HazardZoneProfile {
  radius: number;
  durationMs: number;
  tickIntervalMs: number;
  damageScale: number;
  color: number;
  strokeColor: number;
  texture?: string;
  statusEffect?: {
    id: StatusEffectId;
    damagePerTick: number;
  };
  proximityTrigger?: boolean;
}

interface HazardZoneRuntime {
  x: number;
  y: number;
  weaponId: WeaponId;
  profile: HazardZoneProfile;
  nextTickAt: number;
  expiresAt: number;
  pool: Phaser.GameObjects.Arc;
  sprite?: Phaser.GameObjects.Image;
}

export class HazardZoneSystem {
  private readonly zones: HazardZoneRuntime[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly enemies: EnemySystem,
    private readonly statuses: StatusEffectSystem,
    private readonly damageEnemy: DamageEnemy,
  ) {}

  spawn(x: number, y: number, weaponId: WeaponId, profile: HazardZoneProfile): void {
    const pool = this.scene.add
      .circle(x, y, profile.radius, profile.color, 0.22)
      .setStrokeStyle(2, profile.strokeColor, 0.72)
      .setDepth(17)
      .setBlendMode(Phaser.BlendModes.ADD);
      
    let sprite: Phaser.GameObjects.Image | undefined;
    if (profile.texture) {
      sprite = this.scene.add
        .image(x, y, profile.texture)
        .setDisplaySize(20, 20)
        .setAlpha(0.72)
        .setDepth(18);
    }
    
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
    
    this.zones.push({
      x,
      y,
      weaponId,
      profile,
      nextTickAt: this.scene.time.now + profile.tickIntervalMs,
      expiresAt: this.scene.time.now + profile.durationMs,
      pool,
      sprite,
    });
  }

  update(time: number): void {
    for (let index = this.zones.length - 1; index >= 0; index -= 1) {
      const zone = this.zones[index]!;
      if (time >= zone.expiresAt) {
        this.destroyZone(index);
        continue;
      }
      
      if (zone.profile.proximityTrigger) {
        const candidates = this.enemies.grid.getNearby(zone.x, zone.y, zone.profile.radius, undefined);
        let triggered = false;
        for (const entity of candidates) {
          const enemy = entity.sprite;
          const definition = entity.definition;
          if (
            Phaser.Math.Distance.Between(zone.x, zone.y, enemy.x, enemy.y) <=
            zone.profile.radius + definition.radius * 0.45
          ) {
            triggered = true;
            break;
          }
        }
        
        if (triggered) {
          this.tick(zone); // Damage all in radius and apply statuses
          this.destroyZone(index); // Destroy trap
          continue;
        }
      } else {
        while (time >= zone.nextTickAt) {
          this.tick(zone);
          zone.nextTickAt += zone.profile.tickIntervalMs;
        }
      }
    }
  }

  private tick(zone: HazardZoneRuntime): void {
    this.enemies.forEach((enemy, definition) => {
      if (
        Phaser.Math.Distance.Between(zone.x, zone.y, enemy.x, enemy.y) >
        zone.profile.radius + definition.radius * 0.45
      ) {
        return;
      }
      const result = this.damageEnemy(enemy, definition, zone.weaponId, zone.profile.damageScale);
      if (!result.killed && enemy.active) {
        if (zone.profile.statusEffect) {
          this.statuses.applyToEnemy(enemy, zone.profile.statusEffect.id, {
            sourceWeaponId: zone.weaponId,
            damagePerTick: zone.profile.statusEffect.damagePerTick,
          });
        }
        if (zone.weaponId === 'spike-trap') {
          this.statuses.applyToEnemy(enemy, 'slow', { sourceWeaponId: zone.weaponId, damagePerTick: 0 });
        }
      }
    });
  }

  private destroyZone(index: number): void {
    const [zone] = this.zones.splice(index, 1);
    if (!zone) {
      return;
    }
    zone.pool.destroy();
    if (zone.sprite) {
      zone.sprite.destroy();
    }
  }
}
