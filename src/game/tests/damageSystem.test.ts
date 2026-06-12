import { describe, expect, it } from 'vitest';
import { calculateDamage } from '../systems/DamageSystem';

describe('calculateDamage', () => {
  it('applies damage and boss multipliers', () => {
    expect(
      calculateDamage({
        baseDamage: 20,
        damageMultiplier: 1.5,
        bossMultiplier: 1.2,
        targetIsBoss: true,
        critChance: 0,
        roll: 1,
      }),
    ).toEqual({ amount: 36, critical: false });
  });

  it('applies the critical multiplier on a successful roll', () => {
    expect(
      calculateDamage({
        baseDamage: 20,
        damageMultiplier: 1,
        critChance: 0.2,
        roll: 0.1,
      }),
    ).toEqual({ amount: 35, critical: true });
  });

  it('supports character and weapon critical-damage progression', () => {
    expect(
      calculateDamage({
        baseDamage: 20,
        damageMultiplier: 1,
        critChance: 1,
        critMultiplier: 2.2,
        roll: 0,
      }),
    ).toEqual({ amount: 44, critical: true });
  });
});
