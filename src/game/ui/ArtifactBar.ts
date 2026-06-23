import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import type { RunState } from '../systems/RunState';
import type { ArtifactId, ArtifactDefinition } from '../types/gameTypes';

const RARITY_COLORS = {
  common: 0x637985,
  uncommon: 0x228b22,
  rare: 0x1f75fe,
  legendary: COLORS.gold,
} as const;

interface ArtifactIcon {
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Rectangle;
}

export class ArtifactBar {
  private readonly icons = new Map<ArtifactId, ArtifactIcon>();
  private readonly tooltip: Phaser.GameObjects.Container;
  private readonly tooltipName: Phaser.GameObjects.Text;
  private readonly tooltipRarity: Phaser.GameObjects.Text;
  private readonly tooltipDesc: Phaser.GameObjects.Text;
  private readonly tooltipBack: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;

  private readonly startX = 48;
  private readonly y = 132;
  private readonly spacing = 42;
  private readonly columns = 8;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly run: RunState,
  ) {
    this.title = scene.add
      .text(this.startX, 105, 'ARTIFACTS: NONE', {
        fontFamily: 'Cinzel, serif',
        fontSize: '11px',
        color: '#9fb1b8',
        stroke: '#020405',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(155);

    this.tooltipBack = scene.add.rectangle(0, 0, 260, 80, COLORS.panel, 0.95)
      .setStrokeStyle(2, COLORS.border)
      .setOrigin(0);

    this.tooltipName = scene.add.text(12, 10, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '14px',
      color: '#e2edf1',
      stroke: '#000',
      strokeThickness: 2,
    });

    this.tooltipRarity = scene.add.text(12, 28, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '10px',
      color: '#69d9ff',
    });

    this.tooltipDesc = scene.add.text(12, 44, '', {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      color: '#cbdde5',
      wordWrap: { width: 236 },
      lineSpacing: 2,
    });

    this.tooltip = scene.add.container(0, 0, [
      this.tooltipBack,
      this.tooltipName,
      this.tooltipRarity,
      this.tooltipDesc,
    ])
      .setScrollFactor(0)
      .setDepth(210)
      .setVisible(false);

    this.syncIcons();
  }

  update(): void {
    this.syncIcons();
  }

  private syncIcons(): void {
    let changed = false;
    for (const id of this.run.artifacts.collected) {
      if (!this.icons.has(id)) {
        this.icons.set(id, this.createIcon(id));
        changed = true;
      }
    }

    if (changed) {
      this.layoutIcons();
    }
  }

  private createIcon(id: ArtifactId): ArtifactIcon {
    const definition = this.run.artifacts.getDefinition(id);
    const color = RARITY_COLORS[definition.rarity];

    const back = this.scene.add.rectangle(0, 0, 34, 34, COLORS.panel, 0.9);
    const frame = this.scene.add.rectangle(0, 0, 34, 34, 0, 0).setStrokeStyle(1.5, color, 0.8);
    const icon = this.scene.add.image(0, 0, definition.iconTexture).setDisplaySize(24, 24);

    const container = this.scene.add.container(this.startX, this.y, [back, icon, frame])
      .setScrollFactor(0)
      .setDepth(155)
      .setScale(0)
      .setAlpha(0);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-17, -17, 34, 34),
      Phaser.Geom.Rectangle.Contains,
    );
    container.input!.cursor = 'pointer';
    container.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      this.showTooltip(definition, pointer);
      frame.setStrokeStyle(2.5, color, 1);
    });
    container.on('pointerout', () => {
      this.hideTooltip();
      frame.setStrokeStyle(1.5, color, 0.8);
    });

    this.scene.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.Out',
    });

    return { container, frame };
  }

  private layoutIcons(): void {
    const ordered = Array.from(this.run.artifacts.collected).filter(id => this.icons.has(id));
    this.title.setText(`ARTIFACTS: ${ordered.length}`);
    ordered.forEach((id, index) => {
      const icon = this.icons.get(id)!;
      this.scene.tweens.add({
        targets: icon.container,
        x: this.startX + (index % this.columns) * this.spacing,
        y: this.y + Math.floor(index / this.columns) * this.spacing,
        duration: 200,
        ease: 'Cubic.Out',
      });
    });
  }

  private showTooltip(art: ArtifactDefinition, pointer: Phaser.Input.Pointer): void {
    const rarityLabel = art.curse ? `${art.rarity.toUpperCase()}  /  CURSE +${art.curse.curseGain}` : art.rarity.toUpperCase();
    const rarityColor = '#' + RARITY_COLORS[art.rarity].toString(16).padStart(6, '0');

    this.tooltipName.setText(art.name);
    this.tooltipRarity.setText(rarityLabel).setColor(rarityColor);
    this.tooltipDesc.setText(art.description);

    const height = Math.max(74, 54 + this.tooltipDesc.height);
    this.tooltipBack.setSize(260, height);
    this.tooltipBack.setStrokeStyle(2, RARITY_COLORS[art.rarity]);

    let tx = pointer.x + 12;
    let ty = pointer.y + 12;
    if (tx + 260 > GAME_WIDTH - 8) {
      tx = pointer.x - 272;
    }
    if (ty + height > GAME_HEIGHT - 8) {
      ty = pointer.y - height - 12;
    }
    tx = Phaser.Math.Clamp(tx, 8, GAME_WIDTH - 268);
    ty = Phaser.Math.Clamp(ty, 8, GAME_HEIGHT - height - 8);

    this.tooltip.setPosition(tx, ty).setVisible(true);
  }

  private hideTooltip(): void {
    this.tooltip.setVisible(false);
  }

  destroy(): void {
    for (const icon of this.icons.values()) {
      icon.container.destroy();
    }
    this.icons.clear();
    this.tooltip.destroy();
    this.title.destroy();
  }
}
