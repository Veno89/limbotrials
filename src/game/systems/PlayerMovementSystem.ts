import Phaser from 'phaser';
import type { PlayerStats } from '../types/gameTypes';

export class PlayerMovementSystem {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private readonly dashKey: Phaser.Input.Keyboard.Key;
  private nextDashAt = 0;
  private dashEndsAt = 0;
  private perfectDodgeClaimed = false;
  private readonly direction = new Phaser.Math.Vector2();

  constructor(
    scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly stats: PlayerStats,
    private readonly onDash: () => void,
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required.');
    }
    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' }) as Record<
      'up' | 'down' | 'left' | 'right',
      Phaser.Input.Keyboard.Key
    >;
    this.dashKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(time: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.direction.set(
      Number(this.cursors.right.isDown || this.wasd.right.isDown) -
        Number(this.cursors.left.isDown || this.wasd.left.isDown),
      Number(this.cursors.down.isDown || this.wasd.down.isDown) -
        Number(this.cursors.up.isDown || this.wasd.up.isDown),
    );

    if (this.direction.lengthSq() > 0) {
      this.direction.normalize();
    }

    if (Phaser.Input.Keyboard.JustDown(this.dashKey) && time >= this.nextDashAt) {
      this.dashEndsAt = time + 150;
      this.nextDashAt = time + this.stats.dashCooldown;
      this.perfectDodgeClaimed = false;
      this.onDash();
    }

    const speed = time < this.dashEndsAt ? this.stats.dashSpeed : this.stats.moveSpeed;
    body.setVelocity(this.direction.x * speed, this.direction.y * speed);
    if (this.direction.x !== 0) {
      this.player.setFlipX(this.direction.x < 0);
    }
  }

  dashCooldownRatio(time: number): number {
    if (time >= this.nextDashAt) {
      return 1;
    }
    return Phaser.Math.Clamp(1 - (this.nextDashAt - time) / this.stats.dashCooldown, 0, 1);
  }

  claimPerfectDodge(time: number): boolean {
    if (time >= this.dashEndsAt || this.perfectDodgeClaimed) {
      return false;
    }
    this.perfectDodgeClaimed = true;
    return true;
  }
}
