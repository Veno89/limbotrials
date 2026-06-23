import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../constants';
import { WEAPONS } from '../data/weapons';
import type { RunState } from '../systems/RunState';
import type { WeaponSystem } from '../systems/WeaponSystem';
import type { WeaponId } from '../types/gameTypes';
import { MAX_WEAPON_LEVEL } from '../types/gameTypes';

interface WeaponSlot {
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Rectangle;
  cooldownShade: Phaser.GameObjects.Rectangle;
  cooldownText: Phaser.GameObjects.Text;
  readyGlow: Phaser.GameObjects.Arc;
  levelText: Phaser.GameObjects.Text;
}

export class WeaponActionBar {
  private readonly slots = new Map<WeaponId, WeaponSlot>();
  private readonly y = 624;
  private readonly spacing = 82;
  private readonly shortCooldownLabelThresholdMs = 1000;
  private readonly decimalCooldownLabelThresholdMs = 1800;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly weapons: WeaponSystem,
  ) {
    scene.add
      .text(GAME_WIDTH / 2, this.y - 51, 'ARSENAL', {
        fontFamily: 'Cinzel, serif',
        fontSize: '11px',
        color: '#82949b',
        stroke: '#030506',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(155);
    this.syncSlots();
  }

  update(time: number): void {
    this.syncSlots();
    for (const [id, slot] of this.slots) {
      const cooldown = this.weapons.getCooldownState(id, time);
      const cooldownLabel = this.formatCooldownLabel(cooldown.remainingMs, cooldown.durationMs);
      slot.cooldownShade.setVisible(!cooldown.ready);
      slot.cooldownShade.displayHeight = 50 * cooldown.ratio;
      slot.cooldownText
        .setVisible(cooldownLabel.length > 0)
        .setText(cooldownLabel);
      slot.readyGlow.setAlpha(cooldown.ready ? 0.18 + Math.sin(time * 0.006) * 0.06 : 0);
      const level = this.run.weapons.getState(id).level;
      const evolved = level >= MAX_WEAPON_LEVEL;
      slot.frame.setStrokeStyle(
        evolved ? 3 : 2,
        evolved ? COLORS.gold : cooldown.ready ? COLORS.soul : COLORS.border,
        cooldown.ready || evolved ? 0.9 : 0.6,
      );
      slot.levelText.setText(evolved ? 'EVOLVED' : `LV ${level}`).setColor(evolved ? '#e2c988' : '#d9edf4');
    }
  }

  private syncSlots(): void {
    let changed = false;
    for (const id of this.run.weapons.equipped) {
      if (!this.slots.has(id)) {
        this.slots.set(id, this.createSlot(id));
        changed = true;
      }
    }
    for (const [id, slot] of this.slots) {
      if (!this.run.weapons.equipped.has(id)) {
        slot.container.destroy();
        this.slots.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.layoutSlots();
    }
  }

  private createSlot(id: WeaponId): WeaponSlot {
    const definition = WEAPONS[id];
    const readyGlow = this.scene.add.circle(0, 0, 35, COLORS.soul, 0.2);
    const frame = this.scene.add.rectangle(0, 0, 66, 66, COLORS.panel, 0.96).setStrokeStyle(2, COLORS.border);
    const icon = this.scene.add.image(0, -2, definition.iconTexture).setDisplaySize(48, 48);
    const cooldownShade = this.scene.add
      .rectangle(0, 25, 50, 50, 0x020405, 0.46)
      .setOrigin(0.5, 1)
      .setVisible(false);
    const cooldownText = this.scene.add
      .text(0, 21, '', {
        fontFamily: 'Cinzel, serif',
        fontSize: '10px',
        color: '#d4e5ea',
        backgroundColor: '#04080a',
        padding: { x: 4, y: 1 },
        stroke: '#020405',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setAlpha(0.82)
      .setVisible(false);
    const name = this.scene.add
      .text(0, 37, definition.name.toUpperCase(), {
        fontFamily: 'Cinzel, serif',
        fontSize: '8px',
        color: '#a8bbc2',
        align: 'center',
        lineSpacing: -2,
        wordWrap: { width: 74 },
        stroke: '#020405',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0);
    const levelText = this.scene.add
      .text(25, -25, `LV ${this.run.weapons.getState(id).level}`, {
        fontFamily: 'Cinzel, serif',
        fontSize: '9px',
        color: '#d9edf4',
        backgroundColor: '#081014',
        padding: { x: 3, y: 2 },
      })
      .setOrigin(1, 0);
    const container = this.scene.add
      .container(GAME_WIDTH / 2, this.y, [readyGlow, frame, icon, cooldownShade, cooldownText, name, levelText])
      .setScrollFactor(0)
      .setDepth(155)
      .setScale(0.25)
      .setAlpha(0);
    this.scene.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 220,
      ease: 'Back.Out',
    });
    return { container, frame, cooldownShade, cooldownText, readyGlow, levelText };
  }

  private layoutSlots(): void {
    const ordered = [...this.run.weapons.equipped].filter((id) => this.slots.has(id));
    const startX = GAME_WIDTH / 2 - ((ordered.length - 1) * this.spacing) / 2;
    ordered.forEach((id, index) => {
      const slot = this.slots.get(id)!;
      this.scene.tweens.add({
        targets: slot.container,
        x: startX + index * this.spacing,
        duration: 180,
        ease: 'Cubic.Out',
      });
    });
  }

  private formatCooldownLabel(remainingMs: number, durationMs: number): string {
    if (remainingMs <= 0) {
      return '';
    }
    if (remainingMs >= this.shortCooldownLabelThresholdMs) {
      return `${Math.ceil(remainingMs / 1000)}`;
    }
    if (durationMs >= this.decimalCooldownLabelThresholdMs && remainingMs >= 250) {
      return `${(remainingMs / 1000).toFixed(1)}`;
    }
    return '';
  }
}
