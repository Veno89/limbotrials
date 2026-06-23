import Phaser from 'phaser';
import type { BalancePresetId, WeaponId } from '../types/gameTypes';
import { BalanceDebugOverlay } from '../ui/BalanceDebugOverlay';
import type { EnemySystem } from './EnemySystem';
import type { RunState } from './RunState';
import type { UpgradeOfferSystem } from './UpgradeOfferSystem';
import type { ChestSystem } from './ChestSystem';
import { EVOLUTION_READY_LEVEL } from '../types/gameTypes';
import type { PowerupSystem } from './PowerupSystem';

export class DebugControlsSystem {
  private readonly overlay: BalanceDebugOverlay;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly enemies: EnemySystem,
    offers: UpgradeOfferSystem,
    private readonly chests: ChestSystem | undefined,
    private readonly powerups: PowerupSystem,
    onGrantShield: () => void,
    onEndRun: () => void,
  ) {
    this.overlay = new BalanceDebugOverlay(scene, run, enemies);
    const keyboard = scene.input.keyboard;
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
    keyboard?.on('keydown-G', onGrantShield);
    keyboard?.on('keydown-F1', () => this.restartWithPreset('scythe-evolution'));
    keyboard?.on('keydown-F2', () => this.restartWithPreset('projectile-evolution'));
    keyboard?.on('keydown-F3', () => this.restartWithPreset('curse-pressure'));
    keyboard?.on('keydown-F4', () => this.restartWithPreset('boss-endgame'));
    keyboard?.on('keydown-F5', () => this.restartWithPreset('standard'));
    keyboard?.on('keydown-F6', () => this.restartWithPreset('new-weapon-lab'));
    keyboard?.on('keydown-F7', () => this.restartWithPreset('crimson-orbit-lab'));
    keyboard?.on('keydown-F8', () => this.overlay.toggle());
    keyboard?.on('keydown-F9', () => this.restartWithPreset('weapon-identity-lab'));
    keyboard?.on('keydown-F10', () => this.restartWithPreset('upgrade-effects-lab'));
    keyboard?.on('keydown-O', onEndRun);
  }

  update(time: number): void {
    this.overlay.update(time);
  }

  private spawnStressPack(): void {
    const pool = ['flayed-wanderer', 'veil-stalker', 'lantern-ghost', 'hollow-knight'] as const;
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
    const progression = {
      'bone-scythe': ['level-bone-scythe', 'evolve-bone-scythe'],
      'soul-bolt': ['level-soul-bolt', 'evolve-soul-bolt'],
      'hellfire-sigil': ['level-hellfire-sigil', 'evolve-hellfire-sigil'],
      'grave-lance': ['level-grave-lance', 'evolve-grave-lance'],
      'wailing-shards': ['level-wailing-shards', 'evolve-wailing-shards'],
      'cinder-reliquary': ['level-cinder-reliquary', 'evolve-cinder-reliquary'],
      'ashen-longbow': ['level-ashen-longbow', 'evolve-ashen-longbow'],
      'bloodletter-axe': ['level-bloodletter-axe', 'evolve-bloodletter-axe'],
      'dirge-staff': ['level-dirge-staff', 'evolve-dirge-staff'],
      'poison-flask': ['level-poison-flask', 'evolve-poison-flask'],
      'sanguine-needle': ['level-sanguine-needle', 'evolve-sanguine-needle'],
      'spectral-chains': ['level-spectral-chains', 'evolve-spectral-chains'],
    } as const;
    for (const weapon of this.run.weapons.equipped) {
      const [level, evolution] = progression[weapon];
      this.run.upgrades.apply(this.run.weapons.getState(weapon).level < EVOLUTION_READY_LEVEL ? level : evolution);
    }
  }

  private restartWithPreset(id: BalancePresetId): void {
    this.scene.scene.restart({ balancePresetId: id });
  }
}
