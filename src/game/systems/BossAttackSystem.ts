import Phaser from 'phaser';
import { COLORS } from '../constants';
import type { BossAttackId, CurseSnapshot } from '../types/gameTypes';
import { audio } from './AudioSystem';
import type { EnemySystem } from './EnemySystem';
import type { JuiceSystem } from './JuiceSystem';
import { distanceToSegment } from './Geometry';
import { hasBossCurseTag } from '../data/curse';

interface BossAttackLane {
  line: Phaser.GameObjects.Rectangle;
  endX: number;
  endY: number;
  width: number;
}

export class BossAttackSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly enemies: EnemySystem,
    private readonly juice: JuiceSystem,
    private readonly onPlayerHit: (damage: number, source: BossAttackId) => void,
    private readonly getElapsedMs: () => number,
    private readonly getCurse: () => CurseSnapshot,
  ) {}

  trigger(attack: BossAttackId, x: number, y: number, phase: number): void {
    audio.play('boss');
    switch (attack) {
      case 'soul-prison':
        this.soulPrison(phase);
        break;
      case 'grave-chain':
        this.graveChain(x, y, phase);
        break;
      case 'shattered-judgment':
        this.shatteredJudgment(phase);
        break;
      case 'cathedral-rupture':
        this.cathedralRupture(x, y, phase);
        break;
      case 'condemned-star':
        this.condemnedStar(x, y, phase);
        break;
      default:
        this.shockwave(x, y, phase);
    }
    this.applyCurseModifier(phase);
  }

  private applyCurseModifier(phase: number): void {
    const curse = this.getCurse();
    if (!hasBossCurseTag(curse, 'curse-minions')) {
      return;
    }
    const count = hasBossCurseTag(curse, 'curse-aura') ? 2 : 1;
    for (let index = 0; index < count; index += 1) {
      this.enemies.spawnAroundPlayer('condemned-husk', this.getElapsedMs(), 520 + phase * 35 + index * 30);
    }
    if (phase >= 3 && hasBossCurseTag(curse, 'curse-aura')) {
      this.juice.warning('THE WARDEN ANSWERS YOUR CURSE', '#d26468');
    }
  }

  private shockwave(x: number, y: number, phase: number): void {
    this.juice.ring(x, y, 250, COLORS.gold, 850);
    this.scene.time.delayedCall(820, () => {
      this.juice.heavyImpact();
      if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 250) {
        this.onPlayerHit(24, 'shockwave');
      }
      for (let index = 0; index < phase + 2; index += 1) {
        this.enemies.spawnAroundPlayer('lost-soul', this.getElapsedMs(), 500 + index * 25);
      }
    });
  }

  private soulPrison(phase: number): void {
    this.juice.warning('THE WARDEN MARKS YOUR SOUL', '#c08ad8');
    const marks = phase + 1;
    for (let index = 0; index < marks; index += 1) {
      const angle = (index / marks) * Math.PI * 2;
      const distance = index === 0 ? 0 : 105 + phase * 15;
      const x = this.player.x + Math.cos(angle) * distance;
      const y = this.player.y + Math.sin(angle) * distance;
      this.juice.ring(x, y, 88, COLORS.void, 900);
      this.scene.time.delayedCall(880, () => {
        this.juice.ring(x, y, 108, COLORS.void, 220);
        if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 88) {
          this.onPlayerHit(14 + phase * 4, 'soul-prison');
        }
      });
    }
  }

  private graveChain(x: number, y: number, phase: number): void {
    this.juice.warning('THE WARDEN DRAWS THE GRAVE CHAIN', '#d7bd82');
    const targetX = this.player.x;
    const targetY = this.player.y;
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const length = Phaser.Math.Distance.Between(x, y, targetX, targetY) + 320;
    const line = this.scene.add
      .rectangle(x, y, length, 64 + phase * 8, COLORS.gold, 0.12)
      .setOrigin(0, 0.5)
      .setRotation(angle)
      .setStrokeStyle(2, COLORS.gold, 0.8)
      .setDepth(22);
    this.scene.tweens.add({
      targets: line,
      alpha: 0.42,
      yoyo: true,
      repeat: 3,
      duration: 120,
    });
    this.scene.time.delayedCall(940, () => {
      line.destroy();
      this.juice.heavyImpact();
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      if (distanceToSegment(this.player.x, this.player.y, x, y, endX, endY) < 42 + phase * 6) {
        this.onPlayerHit(18 + phase * 4, 'grave-chain');
      }
      for (let index = 0; index < phase; index += 1) {
        this.enemies.spawnAroundPlayer('void-caster', this.getElapsedMs(), 560 + index * 35);
      }
    });
  }

  private shatteredJudgment(phase: number): void {
    this.juice.warning('JUDGMENT SHATTERS BENEATH YOU', '#ff6a4d');
    const x = this.player.x;
    const y = this.player.y;
    const radius = 125 + phase * 12;
    const delay = 1050;
    const blast = this.telegraphCircle(x, y, radius, delay);
    const lanes = this.telegraphRadialLanes(x, y, 7 + phase * 2, 520, 34 + phase * 2, delay + 180);
    this.scene.time.delayedCall(delay, () => {
      blast.destroy();
      this.juice.heavyImpact();
      this.juice.ring(x, y, radius, COLORS.enemyProjectileGlow, 240);
      if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < radius) {
        this.onPlayerHit(18 + phase * 4, 'shattered-judgment');
      }
    });
    this.resolveRadialLanes(lanes, delay + 180, 14 + phase * 3, 'shattered-judgment');
  }

  private cathedralRupture(x: number, y: number, phase: number): void {
    this.juice.warning('THE CATHEDRAL FLOOR RUPTURES', '#ff6a4d');
    const targetX = this.player.x;
    const targetY = this.player.y;
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY) + Math.PI * 0.5;
    const count = 3 + phase;
    for (let index = 0; index < count; index += 1) {
      const offset = (index - (count - 1) / 2) * 175;
      const blastX = targetX + Math.cos(angle) * offset;
      const blastY = targetY + Math.sin(angle) * offset;
      const radius = 108 + phase * 8;
      const delay = 720 + index * 260;
      const blast = this.telegraphCircle(blastX, blastY, radius, delay);
      this.scene.time.delayedCall(delay, () => {
        blast.destroy();
        this.juice.ring(blastX, blastY, radius, COLORS.enemyProjectileGlow, 220);
        if (Phaser.Math.Distance.Between(blastX, blastY, this.player.x, this.player.y) < radius) {
          this.onPlayerHit(16 + phase * 4, 'cathedral-rupture');
        }
      });
    }
  }

  private condemnedStar(x: number, y: number, phase: number): void {
    this.juice.warning('THE CONDEMNED STAR FIXES YOUR FATE', '#ff6a4d');
    const targetX = this.player.x;
    const targetY = this.player.y;
    const delay = 1350;
    const radius = 112 + phase * 10;
    const target = this.telegraphCircle(targetX, targetY, radius, delay);
    const star = this.scene.add
      .image(x, y, 'projectile-void')
      .setDisplaySize(74, 74)
      .setTint(COLORS.enemyProjectileGlow)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(28);
    this.scene.tweens.add({
      targets: star,
      x: targetX,
      y: targetY,
      angle: 540,
      scaleX: star.scaleX * 1.5,
      scaleY: star.scaleY * 1.5,
      duration: delay,
      ease: 'Cubic.In',
    });
    const lanes = this.telegraphRadialLanes(targetX, targetY, 9 + phase * 2, 600, 28 + phase * 2, delay + 220);
    this.scene.time.delayedCall(delay, () => {
      target.destroy();
      star.destroy();
      this.juice.heavyImpact();
      this.juice.ring(targetX, targetY, radius, COLORS.enemyProjectileGlow, 260);
      if (Phaser.Math.Distance.Between(targetX, targetY, this.player.x, this.player.y) < radius) {
        this.onPlayerHit(20 + phase * 4, 'condemned-star');
      }
    });
    this.resolveRadialLanes(lanes, delay + 220, 16 + phase * 3, 'condemned-star');
  }

  private telegraphCircle(
    x: number,
    y: number,
    radius: number,
    duration: number,
  ): Phaser.GameObjects.Arc {
    const circle = this.scene.add
      .circle(x, y, radius, COLORS.enemyTelegraph, 0.08)
      .setStrokeStyle(3, COLORS.enemyTelegraph, 0.85)
      .setDepth(23);
    this.scene.tweens.add({
      targets: circle,
      alpha: 0.26,
      scaleX: 1.08,
      scaleY: 1.08,
      yoyo: true,
      repeat: -1,
      duration: 180,
    });
    this.scene.time.delayedCall(duration + 50, () => {
      if (circle.active) {
        circle.destroy();
      }
    });
    return circle;
  }

  private telegraphRadialLanes(
    x: number,
    y: number,
    count: number,
    length: number,
    width: number,
    duration: number,
  ): BossAttackLane[] {
    const lanes: BossAttackLane[] = [];
    const rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
    for (let index = 0; index < count; index += 1) {
      const angle = rotation + (index / count) * Math.PI * 2;
      const line = this.scene.add
        .rectangle(x, y, length, width, COLORS.enemyTelegraph, 0.1)
        .setOrigin(0, 0.5)
        .setRotation(angle)
        .setStrokeStyle(1.5, COLORS.enemyTelegraph, 0.72)
        .setDepth(22);
      this.scene.tweens.add({
        targets: line,
        alpha: 0.32,
        yoyo: true,
        repeat: -1,
        duration: 150,
      });
      lanes.push({
        line,
        endX: x + Math.cos(angle) * length,
        endY: y + Math.sin(angle) * length,
        width,
      });
    }
    this.scene.time.delayedCall(duration + 50, () => {
      for (const lane of lanes) {
        if (lane.line.active) {
          lane.line.destroy();
        }
      }
    });
    return lanes;
  }

  private resolveRadialLanes(
    lanes: BossAttackLane[],
    delay: number,
    damage: number,
    source: BossAttackId,
  ): void {
    this.scene.time.delayedCall(delay, () => {
      let hit = false;
      for (const lane of lanes) {
        const startX = lane.line.x;
        const startY = lane.line.y;
        lane.line.destroy();
        if (
          !hit &&
          distanceToSegment(this.player.x, this.player.y, startX, startY, lane.endX, lane.endY) <
            lane.width * 0.55
        ) {
          hit = true;
          this.onPlayerHit(damage, source);
        }
      }
      this.juice.heavyImpact();
    });
  }
}
