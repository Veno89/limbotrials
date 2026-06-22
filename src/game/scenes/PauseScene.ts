import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { returnFromMenu } from '../systems/MenuNavigationSystem';
import { addButton, addTitle } from '../ui/uiHelpers';
import type { GameScene } from './GameScene';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020405, 0.82).setOrigin(0);
    const pauseButton = { height: 46, fontSize: 16 } as const;
    addTitle(this, GAME_WIDTH / 2, 215, 'THE TRIAL WAITS', 35);
    addButton(this, GAME_WIDTH / 2, 292, 'CONTINUE', () => this.resumeRun(), 270, undefined, pauseButton);
    addButton(
      this,
      GAME_WIDTH / 2,
      352,
      'JOURNAL',
      () => this.openSubmenu('JournalScene'),
      270,
      undefined,
      pauseButton,
    );
    addButton(
      this,
      GAME_WIDTH / 2,
      412,
      'SETTINGS',
      () => this.openSubmenu('SettingsScene'),
      270,
      undefined,
      pauseButton,
    );
    addButton(this, GAME_WIDTH / 2, 472, 'ABANDON RUN', () => {
      const gameScene = this.scene.get('GameScene') as GameScene;
      this.scene.stop();
      gameScene.abandonRun();
    }, 270, undefined, pauseButton);

    this.input.keyboard?.once('keydown-ESC', () => this.resumeRun());
  }

  private resumeRun(): void {
    this.scene.stop();
    this.scene.resume('GameScene');
  }

  private openSubmenu(sceneKey: 'JournalScene' | 'SettingsScene'): void {
    returnFromMenu(
      {
        start: (targetSceneKey, data) => {
          this.scene.start(targetSceneKey, data);
        },
        bringToTop: (targetSceneKey) => {
          this.scene.bringToTop(targetSceneKey);
        },
      },
      {
        sceneKey,
        data: {
          returnTarget: {
            sceneKey: 'PauseScene',
          },
        },
      },
    );
  }
}
