import Phaser from 'phaser';
import { COLORS } from '../constants';
import type { PowerupSystem } from '../systems/PowerupSystem';
import type { RunState } from '../systems/RunState';
import type { PowerupId } from '../types/gameTypes';

interface BuffRow {
  root: Phaser.GameObjects.Container;
  fill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export class PlayerStatusVisualSystem {
  private readonly shieldAura: Phaser.GameObjects.Arc;
  private readonly shieldLabel: Phaser.GameObjects.Text;
  private readonly buffRows = new Map<PowerupId, BuffRow>();
  private previousShield = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly run: RunState,
    private readonly powerups: PowerupSystem,
  ) {
    this.shieldAura = scene.add
      .circle(player.x, player.y, 45, COLORS.soul, 0.07)
      .setStrokeStyle(3, 0xdaf7ff, 0.9)
      .setDepth(37)
      .setVisible(false);
    this.shieldLabel = scene.add
      .text(player.x, player.y - 53, '', {
        fontFamily: 'Cinzel, serif',
        fontSize: '9px',
        color: '#daf7ff',
        stroke: '#020405',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(38)
      .setVisible(false);
  }

  update(time: number): void {
    this.updateShield(time);
    this.updateBuffs();
  }

  private updateShield(time: number): void {
    const visible = this.run.shield > 0;
    this.shieldAura
      .setPosition(this.player.x, this.player.y)
      .setVisible(visible)
      .setAlpha(visible ? 0.72 + Math.sin(time * 0.008) * 0.12 : 0);
    this.shieldLabel
      .setPosition(this.player.x, this.player.y - 53)
      .setText(`SHIELD ${Math.ceil(this.run.shield)}`)
      .setVisible(visible);

    if (visible && this.previousShield <= 0) {
      this.shieldAura.setScale(0.7);
      this.scene.tweens.add({
        targets: this.shieldAura,
        scale: 1,
        duration: 260,
        ease: 'Back.Out',
      });
    }
    this.previousShield = this.run.shield;
  }

  private updateBuffs(): void {
    const active = this.powerups.getActiveBuffs();
    const activeIds = new Set(active.map((buff) => buff.id));
    for (const [id, row] of this.buffRows) {
      if (!activeIds.has(id)) {
        row.root.destroy();
        this.buffRows.delete(id);
      }
    }

    active.forEach((buff, index) => {
      const row = this.buffRows.get(buff.id) ?? this.createBuffRow(buff.id, buff.color);
      const ratio = Phaser.Math.Clamp(buff.remainingMs / buff.durationMs, 0, 1);
      row.root.setPosition(this.player.x, this.player.y + 58 + index * 18);
      row.fill.displayWidth = 86 * ratio;
      row.label.setText(`${buff.label} ${Math.ceil(buff.remainingMs / 1000)}s`);
    });
  }

  private createBuffRow(id: PowerupId, color: number): BuffRow {
    const back = this.scene.add
      .rectangle(0, 0, 90, 8, 0x020405, 0.9)
      .setStrokeStyle(1, COLORS.border, 0.75);
    const fill = this.scene.add
      .rectangle(-43, 0, 86, 4, color, 0.95)
      .setOrigin(0, 0.5);
    const label = this.scene.add
      .text(0, -12, '', {
        fontFamily: 'Cinzel, serif',
        fontSize: '8px',
        color: '#eef7fa',
        stroke: '#020405',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    const root = this.scene.add
      .container(this.player.x, this.player.y + 58, [back, fill, label])
      .setDepth(38);
    const row = { root, fill, label };
    this.buffRows.set(id, row);
    return row;
  }
}
