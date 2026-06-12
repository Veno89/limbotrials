import { describe, expect, it } from 'vitest';
import { BALANCE } from '../config/balanceConfig';
import {
  applyStatModifiers,
  applyWeaponModifiers,
  BASE_PLAYER_STATS,
} from '../utils/statModifiers';
import { WEAPONS } from '../data/weapons';

describe('shared stat modifiers', () => {
  it('applies additive and multiplicative modifiers consistently', () => {
    const stats = { ...BASE_PLAYER_STATS };
    applyStatModifiers(stats, [
      { stat: 'maxHealth', mode: 'add', value: 20 },
      { stat: 'moveSpeed', mode: 'multiply', value: 1.1 },
    ]);
    expect(stats.maxHealth).toBe(120);
    expect(stats.moveSpeed).toBeCloseTo(242);
  });

  it('applies player and weapon hard caps at the end', () => {
    const stats = { ...BASE_PLAYER_STATS };
    applyStatModifiers(stats, [
      { stat: 'critChance', mode: 'add', value: 4 },
      { stat: 'moveSpeed', mode: 'multiply', value: 8 },
      { stat: 'dashCooldown', mode: 'multiply', value: 0.01 },
      { stat: 'xpGain', mode: 'multiply', value: 8 },
      { stat: 'threatPowerBonus', mode: 'add', value: 100 },
    ]);
    expect(stats.critChance).toBe(BALANCE.maxCritChance);
    expect(stats.moveSpeed).toBe(BASE_PLAYER_STATS.moveSpeed * BALANCE.maxMoveSpeedMultiplier);
    expect(stats.dashCooldown).toBe(BASE_PLAYER_STATS.dashCooldown * (1 - BALANCE.maxCooldownReduction));
    expect(stats.xpGain).toBe(BALANCE.maxXpGainMultiplier);
    expect(stats.threatPowerBonus).toBe(BALANCE.maxThreatPowerBonus);

    const base = WEAPONS['bone-scythe'].baseStats;
    const weaponStats = { ...base };
    applyWeaponModifiers(weaponStats, [{ stat: 'area', mode: 'multiply', value: 10 }], base);
    expect(weaponStats.area).toBe(base.area * BALANCE.maxAreaMultiplier);
  });
});
