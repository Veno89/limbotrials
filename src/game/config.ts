import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './constants';
import { BootScene } from './scenes/BootScene';
import { GameOverScene, VictoryScene } from './scenes/EndScenes';
import { GameScene } from './scenes/GameScene';
import { JournalScene } from './scenes/JournalScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { MetaProgressionScene } from './scenes/MetaProgressionScene';
import { PauseScene } from './scenes/PauseScene';
import { PreloadScene } from './scenes/PreloadScene';
import { SettingsScene } from './scenes/SettingsScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { DevModeScene } from './scenes/DevModeScene';
import { ShopScene } from './scenes/ShopScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#071014',
  pixelArt: false,
  antialias: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    JournalScene,
    MetaProgressionScene,
    SettingsScene,
    CharacterSelectScene,
    GameScene,
    ShopScene,
    UpgradeScene,
    PauseScene,
    GameOverScene,
    VictoryScene,
    ...(import.meta.env.DEV ? [DevModeScene] : []),
  ],
};
