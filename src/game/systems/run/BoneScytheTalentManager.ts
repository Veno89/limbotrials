import { DEFAULT_BONE_SCYTHE_TALENT_PROFILE } from '../scytheRules';
import type { BoneScytheTalentProfile } from '../scytheRules';

export class BoneScytheTalentManager {
  private readonly profile: BoneScytheTalentProfile = {
    ...DEFAULT_BONE_SCYTHE_TALENT_PROFILE,
  };

  enableFullCircle(enabled: boolean): void {
    this.profile.fullCircle = enabled;
  }

  setHarvestStepsRanks(ranks: number): void {
    this.profile.harvestStepsChance = Math.max(0, ranks) * 0.05;
    this.profile.harvestStepsMoveSpeedMultiplier = 1 + Math.max(0, ranks) * 0.05;
  }

  setCrookedReachRanks(ranks: number): void {
    this.profile.crookedReachRanks = Math.max(0, ranks);
  }

  enableGraveProcession(enabled: boolean): void {
    this.profile.graveProcessionInterval = enabled ? 5 : 0;
  }

  hasFullCircle(): boolean {
    return this.profile.fullCircle;
  }

  enableFirstReaping(ranks: number): void {
    this.profile.fullHealthDamageMultiplier = ranks > 0 ? 1.6 : 1;
  }

  enableBleedConsumption(enabled: boolean): void {
    this.profile.consumeBleed = enabled;
  }

  setWakeRanks(ranks: number): void {
    this.profile.wakeDamageScale = Math.max(0, ranks) * 0.12;
  }

  setExecutionRanks(ranks: number): void {
    this.profile.executionHealthThreshold = ranks > 0 ? 0.3 : 0;
    this.profile.executionDamageMultiplier = 1 + Math.max(0, ranks) * 0.15;
  }

  getProfile(): Readonly<BoneScytheTalentProfile> {
    return { ...this.profile };
  }
}
