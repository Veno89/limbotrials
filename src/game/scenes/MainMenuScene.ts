import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { audio } from '../systems/AudioSystem';
import { availableSouls, loadSave } from '../systems/SaveSystem';
import { addButton, addTitle, formatTime } from '../ui/uiHelpers';
import { loadLastRunSummary } from '../systems/BalanceReportStore';
import { FEATURE_FLAGS } from '../config/featureFlags';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    const save = loadSave();
    audio.configure(save.settings);
    audio.stopAmbience();
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.72);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020405, 0.32).setOrigin(0);
    addTitle(this, GAME_WIDTH / 2, 128, 'EVERLASTING OBLIVION', 52);
    addTitle(this, GAME_WIDTH / 2, 186, 'LIMBO TRIAL', 25).setColor('#8eb9ca');

    addButton(this, GAME_WIDTH / 2, 325, 'BEGIN THE TRIAL', () => {
      this.scene.start(FEATURE_FLAGS.characters ? 'CharacterSelectScene' : 'GameScene');
    }, 330);
    addButton(this, GAME_WIDTH / 2, 390, 'LEGACY OF ASH', () => this.scene.start('MetaProgressionScene'), 330);
    addButton(this, GAME_WIDTH / 2, 455, 'SETTINGS', () => this.scene.start('SettingsScene'), 330);
    const lastRun = loadLastRunSummary();
    if (lastRun) {
      addButton(this, GAME_WIDTH / 2, 520, 'LAST BALANCE REPORT', () => {
        this.scene.pause();
        this.scene.launch('BalanceReportScene', { summary: lastRun, returnScene: this.scene.key });
      }, 330);
    }

    const best = save.bestRunTimeMs > 0 ? formatTime(save.bestRunTimeMs) : '--:--';
    this.add
      .text(
        GAME_WIDTH / 2,
        lastRun ? 590 : 540,
        `UNSPENT SOULS  ${availableSouls(save)}\nBEST TRIAL  ${best}   /   TOTAL KILLS  ${save.totalKills}`,
        {
          fontFamily: 'Cinzel, serif',
          fontSize: '15px',
          color: '#b7c8cf',
          align: 'center',
          lineSpacing: 9,
          stroke: '#030506',
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5);
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 34,
        'WASD / ARROWS TO MOVE   /   SPACE TO DASH   /   ESC TO PAUSE',
        {
          fontFamily: 'Cinzel, serif',
          fontSize: '13px',
          color: '#83959c',
        },
      )
      .setOrigin(0.5);
  }
}
