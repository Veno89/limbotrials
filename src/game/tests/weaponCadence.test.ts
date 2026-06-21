import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../data/weapons';

describe('weapon cadence identities', () => {
  it('keeps Soul Bolt as the fastest low-impact targeted weapon', () => {
    const soulBolt = WEAPONS['soul-bolt'].baseStats;
    expect(soulBolt.cooldownMs).toBe(500);
    expect(soulBolt.damage).toBe(18);
    expect(soulBolt.cooldownMs).toBeLessThan(WEAPONS['ashen-longbow'].baseStats.cooldownMs);
  });

  it('makes Grave Lance a slow heavy penetrating line attack', () => {
    const lance = WEAPONS['grave-lance'].baseStats;
    expect(lance.damage).toBe(105);
    expect(lance.cooldownMs).toBe(2800);
    expect(lance.pierce).toBe(4);
    expect(lance.damage).toBeGreaterThan(WEAPONS['soul-bolt'].baseStats.damage * 5);
  });

  it('makes Hellfire Sigil and Dirge Staff deliberate high-impact casts', () => {
    const hellfire = WEAPONS['hellfire-sigil'].baseStats;
    const dirge = WEAPONS['dirge-staff'].baseStats;

    expect(hellfire).toMatchObject({ damage: 72, cooldownMs: 3000, area: 148 });
    expect(dirge).toMatchObject({ damage: 55, cooldownMs: 3000, targetCount: 2 });
    expect(dirge.damage * dirge.targetCount).toBeGreaterThan(WEAPONS['grave-lance'].baseStats.damage);
  });

  it('keeps Bone Scythe as dependable moderate close-range coverage', () => {
    expect(WEAPONS['bone-scythe'].baseStats).toMatchObject({
      damage: 46,
      cooldownMs: 1500,
      range: 150,
      area: 150,
    });
  });

  it('makes Wailing Shards a dense medium-cadence radial safety burst', () => {
    expect(WEAPONS['wailing-shards'].baseStats).toMatchObject({
      damage: 20,
      cooldownMs: 1500,
      range: 600,
      projectileSpeed: 460,
      projectileCount: 6,
    });
  });

  it('makes Cinder Reliquary a very slow large positional pulse', () => {
    const cinder = WEAPONS['cinder-reliquary'];
    expect(cinder.baseStats).toMatchObject({ damage: 58, cooldownMs: 4200, range: 230, area: 230 });
    expect(cinder.levelGrowth.some((modifier) => modifier.stat === 'cooldownMs')).toBe(false);
  });

  it('makes Ashen Longbow a deliberate fixed-count lane volley', () => {
    const longbow = WEAPONS['ashen-longbow'];
    expect(longbow.baseStats).toMatchObject({
      damage: 36,
      cooldownMs: 1900,
      range: 760,
      projectileSpeed: 720,
      projectileSize: 26,
      projectileCount: 3,
    });
    expect(longbow.levelGrowth.some((modifier) => modifier.stat === 'projectileCount')).toBe(false);
  });
});
