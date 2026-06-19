import Phaser from 'phaser';
import type { CharacterId } from '../types/gameTypes';
import { directionFromVelocity, type PlayerVisualDirection } from './playerVisualRules';

export class PlayerVisualSystem {
  private readonly animated?: Phaser.GameObjects.Sprite;
  private direction: PlayerVisualDirection = 'front';

  constructor(
    scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    characterId: CharacterId,
  ) {
    if (characterId !== 'haunted') {
      return;
    }
    this.player.setAlpha(0);
    this.animated = scene.add
      .sprite(player.x, player.y, 'test-down-idle')
      .setDisplaySize(108, 81)
      .setDepth(player.depth);
  }

  update(time: number): void {
    if (!this.animated) {
      return;
    }
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const nextDirection = directionFromVelocity(body.velocity.x, body.velocity.y);
    if (nextDirection) {
      this.direction = nextDirection;
    }
    const hoverOffset = Math.sin(time / 260) * 1.5;

    const isMoving = body.velocity.x !== 0 || body.velocity.y !== 0;

    let base = 'test-down';
    if (this.direction === 'back') base = 'test-up';
    else if (this.direction === 'right') base = 'test-right';
    else if (this.direction === 'left') base = 'test-left';

    if (isMoving) {
      const frameNum = Math.floor(time / 200) % 2 === 0 ? '1' : '2';
      this.animated.setTexture(`${base}-${frameNum}`);
    } else {
      this.animated.setTexture(`${base}-idle`);
    }

    this.animated.setPosition(this.player.x, this.player.y + hoverOffset);
  }

  setTint(color: number): void {
    (this.animated ?? this.player).setTint(color);
  }

  clearTint(): void {
    (this.animated ?? this.player).clearTint();
  }
}
