import Phaser from 'phaser';
import type { BalancePresetId, WeaponId, UpgradeId } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';
import type { RunState } from './RunState';
import type { UpgradeOfferSystem } from './UpgradeOfferSystem';
import type { ChestSystem } from './ChestSystem';
import { EVOLUTION_READY_LEVEL } from '../types/gameTypes';
import type { PowerupSystem } from './PowerupSystem';

export interface DebugControlActions {
  grantShield(): void;
  forceLoss(): void;
  forceVictory(): void;
  toggleTelemetry(): void;
  resetEncounter(): void;
  setGameSpeed(scale: number): void;
  triggerNamedEffect(): void;
  toggleGameplayGuides(): void;
}

const DEBUG_SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

export class DebugControlsSystem {
  private speedIndex = 2;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly enemies: EnemySystem,
    offers: UpgradeOfferSystem,
    private readonly chests: ChestSystem | undefined,
    private readonly powerups: PowerupSystem,
    private readonly actions: DebugControlActions,
  ) {
    const keyboard = scene.input.keyboard;
    keyboard?.addCapture('F1,F2,F3,F4,F5,F6,F7,F8,F9,F10,F12');
    keyboard?.on('keydown-B', () => enemies.spawnAroundPlayer('limbo-warden', run.elapsedMs, 500));
    keyboard?.on('keydown-P', () => this.spawnStressPack());
    keyboard?.on('keydown-L', () => offers.request('standard'));
    keyboard?.on('keydown-C', () => offers.request('curse'));
    keyboard?.on('keydown-N', () => this.spawnBehaviorPack());
    keyboard?.on('keydown-K', () => this.unlockWeapons());
    keyboard?.on('keydown-J', () => this.levelWeapons());
    keyboard?.on('keydown-H', () => this.chests?.spawnNow(this.run.elapsedMs));
    keyboard?.on('keydown-Y', () => this.chests?.openNearest());
    keyboard?.on('keydown-U', () => this.powerups.grantNow('grave-frenzy'));
    keyboard?.on('keydown-G', () => actions.grantShield());
    keyboard?.on('keydown-F1', () => this.restartWithPreset('scythe-evolution'));
    keyboard?.on('keydown-F2', () => this.restartWithPreset('projectile-evolution'));
    keyboard?.on('keydown-F3', () => this.restartWithPreset('curse-pressure'));
    keyboard?.on('keydown-F4', () => this.restartWithPreset('boss-endgame'));
    keyboard?.on('keydown-F5', () => this.restartWithPreset('standard'));
    keyboard?.on('keydown-F6', () => this.restartWithPreset('new-weapon-lab'));
    keyboard?.on('keydown-F7', () => this.restartWithPreset('crimson-orbit-lab'));
    keyboard?.on('keydown-F8', () => actions.toggleTelemetry());
    keyboard?.on('keydown-F9', () => this.restartWithPreset('weapon-identity-lab'));
    keyboard?.on('keydown-F10', () => this.restartWithPreset('upgrade-effects-lab'));
    keyboard?.on('keydown-O', () => actions.forceLoss());
    keyboard?.on('keydown-I', () => actions.forceVictory());
    keyboard?.on('keydown-V', () => actions.triggerNamedEffect());
    keyboard?.on('keydown-F', () => actions.toggleGameplayGuides());
    keyboard?.on('keydown-R', (event: KeyboardEvent) => {
      if (event.shiftKey) actions.resetEncounter();
    });
    keyboard?.on('keydown-OPEN_BRACKET', () => this.changeGameSpeed(-1));
    keyboard?.on('keydown-CLOSED_BRACKET', () => this.changeGameSpeed(1));
    keyboard?.on('keydown-BACK_SLASH', () => this.resetGameSpeed());
  }

  update(time: number): void {
    void time;
  }

  private spawnStressPack(): void {
    const pool = ['flayed-wanderer', 'veil-stalker', 'lantern-ghost', 'limbo-knight'] as const;
    for (let index = 0; index < 200; index += 1) {
      this.enemies.spawnAroundPlayer(pool[index % pool.length]!, this.run.elapsedMs, 700 + (index % 8) * 28);
    }
  }

  private spawnBehaviorPack(): void {
    for (const id of [
      'void-caster',
      'screamer',
      'gravebound-archer',
      'veil-stalker',
      'condemned-brute',
      'sentinel-of-woe',
    ] as const) {
      this.enemies.spawnAroundPlayer(id, this.run.elapsedMs, 520);
    }
  }

  private unlockWeapons(): void {
    const weapons: WeaponId[] = [
      'ashen-longbow',
      'bloodletter-axe',
      'dirge-staff',
      'soul-bolt',
      'hellfire-sigil',
      'grave-lance',
      'cinder-reliquary',
      'wailing-shards',
      'poison-flask',
      'sanguine-needle',
    ];
    for (const weapon of weapons) {
      this.run.weapons.add(weapon);
    }
  }

  private levelWeapons(): void {
    for (const weapon of this.run.weapons.equipped) {
      const levelId = `level-${weapon}` as UpgradeId;
      const evolveId = `evolve-${weapon}` as UpgradeId;
      this.run.upgrades.apply(this.run.weapons.getState(weapon).level < EVOLUTION_READY_LEVEL ? levelId : evolveId);
    }
  }

  private restartWithPreset(id: BalancePresetId): void {
    this.scene.scene.restart({ balancePresetId: id });
  }

  private changeGameSpeed(delta: number): void {
    this.speedIndex = Phaser.Math.Clamp(this.speedIndex + delta, 0, DEBUG_SPEEDS.length - 1);
    this.actions.setGameSpeed(DEBUG_SPEEDS[this.speedIndex] ?? 1);
  }

  private resetGameSpeed(): void {
    this.speedIndex = DEBUG_SPEEDS.indexOf(1);
    this.actions.setGameSpeed(1);
  }
}
