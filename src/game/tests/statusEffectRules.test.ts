import { describe, expect, it } from 'vitest';
import { STATUS_EFFECTS } from '../data/statusEffects';
import {
  applyStatusEffect,
  boneScytheBleedDamage,
  dueStatusTicks,
  fullDurationStatusDamage,
  isStatusExpired,
  statusTickDamage,
} from '../systems/statusEffectRules';

describe('status effect rules', () => {
  it('stacks and refreshes bleeding without exceeding its cap', () => {
    const bleed = STATUS_EFFECTS.bleed;
    const first = applyStatusEffect(bleed, 1000, undefined, {
      sourceWeaponId: 'bone-scythe',
      damagePerTick: 5,
    });
    const second = applyStatusEffect(bleed, 1600, first, {
      sourceWeaponId: 'bone-scythe',
      damagePerTick: 5,
    });
    const capped = applyStatusEffect(bleed, 2200, second, {
      sourceWeaponId: 'bone-scythe',
      damagePerTick: 5,
    });
    const stillCapped = applyStatusEffect(bleed, 2800, capped, {
      sourceWeaponId: 'bone-scythe',
      damagePerTick: 5,
    });

    expect(first).toMatchObject({ id: 'bleed', stacks: 1, expiresAt: 4200, nextTickAt: 1800 });
    expect(second).toMatchObject({ stacks: 2, expiresAt: 4800, nextTickAt: 1800 });
    expect(stillCapped.stacks).toBe(3);
    expect(statusTickDamage(stillCapped)).toBe(15);
  });

  it('reports due ticks and expiry from data-defined timing', () => {
    const poison = STATUS_EFFECTS.poison;
    const status = applyStatusEffect(poison, 0);

    expect(dueStatusTicks(poison, status, 999)).toBe(0);
    expect(dueStatusTicks(poison, status, 1000)).toBe(1);
    expect(dueStatusTicks(poison, status, 3050)).toBe(3);
    expect(isStatusExpired(status, 5199)).toBe(false);
    expect(isStatusExpired(status, 5200)).toBe(true);
  });

  it('derives Bone Scythe bleed from weapon damage without falling below the floor', () => {
    expect(boneScytheBleedDamage(36)).toBe(4);
    expect(boneScytheBleedDamage(10)).toBe(2);
  });

  it('calculates the full-duration damage consumed from a status', () => {
    const bleed = STATUS_EFFECTS.bleed;
    const status = applyStatusEffect(bleed, 0, undefined, { damagePerTick: 10 });

    expect(fullDurationStatusDamage(bleed, status)).toBe(40);
  });
});
