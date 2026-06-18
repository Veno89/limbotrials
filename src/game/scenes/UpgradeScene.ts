import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import type { UpgradeCategory, UpgradeDefinition, UpgradeId, WeaponId } from '../types/gameTypes';
import { addButton, addTitle } from '../ui/uiHelpers';
import { StatsPanel } from '../ui/StatsPanel';
import { getUpgradeDescription, getUpgradeProgressLabel } from '../ui/upgradePresentation';
import type { RunState } from '../systems/RunState';

interface UpgradeOfferUpdate {
  choices: UpgradeDefinition[];
  rerolls: number;
}

export interface UpgradeSceneData {
  run: RunState;
  choices: UpgradeDefinition[];
  stacks: ReadonlyMap<UpgradeId, number>;
  weaponLevels: ReadonlyMap<WeaponId, number>;
  weaponCount: number;
  weaponCap: number;
  title: string;
  subtitle: string;
  rerolls: number;
  canSkip: boolean;
  onChoose: (choice: UpgradeDefinition) => void;
  onReroll: () => UpgradeOfferUpdate | undefined;
  onSkip: () => void;
}

const CATEGORY_LABEL: Record<UpgradeCategory, string> = {
  weapon: 'WEAPONS',
  'weapon-level': 'WEAPON LEVELS',
  'weapon-upgrade': 'WEAPON UPGRADES',
  'weapon-evolution': 'WEAPON EVOLUTION',
  stat: 'STATS',
  curse: 'CURSES',
};

const CATEGORY_COLOR: Record<UpgradeCategory, number> = {
  weapon: 0xc7a76a,
  'weapon-level': 0x69d9ff,
  'weapon-upgrade': 0xb687ed,
  'weapon-evolution': 0xc7a76a,
  stat: 0x82949b,
  curse: 0xa52d35,
};

export class UpgradeScene extends Phaser.Scene {
  private choiceData!: UpgradeSceneData;
  private selected = false;

  constructor() {
    super('UpgradeScene');
  }

  init(data: UpgradeSceneData): void {
    this.choiceData = data;
  }

  create(): void {
    this.selected = false;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020405, 0.84).setOrigin(0);
    addTitle(this, GAME_WIDTH / 2, 96, this.choiceData.title, 37);
    this.add
      .text(GAME_WIDTH / 2, 139, this.choiceData.subtitle, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: '#9bb0ba',
      })
      .setOrigin(0.5);
    this.choiceData.choices.forEach((choice, index) => this.createCard(choice, index, 250 + index * 390, 385));
    if (this.choiceData.rerolls > 0) {
      addButton(
        this,
        GAME_WIDTH / 2 - (this.choiceData.canSkip ? 135 : 0),
        642,
        `REROLL (${this.choiceData.rerolls}) [R]`,
        () => this.reroll(),
        240,
      );
    }
    if (this.choiceData.canSkip) {
      addButton(this, GAME_WIDTH / 2 + 135, 642, 'SKIP FOR SOULS', () => this.skip(), 240);
    }
    new StatsPanel(this, this.choiceData.run, { depth: 300 });
    const keyboard = this.input.keyboard;
    if (keyboard) {
      keyboard.once('keydown-ONE', () => this.chooseAt(0));
      keyboard.once('keydown-TWO', () => this.chooseAt(1));
      keyboard.once('keydown-THREE', () => this.chooseAt(2));
      keyboard.once('keydown-R', () => this.reroll());
    }
  }

  private createCard(choice: UpgradeDefinition, index: number, x: number, y: number): void {
    const rarityColor = choice.curse
      ? COLORS.blood
      : choice.rarity === 'rare'
        ? 0xb687ed
        : choice.rarity === 'uncommon'
          ? 0x65cce8
          : COLORS.border;
    const categoryColor = choice.curse ? COLORS.blood : CATEGORY_COLOR[choice.category];
    const panel = this.add
      .rectangle(x, y, 330, 390, COLORS.panel, 0.98)
      .setStrokeStyle(3, rarityColor)
      .setInteractive({ useHandCursor: true });
    const rarityStrip = this.add.rectangle(x, y - 191, 326, 7, categoryColor, choice.curse ? 1 : 0.9);
    this.add
      .text(x, y - 171, choice.curse ? `CURSED ${CATEGORY_LABEL[choice.category]}` : CATEGORY_LABEL[choice.category], {
        fontFamily: 'Cinzel, serif',
        fontSize: '11px',
        color: `#${categoryColor.toString(16).padStart(6, '0')}`,
      })
      .setOrigin(0.5);
    const iconHalo = this.add.circle(x, y - 108, 66, rarityColor, 0.11).setStrokeStyle(2, rarityColor, 0.5);
    const icon = this.add.image(x, y - 105, choice.iconTexture).setDisplaySize(108, 108);
    this.add
      .text(x, y - 28, choice.name, {
        fontFamily: 'Cinzel, serif',
        fontSize: '20px',
        color: '#e3edf1',
        align: 'center',
        wordWrap: { width: 275 },
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 58, this.descriptionFor(choice), {
        fontFamily: 'Inter, sans-serif',
        fontSize: choice.curse ? '13px' : '15px',
        color: '#aabcc4',
        align: 'center',
        wordWrap: { width: 270 },
      })
      .setOrigin(0.5);
    if (choice.curse) {
      this.add
        .text(x, y + 121, `CURSE +${choice.curse.curseGain}`, {
          fontFamily: 'Cinzel, serif',
          fontSize: '14px',
          color: '#d26468',
          stroke: '#050708',
          strokeThickness: 3,
        })
        .setOrigin(0.5);
    }
    this.add
      .text(x, y + 143, choice.rarity.toUpperCase(), {
        fontFamily: 'Cinzel, serif',
        fontSize: '13px',
        color: `#${rarityColor.toString(16).padStart(6, '0')}`,
      })
      .setOrigin(0.5);
    this.add
      .text(
        x,
        y + 168,
        `${this.progressLabel(choice)}   [${index + 1}]`,
        {
          fontFamily: 'Cinzel, serif',
          fontSize: '12px',
          color: '#7f929a',
        },
      )
      .setOrigin(0.5);
    const iconScaleX = icon.scaleX;
    const iconScaleY = icon.scaleY;

    panel.on('pointerover', () => {
      panel.setFillStyle(COLORS.panelLight);
      panel.setStrokeStyle(4, rarityColor);
      this.tweens.add({
        targets: icon,
        scaleX: iconScaleX * 1.06,
        scaleY: iconScaleY * 1.06,
        duration: 120,
        ease: 'Cubic.Out',
      });
      this.tweens.add({
        targets: iconHalo,
        alpha: 0.9,
        duration: 120,
      });
      this.tweens.add({
        targets: rarityStrip,
        alpha: 1,
        duration: 120,
      });
    });
    panel.on('pointerout', () => {
      panel.setFillStyle(COLORS.panel);
      panel.setStrokeStyle(3, rarityColor);
      this.tweens.add({
        targets: icon,
        scaleX: iconScaleX,
        scaleY: iconScaleY,
        duration: 120,
        ease: 'Cubic.Out',
      });
      this.tweens.add({
        targets: iconHalo,
        alpha: 1,
        duration: 120,
      });
      this.tweens.add({
        targets: rarityStrip,
        alpha: 0.9,
        duration: 120,
      });
    });
    panel.on('pointerdown', () => this.choose(choice));
  }

  private chooseAt(index: number): void {
    const choice = this.choiceData.choices[index];
    if (choice) {
      this.choose(choice);
    }
  }

  private progressLabel(choice: UpgradeDefinition): string {
    return getUpgradeProgressLabel(choice, this.choiceData);
  }

  private descriptionFor(choice: UpgradeDefinition): string {
    return getUpgradeDescription(choice, this.choiceData.weaponLevels);
  }

  private choose(choice: UpgradeDefinition): void {
    if (this.selected) {
      return;
    }
    this.selected = true;
    this.choiceData.onChoose(choice);
  }

  private reroll(): void {
    if (this.selected || this.choiceData.rerolls <= 0) {
      return;
    }
    const update = this.choiceData.onReroll();
    if (update) {
      this.scene.restart({ ...this.choiceData, ...update });
    }
  }

  private skip(): void {
    if (this.selected || !this.choiceData.canSkip) {
      return;
    }
    this.selected = true;
    this.choiceData.onSkip();
  }
}
