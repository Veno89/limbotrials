import Phaser from 'phaser';
import { COLORS } from '../constants';

export class JuiceSystem {
  private lastHeavyImpactAt = Number.NEGATIVE_INFINITY;
  private readonly deathEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly inactiveDamageTexts: Phaser.GameObjects.Text[] = [];
  private readonly inactiveRings: Phaser.GameObjects.Arc[] = [];
  private warningLabel?: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly screenShakeEnabled: boolean,
    private readonly particlesEnabled: boolean,
  ) {
    if (!scene.textures.exists('juice-mote')) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(8, 8, 8);
      graphics.generateTexture('juice-mote', 16, 16);
      graphics.destroy();
    }
    this.deathEmitter = scene.add.particles(0, 0, 'juice-mote', {
      speed: { min: 60, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.85, end: 0 },
      lifespan: { min: 280, max: 520 },
      emitting: false,
    }).setDepth(40);
  }

  private getDamageText(): Phaser.GameObjects.Text {
    const text = this.inactiveDamageTexts.pop();
    if (text) {
      text.setActive(true).setVisible(true).setAlpha(1).setScale(1);
      return text;
    }
    return this.scene.add.text(0, 0, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '15px',
      color: '#d9edf4',
      stroke: '#081014',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);
  }

  damageNumber(x: number, y: number, amount: number, critical: boolean): void {
    const text = this.getDamageText();
    text.setPosition(x, y);
    text.setText(String(amount));
    text.setFontSize(critical ? '22px' : '15px');
    text.setColor(critical ? '#ffd37c' : '#d9edf4');

    this.scene.tweens.add({
      targets: text,
      y: y - 42,
      alpha: 0,
      scale: critical ? 1.25 : 1,
      duration: 650,
      ease: 'Cubic.Out',
      onComplete: () => {
        text.setActive(false).setVisible(false);
        this.inactiveDamageTexts.push(text);
      },
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
    if (!sprite.active || this.scene.tweens.isTweening(sprite)) {
      return;
    }
    const baseScaleX = (sprite.getData('baseScaleX') as number | undefined) ?? sprite.scaleX;
    const baseScaleY = (sprite.getData('baseScaleY') as number | undefined) ?? sprite.scaleY;
    
    sprite.setScale(baseScaleX, baseScaleY);
    
    this.scene.tweens.add({
      targets: sprite,
      scaleX: baseScaleX * (1 + intensity),
      scaleY: baseScaleY * (1 - intensity * 0.5),
      duration: 60,
      yoyo: true,
      ease: 'Sine.Out',
    });
  }

  enemyDeath(x: number, y: number, color: number = COLORS.soul): void {
    if (!this.particlesEnabled) {
      return;
    }
    this.deathEmitter.setParticleTint(color);
    this.deathEmitter.emitParticleAt(x, y, 7);
  }

  ring(x: number, y: number, radius: number, color: number, duration = 350): void {
    let ring = this.inactiveRings.pop();
    if (!ring) {
      ring = this.scene.add.circle(0, 0, 10).setDepth(25);
    }
    ring.setPosition(x, y)
        .setRadius(radius * 0.25)
        .setFillStyle(color, 0.12)
        .setStrokeStyle(4, color, 0.9)
        .setActive(true)
        .setVisible(true)
        .setAlpha(1)
        .setDisplaySize(radius * 0.5, radius * 0.5);

    this.scene.tweens.add({
      targets: ring,
      displayWidth: radius * 2,
      displayHeight: radius * 2,
      alpha: 0,
      duration,
      ease: 'Cubic.Out',
      onComplete: () => {
        ring!.setActive(false).setVisible(false);
        this.inactiveRings.push(ring!);
      },
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
    if (!this.warningLabel) {
      this.warningLabel = this.scene.add
        .text(640, 170, '', {
          fontFamily: 'Cinzel, serif',
          fontSize: '34px',
          stroke: '#050708',
          strokeThickness: 8,
          align: 'center',
          wordWrap: { width: 1080 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(200)
        .setAlpha(0);
    } else {
      this.scene.tweens.killTweensOf(this.warningLabel);
    }
    
    this.warningLabel.setText(text);
    this.warningLabel.setColor(color);
    
    this.scene.tweens.add({
      targets: this.warningLabel,
      alpha: 1,
      yoyo: true,
      hold: 900,
      duration: 260,
    });
  }
}
