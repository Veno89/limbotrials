import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies';
import { WEAPONS } from '../data/weapons';
import { calculateBruteCharge } from '../systems/enemyAbilityRules';
import { calculateBloodletterThrow, getBloodletterThrowAngles } from '../systems/weaponRules';
import { formatChestObjective } from '../ui/chestObjectiveRules';

describe('combat readability rules', () => {
  it('makes both elite charge profiles cover the complete telegraphed distance', () => {
    for (const id of ['condemned-brute', 'sentinel-of-woe'] as const) {
      const profile = calculateBruteCharge(ENEMIES[id].speed);
      expect((ENEMIES[id].speed * profile.speedMultiplier * profile.durationMs) / 1000).toBe(
        profile.distance,
      );
      expect(profile.distance).toBe(520);
    }
  });

  it('keeps Bloodletter outbound until its authored maximum range', () => {
    const stats = WEAPONS['bloodletter-axe'].baseStats;
    const profile = calculateBloodletterThrow(stats);

    expect((stats.projectileSpeed * profile.outboundDurationMs) / 1000).toBeCloseTo(stats.range);
    expect(profile.lifetimeMs).toBeGreaterThan(profile.outboundDurationMs * 2);
  });

  it('fans multiple Bloodletter throws symmetrically without excessive spread', () => {
    expect(getBloodletterThrowAngles(0, 1)).toEqual([0]);
    expect(getBloodletterThrowAngles(0, 3)).toEqual([-0.2, 0, 0.2]);
    expect(getBloodletterThrowAngles(1, 20).at(0)).toBeCloseTo(0.7);
    expect(getBloodletterThrowAngles(1, 20).at(-1)).toBeCloseTo(1.3);
  });

  it('formats the chest objective without a reliquary label or window copy', () => {
    const label = formatChestObjective(0, 384.4, 52100);
    expect(label).toBe('E  384  53s');
    expect(label).not.toContain('RELIQUARY');
    expect(label).not.toContain('PACES');
  });
});
