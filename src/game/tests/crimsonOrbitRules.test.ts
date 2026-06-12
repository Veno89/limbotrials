import { describe, expect, it } from 'vitest';
import { BALANCE } from '../config/balanceConfig';
import { WEAPONS } from '../data/weapons';
import { calculateCrimsonOrbit } from '../systems/crimsonOrbitRules';

describe('Crimson Orbit rules', () => {
  it('creates a three-axe baseline with stronger bounded coverage', () => {
    const profile = calculateCrimsonOrbit(WEAPONS['bloodletter-axe'].baseStats);

    expect(profile.axeCount).toBe(3);
    expect(profile.radius).toBeGreaterThanOrEqual(160);
    expect(profile.radius).toBeLessThanOrEqual(BALANCE.maxCrimsonOrbitRadius);
    expect(profile.axeSize).toBeLessThanOrEqual(BALANCE.maxCrimsonOrbitAxeSize);
    expect(profile.collisionRadius).toBe(profile.axeSize * 0.5);
    expect(profile.hitCooldownMs).toBeGreaterThanOrEqual(BALANCE.minCrimsonOrbitHitCooldownMs);
    expect(profile.damageScale).toBeLessThan(1);
  });

  it('makes size and haste meaningful while respecting hard caps', () => {
    const base = WEAPONS['bloodletter-axe'].baseStats;
    const normal = calculateCrimsonOrbit(base);
    const improved = calculateCrimsonOrbit({
      ...base,
      cooldownMs: base.cooldownMs * 0.5,
      projectileSize: base.projectileSize * 3,
      projectileCount: 20,
    });

    expect(improved.angularSpeed).toBeGreaterThan(normal.angularSpeed);
    expect(improved.hitCooldownMs).toBeLessThan(normal.hitCooldownMs);
    expect(improved.axeSize).toBe(BALANCE.maxCrimsonOrbitAxeSize);
    expect(improved.radius).toBeLessThanOrEqual(BALANCE.maxCrimsonOrbitRadius);
    expect(improved.axeCount).toBe(BALANCE.maxCrimsonOrbitAxes);
  });

  it('turns projectile-count investment into additional axes and wider coverage', () => {
    const base = WEAPONS['bloodletter-axe'].baseStats;
    const normal = calculateCrimsonOrbit(base);
    const procession = calculateCrimsonOrbit({ ...base, projectileCount: base.projectileCount + 2 });

    expect(procession.axeCount).toBe(5);
    expect(procession.radius).toBeGreaterThan(normal.radius);
  });

  it('responds to global attack speed without exceeding its readability bounds', () => {
    const base = WEAPONS['bloodletter-axe'].baseStats;
    const normal = calculateCrimsonOrbit(base);
    const quickened = calculateCrimsonOrbit(base, 2.5);

    expect(quickened.angularSpeed).toBeGreaterThan(normal.angularSpeed);
    expect(quickened.angularSpeed).toBeLessThanOrEqual(0.0038);
    expect(quickened.hitCooldownMs).toBeLessThan(normal.hitCooldownMs);
    expect(quickened.hitCooldownMs).toBeGreaterThanOrEqual(BALANCE.minCrimsonOrbitHitCooldownMs);
  });
});
