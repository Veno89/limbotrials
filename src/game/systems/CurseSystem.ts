import { curseSnapshot, getCrossedCurseTiers } from '../data/curse';
import type { CurseGainResult, CurseSnapshot, CurseTierId } from '../types/gameTypes';

export class CurseSystem {
  private curseLevel = 0;
  private totalCurseGained = 0;
  private readonly crossedTiers = new Set<CurseTierId>(['unmarked']);

  gain(amount: number, reason: string): CurseGainResult | undefined {
    const gained = Math.max(0, Math.round(amount));
    if (gained <= 0) {
      return undefined;
    }
    const previous = this.snapshot();
    this.curseLevel += gained;
    this.totalCurseGained += gained;
    const crossedTiers = getCrossedCurseTiers(previous.level, this.curseLevel);
    for (const tier of crossedTiers) {
      this.crossedTiers.add(tier.id);
    }
    return {
      amount: gained,
      reason,
      previous,
      current: this.snapshot(),
      crossedTiers,
    };
  }

  snapshot(): CurseSnapshot {
    return curseSnapshot(this.curseLevel, this.totalCurseGained, this.crossedTiers);
  }
}
