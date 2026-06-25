import Phaser from 'phaser';
import type { CharacterId } from '../types/gameTypes';

export class PlayerVisualSystem {
  private readonly animated?: Phaser.GameObjects.Sprite;
  private lastGhostTime = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    characterId: CharacterId,
  ) {
    if (characterId !== 'haunted') {
      return;
    }
    this.player.setAlpha(0);
    this.animated = scene.add
      .sprite(player.x, player.y, 'scythe_char')
      .setDisplaySize(88, 104)
      .setDepth(player.depth);
  }

  update(time: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const isMoving = body.velocity.x !== 0 || body.velocity.y !== 0;

    if (this.animated) {
      const targetRotation = (body.velocity.x / 300) * 0.18;
      this.animated.rotation = Phaser.Math.Linear(this.animated.rotation, targetRotation, 0.2);

      const hoverOffset = Math.sin(time / 220) * (isMoving ? 4 : 2);
      const squash = isMoving ? Math.sin(time / 140) * 0.08 : Math.sin(time / 300) * 0.03;

      this.animated.setDisplaySize(88 * (1 - squash * 0.5), 104 * (1 + squash));
      this.animated.setPosition(this.player.x, this.player.y + hoverOffset);
    }

    if (body.velocity.lengthSq() > 200000 && time > this.lastGhostTime + 50) {
      this.lastGhostTime = time;
      const target = this.animated ?? this.player;
      const ghost = this.scene.add.sprite(target.x, target.y, target.texture.key);
      ghost.setDisplaySize(target.displayWidth, target.displayHeight);
      ghost.setRotation(target.rotation);
      ghost.setFlipX(this.player.flipX);
      ghost.setTint(0x88ccff);
      ghost.setAlpha(0.8);
      ghost.setDepth(target.depth - 1);
      
      this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        scaleX: ghost.scaleX * 0.8,
        scaleY: ghost.scaleY * 0.8,
        duration: 600,
        onComplete: () => ghost.destroy(),
      });
    }
  }

  setTint(color: number): void {
    (this.animated ?? this.player).setTint(color);
  }

  clearTint(): void {
    (this.animated ?? this.player).clearTint();
  }
}
