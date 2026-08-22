import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import type { RunSummary } from '../types/gameTypes';
import { addButton, addTitle, formatTime } from '../ui/uiHelpers';
import { WEAPONS } from '../data/weapons';
import { CHARACTERS } from '../data/characters';
import { createRunSubmissionSession, type RunSubmissionResult } from '../../analytics/runSubmissionService';
import { ResultLeaderboardForm } from '../ui/ResultLeaderboardForm';
import { requestReturnToSite } from '../gameExitEvents';

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
      GAME_HEIGHT / 2 - 268,
      this.victory ? 'THE WARDEN FALLS' : 'OBLIVION CLAIMS YOU',
      43,
    ).setColor(this.victory ? '#d8c49b' : '#c96d72');
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 155,
        `${CHARACTERS[this.summary.characterId].name.toUpperCase()}\nTIME  ${formatTime(this.summary.elapsedMs)}   /   LEVEL  ${this.summary.level}\nSOULS REAPED  ${this.summary.souls}   /   ENEMIES ENDED  ${this.summary.kills}\nARTIFACTS CLAIMED  ${this.summary.artifacts.length}   /   CURSE  ${this.summary.curse.level} ${this.summary.curse.tierLabel.toUpperCase()}`,
        {
          fontFamily: 'Cinzel, serif',
          fontSize: '18px',
          color: '#d7e3e8',
          align: 'center',
          lineSpacing: 8,
          stroke: '#030506',
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5);
    const weaponResults = this.summary.weaponResults
      .slice(0, 3)
      .map((result) => `${WEAPONS[result.id].name.toUpperCase()}  ${result.damage} DMG  ${result.kills} KILLS`)
      .join('\n') || 'NO WEAPON RECORDS';
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 42, weaponResults, {
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
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 14, unlocks.join('\n'), {
          fontFamily: 'Cinzel, serif',
          fontSize: '14px',
          color: '#d8c49b',
          align: 'center',
        })
        .setOrigin(0.5);
    }
    const canUpload = this.summary.balance.presetId === 'standard';
    const session = canUpload ? createRunSubmissionSession(this.summary) : undefined;
    const uploadStatus = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + (canUpload ? 198 : 188),
        canUpload ? 'ENTER A NAME TO UPLOAD THIS RUN' : 'LAB RUNS STAY LOCAL',
        {
          fontFamily: 'Cinzel, serif',
          fontSize: '10px',
          color: canUpload ? '#9fb8c2' : '#d8c49b',
          align: 'center',
          wordWrap: { width: 780 },
        },
      )
      .setOrigin(0.5);
    const showResult = (result: RunSubmissionResult): void => {
      showUploadResult(result);
    };
    const showCopyResult = (copied: boolean): void => {
      if (uploadStatus.active) {
        uploadStatus
          .setText(copied ? 'FULL RUN JSON COPIED — READY TO PASTE' : 'COULD NOT COPY RUN JSON')
          .setColor(copied ? '#69d9ff' : '#c96d72');
      }
    };
    this.nameForm = new ResultLeaderboardForm(
      this,
      this.summary,
      session,
      showResult,
      showCopyResult,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 102,
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.nameForm?.destroy();
      this.nameForm = undefined;
    });
    addButton(this, GAME_WIDTH / 2 - 400, GAME_HEIGHT / 2 + 302, 'MAIN MENU', () => this.scene.start('MainMenuScene'), 250);
    addButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 302, 'TRY AGAIN', () => {
      this.scene.start('GameScene', { characterId: this.summary.characterId });
    }, 250);
    addButton(this, GAME_WIDTH / 2 + 400, GAME_HEIGHT / 2 + 302, 'QUIT', () => requestReturnToSite(), 250);

    function showUploadResult(result: RunSubmissionResult): void {
      if (uploadStatus.active) {
        uploadStatus
          .setText(result.message.toUpperCase())
          .setColor(result.status === 'failed' ? '#c96d72' : result.status === 'partial' ? '#d8c49b' : '#69d9ff');
      }
    }
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
