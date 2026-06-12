import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { ASSETS, HAUNTED_WALK_SHEET } from '../data/assets';
import { addTitle } from '../ui/uiHelpers';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    addTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, 'ENTERING LIMBO', 30);
    const border = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 480, 16, 0x030506)
      .setStrokeStyle(2, COLORS.border);
    const bar = this.add.rectangle(border.x - 237, border.y, 474, 10, COLORS.soul).setOrigin(0, 0.5);
    bar.displayWidth = 0;
    this.load.on('progress', (progress: number) => {
      bar.displayWidth = 474 * progress;
    });
    for (const [key, path] of ASSETS) {
      this.load.image(key, path);
    }
    this.load.spritesheet('player-haunted-walk', HAUNTED_WALK_SHEET, {
      frameWidth: 209,
      frameHeight: 156,
      endFrame: 11,
    });
  }

  create(): void {
    this.createSoulTexture();
    this.scene.start('MainMenuScene');
  }

  private createSoulTexture(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.soul, 0.3);
    graphics.fillCircle(16, 16, 15);
    graphics.fillStyle(0xdaf7ff, 1);
    graphics.fillCircle(16, 16, 7);
    graphics.lineStyle(2, COLORS.soul, 1);
    graphics.strokeCircle(16, 16, 12);
    graphics.generateTexture('soul', 32, 32);
    graphics.destroy();
  }
}
