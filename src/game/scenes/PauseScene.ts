import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { addButton, addTitle } from '../ui/uiHelpers';

interface PauseSceneData {
  onAbandon: () => void;
}

export class PauseScene extends Phaser.Scene {
  private onAbandon!: () => void;

  constructor() {
    super('PauseScene');
  }

  init(data: PauseSceneData): void {
    this.onAbandon = data.onAbandon;
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020405, 0.82).setOrigin(0);
    addTitle(this, GAME_WIDTH / 2, 235, 'THE TRIAL WAITS', 40);
    addButton(this, GAME_WIDTH / 2, 350, 'CONTINUE', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });
    addButton(this, GAME_WIDTH / 2, 420, 'SETTINGS', () => {
      this.scene.start('SettingsScene', {
        returnScene: 'PauseScene',
        returnData: { onAbandon: this.onAbandon },
      });
    });
    addButton(this, GAME_WIDTH / 2, 490, 'ABANDON RUN', () => {
      this.scene.stop();
      this.onAbandon();
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });
  }
}
