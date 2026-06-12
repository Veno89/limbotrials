import { describe, expect, it } from 'vitest';
import {
  getDirgeEchoEffect,
  getHellfireSpreadEffects,
  SOUL_BOLT_SPLINTERING_MEMORY,
} from '../systems/weaponUpgradeEffectRules';

describe('weapon upgrade effect rules', () => {
  it('keeps Splintering Memory bounded to two reduced-damage nearby targets', () => {
    expect(SOUL_BOLT_SPLINTERING_MEMORY).toEqual({
      targetCount: 2,
      range: 280,
      damageScale: 0.35,
    });
  });

  it('spreads Hellfire into two delayed side blasts perpendicular to the cast', () => {
    const effects = getHellfireSpreadEffects(100, 200, 100, 0);

    expect(effects).toHaveLength(2);
    expect(effects[0]).toMatchObject({ radius: 62, delayMs: 260, damageScale: 0.38 });
    expect(effects[1]).toMatchObject({ radius: 62, delayMs: 430, damageScale: 0.38 });
    expect(effects[0]?.x).toBeCloseTo(100);
    expect(effects[0]?.y).toBeCloseTo(132);
    expect(effects[1]?.x).toBeCloseTo(100);
    expect(effects[1]?.y).toBeCloseTo(268);
  });

  it('keeps Dirge echoes delayed, smaller, and reduced-damage', () => {
    expect(getDirgeEchoEffect(40, 70, 80)).toEqual({
      x: 40,
      y: 70,
      radius: 60,
      delayMs: 320,
      damageScale: 0.42,
    });
  });
});
