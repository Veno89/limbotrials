import Phaser from 'phaser';
import { COLORS } from '../constants';

export class JuiceSystem {
  private activeWarning?: Phaser.GameObjects.Text;
  private lastHeavyImpactAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly screenShakeEnabled: boolean,
    private readonly particlesEnabled: boolean,
  ) {}

  damageNumber(x: number, y: number, amount: number, critical: boolean): void {
    const text = this.scene.add
      .text(x, y, String(amount), {
        fontFamily: 'Cinzel, serif',
        fontSize: critical ? '22px' : '15px',
        color: critical ? '#ffd37c' : '#d9edf4',
        stroke: '#081014',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.scene.tweens.add({
      targets: text,
      y: y - 42,
      alpha: 0,
      scale: critical ? 1.25 : 1,
      duration: 650,
      ease: 'Cubic.Out',
      onComplete: () => text.destroy(),
    });
  }

  enemyHit(sprite: Phaser.GameObjects.Image): void {
    sprite.setTint(0xffffff);
    this.squash(sprite, 0.15);
    this.scene.time.delayedCall(55, () => {
      if (sprite.active) {
        sprite.clearTint();
      }
    });
  }

  squash(sprite: Phaser.GameObjects.Image, intensity: number): void {
    if (!sprite.active) {
      return;
    }
    const originalScaleX = sprite.scaleX;
    const originalScaleY = sprite.scaleY;
    this.scene.tweens.killTweensOf(sprite);
    this.scene.tweens.add({
      targets: sprite,
      scaleX: originalScaleX * (1 + intensity),
      scaleY: originalScaleY * (1 - intensity * 0.5),
      duration: 60,
      yoyo: true,
      ease: 'Sine.Out',
    });
  }

  enemyDeath(x: number, y: number, color: number = COLORS.soul): void {
    if (!this.particlesEnabled) {
      return;
    }
    for (let index = 0; index < 7; index += 1) {
      const mote = this.scene.add.circle(x, y, Phaser.Math.Between(2, 5), color, 0.85).setDepth(40);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(25, 70);
      this.scene.tweens.add({
        targets: mote,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(280, 520),
        ease: 'Quad.Out',
        onComplete: () => mote.destroy(),
      });
    }
  }

  ring(x: number, y: number, radius: number, color: number, duration = 350): void {
    const ring = this.scene.add.circle(x, y, radius * 0.25, color, 0.12).setStrokeStyle(4, color, 0.9);
    ring.setDepth(25);
    this.scene.tweens.add({
      targets: ring,
      displayWidth: radius * 2,
      displayHeight: radius * 2,
      alpha: 0,
      duration,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });
  }

  playerDamage(): void {
    if (this.screenShakeEnabled) {
      this.scene.cameras.main.shake(110, 0.004);
    }
    this.scene.cameras.main.flash(100, 120, 20, 25, false);
  }

  heavyImpact(): void {
    if (this.scene.time.now - this.lastHeavyImpactAt < 450) {
      return;
    }
    this.lastHeavyImpactAt = this.scene.time.now;
    if (this.screenShakeEnabled) {
      this.scene.cameras.main.shake(150, 0.006);
    }
  }

  warning(text: string, color = '#b9dded'): void {
    if (this.activeWarning?.active) {
      this.scene.tweens.killTweensOf(this.activeWarning);
      this.activeWarning.destroy();
    }
    const label = this.scene.add
      .text(640, 170, text, {
        fontFamily: 'Cinzel, serif',
        fontSize: '34px',
        color,
        stroke: '#050708',
        strokeThickness: 8,
        align: 'center',
        wordWrap: { width: 1080 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);
    this.activeWarning = label;
    this.scene.tweens.add({
      targets: label,
      alpha: 1,
      yoyo: true,
      hold: 900,
      duration: 260,
      onComplete: () => {
        label.destroy();
        if (this.activeWarning === label) {
          this.activeWarning = undefined;
        }
      },
    });
  }
}
