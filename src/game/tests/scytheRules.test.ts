import { describe, expect, it } from 'vitest';
import {
  boneScytheConditionalDamageScale,
  crookedReachDamageScale,
  crookedReachPullDistance,
  DEFAULT_BONE_SCYTHE_TALENT_PROFILE,
  isPointInScytheSweep,
  resolveBoneScytheReap,
} from '../systems/scytheRules';

describe('Bone Scythe sweep rules', () => {
  const forward = { facingAngle: 0, fullCircle: false };

  it('hits the forward 180-degree half-circle', () => {
    expect(isPointInScytheSweep(0, 0, 100, 0, 150, forward)).toBe(true);
    expect(isPointInScytheSweep(0, 0, 0, 100, 150, forward)).toBe(true);
    expect(isPointInScytheSweep(0, 0, 0, -100, 150, forward)).toBe(true);
    expect(isPointInScytheSweep(0, 0, -100, 0, 150, forward)).toBe(false);
  });

  it('still respects attack range', () => {
    expect(isPointInScytheSweep(0, 0, 151, 0, 150, forward)).toBe(false);
  });

  it('becomes a full circle when the Reaper capstone is active', () => {
    expect(isPointInScytheSweep(0, 0, -100, 0, 150, { ...forward, fullCircle: true })).toBe(true);
  });

  it('applies opener and execution bonuses only at their health thresholds', () => {
    const profile = {
      ...DEFAULT_BONE_SCYTHE_TALENT_PROFILE,
      fullHealthDamageMultiplier: 1.6,
      executionHealthThreshold: 0.3,
      executionDamageMultiplier: 1.45,
    };

    expect(boneScytheConditionalDamageScale(1, profile)).toBe(1.6);
    expect(boneScytheConditionalDamageScale(0.5, profile)).toBe(1);
    expect(boneScytheConditionalDamageScale(0.3, profile)).toBe(1.45);
  });

  it('rolls Harvest Steps once per successful reap and triggers procession every fifth reap', () => {
    const profile = {
      ...DEFAULT_BONE_SCYTHE_TALENT_PROFILE,
      harvestStepsChance: 0.15,
      graveProcessionInterval: 5,
    };

    expect(resolveBoneScytheReap(3, 12, profile, 0.1)).toMatchObject({
      reapCount: 4,
      harvestStepsTriggered: true,
      graveProcessionTriggered: false,
    });
    expect(resolveBoneScytheReap(4, 0, profile, 0.01)).toMatchObject({
      reapCount: 5,
      harvestStepsTriggered: false,
      graveProcessionTriggered: true,
    });
  });

  it('limits Crooked Reach damage and pull to the outer half of the sweep', () => {
    expect(crookedReachDamageScale(74, 150, 5)).toBe(1);
    expect(crookedReachPullDistance(74, 150, 5)).toBe(0);
    expect(crookedReachDamageScale(75, 150, 5)).toBeCloseTo(1.3);
    expect(crookedReachPullDistance(75, 150, 5)).toBe(35);
  });
});
