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
import type { GameplayEffectRole } from '../vfx/GameplayEffectRegistry';

type DevModeTab = 'loadout' | 'upgrades' | 'artifacts' | 'spawns' | 'tools';

export interface DevModeSceneData {
  run: RunState;
  getInvincible: () => boolean;
  setInvincible: (enabled: boolean) => void;
  weapons: (id: WeaponId) => boolean;
  upgrades: (id: UpgradeId) => boolean;
  applyArtifact: (id: ArtifactId) => boolean;
  grantPowerup: (id: PowerupId) => void;
  spawnEnemy: (id: EnemyId) => void;
  spawnDummy: () => void;
  spawnChest: () => void;
  openShop: () => void;
  healFull: () => void;
  grantShield: () => void;
  getGameSpeed: () => number;
  setGameSpeed: (scale: number) => void;
  getGameplayGuides: () => boolean;
  toggleGameplayGuides: () => void;
  triggerEffect: (role: GameplayEffectRole) => void;
  resetEncounter: () => void;
  forceOutcome: (victory: boolean) => void;
  resumeGame: () => void;
}

const PAGE_SIZE = 28; // 4 columns * 7 rows

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
    document.body.dataset.devMode = 'open';
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      delete document.body.dataset.devMode;
      delete document.body.dataset.devGameSpeed;
      delete document.body.dataset.devGameplayGuides;
    });
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020405, 0.78).setOrigin(0).setInteractive();
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1700, 950, COLORS.panel, 0.98)
      .setStrokeStyle(2, COLORS.gold);
      
    addTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 425, 'LOCAL DEV MODE', 31).setColor('#f0d8a0');
    
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 380, 'DEV SERVER ONLY. SETTINGS LIVE IN LOCALSTORAGE, NOT GIT.', {
        fontFamily: 'Cinzel, serif',
        fontSize: '12px',
        color: '#91a5ad',
      })
      .setOrigin(0.5);
      
    this.statusText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 430, 'READY', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#9fb8c2',
      })
      .setOrigin(0.5);
      
    this.input.keyboard?.once('keydown-ESC', () => this.close());
    this.render();
  }

  private render(): void {
    document.body.dataset.devGameSpeed = String(this.dataRef.getGameSpeed());
    document.body.dataset.devGameplayGuides = String(this.dataRef.getGameplayGuides());
    this.content?.destroy(true);
    // Align the container to the top-left of the modal
    this.content = this.add.container(GAME_WIDTH / 2 - 850, GAME_HEIGHT / 2 - 475);
    
    this.renderTabs();
    this.renderHotkeys();
    
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
    } else if (this.tab === 'spawns') {
      this.renderSpawns();
    } else {
      this.renderTools();
    }
    
    this.addButton(1550, 890, 200, 'CLOSE', () => this.close());
  }

  private renderTabs(): void {
    const tabs: Array<[DevModeTab, string]> = [
      ['loadout', 'Weapons'],
      ['upgrades', 'Advanced'],
      ['artifacts', 'Artifacts'],
      ['spawns', 'Spawns'],
      ['tools', 'Tools'],
    ];
    tabs.forEach(([id, label], index) => {
      const selected = this.tab === id;
      this.addButton(190 + index * 190, 130, 174, label.toUpperCase(), () => {
        this.tab = id;
        this.page = 0;
        this.render();
      }, selected);
    });
  }

  private renderHotkeys(): void {
    this.content?.add(
      this.add.text(1370, 130, 'F11 CONTENT LAB  |  F8 TELEMETRY', {
        fontFamily: 'Consolas, monospace',
        fontSize: '12px',
        color: '#70828a',
      }).setOrigin(0.5)
    );
  }

  private renderLoadout(): void {
    this.addButton(
      220,
      200,
      240,
      `INVINCIBLE: ${this.dataRef.getInvincible() ? 'ON' : 'OFF'}`,
      () => {
        this.dataRef.setInvincible(!this.dataRef.getInvincible());
        this.setStatus(`Invincible ${this.dataRef.getInvincible() ? 'enabled' : 'disabled'}.`);
        this.render();
      },
      this.dataRef.getInvincible(),
    );
    this.addButton(480, 200, 240, 'FULL HEAL', () => {
      this.dataRef.healFull();
      this.setStatus('Health restored.');
    });
    this.addButton(740, 200, 240, 'GRANT SHIELD', () => {
      this.dataRef.grantShield();
      this.setStatus('Shield granted.');
    });
    this.addButton(1000, 200, 240, 'SPAWN CHEST', () => {
      this.dataRef.spawnChest();
      this.setStatus('Reliquary spawned if the chest system is active.');
    });

    new DevWeaponPanel(this, this.content!, this.dataRef.run, this.selectedWeapon, {
      weapons: (id) => this.dataRef.weapons(id),
      upgrades: (id) => this.dataRef.upgrades(id),
      selectWeapon: (id) => {
        this.selectedWeapon = id;
      },
      notify: (message) => this.setStatus(message),
      rerender: () => this.render(),
    }).render();
  }

  private renderSpawns(): void {
    this.addButton(220, 200, 240, 'TARGET DUMMY', () => {
      this.dataRef.spawnDummy();
      this.setStatus('Target dummy spawned.');
    }, true);
    this.addButton(480, 200, 240, 'LIMBO WARDEN', () => this.spawnEnemy('limbo-warden'));
    this.addButton(740, 200, 240, 'GRAVE FRENZY', () => this.grantPowerup('grave-frenzy'));
    this.addButton(1000, 200, 240, 'SOUL VACUUM', () => this.grantPowerup('soul-vacuum'));
    this.addButton(1260, 200, 240, 'OPEN BLOOD MARKET', () => {
      this.dataRef.openShop();
      this.setStatus('Opening the Blood Market.');
    }, true);

    this.renderPaged(
      Object.values(ENEMIES).filter((enemy) => !enemy.boss),
      (enemy) => `${enemy.name} (${enemy.behavior})`,
      (enemy) => this.spawnEnemy(enemy.id),
      280,
    );
  }

  private renderTools(): void {
    this.content?.add(
      this.add.text(130, 195, 'SIMULATION SPEED', {
        fontFamily: 'Cinzel, serif', fontSize: '15px', color: '#d7bd82',
      }),
    );
    ([0.25, 0.5, 1, 2, 4] as const).forEach((speed, index) => {
      this.addButton(220 + index * 220, 250, 190, `${speed}X`, () => {
        this.dataRef.setGameSpeed(speed);
        this.setStatus(`Game speed set to ${speed}x.`);
        this.render();
      }, this.dataRef.getGameSpeed() === speed);
    });
    this.addButton(1320, 250, 260, 'RESET ENCOUNTER', () => {
      this.scene.stop();
      this.dataRef.resetEncounter();
    }, true);

    this.content?.add(
      this.add.text(130, 330, 'SEMANTIC TESLA EFFECT PREVIEW', {
        fontFamily: 'Cinzel, serif', fontSize: '15px', color: '#d7bd82',
      }),
    );
    const roles: Array<[GameplayEffectRole, string]> = [
      ['initialDischarge', 'DISCHARGE'],
      ['beam', 'CHAIN BEAM'],
      ['targetElectricity', 'TARGET ELECTRICITY'],
      ['impact', 'IMPACT'],
      ['finalChain', 'FINAL CHAIN'],
    ];
    roles.forEach(([role, label], index) => {
      this.addButton(220 + index * 270, 385, 245, label, () => {
        this.scene.stop();
        this.dataRef.resumeGame();
        this.dataRef.triggerEffect(role);
      });
    });

    this.addButton(260, 500, 320, `GUIDES: ${this.dataRef.getGameplayGuides() ? 'ON' : 'OFF'}`, () => {
      this.dataRef.toggleGameplayGuides();
      this.setStatus(`Collision and attachment guides ${this.dataRef.getGameplayGuides() ? 'enabled' : 'disabled'}.`);
      this.render();
    }, this.dataRef.getGameplayGuides());
    this.addButton(630, 500, 320, 'FORCE VICTORY', () => {
      this.scene.stop();
      this.dataRef.forceOutcome(true);
    }, true);
    this.addButton(1000, 500, 320, 'FORCE LOSS', () => {
      this.scene.stop();
      this.dataRef.forceOutcome(false);
    }, true);

    this.content?.add(
      this.add.text(130, 590, [
        'DIRECT HOTKEYS WHILE PLAYING',
        '[Shift+R] reset encounter     [[ / ]] game speed',
        '[\\] reset 1x                [V] named Tesla effect',
        '[F] collision/attachment guides',
        '[I] force victory             [O] force loss',
        '[F11] Content Lab             [F12 / `] Dev Mode',
      ].join('\n'), {
        fontFamily: 'Consolas, monospace', fontSize: '14px', color: '#9fb8c2', lineSpacing: 8,
      }),
    );
  }

  private renderPaged<T>(
    items: T[],
    labelFor: (item: T) => string,
    onSelect: (item: T) => void,
    startY = 220,
  ): void {
    const maxPage = Math.max(0, Math.ceil(items.length / PAGE_SIZE) - 1);
    this.page = Phaser.Math.Clamp(this.page, 0, maxPage);
    const visible = items.slice(this.page * PAGE_SIZE, this.page * PAGE_SIZE + PAGE_SIZE);
    
    // 4 columns
    visible.forEach((item, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 325 + col * 350;
      const y = startY + row * 62;
      this.addButton(x, y, 320, labelFor(item).toUpperCase(), () => onSelect(item));
    });
    
    this.addButton(700, 890, 200, 'PREV', () => {
      this.page = Math.max(0, this.page - 1);
      this.render();
    }, false, this.page > 0);
    this.addButton(1000, 890, 200, 'NEXT', () => {
      this.page = Math.min(maxPage, this.page + 1);
      this.render();
    }, false, this.page < maxPage);
    this.content?.add(
      this.add
        .text(850, 890, `${this.page + 1}/${maxPage + 1}`, {
          fontFamily: 'Cinzel, serif',
          fontSize: '14px',
          color: '#91a5ad',
        })
        .setOrigin(0.5),
    );
  }

  private applyUpgrade(id: UpgradeId): void {
    const applied = this.dataRef.upgrades(id);
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
    this.dataRef.resumeGame();
  }
}
