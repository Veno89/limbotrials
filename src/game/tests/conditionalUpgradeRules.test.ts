import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies';
import { conditionalDamageMultiplier, echoMarkSoulReward } from '../systems/conditionalUpgradeRules';
import type { ConditionalUpgradeEffectId } from '../types/gameTypes';

function effects(...ids: ConditionalUpgradeEffectId[]): Set<ConditionalUpgradeEffectId> {
  return new Set(ids);
}

describe('conditional upgrade rules', () => {
  it('combines movement, dash, shield, and elite-hunter damage bonuses', () => {
    const multiplier = conditionalDamageMultiplier({
      effects: effects('restless-footwork', 'fugitive-wake', 'bulwark-pyre', 'oathhunter-tithe'),
      moving: true,
      fugitiveWakeActive: true,
      shielded: true,
      target: ENEMIES['sentinel-of-woe'],
    });

    expect(multiplier).toBeCloseTo(1.1 * 1.22 * 1.24 * 1.25);
  });

  it('applies Oathhunter downside to lesser enemies', () => {
    expect(
      conditionalDamageMultiplier({
        effects: effects('oathhunter-tithe'),
        moving: false,
        fugitiveWakeActive: false,
        shielded: false,
        target: ENEMIES['lost-soul'],
      }),
    ).toBeCloseTo(0.95);
  });

  it('marks curse-gated enemies and the player Echo for bonus souls', () => {
    expect(echoMarkSoulReward(ENEMIES['wretched-runt'])).toBe(3);
    expect(echoMarkSoulReward(ENEMIES['player-echo'])).toBe(25);
    expect(echoMarkSoulReward(ENEMIES['lost-soul'])).toBe(0);
  });
});
