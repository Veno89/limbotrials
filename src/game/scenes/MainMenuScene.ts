import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { requestReturnToSite } from '../gameExitEvents';
import { audio } from '../systems/AudioSystem';
import { loadSave } from '../systems/SaveSystem';
import { addButton, addTitle } from '../ui/uiHelpers';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { availableTalentPoints } from '../systems/TalentTreeSystem';
import { unseenJournalCount } from '../systems/JournalDiscoverySystem';

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
    addTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 228, 'EVERLASTING OBLIVION', 46);
    addTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 177, 'LIMBO TRIAL', 21).setColor('#8eb9ca');

    const availablePoints = save.unlockedCharacters.reduce(
      (total, characterId) => total + availableTalentPoints(save, characterId),
      0,
    );
    const newJournalEntries = unseenJournalCount(save);
    const menuButton = { height: 46, fontSize: 16 } as const;
    const buttonStartY = GAME_HEIGHT / 2 - 68;
    addButton(this, GAME_WIDTH / 2, buttonStartY, 'BEGIN THE TRIAL', () => {
      this.scene.start(FEATURE_FLAGS.characters ? 'CharacterSelectScene' : 'GameScene');
    }, 300, undefined, menuButton);
    addButton(
      this,
      GAME_WIDTH / 2,
      buttonStartY + 60,
      'META UPGRADES',
      () => this.scene.start('MetaProgressionScene'),
      300,
      badgeCount(availablePoints),
      menuButton,
    );
    addButton(
      this,
      GAME_WIDTH / 2,
      buttonStartY + 120,
      'JOURNAL',
      () => this.scene.start('JournalScene'),
      300,
      badgeCount(newJournalEntries),
      menuButton,
    );
    addButton(
      this,
      GAME_WIDTH / 2,
      buttonStartY + 180,
      'SETTINGS',
      () => this.scene.start('SettingsScene'),
      300,
      undefined,
      menuButton,
    );
    addButton(
      this,
      GAME_WIDTH / 2,
      buttonStartY + 240,
      'QUIT',
      () => requestReturnToSite(),
      300,
      undefined,
      menuButton,
    );
  }
}

function badgeCount(count: number): string | undefined {
  if (count <= 0) {
    return undefined;
  }
  return count > 99 ? '99+' : String(count);
}
