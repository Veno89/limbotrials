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
  visualPreset?: 'burning-ground' | 'poison-pool';
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
  visualSprites?: Phaser.GameObjects.Image[];
  vaporTimer?: Phaser.Time.TimerEvent;
}

export class HazardZoneSystem {
  private readonly zones: HazardZoneRuntime[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly enemies: EnemySystem,
    private readonly statuses: StatusEffectSystem,
    private readonly damageEnemy: DamageEnemy,
  ) {
    if (!this.scene.textures.exists('vapor-puff')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 8);
      g.generateTexture('vapor-puff', 16, 16);
      g.destroy();
    }
  }

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
    
    let visualSprites: Phaser.GameObjects.Image[] | undefined;
    let vaporTimer: Phaser.Time.TimerEvent | undefined;
    if (profile.visualPreset === 'burning-ground') {
      visualSprites = [];
      // Scale count somewhat by radius, min 6, max 16
      const count = Phaser.Math.Clamp(Math.floor(profile.radius / 15), 6, 16);
      for (let i = 0; i < count; i++) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = profile.radius * Math.sqrt(Phaser.Math.FloatBetween(0, 1));
        const fireX = x + Math.cos(angle) * distance;
        const fireY = y + Math.sin(angle) * distance;
        
        const fireSprite = this.scene.add.image(fireX, fireY, 'status-burn')
          .setDepth(18)
          .setAlpha(Phaser.Math.FloatBetween(0.55, 0.9))
          .setScale(Phaser.Math.FloatBetween(0.25, 0.65))
          .setBlendMode(Phaser.BlendModes.ADD)
          .setRotation(Phaser.Math.FloatBetween(-0.2, 0.2));
          
        this.scene.tweens.add({
          targets: fireSprite,
          alpha: fireSprite.alpha * 0.6,
          scaleX: fireSprite.scaleX * 1.2,
          scaleY: fireSprite.scaleY * 1.2,
          yoyo: true,
          repeat: -1,
          duration: Phaser.Math.Between(300, 700),
          ease: 'Sine.InOut',
        });
        
        visualSprites.push(fireSprite);
      }
    } else if (profile.visualPreset === 'poison-pool') {
      visualSprites = [];
      const poolBase = this.scene.add.image(x, y, 'poison-ooze')
        .setDepth(16)
        .setAlpha(0.65)
        .setDisplaySize(profile.radius * 2, profile.radius * 2)
        .setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
      
      this.scene.tweens.add({
        targets: poolBase,
        scaleX: poolBase.scaleX * 1.05,
        scaleY: poolBase.scaleY * 1.05,
        alpha: 0.8,
        yoyo: true,
        repeat: -1,
        duration: 1200,
        ease: 'Sine.InOut',
      });
      
      visualSprites.push(poolBase);
      
      const emitVapor = () => {
        const activeVapors = visualSprites!.filter(s => s.active && s !== poolBase);
        if (activeVapors.length > 10) return;
        
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = profile.radius * Math.sqrt(Phaser.Math.FloatBetween(0, 1));
        const vX = x + Math.cos(angle) * distance;
        const vY = y + Math.sin(angle) * distance;
        
        const vapor = this.scene.add.image(vX, vY, 'vapor-puff')
          .setDepth(18)
          .setAlpha(Phaser.Math.FloatBetween(0.15, 0.45))
          .setScale(Phaser.Math.FloatBetween(0.3, 0.8))
          .setTint(0x7fff00);
          
        this.scene.tweens.add({
          targets: vapor,
          y: vY - Phaser.Math.FloatBetween(20, 60),
          alpha: 0,
          scaleX: vapor.scaleX * 1.5,
          scaleY: vapor.scaleY * 1.5,
          duration: Phaser.Math.Between(700, 1400),
          ease: 'Sine.Out',
          onComplete: () => {
            if (vapor.active) {
              const idx = visualSprites!.indexOf(vapor);
              if (idx > -1) visualSprites!.splice(idx, 1);
              vapor.destroy();
            }
          }
        });
        
        visualSprites!.push(vapor);
      };
      
      for (let i = 0; i < 4; i++) emitVapor();
      
      vaporTimer = this.scene.time.addEvent({
        delay: Phaser.Math.Between(250, 400),
        loop: true,
        callback: emitVapor,
      });
    }
    
    this.zones.push({
      x,
      y,
      weaponId,
      profile,
      nextTickAt: this.scene.time.now + profile.tickIntervalMs,
      expiresAt: this.scene.time.now + profile.durationMs,
      pool,
      sprite,
      visualSprites,
      vaporTimer,
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
    if (zone.vaporTimer) {
      zone.vaporTimer.remove();
    }
    if (zone.visualSprites) {
      for (const sprite of zone.visualSprites) {
        this.scene.tweens.killTweensOf(sprite);
        sprite.destroy();
      }
    }
  }
  
  public destroy(): void {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      this.destroyZone(i);
    }
  }
}
