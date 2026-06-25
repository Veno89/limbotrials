import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { CHARACTERS } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import { EDICTS } from '../data/edicts';
import { loadSave, writeSave } from '../systems/SaveSystem';
import type { CharacterId, EdictId } from '../types/gameTypes';
import { addButton, addTitle } from '../ui/uiHelpers';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super('CharacterSelectScene');
  }

  create(): void {
    const save = loadSave();
    let selected: CharacterId = save.unlockedCharacters.includes(save.selectedCharacter)
      ? save.selectedCharacter
      : 'haunted';
    const frames = new Map<CharacterId, Phaser.GameObjects.Rectangle>();

    let isNgPlus = false;
    const selectedEdicts = new Set<EdictId>(save.ngPlusEdicts);

    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'legacy-background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.42);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020405, 0.62).setOrigin(0);
    addTitle(this, GAME_WIDTH / 2, 62, 'CHOOSE THE CONDEMNED', 36);
    this.add
      .text(GAME_WIDTH / 2, 108, 'Each soul enters Limbo with a different burden.', {
        fontFamily: 'Cinzel, serif',
        fontSize: '14px',
        color: '#9fb1b8',
      })
      .setOrigin(0.5);

    Object.values(CHARACTERS).forEach((character, index) => {
      const x = 250 + index * 390;
      const unlocked = save.unlockedCharacters.includes(character.id);
      const frame = this.add
        .rectangle(x, 335, 340, 390, COLORS.panel, 0.94)
        .setStrokeStyle(2, character.id === selected ? COLORS.gold : COLORS.border);
      frames.set(character.id, frame);
      const isHaunted = character.id === 'haunted';
      this.add
        .image(x, 235, character.texture)
        .setDisplaySize(isHaunted ? 114 : 125, isHaunted ? 135 : 125)
        .setAlpha(unlocked ? 1 : 0.25);
      this.add
        .text(x, 320, unlocked ? character.name.toUpperCase() : 'LOCKED SOUL', {
          fontFamily: 'Cinzel, serif',
          fontSize: '20px',
          color: unlocked ? '#dce8ed' : '#8d7376',
        })
        .setOrigin(0.5);
      this.add
        .text(x, 348, character.title, {
          fontFamily: 'Cinzel, serif',
          fontSize: '12px',
          color: '#c7a76a',
        })
        .setOrigin(0.5);
      this.add
        .text(x, 392, unlocked ? character.flavorText : 'This soul remains beyond reach.', {
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          color: '#aebfc6',
          align: 'center',
          wordWrap: { width: 285 },
        })
        .setOrigin(0.5);
      const starter = WEAPONS[character.starterWeapon].name;
      const stats = describeStats(character.id);
      this.add
        .text(x, 475, unlocked ? `STARTER: ${starter}\n${stats}` : character.unlockCondition.description, {
          fontFamily: 'Cinzel, serif',
          fontSize: '12px',
          color: unlocked ? '#8edfff' : '#c98a8f',
          align: 'center',
          lineSpacing: 7,
          wordWrap: { width: 285 },
        })
        .setOrigin(0.5);

      if (unlocked) {
        frame.setInteractive({ useHandCursor: true });
        frame.on('pointerdown', () => {
          selected = character.id;
          for (const [id, card] of frames) {
            card.setStrokeStyle(2, id === selected ? COLORS.gold : COLORS.border);
          }
        });
      }
    });

    const edictContainer = this.add.container(0, 0).setVisible(false);
    edictContainer.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05070a, 0.95));
    const titleText = addTitle(this, GAME_WIDTH / 2, 120, 'NEW GAME PLUS', 32);
    edictContainer.add(titleText);
    
    let multiplierText = this.add.text(GAME_WIDTH / 2, 170, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '18px',
      color: '#d7bd82',
    }).setOrigin(0.5);
    edictContainer.add(multiplierText);

    const updateMultiplier = () => {
      let bonus = 0;
      selectedEdicts.forEach((id) => { bonus += EDICTS[id].soulMultiplierBonus; });
      multiplierText.setText(`SOUL MULTIPLIER: ${(100 + bonus * 100).toFixed(0)}%`);
    };
    updateMultiplier();

    Object.values(EDICTS).forEach((edict, i) => {
      const y = 250 + i * 50;
      const text = this.add.text(GAME_WIDTH / 2, y, `[${selectedEdicts.has(edict.id) ? 'X' : ' '}] ${edict.name}`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        color: '#8edfff',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      text.on('pointerdown', () => {
        if (selectedEdicts.has(edict.id)) selectedEdicts.delete(edict.id);
        else selectedEdicts.add(edict.id);
        text.setText(`[${selectedEdicts.has(edict.id) ? 'X' : ' '}] ${edict.name}`);
        updateMultiplier();
      });
      edictContainer.add(text);
      
      edictContainer.add(this.add.text(GAME_WIDTH / 2, y + 22, edict.description, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#aebfc6',
      }).setOrigin(0.5));
    });

    const enterButton = addButton(this, GAME_WIDTH / 2, 585, 'ENTER THE TRIAL', () => {
      save.selectedCharacter = selected;
      save.ngPlusEdicts = [...selectedEdicts];
      writeSave(save);
      this.scene.start('GameScene', { characterId: selected, isNgPlus, edicts: save.ngPlusEdicts });
    }, 330);

    const returnButton = addButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 55, 'RETURN', () => this.scene.start('MainMenuScene'), 250);

    if (save.hasCompletedGame) {
      const ngToggle = addButton(this, GAME_WIDTH / 2 + 350, 585, 'NG+: OFF', () => {
        isNgPlus = !isNgPlus;
        (ngToggle.getAt(1) as Phaser.GameObjects.Text).setText(isNgPlus ? 'NG+: ON' : 'NG+: OFF');
        edictContainer.setVisible(isNgPlus);
        (enterButton.getAt(1) as Phaser.GameObjects.Text).setText(isNgPlus ? 'BEGIN NG+ TRIAL' : 'ENTER THE TRIAL');
      }, 200);
      
      const ngPlusInfo = this.add.text(GAME_WIDTH / 2 + 350, 625, 'Unlocks new rewards', {
         fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#c7a76a'
      }).setOrigin(0.5);
      
      enterButton.setDepth(100);
      returnButton.setDepth(100);
      ngToggle.setDepth(100);
      ngPlusInfo.setDepth(100);
    }
  }
}

function describeStats(id: CharacterId): string {
  if (id === 'the-penitent') {
    return '+40 HP   -15% SPEED   +10% DAMAGE';
  }
  if (id === 'ashwalker') {
    return '-25 HP   +25% SPEED   +15% PICKUP';
  }
  return 'BALANCED STATS';
}
