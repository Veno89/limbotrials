import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { ARTIFACTS } from '../data/artifacts';
import { ENEMIES } from '../data/enemies';
import { POWERUPS } from '../data/powerups';
import { UPGRADES } from '../data/upgrades';
import type { ArtifactId, EnemyId, PowerupId, UpgradeId, WeaponId } from '../types/gameTypes';
import type { RunState } from '../systems/RunState';
import { DevWeaponPanel } from '../ui/DevWeaponPanel';
import { addTitle } from '../ui/uiHelpers';

type DevModeTab = 'loadout' | 'upgrades' | 'artifacts' | 'spawns';

export interface DevModeSceneData {
  run: RunState;
  getInvincible: () => boolean;
  setInvincible: (enabled: boolean) => void;
  addWeapon: (id: WeaponId) => boolean;
  applyUpgrade: (id: UpgradeId) => boolean;
  applyArtifact: (id: ArtifactId) => boolean;
  grantPowerup: (id: PowerupId) => void;
  spawnEnemy: (id: EnemyId) => void;
  spawnDummy: () => void;
  spawnChest: () => void;
  openShop: () => void;
  healFull: () => void;
  grantShield: () => void;
}

const PAGE_SIZE = 8;

export class DevModeScene extends Phaser.Scene {
  private dataRef!: DevModeSceneData;
  private tab: DevModeTab = 'loadout';
  private page = 0;
  private selectedWeapon: WeaponId = 'bone-scythe';
  private content?: Phaser.GameObjects.Container;
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super('DevModeScene');
  }

  init(data: DevModeSceneData): void {
    this.dataRef = data;
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020405, 0.78).setOrigin(0).setInteractive();
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1120, 610, COLORS.panel, 0.98)
      .setStrokeStyle(2, COLORS.gold);
    addTitle(this, GAME_WIDTH / 2, 68, 'LOCAL DEV MODE', 31).setColor('#f0d8a0');
    this.add
      .text(GAME_WIDTH / 2, 104, 'DEV SERVER ONLY. SETTINGS LIVE IN LOCALSTORAGE, NOT GIT.', {
        fontFamily: 'Cinzel, serif',
        fontSize: '12px',
        color: '#91a5ad',
      })
      .setOrigin(0.5);
    this.statusText = this.add
      .text(GAME_WIDTH / 2, 644, 'READY', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: '#9fb8c2',
      })
      .setOrigin(0.5);
    this.input.keyboard?.once('keydown-ESC', () => this.close());
    this.render();
  }

  private render(): void {
    this.content?.destroy(true);
    this.content = this.add.container(0, 0);
    this.renderTabs();
    if (this.tab === 'loadout') {
      this.renderLoadout();
    } else if (this.tab === 'upgrades') {
      this.renderPaged(
        Object.values(UPGRADES),
        (upgrade) => `${upgrade.name} (${upgrade.category})`,
        (upgrade) => this.applyUpgrade(upgrade.id),
      );
    } else if (this.tab === 'artifacts') {
      this.renderPaged(
        Object.values(ARTIFACTS),
        (artifact) => `${artifact.name} (${artifact.rarity})`,
        (artifact) => this.applyArtifact(artifact.id),
      );
    } else {
      this.renderSpawns();
    }
    this.addButton(1010, 588, 180, 'CLOSE', () => this.close());
  }

  private renderTabs(): void {
    const tabs: Array<[DevModeTab, string]> = [
      ['loadout', 'Weapons'],
      ['upgrades', 'Advanced'],
      ['artifacts', 'Artifacts'],
      ['spawns', 'Spawns'],
    ];
    tabs.forEach(([id, label], index) => {
      const selected = this.tab === id;
      this.addButton(260 + index * 190, 146, 155, label.toUpperCase(), () => {
        this.tab = id;
        this.page = 0;
        this.render();
      }, selected);
    });
  }

  private renderLoadout(): void {
    this.addButton(
      250,
      205,
      210,
      `INVINCIBLE: ${this.dataRef.getInvincible() ? 'ON' : 'OFF'}`,
      () => {
        this.dataRef.setInvincible(!this.dataRef.getInvincible());
        this.setStatus(`Invincible ${this.dataRef.getInvincible() ? 'enabled' : 'disabled'}.`);
        this.render();
      },
      this.dataRef.getInvincible(),
    );
    this.addButton(500, 205, 210, 'FULL HEAL', () => {
      this.dataRef.healFull();
      this.setStatus('Health restored.');
    });
    this.addButton(750, 205, 210, 'GRANT SHIELD', () => {
      this.dataRef.grantShield();
      this.setStatus('Shield granted.');
    });
    this.addButton(1000, 205, 210, 'SPAWN CHEST', () => {
      this.dataRef.spawnChest();
      this.setStatus('Reliquary spawned if the chest system is active.');
    });

    new DevWeaponPanel(this, this.content!, this.dataRef.run, this.selectedWeapon, {
      addWeapon: (id) => this.dataRef.addWeapon(id),
      applyUpgrade: (id) => this.dataRef.applyUpgrade(id),
      selectWeapon: (id) => {
        this.selectedWeapon = id;
      },
      notify: (message) => this.setStatus(message),
      rerender: () => this.render(),
    }).render();
  }

  private renderSpawns(): void {
    this.addButton(250, 218, 205, 'TARGET DUMMY', () => {
      this.dataRef.spawnDummy();
      this.setStatus('Target dummy spawned.');
    }, true);
    this.addButton(490, 218, 205, 'LIMBO WARDEN', () => this.spawnEnemy('limbo-warden'));
    this.addButton(730, 218, 205, 'GRAVE FRENZY', () => this.grantPowerup('grave-frenzy'));
    this.addButton(970, 218, 205, 'SOUL VACUUM', () => this.grantPowerup('soul-vacuum'));
    this.addButton(250, 272, 205, 'OPEN BLOOD MARKET', () => {
      this.dataRef.openShop();
      this.setStatus('Opening the Blood Market.');
    }, true);

    this.renderPaged(
      Object.values(ENEMIES).filter((enemy) => !enemy.boss),
      (enemy) => `${enemy.name} (${enemy.behavior})`,
      (enemy) => this.spawnEnemy(enemy.id),
      330,
    );
  }

  private renderPaged<T>(
    items: T[],
    labelFor: (item: T) => string,
    onSelect: (item: T) => void,
    startY = 225,
  ): void {
    const maxPage = Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1);
    this.page = Phaser.Math.Clamp(this.page, 0, maxPage);
    const visible = items.slice(this.page * PAGE_SIZE, this.page * PAGE_SIZE + PAGE_SIZE);
    visible.forEach((item, index) => {
      const x = 390 + (index % 2) * 390;
      const y = startY + Math.floor(index / 2) * 62;
      this.addButton(x, y, 345, labelFor(item).toUpperCase(), () => onSelect(item));
    });
    this.addButton(450, 588, 150, 'PREV', () => {
      this.page = Math.max(0, this.page - 1);
      this.render();
    }, false, this.page > 0);
    this.addButton(830, 588, 150, 'NEXT', () => {
      this.page = Math.min(maxPage, this.page + 1);
      this.render();
    }, false, this.page < maxPage);
    this.content?.add(
      this.add
        .text(640, 588, `${this.page + 1}/${maxPage + 1}`, {
          fontFamily: 'Cinzel, serif',
          fontSize: '13px',
          color: '#91a5ad',
        })
        .setOrigin(0.5),
    );
  }

  private applyUpgrade(id: UpgradeId): void {
    const applied = this.dataRef.applyUpgrade(id);
    this.setStatus(applied ? `${UPGRADES[id].name} applied.` : `${UPGRADES[id].name} could not apply.`);
    this.render();
  }

  private applyArtifact(id: ArtifactId): void {
    const applied = this.dataRef.applyArtifact(id);
    this.setStatus(applied ? `${ARTIFACTS[id].name} applied.` : `${ARTIFACTS[id].name} already owned.`);
    this.render();
  }

  private grantPowerup(id: PowerupId): void {
    this.dataRef.grantPowerup(id);
    this.setStatus(`${POWERUPS[id].name} granted.`);
  }

  private spawnEnemy(id: EnemyId): void {
    this.dataRef.spawnEnemy(id);
    this.setStatus(`${ENEMIES[id].name} spawned.`);
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
    const background = this.add
      .rectangle(x, y, width, 42, active ? COLORS.panelLight : COLORS.panel, enabled ? (active ? 0.98 : 0.9) : 0.4)
      .setStrokeStyle(2, active ? COLORS.gold : enabled ? COLORS.border : 0x394047);
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'Cinzel, serif',
        fontSize: '12px',
        color: enabled ? (active ? '#f0d8a0' : '#dce8ed') : '#627078',
        align: 'center',
        wordWrap: { width: width - 18 },
      })
      .setOrigin(0.5);
    if (enabled) {
      background.setInteractive({ useHandCursor: true });
      background.on('pointerdown', onClick);
    }
    this.content?.add([background, text]);
  }

  private setStatus(message: string): void {
    this.statusText?.setText(message.toUpperCase());
  }

  private close(): void {
    this.scene.stop();
  }
}
