import Phaser from 'phaser';
import type { AppliedRewardResult, UpgradeDefinition, UpgradeOfferKind } from '../types/gameTypes';
import type { RunState } from './RunState';
import { selectCurseChoices, selectUpgradeChoices } from './UpgradeSystem';
import { mutateUpgradeChoices } from './CursedRewardMutationSystem';

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
    private readonly onApplied: (choice: UpgradeDefinition, result: AppliedRewardResult) => void,
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
      stacks: this.run.upgrades.stacks,
      weaponLevels: this.run.weapons.getLevels(),
      weaponCount: this.run.weapons.equipped.size,
      weaponCap: this.run.weapons.cap,
      title: copy.title,
      subtitle: copy.subtitle,
      rerolls: this.run.resources.rerolls,
      canSkip: copy.canSkip,
      onChoose: (choice: UpgradeDefinition) => {
        const result = this.run.upgrades.applyChoice(choice);
        if (result.applied) {
          this.run.balance.recordChoice(kind, 'selected', this.run.elapsedMs, choice.id);
          this.onApplied(choice, result);
        }
        this.finish();
      },
      onReroll: () => {
        if (!this.run.resources.useReroll()) {
          return undefined;
        }
        this.run.balance.recordChoice(kind, 'rerolled', this.run.elapsedMs);
        const rerolled = this.select(kind);
        this.run.balance.recordOffer(
          kind,
          rerolled.map((choice) => choice.id),
          this.run.elapsedMs,
        );
        return { choices: rerolled, rerolls: this.run.resources.rerolls };
      },
      onSkip: () => {
        if (copy.canSkip) {
          this.run.balance.recordChoice(kind, 'skipped', this.run.elapsedMs);
          this.onSkipped(this.run.resources.claimSkipReward());
        }
        this.finish();
      },
    });
  }

  private select(kind: UpgradeOfferKind): UpgradeDefinition[] {
    const context = {
      stacks: this.run.upgrades.stacks,
      equippedWeapons: this.run.weapons.equipped,
      weaponLevels: this.run.weapons.getLevels(),
      playerLevel: this.run.resources.level,
      shieldSource: this.run.stats.current.shieldInterval > 0 || this.run.resources.shield > 0,
      curseLevel: this.run.curse.snapshot().level,
      weaponCap: this.run.weapons.cap,
    };
    const count = kind === 'standard' ? this.run.upgrades.getChoiceCount() : 3;
    const choices =
      kind === 'curse'
        ? selectCurseChoices(context, Math.random, count)
        : selectUpgradeChoices(context, Math.random, count);
    return mutateUpgradeChoices(choices, this.run.curse.snapshot(), kind);
  }

  private finish(): void {
    this.scene.scene.stop('UpgradeScene');
    this.active = false;
    const next = this.queued.shift();
    if (next && this.scene.scene.isActive()) {
      this.open(next);
    } else if (this.scene.scene.isPaused()) {
      this.scene.scene.resume();
    }
  }
}
