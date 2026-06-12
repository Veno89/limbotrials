import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../constants';
import type { RunState } from '../systems/RunState';
import type { WeaponId } from '../types/gameTypes';
import { buildStatsPanelModel, type WeaponStatDisplay } from './statsPanelModel';

interface WeaponCard {
  container: Phaser.GameObjects.Container;
  title: Phaser.GameObjects.Text;
  body: Phaser.GameObjects.Text;
}

export interface StatsPanelOptions {
  depth?: number;
}

export class StatsPanel {
  private readonly root: Phaser.GameObjects.Container;
  private readonly toggleBackground: Phaser.GameObjects.Rectangle;
  private readonly toggleText: Phaser.GameObjects.Text;
  private readonly generalText: Phaser.GameObjects.Text;
  private readonly synergyText: Phaser.GameObjects.Text;
  private readonly weaponRoot: Phaser.GameObjects.Container;
  private readonly cards = new Map<WeaponId, WeaponCard>();
  private open = false;
  private nextRefreshAt = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly run: RunState,
    options: StatsPanelOptions = {},
  ) {
    const depth = options.depth ?? 220;
    const toggle = this.createToggle();
    toggle.setScrollFactor(0).setDepth(depth + 1);
    this.toggleBackground = toggle.getAt(0) as Phaser.GameObjects.Rectangle;
    this.toggleText = toggle.getAt(1) as Phaser.GameObjects.Text;

    const background = scene.add
      .rectangle(0, 0, 660, 596, 0x05090c, 0.98)
      .setOrigin(0)
      .setStrokeStyle(2, COLORS.soul, 0.8)
      .setInteractive();
    const title = scene.add.text(22, 18, 'CURRENT BUILD', {
      fontFamily: 'Cinzel, serif',
      fontSize: '22px',
      color: '#e5f2f6',
    });
    const hint = scene.add
      .text(638, 22, 'LIVE VALUES', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#78919b',
      })
      .setOrigin(1, 0);
    this.generalText = scene.add.text(22, 58, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#bfd0d7',
      lineSpacing: 4,
    });
    this.synergyText = scene.add.text(22, 174, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '11px',
      color: '#d8c187',
    });
    const weaponHeading = scene.add.text(22, 200, 'EQUIPPED WEAPONS', {
      fontFamily: 'Cinzel, serif',
      fontSize: '13px',
      color: '#8ea5ae',
    });
    this.weaponRoot = scene.add.container(0, 0);
    this.root = scene.add
      .container(GAME_WIDTH - 700, 72, [
        background,
        title,
        hint,
        this.generalText,
        this.synergyText,
        weaponHeading,
        this.weaponRoot,
      ])
      .setScrollFactor(0)
      .setDepth(depth)
      .setVisible(false);

    const keyboard = scene.input.keyboard;
    const toggleWithKeyboard = (event: KeyboardEvent): void => {
      event.preventDefault();
      this.toggle();
    };
    keyboard?.on('keydown-TAB', toggleWithKeyboard);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard?.off('keydown-TAB', toggleWithKeyboard));
  }

  update(time: number): void {
    if (!this.open || time < this.nextRefreshAt) {
      return;
    }
    this.nextRefreshAt = time + 250;
    this.refresh();
  }

  private createToggle(): Phaser.GameObjects.Container {
    const background = this.scene.add
      .rectangle(0, 0, 176, 38, COLORS.panel, 0.96)
      .setStrokeStyle(2, COLORS.border)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(0, 0, 'STATS [TAB]', {
        fontFamily: 'Cinzel, serif',
        fontSize: '13px',
        color: '#dce8ed',
      })
      .setOrigin(0.5);
    background.on('pointerover', () => background.setStrokeStyle(2, COLORS.soul));
    background.on('pointerout', () => background.setStrokeStyle(2, COLORS.border));
    background.on('pointerdown', () => this.toggle());
    return this.scene.add.container(GAME_WIDTH - 128, 100, [background, text]);
  }

  private toggle(): void {
    this.open = !this.open;
    this.root.setVisible(this.open);
    this.toggleBackground.setStrokeStyle(2, this.open ? COLORS.soul : COLORS.border);
    this.toggleText.setText(this.open ? 'CLOSE STATS [TAB]' : 'STATS [TAB]');
    if (this.open) {
      this.refresh();
    }
  }

  private refresh(): void {
    const model = buildStatsPanelModel(this.run);
    const generalLines: string[] = [];
    for (let index = 0; index < model.general.length; index += 2) {
      const left = model.general[index]!;
      const right = model.general[index + 1];
      generalLines.push(
        `${`${left.label} ${left.value}`.padEnd(36)}${right ? `${right.label} ${right.value}` : ''}`,
      );
    }
    this.generalText.setText(generalLines);
    this.synergyText.setText(
      model.synergies.length > 0 ? `ACTIVE SYNERGIES: ${model.synergies.join('  /  ')}` : 'ACTIVE SYNERGIES: NONE',
    );
    this.syncWeaponCards(model.weapons);
  }

  private syncWeaponCards(weapons: WeaponStatDisplay[]): void {
    const equipped = new Set(weapons.map((weapon) => weapon.id));
    for (const [id, card] of this.cards) {
      if (!equipped.has(id)) {
        card.container.destroy();
        this.cards.delete(id);
      }
    }
    weapons.forEach((weapon, index) => {
      const card = this.cards.get(weapon.id) ?? this.createWeaponCard(weapon.id);
      const column = index % 2;
      const row = Math.floor(index / 2);
      card.container.setPosition(18 + column * 318, 225 + row * 118);
      card.title.setText(`${weapon.name}   ${weapon.levelLabel}`);
      card.body.setText(`${weapon.primary}\n${weapon.details}`);
    });
  }

  private createWeaponCard(id: WeaponId): WeaponCard {
    const background = this.scene.add
      .rectangle(0, 0, 306, 108, COLORS.panel, 0.96)
      .setOrigin(0)
      .setStrokeStyle(1, COLORS.border, 0.75);
    const title = this.scene.add.text(12, 10, '', {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      color: '#dce8ed',
    });
    const body = this.scene.add.text(12, 39, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#9fb4bc',
      lineSpacing: 8,
      wordWrap: { width: 282 },
    });
    const container = this.scene.add.container(0, 0, [background, title, body]);
    this.weaponRoot.add(container);
    const card = { container, title, body };
    this.cards.set(id, card);
    return card;
  }
}
