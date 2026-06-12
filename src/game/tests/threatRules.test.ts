import { describe, expect, it } from 'vitest';
import { calculateThreat, enemyThreatScaling, scaleThreatDamage } from '../systems/threatRules';

describe('threat rules', () => {
  it('uses time as the minimum threat and never lowers it for a weak build', () => {
    const threat = calculateThreat({
      elapsedMs: 9 * 60 * 1000,
      playerLevel: 1,
      weaponCount: 1,
      totalWeaponLevels: 1,
      evolvedWeaponCount: 0,
      threatPowerBonus: 0,
    });
    expect(threat.timeTier).toBe(6);
    expect(threat.powerTier).toBe(0);
    expect(threat.tier).toBe(6);
  });

  it('lets unusually strong progression push threat above the time minimum', () => {
    const threat = calculateThreat({
      elapsedMs: 3 * 60 * 1000,
      playerLevel: 24,
      weaponCount: 5,
      totalWeaponLevels: 27,
      evolvedWeaponCount: 3,
      threatPowerBonus: 0,
    });
    expect(threat.timeTier).toBe(2);
    expect(threat.powerTier).toBeGreaterThan(threat.timeTier);
    expect(threat.tier).toBe(threat.powerTier);
  });

  it('caps threat and reserves bosses for their dedicated scaling rules', () => {
    const threat = calculateThreat({
      elapsedMs: 60 * 60 * 1000,
      playerLevel: 100,
      weaponCount: 9,
      totalWeaponLevels: 63,
      evolvedWeaponCount: 9,
      threatPowerBonus: 0,
    });
    expect(threat).toMatchObject({
      tier: 10,
      healthMultiplier: 2.8,
      damageMultiplier: 1.6,
    });
    expect(enemyThreatScaling(threat, true)).toEqual({
      healthMultiplier: 1,
      damageMultiplier: 1,
    });
    expect(enemyThreatScaling(threat, false)).toEqual({
      healthMultiplier: 2.8,
      damageMultiplier: 1.6,
    });
    expect(scaleThreatDamage(13, threat.damageMultiplier)).toBe(21);
  });

  it('lets explicit progression risk increase power threat within the normal cap', () => {
    const baseline = calculateThreat({
      elapsedMs: 0,
      playerLevel: 1,
      weaponCount: 5,
      totalWeaponLevels: 10,
      evolvedWeaponCount: 0,
      threatPowerBonus: 0,
    });
    const tutelage = calculateThreat({
      elapsedMs: 0,
      playerLevel: 1,
      weaponCount: 5,
      totalWeaponLevels: 10,
      evolvedWeaponCount: 0,
      threatPowerBonus: 7,
    });

    expect(tutelage.powerTier).toBe(baseline.powerTier + 1);
    expect(tutelage.healthMultiplier).toBeGreaterThan(baseline.healthMultiplier);
  });
});
