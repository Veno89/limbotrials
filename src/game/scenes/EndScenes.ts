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
      112,
      this.victory ? 'THE WARDEN FALLS' : 'OBLIVION CLAIMS YOU',
      43,
    ).setColor(this.victory ? '#d8c49b' : '#c96d72');
    this.add
      .text(
        GAME_WIDTH / 2,
        232,
        `${CHARACTERS[this.summary.characterId].name.toUpperCase()}\nTIME  ${formatTime(this.summary.elapsedMs)}   /   LEVEL  ${this.summary.level}\nSOULS REAPED  ${this.summary.souls}   /   ENEMIES ENDED  ${this.summary.kills}\nARTIFACTS CLAIMED  ${this.summary.artifacts.length}   /   CURSE  ${this.summary.curse.level} ${this.summary.curse.tierLabel.toUpperCase()}`,
        {
          fontFamily: 'Cinzel, serif',
          fontSize: '19px',
          color: '#d7e3e8',
          align: 'center',
          lineSpacing: 9,
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
      .text(GAME_WIDTH / 2, 330, weaponResults, {
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
        .text(GAME_WIDTH / 2, 386, unlocks.join('\n'), {
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
        .text(GAME_WIDTH / 2, 592, 'RECORDING RUN...', {
          fontFamily: 'Cinzel, serif',
          fontSize: '10px',
          color: '#9fb8c2',
          align: 'center',
          wordWrap: { width: 780 },
        })
        .setOrigin(0.5);
      const showResult = (result: RunSubmissionResult): void => {
        if (submissionStatus.active) {
          submissionStatus
            .setText(result.message.toUpperCase())
            .setColor(result.status === 'failed' ? '#c96d72' : result.status === 'partial' ? '#d8c49b' : '#69d9ff');
        }
      };
      this.nameForm = new ResultLeaderboardForm(this, session, showResult, GAME_WIDTH / 2, 510);
      void session.submit().then(showResult);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.nameForm?.destroy();
        this.nameForm = undefined;
      });
    }
    addButton(this, 320, 652, 'BALANCE REPORT', () => {
      this.scene.pause();
      this.scene.launch('BalanceReportScene', { summary: this.summary, returnScene: this.scene.key });
    }, 280);
    addButton(this, GAME_WIDTH / 2, 652, 'RETURN TO LIMBO', () => this.scene.start('MainMenuScene'), 300);
    addButton(this, 960, 652, 'TRY AGAIN', () => {
      this.scene.start(FEATURE_FLAGS.characters ? 'CharacterSelectScene' : 'GameScene');
    }, 280);
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
