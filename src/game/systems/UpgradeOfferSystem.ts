import Phaser from 'phaser';
import type { UpgradeDefinition, UpgradeId, UpgradeOfferKind } from '../types/gameTypes';
import type { RunState } from './RunState';
import { selectCurseChoices, selectUpgradeChoices } from './UpgradeSystem';

const OFFER_COPY: Record<UpgradeOfferKind, { title: string; subtitle: string; canSkip: boolean }> = {
  standard: {
    title: 'CHOOSE YOUR POWER',
    subtitle: 'Power always remembers its price.',
    canSkip: true,
  },
  curse: {
    title: 'ACCEPT A CURSE',
    subtitle: 'Limbo offers strength with teeth.',
    canSkip: false,
  },
};

export class UpgradeOfferSystem {
  private active = false;
  private readonly queued: UpgradeOfferKind[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly onApplied: (id: UpgradeId) => void,
    private readonly onSkipped: (souls: number) => void,
  ) {}

  request(kind: UpgradeOfferKind): void {
    if (this.active) {
      this.queued.push(kind);
      return;
    }
    this.open(kind);
  }

  private open(kind: UpgradeOfferKind): void {
    const choices = this.select(kind);
    if (choices.length === 0) {
      this.finish();
      return;
    }
    this.active = true;
    this.run.balance.recordOffer(
      kind,
      choices.map((choice) => choice.id),
      this.run.elapsedMs,
    );
    this.scene.scene.pause();
    const copy = OFFER_COPY[kind];
    this.scene.scene.launch('UpgradeScene', {
      run: this.run,
      choices,
      stacks: this.run.upgradeStacks,
      weaponLevels: this.run.getWeaponLevels(),
      weaponCount: this.run.weapons.size,
      weaponCap: this.run.getWeaponCap(),
      title: copy.title,
      subtitle: copy.subtitle,
      rerolls: this.run.rerolls,
      canSkip: copy.canSkip,
      onChoose: (id: UpgradeId) => {
        if (this.run.applyUpgrade(id)) {
          this.run.balance.recordChoice(kind, 'selected', this.run.elapsedMs, id);
          this.onApplied(id);
        }
        this.finish();
      },
      onReroll: () => {
        if (!this.run.useReroll()) {
          return undefined;
        }
        this.run.balance.recordChoice(kind, 'rerolled', this.run.elapsedMs);
        const rerolled = this.select(kind);
        this.run.balance.recordOffer(
          kind,
          rerolled.map((choice) => choice.id),
          this.run.elapsedMs,
        );
        return { choices: rerolled, rerolls: this.run.rerolls };
      },
      onSkip: () => {
        if (copy.canSkip) {
          this.run.balance.recordChoice(kind, 'skipped', this.run.elapsedMs);
          this.onSkipped(this.run.claimSkipReward());
        }
        this.finish();
      },
    });
  }

  private select(kind: UpgradeOfferKind): UpgradeDefinition[] {
    const context = {
      stacks: this.run.upgradeStacks,
      equippedWeapons: this.run.weapons,
      weaponLevels: this.run.getWeaponLevels(),
      playerLevel: this.run.level,
      weaponCap: this.run.getWeaponCap(),
    };
    return kind === 'curse' ? selectCurseChoices(context) : selectUpgradeChoices(context);
  }

  private finish(): void {
    this.scene.scene.stop('UpgradeScene');
    this.active = false;
    const next = this.queued.shift();
    if (next) {
      this.open(next);
    } else {
      this.scene.scene.resume();
    }
  }
}
