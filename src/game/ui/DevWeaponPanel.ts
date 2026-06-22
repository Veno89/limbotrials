import Phaser from 'phaser';
import { COLORS } from '../constants';
import { WEAPONS } from '../data/weapons';
import { EVOLUTION_READY_LEVEL, type UpgradeId, type WeaponId } from '../types/gameTypes';
import { devWeaponActionState, getDevWeaponProgression } from '../systems/devWeaponModel';
import type { RunState } from '../systems/RunState';

interface DevWeaponPanelCallbacks {
  addWeapon: (id: WeaponId) => boolean;
  applyUpgrade: (id: UpgradeId) => boolean;
  selectWeapon: (id: WeaponId) => void;
  notify: (message: string) => void;
  rerender: () => void;
}

export class DevWeaponPanel {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly content: Phaser.GameObjects.Container,
    private readonly run: RunState,
    private readonly selectedWeapon: WeaponId,
    private readonly callbacks: DevWeaponPanelCallbacks,
  ) {}

  render(): void {
    this.renderWeaponSelectors();
    this.renderSelectedWeapon();
  }

  private renderWeaponSelectors(): void {
    Object.values(WEAPONS).forEach((weapon, index) => {
      const x = 205 + (index % 2) * 220;
      const y = 288 + Math.floor(index / 2) * 50;
      const equipped = this.run.weapons.has(weapon.id);
      this.addButton(
        x,
        y,
        200,
        `${equipped ? `LV ${this.run.getWeaponState(weapon.id).level}` : '+'}  ${weapon.name}`,
        () => {
          this.callbacks.selectWeapon(weapon.id);
          this.callbacks.rerender();
        },
        weapon.id === this.selectedWeapon,
      );
    });
  }

  private renderSelectedWeapon(): void {
    const progression = getDevWeaponProgression(this.selectedWeapon);
    const equipped = this.run.weapons.has(this.selectedWeapon);
    const level = equipped ? this.run.getWeaponState(this.selectedWeapon).level : 0;
    const action = devWeaponActionState(equipped, level, this.run.weapons.size, this.run.getWeaponCap());
    const panel = this.scene.add
      .rectangle(855, 420, 500, 330, COLORS.panel, 0.96)
      .setStrokeStyle(2, COLORS.border);
    const icon = this.scene.add
      .image(675, 304, progression.weapon.iconTexture)
      .setDisplaySize(72, 72);
    const title = this.scene.add
      .text(735, 283, progression.weapon.name.toUpperCase(), {
        fontFamily: 'Cinzel, serif',
        fontSize: '18px',
        color: '#e4edf1',
      })
      .setOrigin(0, 0.5);
    const status = this.scene.add
      .text(
        735,
        312,
        equipped
          ? action.evolved
            ? `LEVEL ${level} / EVOLVED: ${progression.weapon.evolution.name.toUpperCase()}`
            : `LEVEL ${level} / ${level === EVOLUTION_READY_LEVEL ? 'EVOLUTION READY' : 'UNEVOLVED'}`
          : `NOT EQUIPPED / ${this.run.weapons.size}/${this.run.getWeaponCap()} WEAPONS`,
        {
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: action.canEvolve ? '#d8c49b' : '#8edfff',
        },
      )
      .setOrigin(0, 0.5);
    this.content.add([panel, icon, title, status]);

    if (equipped) {
      const stats = this.run.getWeaponState(this.selectedWeapon).stats;
      this.content.add(
        this.scene.add
          .text(
            855,
            350,
            `DMG ${Math.round(stats.damage)}   CD ${(stats.cooldownMs / 1000).toFixed(2)}s   COUNT ${Math.floor(
              stats.projectileCount,
            )}\nAREA ${Math.round(stats.area)}   RANGE ${Math.round(stats.range)}   PIERCE ${Math.floor(stats.pierce)}`,
            {
              fontFamily: 'Consolas, monospace',
              fontSize: '12px',
              color: '#9fb8c2',
              align: 'center',
              lineSpacing: 5,
            },
          )
          .setOrigin(0.5),
      );
    }

    this.addButton(720, 407, 190, action.canAdd ? 'ADD WEAPON' : equipped ? 'EQUIPPED' : 'WEAPON CAP REACHED', () => {
      const applied = this.callbacks.addWeapon(this.selectedWeapon);
      this.callbacks.notify(applied ? `${progression.weapon.name} added.` : `${progression.weapon.name} could not be added.`);
      this.callbacks.rerender();
    }, equipped, action.canAdd);
    this.addButton(930, 407, 190, '+1 LEVEL', () => this.applyLevel(), false, action.canLevel);
    this.addButton(720, 455, 190, 'READY TO LEVEL 6', () => this.levelToReady(), false, action.canLevel);
    this.addButton(
      930,
      455,
      190,
      action.evolved ? 'EVOLVED' : `EVOLVE: ${progression.weapon.evolution.name}`,
      () => this.applyEvolution(),
      action.evolved,
      action.canEvolve,
    );

    progression.focusedUpgrades.slice(0, 4).forEach((upgrade, index) => {
      const stacks = this.run.upgradeStacks.get(upgrade.id) ?? 0;
      const canApply = equipped && level !== EVOLUTION_READY_LEVEL && stacks < upgrade.maxStacks;
      this.addButton(
        720 + (index % 2) * 210,
        515 + Math.floor(index / 2) * 48,
        190,
        `${upgrade.name} ${stacks}/${upgrade.maxStacks}`,
        () => {
          const applied = this.callbacks.applyUpgrade(upgrade.id);
          this.callbacks.notify(applied ? `${upgrade.name} applied.` : `${upgrade.name} could not apply.`);
          this.callbacks.rerender();
        },
        stacks >= upgrade.maxStacks,
        canApply,
      );
    });
  }

  private applyLevel(): void {
    const levelUpgrade = getDevWeaponProgression(this.selectedWeapon).level;
    const applied = this.callbacks.applyUpgrade(levelUpgrade.id);
    this.callbacks.notify(applied ? `${levelUpgrade.name} applied.` : `${levelUpgrade.name} could not apply.`);
    this.callbacks.rerender();
  }

  private levelToReady(): void {
    const progression = getDevWeaponProgression(this.selectedWeapon);
    const levelUpgrade = progression.level;
    let applied = 0;
    while (
      this.run.weapons.has(this.selectedWeapon) &&
      this.run.getWeaponState(this.selectedWeapon).level < EVOLUTION_READY_LEVEL &&
      this.callbacks.applyUpgrade(levelUpgrade.id)
    ) {
      applied += 1;
    }
    this.callbacks.notify(applied > 0 ? `${progression.weapon.name} advanced to level 6.` : 'Weapon could not advance.');
    this.callbacks.rerender();
  }

  private applyEvolution(): void {
    const evolution = getDevWeaponProgression(this.selectedWeapon).evolution;
    const applied = this.callbacks.applyUpgrade(evolution.id);
    this.callbacks.notify(applied ? `${evolution.name} applied.` : `${evolution.name} could not apply.`);
    this.callbacks.rerender();
  }

  private addButton(
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void,
    active = false,
    enabled = true,
  ): void {
    const background = this.scene.add
      .rectangle(x, y, width, 38, active ? COLORS.panelLight : COLORS.panel, enabled ? 0.96 : 0.42)
      .setStrokeStyle(2, active ? COLORS.gold : enabled ? COLORS.border : 0x394047);
    const text = this.scene.add
      .text(x, y, label.toUpperCase(), {
        fontFamily: 'Cinzel, serif',
        fontSize: '10px',
        color: enabled ? (active ? '#f0d8a0' : '#dce8ed') : '#627078',
        align: 'center',
        wordWrap: { width: width - 12 },
      })
      .setOrigin(0.5);
    if (enabled) {
      background.setInteractive({ useHandCursor: true });
      background.on('pointerdown', onClick);
    }
    this.content.add([background, text]);
  }
}
