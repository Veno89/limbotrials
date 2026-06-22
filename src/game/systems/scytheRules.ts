export interface ScytheSweepProfile {
  facingAngle: number;
  fullCircle: boolean;
}

export interface BoneScytheTalentProfile {
  fullCircle: boolean;
  harvestStepsChance: number;
  harvestStepsMoveSpeedMultiplier: number;
  crookedReachRanks: number;
  graveProcessionInterval: number;
  fullHealthDamageMultiplier: number;
  consumeBleed: boolean;
  wakeDamageScale: number;
  executionHealthThreshold: number;
  executionDamageMultiplier: number;
}

export const DEFAULT_BONE_SCYTHE_TALENT_PROFILE: BoneScytheTalentProfile = {
  fullCircle: false,
  harvestStepsChance: 0,
  harvestStepsMoveSpeedMultiplier: 1,
  crookedReachRanks: 0,
  graveProcessionInterval: 0,
  fullHealthDamageMultiplier: 1,
  consumeBleed: false,
  wakeDamageScale: 0,
  executionHealthThreshold: 0,
  executionDamageMultiplier: 1,
};

export interface BoneScytheReapResolution {
  reapCount: number;
  harvestStepsTriggered: boolean;
  graveProcessionTriggered: boolean;
}

export function resolveBoneScytheReap(
  previousReapCount: number,
  hitCount: number,
  profile: BoneScytheTalentProfile,
  chanceRoll: number,
): BoneScytheReapResolution {
  const reapCount = previousReapCount + 1;
  return {
    reapCount,
    harvestStepsTriggered: hitCount > 0 && chanceRoll < profile.harvestStepsChance,
    graveProcessionTriggered:
      profile.graveProcessionInterval > 0 && reapCount % profile.graveProcessionInterval === 0,
  };
}

export function crookedReachDamageScale(
  distanceFromSource: number,
  radius: number,
  ranks: number,
): number {
  return ranks > 0 && distanceFromSource >= radius * 0.5 ? 1 + ranks * 0.06 : 1;
}

export function crookedReachPullDistance(
  distanceFromSource: number,
  radius: number,
  ranks: number,
): number {
  return ranks > 0 && distanceFromSource >= radius * 0.5 ? ranks * 7 : 0;
}

export function boneScytheConditionalDamageScale(
  healthRatio: number,
  profile: BoneScytheTalentProfile,
): number {
  let scale = 1;
  if (healthRatio >= 1) {
    scale *= profile.fullHealthDamageMultiplier;
  }
  if (healthRatio <= profile.executionHealthThreshold) {
    scale *= profile.executionDamageMultiplier;
  }
  return scale;
}

export function isPointInScytheSweep(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  radius: number,
  profile: ScytheSweepProfile,
  targetPadding = 0,
): boolean {
  const offsetX = targetX - sourceX;
  const offsetY = targetY - sourceY;
  if (Math.hypot(offsetX, offsetY) > radius + targetPadding) {
    return false;
  }
  if (profile.fullCircle || (offsetX === 0 && offsetY === 0)) {
    return true;
  }
  const targetAngle = Math.atan2(offsetY, offsetX);
  const delta = Math.atan2(
    Math.sin(targetAngle - profile.facingAngle),
    Math.cos(targetAngle - profile.facingAngle),
  );
  return Math.abs(delta) <= Math.PI / 2;
}
