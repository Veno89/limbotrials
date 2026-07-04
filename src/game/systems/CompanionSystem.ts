import Phaser from 'phaser';
import type { EnemySystem } from './EnemySystem';
import type { RunState } from './RunState';
import type { JuiceSystem } from './JuiceSystem';

interface CompanionRuntime {
  sprite: Phaser.Physics.Arcade.Image;
  expiresAt: number;
  nextAttackAt: number;
}

export class CompanionSystem {
  private readonly skeletons: CompanionRuntime[] = [];
  private readonly group: Phaser.Physics.Arcade.Group;
  
  private skullSprite?: Phaser.Physics.Arcade.Image;
  private nextSummonAt = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly enemies: EnemySystem,
    private readonly run: RunState,
    private readonly juice: JuiceSystem,
  ) {
    this.group = this.scene.physics.add.group();
  }

  update(time: number): void {
    if (this.run.artifacts.hasEffect('necromancer-skull-companion')) {
      if (!this.skullSprite) {
        this.skullSprite = this.group.create(this.player.x, this.player.y, 'projectile-orb') as Phaser.Physics.Arcade.Image;
        this.skullSprite.setDisplaySize(24, 24).setDepth(32).setTint(0xbd93f9);
        this.scene.tweens.add({
          targets: this.skullSprite,
          y: '-=8',
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut'
        });
      }

      // Float near player
      const targetX = this.player.x - 30;
      const targetY = this.player.y - 40;
      this.skullSprite.x = Phaser.Math.Linear(this.skullSprite.x, targetX, 0.05);
      this.skullSprite.y = Phaser.Math.Linear(this.skullSprite.y, targetY, 0.05);

      if (time >= this.nextSummonAt && this.skeletons.length < 3) {
        this.nextSummonAt = time + 4000;
        this.juice.ring(this.skullSprite.x, this.skullSprite.y, 24, 0xbd93f9, 200);
        
        const skeleton = this.group.create(this.skullSprite.x, this.skullSprite.y, 'enemy-limbo-knight') as Phaser.Physics.Arcade.Image;
        skeleton.setDisplaySize(48, 48).setDepth(20).setTint(0x9d72db); // friendly purple tint
        
        this.skeletons.push({
          sprite: skeleton,
          expiresAt: time + 10000, // 10 seconds lifetime
          nextAttackAt: 0,
        });
      }
    }

    for (let i = this.skeletons.length - 1; i >= 0; i--) {
      const skeleton = this.skeletons[i]!;
      if (time >= skeleton.expiresAt) {
        skeleton.sprite.destroy();
        this.skeletons.splice(i, 1);
        continue;
      }
      
      const target = this.enemies.findNearest(skeleton.sprite.x, skeleton.sprite.y, 300);
      const body = skeleton.sprite.body as Phaser.Physics.Arcade.Body;
      
      if (target) {
        const dist = Phaser.Math.Distance.Between(skeleton.sprite.x, skeleton.sprite.y, target.x, target.y);
        if (dist > 40) {
          const angle = Phaser.Math.Angle.Between(skeleton.sprite.x, skeleton.sprite.y, target.x, target.y);
          body.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
        } else {
          body.setVelocity(0, 0);
          if (time >= skeleton.nextAttackAt) {
            skeleton.nextAttackAt = time + 1000;
            // Melee cleave
            this.juice.ring(skeleton.sprite.x, skeleton.sprite.y, 50, 0xbd93f9, 150);
            
            const enemiesHit = this.enemies.grid.getNearby(skeleton.sprite.x, skeleton.sprite.y, 50, undefined);
            for (const entity of enemiesHit) {
              const enemy = entity.sprite;
              if (Phaser.Math.Distance.Between(skeleton.sprite.x, skeleton.sprite.y, enemy.x, enemy.y) <= 50 + entity.definition.radius) {
                const damage = 35 * this.run.stats.current.damage;
                this.enemies.damage(enemy, damage, false);
              }
            }
          }
        }
      } else {
        // Return to player if no enemies
        const distToPlayer = Phaser.Math.Distance.Between(skeleton.sprite.x, skeleton.sprite.y, this.player.x, this.player.y);
        if (distToPlayer > 60) {
          const angle = Phaser.Math.Angle.Between(skeleton.sprite.x, skeleton.sprite.y, this.player.x, this.player.y);
          body.setVelocity(Math.cos(angle) * 140, Math.sin(angle) * 140);
        } else {
          body.setVelocity(0, 0);
        }
      }
    }
  }
}
