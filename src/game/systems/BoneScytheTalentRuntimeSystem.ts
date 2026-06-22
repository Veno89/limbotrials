import type { ActiveBuffStatus } from './PowerupSystem';
import type { JuiceSystem } from './JuiceSystem';
import {
  resolveBoneScytheReap,
  type BoneScytheTalentProfile,
} from './scytheRules';

const HARVEST_STEPS_DURATION_MS = 3000;

export interface BoneScytheReapOutcome {
  graveProcessionTriggered: boolean;
}

export class BoneScytheTalentRuntimeSystem {
  private reapCount = 0;
  private harvestStepsUntil = 0;
  private harvestStepsMultiplier = 1;

  constructor(
    private readonly getTime: () => number,
    private readonly juice: JuiceSystem,
    private readonly playerPosition: () => { x: number; y: number },
    private readonly random: () => number = Math.random,
  ) {}

  recordReap(hitCount: number, profile: BoneScytheTalentProfile): BoneScytheReapOutcome {
    const resolution = resolveBoneScytheReap(this.reapCount, hitCount, profile, this.random());
    this.reapCount = resolution.reapCount;
    if (resolution.harvestStepsTriggered) {
      this.harvestStepsUntil = this.getTime() + HARVEST_STEPS_DURATION_MS;
      this.harvestStepsMultiplier = profile.harvestStepsMoveSpeedMultiplier;
      const position = this.playerPosition();
      this.juice.ring(position.x, position.y, 54, 0xaed8c5, 240);
    }
    return { graveProcessionTriggered: resolution.graveProcessionTriggered };
  }

  moveSpeedMultiplier(): number {
    return this.getTime() < this.harvestStepsUntil ? this.harvestStepsMultiplier : 1;
  }

  getActiveBuffs(): ActiveBuffStatus[] {
    const remainingMs = this.harvestStepsUntil - this.getTime();
    return remainingMs > 0
      ? [{
          id: 'talent-harvest-steps',
          label: 'HARVEST STEPS',
          color: 0xaed8c5,
          remainingMs,
          durationMs: HARVEST_STEPS_DURATION_MS,
        }]
      : [];
  }
}
