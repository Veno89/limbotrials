import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { audio } from '../systems/AudioSystem';
import { loadSave, writeSave } from '../systems/SaveSystem';
import type { SaveData } from '../types/gameTypes';
import { addButton, addTitle } from '../ui/uiHelpers';

interface SettingsSceneData {
  returnScene?: string;
  returnData?: object;
}

export class SettingsScene extends Phaser.Scene {
  private returnScene = 'MainMenuScene';
  private returnData?: object;

  constructor() {
    super('SettingsScene');
  }

  init(data: SettingsSceneData): void {
    this.returnScene = data.returnScene ?? 'MainMenuScene';
    this.returnData = data.returnData;
  }

  create(): void {
    const save = loadSave();
    audio.configure(save.settings);
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.3);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020506, 0.76).setOrigin(0);
    addTitle(this, GAME_WIDTH / 2, 72, 'SETTINGS', 38);

    this.addSettingRow(175, 'SCREEN SHAKE', 'Camera impact feedback.', this.toggleLabel(save.settings.screenShake), () => {
      save.settings.screenShake = !save.settings.screenShake;
      this.persistAndRestart(save);
    });
    this.addSettingRow(265, 'PARTICLES', 'Death motes and impact fragments.', this.toggleLabel(save.settings.particles), () => {
      save.settings.particles = !save.settings.particles;
      this.persistAndRestart(save);
    });
    this.addSettingRow(355, 'MASTER VOLUME', 'All procedural audio.', this.volumeLabel(save.settings.masterVolume), () => {
      save.settings.masterVolume = this.nextVolume(save.settings.masterVolume);
      this.persistAndRestart(save);
    });
    this.addSettingRow(445, 'MUSIC VOLUME', 'Low Limbo ambience.', this.volumeLabel(save.settings.musicVolume), () => {
      save.settings.musicVolume = this.nextVolume(save.settings.musicVolume);
      this.persistAndRestart(save);
    });
    this.addSettingRow(535, 'EFFECTS VOLUME', 'Combat and interface tones.', this.volumeLabel(save.settings.effectsVolume), () => {
      save.settings.effectsVolume = this.nextVolume(save.settings.effectsVolume);
      this.persistAndRestart(save);
    });
    addButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 52, 'RETURN', () => {
      this.scene.start(this.returnScene, this.returnData);
    });
  }

  private addSettingRow(
    y: number,
    label: string,
    description: string,
    value: string,
    onClick: () => void,
  ): void {
    this.add
      .rectangle(GAME_WIDTH / 2, y, 760, 72, COLORS.panel, 0.96)
      .setStrokeStyle(2, COLORS.border);
    this.add
      .text(292, y - 16, label, {
        fontFamily: 'Cinzel, serif',
        fontSize: '18px',
        color: '#dce8ed',
      })
      .setOrigin(0, 0.5);
    this.add
      .text(292, y + 17, description, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#91a4ac',
      })
      .setOrigin(0, 0.5);
    addButton(this, 895, y, value, onClick, 190);
  }

  private persistAndRestart(save: SaveData): void {
    writeSave(save);
    audio.configure(save.settings);
    this.scene.restart({ returnScene: this.returnScene, returnData: this.returnData });
  }

  private toggleLabel(enabled: boolean): string {
    return enabled ? 'ENABLED' : 'DISABLED';
  }

  private volumeLabel(volume: number): string {
    return `${Math.round(volume * 100)}%`;
  }

  private nextVolume(volume: number): number {
    return volume <= 0 ? 1 : Math.max(0, Math.round((volume - 0.25) * 100) / 100);
  }
}
