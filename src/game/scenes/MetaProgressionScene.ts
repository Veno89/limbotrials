import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { META_UPGRADES } from '../data/metaUpgrades';
import {
  availableSouls,
  loadSave,
  purchaseMetaUpgrade,
  writeSave,
} from '../systems/SaveSystem';
import { addButton, addTitle } from '../ui/uiHelpers';

export class MetaProgressionScene extends Phaser.Scene {
  constructor() {
    super('MetaProgressionScene');
  }

  create(): void {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'legacy-background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.35);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x030708, 0.65).setOrigin(0);
    const save = loadSave();
    addTitle(this, GAME_WIDTH / 2, 76, 'LEGACY OF ASH', 38);
    this.add
      .text(GAME_WIDTH / 2, 125, `AVAILABLE SOULS  ${availableSouls(save)}`, {
        fontFamily: 'Cinzel, serif',
        fontSize: '18px',
        color: '#8edfff',
      })
      .setOrigin(0.5);

    Object.values(META_UPGRADES).forEach((upgrade, index) => {
      const y = 205 + index * 104;
      const level = save.metaLevels[upgrade.id];
      const cost = upgrade.costs[level];
      this.add
        .rectangle(GAME_WIDTH / 2, y, 760, 82, COLORS.panel, 0.95)
        .setStrokeStyle(2, level >= upgrade.maxLevel ? COLORS.gold : COLORS.border);
      this.add
        .text(290, y - 22, `${upgrade.name}  ${level}/${upgrade.maxLevel}`, {
          fontFamily: 'Cinzel, serif',
          fontSize: '20px',
          color: '#dce8ed',
        })
        .setOrigin(0, 0.5);
      this.add
        .text(290, y + 16, upgrade.description, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '15px',
          color: '#9fb1b8',
        })
        .setOrigin(0, 0.5);
      addButton(
        this,
        905,
        y,
        level >= upgrade.maxLevel ? 'MASTERED' : `OFFER ${cost}`,
        () => {
          if (cost !== undefined && purchaseMetaUpgrade(save, upgrade.id, cost, upgrade.maxLevel)) {
            writeSave(save);
            this.scene.restart();
          }
        },
        190,
      );
    });
    addButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 62, 'RETURN', () => this.scene.start('MainMenuScene'));
  }
}
