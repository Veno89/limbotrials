import Phaser from 'phaser';
import type { CharacterId } from '../types/gameTypes';
import { directionFromVelocity, HAUNTED_IDLE_FRAMES, type PlayerVisualDirection } from './playerVisualRules';

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
      .sprite(player.x, player.y, 'player-haunted-walk', HAUNTED_IDLE_FRAMES.front)
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
    this.animated
      .setPosition(this.player.x, this.player.y + hoverOffset)
      .setFrame(HAUNTED_IDLE_FRAMES[this.direction]);
  }

  setTint(color: number): void {
    (this.animated ?? this.player).setTint(color);
  }

  clearTint(): void {
    (this.animated ?? this.player).clearTint();
  }
}
