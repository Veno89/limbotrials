import { describe, expect, it } from 'vitest';
import { BALANCE_PRESETS, getPresetReplenishCount } from '../data/balancePresets';
import { UPGRADES } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';

describe('balance presets', () => {
  it('defines focused deterministic scenarios with valid content ids', () => {
    const presets = Object.values(BALANCE_PRESETS);
    expect(presets).toHaveLength(8);
    for (const preset of presets) {
      expect(preset.elapsedMs).toBeGreaterThan(0);
      expect(preset.replenishEveryMs).toBeGreaterThan(0);
      expect(preset.spawns.length).toBeGreaterThan(0);
      expect(preset.spawns.some((spawn) => (spawn.maintainCount ?? 0) > 0)).toBe(true);
      expect(preset.weapons.every((id) => Boolean(WEAPONS[id]))).toBe(true);
      expect(preset.upgrades.every((id) => Boolean(UPGRADES[id]))).toBe(true);
    }
  });

  it('includes dedicated evolution, curse, and boss scenarios', () => {
    expect(BALANCE_PRESETS['scythe-evolution'].upgrades).toContain('evolve-bone-scythe');
    expect(BALANCE_PRESETS['curse-pressure'].upgrades).toContain('curse-blood-price');
    expect(BALANCE_PRESETS['boss-endgame'].spawns.some((spawn) => spawn.enemyId === 'limbo-warden')).toBe(true);
    expect(BALANCE_PRESETS['crimson-orbit-lab'].upgrades).toContain('evolve-bloodletter-axe');
    expect(BALANCE_PRESETS['crimson-orbit-lab'].upgrades.filter((id) => id === 'bloodletter-axe-count')).toHaveLength(2);
    expect(BALANCE_PRESETS['crimson-orbit-lab'].upgrades.indexOf('evolve-bloodletter-axe')).toBeLessThan(
      BALANCE_PRESETS['crimson-orbit-lab'].upgrades.indexOf('bloodletter-axe-count'),
    );
    expect(BALANCE_PRESETS['new-weapon-lab'].weapons).toEqual([
      'ashen-longbow',
      'bloodletter-axe',
      'dirge-staff',
      'poison-flask',
    ]);
    expect(BALANCE_PRESETS['new-weapon-lab'].upgrades).toContain('evolve-poison-flask');
    expect(BALANCE_PRESETS['weapon-identity-lab'].upgrades).toEqual(
      expect.arrayContaining([
        'bone-scythe-committed-reap',
        'wailing-shards-fractured-choir',
        'cinder-reliquary-funeral-furnace',
        'ashen-longbow-full-draw',
      ]),
    );
    expect(BALANCE_PRESETS['upgrade-effects-lab'].upgrades).toEqual(
      expect.arrayContaining([
        'soul-bolt-splintering-memory',
        'hellfire-spreading-sentence',
        'dirge-staff-echoed-rites',
        'stat-forbidden-tutelage',
      ]),
    );
  });

  it('replenishes preset groups toward their authored population', () => {
    expect(getPresetReplenishCount(20, 6, 8)).toBe(6);
    expect(getPresetReplenishCount(20, 6, 18)).toBe(2);
    expect(getPresetReplenishCount(20, 6, 20)).toBe(0);
  });
});
