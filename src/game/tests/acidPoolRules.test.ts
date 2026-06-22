import { describe, expect, it } from 'vitest';
import {
  poisonFlaskImpactRadius,
  poisonFlaskPoolProfile,
  poisonFlaskTravelMs,
} from '../systems/acidPoolRules';
import { WEAPONS } from '../data/weapons';

describe('acid pool rules', () => {
  it('derives Poison Flask travel and impact values from weapon stats', () => {
    const stats = WEAPONS['poison-flask'].baseStats;

    expect(poisonFlaskTravelMs(260, stats.projectileSpeed)).toBe(500);
    expect(poisonFlaskTravelMs(10, stats.projectileSpeed)).toBe(320);
    expect(poisonFlaskTravelMs(2000, stats.projectileSpeed)).toBe(1500);
    expect(poisonFlaskImpactRadius(stats)).toBe(31);
  });

  it('makes evolved Poison Flask pools longer, stronger, and poisonous', () => {
    const stats = WEAPONS['poison-flask'].baseStats;

    expect(poisonFlaskPoolProfile(stats, false)).toMatchObject({
      radius: 92,
      durationMs: 3200,
      tickIntervalMs: 650,
      damageScale: 0.24,
      appliesPoison: false,
      poisonDamagePerTick: 2,
    });
    expect(poisonFlaskPoolProfile(stats, true)).toMatchObject({
      radius: 92,
      durationMs: 4600,
      damageScale: 0.28,
      appliesPoison: true,
    });
  });
});
