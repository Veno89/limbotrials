import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import type { RunSummary } from '../types/gameTypes';
import { addButton, addTitle, formatTime } from '../ui/uiHelpers';
import { WEAPONS } from '../data/weapons';
import { CHARACTERS } from '../data/characters';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { createRunSubmissionSession, type RunSubmissionResult } from '../../analytics/runSubmissionService';
import { ResultLeaderboardForm } from '../ui/ResultLeaderboardForm';

abstract class EndScene extends Phaser.Scene {
  private summary!: RunSummary;
  private nameForm?: ResultLeaderboardForm;
  protected abstract readonly victory: boolean;

  init(summary: RunSummary): void {
    this.summary = summary;
  }

  create(): void {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.42);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020405, 0.64).setOrigin(0);
    addTitle(
      this,
      GAME_WIDTH / 2,
      150,
      this.victory ? 'THE WARDEN FALLS' : 'OBLIVION CLAIMS YOU',
      43,
    ).setColor(this.victory ? '#d8c49b' : '#c96d72');
    this.add
      .text(
        GAME_WIDTH / 2,
        285,
        `${CHARACTERS[this.summary.characterId].name.toUpperCase()}\nTIME  ${formatTime(this.summary.elapsedMs)}   /   LEVEL  ${this.summary.level}\nSOULS REAPED  ${this.summary.souls}   /   ENEMIES ENDED  ${this.summary.kills}\nARTIFACTS CLAIMED  ${this.summary.artifacts.length}`,
        {
          fontFamily: 'Cinzel, serif',
          fontSize: '20px',
          color: '#d7e3e8',
          align: 'center',
        lineSpacing: 10,
          stroke: '#030506',
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5);
    const weaponResults = this.summary.weaponResults
      .slice(0, 3)
      .map((result) => `${WEAPONS[result.id].name.toUpperCase()}  ${result.damage} DMG  ${result.kills} KILLS`)
      .join('\n');
    this.add
      .text(GAME_WIDTH / 2, 365, weaponResults, {
        fontFamily: 'Cinzel, serif',
        fontSize: '13px',
        color: '#9fb8c2',
        align: 'center',
        lineSpacing: 5,
      })
      .setOrigin(0.5);
    const unlocks = [
      ...this.summary.newlyUnlockedCharacters.map((id) => `CHARACTER UNLOCKED: ${CHARACTERS[id].name}`),
      ...this.summary.newlyUnlockedArtifactTiers.map((tier) => `ARTIFACT POOL UNLOCKED: ${tier.toUpperCase()}`),
    ];
    if (unlocks.length > 0) {
      this.add
        .text(GAME_WIDTH / 2, 410, unlocks.join('\n'), {
          fontFamily: 'Cinzel, serif',
          fontSize: '14px',
          color: '#d8c49b',
          align: 'center',
        })
        .setOrigin(0.5);
    }
    if (this.summary.balance.presetId === 'standard') {
      const session = createRunSubmissionSession(this.summary);
      const submissionStatus = this.add
        .text(GAME_WIDTH / 2, 685, 'RECORDING RUN...', {
          fontFamily: 'Cinzel, serif',
          fontSize: '11px',
          color: '#9fb8c2',
          align: 'center',
        })
        .setOrigin(0.5);
      const showResult = (result: RunSubmissionResult): void => {
        if (submissionStatus.active) {
          submissionStatus
            .setText(result.message.toUpperCase())
            .setColor(result.status === 'failed' ? '#c96d72' : result.status === 'partial' ? '#d8c49b' : '#69d9ff');
        }
      };
      this.nameForm = new ResultLeaderboardForm(this, session, showResult);
      void session.submit().then(showResult);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.nameForm?.destroy();
        this.nameForm = undefined;
      });
    }
    addButton(this, GAME_WIDTH / 2, 470, 'BALANCE REPORT', () => {
      this.scene.pause();
      this.scene.launch('BalanceReportScene', { summary: this.summary, returnScene: this.scene.key });
    }, 320);
    addButton(this, 455, 625, 'RETURN TO LIMBO', () => this.scene.start('MainMenuScene'), 320);
    addButton(this, 825, 625, 'TRY AGAIN', () => {
      this.scene.start(FEATURE_FLAGS.characters ? 'CharacterSelectScene' : 'GameScene');
    }, 320);
  }
}

export class GameOverScene extends EndScene {
  protected readonly victory = false;

  constructor() {
    super('GameOverScene');
  }
}

export class VictoryScene extends EndScene {
  protected readonly victory = true;

  constructor() {
    super('VictoryScene');
  }
}
